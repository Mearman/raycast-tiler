import type { AppLists } from "./filter";

/** The groups Tiling Lists shows, in display order. */
export const SECTIONS = ["Open Now", "Excluded", "Included", "Other"] as const;

export type Section = (typeof SECTIONS)[number];

/**
 * The group an application belongs to.
 *
 * Excluded and included applications stay in their lists' groups; of the rest, those with a window on the active desktop (`open`) come first as "Open Now".
 */
export function sectionOf(
  bundleId: string,
  lists: Readonly<AppLists>,
  open: ReadonlySet<string>,
): Section {
  if (lists.exclude.includes(bundleId)) return "Excluded";
  if (lists.include.includes(bundleId)) return "Included";

  return open.has(bundleId) ? "Open Now" : "Other";
}
