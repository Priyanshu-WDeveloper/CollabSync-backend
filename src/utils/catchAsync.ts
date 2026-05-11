import type { Request, Response, NextFunction } from 'express';

type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const catchAsync = (fn: AsyncFn) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
