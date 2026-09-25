import { Request, Response, NextFunction } from "express";
import { normalizeError } from "./normalizeError";
import { getOrCreateRequestContext } from "./requestContext";
import { serializeError } from "./serializeError";
import type {
  ErrorLogContext,
  ErrorMiddlewareOptions,
  ErrorSerializationContext,
} from "./types";

export const errorMiddleware =
  (options: ErrorMiddlewareOptions = {}) =>
    (err: unknown, req: Request, res: Response, next: NextFunction) => {
      if (res.headersSent) {
        next(err);
        return;
      }

      const requestContext = getOrCreateRequestContext(req, res, options.requestId);
      const processedError = normalizeError(err, options.adapters ?? []);
      const isProduction = process.env.NODE_ENV === "production";
      const exposeMessage = typeof options.expose === "function"
        ? options.expose(processedError, requestContext)
        : options.expose ?? !(isProduction && processedError.statusCode >= 500);
      const serializationContext: ErrorSerializationContext = {
        ...requestContext,
        isProduction,
        exposeMessage,
        includeStack: options.showStack === true && !isProduction,
      };
      const logContext: ErrorLogContext = {
        ...requestContext,
        statusCode: processedError.statusCode,
        code: processedError.code,
        errorName: processedError.constructor.name,
      };

      if (options.logger) {
        options.logger(processedError, logContext);
      } else {
        console.error({ error: processedError, context: logContext });
      }

      const response = options.serializer
        ? options.serializer(processedError, serializationContext)
        : serializeError(processedError, {
          exposeMessage,
          format: options.responseFormat,
          showStack: options.showStack,
          context: serializationContext,
        });

      if (options.responseFormat === "problem") {
        res.type("application/problem+json");
      }

      res.status(processedError.statusCode).json(response);
    };