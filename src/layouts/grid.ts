import { columns } from "./columns";
import { splitSpan } from "./geometry";
import type { Layout } from "./types";

/**
 * How far the worst-shaped cell of a `columnCount`-wide grid is from the shape of the area itself, as an absolute log ratio.
 *
 * A cell in a row of `cells` windows within `rowCount` rows has the area's aspect ratio scaled by `rowCount / cells`, whatever the area's dimensions, so a cell is area-shaped exactly when its row holds as many windows as there are rows. A short final row stretches its windows across the full width, which is what makes a poorly fitting column count score badly.
 */
function worstDistortion(count: number, columnCount: number): number {
  const rowCount = Math.ceil(count / columnCount);
  const lastRowCells = count - (rowCount - 1) * columnCount;
  const distortion = (cells: number) => Math.abs(Math.log(rowCount / cells));

  return Math.max(distortion(columnCount), distortion(lastRowCells));
}

/**
 * Fills rows left to right, top to bottom.
 *
 * The column count is the one whose worst cell is closest to the area's own shape, so a count that fits a full grid (nine windows as 3x3) beats one that leaves a lone window stretched across a final row. A short final row still stretches its windows across the full width so no space is left empty.
 */
export const grid: Layout = (count, area) => {
  if (count === 0) return [];
  const candidates = Array.from({ length: count }, (_, index) => index + 1);
  const columnCount = candidates.reduce((best, candidate) =>
    worstDistortion(count, candidate) < worstDistortion(count, best)
      ? candidate
      : best,
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
