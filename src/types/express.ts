import { Request } from 'express';
import { Document } from 'mongoose';

export interface AuthenticatedRequest extends Request {
  user?: Document;
}
