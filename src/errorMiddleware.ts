import { Request, Response, NextFunction } from "express";
import { normalizeError } from "./normalizeError";
import { serializeError } from "./serializeError";
import { ErrorMiddlewareOptions } from "./types";

export const errorMiddleware =
  (options: ErrorMiddlewareOptions = {}) =>
    (err: unknown, req: Request, res: Response, next: NextFunction) => {
      if (res.headersSent) {
        next(err);
        return;
      }

      const processedError = normalizeError(err, [
        ...(options.adapters ?? []),
      ]);

      if (options.logger) {
        options.logger(processedError);
      } else {
        console.error(processedError);
      }

      res.status(processedError.statusCode).json(
        serializeError(processedError, { showStack: options.showStack }),
      );
    };