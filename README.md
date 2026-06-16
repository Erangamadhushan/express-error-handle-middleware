# @erangamadhushan/express-advanced-error-kit

Advanced TypeScript-based error handling middleware for Express.js.

![npm version](https://img.shields.io/npm/v/@erangamadhushan/express-advanced-error-kit)
![npm downloads](https://img.shields.io/npm/dm/@erangamadhushan/express-advanced-error-kit)
![CI](https://img.shields.io/npm/ci/@erangamadhushan/express-advanced-error-kit)
![License](https://img.shields.io/npm/l/@erangamadhushan/express-advanced-error-kit)

---

## ✨ Features

- Async handler wrapper
- Custom `ApiError` class
- Predefined error classes (NotFound, BadRequest, etc.)
- `createError` helper for clean DX
- Global error middleware
- 404 Not Found middleware
- Logger integration (Pino, Winston, custom)
- MongoDB duplicate key smart parsing
- Zod validation error formatting
- Standardized error response structure
- Production-safe stack handling
- ESM + CommonJS support
- Full TypeScript support

---

## 📦 Installation

```bash
npm install @erangamadhushan/express-advanced-error-kit
```

## 🚀 Quick Start

```ts
import express from "express";
import {
  asyncHandler,
  createError,
  notFoundMiddleware,
  errorMiddleware,
} from "@erangamadhushan/express-advanced-error-kit";

const app = express();
app.use(express.json());

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
- Use global errorMiddleware.
- Integrate a logger in production.

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
    logger: logger.error.bind(logger),
    showStack: false,
  }),
);
```

## 📚 Middleware Order (Important)

```js
app.use(routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware());
```

## 🧩 Creating Custom Errors

### Using createError (Recommended)

```ts
import { createError } from "@erangamadhushan/express-advanced-error-kit";

throw createError.notFound("User not found");
throw createError.badRequest("Invalid input");
throw createError.unauthorized();
```

### Using ApiError

```ts
import { ApiError } from "@erangamadhushan/express-advanced-error-kit";

throw new ApiError("User not found", 404, "USER_NOT_FOUND");
```

You can extend it like this:

```ts
import { ApiError } from "@erangamadhushan/express-advanced-error-kit";

class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}
```

## ⚙️ Configuration Options

```ts
errorMiddleware(options?: {
  logger?: (error: unknown) => void;
  showStack?: boolean;
});
```

## 🛡 Production Behavior

- Stack traces hidden automatically in production
- Clean JSON response format
- Centralized error control

## 🧪 Testing

```bash
npm test
```

## 🔄 Automated Releases

- Conventional commits
- semantic-release
- GitHub Actions CI
- Automatic versioning and changelog generation

## Contributing

Contributions are welcome!

Please read CONTRIBUTING.md before opening a pull request.
