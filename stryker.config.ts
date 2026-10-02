import type { PartialStrykerOptions } from "@stryker-mutator/api/core";

// Scoped to the pure logic modules, where a green suite can still hide an untested condition. The Raycast-bound modules (tile.ts, storage.ts, the command entry points) need a live Raycast runtime and are covered by the manifest and type checks instead.
const config: PartialStrykerOptions = {
  packageManager: "pnpm",
  mutate: [
    "src/layouts/*.ts",
    "!src/layouts/*.test.ts",
    "src/animation.ts",
    "src/direction.ts",
    "src/filter.ts",
    "src/ordering.ts",
    "src/proximity.ts",
    "src/rects.ts",
    "src/reorder.ts",
    "src/stability.ts",
  ],
  testRunner: "vitest",
  plugins: [
    "@stryker-mutator/vitest-runner",
    "@stryker-mutator/typescript-checker",
  ],
  checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",
  // Checking mutants one at a time avoids a batched TypeScript diagnostic Stryker cannot attribute to a single file, which ends the run with a hard error.
  typescriptChecker: { prioritizePerformanceOverAccuracy: false },
  // Each mutant runs only the tests that cover it.
  coverageAnalysis: "perTest",
  incremental: true,
  ignorePatterns: ["coverage", "reports", ".raycast", "node_modules"],
  reporters: ["progress", "clear-text", "html"],
  tempDirName: ".stryker-tmp",
  cleanTempDir: true,
  thresholds: { high: 80, low: 60 },
};

export default config;
