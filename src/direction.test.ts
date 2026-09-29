import { describe, expect, it } from "vitest";
import { neighbourInDirection } from "./direction";
import { layoutWindows } from "./layouts";
import type { Rect } from "./layouts";

const AREA: Rect = { x: 0, y: 0, width: 900, height: 900 };
const NO_GAP = { value: 0, unit: "points", edge: true, between: true } as const;

describe("neighbourInDirection", () => {
  // Slot order of a 3x3 grid: 0 1 2 / 3 4 5 / 6 7 8.
  const grid = layoutWindows("grid", 9, AREA, NO_GAP);

  it("finds the adjacent cell in each direction", () => {
    expect(neighbourInDirection(grid, 4, "left")).toBe(3);
    expect(neighbourInDirection(grid, 4, "right")).toBe(5);
    expect(neighbourInDirection(grid, 4, "up")).toBe(1);
    expect(neighbourInDirection(grid, 4, "down")).toBe(7);
  });

  it("returns undefined at the edge of the layout", () => {
    expect(neighbourInDirection(grid, 0, "left")).toBeUndefined();
    expect(neighbourInDirection(grid, 0, "up")).toBeUndefined();
    expect(neighbourInDirection(grid, 8, "right")).toBeUndefined();
    expect(neighbourInDirection(grid, 8, "down")).toBeUndefined();
  });

  it("does not treat a diagonal cell as a left or right neighbour", () => {
    expect(neighbourInDirection(grid, 0, "right")).toBe(1);
    expect(neighbourInDirection(grid, 0, "down")).toBe(3);
  });

  it("chooses the better aligned cell when two are equally near", () => {
    const stack = layoutWindows("main-stack", 3, AREA, NO_GAP);
    // The main window's centre is level with the boundary between the two stacked windows.
    expect(neighbourInDirection(stack, 0, "right")).toBe(1);
    expect(neighbourInDirection(stack, 1, "left")).toBe(0);
    expect(neighbourInDirection(stack, 1, "down")).toBe(2);
    expect(neighbourInDirection(stack, 2, "up")).toBe(1);
  });

  it("finds nothing across a single window", () => {
    const single = layoutWindows("grid", 1, AREA, NO_GAP);
    expect(neighbourInDirection(single, 0, "left")).toBeUndefined();
  });
});
