import { Router } from 'express';
import { createReview, getReviewsForUser } from '../controllers/reviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/reviews — create review
router.post('/', authenticate, createReview);

// GET /api/reviews/user/:userId — get reviews for a user
router.get('/user/:userId', authenticate, getReviewsForUser);

export default router;
