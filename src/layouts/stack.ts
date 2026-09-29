import type { Layout, Rect } from "./types";

/** A stacked window never shrinks below this fraction of the area along the stacking axis, so its content stays usable however many windows there are. */
const MIN_PANE_FRACTION = 1 / 2;

type Axis = "x" | "y";

/**
 * Equal-sized windows, each offset from the previous along `axis`, filling the area exactly: the first window sits at the area's start and the last is flush with its far edge.
 *
 * The offset shrinks when the requested one would push windows below `MIN_PANE_FRACTION` of the area. Later windows are meant to sit above earlier ones, so the offset strips are what remain visible of the earlier windows.
 */
function stack(axis: Axis, count: number, area: Rect, offset: number): Rect[] {
  if (count === 0) return [];
  const length = axis === "x" ? area.width : area.height;
  const step =
    count === 1
      ? 0
      : Math.floor(
          Math.min(offset, (length * (1 - MIN_PANE_FRACTION)) / (count - 1)),
        );
  const paneLength = length - (count - 1) * step;
  return Array.from({ length: count }, (_, index) =>
    axis === "x"
      ? {
          x: area.x + index * step,
          y: area.y,
          width: paneLength,
          height: area.height,
        }
      : {
          x: area.x,
          y: area.y + index * step,
          width: area.width,
          height: paneLength,
        },
  );
}

/** Same-width windows cascading left to right, each leaving a strip of the one before visible. */
export const stackHorizontal: Layout = (count, area, options) =>
  stack("x", count, area, options.stackOffset);

/** Same-height windows cascading top to bottom, each leaving a strip of the one before visible. */
export const stackVertical: Layout = (count, area, options) =>
  stack("y", count, area, options.stackOffset);
