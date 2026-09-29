import { describe, expect, it } from "vitest";
import { grid } from "./grid";
import type { Rect } from "./types";

/** A landscape screen, wider than it is tall. */
const WIDE: Rect = { x: 0, y: 0, width: 1920, height: 1080 };
/** A portrait screen, taller than it is wide. */
const TALL: Rect = { x: 0, y: 0, width: 1080, height: 1920 };

/** Ignores empty cells, so cells follow the screen's shape alone. */
const SHAPE_ONLY = 0;
/** The weight the Even Rows preset uses. */
const EVEN_ROWS = 4;
/** Just under the weight at which eight windows become full rows. */
const BELOW_EIGHT_THRESHOLD = 2;
/** Above the weight at which eight windows become full rows, below the one for ten. */
const BETWEEN_THRESHOLDS = 3;

const THREE = 3;
const FOUR = 4;
const FIVE = 5;
const SEVEN = 7;
const EIGHT = 8;
const NINE = 9;
const TEN = 10;

/** The number of windows in each row, top to bottom. */
function rowSizes(rects: readonly Rect[]): number[] {
  const perRow = new Map<number, number>();
  for (const rect of rects) perRow.set(rect.y, (perRow.get(rect.y) ?? 0) + 1);

  return [...perRow.entries()].sort(([a], [b]) => a - b).map(([, n]) => n);
}

function rowsFor(
  count: number,
  area: Readonly<Rect>,
  emptyCellWeight: number,
): number[] {
  return rowSizes(grid(count, area, { emptyCellWeight }));
}

describe("grid empty cell weight", () => {
  it("fills eight windows as rows of 3, 3 and 2 when only shape counts", () => {
    expect(rowsFor(EIGHT, WIDE, SHAPE_ONLY)).toEqual([THREE, THREE, 2]);
  });

  it("fills eight windows as two full rows of four with the even rows weight", () => {
    expect(rowsFor(EIGHT, WIDE, EVEN_ROWS)).toEqual([FOUR, FOUR]);
  });

  it("fills ten windows as two full rows of five with the even rows weight", () => {
    expect(rowsFor(TEN, WIDE, EVEN_ROWS)).toEqual([FIVE, FIVE]);
  });

  it("keeps a short last row where no full-row layout is close to the screen's shape", () => {
    expect(rowsFor(SEVEN, WIDE, EVEN_ROWS)).toEqual([FOUR, THREE]);
    expect(rowsFor(FIVE, WIDE, EVEN_ROWS)).toEqual([THREE, 2]);
  });

  it("tiles nine windows as 3x3 whatever the weight", () => {
    expect(rowsFor(NINE, WIDE, SHAPE_ONLY)).toEqual([THREE, THREE, THREE]);
    expect(rowsFor(NINE, WIDE, EVEN_ROWS)).toEqual([THREE, THREE, THREE]);
  });

  it("switches eight windows to full rows only above the weight of about 2.6", () => {
    expect(rowsFor(EIGHT, WIDE, BELOW_EIGHT_THRESHOLD)).toEqual([
      THREE,
      THREE,
      2,
    ]);
    expect(rowsFor(EIGHT, WIDE, BETWEEN_THRESHOLDS)).toEqual([FOUR, FOUR]);
  });

  it("keeps ten windows as 4, 4 and 2 until the weight passes about 3.06", () => {
    expect(rowsFor(TEN, WIDE, BETWEEN_THRESHOLDS)).toEqual([FOUR, FOUR, 2]);
    expect(rowsFor(TEN, WIDE, EVEN_ROWS)).toEqual([FIVE, FIVE]);
  });
});

describe("grid orientation", () => {
  it("puts two windows side by side on a wide screen and stacked on a tall one", () => {
    expect(rowsFor(2, WIDE, EVEN_ROWS)).toEqual([2]);
    expect(rowsFor(2, TALL, EVEN_ROWS)).toEqual([1, 1]);
  });
});
