import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    trim: true,
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetType: {
    type: String,
    enum: ['User', 'Project', 'Milestone', 'Task', 'Dispute', 'Agency', 'Payment'],
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ performedBy: 1 });
activityLogSchema.index({ targetType: 1 });
activityLogSchema.index({ action: 1 });

const ActivityLog = mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
