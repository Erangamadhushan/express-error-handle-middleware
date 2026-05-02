import { ApiError } from "./ApiError";

export const createError = {
    badRequest: (message = "Bad request") =>
        new ApiError(message, 400, "BAD_REQUEST"),

    unauthorized: (message = "Unauthorized") =>
        new ApiError(message, 401, "UNAUTHORIZED"),

    forbidden: (message = "Forbidden") =>
        new ApiError(message, 403, "FORBIDDEN"),

    notFound: (message = "Resource not found") =>
        new ApiError(message, 404, "NOT_FOUND"),

    conflict: (message = "Conflict") =>
        new ApiError(message, 409, "CONFLICT"),

    validation: (message = "Validation error") =>
        new ApiError(message, 400, "VALIDATION_ERROR"),

    internal: (message = "Internal Server Error") =>
        new ApiError(message, 500, "INTERNAL_ERROR"),

    // Custom flexible error
    custom: (
        message: string,
        statusCode: number,
        code?: string
    ) => new ApiError(message, statusCode, code),
};