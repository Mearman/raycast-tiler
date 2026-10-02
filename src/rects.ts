import type { Rect } from "./layouts/types";

/** How far each field of a window's rectangle may sit from a slot and still count as in it, in points. */
export const RECT_TOLERANCE_PT = 2;

/**
 * Whether two rectangles sit at the same place and size, each field within the rectangle tolerance.
 *
 * macOS reports window bounds a point or two away from what was asked for, so a window already on its slot is recognised with a small tolerance rather than an exact match.
 */
export function rectsMatch(a: Readonly<Rect>, b: Readonly<Rect>): boolean {
  return (
    Math.abs(a.x - b.x) <= RECT_TOLERANCE_PT &&
    Math.abs(a.y - b.y) <= RECT_TOLERANCE_PT &&
    Math.abs(a.width - b.width) <= RECT_TOLERANCE_PT &&
    Math.abs(a.height - b.height) <= RECT_TOLERANCE_PT
  );
}
