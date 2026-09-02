import { hashValue, compareValue } from "../../src/utils/hash";

describe("password hashing", () => {
  it("hashes a password and verifies the correct value", async () => {
    const hashed = await hashValue("Sup3rSecret!");
    expect(hashed).not.toBe("Sup3rSecret!");
    await expect(compareValue("Sup3rSecret!", hashed)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hashed = await hashValue("Sup3rSecret!");
    await expect(compareValue("wrong-password", hashed)).resolves.toBe(false);
  });

  it("returns false when comparing against a null/undefined hash", async () => {
    await expect(compareValue("anything", null)).resolves.toBe(false);
    await expect(compareValue("anything", undefined)).resolves.toBe(false);
  });
});
