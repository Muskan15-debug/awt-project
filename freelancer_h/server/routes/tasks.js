import { Router } from 'express';
import {
  createTask,
  getTasksByProject,
  getMyTasks,
  updateTaskStatus,
  submitTask,
  approveTask,
  reassignTask,
} from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// POST /api/tasks — create task (PM)
router.post('/', createTask);

// GET /api/tasks/my — my assigned tasks
router.get('/my', getMyTasks);

// GET /api/tasks/project/:projectId — tasks by project
router.get('/project/:projectId', getTasksByProject);

// PATCH /api/tasks/:id/status — update status
router.patch('/:id/status', updateTaskStatus);

// PATCH /api/tasks/:id/submit — submit task
router.patch('/:id/submit', submitTask);

// PATCH /api/tasks/:id/approve — approve/request revision
router.patch('/:id/approve', approveTask);

// PATCH /api/tasks/:id/reassign — reassign (agency owner)
router.patch('/:id/reassign', reassignTask);

export default router;
