import { describe, expect, it } from "vitest";
import { LAYOUT_IDS, layoutWindows } from "./index";
import type { Rect } from "./types";

const SCREEN: Rect = { x: 0, y: 0, width: 1920, height: 1080 };

const AREAS: Rect[] = [
  SCREEN,
  { x: 0, y: 0, width: 1512, height: 982 },
  { x: 0, y: 0, width: 1081, height: 607 },
  { x: 0, y: 0, width: 900, height: 1600 },
];

const COUNTS = Array.from({ length: 13 }, (_, index) => index + 1);

function overlaps(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

describe.each(LAYOUT_IDS)("%s layout", (id) => {
  it("returns no rectangles for no windows", () => {
    expect(layoutWindows(id, 0, SCREEN, 0)).toEqual([]);
  });

  it.each(AREAS)(
    "tiles $width x $height exactly for every window count",
    (area) => {
      for (const count of COUNTS) {
        const rects = layoutWindows(id, count, area, 0);
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
          rects
            .slice(index + 1)
            .forEach((other) => expect(overlaps(rect, other)).toBe(false));
        });
      }
    },
  );

  it("leaves the requested gap around the edge and between windows", () => {
    const area = SCREEN;
    const gap = 10;
    const rects = layoutWindows(id, 4, area, gap);
    expect(Math.min(...rects.map((rect) => rect.x))).toBe(area.x + gap);
    expect(Math.min(...rects.map((rect) => rect.y))).toBe(area.y + gap);
    expect(Math.max(...rects.map((rect) => rect.x + rect.width))).toBe(
      area.x + area.width - gap,
    );
    expect(Math.max(...rects.map((rect) => rect.y + rect.height))).toBe(
      area.y + area.height - gap,
    );
    rects.forEach((rect, index) => {
      rects
        .slice(index + 1)
        .forEach((other) => expect(overlaps(rect, other)).toBe(false));
    });
  });
});

describe("layout shapes", () => {
  const area: Rect = { x: 0, y: 0, width: 1000, height: 800 };

  it("places four windows in a 2x2 grid", () => {
    expect(layoutWindows("grid", 4, area, 0)).toEqual([
      { x: 0, y: 0, width: 500, height: 400 },
      { x: 500, y: 0, width: 500, height: 400 },
      { x: 0, y: 400, width: 500, height: 400 },
      { x: 500, y: 400, width: 500, height: 400 },
    ]);
  });

  it("stretches a short final grid row across the full width", () => {
    const rects = layoutWindows("grid", 3, area, 0);
    expect(rects[2]).toEqual({ x: 0, y: 400, width: 1000, height: 400 });
  });

  it("gives the first window the left half in main-stack", () => {
    expect(layoutWindows("main-stack", 3, area, 0)).toEqual([
      { x: 0, y: 0, width: 500, height: 800 },
      { x: 500, y: 0, width: 500, height: 400 },
      { x: 500, y: 400, width: 500, height: 400 },
    ]);
  });

  it("spirals clockwise: left, top, right, bottom", () => {
    expect(layoutWindows("spiral", 5, area, 0)).toEqual([
      { x: 0, y: 0, width: 500, height: 800 },
      { x: 500, y: 0, width: 500, height: 400 },
      { x: 750, y: 400, width: 250, height: 400 },
      { x: 500, y: 600, width: 250, height: 200 },
      { x: 500, y: 400, width: 250, height: 200 },
    ]);
  });
});
