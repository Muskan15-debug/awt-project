import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  fromId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  toId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
}, {
  timestamps: true,
});

// One review per direction per project
reviewSchema.index({ projectId: 1, fromId: 1 }, { unique: true });
reviewSchema.index({ toId: 1 });

const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
export default Review;
