import { Types, Document } from 'mongoose';

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  DONE: 'done'
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

export interface IAttachment {
  url: string;
  filename: string;
  uploadedAt: Date;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  workspace: Types.ObjectId;
  assignees: Types.ObjectId[];
  attachments: IAttachment[];
  dueDate?: Date;
  order: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
