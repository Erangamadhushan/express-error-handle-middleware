import { ApiError } from "./ApiError";
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    InternalServerError,
    NotFoundError,
    UnauthorizedError,
    ValidationError,
} from "./errors";

export const createError = {
    badRequest: (message = "Bad request") =>
        new BadRequestError(message),

    unauthorized: (message = "Unauthorized") =>
        new UnauthorizedError(message),

    forbidden: (message = "Forbidden") =>
        new ForbiddenError(message),

    notFound: (message = "Resource not found") =>
        new NotFoundError(message),

    conflict: (message = "Conflict") =>
        new ConflictError(message),

    validation: (message = "Validation error") =>
        new ValidationError(message),

    internal: (message = "Internal Server Error") =>
        new InternalServerError(message),

    // Custom flexible error
    custom: (
        message: string,
        statusCode: number,
        code?: string
    ) => new ApiError(message, statusCode, code),
};