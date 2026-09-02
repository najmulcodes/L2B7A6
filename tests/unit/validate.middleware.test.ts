import { z } from "zod";
import type { Request, Response } from "express";
import { validate } from "../../src/middleware/validate.middleware";
import { ApiError } from "../../src/utils/ApiError";

describe("validate middleware", () => {
  const schema = z.object({ email: z.string().email(), age: z.number().min(18) });

  it("passes valid bodies through and normalizes them via the schema", () => {
    const req = { body: { email: "a@b.com", age: 20 } } as unknown as Request;
    const next = jest.fn();
    validate({ body: schema })(req, {} as Response, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ email: "a@b.com", age: 20 });
  });

  it("rejects invalid bodies with a 400 ApiError listing field errors", () => {
    const req = { body: { email: "not-an-email", age: 10 } } as unknown as Request;
    const next = jest.fn();
    validate({ body: schema })(req, {} as Response, next);
    const err = next.mock.calls[0][0] as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(400);
    expect(err.errors.length).toBeGreaterThanOrEqual(2);
  });
});
