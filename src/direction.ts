import type { Rect } from "./layouts/types";

export const DIRECTIONS = ["left", "right", "up", "down"] as const;

export type Direction = (typeof DIRECTIONS)[number];

/**
 * The index of the slot nearest to slot `from` in `direction`, or `undefined` when there is none.
 *
 * A slot counts as being in a direction when its centre is further that way than it is across (within a 45 degree cone), so a window diagonally off in a grid is not a left or right neighbour. Among those the nearest centre wins; ties go to the slot better aligned across the direction, then to the lower index.
 */
export function neighbourInDirection(
  slots: readonly Rect[],
  from: number,
  direction: Direction,
): number | undefined {
  const origin = slots[from];
  if (origin === undefined) throw new Error(`No slot at index ${String(from)}`);
  const centre = (rect: Readonly<Rect>) => ({
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  });
  const start = centre(origin);
  let best: { index: number; distance: number; across: number } | undefined;
  slots.forEach((slot, index) => {
    if (index === from) return;
    const target = centre(slot);
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    const along = { left: -dx, right: dx, up: -dy, down: dy }[direction];
    const across = Math.abs(
      direction === "left" || direction === "right" ? dy : dx,
    );
    if (along <= 0 || across > along) return;
    const distance = dx * dx + dy * dy;
    const better =
      best === undefined ||
      distance < best.distance ||
      (distance === best.distance && across < best.across);
    if (better) best = { index, distance, across };
  });

  return best?.index;
}
