import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
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
  assignedToId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'submitted', 'approved', 'revision-requested'],
    default: 'todo',
  },
  submissionNote: {
    type: String,
  },
  submissionFileUrl: {
    type: String,
  },
}, {
  timestamps: true,
});

taskSchema.index({ milestoneId: 1 });
taskSchema.index({ projectId: 1 });
taskSchema.index({ assignedToId: 1 });

const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
export default Task;
