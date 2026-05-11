import { Types } from 'mongoose';

export const USER_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export interface IMember {
  user: Types.ObjectId;
  role: UserRole;
  joinedAt?: Date;
}

export interface IWorkspace {
  name: string;
  description?: string;
  owner: Types.ObjectId;
  members: IMember[];
  inviteCode?: string | null;
  inviteCodeExpires?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IWorkspaceMethods {
  generateInviteCode(): string;
  isOwner(userId: Types.ObjectId | string): boolean;
  isMember(userId: Types.ObjectId | string): boolean;
  getMemberRole(userId: Types.ObjectId | string): UserRole | null;
  canManage(userId: Types.ObjectId | string): boolean;
}

export const WORKSPACE_INVITE_CODE_LENGTH = 8;