import { splitSpan } from "./geometry";
import type { AreaLayout } from "./types";

/** Equal-height windows stacked top to bottom. */
export const rows: AreaLayout = (count, area) =>
  splitSpan(area.y, area.height, count).map(({ start, size }) => ({
    x: area.x,
    y: start,
    width: area.width,
    height: size,
  }));
