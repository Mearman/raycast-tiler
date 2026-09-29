import { describe, expect, it } from "vitest";
import { layoutWindows, STACK_LAYOUT_IDS, TILING_LAYOUT_IDS } from "./index";
import type { LayoutId, Rect } from "./types";

const STACK_OFFSET = 40;

function lay(id: LayoutId, count: number, area: Rect, gap = 0): Rect[] {
  return layoutWindows(id, count, area, gap, { stackOffset: STACK_OFFSET });
}

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

describe.each(TILING_LAYOUT_IDS)("%s layout", (id) => {
  it("returns no rectangles for no windows", () => {
    expect(lay(id, 0, SCREEN, 0)).toEqual([]);
  });

  it.each(AREAS)(
    "tiles $width x $height exactly for every window count",
    (area) => {
      for (const count of COUNTS) {
        const rects = lay(id, count, area, 0);
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
    const rects = lay(id, 4, area, gap);
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
    expect(lay("grid", 4, area, 0)).toEqual([
      { x: 0, y: 0, width: 500, height: 400 },
      { x: 500, y: 0, width: 500, height: 400 },
      { x: 0, y: 400, width: 500, height: 400 },
      { x: 500, y: 400, width: 500, height: 400 },
    ]);
  });

  it("places nine windows in a 3x3 grid on a widescreen area", () => {
    const rects = lay("grid", 9, { x: 0, y: 0, width: 1920, height: 1080 }, 0);
    expect(new Set(rects.map((rect) => rect.x)).size).toBe(3);
    expect(new Set(rects.map((rect) => rect.y)).size).toBe(3);
  });

  it("places seven windows in two rows of four and three", () => {
    const rects = lay("grid", 7, { x: 0, y: 0, width: 1920, height: 1080 }, 0);
    expect(rects.filter((rect) => rect.y === 0)).toHaveLength(4);
    expect(rects.filter((rect) => rect.y !== 0)).toHaveLength(3);
  });

  it("stretches a short final grid row across the full width", () => {
    const rects = lay("grid", 5, area, 0);
    const lastRow = rects.filter((rect) => rect.y !== 0);
    expect(lastRow).toEqual([
      { x: 0, y: 400, width: 500, height: 400 },
      { x: 500, y: 400, width: 500, height: 400 },
    ]);
  });

  it("gives the first window the left half in main-stack", () => {
    expect(lay("main-stack", 3, area, 0)).toEqual([
      { x: 0, y: 0, width: 500, height: 800 },
      { x: 500, y: 0, width: 500, height: 400 },
      { x: 500, y: 400, width: 500, height: 400 },
    ]);
  });

  it("spirals clockwise: left, top, right, bottom", () => {
    expect(lay("spiral", 5, area, 0)).toEqual([
      { x: 0, y: 0, width: 500, height: 800 },
      { x: 500, y: 0, width: 500, height: 400 },
      { x: 750, y: 400, width: 250, height: 400 },
      { x: 500, y: 600, width: 250, height: 200 },
      { x: 500, y: 400, width: 250, height: 200 },
    ]);
  });
});

describe.each(STACK_LAYOUT_IDS)("%s layout", (id) => {
  const axis = id === "stack-horizontal" ? "x" : "y";
  const across = axis === "x" ? "y" : "x";
  const lengthKey = axis === "x" ? "width" : "height";
  const acrossKey = axis === "x" ? "height" : "width";

  it("returns no rectangles for no windows", () => {
    expect(lay(id, 0, SCREEN)).toEqual([]);
  });

  it("gives a lone window the whole area", () => {
    expect(lay(id, 1, SCREEN)).toEqual([SCREEN]);
  });

  it.each(AREAS)("cascades $width x $height in equal-sized windows", (area) => {
    for (const count of COUNTS) {
      const rects = lay(id, count, area);
      expect(rects).toHaveLength(count);
      const [first] = rects;
      expect(new Set(rects.map((rect) => rect.width)).size).toBe(1);
      expect(new Set(rects.map((rect) => rect.height)).size).toBe(1);
      expect(first?.[axis]).toBe(area[axis]);
      expect(rects.every((rect) => rect[across] === area[across])).toBe(true);
      expect(rects.every((rect) => rect[acrossKey] === area[acrossKey])).toBe(
        true,
      );
      const last = rects.at(-1);
      expect(last === undefined ? 0 : last[axis] + last[lengthKey]).toBe(
        area[axis] + area[lengthKey],
      );
      rects.slice(1).forEach((rect, index) => {
        const previous = rects[index];
        const step = previous === undefined ? 0 : rect[axis] - previous[axis];
        expect(step).toBeGreaterThan(0);
        expect(step).toBeLessThanOrEqual(STACK_OFFSET);
      });
    }
  });

  it("offsets each window by exactly the requested amount when there is room", () => {
    const rects = lay(id, 3, SCREEN);
    expect(rects.map((rect) => rect[axis])).toEqual([
      SCREEN[axis],
      SCREEN[axis] + STACK_OFFSET,
      SCREEN[axis] + 2 * STACK_OFFSET,
    ]);
    expect(rects[0]?.[lengthKey]).toBe(SCREEN[lengthKey] - 2 * STACK_OFFSET);
  });

  it("keeps every window at least half the area along the stacking axis", () => {
    for (const rect of lay(id, 40, SCREEN)) {
      expect(rect[lengthKey]).toBeGreaterThanOrEqual(SCREEN[lengthKey] / 2);
    }
  });

  it("insets the whole cascade by the gap", () => {
    const gap = 10;
    const rects = lay(id, 3, SCREEN, gap);
    expect(rects[0]?.[axis]).toBe(SCREEN[axis] + gap);
    const last = rects.at(-1);
    expect(last === undefined ? 0 : last[axis] + last[lengthKey]).toBe(
      SCREEN[axis] + SCREEN[lengthKey] - gap,
    );
  });
});
