import mongoose from 'mongoose';

const inviteMessageSchema = new mongoose.Schema({
  inviteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invite',
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: 5000,
  },
}, {
  timestamps: true,
});

inviteMessageSchema.index({ inviteId: 1, createdAt: 1 });

const InviteMessage = mongoose.models.InviteMessage || mongoose.model('InviteMessage', inviteMessageSchema);
export default InviteMessage;
