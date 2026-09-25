import { ApiError } from "../ApiError";
import type { ErrorAdapter } from "../types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const mongoDuplicateKeyAdapter: ErrorAdapter = (error) => {
  if (!isRecord(error) || error.code !== 11000) {
    return undefined;
  }

  const keyValue = isRecord(error.keyValue) ? error.keyValue : undefined;
  const field = keyValue ? Object.keys(keyValue)[0] : undefined;
  const message = field ? `${field} already exists` : "Duplicate value";

  return new ApiError(message, 400, "DUPLICATE_FIELD");
};