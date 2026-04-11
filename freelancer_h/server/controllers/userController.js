import User from '../models/User.js';

// GET /api/users — talent search (no pagination)
export const searchUsers = async (req, res, next) => {
  try {
    const { role, skills, rating, availability, search, minRate, maxRate, experienceLevel } = req.query;

    const filter = { isBanned: false };

    if (role) filter.role = role;
    if (availability) filter.availability = availability;
    if (experienceLevel) filter.experienceLevel = experienceLevel;
    if (rating) filter['rating.average'] = { $gte: parseFloat(rating) };
    if (skills) {
      const skillsArr = skills.split(',').map(s => s.trim());
      filter.skills = { $in: skillsArr };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { skills: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (minRate || maxRate) {
      filter.hourlyRate = {};
      if (minRate) filter.hourlyRate.$gte = parseFloat(minRate);
      if (maxRate) filter.hourlyRate.$lte = parseFloat(maxRate);
    }

    const users = await User.find(filter)
      .select('name email avatar title skills hourlyRate availability location rating role bio experienceLevel profilePhoto portfolioLinks')
      .sort({ 'rating.average': -1 });

    res.json({ users });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:id — public profile
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/me — own profile
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// PUT /api/users/me — update profile
export const updateMe = async (req, res, next) => {
  try {
    const updates = req.validatedBody;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    next(error);
  }
};
