import Agency from '../models/Agency.js';
import User from '../models/User.js';

export const createAgency = async (req, res, next) => {
  try {
    const { name, description, website, specializations } = req.body;
    const agency = await Agency.create({
      name,
      description,
      website,
      specializations,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner', status: 'active' }],
    });
    await User.findByIdAndUpdate(req.user._id, { agencyId: agency._id });
    res.status(201).json({ message: 'Agency created', agency });
  } catch (error) {
    next(error);
  }
};

export const getAgency = async (req, res, next) => {
  try {
    const agency = await Agency.findById(req.params.id)
      .populate('owner', 'name avatar')
      .populate('members.user', 'name avatar email skills');
    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    res.json({ agency });
  } catch (error) {
    next(error);
  }
};

export const updateAgency = async (req, res, next) => {
  try {
    const agency = await Agency.findById(req.params.id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    if (agency.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only agency owner can update' });
    }

    const { name, description, website, specializations, logo } = req.body;
    if (name) agency.name = name;
    if (description) agency.description = description;
    if (website) agency.website = website;
    if (specializations) agency.specializations = specializations;
    if (logo) agency.logo = logo; // plain URL string

    await agency.save();
    res.json({ message: 'Agency updated', agency });
  } catch (error) {
    next(error);
  }
};

export const manageMember = async (req, res, next) => {
  try {
    const { userId, action } = req.body;
    const agency = await Agency.findById(req.params.id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });
    if (agency.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only owner can manage members' });
    }

    if (action === 'invite') {
      const exists = agency.members.find(m => m.user.toString() === userId);
      if (exists) return res.status(409).json({ message: 'User already a member' });
      agency.members.push({ user: userId, role: 'member', status: 'pending' });
    } else if (action === 'assign') {
      const member = agency.members.find(m => m.user.toString() === userId);
      if (!member) return res.status(404).json({ message: 'Member not found' });
      member.role = 'admin';
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await agency.save();
    res.json({ message: `Member ${action}d`, agency });
  } catch (error) {
    next(error);
  }
};

export const updateMemberStatus = async (req, res, next) => {
  try {
    const { action } = req.body;
    const agency = await Agency.findById(req.params.id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });

    const member = agency.members.find(m => m.user.toString() === req.params.uid);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    if (action === 'accept') {
      if (member.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only the invited user can accept' });
      }
      member.status = 'active';
      await User.findByIdAndUpdate(req.params.uid, { agencyId: agency._id });
    } else if (action === 'remove') {
      if (agency.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Only owner can remove' });
      }
      member.status = 'removed';
      await User.findByIdAndUpdate(req.params.uid, { $unset: { agencyId: '' } });
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await agency.save();
    res.json({ message: `Member ${action}ed`, agency });
  } catch (error) {
    next(error);
  }
};
