# @erangamadhushan/express-error-handle-middleware

Advanced TypeScript-based error handling middleware for Express.js.

![npm version](https://img.shields.io/npm/v/@erangamadhushan/express-error-handle-middleware)
![npm downloads](https://img.shields.io/npm/dm/@erangamadhushan/express-error-handle-middleware)
![CI](https://img.shields.io/npm/ci/@erangamadhushan/express-error-handle-middleware)
![License](https://img.shields.io/npm/l/@erangamadhushan/express-error-handle-middleware)

---

## ✨ Features

- Async handler wrapper
- Custom `ApiError` class
- Predefined error classes (NotFound, BadRequest, etc.)
- `createError` helper for clean DX
- Global error middleware
- 404 Not Found middleware
- Logger integration (Pino, Winston, custom)
- Request ID and correlation metadata
- Structured logger context
- Custom error adapters
- Reusable adapter registry
- MongoDB duplicate key smart parsing
- Zod validation error formatting
- Standardized error response structure
- RFC 9457-style problem details
- Custom response serializers
- Configurable message exposure
- Production-safe stack handling
- ESM + CommonJS support
- Full TypeScript support

---

## 📦 Installation

```bash
npm install @erangamadhushan/express-error-handle-middleware
```

## Compatibility

- Node.js 18.18 or newer
- Express 4.18 or newer, including Express 5
- Zod 4 is optional and only required when using Zod validation errors

Express is a peer dependency because the middleware uses the host application's Express runtime. The package does not bundle Express, Zod, or other runtime dependencies.

## 🚀 Quick Start

```ts
import express from "express";
import {
  asyncHandler,
  createError,
  notFoundMiddleware,
  errorMiddleware,
  requestIdMiddleware,
} from "@erangamadhushan/express-error-handle-middleware";

const app = express();
app.use(express.json());
app.use(requestIdMiddleware());

app.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    if (req.params.id !== "1") {
      throw createError.notFound("User not found");
    }

    res.json({ id: 1, name: "John" });
  }),
);

app.use(notFoundMiddleware);
app.use(errorMiddleware());

app.listen(5000);
```

## 🧠 Recommended Workflow

- Wrap all controllers using asyncHandler.
- Throw errors using createError.* (recommended) or ApiError.
- Add requestIdMiddleware near the start of the application.
- Use global errorMiddleware.
- Integrate a logger in production.
- Use problem details or a custom serializer when an API-specific response contract is required.

## 🧩 Error Creation Options

### Using createError (Recommended)

```ts
throw createError.badRequest("Invalid input");
throw createError.notFound("User not found");
throw createError.unauthorized();
```

### Using ApiError

```ts
throw new ApiError("User not found", 404, "USER_NOT_FOUND");
```

### Using Predefined Classes

```ts
import { NotFoundError } from "...";

throw new NotFoundError("User not found");
```

## 📤 Response Format

All errors follow a consistent structure:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "User not found",
  "error": "NotFoundError",
  "code": "NOT_FOUND"
}
```

The legacy response format is the default for compatibility. Enable RFC 9457-style responses with `responseFormat: "problem"`:

```json
{
  "type": "urn:express-error-kit:NOT_FOUND",
  "title": "NotFoundError",
  "status": 404,
  "detail": "User not found",
  "instance": "/users/42",
  "code": "NOT_FOUND",
  "requestId": "request-123"
}
```

## 🧠 Smart MongoDB Error Handling

### Duplicate key errors are automatically formatted

```ts
// Mongo duplicate key error
{
  code: 11000,
  keyValue: { email: "test@example.com" }
}
```

Response:

```json
{
  "success": false,
  "message": "email already exists",
  "code": "DUPLICATE_FIELD"
}
```

## 🧾 Zod Validation Formatting

If using Zod:

```ts
throw new ZodError([...]);
```

Response:

```json
{
  "success": false,
  "message": "email: Expected string",
  "code": "VALIDATION_ERROR"
}
```

## 🪵 Logger Integration

Use any logger:

```ts
import pino from "pino";

const logger = pino();

app.use(
  errorMiddleware({
    logger: (error, context) => logger.error({ error, ...context }),
    showStack: false,
  }),
);
```

The logger receives the normalized error and structured request context containing `requestId`, `method`, `url`, `path`, `statusCode`, `code`, and `errorName`.

## 📚 Middleware Order (Important)

```js
app.use(routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware());
```

## 🧩 Creating Custom Errors

### Using createError (Recommended)

```ts
import { createError } from "@erangamadhushan/express-error-handle-middleware";

throw createError.notFound("User not found");
throw createError.badRequest("Invalid input");
throw createError.unauthorized();
```

### Using ApiError

```ts
import { ApiError } from "@erangamadhushan/express-error-handle-middleware";

throw new ApiError("User not found", 404, "USER_NOT_FOUND");
```

You can extend it like this:

```ts
import { ApiError } from "@erangamadhushan/express-error-handle-middleware";

class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}
```

## ⚙️ Configuration Options

```ts
errorMiddleware(options?: {
  logger?: (error: unknown, context: ErrorLogContext) => void;
  showStack?: boolean;
  expose?: boolean | ((error: ApiError, context: ErrorRequestContext) => boolean);
  responseFormat?: "legacy" | "problem";
  serializer?: (error: ApiError, context: ErrorSerializationContext) => unknown;
  requestId?: {
    headerName?: string;
    generator?: () => string;
  };
  adapters?: readonly ErrorAdapter[] | ErrorAdapterRegistry;
});
```

Request IDs are read from `x-request-id` by default, generated when absent, returned in the response header, and exposed through the logger and serializer context. Use `requestIdMiddleware()` near the start of the application to correlate successful requests as well as failures. Set `responseFormat: "problem"` for an RFC 9457-style response with `application/problem+json` content type.

Use `expose` to control whether an error message is returned. In production, 500-level messages are hidden by default.

Custom adapters can map application or library errors to `ApiError` instances. They run before the built-in MongoDB and Zod adapters.

```ts
import {
  ApiError,
  errorMiddleware,
} from "@erangamadhushan/express-error-handle-middleware";

const domainErrorAdapter = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    error.type === "domain_error"
  ) {
    return new ApiError("The resource is in an invalid state", 409, "INVALID_STATE");
  }

  return undefined;
};

