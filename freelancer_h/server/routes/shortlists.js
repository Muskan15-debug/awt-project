import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { toggleShortlist, getShortlist } from '../controllers/shortlistController.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('recruiter', 'admin'));

router.post('/', toggleShortlist);
router.get('/', getShortlist);

export default router;
