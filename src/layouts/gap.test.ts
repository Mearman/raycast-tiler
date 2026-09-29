import { describe, expect, it } from "vitest";
import { applyGap, type Gap } from "./gap";
import { layoutWindows } from "./index";
import type { Rect } from "./types";

const AREA: Rect = { x: 0, y: 0, width: 1000, height: 800 };
const points = (value: number): Gap => ({ value, unit: "points" });

describe("applyGap", () => {
  const left: Rect = { x: 0, y: 0, width: 500, height: 800 };
  const right: Rect = { x: 500, y: 0, width: 500, height: 800 };

  it("insets the full gap on the area's boundary and half on shared sides", () => {
    expect(applyGap(left, AREA, points(20))).toEqual({
      x: 20,
      y: 20,
      width: 470,
      height: 760,
    });
    expect(applyGap(right, AREA, points(20))).toEqual({
      x: 510,
      y: 20,
      width: 470,
      height: 760,
    });
  });

  it("leaves neighbours exactly the gap apart", () => {
    const a = applyGap(left, AREA, points(20));
    const b = applyGap(right, AREA, points(20));
    expect(b.x - (a.x + a.width)).toBe(20);
  });

  it("makes neighbours overlap by the gap when negative, without leaving the area", () => {
    const a = applyGap(left, AREA, points(-20));
    const b = applyGap(right, AREA, points(-20));
    expect(a.x + a.width - b.x).toBe(20);
    expect(a.x).toBe(0);
    expect(a.y).toBe(0);
    expect(b.x + b.width).toBe(1000);
    expect(b.y + b.height).toBe(800);
  });

  it("measures a window percentage against each window's own size, per axis", () => {
    const gap: Gap = { value: 10, unit: "window" };
    expect(applyGap(left, AREA, gap)).toEqual({
      x: 50,
      y: 80,
      width: 425,
      height: 640,
    });
  });

  it("measures a screen percentage against the area's size, per axis", () => {
    const gap: Gap = { value: 10, unit: "screen" };
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
    expect(layoutWindows("columns", 2, AREA, points(0))).toEqual([
      { x: 0, y: 0, width: 500, height: 800 },
      { x: 500, y: 0, width: 500, height: 800 },
    ]);
  });

  it("overlaps neighbouring windows for a negative gap", () => {
    const [a, b] = layoutWindows("columns", 2, AREA, points(-40));
    expect(a === undefined || b === undefined).toBe(false);
    if (a === undefined || b === undefined) return;
    expect(a.x + a.width - b.x).toBe(40);
  });

  it("throws when the gap leaves no room for a window", () => {
    expect(() => layoutWindows("columns", 4, AREA, points(300))).toThrow(
      "no room",
    );
    expect(() =>
      layoutWindows("columns", 2, AREA, { value: 100, unit: "screen" }),
    ).toThrow("no room");
  });
});
