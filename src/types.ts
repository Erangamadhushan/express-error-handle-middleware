import type { ApiError } from "./ApiError";

export type ErrorAdapter = (error: unknown) => ApiError | undefined;

export interface ErrorMiddlewareOptions {
  logger?: (error: unknown) => void;
  showStack?: boolean;
  adapters?: readonly ErrorAdapter[];
}
