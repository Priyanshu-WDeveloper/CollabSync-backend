import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.ts';
import { AuthenticatedRequest } from '../types/express.ts';

const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error: ApiError = err as ApiError;
  error.message = err.message;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const validationError = err as unknown as { errors: Record<string, { message: string }> };
    const message = Object.values(validationError.errors).map(val => val.message).join(', ');
    error = new ApiError(400, message);
  }

  // Mongoose duplicate key error
  if ((err as unknown as { code?: number }).code === 11000) {
    const duplicateError = err as unknown as { keyValue?: Record<string, string> };
    const field = Object.keys(duplicateError.keyValue || {})[0];
    error = new ApiError(400, `${field} already exists.`);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    error = new ApiError(400, 'Invalid ID format.');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token.');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired.');
  }

  // ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
    return;
  }

  // Default error
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error.'
  });
};

export default errorHandler;