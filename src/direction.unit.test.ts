import { describe, expect, it } from "vitest";
import { neighbourInDirection } from "./direction";
import { layoutWindows } from "./layouts/layout-windows";
import type { Rect } from "./layouts/types";

const AREA: Rect = { x: 0, y: 0, width: 900, height: 900 };
const GRID_CELL_COUNT = 9;
const MAIN_STACK_WINDOW_COUNT = 3;
// Slot indices of the 3x3 grid, in reading order (0, 1 and 2 are the top row and need no name).
const GRID_MIDDLE_LEFT = 3;
const GRID_CENTRE = 4;
const GRID_MIDDLE_RIGHT = 5;
const GRID_BOTTOM_CENTRE = 7;
const GRID_BOTTOM_RIGHT = 8;
const NO_GAP = { value: 0, unit: "points", edge: true, between: true } as const;

describe("neighbourInDirection", () => {
  // Slot order of a 3x3 grid: 0 1 2 / 3 4 5 / 6 7 8.
  const grid = layoutWindows("grid", GRID_CELL_COUNT, AREA, NO_GAP);

  it("finds the adjacent cell in each direction", () => {
    expect(neighbourInDirection(grid, GRID_CENTRE, "left")).toBe(
      GRID_MIDDLE_LEFT,
    );
    expect(neighbourInDirection(grid, GRID_CENTRE, "right")).toBe(
      GRID_MIDDLE_RIGHT,
    );
    expect(neighbourInDirection(grid, GRID_CENTRE, "up")).toBe(1);
    expect(neighbourInDirection(grid, GRID_CENTRE, "down")).toBe(
      GRID_BOTTOM_CENTRE,
    );
  });

  it("returns undefined at the edge of the layout", () => {
    expect(neighbourInDirection(grid, 0, "left")).toBeUndefined();
    expect(neighbourInDirection(grid, 0, "up")).toBeUndefined();
    expect(
      neighbourInDirection(grid, GRID_BOTTOM_RIGHT, "right"),
    ).toBeUndefined();
    expect(
      neighbourInDirection(grid, GRID_BOTTOM_RIGHT, "down"),
    ).toBeUndefined();
  });

  it("does not treat a diagonal cell as a left or right neighbour", () => {
    expect(neighbourInDirection(grid, 0, "right")).toBe(1);
    expect(neighbourInDirection(grid, 0, "down")).toBe(GRID_MIDDLE_LEFT);
  });

  it("chooses the better aligned cell when two are equally near", () => {
    const stack = layoutWindows(
      "main-stack",
      MAIN_STACK_WINDOW_COUNT,
      AREA,
      NO_GAP,
    );
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
