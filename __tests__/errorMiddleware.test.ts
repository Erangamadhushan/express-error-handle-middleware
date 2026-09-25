
/// <reference types="jest" />
import express from "express";
import request from "supertest";
import { z } from "zod";
import { asyncHandler } from "../src/asyncHandler";
import { ApiError } from "../src/ApiError";
import { errorMiddleware } from "../src/errorMiddleware";
import { createError } from "../src/createError";
import { requestIdMiddleware } from "../src/requestContext";
import { ErrorAdapterRegistry } from "../src/types";

describe("errorMiddleware", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  test("should handle ApiError correctly", async () => {
    const app = express();

    app.get("/error", (req, res, next) => {
      next(new ApiError("Bad Request", 400, "BAD_REQUEST"));
    });

    app.use(errorMiddleware());

    const res = await request(app).get("/error");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Bad Request");
  });

  test("should normalize unknown errors as internal errors", async () => {
    const app = express();

    app.get("/error", (req, res, next) => {
      next(new Error("database credentials"));
    });

    app.use(errorMiddleware({ logger: jest.fn() }));

    const res = await request(app).get("/error");

    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      success: false,
      statusCode: 500,
      message: "Internal Server Error",
      code: "INTERNAL_ERROR",
    });
    expect(res.body.message).not.toContain("database");
  });

  test("should support custom error adapters", async () => {
    const app = express();

    app.get("/error", (req, res, next) => {
      next({ type: "domain_error", detail: "Invalid state" });
    });

    app.use(errorMiddleware({
      logger: jest.fn(),
      adapters: [
        (error) => {
          if (
            typeof error === "object" &&
            error !== null &&
            "type" in error &&
            error.type === "domain_error"
          ) {
            return new ApiError("The resource is in an invalid state", 409, "INVALID_STATE");
          }

          return undefined;
        },
      ],
    }));

    const res = await request(app).get("/error");

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      message: "The resource is in an invalid state",
      code: "INVALID_STATE",
    });
  });

  test("should reuse an incoming request ID and provide structured logger context", async () => {
    const app = express();
    const logger = jest.fn();

    app.get("/error", (req, res, next) => {
      next(new ApiError("Bad Request", 400, "BAD_REQUEST"));
    });
    app.use(errorMiddleware({ logger }));

    const res = await request(app)
      .get("/error")
      .set("x-request-id", "request-123");

    expect(res.headers["x-request-id"]).toBe("request-123");
    expect(logger).toHaveBeenCalledWith(
      expect.any(ApiError),
      expect.objectContaining({
        requestId: "request-123",
        method: "GET",
        path: "/error",
        statusCode: 400,
        code: "BAD_REQUEST",
      }),
    );
  });

  test("should generate a request ID when one is not provided", async () => {
    const app = express();

    app.get("/error", (req, res, next) => {
      next(new ApiError("Bad Request", 400, "BAD_REQUEST"));
    });
    app.use(errorMiddleware({ requestId: { generator: () => "generated-123" } }));

    const res = await request(app).get("/error");

    expect(res.headers["x-request-id"]).toBe("generated-123");
  });

  test("should add correlation IDs to successful requests", async () => {
    const app = express();

    app.use(requestIdMiddleware({ generator: () => "success-123" }));
    app.get("/success", (req, res) => {
      res.json({ ok: true });
    });

    const res = await request(app).get("/success");

    expect(res.headers["x-request-id"]).toBe("success-123");
  });

  test("should return RFC 9457-style problem details when enabled", async () => {
    const app = express();

    app.get("/error", (req, res, next) => {
      next(new ApiError("Bad Request", 400, "BAD_REQUEST"));
    });
    app.use(errorMiddleware({ responseFormat: "problem" }));

    const res = await request(app)
      .get("/error")
      .set("x-request-id", "request-456");

    expect(res.type).toBe("application/problem+json");
    expect(res.body).toMatchObject({
      type: "urn:express-error-kit:BAD_REQUEST",
      title: "ApiError",
      status: 400,
      detail: "Bad Request",
      instance: "/error",
      code: "BAD_REQUEST",
      requestId: "request-456",
    });
  });

  test("should use a custom response serializer and exposure policy", async () => {
    const app = express();
    const serializer = jest.fn((error, context) => ({
      message: context.exposeMessage ? error.message : "redacted",
      requestId: context.requestId,
    }));

    app.get("/error", (req, res, next) => {
      next(new ApiError("private details", 400, "PRIVATE_ERROR"));
    });
    app.use(errorMiddleware({ expose: false, serializer }));

    const res = await request(app).get("/error");

    expect(res.body).toMatchObject({
      message: "redacted",
      requestId: expect.any(String),
    });
    expect(serializer).toHaveBeenCalledWith(
      expect.any(ApiError),
      expect.objectContaining({ exposeMessage: false }),
    );
  });

  test("should accept adapters registered through a reusable registry", async () => {
    const registry = new ErrorAdapterRegistry().register((error) => {
      if (error instanceof Error && error.message === "known") {
        return new ApiError("Known error", 422, "KNOWN_ERROR");
      }

      return undefined;
    });
    const app = express();

    app.get("/error", (req, res, next) => {
      next(new Error("known"));
    });
    app.use(errorMiddleware({ adapters: registry }));

    const res = await request(app).get("/error");

    expect(res.status).toBe(422);
    expect(res.body.code).toBe("KNOWN_ERROR");
  });

  test("should format Zod v4 issues", async () => {
    const app = express();

    app.get("/error", () => {
      z.object({ email: z.string().email() }).parse({ email: "invalid" });
    });

    app.use(errorMiddleware({ logger: jest.fn() }));

    const res = await request(app).get("/error");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      message: expect.stringContaining("email:"),
      code: "VALIDATION_ERROR",
    });
  });

  test("should format Mongo duplicate key errors without keyValue", async () => {
    const app = express();

    app.get("/error", (req, res, next) => {
      next({ code: 11000 });
    });

    app.use(errorMiddleware({ logger: jest.fn() }));

    const res = await request(app).get("/error");

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      message: "Duplicate value",
      code: "DUPLICATE_FIELD",
    });
  });

  test("should hide internal messages and stacks in production", async () => {
    process.env.NODE_ENV = "production";
    const app = express();

    app.get("/error", (req, res, next) => {
      next(new ApiError("private details", 500, "PRIVATE_ERROR"));
    });

    app.use(errorMiddleware({ logger: jest.fn(), showStack: true }));

    const res = await request(app).get("/error");

    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Internal Server Error");
    expect(res.body.stack).toBeUndefined();
  });

  test("should forward errors when headers were already sent", () => {
    const next = jest.fn();
    const response = { headersSent: true } as unknown as express.Response;

    errorMiddleware()(new Error("already sent"), {} as express.Request, response, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test("createError should create bad request error", () => {
    const error = createError.badRequest("Invalid");

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.message).toBe("Invalid");
  });

  test("asyncHandler should forward synchronous throws", async () => {
    const app = express();

    app.get("/error", asyncHandler(() => {
      throw new Error("synchronous failure");
    }));
    app.use(errorMiddleware({ logger: jest.fn() }));

    const res = await request(app).get("/error");

    expect(res.status).toBe(500);
    expect(res.body.code).toBe("INTERNAL_ERROR");
  });
});


