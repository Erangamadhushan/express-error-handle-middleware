import { Request, Response, NextFunction } from "express";
import { ApiError } from "./ApiError";

export const notFoundMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  next(new ApiError("Route not found", 404, "NOT_FOUND"));
};
