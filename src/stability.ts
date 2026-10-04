import type { Rect } from "./layouts/types";
import { orderBySlot, type OrderId, type WindowFacts } from "./ordering";
import { occupyNearestSlots, type Point } from "./proximity";
import { rectsMatch } from "./rects";

/** What to order and how; see {@link orderBySlotStably}. */
export interface StableOrderRequest<T> {
  /** Whether the Fill Open Space preference is on. */
  fillOpenSpace: boolean;
  /** The windows to place. */
  items: readonly T[];
  /** One slot per window in the layout being applied. */
  slots: readonly Rect[];
  /** The slot rectangles of the previous tiling, or `undefined` when none were stored. */
  previousSlots: readonly Rect[] | undefined;
  facts: WindowFacts<T>;
  /** How the floating windows take the leftover slots among themselves. */
  order: OrderId;
  /** Application bundle IDs, highest priority first; used by `app-priority`. */
  priority: readonly string[];
}

/**
 * Orders `items` by slot, keeping the current arrangement when most windows are already tiled: element `k` of the result is the item placed in `slots[k]`.
 *
 * A window counts as already tiled when it sits, within the rectangle tolerance, on one of `previousSlots` (several windows may sit on the same stored slot). When `fillOpenSpace` is on and more than half of the windows are already tiled while at least one floats free, the tiled windows are placed first, each in the slot nearest where it is now (see {@link occupyNearestSlots}), and the floating windows fill the leftover slots among themselves by `order` (see {@link orderBySlot}). In every other case (the flag off, no stored slots, no strict majority, or nothing floating) every window is ordered by `order`, exactly as `orderBySlot` would.
 */
export function orderBySlotStably<T>(
  request: Readonly<StableOrderRequest<T>>,
): T[] {
  const { items, slots, facts, order, priority } = request;
  const byOrder = (): T[] =>
    orderBySlot({
      order,
      items,
      slots,
      facts,
      priority,
      previousSlots: request.previousSlots,
    });

  if (!request.fillOpenSpace || request.previousSlots === undefined)
    return byOrder();

  const settled: T[] = [];
  const floating: T[] = [];
  for (const item of items) {
    const onSlot = request.previousSlots.some((slot) =>
      rectsMatch(facts.boundsOf(item), slot),
    );
    (onSlot ? settled : floating).push(item);
  }
  // More than half the windows keep their arrangement, and at least one floats free to fill the open space.
  if (settled.length * 2 <= items.length || floating.length === 0)
    return byOrder();

  const centreOf = (item: T): Point => {
    const bounds = facts.boundsOf(item);

    return {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
  };
  const occupied = occupyNearestSlots(settled, centreOf, slots);
  const openSlots = slots.filter((_, index) => occupied[index] === undefined);
  const orderedFloating = orderBySlot({
    order,
    items: floating,
    slots: openSlots,
    facts,
    priority,
    previousSlots: request.previousSlots,
  });

  let next = 0;

  return occupied.map((item) => {
    if (item !== undefined) return item;
    const floatingWindow = orderedFloating[next];
    next += 1;
    if (floatingWindow === undefined)
      throw new Error("Fewer floating windows than open slots");

    return floatingWindow;
  });
}
