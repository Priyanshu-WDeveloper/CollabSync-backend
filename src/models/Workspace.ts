import mongoose, { Schema, Document, Types } from 'mongoose';
import crypto from 'crypto';
import { WORKSPACE_INVITE_CODE_LENGTH } from '../types/workspace.ts';

export interface IWorkspaceMember {
  user: Types.ObjectId;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface IWorkspaceDocument extends Document {
  name: string;
  description?: string;
  owner: Types.ObjectId;
  members: IWorkspaceMember[];
  inviteCode?: string;
  inviteCodeExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  generateInviteCode(): string;
  isOwner(userId: Types.ObjectId | string): boolean;
  isMember(userId: Types.ObjectId | string): boolean;
  getMemberRole(userId: Types.ObjectId | string): 'admin' | 'member' | null;
  canManage(userId: Types.ObjectId | string): boolean;
}

const memberSchema = new Schema<IWorkspaceMember>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'member'],
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const workspaceSchema = new Schema<IWorkspaceDocument>({
  name: {
    type: String,
    required: [true, 'Workspace name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters']
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [memberSchema],
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  },
  inviteCodeExpires: {
    type: Date
  }
}, {
  timestamps: true
});

workspaceSchema.index({ 'members.user': 1 });
workspaceSchema.index({ owner: 1 });
workspaceSchema.index({ 'members.user': 1, createdAt: -1 });

workspaceSchema.methods.generateInviteCode = function() {
  const code = crypto.randomBytes(WORKSPACE_INVITE_CODE_LENGTH).toString('hex').slice(0, WORKSPACE_INVITE_CODE_LENGTH);
  this.inviteCode = code;
  this.inviteCodeExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return code;
};

workspaceSchema.methods.isOwner = function(userId: mongoose.Types.ObjectId | string) {
  if (!this.owner) return false;
  const ownerId = typeof this.owner === 'object' && (this.owner as any)._id
    ? (this.owner as any)._id.toString()
    : this.owner.toString();
  return ownerId === userId.toString();
};

workspaceSchema.methods.isMember = function(userId: mongoose.Types.ObjectId | string) {
  const userIdStr = userId.toString();
  return this.members.some((m: { user: { _id?: mongoose.Types.ObjectId; toString: () => string } }) => {
    // Handle both populated (object with _id) and non-populated (ObjectId) cases
    const memberUserId = m.user._id ? m.user._id.toString() : m.user.toString();
    return memberUserId === userIdStr;
  });
};

workspaceSchema.methods.getMemberRole = function(userId: mongoose.Types.ObjectId | string) {
  const member = this.members.find((m: { user: { toString: () => string } }) => m.user.toString() === userId.toString());
  return member ? member.role : null;
};

workspaceSchema.methods.canManage = function(userId: mongoose.Types.ObjectId | string) {
  return this.isOwner(userId) || this.getMemberRole(userId) === 'admin';
};

export const Workspace = mongoose.model<IWorkspaceDocument>('Workspace', workspaceSchema);
export type IWorkspace = IWorkspaceDocument;
export default Workspace;
