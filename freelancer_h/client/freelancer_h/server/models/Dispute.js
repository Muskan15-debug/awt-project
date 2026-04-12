import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  raisedById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: [true, 'Dispute reason is required'],
    trim: true,
    maxlength: 5000,
  },
  status: {
    type: String,
    enum: ['open', 'under-review', 'resolved'],
    default: 'open',
  },
  adminNote: {
    type: String,
  },
  resolution: {
    type: String,
    enum: ['refund', 'release', 'split'],
  },
}, {
  timestamps: true,
});

disputeSchema.index({ projectId: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ raisedById: 1 });

const Dispute = mongoose.models.Dispute || mongoose.model('Dispute', disputeSchema);
export default Dispute;
