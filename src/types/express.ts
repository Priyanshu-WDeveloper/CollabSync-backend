import { Request } from 'express';
import { Types } from 'mongoose';

export interface IAuthenticatedUser {
  _id: Types.ObjectId;
  username: string;
  email: string;
  profileImage?: string | null;
  isOnline: boolean;
  lastSeen: Date;
  createdAt: Date;
  updatedAt: Date;
  save(): Promise<IAuthenticatedUser>;
}

export interface AuthenticatedRequest extends Request {
  user?: IAuthenticatedUser;
}
