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
}

export interface AuthenticatedRequest extends Record<string, any> {
  user?: IAuthenticatedUser;
  params: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, any>;
  headers: Record<string, string>;
}
