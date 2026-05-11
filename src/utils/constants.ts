export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  DONE: 'done'
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

export const USER_ROLES = {
  ADMIN: 'admin',
  MEMBER: 'member'
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  WORKSPACE_INVITE: 'workspace_invite',
  TASK_STATUS_CHANGED: 'task_status_changed',
  NEW_MESSAGE: 'new_message'
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

export const WORKSPACE_INVITE_CODE_LENGTH = 8;