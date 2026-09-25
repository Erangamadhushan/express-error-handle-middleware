import { ApiError } from "./ApiError";

export interface SerializedError {
  success: false;
  statusCode: number;
  message: string;
  error: string;
  code?: string;
  stack?: string;
}

export interface SerializeErrorOptions {
  isProduction?: boolean;
  showStack?: boolean;
}

export const serializeError = (
  error: ApiError,
  options: SerializeErrorOptions = {},
): SerializedError => {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === "production";
  const message = isProduction && error.statusCode >= 500
    ? "Internal Server Error"
    : error.message;

  return {
    success: false,
    statusCode: error.statusCode,
    message,
    error: error.constructor.name,
    ...(error.code && { code: error.code }),
    ...(options.showStack && !isProduction && error.stack
      ? { stack: error.stack }
      : {}),
  };
};