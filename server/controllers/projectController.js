import Project from '../models/Project.js';
import ActivityLog from '../models/ActivityLog.js';
import User from '../models/User.js';

// GET /api/projects — get projects relevant to the current user
export const getProjects = async (req, res, next) => {
  try {
    const user = req.user;
    let filter = {};

    switch (user.role) {
      case 'admin':
        // Admin sees all projects
        break;
      case 'recruiter':
        filter.recruiterId = user._id;
        break;
      case 'projectManager':
        filter.pmId = user._id;
        break;
      case 'freelancer':
      case 'agency':
        filter.freelancerOrAgencyId = user._id;
        break;
      default:
        filter._id = null; // Return nothing for unknown roles
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const projects = await Project.find(filter)
      .populate('recruiterId', 'name avatar email')
      .populate('pmId', 'name avatar')
      .populate('freelancerOrAgencyId', 'name avatar role')
      .populate('inviteId', 'projectTitle message')
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    next(error);
  }
};

// GET /api/projects/:id — get project detail
export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('recruiterId', 'name avatar email rating')
      .populate('pmId', 'name avatar email')
      .populate('freelancerOrAgencyId', 'name avatar role email')
      .populate('inviteId', 'projectTitle message status');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access: admin, recruiter, PM, or assigned freelancer/agency
    const userId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isRecruiter = project.recruiterId?._id?.toString() === userId;
    const isPM = project.pmId?._id?.toString() === userId;
    const isWorker = project.freelancerOrAgencyId?._id?.toString() === userId;

    if (!isAdmin && !isRecruiter && !isPM && !isWorker) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ project });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/projects/:id/assign-pm — recruiter assigns a PM to their project
export const assignPM = async (req, res, next) => {
  try {
    const { pmId } = req.body;
    if (!pmId) {
      return res.status(400).json({ message: 'pmId is required' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only the recruiter who owns the project can assign a PM
    if (String(project.recruiterId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the project recruiter can assign a PM' });
    }

    // Verify the PM exists and has PM role
    const pm = await User.findById(pmId);
    if (!pm) {
      return res.status(404).json({ message: 'PM user not found' });
    }
    if (pm.role !== 'projectManager') {
      return res.status(400).json({ message: 'Selected user is not a Project Manager' });
    }

    project.pmId = pmId;
    project.handedOff = true;
    await project.save();

    // Log the handoff
    await ActivityLog.create({
      action: 'project.pm_assigned',
      performedBy: req.user._id,
      targetType: 'Project',
      targetId: project._id,
      meta: { pmName: pm.name, projectTitle: project.title },
    });

    // Re-fetch populated
    const updated = await Project.findById(project._id)
      .populate('recruiterId', 'name avatar email')
      .populate('pmId', 'name avatar email')
      .populate('freelancerOrAgencyId', 'name avatar role');

    res.json({ message: 'PM assigned successfully', project: updated });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/projects/:id/status — PM updates project status
export const updateProjectStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'on-hold', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Status must be active, on-hold, or cancelled' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Admins can do anything. Otherwise check PM or Recruiter logic.
    const isAdmin = String(req.user.role) === 'admin';
    const isPM = String(project.pmId) === String(req.user._id);
    const isRecruiter = String(project.recruiterId) === String(req.user._id);

    if (status === 'cancelled') {
        if (!isAdmin && !isRecruiter) {
            return res.status(403).json({ message: 'Only Recruiters or Admins can cancel a project' });
        }
    } else {
        // active or on-hold
        if (!isAdmin && !isPM) {
            return res.status(403).json({ message: 'Only the assigned PM can put a project on hold or active' });
        }
    }

    if (project.status === 'completed' || project.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot change status of a completed or cancelled project' });
    }

    project.status = status;
    await project.save();

    // Log it
    await ActivityLog.create({
      action: `project.status_${status}`,
      performedBy: req.user._id,
      targetType: 'Project',
      targetId: project._id,
      meta: { projectTitle: project.title, newStatus: status },
    });

    res.json({ message: `Project status updated to ${status}`, project });
  } catch (error) {
    next(error);
  }
};
