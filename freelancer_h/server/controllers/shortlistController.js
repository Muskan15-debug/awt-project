import Shortlist from '../models/Shortlist.js';
import User from '../models/User.js';

// POST /api/shortlists — toggle shortlist (add/remove)
export const toggleShortlist = async (req, res, next) => {
  try {
    const { targetId } = req.body;

    if (!targetId) {
      return res.status(400).json({ message: 'targetId is required' });
    }

    const existing = await Shortlist.findOne({ recruiterId: req.user._id, targetId });

    if (existing) {
      await Shortlist.deleteOne({ _id: existing._id });
      return res.json({ shortlisted: false, message: 'Removed from shortlist' });
    }

    // Determine targetType from the user's role
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    const targetType = targetUser.role === 'agency' ? 'agency' : 'freelancer';

    await Shortlist.create({ recruiterId: req.user._id, targetId, targetType });
    return res.status(201).json({ shortlisted: true, message: 'Added to shortlist' });
  } catch (error) {
    next(error);
  }
};

// GET /api/shortlists — get all shortlisted talent for this recruiter
export const getShortlist = async (req, res, next) => {
  try {
    const shortlists = await Shortlist.find({ recruiterId: req.user._id })
      .populate({
        path: 'targetId',
        select: 'name avatar role title skills hourlyRate availability location rating bio experienceLevel profilePhoto portfolioLinks',
      })
      .sort({ createdAt: -1 });

    res.json({ shortlists });
  } catch (error) {
    next(error);
  }
};
