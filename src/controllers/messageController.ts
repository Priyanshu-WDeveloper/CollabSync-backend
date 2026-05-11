import { Response } from 'express';
import { body } from 'express-validator';
import { Message, Workspace, Notification } from '../models/index.ts';
import { NOTIFICATION_TYPES } from '../utils/constants.ts';
import { ApiError } from '../utils/ApiError.ts';
import { catchAsync } from '../utils/catchAsync.ts';
import { getIO } from '../config/socket.ts';
import { AuthenticatedRequest } from '../types/express.ts';
import { Types } from 'mongoose';

export const sendValidation = [
  body('content').trim().notEmpty().withMessage('Message content is required')
    .isLength({ max: 2000 }).withMessage('Message cannot exceed 2000 characters')
];

interface WorkspaceWithMembers {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  isOwner: (userId: Types.ObjectId | string) => boolean;
  isMember: (userId: Types.ObjectId | string) => boolean;
  members: Array<{ user: Types.ObjectId }>;
}

const checkWorkspaceAccess = async (workspaceId: string, userId: Types.ObjectId): Promise<WorkspaceWithMembers> => {
  const workspace = await Workspace.findById(workspaceId) as WorkspaceWithMembers | null;
  if (!workspace) throw new ApiError(404, 'Workspace not found');
  if (!workspace.isOwner(userId) && !workspace.isMember(userId)) {
    throw new ApiError(403, 'You are not a member of this workspace');
  }
  return workspace;
};

export const getMessages = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  await checkWorkspaceAccess(req.params.workspaceId, req.user!._id);

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;

  const messages = await Message.find({ workspace: req.params.workspaceId })
    .populate('sender', 'username profileImage isOnline')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Message.countDocuments({ workspace: req.params.workspaceId });

  res.json({
    success: true,
    data: messages.reverse(),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

interface SendBody {
  content: string;
  attachments?: Array<{ url: string; filename: string; mimeType: string; size: number }>;
}

export const send = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const workspace = await checkWorkspaceAccess(req.params.workspaceId, req.user!._id);

  const { content, attachments } = req.body as SendBody;

  const message = await Message.create({
    workspace: req.params.workspaceId,
    sender: req.user!._id,
    content,
    attachments: attachments || []
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'username profileImage isOnline');

  const io = getIO();
  io.to(`workspace:${req.params.workspaceId}`).emit('message:new', populatedMessage);

  const otherMembers = workspace.members
    .filter(m => m.user.toString() !== req.user!._id.toString())
    .map(m => m.user);

  if (otherMembers.length) {
    const notifications = otherMembers.map((userId: Types.ObjectId) => ({
      user: userId,
      type: NOTIFICATION_TYPES.NEW_MESSAGE,
      title: 'New message',
      message: `${req.user!.username}: ${content.slice(0, 50)}...`,
      data: { workspaceId: workspace._id.toString(), senderId: req.user!._id.toString() }
    }));
    const savedNotifications = await Notification.insertMany(notifications);
    savedNotifications.forEach(n => io.to(`user:${n.user.toString()}`).emit('notification:new', n));
  }

  res.status(201).json({ success: true, data: populatedMessage });
});

export const remove = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    throw new ApiError(404, 'Message not found');
  }

  if (message.sender.toString() !== req.user!._id.toString()) {
    throw new ApiError(403, 'You can only delete your own messages');
  }

  await message.deleteOne();

  const io = getIO();
  io.to(`workspace:${message.workspace}`).emit('message:deleted', { messageId: req.params.id });

  res.json({ success: true, message: 'Message deleted' });
});