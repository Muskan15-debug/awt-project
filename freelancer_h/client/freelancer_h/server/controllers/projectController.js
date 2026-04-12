import Project from '../models/Project.js';

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
