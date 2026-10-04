import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { GRID_BALANCES } from "./grid-balance";
import { GAP_UNITS } from "./layouts/gap";
import { LAYOUT_TITLES } from "./layouts/titles";
import { LAYOUT_IDS } from "./layouts/types";
import { ORDER_IDS } from "./ordering";
import { SCOPES } from "./scope";
import { NUMBERED_MOVES, REORDER_ACTIONS } from "./reorder";

interface Argument {
  name: string;
  required?: boolean;
  data?: { value: string }[];
}
interface Command {
  name: string;
  disabledByDefault?: boolean;
  interval?: string;
  arguments?: Argument[];
}
interface Preference {
  name: string;
  default?: string | boolean;
  data?: { value: string; title?: string }[];
}
interface Manifest {
  commands: Command[];
  preferences: Preference[];
}

function isManifest(value: unknown): value is Manifest {
  return (
    typeof value === "object" &&
    value !== null &&
    "commands" in value &&
    Array.isArray(value.commands) &&
    "preferences" in value &&
    Array.isArray(value.preferences)
  );
}

const parsed: unknown = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);
if (!isManifest(parsed)) throw new Error("package.json is not a manifest");

describe("manifest", () => {
  it("offers every layout in the layout preference", () => {
    const layout = parsed.preferences.find((pref) => pref.name === "layout");
    expect(layout?.data?.map((option) => option.value)).toEqual([
      ...LAYOUT_IDS,
    ]);
  });

  it("offers every grid balance in the grid balance preference", () => {
    const balance = parsed.preferences.find(
      (pref) => pref.name === "gridBalance",
    );
    expect(balance?.data?.map((option) => option.value)).toEqual([
      ...GRID_BALANCES,
    ]);
  });

  it("has a custom grid penalty preference for the custom balance", () => {
    expect(
      parsed.preferences.some((pref) => pref.name === "gridEmptyCellPenalty"),
    ).toBe(true);
  });

  it("has a preference for sequential transitions", () => {
    const sequence = parsed.preferences.find(
      (pref) => pref.name === "sequentialTransitions",
    );
    expect(sequence).toBeDefined();
  });

  it("has a preference for filling open space", () => {
    const fill = parsed.preferences.find(
      (pref) => pref.name === "fillOpenSpace",
    );
    expect(fill).toBeDefined();
  });

  it("defaults the window order to the previous order", () => {
    const order = parsed.preferences.find(
      (pref) => pref.name === "windowOrder",
    );
    expect(order?.default).toBe("previous");
  });

  it("offers every gap unit in the gap unit preference", () => {
    const unit = parsed.preferences.find((pref) => pref.name === "gapUnit");
    expect(unit?.data?.map((option) => option.value)).toEqual([...GAP_UNITS]);
  });

  it.each(SCOPES.flatMap((scope) => LAYOUT_IDS.map((id) => [scope, id])))(
    "registers a %s command for the %s layout",
    (scope, id) => {
      expect(parsed.commands.map((command) => command.name)).toContain(
        `tile-${scope}-${id}`,
      );
    },
  );

  it("offers every reorder action in the Move Window argument", () => {
    const command = parsed.commands.find((c) => c.name === "move-window");
    const action = command?.arguments?.find((arg) => arg.name === "action");
    expect(action?.data?.map((option) => option.value)).toEqual([
      ...REORDER_ACTIONS,
    ]);
  });

  it.each(REORDER_ACTIONS)("registers a dedicated command for %s", (action) => {
    const name = action.startsWith("rotate-")
      ? `rotate-windows-${action.slice("rotate-".length)}`
      : `move-window-${action}`;
    expect(parsed.commands.map((command) => command.name)).toContain(name);
  });

  it.each(NUMBERED_MOVES)(
    "registers a numbered %s command with a required position argument",
    (move) => {
      const command = parsed.commands.find(
        (c) =>
          c.name ===
          (move === "swap"
            ? "swap-window-with-number"
            : "insert-window-before-number"),
      );
      const position = command?.arguments?.find(
        (arg) => arg.name === "position",
      );
      expect(position?.required).toBe(true);
    },
  );

  it("names every layout as the layout preference does", () => {
    const layout = parsed.preferences.find((pref) => pref.name === "layout");
    expect(layout?.data?.map((option) => option.title)).toEqual(
      LAYOUT_IDS.map((id) => LAYOUT_TITLES[id]),
    );
  });

  it("offers every window order in the window order preference", () => {
    const order = parsed.preferences.find(
      (pref) => pref.name === "windowOrder",
    );
    expect(order?.data?.map((option) => option.value)).toEqual([...ORDER_IDS]);
  });

  it.each(["tile-desktop", "tile-current-app"])(
    "offers every layout as an optional argument of %s",
    (name) => {
      const layout = parsed.commands
        .find((command) => command.name === name)
        ?.arguments?.find((arg) => arg.name === "layout");
      expect(layout?.required).toBe(false);
      expect(layout?.data?.map((option) => option.value)).toEqual([
        ...LAYOUT_IDS,
      ]);
    },
  );

  it("offers every reorder action in the Move Window argument", () => {
    const command = parsed.commands.find((c) => c.name === "move-window");
    const action = command?.arguments?.find((arg) => arg.name === "action");
    expect(action?.data?.map((option) => option.value)).toEqual([
      ...REORDER_ACTIONS,
    ]);
  });

  it.each(REORDER_ACTIONS)("registers a dedicated command for %s", (action) => {
    const name = action.startsWith("rotate-")
      ? `rotate-windows-${action.slice("rotate-".length)}`
      : `move-window-${action}`;
    expect(parsed.commands.map((command) => command.name)).toContain(name);
  });

  it("disables only the dedicated tile and move commands by default", () => {
    const dedicated = [
      ...SCOPES.flatMap((scope) =>
        LAYOUT_IDS.map((id) => `tile-${scope}-${id}`),
      ),
      ...REORDER_ACTIONS.filter((action) => !action.startsWith("rotate-")).map(
        (action) => `move-window-${action}`,
      ),
    ];
    const disabled = parsed.commands
      .filter((command) => command.disabledByDefault === true)
      .map((command) => command.name);
    expect(disabled.sort()).toEqual(dedicated.sort());
  });

  it("schedules only the auto tiling menu bar command", () => {
    const scheduled = parsed.commands
      .filter((command) => command.interval !== undefined)
      .map((command) => command.name);
    expect(scheduled).toEqual(["auto-tiling"]);
  });

  it.each([
    "enable-auto-tiling",
    "disable-auto-tiling",
    "toggle-auto-tiling",
    "auto-tiling",
  ])("registers the auto tiling command %s", (name) => {
    expect(parsed.commands.map((command) => command.name)).toContain(name);
  });

  it("has an entry file for every command", () => {
    for (const command of parsed.commands) {
      expect(
        existsSync(new URL(`./${command.name}.tsx`, import.meta.url)),
      ).toBe(true);
    }
  });
});
