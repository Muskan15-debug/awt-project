import Dispute from '../models/Dispute.js';
import Project from '../models/Project.js';
import Payment from '../models/Payment.js';

// POST /api/disputes — create dispute
export const createDispute = async (req, res, next) => {
  try {
    const { projectId, reason } = req.body;

    if (!projectId || !reason) {
      return res.status(400).json({ message: 'projectId and reason are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check that the user is a party to the project
    const userId = req.user._id.toString();
    const isPM = String(project.pmId) === userId;
    const isWorker = String(project.freelancerOrAgencyId) === userId;
    const isRecruiter = String(project.recruiterId) === userId;

    if (!isPM && !isWorker && !isRecruiter) {
      return res.status(403).json({ message: 'Only project participants can raise disputes' });
    }

    if (project.status === 'completed' || project.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot dispute a completed or cancelled project' });
    }

    const dispute = await Dispute.create({
      projectId,
      raisedById: req.user._id,
      reason,
    });

    // Set project status to disputed
    project.status = 'disputed';
    await project.save();

    res.status(201).json({ message: 'Dispute created', dispute });
  } catch (error) {
    next(error);
  }
};

// GET /api/disputes — get disputes (user sees own, admin sees all)
export const getDisputes = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    let filter = {};

    if (!isAdmin) {
      // Find projects the user is part of
      const projects = await Project.find({
        $or: [
          { recruiterId: req.user._id },
          { pmId: req.user._id },
          { freelancerOrAgencyId: req.user._id },
        ],
      });
      const projectIds = projects.map(p => p._id);
      filter = { projectId: { $in: projectIds } };
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const disputes = await Dispute.find(filter)
      .populate('projectId', 'title status')
      .populate('raisedById', 'name avatar role')
      .sort({ createdAt: -1 });

    res.json({ disputes });
  } catch (error) {
    next(error);
  }
};

// GET /api/disputes/:id — get single dispute
export const getDispute = async (req, res, next) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
      .populate('projectId', 'title status recruiterId pmId freelancerOrAgencyId')
      .populate('raisedById', 'name avatar email role');

    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    // Check access
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      const project = await Project.findById(dispute.projectId._id || dispute.projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      const userId = req.user._id.toString();
      const isParty =
        String(project.recruiterId) === userId ||
        String(project.pmId) === userId ||
        String(project.freelancerOrAgencyId) === userId;
      if (!isParty) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ dispute });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/disputes/:id/resolve — admin resolves dispute
export const resolveDispute = async (req, res, next) => {
  try {
    const { resolution, adminNote } = req.body;

    if (!resolution || !['refund', 'release', 'split'].includes(resolution)) {
      return res.status(400).json({ message: 'resolution must be refund, release, or split' });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    if (dispute.status === 'resolved') {
      return res.status(400).json({ message: 'Dispute is already resolved' });
    }

    dispute.status = 'resolved';
    dispute.resolution = resolution;
    if (adminNote) dispute.adminNote = adminNote;
    await dispute.save();

    // Update payments based on resolution
    const payments = await Payment.find({ projectId: dispute.projectId, status: 'held' });

    if (resolution === 'refund') {
      // Refund all held payments
      await Payment.updateMany(
        { projectId: dispute.projectId, status: 'held' },
        { status: 'refunded' }
      );
    } else if (resolution === 'release') {
      // Release all held payments
      await Payment.updateMany(
        { projectId: dispute.projectId, status: 'held' },
        { status: 'released' }
      );
    } else if (resolution === 'split') {
      // For split: mark half as released, half as refunded
      // Simple approach: alternate between released and refunded
      for (let i = 0; i < payments.length; i++) {
        payments[i].status = i % 2 === 0 ? 'released' : 'refunded';
        await payments[i].save();
      }
    }

    res.json({ message: 'Dispute resolved', dispute });
  } catch (error) {
    next(error);
  }
};
