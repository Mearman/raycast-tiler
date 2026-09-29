import { describe, expect, it } from "vitest";
import { applyGap, type Gap } from "./gap";
import { layoutWindows } from "./layout-windows";
import type { Rect } from "./types";
import type { LayoutOptions } from "./types";

/** A zero weight keeps the expectations below independent of how the grid penalises empty cells. */
const LAYOUT_OPTIONS: LayoutOptions = { emptyCellWeight: 0 };

const AREA_WIDTH = 1000;
const AREA_HEIGHT = 800;
const AREA: Rect = { x: 0, y: 0, width: AREA_WIDTH, height: AREA_HEIGHT };
// Gap size in points used by most cases.
const GAP = 20;
// Gap size in points, or percent for the percentage units.
const SMALL_GAP = 10;
// Negative gap large enough to make neighbouring columns overlap visibly.
const OVERLAP_GAP = 40;
// Column count for which a gap of TOO_LARGE_GAP points leaves no room.
const CROWDED_COLUMNS = 4;
// Gap in points that leaves no room for a window when there are CROWDED_COLUMNS columns.
const TOO_LARGE_GAP = 300;
// Screen percentage gap that leaves no room for two columns.
const TOO_LARGE_SCREEN_PERCENT = 100;
const points = (value: number): Gap => ({
  value,
  unit: "points",
  edge: true,
  between: true,
});

describe("applyGap", () => {
  const left: Rect = { x: 0, y: 0, width: 500, height: 800 };
  const right: Rect = { x: 500, y: 0, width: 500, height: 800 };

  it("insets the full gap on the area's boundary and half on shared sides", () => {
    expect(applyGap(left, AREA, points(GAP))).toEqual({
      x: 20,
      y: 20,
      width: 470,
      height: 760,
    });
    expect(applyGap(right, AREA, points(GAP))).toEqual({
      x: 510,
      y: 20,
      width: 470,
      height: 760,
    });
  });

  it("leaves neighbours exactly the gap apart", () => {
    const a = applyGap(left, AREA, points(GAP));
    const b = applyGap(right, AREA, points(GAP));
    expect(b.x - (a.x + a.width)).toBe(GAP);
  });

  it("makes neighbours overlap by the gap when negative, without leaving the area", () => {
    const a = applyGap(left, AREA, points(-GAP));
    const b = applyGap(right, AREA, points(-GAP));
    expect(a.x + a.width - b.x).toBe(GAP);
    expect(a.x).toBe(0);
    expect(a.y).toBe(0);
    expect(b.x + b.width).toBe(AREA_WIDTH);
    expect(b.y + b.height).toBe(AREA_HEIGHT);
  });

  it("leaves the boundary flush when the edge gap is off", () => {
    const gap: Gap = { ...points(GAP), edge: false };
    expect(applyGap(left, AREA, gap)).toEqual({
      x: 0,
      y: 0,
      width: 490,
      height: 800,
    });
  });

  it("leaves shared sides flush when the between gap is off", () => {
    const gap: Gap = { ...points(GAP), between: false };
    expect(applyGap(left, AREA, gap)).toEqual({
      x: 20,
      y: 20,
      width: 480,
      height: 760,
    });
    const a = applyGap(left, AREA, gap);
    const b = applyGap(right, AREA, gap);
    expect(b.x - (a.x + a.width)).toBe(0);
  });

  it("applies no gap at all when both are off", () => {
    const gap: Gap = { ...points(GAP), edge: false, between: false };
    expect(applyGap(left, AREA, gap)).toEqual(left);
  });

  it("measures a window percentage against each window's own size, per axis", () => {
    const gap: Gap = { ...points(SMALL_GAP), unit: "window" };
    expect(applyGap(left, AREA, gap)).toEqual({
      x: 50,
      y: 80,
      width: 425,
      height: 640,
    });
  });

  it("measures a screen percentage against the area's size, per axis", () => {
    const gap: Gap = { ...points(SMALL_GAP), unit: "screen" };
    expect(applyGap(left, AREA, gap)).toEqual({
      x: 100,
      y: 80,
      width: 350,
      height: 640,
    });
  });
});

describe("layoutWindows gaps", () => {
  it("returns the slots untouched for a zero gap", () => {
    expect(
      layoutWindows("columns", 2, AREA, {
        gap: points(0),
        options: LAYOUT_OPTIONS,
      }),
    ).toEqual([
      { x: 0, y: 0, width: 500, height: 800 },
      { x: 500, y: 0, width: 500, height: 800 },
    ]);
  });

  it("overlaps neighbouring windows for a negative gap", () => {
    const [a, b] = layoutWindows("columns", 2, AREA, {
      gap: points(-OVERLAP_GAP),
      options: LAYOUT_OPTIONS,
    });
    expect(a === undefined || b === undefined).toBe(false);
    if (a === undefined || b === undefined) return;
    expect(a.x + a.width - b.x).toBe(OVERLAP_GAP);
  });

  it("throws when the gap leaves no room for a window", () => {
    expect(() =>
      layoutWindows("columns", CROWDED_COLUMNS, AREA, {
        gap: points(TOO_LARGE_GAP),
        options: LAYOUT_OPTIONS,
      }),
    ).toThrow("no room");
    expect(() =>
      layoutWindows("columns", 2, AREA, {
        gap: {
          ...points(TOO_LARGE_SCREEN_PERCENT),
          unit: "screen",
        },
        options: LAYOUT_OPTIONS,
      }),
    ).toThrow("no room");
  });
});
