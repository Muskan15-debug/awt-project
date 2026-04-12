import AgencyRequest from '../models/AgencyRequest.js';
import Agency from '../models/Agency.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

// POST /api/agency-requests
export const createRequest = async (req, res, next) => {
  try {
    const { proposedName, proposedDescription, proposedSpecializations, inviteeIds } = req.body;
    const initiatorId = req.user._id;

    if (!proposedName) return res.status(400).json({ message: 'Agency name is required' });
    if (!inviteeIds || !Array.isArray(inviteeIds) || inviteeIds.length === 0) {
      return res.status(400).json({ message: 'Must invite at least one freelancer' });
    }

    // Ensure initiator is not already in an agency
    const initiator = await User.findById(initiatorId);
    if (initiator.agencyId) {
      return res.status(400).json({ message: 'You are already in an agency' });
    }

    // Build invitees array
    const invitees = inviteeIds.map(id => ({ user: id, status: 'pending' }));

    const request = await AgencyRequest.create({
      initiatorId,
      proposedName,
      proposedDescription,
      proposedSpecializations,
      invitees,
    });

    res.status(201).json({ message: 'Agency formation request sent', request });
  } catch (error) {
    next(error);
  }
};

// GET /api/agency-requests/my
export const getMyRequests = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Get requests initiated by the user
    const sent = await AgencyRequest.find({ initiatorId: userId })
      .populate('invitees.user', 'name email avatar')
      .populate('createdAgencyId', 'name')
      .sort({ createdAt: -1 });

    // Get requests where user is an invitee
    const received = await AgencyRequest.find({ 'invitees.user': userId })
      .populate('initiatorId', 'name email avatar')
      .populate('createdAgencyId', 'name')
      .sort({ createdAt: -1 });

    res.json({ sent, received });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/agency-requests/:id/respond
export const respondToRequest = async (req, res, next) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    const request = await AgencyRequest.findById(req.params.id);
    const userId = req.user._id.toString();

    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (request.status === 'cancelled') return res.status(400).json({ message: 'Request is cancelled' });

    // Find the invitee
    const inviteeIndex = request.invitees.findIndex(i => i.user.toString() === userId);
    if (inviteeIndex === -1) {
      return res.status(403).json({ message: 'You are not invited to this request' });
    }

    const invitee = request.invitees[inviteeIndex];
    if (invitee.status !== 'pending') {
      return res.status(400).json({ message: 'You have already responded' });
    }

    if (action === 'reject') {
      invitee.status = 'rejected';
      invitee.responseDate = new Date();
      await request.save();
      return res.json({ message: 'Request rejected', request });
    }

    if (action === 'accept') {
      // Check if user is already in an agency
      if (req.user.agencyId) {
        return res.status(400).json({ message: 'You are already in an agency and cannot accept.' });
      }

      invitee.status = 'accepted';
      invitee.responseDate = new Date();

      // If agency doesn't exist yet, this is the first acceptance -> Create Agency
      if (request.status === 'pending') {
        const agency = await Agency.create({
          name: request.proposedName,
          description: request.proposedDescription,
          specializations: request.proposedSpecializations,
          owner: request.initiatorId,
          members: [
            { user: request.initiatorId, role: 'owner', status: 'active' },
            { user: userId, role: 'admin', status: 'active' } // First acceptor becomes admin
          ],
        });

        request.status = 'executed';
        request.createdAgencyId = agency._id;
        await request.save();

        // Update User records for initiator and this acceptor
        await User.findByIdAndUpdate(request.initiatorId, { agencyId: agency._id });
        await User.findByIdAndUpdate(userId, { agencyId: agency._id });

        // Log
        await ActivityLog.create({
          action: 'agency.formed_peer',
          performedBy: userId, // the accepter triggered creation
          targetType: 'Agency',
          targetId: agency._id,
          meta: { agencyName: agency.name, initiatorId: request.initiatorId }
        });

        return res.json({ message: 'Request accepted and Agency formed!', request, agencyId: agency._id });
      } else if (request.status === 'executed' && request.createdAgencyId) {
        // Agency already exists, just add this user to it
        await Agency.findByIdAndUpdate(request.createdAgencyId, {
          $push: { members: { user: userId, role: 'member', status: 'active' } }
        });
        
        await User.findByIdAndUpdate(userId, { agencyId: request.createdAgencyId });
        await request.save();

        return res.json({ message: 'Request accepted, joined existing agency.', request, agencyId: request.createdAgencyId });
      }
    } else {
      return res.status(400).json({ message: 'Invalid action. Must be accept or reject' });
    }
  } catch (error) {
    next(error);
  }
};
