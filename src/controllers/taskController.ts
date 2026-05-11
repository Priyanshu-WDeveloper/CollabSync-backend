import { Response } from 'express';
import { body } from 'express-validator';
import { Document, Types } from 'mongoose';
import { Task, Workspace, Notification } from '../models/index.ts';
import { TASK_STATUS, NOTIFICATION_TYPES } from '../utils/constants.ts';
import { ApiError } from '../utils/ApiError.ts';
import { catchAsync } from '../utils/catchAsync.ts';
import { getIO } from '../config/socket.ts';
import { AuthenticatedRequest } from '../types/express.ts';
import { ITask, TaskStatus } from '../types/task.ts';

export const taskCreateValidation = [
  body('title').trim().notEmpty().withMessage('Task title is required')
    .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('assignees').optional().isArray().withMessage('Assignees must be an array')
];

export const taskUpdateValidation = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  body('status').optional().isIn(Object.values(TASK_STATUS)).withMessage('Invalid status'),
  body('assignees').optional().isArray()
];

interface CheckWorkspaceResult {
  _id: Types.ObjectId;
  owner: Types.ObjectId;
  isOwner: (userId: Types.ObjectId | string) => boolean;
  isMember: (userId: Types.ObjectId | string) => boolean;
}

const checkWorkspaceAccess = async (workspaceId: string, userId: Types.ObjectId): Promise<CheckWorkspaceResult> => {
  const workspace = await Workspace.findById(workspaceId) as CheckWorkspaceResult | null;
  if (!workspace) throw new ApiError(404, 'Workspace not found');
  if (!workspace.isOwner(userId) && !workspace.isMember(userId)) {
    throw new ApiError(403, 'You are not a member of this workspace');
  }
  return workspace;
};

export const create = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const workspace = await checkWorkspaceAccess(req.params.workspaceId, req.user!._id);

  const maxOrderTask = await Task.findOne({ workspace: req.params.workspaceId, status: req.body.status || TASK_STATUS.TODO })
    .sort('-order');
  const order = maxOrderTask ? maxOrderTask.order + 1 : 0;

  const task = await Task.create({
    ...req.body,
    workspace: req.params.workspaceId,
    createdBy: req.user!._id,
    order
  });

  const populatedTask = await Task.findById(task._id)
    .populate('createdBy', 'username profileImage')
    .populate('assignees', 'username profileImage');

  const io = getIO();
  io.to(`workspace:${req.params.workspaceId}`).emit('task:created', populatedTask);

  if (req.body.assignees?.length) {
    const notifications = (req.body.assignees as string[]).map((userId: string) => ({
      user: userId,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      title: 'New task assigned',
      message: `${req.user!.username} assigned you to "${req.body.title}"`,
      data: { taskId: task._id, workspaceId: workspace._id, senderId: req.user!._id }
    }));
    await Notification.insertMany(notifications);
    notifications.forEach(n => io.to(`user:${n.user}`).emit('notification:new', n));
  }

  res.status(201).json({ success: true, data: populatedTask });
});

export const getAll = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  await checkWorkspaceAccess(req.params.workspaceId, req.user!._id);

  const { status, assignee, search, page, limit } = req.query;
  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 100;
  const skip = (pageNum - 1) * limitNum;

  const filter: Record<string, unknown> = { workspace: req.params.workspaceId };

  if (status) filter.status = status;
  if (assignee) filter.assignees = assignee;
  if (search) filter.title = { $regex: search, $options: 'i' };

  const total = await Task.countDocuments(filter);

  const tasks = await Task.find(filter)
    .populate('createdBy', 'username profileImage')
    .populate('assignees', 'username profileImage')
    .sort('order')
    .skip(skip)
    .limit(limitNum);

  res.json({
    success: true,
    count: tasks.length,
    data: tasks,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) }
  });
});

export const getOne = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const task = await Task.findById(req.params.id)
    .populate('createdBy', 'username profileImage')
    .populate('assignees', 'username profileImage') as ITask | null;

  if (!task) throw new ApiError(404, 'Task not found');
  await checkWorkspaceAccess((task as ITask).workspace.toString(), req.user!._id);

  res.json({ success: true, data: task });
});

export const update = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const task = await Task.findById(req.params.id) as ITask | null;
  if (!task) throw new ApiError(404, 'Task not found');
  await checkWorkspaceAccess((task as ITask).workspace.toString(), req.user!._id);

  const previousAssignees = task.assignees.map((a: Types.ObjectId) => a.toString());

  Object.assign(task, req.body);
  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('createdBy', 'username profileImage')
    .populate('assignees', 'username profileImage');

  const io = getIO();
  io.to(`workspace:${(task as ITask).workspace}`).emit('task:updated', populatedTask);

  const newAssignees = task.assignees.filter((a: Types.ObjectId) => !previousAssignees.includes(a.toString()));
  if (newAssignees.length) {
    const notifications = newAssignees.map((userId: Types.ObjectId) => ({
      user: userId,
      type: NOTIFICATION_TYPES.TASK_ASSIGNED,
      title: 'New task assigned',
      message: `${req.user!.username} assigned you to "${task.title}"`,
      data: { taskId: task._id, workspaceId: (task as ITask).workspace, senderId: req.user!._id }
    }));
    await Notification.insertMany(notifications);
    notifications.forEach(n => io.to(`user:${n.user}`).emit('notification:new', n));
  }

  res.json({ success: true, data: populatedTask });
});

export const remove = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const task = await Task.findById(req.params.id) as ITask | null;
  if (!task) throw new ApiError(404, 'Task not found');
  await checkWorkspaceAccess((task as ITask).workspace.toString(), req.user!._id);

  await task.deleteOne();

  const io = getIO();
  io.to(`workspace:${(task as ITask).workspace}`).emit('task:deleted', { taskId: req.params.id });

  res.json({ success: true, message: 'Task deleted successfully' });
});

export const updateStatus = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { status } = req.body as { status: string };
  if (!Object.values(TASK_STATUS).includes(status as typeof TASK_STATUS[keyof typeof TASK_STATUS])) {
    throw new ApiError(400, 'Invalid status');
  }

  const task = await Task.findById(req.params.id) as ITask | null;
  if (!task) throw new ApiError(404, 'Task not found');
  await checkWorkspaceAccess((task as ITask).workspace.toString(), req.user!._id);

  task.status = status as TaskStatus;
  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('createdBy', 'username profileImage')
    .populate('assignees', 'username profileImage');

  const io = getIO();
  io.to(`workspace:${(task as ITask).workspace}`).emit('task:moved', populatedTask);

  res.json({ success: true, data: populatedTask });
});

export const reorder = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { tasks, workspaceId } = req.body as { tasks: Array<{ _id: string; order: number; status: TaskStatus }>; workspaceId: string };
  if (!Array.isArray(tasks)) throw new ApiError(400, 'Tasks array is required');

  await checkWorkspaceAccess(workspaceId, req.user!._id);

  const bulkOps = tasks.map(t => ({
    updateOne: { filter: { _id: t._id }, update: { $set: { order: t.order, status: t.status } } }
  }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await Task.bulkWrite(bulkOps as any);

  const io = getIO();
  io.to(`workspace:${workspaceId}`).emit('task:reordered', { tasks });

  res.json({ success: true, message: 'Tasks reordered' });
});
