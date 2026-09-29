import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LAYOUT_IDS } from "./layouts";

type Command = { name: string; disabledByDefault?: boolean };
type Preference = { name: string; data?: { value: string }[] };
type Manifest = { commands: Command[]; preferences: Preference[] };

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
const manifest = parsed;

const SCOPES = ["desktop", "current-app"] as const;
const DEFAULT_COMMANDS = ["tile-desktop", "tile-current-app", "manage-lists"];

describe("manifest", () => {
  it("offers every layout in the layout preference", () => {
    const layout = manifest.preferences.find((pref) => pref.name === "layout");
    expect(layout?.data?.map((option) => option.value)).toEqual([
      ...LAYOUT_IDS,
    ]);
  });

  it.each(SCOPES.flatMap((scope) => LAYOUT_IDS.map((id) => [scope, id])))(
    "registers a disabled-by-default %s command for the %s layout",
    (scope, id) => {
      const command = manifest.commands.find(
        (candidate) => candidate.name === `tile-${scope}-${id}`,
      );
      expect(command?.disabledByDefault).toBe(true);
    },
  );

  it("leaves only the default commands enabled by default", () => {
    const enabled = manifest.commands
      .filter((command) => command.disabledByDefault !== true)
      .map((command) => command.name);
    expect(enabled.sort()).toEqual([...DEFAULT_COMMANDS].sort());
  });

  it("has an entry file for every command", () => {
    for (const command of manifest.commands) {
      expect(
        existsSync(new URL(`./${command.name}.tsx`, import.meta.url)),
      ).toBe(true);
    }
  });
});
