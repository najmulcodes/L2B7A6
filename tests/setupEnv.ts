process.env.NODE_ENV = "test";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://user:pass@localhost:5432/devassess_test";
process.env.JWT_ACCESS_SECRET = "test-access-secret-please-ignore";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-please-ignore";
process.env.BCRYPT_SALT_ROUNDS = "4"; // fast hashing in tests
process.env.ADMIN_EMAIL = "admin@devassess.com";
process.env.ADMIN_PASSWORD = "ChangeMe123!";
