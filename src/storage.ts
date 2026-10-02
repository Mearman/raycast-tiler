import { LocalStorage } from "@raycast/api";
import { isAppLists, type AppLists } from "./filter";
import { isLayoutId, type LayoutId, type Rect } from "./layouts/types";
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

/** What the most recent tiling command arranged, so reorder commands work on the same layout and Fill Open Space can recognise the arrangement. */
export interface LastTiling {
  scope: Scope;
  layout: LayoutId;
  /** The slot rectangles of that tiling, in slot order; absent in data stored before they were kept. */
  slots?: Rect[];
}

function isRect(value: unknown): value is Rect {
  return (
    typeof value === "object" &&
    value !== null &&
    "x" in value &&
    typeof value.x === "number" &&
    "y" in value &&
    typeof value.y === "number" &&
    "width" in value &&
    typeof value.width === "number" &&
    "height" in value &&
    typeof value.height === "number"
  );
}

function isLastTiling(value: unknown): value is LastTiling {
  return (
    typeof value === "object" &&
    value !== null &&
    "scope" in value &&
    isScope(value.scope) &&
    "layout" in value &&
    isLayoutId(value.layout) &&
    (!("slots" in value) ||
      (Array.isArray(value.slots) && value.slots.every(isRect)))
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

export async function saveLastTiling(
  tiling: Readonly<LastTiling>,
): Promise<void> {
  await LocalStorage.setItem(LAST_TILING_KEY, JSON.stringify(tiling));
}
