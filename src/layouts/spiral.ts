import type { Layout, Rect } from "./types";

/**
 * Each window takes half of the space still free, working clockwise: left half, then the top half of what remains, then its right half, then its bottom half, and so on. The last window takes whatever is left.
 */
export const spiral: Layout = (count, area) => {
  const result: Rect[] = [];
  let free = area;
  for (let index = 0; index < count; index++) {
    if (index === count - 1) {
      result.push(free);
      break;
    }
    const halfWidth = Math.round(free.width / 2);
    const halfHeight = Math.round(free.height / 2);
    switch (index % 4) {
      case 0:
        result.push({ ...free, width: halfWidth });
        free = {
          ...free,
          x: free.x + halfWidth,
          width: free.width - halfWidth,
        };
        break;
      case 1:
        result.push({ ...free, height: halfHeight });
        free = {
          ...free,
          y: free.y + halfHeight,
          height: free.height - halfHeight,
        };
        break;
      case 2:
        result.push({
          ...free,
          x: free.x + free.width - halfWidth,
          width: halfWidth,
        });
        free = { ...free, width: free.width - halfWidth };
        break;
      default:
        result.push({
          ...free,
          y: free.y + free.height - halfHeight,
          height: halfHeight,
        });
        free = { ...free, height: free.height - halfHeight };
        break;
    }
  }
  return result;
};
