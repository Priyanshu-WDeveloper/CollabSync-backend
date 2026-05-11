import mongoose, { Schema } from 'mongoose';

const attachmentSchema = new Schema({
  url: String,
  filename: String,
  mimeType: String,
  size: Number,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const messageSchema = new Schema({
  workspace: {
    type: Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  attachments: [attachmentSchema]
}, {
  timestamps: true
});

messageSchema.index({ workspace: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

export const Message = mongoose.model('Message', messageSchema);
export default Message;
