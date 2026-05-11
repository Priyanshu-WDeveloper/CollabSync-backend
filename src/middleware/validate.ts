import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.ts';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    const msg = (firstError as Record<string, unknown>).msg || (firstError as Record<string, unknown>).message || 'Validation error';
    const path = (firstError as Record<string, unknown>).path || (firstError as Record<string, unknown>).param || 'field';
    throw new ApiError(400, `${path}: ${msg}`);
  }
  next();
};

export default validate;
