import { columns } from "./columns";
import { splitSpan } from "./geometry";
import type { Layout, Rect } from "./types";

/** Scores closer than this are equal: mirror-image layouts (2 columns of 3 against 3 columns of 2) differ only by floating-point noise. */
const SCORE_TOLERANCE = 1e-9;

interface GridScore {
  /** Lower is better. Shape mismatch plus the weighted share of empty cells. */
  mismatch: number;
  /** Lower is better. Breaks ties towards the grid whose columns to rows ratio follows the area's own. */
  orientation: number;
}

/**
 * Scores a `columnCount`-wide grid of `count` windows in `area`.
 *
 * A cell in a row of `cells` windows within `rowCount` rows has the area's aspect ratio scaled by `rowCount / cells`, whatever the area's dimensions, so a cell is area-shaped exactly when its row holds as many windows as there are rows. The shape mismatch is the worst absolute log ratio over the rows. A short final row stretches its windows across the full width, which is what makes a poorly fitting column count score badly.
 */
function scoreGrid(
  count: number,
  columnCount: number,
  area: Readonly<Rect>,
  emptyCellWeight: number,
): GridScore {
  const rowCount = Math.ceil(count / columnCount);
  const lastRowCells = count - (rowCount - 1) * columnCount;
  const distortion = (cells: number) => Math.abs(Math.log(rowCount / cells));
  const cellCount = rowCount * columnCount;
  const emptyShare = (cellCount - count) / cellCount;

  return {
    mismatch:
      Math.max(distortion(columnCount), distortion(lastRowCells)) +
      emptyCellWeight * emptyShare,
    orientation: Math.abs(
      Math.log(columnCount / rowCount / (area.width / area.height)),
    ),
  };
}

function isBetter(
  candidate: Readonly<GridScore>,
  best: Readonly<GridScore>,
): boolean {
  if (Math.abs(candidate.mismatch - best.mismatch) > SCORE_TOLERANCE)
    return candidate.mismatch < best.mismatch;

  return candidate.orientation < best.orientation;
}

/**
 * Fills rows left to right, top to bottom.
 *
 * The column count is the one with the best score for the empty cell weight (see {@link LayoutOptions}): nine windows tile as 3x3, and eight as two rows of four with a high weight or as 3, 3 and 2 with none. Equal scores go to the grid whose shape follows the area's, so two windows sit side by side on a wide area and stacked on a tall one. A short final row still stretches its windows across the full width so no space is left empty.
 */
export const grid: Layout = (count, area, options) => {
  if (count === 0) return [];
  const candidates = Array.from({ length: count }, (_, index) => index + 1);
  const columnCount = candidates.reduce((best, candidate) =>
    isBetter(
      scoreGrid(count, candidate, area, options.emptyCellWeight),
      scoreGrid(count, best, area, options.emptyCellWeight),
    )
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
