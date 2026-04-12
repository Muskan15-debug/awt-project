import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Milestone title is required'],
    trim: true,
    maxlength: 200,
  },
  dueDate: {
    type: Date,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'submitted', 'approved', 'rejected'],
    default: 'pending',
  },
}, {
  timestamps: true,
});

milestoneSchema.index({ projectId: 1 });

const Milestone = mongoose.models.Milestone || mongoose.model('Milestone', milestoneSchema);
export default Milestone;
