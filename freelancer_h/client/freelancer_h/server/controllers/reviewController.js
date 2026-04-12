import Review from '../models/Review.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

// POST /api/reviews — create review after project completed
export const createReview = async (req, res, next) => {
  try {
    const { projectId, toId, rating, comment } = req.body;

    if (!projectId || !toId || !rating) {
      return res.status(400).json({ message: 'projectId, toId, and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed projects' });
    }

    // Check the reviewer is a party to the project
    const userId = req.user._id.toString();
    const isRecruiter = String(project.recruiterId) === userId;
    const isPM = String(project.pmId) === userId;
    const isWorker = String(project.freelancerOrAgencyId) === userId;

    if (!isRecruiter && !isPM && !isWorker) {
      return res.status(403).json({ message: 'Only project participants can leave reviews' });
    }

    // Check the target is also a party to the project
    const toIdStr = String(toId);
    const isTargetRecruiter = String(project.recruiterId) === toIdStr;
    const isTargetPM = String(project.pmId) === toIdStr;
    const isTargetWorker = String(project.freelancerOrAgencyId) === toIdStr;

    if (!isTargetRecruiter && !isTargetPM && !isTargetWorker) {
      return res.status(400).json({ message: 'Can only review other project participants' });
    }

    // Cannot review yourself
    if (userId === toIdStr) {
      return res.status(400).json({ message: 'Cannot review yourself' });
    }

    const review = await Review.create({
      projectId,
      fromId: req.user._id,
      toId,
      rating,
      comment: comment || undefined,
    });

    // Update user's rating average
    const allReviews = await Review.find({ toId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await User.findByIdAndUpdate(toId, {
      'rating.average': Math.round(avgRating * 10) / 10,
      'rating.count': allReviews.length,
    });

    res.status(201).json({ message: 'Review created', review });
  } catch (error) {
    // Handle duplicate index error (one review per direction per project)
    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already reviewed this user for this project' });
    }
    next(error);
  }
};

// GET /api/reviews/user/:userId — get all reviews for a user (public)
export const getReviewsForUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ toId: userId })
      .populate('fromId', 'name avatar role')
      .populate('projectId', 'title')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    next(error);
  }
};
