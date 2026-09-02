import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["cjs", "esm"],
  target: "esnext",
  outDir: "dist",
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: true,
  dts: false,
  skipNodeModulesBundle: true,
  // Shim require() for CJS-only deps when the ESM output is loaded.
  // Only valid for the esm format — injecting `import` syntax into the
  // cjs bundle would break `require('./dist/server.js')`.
  banner: (ctx) => {
    if (ctx.format === "esm") {
      return {
        js: `import { createRequire as __topLevelCreateRequire } from 'module';\nconst require = __topLevelCreateRequire(import.meta.url);`,
      };
    }
    return {};
  },
});
