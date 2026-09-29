# Window Tiler

Raycast extension that tiles macOS windows into a layout, with include and exclude lists for applications. Stack: TypeScript, React, the Raycast API, pnpm, Vitest.

## Commands

- **Tile Windows** tiles every window on the active desktop. **Tile App** tiles every window of the frontmost application. Both use the Layout preference. An optional Layout argument overrides it.
- **Tile Windows: Layout** and **Tile App: Layout** exist for each layout. Each uses its own layout and takes no argument, so a hotkey or alias can target one layout (Raycast hotkeys cannot carry an argument). They are disabled by default.
- **Move Window Forward**, **Back**, **to Start**, **to End**, **Leftward**, **Rightward**, **Upward** and **Downward** change the position of the focused window in the current layout. Forward and Back swap it with the next or previous slot. To Start and To End put it in the first or last slot and shift the windows between. The four directions swap it with the window next to it on screen, and fail with an error when there is none. These commands are disabled by default.
- **Move Window** does the same and takes the change as a required argument: any of the eight above, or a rotation.
- **Rotate Windows Forward** and **Rotate Windows Back** move every window one slot along and wrap at the ends.
- **Tiling Lists** edits two lists of applications, matched by bundle ID. Applications on the exclude list are never tiled. When the include list is not empty, only its applications are tiled. Exclude wins over include. The order of the include list is the priority order for the App Priority window order, and Move Up and Move Down change it.

Reorder commands use the layout and scope of the last tiling command. They match windows to slots by current position, whatever the Window Order preference says.

Extension preferences: Layout (grid, columns, rows, main and stack, spiral), Window Order, Gap, Gap Unit, two Gap Placement checkboxes, Move Duration and Resize Duration.

- **Window Order** decides which window goes in which slot. Nearest slot (default) minimises total movement. Reading order goes top to bottom, then left to right. Active first puts the focused window in the first slot. App priority follows the include list, with ties in reading order.
- **Gap** is the space between windows and around the screen edge. Gap Unit selects points, percent of each window, or percent of the screen. Percentages apply per axis. The two checkboxes select the screen edge, the space between windows, or both. A negative gap makes neighbouring windows overlap. It never pushes a window past the screen edge. A gap that leaves a window with no width or height is an error.
- **Move Duration** and **Resize Duration** are in milliseconds. Windows slide and resize into place, each part eased on its own. A value of 0 makes that part instant.

## Getting started

Prerequisites: macOS, Raycast with a Pro subscription (the window management API requires it), Node, and pnpm. Windows is not supported by that API. The extension needs no environment variables.

```bash
pnpm install
pnpm dev
```

`pnpm dev` imports the extension into Raycast with hot reload.

## Build, test and lint

Each public script runs a Turborepo task of the same name with an underscore prefix, so `pnpm lint` runs the `_lint` task, which runs the `_lint` script. `turbo.json` declares each task's inputs, outputs and dependencies. Turborepo caches the results, so a repeat run with unchanged inputs replays the output.

- `pnpm build` runs `ray build`. It also writes `raycast-env.d.ts`, which types the preferences and command arguments. Git ignores that file. Lint, typecheck and mutation depend on the build task, so they generate the file themselves, and the cache restores it when it is missing.
- `pnpm test` runs the whole Vitest suite. Run one file with `pnpm exec vitest run src/proximity.unit.test.ts`. Run one test with `-t "part of the test name"`. These direct calls skip Turborepo.
- `pnpm test:coverage` runs the suite with V8 coverage.
- `pnpm lint` runs ESLint with no warnings allowed. ESLint includes Prettier and the Raycast rules. Fix formatting and auto-fixable problems with `pnpm exec eslint . --fix`.
- `pnpm lint:raycast` runs `ray lint`, which adds the manifest and icon checks. In CI it also demands a `package-lock.json`, which the Raycast store needs and this pnpm project does not have, so CI does not run it.
- `pnpm typecheck` runs `tsc --noEmit`.
- `pnpm mutation` runs Stryker on the pure logic modules with the Vitest runner and the TypeScript checker. It reads `stryker.config.ts`. Pass Stryker options after `--`, for example `pnpm mutation -- --dryRunOnly`.
- `pnpm prepush` runs the type check, the lint and the tests in one Turborepo run. The pre-push hook calls it.

## Architecture

The code has two halves. Pure logic never imports the Raycast API, so Vitest can test it directly. The Raycast-bound half reads preferences and windows and moves them.

Pure logic:

- `src/layouts/` holds one module per layout. A layout is a function from a window count and an area to one rectangle per window. `layout-windows.ts` applies the gap to those rectangles. `gap.ts` defines the gap and its units.
- `src/proximity.ts` matches items to slots with the Hungarian algorithm.
- `src/ordering.ts` implements the four window orders on top of it.
- `src/reorder.ts` and `src/direction.ts` implement the reorder actions and the directional neighbour search.
- `src/animation.ts` interpolates window rectangles over time, paced by the clock.
- `src/filter.ts` implements the include and exclude lists.

Raycast-bound:

