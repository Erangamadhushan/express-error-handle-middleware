import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import type { ErrorRequestContext, RequestIdOptions } from "./types";

const defaultHeaderName = "x-request-id";

export const createRequestContext = (
  req: Request,
  res: Response,
  options: RequestIdOptions = {},
): ErrorRequestContext => {
  const headerName = options.headerName ?? defaultHeaderName;
  const incomingRequestId = req.get(headerName)?.trim();
  const requestId = incomingRequestId || (options.generator ?? randomUUID)();

  res.setHeader(headerName, requestId);
  res.locals.requestId = requestId;

  return {
    requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    path: req.path,
  };
};

export const requestIdMiddleware = (options: RequestIdOptions = {}) => (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  createRequestContext(req, res, options);
  next();
};

export const getOrCreateRequestContext = (
  req: Request,
  res: Response,
  options: RequestIdOptions = {},
): ErrorRequestContext => {
  const existingRequestId = res.locals.requestId;
  if (typeof existingRequestId === "string" && existingRequestId.length > 0) {
    return {
      requestId: existingRequestId,
      method: req.method,
      url: req.originalUrl || req.url,
      path: req.path,
    };
  }

  return createRequestContext(req, res, options);
};