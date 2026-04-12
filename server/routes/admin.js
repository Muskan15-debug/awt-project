import { Router } from 'express';
import {
  getAnalytics,
  getActivityLog,
  getUsers,
  updateUser,
  getPendingAgencies,
  approveAgency,
  getDisputes,
  resolveDispute,
  getAllProjects,
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

router.use(authenticate, requireRole('admin'));

// Analytics & Dashboard
router.get('/analytics', getAnalytics);
router.get('/activity-log', getActivityLog);

// Users
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);

// Agencies
router.get('/agencies/pending', getPendingAgencies);
router.patch('/agencies/:id', approveAgency);

// Disputes
router.get('/disputes', getDisputes);
router.patch('/disputes/:id/resolve', resolveDispute);

// Projects
router.get('/projects', getAllProjects);

export default router;
