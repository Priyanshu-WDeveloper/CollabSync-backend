import { Response } from 'express';
import { Notification } from '../models/index.ts';
import { ApiError } from '../utils/ApiError.ts';
import { catchAsync } from '../utils/catchAsync.ts';
import { getIO } from '../config/socket.ts';
import { AuthenticatedRequest } from '../types/express.ts';

export const getAll = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ user: req.user!._id })
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments({ user: req.user!._id });
  const unreadCount = await Notification.countDocuments({ user: req.user!._id, read: false });

  res.json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const markAsRead = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user!._id
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  notification.read = true;
  await notification.save();

  res.json({ success: true, data: notification });
});

export const markAllAsRead = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  await Notification.updateMany(
    { user: req.user!._id, read: false },
    { read: true }
  );

  res.json({ success: true, message: 'All notifications marked as read' });
});

export const remove = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user!._id
  });

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  await notification.deleteOne();

  res.json({ success: true, message: 'Notification deleted' });
});