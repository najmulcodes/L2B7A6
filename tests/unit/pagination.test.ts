import { parsePagination, buildMeta } from "../../src/lib/pagination";

describe("parsePagination", () => {
  it("defaults to page 1, limit 10 when nothing is provided", () => {
    const result = parsePagination({});
    expect(result).toEqual({ page: 1, limit: 10, skip: 0, take: 10 });
  });

  it("parses valid page/limit values", () => {
    const result = parsePagination({ page: "3", limit: "20" });
    expect(result).toEqual({ page: 3, limit: 20, skip: 40, take: 20 });
  });

  it("clamps limit to a maximum of 100", () => {
    const result = parsePagination({ limit: "5000" });
    expect(result.limit).toBe(100);
  });

  it("floors page at 1 for zero/negative input", () => {
    expect(parsePagination({ page: "0" }).page).toBe(1);
    expect(parsePagination({ page: "-5" }).page).toBe(1);
  });

  it("falls back to defaults for non-numeric input", () => {
    const result = parsePagination({ page: "abc", limit: "xyz" });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });
});

describe("buildMeta", () => {
  it("computes totalPages correctly", () => {
    expect(buildMeta(1, 10, 95)).toEqual({ page: 1, limit: 10, total: 95, totalPages: 10 });
  });

  it("returns at least 1 total page when total is 0", () => {
    expect(buildMeta(1, 10, 0)).toEqual({ page: 1, limit: 10, total: 0, totalPages: 1 });
  });
});
