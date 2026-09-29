import { neighbourInDirection, type Direction } from "./direction";
import type { Rect } from "./layouts";

export const REORDER_ACTIONS = [
  "left",
  "right",
  "up",
  "down",
  "forward",
  "back",
  "start",
  "end",
  "rotate-forward",
  "rotate-back",
] as const;

/** A change to the order or position of windows within the current layout. */
export type ReorderAction = (typeof REORDER_ACTIONS)[number];

export function isReorderAction(value: unknown): value is ReorderAction {
  return REORDER_ACTIONS.some((action) => action === value);
}

function wrap(index: number, length: number): number {
  return ((index % length) + length) % length;
}

/**
 * Swaps the active item with the one `offset` places away, wrapping around the ends.
 *
 * Returns a new array, or `undefined` when no item is active. A single item is returned unchanged.
 */
export function swapActive<T>(
  items: readonly T[],
  isActive: (item: T) => boolean,
  offset: number,
): T[] | undefined {
  const from = items.findIndex(isActive);
  if (from === -1) return undefined;
  const result = [...items];
  const to = wrap(from + offset, items.length);
  const displaced = result[to];
  const active = result[from];
  if (displaced === undefined || active === undefined)
    throw new Error("Index is outside the items");
  result[to] = active;
  result[from] = displaced;
  return result;
}

/** Moves every item `offset` places along, wrapping around the ends, so the item in slot `k` ends up in slot `k + offset`. */
export function rotate<T>(items: readonly T[], offset: number): T[] {
  return items.map((_, slot) => {
    const item = items[wrap(slot - offset, items.length)];
    if (item === undefined) throw new Error("Index is outside the items");
    return item;
  });
}

/**
 * Moves the active item to the start or end, shifting the items in between along by one.
 *
 * Returns a new array, or `undefined` when no item is active.
 */
export function moveActiveTo<T>(
  items: readonly T[],
  isActive: (item: T) => boolean,
  edge: "start" | "end",
): T[] | undefined {
  const active = items.find(isActive);
  if (active === undefined) return undefined;
  const others = items.filter((item) => item !== active);
  return edge === "start" ? [active, ...others] : [...others, active];
}

/**
 * Swaps the active item with the item in the neighbouring slot in `direction`.
 *
 * `items[k]` occupies `slots[k]`. Returns a new array, or `undefined` when no item is active. Throws when the active item's slot has no neighbour that way.
 */
export function swapInDirection<T>(
  items: readonly T[],
  slots: readonly Rect[],
  isActive: (item: T) => boolean,
  direction: Direction,
): T[] | undefined {
  const from = items.findIndex(isActive);
  if (from === -1) return undefined;
  const to = neighbourInDirection(slots, from, direction);
  if (to === undefined) throw new Error(`No window to the ${direction}`);
  const result = [...items];
  const active = result[from];
  const displaced = result[to];
  if (displaced === undefined || active === undefined)
    throw new Error("Index is outside the items");
  result[to] = active;
  result[from] = displaced;
  return result;
}
