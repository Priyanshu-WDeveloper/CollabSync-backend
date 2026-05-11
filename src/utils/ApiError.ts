export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const badRequest = (message: string) => new ApiError(400, message);
export const unauthorized = (message: string) => new ApiError(401, message || 'Unauthorized');
export const forbidden = (message: string) => new ApiError(403, message || 'Forbidden');
export const notFound = (message: string) => new ApiError(404, message || 'Resource not found');
export const conflict = (message: string) => new ApiError(409, message || 'Conflict');
export const serverError = (message: string) => new ApiError(500, message || 'Internal server error');

export default ApiError;