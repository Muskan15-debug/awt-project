import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  milestoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Milestone',
    required: true,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['held', 'released', 'refunded'],
    default: 'held',
  },
}, {
  timestamps: true,
});

paymentSchema.index({ projectId: 1 });
paymentSchema.index({ milestoneId: 1 });

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export default Payment;
