import mongoose from 'mongoose';

const agencyMemberSchema = new mongoose.Schema({
  agencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agency',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['lead', 'member'],
    default: 'member',
  },
}, {
  timestamps: true,
});

// Unique: one user per agency
agencyMemberSchema.index({ agencyId: 1, userId: 1 }, { unique: true });

const AgencyMember = mongoose.models.AgencyMember || mongoose.model('AgencyMember', agencyMemberSchema);
export default AgencyMember;
