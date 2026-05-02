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