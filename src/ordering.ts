import { assignToNearestSlots } from "./proximity";
import type { Rect } from "./layouts/types";

export const ORDER_IDS = [
  "nearest",
  "reading",
  "active-first",
  "app-priority",
  "previous",
] as const;

/** How windows are matched to layout slots. */
export type OrderId = (typeof ORDER_IDS)[number];

export function isOrderId(value: unknown): value is OrderId {
  return ORDER_IDS.some((id) => id === value);
}

/** What ordering needs to know about a window. */
export interface WindowFacts<T> {
  /** The window's current bounds. */
  boundsOf: (item: T) => Rect;
  isActive: (item: T) => boolean;
  bundleIdOf: (item: T) => string | undefined;
}

function centreOf(rect: Readonly<Rect>): { x: number; y: number } {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/**
 * Sorts windows top to bottom, then left to right within each row.
 *
 * A window joins the current row when its vertical centre is within half the shorter height, its own or that of the row's first window, of the first window's vertical centre, which means the two overlap substantially in height; otherwise it starts a new row. Windows tied on position keep their input order.
 */
export function readingOrder<T>(
  items: readonly T[],
  boundsOf: (item: T) => Rect,
): T[] {
  const byCentreY = [...items].sort(
    (a, b) => centreOf(boundsOf(a)).y - centreOf(boundsOf(b)).y,
  );
  const rows: T[][] = [];
  let anchor: Rect | undefined;
  for (const item of byCentreY) {
    const bounds = boundsOf(item);
    const currentRow = rows.at(-1);
    const sameRow =
      anchor !== undefined &&
      currentRow !== undefined &&
      Math.abs(centreOf(bounds).y - centreOf(anchor).y) <=
        Math.min(bounds.height, anchor.height) / 2;
    if (sameRow) {
      currentRow.push(item);
    } else {
      rows.push([item]);
      anchor = bounds;
    }
  }

  return rows.flatMap((row) =>
    row.sort((a, b) => centreOf(boundsOf(a)).x - centreOf(boundsOf(b)).x),
  );
}

/** What to order and how; see {@link orderBySlot}. */
export interface OrderRequest<T> {
  order: OrderId;
  items: readonly T[];
  slots: readonly Rect[];
  facts: WindowFacts<T>;
  /** Application bundle IDs, highest priority first; used by `app-priority`. */
  priority: readonly string[];
  /** The slot rectangles of the previous tiling in slot order, or `undefined` when none were stored; used by `previous`. */
  previousSlots: readonly Rect[] | undefined;
}

/**
 * Orders `items` by slot: element `k` of the result is the item placed in `slots[k]`.
 *
 * - `nearest`: each window takes the slot closest to where it is, minimising total movement.
 * - `reading`: windows in reading order (see {@link readingOrder}) take the slots in order.
 * - `active-first`: the active window takes the first slot and the rest go to the nearest remaining slots.
 * - `app-priority`: windows sort by their application's position in `priority` (unlisted applications last), ties in reading order, and take the slots in order.
 * - `previous`: each window ranks as the index of the previous tiling's slot nearest its centre, so tiled windows keep their relative order and others slot in beside the slot they are closest to; ties in reading order. Without `previousSlots` this is reading order.
 *
 * Requires as many slots as items.
 */
export function orderBySlot<T>(request: Readonly<OrderRequest<T>>): T[] {
  const { items, slots, facts, priority, previousSlots } = request;
  const nearest = (candidates: readonly T[], available: readonly Rect[]) =>
    assignToNearestSlots(
      candidates,
      (item) => centreOf(facts.boundsOf(item)),
      available,
    );
  const strategies: Record<OrderId, () => T[]> = {
    nearest: () => nearest(items, slots),
    reading: () => readingOrder(items, facts.boundsOf),
    "active-first": () => {
      const active = items.find(facts.isActive);
      if (active === undefined) return nearest(items, slots);

      return [
        active,
        ...nearest(
          items.filter((item) => item !== active),
          slots.slice(1),
        ),
      ];
    },
    "app-priority": () => {
      const rank = (item: T): number => {
        const bundleId = facts.bundleIdOf(item);
        const position =
          bundleId === undefined ? -1 : priority.indexOf(bundleId);

        return position === -1 ? priority.length : position;
      };

      return readingOrder(items, facts.boundsOf).sort(
        (a, b) => rank(a) - rank(b),
      );
    },
    previous: () => {
      if (previousSlots === undefined)
        return readingOrder(items, facts.boundsOf);
      const rank = (item: T): number => {
        const centre = centreOf(facts.boundsOf(item));
        const distances = previousSlots.map((slot) => {
          const target = centreOf(slot);

          return Math.hypot(centre.x - target.x, centre.y - target.y);
        });

        return distances.indexOf(Math.min(...distances));
      };

      return readingOrder(items, facts.boundsOf).sort(
        (a, b) => rank(a) - rank(b),
      );
    },
  };

  return strategies[request.order]();
}
