import { LocalStorage } from "@raycast/api";
import { isAppLists, type AppLists } from "./filter";
import { isLayoutId, type LayoutId } from "./layouts";
import { isScope, type Scope } from "./scope";

const KEY = "app-lists";

/** Reads the saved include and exclude lists; both are empty when nothing has been saved. Throws if the stored value is malformed. */
export async function loadLists(): Promise<AppLists> {
  const raw = await LocalStorage.getItem<string>(KEY);
  if (raw === undefined) return { include: [], exclude: [] };
  const parsed: unknown = JSON.parse(raw);
  if (!isAppLists(parsed))
    throw new Error("Stored application lists are malformed");
  return parsed;
}

export async function saveLists(lists: AppLists): Promise<void> {
  await LocalStorage.setItem(KEY, JSON.stringify(lists));
}

const LAST_TILING_KEY = "last-tiling";

/** What the most recent tiling command arranged, so reorder commands work on the same layout. */
export type LastTiling = { scope: Scope; layout: LayoutId };

function isLastTiling(value: unknown): value is LastTiling {
  return (
    typeof value === "object" &&
    value !== null &&
    "scope" in value &&
    isScope(value.scope) &&
    "layout" in value &&
    isLayoutId(value.layout)
  );
}

/** Reads the last tiling, or `undefined` when none has run. Throws if the stored value is malformed. */
export async function loadLastTiling(): Promise<LastTiling | undefined> {
  const raw = await LocalStorage.getItem<string>(LAST_TILING_KEY);
  if (raw === undefined) return undefined;
  const parsed: unknown = JSON.parse(raw);
  if (!isLastTiling(parsed)) throw new Error("Stored last tiling is malformed");
  return parsed;
}

export async function saveLastTiling(tiling: LastTiling): Promise<void> {
  await LocalStorage.setItem(LAST_TILING_KEY, JSON.stringify(tiling));
}
