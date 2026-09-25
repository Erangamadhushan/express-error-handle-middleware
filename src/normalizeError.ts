import { ApiError } from "./ApiError";

type ErrorRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is ErrorRecord =>
  typeof value === "object" && value !== null;

const normalizeMongoError = (error: ErrorRecord): ApiError | undefined => {
  if (error.code !== 11000) {
    return undefined;
  }

  const keyValue = isRecord(error.keyValue) ? error.keyValue : undefined;
  const field = keyValue ? Object.keys(keyValue)[0] : undefined;
  const message = field ? `${field} already exists` : "Duplicate value";

  return new ApiError(message, 400, "DUPLICATE_FIELD");
};

const normalizeZodError = (error: ErrorRecord): ApiError | undefined => {
  if (error.name !== "ZodError" || !Array.isArray(error.issues)) {
    return undefined;
  }

  const message = error.issues
    .map((issue) => {
      if (!isRecord(issue)) {
        return String(issue);
      }

      const path = Array.isArray(issue.path) ? issue.path.join(".") : "";
      return path ? `${path}: ${String(issue.message)}` : String(issue.message);
    })
    .join(", ");

  return new ApiError(message || "Validation error", 400, "VALIDATION_ERROR");
};

export const normalizeError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (isRecord(error)) {
    return (
      normalizeMongoError(error) ??
      normalizeZodError(error) ??
      new ApiError("Internal Server Error", 500, "INTERNAL_ERROR")
    );
  }

  return new ApiError("Internal Server Error", 500, "INTERNAL_ERROR");
};