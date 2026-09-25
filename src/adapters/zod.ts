import { ApiError } from "../ApiError";
import type { ErrorAdapter } from "../types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const zodErrorAdapter: ErrorAdapter = (error) => {
  if (!isRecord(error) || error.name !== "ZodError" || !Array.isArray(error.issues)) {
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