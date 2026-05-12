import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.ts';
import { catchAsync } from '../utils/catchAsync.ts';
import { AuthenticatedRequest, IAuthenticatedUser } from '../types/index.ts';
import User from '../models/User.ts';

export const authenticate = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(401, 'Access denied. No token provided.');
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };
      const user = await User.findById(decoded.id);

      if (!user) {
        throw new ApiError(401, 'User no longer exists.');
      }

      req.user = user as unknown as IAuthenticatedUser;
      next();
    } catch {
      throw new ApiError(401, 'Invalid or expired token.');
    }
  },
);

export const optionalAuth = catchAsync(
  async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) => {
    let token: string | undefined;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET!,
        ) as { id: string };
        req.user = (await User.findById(decoded.id)) as unknown as IAuthenticatedUser ?? undefined;
      } catch {
        // Token invalid, continue without user
      }
    }

    next();
  },
);

export default { authenticate, optionalAuth };
