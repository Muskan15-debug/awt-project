import { Router } from 'express';
import { getProjects, getProject } from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, getProjects);
router.get('/:id', authenticate, getProject);

export default router;
