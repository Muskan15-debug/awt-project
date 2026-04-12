import Payment from '../models/Payment.js';
import Project from '../models/Project.js';

// GET /api/payments/earnings — freelancer/agency sees their payments
export const getEarnings = async (req, res, next) => {
  try {
    // Find all projects where this user is the freelancer/agency
    const projects = await Project.find({ freelancerOrAgencyId: req.user._id });
    const projectIds = projects.map(p => p._id);

    const payments = await Payment.find({ projectId: { $in: projectIds } })
      .populate('milestoneId', 'title status')
      .populate('projectId', 'title status')
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (error) {
    next(error);
  }
};

// GET /api/payments/project/:projectId — get payments for a project
export const getPaymentsByProject = async (req, res, next) => {
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

    const payments = await Payment.find({ projectId })
      .populate('milestoneId', 'title status')
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (error) {
    next(error);
  }
};
