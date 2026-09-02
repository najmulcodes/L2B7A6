import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const app = createApp();

// On Vercel the app is invoked per-request via the exported handler and
// app.listen() is never reached — see the module.exports guard below.
if (require.main === module) {
  const server = app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`🚀 Developer Assessment Platform API listening on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  const shutdown = async (signal: string) => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

export default app;

// Explicit CommonJS export alongside the ESM default export above, so the
// compiled dist/server.js works unambiguously as a Vercel @vercel/node
// request handler (module.exports must be directly callable as (req, res)).
/* eslint-disable @typescript-eslint/no-var-requires */
if (typeof module !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  (module as unknown as { exports: unknown }).exports = app;
  (module as unknown as { exports: { default?: unknown } }).exports.default = app;
}
