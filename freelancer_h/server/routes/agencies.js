import { Router } from 'express';
import { createAgency, getAgency, updateAgency, manageMember, updateMemberStatus } from '../controllers/agencyController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, createAgency);
router.get('/:id', authenticate, getAgency);
router.put('/:id', authenticate, updateAgency);
router.post('/:id/members', authenticate, manageMember);
router.patch('/:id/members/:uid', authenticate, updateMemberStatus);

export default router;
