import { Router } from 'express';
import { register, login, logout, refresh } from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../validators/auth.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refresh);

import { authenticate } from '../middleware/auth.js';
import { changePasswordSchema } from '../validators/auth.js';
import { changePassword } from '../controllers/authController.js';
router.patch('/password', authenticate, validate(changePasswordSchema), changePassword);

export default router;
