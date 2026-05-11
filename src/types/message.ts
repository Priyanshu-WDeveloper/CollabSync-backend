import { Types } from 'mongoose';

export interface IMessageAttachment {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface IMessage {
  workspace: Types.ObjectId;
  sender: Types.ObjectId;
  content: string;
  attachments: IMessageAttachment[];
  createdAt?: Date;
  updatedAt?: Date;
}