import mongoose from 'mongoose';

const inviteSchema = new mongoose.Schema({
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverType: {
    type: String,
    enum: ['freelancer', 'agency'],
    required: true,
  },
  projectTitle: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: 200,
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: 2000,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  assignedPM: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

inviteSchema.index({ recruiterId: 1 });
inviteSchema.index({ receiverId: 1 });
inviteSchema.index({ status: 1 });

const Invite = mongoose.models.Invite || mongoose.model('Invite', inviteSchema);
export default Invite;
