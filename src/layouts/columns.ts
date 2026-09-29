import { splitSpan } from "./geometry";
import type { Layout } from "./types";

/** Equal-width windows side by side. */
export const columns: Layout = (count, area) =>
  splitSpan(area.x, area.width, count).map(({ start, size }) => ({
    x: start,
    y: area.y,
    width: size,
    height: area.height,
  }));
