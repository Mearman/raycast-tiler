import { columns } from "./columns";
import { inset } from "./geometry";
import { grid } from "./grid";
import { mainStack } from "./main-stack";
import { rows } from "./rows";
import { spiral } from "./spiral";
import { stackHorizontal, stackVertical } from "./stack";
import type { Layout, LayoutId, LayoutOptions, Rect } from "./types";

export type { LayoutId, LayoutOptions, Rect } from "./types";
export {
  isLayoutId,
  LAYOUT_IDS,
  STACK_LAYOUT_IDS,
  TILING_LAYOUT_IDS,
} from "./types";

const LAYOUTS: Record<LayoutId, Layout> = {
  grid,
  columns,
  rows,
  "main-stack": mainStack,
  spiral,
  "stack-horizontal": stackHorizontal,
  "stack-vertical": stackVertical,
};

/**
 * Lays out `count` windows in `area` using the named layout, leaving `gap` points between windows and around the area's edge.
 *
 * The layout runs on the area inset by half the gap and each result is inset by half the gap again, so neighbours end up exactly `gap` apart. Rectangles are rounded to whole points.
 */
export function layoutWindows(
  id: LayoutId,
  count: number,
  area: Rect,
  gap: number,
  options: LayoutOptions,
): Rect[] {
  const half = gap / 2;
  return LAYOUTS[id](count, inset(area, half), options).map((rect) => {
    const shrunk = inset(rect, half);
    return {
      x: Math.round(shrunk.x),
      y: Math.round(shrunk.y),
      width: Math.round(shrunk.width),
      height: Math.round(shrunk.height),
    };
  });
}
