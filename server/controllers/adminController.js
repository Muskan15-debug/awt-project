import User from '../models/User.js';
import Agency from '../models/Agency.js';
import Dispute from '../models/Dispute.js';
import Payment from '../models/Payment.js';
import Project from '../models/Project.js';
import Milestone from '../models/Milestone.js';
import Task from '../models/Task.js';
import ActivityLog from '../models/ActivityLog.js';

// GET /api/admin/analytics — aggregated platform stats
export const getAnalytics = async (req, res, next) => {
  try {
    const [
      totalUsers,
      usersByRole,
      totalProjects,
      projectsByStatus,
      totalDisputes,
      openDisputes,
      paymentStats,
      recentActivity,
    ] = await Promise.all([
      User.countDocuments(),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
      Project.countDocuments(),
      Project.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Dispute.countDocuments(),
      Dispute.countDocuments({ status: { $ne: 'resolved' } }),
      Payment.aggregate([
        {
          $group: {
            _id: '$status',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      ActivityLog.find()
        .populate('performedBy', 'name avatar role')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    // Convert arrays to objects for easier frontend consumption
    const roleDistribution = {};
    usersByRole.forEach(r => { roleDistribution[r._id] = r.count; });

    const projectStatusBreakdown = {};
    projectsByStatus.forEach(s => { projectStatusBreakdown[s._id || 'active'] = s.count; });

    const payments = { held: 0, released: 0, refunded: 0, heldAmount: 0, releasedAmount: 0, refundedAmount: 0 };
    paymentStats.forEach(p => {
      if (p._id === 'held') { payments.held = p.count; payments.heldAmount = p.total; }
      else if (p._id === 'released') { payments.released = p.count; payments.releasedAmount = p.total; }
      else if (p._id === 'refunded') { payments.refunded = p.count; payments.refundedAmount = p.total; }
    });

    // Get counts for quick stats
    const activeContracts = await Project.countDocuments({ status: 'active' });

    res.json({
      totalUsers,
      roleDistribution,
      totalProjects,
      projectStatusBreakdown,
      activeContracts,
      totalDisputes,
      openDisputes,
      payments,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/activity-log — paginated activity feed
export const getActivityLog = async (req, res, next) => {
  try {
    const { page = 1, limit = 30, action, targetType } = req.query;
    const filter = {};
    if (action) filter.action = { $regex: action, $options: 'i' };
    if (targetType) filter.targetType = targetType;

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('performedBy', 'name avatar email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error) {
    next(error);
  }
};

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

// PATCH /api/admin/users/:id — ban/unban/verify/changeRole
export const updateUser = async (req, res, next) => {
  try {
    const { action, newRole } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (action === 'verify') {
      user.isVerified = true;
    } else if (action === 'ban') {
      user.isBanned = true;
    } else if (action === 'unban') {
      user.isBanned = false;
    } else if (action === 'changeRole') {
      if (!newRole || !['admin', 'recruiter', 'projectManager', 'freelancer', 'agency'].includes(newRole)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      user.role = newRole;
    } else {
      return res.status(400).json({ message: 'Invalid action. Must be verify, ban, unban, or changeRole' });
    }

    await user.save();

    // Log the action
    await ActivityLog.create({
      action: `user.${action}`,
      performedBy: req.user._id,
      targetType: 'User',
      targetId: user._id,
      meta: {
        userName: user.name,
        userEmail: user.email,
        ...(action === 'changeRole' ? { newRole } : {}),
      },
    });

    res.json({ message: `User ${action === 'changeRole' ? 'role changed' : action + 'ed'} successfully`, user });
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

      await ActivityLog.create({
        action: 'agency.approved',
        performedBy: req.user._id,
        targetType: 'Agency',
        targetId: agency._id,
        meta: { agencyName: agency.name },
      });

      return res.json({ message: 'Agency approved', agency });
    } else if (action === 'reject') {
      agency.rejectionReason = reason || 'No reason provided';
      await agency.save();

      await ActivityLog.create({
        action: 'agency.rejected',
        performedBy: req.user._id,
        targetType: 'Agency',
        targetId: agency._id,
        meta: { agencyName: agency.name, reason: agency.rejectionReason },
      });

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

    // Log the resolution
    await ActivityLog.create({
      action: 'dispute.resolved',
      performedBy: req.user._id,
      targetType: 'Dispute',
      targetId: dispute._id,
      meta: { resolution, adminNote: adminNote || '' },
    });

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
