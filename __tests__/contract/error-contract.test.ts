/// <reference types="jest" />
import { readFileSync } from "node:fs";
import { join } from "node:path";
import express from "express";
import request from "supertest";
import { ApiError } from "../../src/ApiError";
import { errorMiddleware } from "../../src/errorMiddleware";

type ErrorContractFixture = {
  badRequest: Record<string, unknown>;
  unknown: Record<string, unknown>;
};

const fixture = JSON.parse(
  readFileSync(
    join(process.cwd(), "__tests__", "fixtures", "error-contract.json"),
    "utf8",
  ),
) as ErrorContractFixture;

describe("public error contract", () => {
  test("keeps the legacy ApiError response shape stable", async () => {
    const app = express();

    app.get("/error", (req, res, next) => {
      next(new ApiError("Invalid input", 400, "BAD_REQUEST"));
    });
    app.use(errorMiddleware({ logger: jest.fn() }));

    const response = await request(app).get("/error");

    expect(response.body).toEqual(fixture.badRequest);
  });

  test("does not expose unknown error details", async () => {
    const app = express();

    app.get("/error", (req, res, next) => {
      next(new Error("private implementation detail"));
    });
    app.use(errorMiddleware({ logger: jest.fn() }));

    const response = await request(app).get("/error");

    expect(response.body).toEqual(fixture.unknown);
  });
});
