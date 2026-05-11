import mongoose, { Schema } from 'mongoose';

const attachmentSchema = new Schema({
  url: String,
  filename: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const taskSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo'
  },
  workspace: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  assignees: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  attachments: [attachmentSchema],
  dueDate: {
    type: Date
  },
  order: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

taskSchema.index({ workspace: 1, status: 1 });
taskSchema.index({ assignees: 1 });
taskSchema.index({ createdBy: 1 });

export const Task = mongoose.model('Task', taskSchema);
export default Task;