app.use(errorMiddleware({ adapters: [domainErrorAdapter] }));
```

For shared application configuration, register adapters once and reuse the registry:

```ts
const adapters = new ErrorAdapterRegistry()
  .register(domainErrorAdapter);

app.use(errorMiddleware({ adapters }));
```

## 🛡 Production Behavior

- Stack traces hidden automatically in production
- 500-level messages hidden automatically in production
- Request IDs returned through the response header
- Structured context available to loggers and serializers
- Clean legacy JSON or problem-details response formats
- Centralized error normalization and exposure control

## 🧪 Testing

```bash
npm ci
npm run typecheck
npm run test:ci
npm run build
npm run smoke:package
```

## Docker Validation

The repository Dockerfile is a reproducible validation image for contributors and CI. It runs the typecheck, test suite, package build, and packed-package smoke test; it is not a production runtime image because this project publishes an npm library rather than an Express application.

```bash
docker build --tag express-error-handle-middleware-validation .
docker run --rm express-error-handle-middleware-validation
```

## 🔄 Automated Releases

- Conventional commits
- semantic-release
- GitHub Actions CI
- Automatic versioning and changelog generation

## Contributing

Contributions are welcome!

Please read CONTRIBUTING.md before opening a pull request.

## Engineering Documents

- [Architecture](ARCHITECTURE.md)
- [Error contract ADR](ADRs/001-error-contract.md)
- [Adapter system ADR](ADRs/002-adapter-system.md)
- [Compatibility matrix](COMPATIBILITY.md)
