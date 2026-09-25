
/// <reference types="jest" />
import express from "express";
import request from "supertest";
import { z } from "zod";
import { asyncHandler } from "../src/asyncHandler";
import { ApiError } from "../src/ApiError";
import { errorMiddleware } from "../src/errorMiddleware";
import { createError } from "../src/createError";

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


