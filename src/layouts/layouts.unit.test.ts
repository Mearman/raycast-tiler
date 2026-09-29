import { describe, expect, it } from "vitest";
import { LAYOUT_IDS } from "./types";
import { layoutWindows } from "./layout-windows";
import type { Gap } from "./gap";
import type { Rect } from "./types";
import type { LayoutOptions } from "./types";

/** A zero weight keeps the expectations below independent of how the grid penalises empty cells. */
const LAYOUT_OPTIONS: LayoutOptions = { emptyCellWeight: 0 };

const NO_GAP: Gap = { value: 0, unit: "points", edge: true, between: true };

const SCREEN: Rect = { x: 0, y: 0, width: 1920, height: 1080 };

const AREAS: Rect[] = [
  SCREEN,
  { x: 0, y: 0, width: 1512, height: 982 },
  { x: 0, y: 0, width: 1081, height: 607 },
  { x: 0, y: 0, width: 900, height: 1600 },
];

/** Window count used by the 2x2 grid and gap tests. */
const FOUR_WINDOWS = 4;

/** Window count that fills a 3x3 grid. */
const NINE_WINDOWS = 9;

/** Window count that fills two grid rows of four and three. */
const SEVEN_WINDOWS = 7;

/** Window count that leaves a short final grid row of two. */
const FIVE_WINDOWS = 5;

/** Window count for the main-stack shape: one main window and two stacked. */
const THREE_WINDOWS = 3;

/** Number of columns and rows in a 3x3 grid. */
const THREE_TRACKS = 3;

/** Number of windows in the longer row of a seven-window grid. */
const FOUR_IN_ROW = 4;

/** Widescreen area used by the grid shape tests. */
const WIDESCREEN: Rect = { x: 0, y: 0, width: 1920, height: 1080 };

const COUNTS = Array.from({ length: 13 }, (_, index) => index + 1);

function overlaps(a: Readonly<Rect>, b: Readonly<Rect>): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

describe.each(LAYOUT_IDS)("%s layout", (id) => {
  it("returns no rectangles for no windows", () => {
    expect(
      layoutWindows(id, 0, SCREEN, { gap: NO_GAP, options: LAYOUT_OPTIONS }),
    ).toEqual([]);
  });

  it.each(AREAS)(
    "tiles $width x $height exactly for every window count",
    (area) => {
      for (const count of COUNTS) {
        const rects = layoutWindows(id, count, area, {
          gap: NO_GAP,
          options: LAYOUT_OPTIONS,
        });
        expect(rects).toHaveLength(count);
        const covered = rects.reduce(
          (total, rect) => total + rect.width * rect.height,
          0,
        );
        expect(covered).toBe(area.width * area.height);
        for (const rect of rects) {
          expect(rect.width).toBeGreaterThan(0);
          expect(rect.height).toBeGreaterThan(0);
          expect(rect.x).toBeGreaterThanOrEqual(area.x);
          expect(rect.y).toBeGreaterThanOrEqual(area.y);
          expect(rect.x + rect.width).toBeLessThanOrEqual(area.x + area.width);
          expect(rect.y + rect.height).toBeLessThanOrEqual(
            area.y + area.height,
          );
        }
        rects.forEach((rect, index) => {
          rects.slice(index + 1).forEach((other) => {
            expect(overlaps(rect, other)).toBe(false);
          });
        });
      }
    },
  );

  it("leaves the requested gap around the edge and between windows", () => {
    const gap = 10;
    const rects = layoutWindows(id, FOUR_WINDOWS, SCREEN, {
      gap: {
        value: gap,
        unit: "points",
        edge: true,
        between: true,
      },
      options: LAYOUT_OPTIONS,
    });
    expect(Math.min(...rects.map((rect) => rect.x))).toBe(SCREEN.x + gap);
    expect(Math.min(...rects.map((rect) => rect.y))).toBe(SCREEN.y + gap);
    expect(Math.max(...rects.map((rect) => rect.x + rect.width))).toBe(
      SCREEN.x + SCREEN.width - gap,
    );
    expect(Math.max(...rects.map((rect) => rect.y + rect.height))).toBe(
      SCREEN.y + SCREEN.height - gap,
    );
    rects.forEach((rect, index) => {
      rects.slice(index + 1).forEach((other) => {
        expect(overlaps(rect, other)).toBe(false);
      });
    });
  });
});

describe("layout shapes", () => {
  const area: Rect = { x: 0, y: 0, width: 1000, height: 800 };

  it("places four windows in a 2x2 grid", () => {
    expect(
      layoutWindows("grid", FOUR_WINDOWS, area, {
        gap: NO_GAP,
        options: LAYOUT_OPTIONS,
      }),
    ).toEqual([
      { x: 0, y: 0, width: 500, height: 400 },
      { x: 500, y: 0, width: 500, height: 400 },
      { x: 0, y: 400, width: 500, height: 400 },
      { x: 500, y: 400, width: 500, height: 400 },
    ]);
  });

  it("places nine windows in a 3x3 grid on a widescreen area", () => {
    const rects = layoutWindows("grid", NINE_WINDOWS, WIDESCREEN, {
      gap: NO_GAP,
      options: LAYOUT_OPTIONS,
    });
    expect(new Set(rects.map((rect) => rect.x)).size).toBe(THREE_TRACKS);
    expect(new Set(rects.map((rect) => rect.y)).size).toBe(THREE_TRACKS);
  });

  it("places seven windows in two rows of four and three", () => {
    const rects = layoutWindows("grid", SEVEN_WINDOWS, WIDESCREEN, {
      gap: NO_GAP,
      options: LAYOUT_OPTIONS,
    });
    expect(rects.filter((rect) => rect.y === 0)).toHaveLength(FOUR_IN_ROW);
    expect(rects.filter((rect) => rect.y !== 0)).toHaveLength(THREE_WINDOWS);
  });

  it("stretches a short final grid row across the full width", () => {
    const rects = layoutWindows("grid", FIVE_WINDOWS, area, {
      gap: NO_GAP,
      options: LAYOUT_OPTIONS,
    });
    const lastRow = rects.filter((rect) => rect.y !== 0);
    expect(lastRow).toEqual([
      { x: 0, y: 400, width: 500, height: 400 },
      { x: 500, y: 400, width: 500, height: 400 },
    ]);
  });

  it("gives the first window the left half in main-stack", () => {
    expect(
      layoutWindows("main-stack", THREE_WINDOWS, area, {
        gap: NO_GAP,
        options: LAYOUT_OPTIONS,
      }),
    ).toEqual([
      { x: 0, y: 0, width: 500, height: 800 },
      { x: 500, y: 0, width: 500, height: 400 },
      { x: 500, y: 400, width: 500, height: 400 },
    ]);
  });

  it("spirals clockwise: left, top, right, bottom", () => {
    expect(
      layoutWindows("spiral", FIVE_WINDOWS, area, {
        gap: NO_GAP,
        options: LAYOUT_OPTIONS,
      }),
    ).toEqual([
      { x: 0, y: 0, width: 500, height: 800 },
      { x: 500, y: 0, width: 500, height: 400 },
      { x: 750, y: 400, width: 250, height: 400 },
      { x: 500, y: 600, width: 250, height: 200 },
      { x: 500, y: 400, width: 250, height: 200 },
    ]);
  });
});
