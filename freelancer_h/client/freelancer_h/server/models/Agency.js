import mongoose from 'mongoose';

const agencySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Agency name is required'],
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 5000,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  logo: String,
  website: String,
  specializations: [String],
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'removed'],
      default: 'pending',
    },
    joinedAt: { type: Date, default: Date.now },
  }],
  isApproved: {
    type: Boolean,
    default: false,
  },
  rejectionReason: {
    type: String,
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

agencySchema.index({ owner: 1 });
agencySchema.index({ isApproved: 1 });

const Agency = mongoose.models.Agency || mongoose.model('Agency', agencySchema);
export default Agency;
