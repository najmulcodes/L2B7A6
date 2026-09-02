import bcrypt from "bcryptjs";
import { env } from "../config/env";

export async function hashValue(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.BCRYPT_SALT_ROUNDS);
}

export async function compareValue(plain: string, hashed: string | null | undefined): Promise<boolean> {
  if (!hashed) return false;
  return bcrypt.compare(plain, hashed);
}
