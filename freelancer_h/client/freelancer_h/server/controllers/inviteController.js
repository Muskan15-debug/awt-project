import Invite from '../models/Invite.js';
import InviteMessage from '../models/InviteMessage.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

// POST /api/invites — recruiter sends invite
export const sendInvite = async (req, res, next) => {
  try {
    const { receiverId, receiverType, projectTitle, message } = req.body;

    if (!receiverId || !receiverType || !projectTitle || !message) {
      return res.status(400).json({ message: 'receiverId, receiverType, projectTitle, and message are required' });
    }

    if (!['freelancer', 'agency'].includes(receiverType)) {
      return res.status(400).json({ message: 'receiverType must be freelancer or agency' });
    }

    // Check for existing pending invite from same recruiter to same receiver
    const existing = await Invite.findOne({
      recruiterId: req.user._id,
      receiverId,
      status: 'pending',
    });
    if (existing) {
      return res.status(409).json({ message: 'You already have a pending invite to this person' });
    }

    const invite = await Invite.create({
      recruiterId: req.user._id,
      receiverId,
      receiverType,
      projectTitle,
      message,
    });

    const populated = await Invite.findById(invite._id)
      .populate('recruiterId', 'name avatar role')
      .populate('receiverId', 'name avatar role title');

    res.status(201).json({ invite: populated });
  } catch (error) {
    next(error);
  }
};

// GET /api/invites — returns invites for current user
export const getMyInvites = async (req, res, next) => {
  try {
    const user = req.user;
    let invites;

    if (user.role === 'recruiter') {
      invites = await Invite.find({ recruiterId: user._id })
        .populate('receiverId', 'name avatar role title')
        .populate('assignedPM', 'name avatar role')
        .populate('projectId', 'title status')
        .sort({ createdAt: -1 });
    } else {
      // freelancer or agency sees received invites
      invites = await Invite.find({ receiverId: user._id })
        .populate('recruiterId', 'name avatar role')
        .populate('assignedPM', 'name avatar role')
        .populate('projectId', 'title status')
        .sort({ createdAt: -1 });
    }

    res.json({ invites });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/invites/:id/respond — freelancer/agency accepts or declines
export const respondToInvite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'status must be accepted or declined' });
    }

    const invite = await Invite.findById(id);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    if (String(invite.receiverId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (invite.status !== 'pending') {
      return res.status(409).json({ message: 'Invite has already been responded to' });
    }

    invite.status = status;

    if (status === 'accepted') {
      // Auto-create a project linked to this invite
      const project = await Project.create({
        title: invite.projectTitle,
        description: invite.message,
        recruiterId: invite.recruiterId,
        freelancerOrAgencyId: invite.receiverId,
        receiverType: invite.receiverType,
        status: 'active',
        inviteId: invite._id,
      });
      invite.projectId = project._id;
    }

    await invite.save();

    const populated = await Invite.findById(invite._id)
      .populate('recruiterId', 'name avatar role')
      .populate('receiverId', 'name avatar role title')
      .populate('assignedPM', 'name avatar role')
      .populate('projectId', 'title status');

    res.json({ invite: populated });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/invites/:id/assign-pm — recruiter assigns PM (handoff)
export const assignPM = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { pmId } = req.body;

    if (!pmId) return res.status(400).json({ message: 'pmId is required' });

    const invite = await Invite.findById(id);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    if (String(invite.recruiterId) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (invite.status !== 'accepted') {
      return res.status(409).json({ message: 'Can only assign PM to an accepted invite' });
    }

    const pm = await User.findOne({ _id: pmId, role: 'projectManager' });
    if (!pm) return res.status(404).json({ message: 'Project Manager not found' });

    invite.assignedPM = pmId;
    await invite.save();

    // Update linked project with PM and handedOff flag
    if (invite.projectId) {
      await Project.findByIdAndUpdate(invite.projectId, {
        pmId: pmId,
        handedOff: true,
      });
    }

    const populated = await Invite.findById(invite._id)
      .populate('recruiterId', 'name avatar role')
      .populate('receiverId', 'name avatar role title')
      .populate('assignedPM', 'name avatar role')
      .populate('projectId', 'title status');

    res.json({ invite: populated });
  } catch (error) {
    next(error);
  }
};

// GET /api/invites/:id/messages
export const getInviteMessages = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invite = await Invite.findById(id);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    const isParty =
      String(invite.recruiterId) === String(req.user._id) ||
      String(invite.receiverId) === String(req.user._id);

    if (!isParty) return res.status(403).json({ message: 'Forbidden' });

    const messages = await InviteMessage.find({ inviteId: id })
      .populate('senderId', 'name avatar role')
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (error) {
    next(error);
  }
};

// POST /api/invites/:id/messages
export const sendInviteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content?.trim()) return res.status(400).json({ message: 'content is required' });

    const invite = await Invite.findById(id);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    const isParty =
      String(invite.recruiterId) === String(req.user._id) ||
      String(invite.receiverId) === String(req.user._id);

    if (!isParty) return res.status(403).json({ message: 'Forbidden' });

    const msg = await InviteMessage.create({
      inviteId: id,
      senderId: req.user._id,
      content: content.trim(),
    });

    const populated = await InviteMessage.findById(msg._id)
      .populate('senderId', 'name avatar role');

    res.status(201).json({ message: populated });
  } catch (error) {
    next(error);
  }
};
