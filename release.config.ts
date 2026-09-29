import type { Options } from "semantic-release";

type ReleaseLevel = "major" | "minor" | "patch";

interface CommitType {
  readonly type: string;
  readonly release: ReleaseLevel;
  /** Heading for this type in the changelog and release notes. */
  readonly section: string;
}

/**
 * Single source of truth for the conventional-commit types this project uses. Commitlint's allowed types (`commitlint.config.ts` imports this), the release rules and the changelog sections all derive from it, so a type cannot trigger a release without being allowed in a commit and listed in the changelog.
 *
 * Every type releases: a docs, test, build or chore commit still changes what the repository contains, and a changelog that hid them would leave releases with nothing under them.
 */
export const commitTypes: readonly CommitType[] = [
  { type: "feat", release: "minor", section: "Features" },
  { type: "fix", release: "patch", section: "Bug Fixes" },
  { type: "perf", release: "patch", section: "Performance Improvements" },
  { type: "revert", release: "patch", section: "Reverts" },
  { type: "refactor", release: "patch", section: "Code Refactoring" },
  { type: "docs", release: "patch", section: "Documentation" },
  { type: "style", release: "patch", section: "Styles" },
  { type: "test", release: "patch", section: "Tests" },
  { type: "build", release: "patch", section: "Build System" },
  { type: "ci", release: "patch", section: "Continuous Integration" },
  { type: "chore", release: "patch", section: "Miscellaneous Chores" },
];

/**
 * Runs on `main`. Analyses the commits since the last tag, bumps the version, writes the changelog, creates the tag and GitHub Release, and commits `CHANGELOG.md` and `package.json`.
 *
 * The npm plugin only bumps the version. The package reaches GitHub Packages through the alias job in `.github/workflows/ci.yml`, which needs the scoped name that GitHub Packages requires.
 */
const config: Options = {
  branches: ["main"],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { breaking: true, release: "major" },
          ...commitTypes.map(({ type, release }) => ({ type, release })),
        ],
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: commitTypes.map(({ type, section }) => ({ type, section })),
        },
      },
    ],
    "@semantic-release/changelog",
    ["@semantic-release/npm", { npmPublish: false }],
    "@semantic-release/github",
    [
      "@semantic-release/git",
      {
        assets: ["CHANGELOG.md", "package.json"],
        message: "chore(release): ${nextRelease.version} [skip ci]",
      },
    ],
  ],
};

export default config;
