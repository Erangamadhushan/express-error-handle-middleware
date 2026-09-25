import { ApiError } from "./ApiError";
import { mongoDuplicateKeyAdapter, zodErrorAdapter } from "./adapters/index";
import { ErrorAdapterRegistry } from "./types";
import type { ErrorAdapter } from "./types";

const defaultAdapters: readonly ErrorAdapter[] = [
  mongoDuplicateKeyAdapter,
  zodErrorAdapter,
];

export const normalizeError = (
  error: unknown,
  adapters: readonly ErrorAdapter[] | ErrorAdapterRegistry = [],
): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  const registeredAdapters = adapters instanceof ErrorAdapterRegistry
    ? adapters.getAdapters()
    : adapters;

  for (const adapter of [...registeredAdapters, ...defaultAdapters]) {
    const normalizedError = adapter(error);
    if (normalizedError) {
      return normalizedError;
    }
  }

  return new ApiError("Internal Server Error", 500, "INTERNAL_ERROR");
};