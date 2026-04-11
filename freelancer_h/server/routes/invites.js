import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import {
  sendInvite,
  getMyInvites,
  respondToInvite,
  assignPM,
  getInviteMessages,
  sendInviteMessage,
} from '../controllers/inviteController.js';

const router = Router();

// All invite routes require authentication
router.use(authenticate);

// Send an invite (recruiter only)
router.post('/', requireRole('recruiter'), sendInvite);

// Get my invites (recruiter sees sent, freelancer/agency sees received)
router.get('/', getMyInvites);

// Respond to an invite (freelancer or agency)
router.patch('/:id/respond', requireRole('freelancer', 'agency'), respondToInvite);

// Assign a PM to an accepted invite (recruiter only)
router.patch('/:id/assign-pm', requireRole('recruiter'), assignPM);

// Per-invite message thread
router.get('/:id/messages', getInviteMessages);
router.post('/:id/messages', sendInviteMessage);

export default router;
