import { Router } from 'express';
import { getProjects, getProject, assignPM, updateProjectStatus } from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getProjects);
router.get('/:id', authenticate, getProject);
router.patch('/:id/assign-pm', authenticate, assignPM);
router.patch('/:id/status', authenticate, updateProjectStatus);

export default router;
