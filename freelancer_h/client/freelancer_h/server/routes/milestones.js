import { Router } from 'express';
import { createMilestone, getMilestones, updateMilestoneStatus } from '../controllers/milestoneController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// POST /api/milestones/project/:projectId — create milestone (PM only)
router.post('/project/:projectId', createMilestone);

// GET /api/milestones/project/:projectId — get milestones
router.get('/project/:projectId', getMilestones);

// PATCH /api/milestones/:id/status — update status
router.patch('/:id/status', updateMilestoneStatus);

export default router;
