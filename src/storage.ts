import { LocalStorage } from "@raycast/api";
import { isAppLists, type AppLists } from "./filter";

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
