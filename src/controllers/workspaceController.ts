import { Response } from 'express';
import { body } from 'express-validator';
import { Workspace } from '../models/index.ts';
import { USER_ROLES } from '../utils/constants.ts';
import { ApiError } from '../utils/ApiError.ts';
import { catchAsync } from '../utils/catchAsync.ts';
import { AuthenticatedRequest } from '../types/express.ts';

export const createValidation = [
  body('name').trim().notEmpty().withMessage('Workspace name is required')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters')
];

export const updateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('description').optional().trim().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters')
];

interface CreateBody {
  name: string;
  description?: string;
}

export const create = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { name, description } = req.body as CreateBody;

  const workspace = await Workspace.create({
    name,
    description,
    owner: req.user!._id,
    members: [{ user: req.user!._id, role: USER_ROLES.ADMIN }]
  });

  res.status(201).json({
    success: true,
    data: workspace
  });
});

export const getAll = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const total = await Workspace.countDocuments({
    $or: [
      { owner: req.user!._id },
      { 'members.user': req.user!._id }
    ]
  });

  const workspaces = await Workspace.find({
    $or: [
      { owner: req.user!._id },
      { 'members.user': req.user!._id }
    ]
  }).populate('owner', 'username email profileImage')
    .populate('members.user', 'username email profileImage')
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    count: workspaces.length,
    data: workspaces,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) }
  });
});

export const getOne = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const workspace = await Workspace.findById(req.params.id)
    .populate('owner', 'username email profileImage')
    .populate('members.user', 'username email profileImage isOnline');

  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  console.log('[getOne] workspace.owner:', workspace.owner);
  console.log('[getOne] typeof workspace.owner:', typeof workspace.owner);
  console.log('[getOne] req.user._id:', req.user!._id.toString());

  let ownerId: string;
  if (typeof workspace.owner === 'object' && workspace.owner !== null) {
    ownerId = (workspace.owner as any)._id?.toString() || workspace.owner.toString();
  } else {
    ownerId = workspace.owner.toString();
  }
  console.log('[getOne] computed ownerId:', ownerId);
  console.log('[getOne] isMember check:', workspace.isMember(req.user!._id));

  if (ownerId !== req.user!._id.toString() && !workspace.isMember(req.user!._id)) {
    throw new ApiError(403, 'You are not a member of this workspace');
  }

  res.json({
    success: true,
    data: workspace
  });
});

export const update = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const workspace = await Workspace.findById(req.params.id);

  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  if (!workspace.canManage(req.user!._id)) {
    throw new ApiError(403, 'Only owner or admin can update workspace');
  }

  const { name, description } = req.body as CreateBody;
  if (name) workspace.name = name;
  if (description !== undefined) workspace.description = description;

  await workspace.save();

  res.json({
    success: true,
    data: workspace
  });
});

export const remove = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const workspace = await Workspace.findById(req.params.id);

  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  if (!workspace.isOwner(req.user!._id)) {
    throw new ApiError(403, 'Only owner can delete workspace');
  }

  await workspace.deleteOne();

  res.json({
    success: true,
    message: 'Workspace deleted successfully'
  });
});

export const generateInvite = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const workspace = await Workspace.findById(req.params.id);

  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  if (!workspace.canManage(req.user!._id)) {
    throw new ApiError(403, 'Only owner or admin can generate invite');
  }

  const code = workspace.generateInviteCode();
  await workspace.save();

  res.json({
    success: true,
    data: { code, expiresAt: workspace.inviteCodeExpires }
  });
});

export const joinViaInvite = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { code } = req.body as { code: string };

  const workspace = await Workspace.findOne({
    inviteCode: code,
    inviteCodeExpires: { $gt: new Date() }
  });

  if (!workspace) {
    throw new ApiError(400, 'Invalid or expired invite code');
  }

  if (workspace.isOwner(req.user!._id) || workspace.isMember(req.user!._id)) {
    throw new ApiError(400, 'You are already a member of this workspace');
  }

  workspace.members.push({ user: req.user!._id, role: USER_ROLES.MEMBER, joinedAt: new Date() });
  await workspace.save();

  res.json({
    success: true,
    message: 'Joined workspace successfully',
    data: workspace
  });
});

export const removeMember = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const workspace = await Workspace.findById(req.params.id);

  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  if (!workspace.canManage(req.user!._id)) {
    throw new ApiError(403, 'Only owner or admin can remove members');
  }

  if (req.params.userId === req.user!._id.toString()) {
    throw new ApiError(400, 'You cannot remove yourself');
  }

  workspace.members = workspace.members.filter(
    m => m.user.toString() !== req.params.userId
  );
  await workspace.save();

  res.json({
    success: true,
    message: 'Member removed successfully'
  });
});

export const updateMemberRole = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const { role } = req.body as { role: string };
  const workspace = await Workspace.findById(req.params.id);

  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  if (!workspace.isOwner(req.user!._id)) {
    throw new ApiError(403, 'Only owner can change member roles');
  }

  const member = workspace.members.find(m => m.user.toString() === req.params.userId);
  if (!member) {
    throw new ApiError(404, 'Member not found');
  }

  if (!Object.values(USER_ROLES).includes(role as typeof USER_ROLES[keyof typeof USER_ROLES])) {
    throw new ApiError(400, 'Invalid role');
  }

  member.role = role as typeof USER_ROLES[keyof typeof USER_ROLES];
  await workspace.save();

  res.json({
    success: true,
    data: workspace
  });
});