/** Applications identified by bundle ID. */
export type AppLists = {
  /** When non-empty, only these applications are tiled. */
  include: string[];
  /** These applications are never tiled; takes precedence over `include`. */
  exclude: string[];
};

export function isAppLists(value: unknown): value is AppLists {
  if (typeof value !== "object" || value === null) return false;
  if (!("include" in value) || !("exclude" in value)) return false;
  const isStrings = (list: unknown): boolean =>
    Array.isArray(list) && list.every((item) => typeof item === "string");
  return isStrings(value.include) && isStrings(value.exclude);
}

/**
 * Whether a window whose application has `bundleId` may be tiled.
 *
 * A window with no known bundle ID cannot match the include list, so it is tiled only when the include list is empty.
 */
export function isAllowed(
  bundleId: string | undefined,
  lists: AppLists,
): boolean {
  if (bundleId !== undefined && lists.exclude.includes(bundleId)) return false;
  if (lists.include.length === 0) return true;
  return bundleId !== undefined && lists.include.includes(bundleId);
}

/** Returns `list` without `id` if present, otherwise with `id` appended. */
export function toggle(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

/**
 * Moves `id` by `offset` places within `list`, stopping at either end. Returns `list` unchanged when `id` is absent.
 */
export function move(list: string[], id: string, offset: number): string[] {
  const from = list.indexOf(id);
  if (from === -1) return list;
  const to = Math.min(list.length - 1, Math.max(0, from + offset));
  const without = list.filter((item) => item !== id);
  return [...without.slice(0, to), id, ...without.slice(to)];
}
