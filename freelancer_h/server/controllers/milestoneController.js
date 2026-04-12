import Milestone from '../models/Milestone.js';
import Payment from '../models/Payment.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import ActivityLog from '../models/ActivityLog.js';

// POST /api/milestones/project/:projectId — PM creates milestone
export const createMilestone = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, dueDate, amount } = req.body;

    if (!title || amount === undefined) {
      return res.status(400).json({ message: 'title and amount are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only PM of this project can create milestones
    if (String(project.pmId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the assigned PM can create milestones' });
    }

    if (project.status !== 'active') {
      return res.status(400).json({ message: 'Project is not active' });
    }

    const milestone = await Milestone.create({
      projectId,
      title,
      dueDate: dueDate || undefined,
      amount,
    });

    // Auto-create Payment with status 'held'
    await Payment.create({
      milestoneId: milestone._id,
      projectId,
      amount,
      status: 'held',
    });

    res.status(201).json({ message: 'Milestone created', milestone });
  } catch (error) {
    next(error);
  }
};

// GET /api/milestones/project/:projectId — get milestones for a project
export const getMilestones = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isRecruiter = String(project.recruiterId) === userId;
    const isPM = String(project.pmId) === userId;
    const isWorker = String(project.freelancerOrAgencyId) === userId;

    if (!isAdmin && !isRecruiter && !isPM && !isWorker) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const milestones = await Milestone.find({ projectId }).sort({ createdAt: 1 });
    res.json({ milestones });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/milestones/:id/status — PM approves/rejects milestone
export const updateMilestoneStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'in-progress', 'submitted', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const milestone = await Milestone.findById(id);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }

    const project = await Project.findById(milestone.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only PM can change milestone status
    if (String(project.pmId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the assigned PM can update milestone status' });
    }

    milestone.status = status;
    await milestone.save();

    // Log the status change
    await ActivityLog.create({
      action: `milestone.${status}`,
      performedBy: req.user._id,
      targetType: 'Milestone',
      targetId: milestone._id,
      meta: { milestoneTitle: milestone.title, projectId: project._id, newStatus: status },
    });

    // When milestone is approved, release the held payment
    if (status === 'approved') {
      await Payment.findOneAndUpdate(
        { milestoneId: milestone._id, status: 'held' },
        { status: 'released' }
      );

      // Check if all milestones for project are approved
      const allMilestones = await Milestone.find({ projectId: project._id });
      const allApproved = allMilestones.every(m => m.status === 'approved');

      if (allApproved && allMilestones.length > 0) {
        project.status = 'completed';
        await project.save();
      }
    }

    res.json({ message: `Milestone status updated to ${status}`, milestone });
  } catch (error) {
    next(error);
  }
};
