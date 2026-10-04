# Window Tiler

Raycast extension that tiles macOS windows into a layout, with include and exclude lists for applications. Stack: TypeScript, React, the Raycast API, pnpm, Vitest.

## Commands

- **Tile Windows** tiles every window on the active desktop. **Tile App** tiles every window of the frontmost application. Both use the Layout preference. An optional Layout argument overrides it.
- **Tile Windows: Layout** and **Tile App: Layout** exist for each layout. Each uses its own layout and takes no argument, so a hotkey or alias can target one layout (Raycast hotkeys cannot carry an argument). They are disabled by default.
- **Move Window Forward**, **Back**, **to Start**, **to End**, **Leftward**, **Rightward**, **Upward** and **Downward** change the position of the focused window in the current layout. Forward and Back swap it with the next or previous slot. To Start and To End put it in the first or last slot and shift the windows between. The four directions swap it with the window next to it on screen, and fail with an error when there is none. These commands are disabled by default.
- **Move Window** does the same and takes the change as a required argument: any of the eight above, or a rotation.
- **Swap Window with Number** swaps the focused window with the window at a number in reading order, counting from 1. **Insert Window Before Number** moves the focused window to just before that window and shifts the windows in between along by one place. Both take the number as a required argument, count reading order over the slots of the current layout, and fail with an error when the number is not a whole number from 1 to the window count.
- **Enable Auto Tiling**, **Disable Auto Tiling** and **Toggle Auto Tiling** switch auto tiling on and off. When it is on, the applications the last tiling arranged are re-tiled whenever the set of their windows on the active desktop changes, using that tiling's layout and the current preferences. Windows of other applications are never added, so a browser or editor opened over a desktop of terminals floats above the tiled windows and leaves the tiling alone. The exclude list still applies. Moving a window by hand does not trigger it, only a window opening or closing. To add an application, tile once while its windows are open. **Auto Tiling** is a menu bar item behind this: it shows whether auto tiling is on, switches it, offers Tile Windows Now and Tile App Now, and Raycast reruns it on a timer, which is what re-tiles. It starts with the extension and can be disabled in Raycast Settings, Extensions. Raycast does not offer window events, so a new window can wait for the next run, and the interval is fixed in `package.json`. Enabling auto tiling also tiles at once.
- **Undo Tiling** puts the windows the last tiling, reorder or auto tiling run moved back where they were, on the active desktop only. Running it again redoes the run.
- **Rotate Windows Forward** and **Rotate Windows Back** move every window one slot along and wrap at the ends.
- **Tiling Lists** edits two lists of applications, matched by bundle ID. Applications on the exclude list are never tiled. When the include list is not empty, only its applications are tiled. Exclude wins over include. Applications with a window on the active desktop are listed first, under Open Now. The order of the include list is the priority order for the App Priority window order, and Move Up and Move Down change it.

Reorder commands use the layout and scope of the last tiling command. They match windows to slots by current position, whatever the Window Order preference says.

Extension preferences: Layout (grid, columns, rows, main and stack, spiral), Grid Balance, Grid Empty Cell Penalty, Window Order, Fill Open Space, Gap, Gap Unit, two Gap Placement checkboxes, Move Duration, Resize Duration and Transition Order.

- **Grid Balance** decides how the grid layout picks its columns. Every layout is scored by how far its cells are from the screen's shape plus a weighted share of empty cells. **Even Rows** (default) uses a high weight, so eight windows tile as two rows of four and ten as two rows of five. **Screen Shape** uses no weight, so eight windows tile as rows of 3, 3 and 2. **Custom** uses the **Grid Empty Cell Penalty** number: 0 ignores empty cells and larger values prefer full rows. When two layouts score the same, the grid follows the screen's orientation, so two windows sit side by side on a wide screen.
- **Window Order** decides which window goes in which slot. Nearest slot minimises total movement. Reading order goes top to bottom, then left to right. Active first puts the focused window in the first slot. App priority follows the include list, with ties in reading order. Previous order (default) keeps the relative order of the last tiling: each window ranks as the slot of that tiling nearest to it, so windows that are tiled stay in sequence and moved or new windows slot in beside their nearest slot, with ties in reading order. Without a stored tiling it is reading order.
- **Fill Open Space** is a checkbox that is off by default. When it is on and more than half of the windows sit in the slots of the last tiling, windows that have moved or are new fill the leftover slots of the current layout while the tiled ones keep the slots nearest where they are, instead of the Window Order preference rearranging every window. The floating windows are ordered among themselves by Window Order. With Window Order set to Nearest Slot the checkbox changes little, because nearest matching already keeps windows close to where they are; its main effect is protecting the arrangement under Reading Order, Active First and App Priority. When fewer than half sit on the old slots, or every window does, the tiling runs exactly as with the checkbox off.
- **Gap** is the space between windows and around the screen edge. Gap Unit selects points, percent of each window, or percent of the screen. Percentages apply per axis. The two checkboxes select the screen edge, the space between windows, or both. A negative gap makes neighbouring windows overlap. It never pushes a window past the screen edge. A gap that leaves a window with no width or height is an error.
- **Move Duration** and **Resize Duration** are in milliseconds. Windows slide and resize into place, each part eased on its own. A value of 0 makes that part instant. **Transition Order** is a checkbox that is on by default. When it is on, each window finishes moving and resizing before the next one starts, in layout order, so the whole transition takes as long as all windows added up. When it is off, all windows move together. A window already on its target rectangle is left unmoved, taking no part in the transition and adding no time to it.

