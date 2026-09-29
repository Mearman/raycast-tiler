import type { PartialStrykerOptions } from "@stryker-mutator/api/core";

// The command runner, not @stryker-mutator/vitest-runner: vitest-runner crashes on init against vitest 5 serialising vitest's own resolved config (the same confirmed upstream incompatibility documented in ExaDev/agent-comms's stryker.config.ts). The command runner re-runs the whole suite per mutant, so it loses per-test coverage analysis but produces a real result. Revisit once vitest-runner supports vitest 5.
//
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
    "src/reorder.ts",
  ],
  testRunner: "command",
  commandRunner: { command: "pnpm exec vitest run" },
  plugins: ["@stryker-mutator/typescript-checker"],
  checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",
  // Checking mutants one at a time avoids a batched TypeScript diagnostic Stryker cannot attribute to a single file, which ends the run with a hard error.
  typescriptChecker: { prioritizePerformanceOverAccuracy: false },
  // The command runner only sees an exit code, so Stryker has no per-test signal to analyse coverage from and forces this to "off" regardless.
  coverageAnalysis: "off",
  incremental: true,
  ignorePatterns: ["coverage", "reports", ".raycast", "node_modules"],
  reporters: ["progress", "clear-text", "html"],
  tempDirName: ".stryker-tmp",
  cleanTempDir: true,
  thresholds: { high: 80, low: 60 },
};

export default config;
