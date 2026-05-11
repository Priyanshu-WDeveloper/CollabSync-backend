import { Document } from 'mongoose';

export interface AuthenticatedRequest extends Record<string, any> {
  user?: Document;
  params: Record<string, string>;
  query: Record<string, string>;
  body: Record<string, any>;
  headers: Record<string, string>;
}
