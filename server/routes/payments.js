import { Router } from 'express';
import { getEarnings, getPaymentsByProject } from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/payments/earnings — my earnings
router.get('/earnings', getEarnings);

// GET /api/payments/project/:projectId — payments by project
router.get('/project/:projectId', getPaymentsByProject);

export default router;
