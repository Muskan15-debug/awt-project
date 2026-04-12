import Task from '../models/Task.js';
import Milestone from '../models/Milestone.js';
import Project from '../models/Project.js';
import Agency from '../models/Agency.js';
import ActivityLog from '../models/ActivityLog.js';

// POST /api/tasks — PM creates task in a milestone
export const createTask = async (req, res, next) => {
  try {
    const { milestoneId, projectId, assignedToId, title, description } = req.body;

    if (!milestoneId || !projectId || !title) {
      return res.status(400).json({ message: 'milestoneId, projectId, and title are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only PM of this project can create tasks
    if (String(project.pmId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the assigned PM can create tasks' });
    }

    const milestone = await Milestone.findOne({ _id: milestoneId, projectId });
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found in this project' });
    }

    const task = await Task.create({
      milestoneId,
      projectId,
      assignedToId: assignedToId || undefined,
      title,
      description: description || undefined,
    });

    res.status(201).json({ message: 'Task created', task });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/project/:projectId — get all tasks for a project
export const getTasksByProject = async (req, res, next) => {
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

    const tasks = await Task.find({ projectId })
      .populate('assignedToId', 'name avatar')
      .populate('milestoneId', 'title status')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

// GET /api/tasks/my — freelancer gets their assigned tasks across all projects
export const getMyTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ assignedToId: req.user._id })
      .populate('milestoneId', 'title status')
      .populate('projectId', 'title status')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id/status — freelancer updates to in-progress
export const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['in-progress'].includes(status)) {
      return res.status(400).json({ message: 'Can only update status to in-progress via this endpoint' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only assignee can move to in-progress
    if (String(task.assignedToId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the assigned user can update task status' });
    }

    if (task.status !== 'todo' && task.status !== 'revision-requested') {
      return res.status(400).json({ message: `Cannot move to in-progress from ${task.status}` });
    }

    task.status = status;
    await task.save();

    res.json({ message: 'Task status updated', task });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id/submit — freelancer submits task
export const submitTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { submissionNote, submissionFileUrl } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only assignee can submit
    if (String(task.assignedToId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the assigned user can submit this task' });
    }

    if (task.status !== 'in-progress') {
      return res.status(400).json({ message: 'Task must be in-progress to submit' });
    }

    task.status = 'submitted';
    if (submissionNote) task.submissionNote = submissionNote;
    if (submissionFileUrl) task.submissionFileUrl = submissionFileUrl;
    await task.save();

    await ActivityLog.create({
      action: 'task.submitted',
      performedBy: req.user._id,
      targetType: 'Task',
      targetId: task._id,
      meta: { taskTitle: task.title, projectId: task.projectId },
    });

    res.json({ message: 'Task submitted', task });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id/approve — PM approves or requests revision
export const approveTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'revision-requested'

    if (!['approved', 'revision-requested'].includes(status)) {
      return res.status(400).json({ message: 'status must be approved or revision-requested' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only PM can approve/reject
    if (String(project.pmId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the assigned PM can approve or request revision' });
    }

    if (task.status !== 'submitted') {
      return res.status(400).json({ message: 'Task must be submitted to approve or request revision' });
    }

    task.status = status;
    await task.save();

    await ActivityLog.create({
      action: `task.${status}`,
      performedBy: req.user._id,
      targetType: 'Task',
      targetId: task._id,
      meta: { taskTitle: task.title, projectId: project._id },
    });

    res.json({ message: `Task ${status}`, task });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/tasks/:id/reassign — agency owner reassigns to member
export const reassignTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;

    if (!assignedToId) {
      return res.status(400).json({ message: 'assignedToId is required' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const project = await Project.findById(task.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only the agency owner (the freelancerOrAgencyId on the project) can reassign
    if (project.receiverType !== 'agency') {
      return res.status(400).json({ message: 'Task reassignment is only available for agency projects' });
    }

    if (String(project.freelancerOrAgencyId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the agency owner can reassign tasks' });
    }

    // Verify the target user is a member of the agency
    const agency = await Agency.findOne({ owner: req.user._id });
    if (!agency) {
      return res.status(404).json({ message: 'Agency not found' });
    }

    const isMember = agency.members.some(
      m => String(m.user) === String(assignedToId) && m.status === 'active'
    );

    if (!isMember && String(assignedToId) !== String(req.user._id)) {
      return res.status(400).json({ message: 'Target user is not an active member of your agency' });
    }

    task.assignedToId = assignedToId;
    await task.save();

    res.json({ message: 'Task reassigned', task });
  } catch (error) {
    next(error);
  }
};