## Install

The extension is not in the Raycast store, so install it from source. You need macOS, Raycast, Node and pnpm. The window management API does not support Windows. The extension needs no environment variables. No development server has to keep running.

1. Clone the repository: `git clone https://github.com/Mearman/raycast-tiler.git`.
2. In the folder, run `pnpm install`.
3. In Raycast, run the **Import Extension** command and select the repository folder.
4. Run `pnpm build` after the import. Importing clears the compiled commands from Raycast's copy of the extension, and Raycast reports "missing executable" until a build has written them again.
5. Open Raycast and search for **Tile Windows**. Set the layout and the other options in Raycast Settings, Extensions, Window Tiler.

`pnpm dev` does steps 3 and 4 in one go: it imports the extension if Raycast does not have it yet, and builds it. Stop it with Control+C once it has built. The extension stays in Raycast.

To update, run `git pull` and `pnpm install`, then `pnpm build`. To remove the extension, use Raycast Settings, Extensions, select Window Tiler and remove it.

## Getting started

The prerequisites are the ones under Install. To work on the extension, run `pnpm install` and then `pnpm dev`. `pnpm dev` imports the extension into Raycast with hot reload, and rebuilds it on every change until you stop it.

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
- `src/grid-balance.ts` maps the Grid Balance presets to the numeric weight that the grid layout reads.
- `src/proximity.ts` matches items to slots with the Hungarian algorithm, filling every slot or leaving some open.
- `src/ordering.ts` implements the four window orders on top of it.
- `src/rects.ts` compares rectangles with a small tolerance, so a window already on its slot is recognised without an exact match.
- `src/stability.ts` keeps the current arrangement when most windows sit on the previous tiling's slots.
- `src/reorder.ts` and `src/direction.ts` implement the reorder actions and the directional neighbour search.
- `src/animation.ts` interpolates window rectangles over time, paced by the clock.
- `src/filter.ts` implements the include and exclude lists.

Raycast-bound:

- `src/tile.ts` runs every tiling and reorder command. It reads preferences, gets the windows on the active desktop, applies the scope and the lists, drops windows that cannot be moved, groups them by desktop, computes the slots, orders the windows, applies any reorder, and animates the moves. `runTile` and `runReorder` are its entry points.
- `src/storage.ts` keeps the two lists, the last tiling (slots, applications and window IDs), the bounds the last run moved windows from for Undo Tiling and the auto tiling switch in Raycast local storage. `src/window-set.ts` is the pure change check; `src/auto-tile-commands.ts` holds the enable, disable and toggle logic, and `src/auto-tiling.tsx` is the menu bar command that also runs the scheduled check.
- Each command in `package.json` has one entry file at `src/<command-name>.tsx`. `src/manage-lists.tsx` is the only view command.

`package.json` is the single source for the command list, preferences and arguments. `src/manifest.integration.test.ts` checks that its options match the code constants (`LAYOUT_IDS`, `ORDER_IDS`, `GAP_UNITS`, `GRID_BALANCES`, `REORDER_ACTIONS`), that every layout has both dedicated commands, that the disabled-by-default set is exactly the dedicated tile and move commands, and that every command has an entry file.

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

- The Raycast documentation says the window management API needs a Raycast Pro subscription and prompts to upgrade without one. The extension works without a subscription on the maintainer's machine, so the documentation may be out of date. If a call ever fails with an upgrade prompt, a subscription is needed.
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
