import mongoose from 'mongoose';

const shortlistSchema = new mongoose.Schema({
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetType: {
    type: String,
    enum: ['freelancer', 'agency'],
    default: 'freelancer',
  },
}, {
  timestamps: true,
});

// Unique: one recruiter can shortlist each target only once
shortlistSchema.index({ recruiterId: 1, targetId: 1 }, { unique: true });
shortlistSchema.index({ recruiterId: 1 });

const Shortlist = mongoose.models.Shortlist || mongoose.model('Shortlist', shortlistSchema);
export default Shortlist;
