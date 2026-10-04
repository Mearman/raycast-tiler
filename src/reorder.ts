import { neighbourInDirection, type Direction } from "./direction";
import type { Rect } from "./layouts/types";
import { readingOrder } from "./ordering";

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

/** The ways to move the focused window to a numbered place in reading order. */
export const NUMBERED_MOVES = ["swap", "insert"] as const;

export type NumberedMove = (typeof NUMBERED_MOVES)[number];

/** Reads a window number typed by the user; throws when it is not a whole number. */
export function parseWindowNumber(raw: string): number {
  const value = Number(raw.trim());
  if (raw.trim() === "" || !Number.isInteger(value))
    throw new Error(`The window number must be a whole number, got "${raw}"`);

  return value;
}

function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined) throw new Error("Index is outside the items");

  return item;
}

interface NumberedRequest<T> {
  items: readonly T[];
  slots: readonly Rect[];
  isActive: (item: T) => boolean;
  position: number;
}

/**
 * Applies `edit` to the items taken in reading order of their slots, then puts the edited sequence back into the same slots in reading order.
 *
 * `items[k]` occupies `slots[k]`. `position` counts from 1 along the reading order of the slots. Returns a new array, or `undefined` when no item is active. Throws when `position` is not a place in the sequence.
 */
function editInReadingOrder<T>(
  { items, slots, isActive, position }: Readonly<NumberedRequest<T>>,
  edit: (sequence: readonly T[], active: T, target: T) => T[],
): T[] | undefined {
  const active = items.find(isActive);
  if (active === undefined) return undefined;
  const places = readingOrder(
    items.map((_, index) => index),
    (index) => at(slots, index),
  );
  const sequence = places.map((place) => at(items, place));
  const target = Number.isInteger(position)
    ? sequence[position - 1]
    : undefined;
  if (target === undefined)
    throw new Error(
      `There is no window number ${String(position)}; the windows are numbered 1 to ${String(items.length)} in reading order`,
    );
  const edited = edit(sequence, active, target);
  const result = [...items];
  places.forEach((place, index) => {
    result[place] = at(edited, index);
  });

  return result;
}

/**
 * Swaps the active item with the item at `position` in reading order of the slots, counting from 1.
 *
 * `items[k]` occupies `slots[k]`. Returns a new array, or `undefined` when no item is active. Throws when `position` is not a place in the sequence.
 */
export function swapWithNumbered<T>(
  items: readonly T[],
  slots: readonly Rect[],
  isActive: (item: T) => boolean,
  position: number,
): T[] | undefined {
  return editInReadingOrder(
    { items, slots, isActive, position },
    (sequence, active, target) =>
      sequence.map((item) => {
        if (item === active) return target;

        return item === target ? active : item;
      }),
  );
}

/**
 * Moves the active item to just before the item at `position` in reading order of the slots, counting from 1, shifting the items in between along by one place.
 *
 * `items[k]` occupies `slots[k]`. Returns a new array, or `undefined` when no item is active. Throws when `position` is not a place in the sequence. Inserting before itself changes nothing.
 */
export function insertBeforeNumbered<T>(
  items: readonly T[],
  slots: readonly Rect[],
  isActive: (item: T) => boolean,
  position: number,
): T[] | undefined {
  return editInReadingOrder(
    { items, slots, isActive, position },
    (sequence, active, target) => {
      if (target === active) return [...sequence];
      const others = sequence.filter((item) => item !== active);
      const before = others.indexOf(target);

      return [...others.slice(0, before), active, ...others.slice(before)];
    },
  );
}
