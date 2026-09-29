import { splitSpan } from "./geometry";
import type { Layout } from "./types";

/** Equal-height windows stacked top to bottom. */
export const rows: Layout = (count, area) =>
  splitSpan(area.y, area.height, count).map(({ start, size }) => ({
    x: area.x,
    y: start,
    width: area.width,
    height: size,
  }));