- `src/tile.ts` runs every tiling and reorder command. It reads preferences, gets the windows on the active desktop, applies the scope and the lists, drops windows that cannot be moved, groups them by desktop, computes the slots, orders the windows, applies any reorder, and animates the moves. `runTile` and `runReorder` are its entry points.
- `src/storage.ts` keeps the two lists and the last tiling in Raycast local storage.
- Each command in `package.json` has one entry file at `src/<command-name>.tsx`. `src/manage-lists.tsx` is the only view command.

`package.json` is the single source for the command list, preferences and arguments. `src/manifest.integration.test.ts` checks that its options match the code constants (`LAYOUT_IDS`, `ORDER_IDS`, `GAP_UNITS`, `REORDER_ACTIONS`), that every layout has both dedicated commands, that the disabled-by-default set is exactly the dedicated tile and move commands, and that every command has an entry file.

## Conventions

- ESLint uses `@exadev/eslint-config`, the Raycast ESLint plugin and Prettier. Inline configuration is banned, so an `eslint-disable` comment fails the lint. Fix the code instead.
- Barrel (index) files are banned. Import from the module that owns the symbol.
- Every number except -1, 0, 1 and 2 needs a named constant. Function parameters that are arrays or plain objects must be `readonly` or `Readonly<...>`.
- Test files must say their kind: `*.unit.test.ts` or `*.integration.test.ts`.
- To add a layout, window order, gap unit or reorder action, add its id to the code constant, its option to `package.json`, and tests. The manifest test fails until all three agree. A new command needs a manifest entry and its `src/<command-name>.tsx` file.
- Command titles must be in Raycast title case. `ray lint` treats "up" as a particle and rejects "Move Window Up", which is why the direction commands end in "ward".
- Configuration files are TypeScript (`eslint.config.ts`, `prettier.config.ts`, `commitlint.config.ts`, `lint-staged.config.ts`, `vitest.config.ts`, `stryker.config.ts`). `turbo.json` declares the task graph. `package.json` sets `"type": "module"` for them.
- Write comments in British English.

## Non-obvious behaviour

- `Window.active` is `true` for every window of the frontmost application, not only the focused one. Code that looks for "the active window" then picks the first window. Compare window ids with the result of `getActiveWindow()` instead, as `src/tile.ts` does.
- A Raycast `Desktop` has a size but no position. Tiling places windows from the point (0, 0) of the desktop. This works on the main screen. It is not verified on a second screen.
- Raycast cannot change the stacking order of windows. With a negative gap, the windows that end up on top are those that were already on top.
- The API does not expose window titles. The extension cannot list or tell apart several windows of one application, so the reorder commands act on the focused window.
- Fullscreen windows have no position to tile from and are skipped. Resizing one would take it out of fullscreen.
- `disabledByDefault` only applies when Raycast first installs the extension or first sees a new command. An existing install keeps the enabled state it has. Change it in Raycast Settings, Extensions, or import the extension again.
- Raycast preferences cannot hold a button, and the API cannot enable or disable commands.
- Stryker only loads `stryker.config.ts` when it is named: `stryker run stryker.config.ts`. Without the path, Stryker ignores the file and mutates every source file.
- The semantic-release notes generator loads an older `conventional-changelog-writer` that cannot render the `conventionalcommits` preset, which produces a changelog with a version heading and nothing under it. `pnpm-workspace.yaml` overrides the writer to a newer major. Remove the override only after checking that the notes still list every section.
- Turborepo writes its own managed block into `AGENTS.md` when it detects an AI agent, and doing so replaces the symlink with a regular file. `"agentGuidance": false` in `turbo.json` stops that. If `AGENTS.md` is ever a regular file again, restore it with `ln -sf README.md AGENTS.md`.
- TypeScript is pinned to version 6, because `typescript-eslint` does not support version 7.
- `pnpm install` runs `prepare`, and husky would set a local hooks path that replaces a machine-wide hook dispatcher configured in the global git configuration. The `prepare` script therefore runs husky only when no hooks path is configured. Where a global dispatcher exists, it runs the scripts in `.husky/` itself. `pnpm-workspace.yaml` marks the `esbuild` build script as not allowed.

## Contributing

Use conventional commits with a subject of at most 100 characters. `release.config.ts` lists the allowed types, and commitlint, the release rules and the changelog sections all read that list. Every type triggers a release: `feat` a minor one and every other type a patch. A breaking change triggers a major one. Commitlint checks the commit at commit time and again in CI. The pre-commit hook runs `eslint --fix` on staged TypeScript files through lint-staged. The pre-push hook runs `pnpm prepush`. The default branch is `main`.

Every push to `main` runs the checks, then semantic-release. It bumps the version, writes `CHANGELOG.md`, tags the release, creates the GitHub Release, and commits the changelog and `package.json`. A separate job then publishes the package to GitHub Packages as the scoped alias `@mearman/raycast-tiler`, because GitHub Packages requires a name scoped to the repository owner. That job renames the package at publish time, so `package.json` keeps the Raycast extension name. Publishing to the Raycast store is a separate manual step.

## References

- Raycast window management API: https://developers.raycast.com/api-reference/window-management (archive: https://web.archive.org/web/https://developers.raycast.com/api-reference/window-management)
- Raycast manifest, including `disabledByDefault` and arguments: https://developers.raycast.com/information/manifest (archive: https://web.archive.org/web/https://developers.raycast.com/information/manifest)
- Shared lint rules: https://github.com/ExaDev/eslint-config
