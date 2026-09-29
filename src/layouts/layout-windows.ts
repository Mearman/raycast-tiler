import { columns } from "./columns";
import { applyGap, type Gap } from "./gap";
import { grid } from "./grid";
import { mainStack } from "./main-stack";
import { rows } from "./rows";
import { spiral } from "./spiral";
import type { Layout, LayoutId, LayoutOptions, Rect } from "./types";

const LAYOUTS: Record<LayoutId, Layout> = {
  grid,
  columns,
  rows,
  "main-stack": mainStack,
  spiral,
};

/** Everything besides the window count and the area that shapes a layout. */
export interface LayoutSettings {
  gap: Gap;
  options: LayoutOptions;
}

/**
 * Lays out `count` windows in `area` using the named layout, leaving `settings.gap` between windows and around the area's edge (see {@link Gap}).
 *
 * Rectangles are rounded to whole points. Throws when the gap leaves a window with no width or height.
 */
export function layoutWindows(
  id: LayoutId,
  count: number,
  area: Readonly<Rect>,
  settings: Readonly<LayoutSettings>,
): Rect[] {
  return LAYOUTS[id](count, area, settings.options).map((slot) => {
    const shrunk = applyGap(slot, area, settings.gap);
    const rect = {
      x: Math.round(shrunk.x),
      y: Math.round(shrunk.y),
      width: Math.round(shrunk.width),
      height: Math.round(shrunk.height),
    };
    if (rect.width < 1 || rect.height < 1)
      throw new Error("The gap leaves no room for a window; reduce it");

    return rect;
  });
}
