import { Router } from 'express';
import { createRequest, getMyRequests, respondToRequest } from '../controllers/agencyRequestController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

router.use(authenticate, requireRole('freelancer'));

router.post('/', createRequest);
router.get('/my', getMyRequests);
router.patch('/:id/respond', respondToRequest);

export default router;
