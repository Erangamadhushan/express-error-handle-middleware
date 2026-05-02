import { Request, Response, NextFunction } from "express";
import { ApiError } from "./ApiError";
import { ErrorMiddlewareOptions } from "./types";

export const errorMiddleware =
  (options: ErrorMiddlewareOptions = {}) =>
    (err: any, req: Request, res: Response, next: NextFunction) => {
      const isProduction = process.env.NODE_ENV === "production";

      let processedError: any = err;

      const handleMongoError = (error: any) => {
        if (error?.code === 11000) {
          const field = Object.keys(error.keyValue || {})[0];
          return new ApiError(
            `${field} already exists`,
            400,
            "DUPLICATE_FIELD"
          );
        }
        return null;
      };

      // Handle Zod validation errors
      const handleZodError = (error: any) => {
        if (error?.name === "ZodError") {
          const message = error.errors
            .map((e: any) => `${e.path.join(".")}: ${e.message}`)
            .join(", ");

          return new ApiError(message, 400, "VALIDATION_ERROR");
        }
        return null;
      };

      const mongoError = handleMongoError(err);
      if (mongoError) processedError = mongoError;

      const zodError = handleZodError(err);
      if (zodError) processedError = zodError;


      // Determine status code and message
      const statusCode =
        processedError instanceof ApiError
          ? processedError.statusCode
          : 500;

      let message =
        processedError instanceof ApiError
          ? processedError.message
          : "Internal Server Error";

      const errorName =
        processedError instanceof ApiError
          ? processedError.constructor.name
          : "Error";

      const errorCode =
        processedError instanceof ApiError
          ? processedError.code
          : undefined;
 

      // Hide stack trace in production for 500 errors
      if (isProduction && statusCode === 500) {
        message = "Internal Server Error";
      }

      // Logger
      if (options.logger) {
        options.logger(processedError);
      } else {
        console.error(processedError);
      }

      // 🔥 Final response
      res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        error: errorName,
        ...(errorCode && { code: errorCode }),
        ...(options.showStack && !isProduction
          ? { stack: processedError.stack }
          : {}),
      });
    };