import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 10000,
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  pmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  freelancerOrAgencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverType: {
    type: String,
    enum: ['freelancer', 'agency'],
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'disputed', 'cancelled'],
    default: 'active',
  },
  inviteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invite',
  },
  handedOff: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes
projectSchema.index({ status: 1 });
projectSchema.index({ recruiterId: 1 });
projectSchema.index({ pmId: 1 });
projectSchema.index({ freelancerOrAgencyId: 1 });
projectSchema.index({ createdAt: -1 });

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
export default Project;
