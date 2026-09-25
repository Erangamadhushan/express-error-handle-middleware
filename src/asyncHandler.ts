import { Request, Response, NextFunction } from "express";

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) =>
    Promise<unknown> | unknown,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve().then(() => fn(req, res, next)).catch(next);
  };
};
