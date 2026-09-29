import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LAYOUT_IDS } from "./layouts";
import { ORDER_IDS } from "./ordering";

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
describe("manifest", () => {
  it("offers every layout in the layout preference", () => {
    const layout = manifest.preferences.find((pref) => pref.name === "layout");
    expect(layout?.data?.map((option) => option.value)).toEqual([
      ...LAYOUT_IDS,
    ]);
  });

  it("offers every window order in the window order preference", () => {
    const order = manifest.preferences.find(
      (pref) => pref.name === "windowOrder",
    );
    expect(order?.data?.map((option) => option.value)).toEqual([...ORDER_IDS]);
  });

  it.each(SCOPES.flatMap((scope) => LAYOUT_IDS.map((id) => [scope, id])))(
    "registers a %s command for the %s layout",
    (scope, id) => {
      expect(manifest.commands.map((command) => command.name)).toContain(
        `tile-${scope}-${id}`,
      );
    },
  );

  it("enables every command by default", () => {
    expect(
      manifest.commands.filter((command) => command.disabledByDefault),
    ).toEqual([]);
  });

  it("has an entry file for every command", () => {
    for (const command of manifest.commands) {
      expect(
        existsSync(new URL(`./${command.name}.tsx`, import.meta.url)),
      ).toBe(true);
    }
  });
});
