import { ApiError } from "./ApiError";
import { mongoDuplicateKeyAdapter, zodErrorAdapter } from "./adapters/index";
import type { ErrorAdapter } from "./types";

const defaultAdapters: readonly ErrorAdapter[] = [
  mongoDuplicateKeyAdapter,
  zodErrorAdapter,
];

export const normalizeError = (
  error: unknown,
  adapters: readonly ErrorAdapter[] = [],
): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  for (const adapter of [...adapters, ...defaultAdapters]) {
    const normalizedError = adapter(error);
    if (normalizedError) {
      return normalizedError;
    }
  }

  return new ApiError("Internal Server Error", 500, "INTERNAL_ERROR");
};