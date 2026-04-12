import { Router } from 'express';
import { searchUsers, getUserProfile, getMe, updateMe } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/user.js';

const router = Router();

router.get('/', authenticate, searchUsers);
router.get('/me', authenticate, getMe);
router.put('/me', authenticate, validate(updateProfileSchema), updateMe);
router.get('/:id', authenticate, getUserProfile);

export default router;
