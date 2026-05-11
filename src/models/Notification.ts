import mongoose, { Schema } from 'mongoose';

const notificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['task_assigned', 'workspace_invite', 'task_status_changed', 'new_message'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  message: {
    type: String,
    maxlength: [300, 'Message cannot exceed 300 characters']
  },
  read: {
    type: Boolean,
    default: false
  },
  data: {
    taskId: Schema.Types.ObjectId,
    workspaceId: Schema.Types.ObjectId,
    senderId: Schema.Types.ObjectId
  },
  link: {
    type: String
  }
}, {
  timestamps: true
});

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
