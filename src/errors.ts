import { ApiError } from "./ApiError";

export class NotFoundError extends ApiError {
    constructor(message = "Resource not found") {
        super(message, 404, "NOT_FOUND");
    }
}

export class BadRequestError extends ApiError {
    constructor(message = "Bad request") {
        super(message, 400, "BAD_REQUEST");
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message = "Unauthorized") {
        super(message, 401, "UNAUTHORIZED");
    }
}

export class ForbiddenError extends ApiError {
    constructor(message = "Forbidden") {
        super(message, 403, "FORBIDDEN");
    }
}

export class ConflictError extends ApiError {
    constructor(message = "Conflict") {
        super(message, 409, "CONFLICT");
    }
}

export class ValidationError extends ApiError {
    constructor(message = "Validation error") {
        super(message, 400, "VALIDATION_ERROR");
    }
}

export class InternalServerError extends ApiError {
    constructor(message = "Internal Server Error") {
        super(message, 500, "INTERNAL_ERROR");
    }
}