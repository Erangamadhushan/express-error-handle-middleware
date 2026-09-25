import { ApiError } from "./ApiError";
import type {
  ErrorResponseFormat,
  ErrorSerializationContext,
} from "./types";

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
  exposeMessage?: boolean;
  format?: ErrorResponseFormat;
  context?: ErrorSerializationContext;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  requestId?: string;
}

export const serializeError = (
  error: ApiError,
  options: SerializeErrorOptions = {},
): SerializedError | ProblemDetails => {
  const isProduction = options.isProduction ?? process.env.NODE_ENV === "production";
  const exposeMessage = options.exposeMessage ?? !(isProduction && error.statusCode >= 500);
  const message = exposeMessage ? error.message : "Internal Server Error";
  const includeStack = options.showStack === true && !isProduction;

  if (options.format === "problem") {
    const problem: ProblemDetails = {
      type: error.code ? `urn:express-error-kit:${error.code}` : "about:blank",
      title: error.constructor.name,
      status: error.statusCode,
      ...(message && { detail: message }),
      ...(options.context?.url && { instance: options.context.url }),
      ...(error.code && { code: error.code }),
      ...(options.context?.requestId && { requestId: options.context.requestId }),
    };

    return problem;
  }

  return {
    success: false,
    statusCode: error.statusCode,
    message,
    error: error.constructor.name,
    ...(error.code && { code: error.code }),
    ...(includeStack && error.stack
      ? { stack: error.stack }
      : {}),
  };
};