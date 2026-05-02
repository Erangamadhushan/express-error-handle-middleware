
/// <reference types="jest" />
import express from "express";
import request from "supertest";
import { ApiError } from "../src/ApiError";
import { errorMiddleware } from "../src/errorMiddleware";
import { createError } from "../src/createError";

describe("errorMiddleware", () => {
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

  test("should handle unknown errors", async () => {
    const app = express();

    app.get("/error", (req, res, next) => {
      next(new ApiError("Bad Request", 400, "BAD_REQUEST"));
    });

    app.use(errorMiddleware());

    const res = await request(app).get("/error");

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Bad Request");
  });

  test("createError should create bad request error", () => {
    const error = createError.badRequest("Invalid");

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.message).toBe("Invalid");
  });
});


