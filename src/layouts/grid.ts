import { columns } from "./columns";
import { splitSpan } from "./geometry";
import type { Layout } from "./types";

/**
 * Fills rows left to right, top to bottom.
 *
 * The column count is the nearest whole number to the one that makes cells share the area's aspect ratio, capped at the window count; a short final row stretches its windows across the full width so no space is left empty.
 */
export const grid: Layout = (count, area) => {
  if (count === 0) return [];
  const columnCount = Math.min(
    count,
    Math.max(1, Math.round(Math.sqrt((count * area.width) / area.height))),
  );
  const rowCount = Math.ceil(count / columnCount);
  return splitSpan(area.y, area.height, rowCount).flatMap((row, rowIndex) => {
    const remaining = count - rowIndex * columnCount;
    const inRow = Math.min(columnCount, remaining);
    return columns(inRow, {
      x: area.x,
      y: row.start,
      width: area.width,
      height: row.size,
    });
  });
};
