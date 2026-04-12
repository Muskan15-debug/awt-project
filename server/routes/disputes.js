import { Router } from 'express';
import { createDispute, getDisputes, getDispute, resolveDispute } from '../controllers/disputeController.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

router.use(authenticate);

// POST /api/disputes — create dispute
router.post('/', createDispute);

// GET /api/disputes — get disputes
router.get('/', getDisputes);

// GET /api/disputes/:id — get dispute
router.get('/:id', getDispute);

// PATCH /api/disputes/:id/resolve — admin resolves
router.patch('/:id/resolve', requireRole('admin'), resolveDispute);

export default router;
