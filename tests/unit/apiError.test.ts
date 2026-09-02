import { ApiError } from "../../src/utils/ApiError";

describe("ApiError", () => {
  it("sets statusCode and message on the base constructor", () => {
    const err = new ApiError(418, "I'm a teapot");
    expect(err.statusCode).toBe(418);
    expect(err.message).toBe("I'm a teapot");
    expect(err.isOperational).toBe(true);
  });

  it.each([
    ["badRequest", 400],
    ["unauthorized", 401],
    ["forbidden", 403],
    ["notFound", 404],
    ["conflict", 409],
    ["unprocessable", 422],
    ["tooManyRequests", 429],
    ["internal", 500],
  ] as const)("%s() produces status %d", (method, expectedStatus) => {
    const err = (ApiError[method] as () => ApiError)();
    expect(err.statusCode).toBe(expectedStatus);
    expect(err).toBeInstanceOf(ApiError);
  });

  it("carries validation error details", () => {
    const errors = [{ path: "email", message: "Invalid email" }];
    const err = ApiError.badRequest("Validation failed", errors);
    expect(err.errors).toEqual(errors);
  });
});
