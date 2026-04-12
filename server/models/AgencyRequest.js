import mongoose from 'mongoose';

const agencyRequestSchema = new mongoose.Schema({
  initiatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  proposedName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  proposedDescription: {
    type: String,
    trim: true,
    maxlength: 5000,
  },
  proposedSpecializations: [{
    type: String,
    trim: true,
  }],
  invitees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    responseDate: Date,
  }],
  status: {
    type: String,
    enum: ['pending', 'executed', 'cancelled'],
    default: 'pending',
  },
  createdAgencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
  },
}, {
  timestamps: true,
});

agencyRequestSchema.index({ initiatorId: 1 });
agencyRequestSchema.index({ 'invitees.user': 1 });
agencyRequestSchema.index({ status: 1 });

const AgencyRequest = mongoose.models.AgencyRequest || mongoose.model('AgencyRequest', agencyRequestSchema);
export default AgencyRequest;
