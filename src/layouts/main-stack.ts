import { rows } from "./rows";
import type { Layout, Rect } from "./types";

/** The first window fills the left half; the rest stack in equal rows on the right half. A lone window fills the area. */
export const mainStack: Layout = (count, area) => {
  if (count === 0) return [];
  if (count === 1) return [area];
  const mainWidth = Math.round(area.width / 2);
  const main: Rect = {
    x: area.x,
    y: area.y,
    width: mainWidth,
    height: area.height,
  };
  const stack: Rect = {
    x: area.x + mainWidth,
    y: area.y,
    width: area.width - mainWidth,
    height: area.height,
  };

  return [main, ...rows(count - 1, stack)];
};
