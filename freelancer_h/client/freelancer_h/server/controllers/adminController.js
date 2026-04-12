import User from '../models/User.js';
import Agency from '../models/Agency.js';
import Dispute from '../models/Dispute.js';
import Payment from '../models/Payment.js';
import Project from '../models/Project.js';

// GET /api/admin/users — all users with role filter, no pagination
export const getUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id — ban/unban/verify
export const updateUser = async (req, res, next) => {
  try {
    const { action } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (action === 'verify') user.isVerified = true;
    else if (action === 'ban') user.isBanned = true;
    else if (action === 'unban') user.isBanned = false;
    else return res.status(400).json({ message: 'Invalid action. Must be verify, ban, or unban' });

    await user.save();
    res.json({ message: `User ${action}ed successfully`, user });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/agencies/pending — get pending agencies
export const getPendingAgencies = async (req, res, next) => {
  try {
    const agencies = await Agency.find({ isApproved: false })
      .populate('owner', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json({ agencies });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/agencies/:id — approve or reject agency
export const approveAgency = async (req, res, next) => {
  try {
    const { action, reason } = req.body;
    const agency = await Agency.findById(req.params.id);
    if (!agency) return res.status(404).json({ message: 'Agency not found' });

    if (action === 'approve') {
      agency.isApproved = true;
      await agency.save();
      return res.json({ message: 'Agency approved', agency });
    } else if (action === 'reject') {
      agency.rejectionReason = reason || 'No reason provided';
      await agency.save();
      return res.json({ message: 'Agency rejected', agency });
    } else {
      return res.status(400).json({ message: 'Invalid action. Must be approve or reject' });
    }
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/disputes — all disputes
export const getDisputes = async (req, res, next) => {
  try {
    const disputes = await Dispute.find()
      .populate('projectId', 'title status')
      .populate('raisedById', 'name avatar role')
      .sort({ createdAt: -1 });
    res.json({ disputes });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/disputes/:id/resolve — resolve dispute with outcome
export const resolveDispute = async (req, res, next) => {
  try {
    const { resolution, adminNote } = req.body;

    if (!resolution || !['refund', 'release', 'split'].includes(resolution)) {
      return res.status(400).json({ message: 'resolution must be refund, release, or split' });
    }

    const dispute = await Dispute.findById(req.params.id);
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    if (dispute.status === 'resolved') {
      return res.status(400).json({ message: 'Dispute is already resolved' });
    }

    dispute.status = 'resolved';
    dispute.resolution = resolution;
    if (adminNote) dispute.adminNote = adminNote;
    await dispute.save();

    // Update payments based on resolution
    if (resolution === 'refund') {
      await Payment.updateMany(
        { projectId: dispute.projectId, status: 'held' },
        { status: 'refunded' }
      );
    } else if (resolution === 'release') {
      await Payment.updateMany(
        { projectId: dispute.projectId, status: 'held' },
        { status: 'released' }
      );
    } else if (resolution === 'split') {
      const payments = await Payment.find({ projectId: dispute.projectId, status: 'held' });
      for (let i = 0; i < payments.length; i++) {
        payments[i].status = i % 2 === 0 ? 'released' : 'refunded';
        await payments[i].save();
      }
    }

    res.json({ message: 'Dispute resolved', dispute });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/projects — read-only project oversight
export const getAllProjects = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const projects = await Project.find(filter)
      .populate('recruiterId', 'name avatar email')
      .populate('pmId', 'name avatar')
      .populate('freelancerOrAgencyId', 'name avatar role')
      .sort({ createdAt: -1 });

    res.json({ projects });
  } catch (error) {
    next(error);
  }
};
