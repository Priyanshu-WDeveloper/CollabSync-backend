import { Types } from 'mongoose';

export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  WORKSPACE_INVITE: 'workspace_invite',
  TASK_STATUS_CHANGED: 'task_status_changed',
  NEW_MESSAGE: 'new_message'
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export interface INotificationData {
  taskId?: Types.ObjectId;
  workspaceId?: Types.ObjectId;
  senderId?: Types.ObjectId;
}

export interface INotification {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  message?: string;
  read: boolean;
  data: INotificationData;
  link?: string;
  createdAt?: Date;
  updatedAt?: Date;
}