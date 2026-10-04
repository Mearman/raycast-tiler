import { describe, expect, it } from "vitest";
import { layoutWindows } from "./layouts/layout-windows";
import {
  insertBeforeNumbered,
  isReorderAction,
  moveActiveTo,
  parseWindowNumber,
  REORDER_ACTIONS,
  rotate,
  swapActive,
  swapInDirection,
  swapWithNumbered,
} from "./reorder";
import type { LayoutOptions, Rect } from "./layouts/types";

/** A zero weight keeps the expectations below independent of how the grid penalises empty cells. */
const LAYOUT_OPTIONS: LayoutOptions = { emptyCellWeight: 0 };

describe("swapActive", () => {
  const isB = (item: string) => item === "b";

  it("swaps the active item with its next neighbour", () => {
    expect(swapActive(["a", "b", "c"], isB, 1)).toEqual(["a", "c", "b"]);
  });

  it("swaps the active item with its previous neighbour", () => {
    expect(swapActive(["a", "b", "c"], isB, -1)).toEqual(["b", "a", "c"]);
  });

  it("wraps around the ends", () => {
    expect(swapActive(["a", "b", "c"], (item) => item === "c", 1)).toEqual([
      "c",
      "b",
      "a",
    ]);
    expect(swapActive(["a", "b", "c"], (item) => item === "a", -1)).toEqual([
      "c",
      "b",
      "a",
    ]);
  });

  it("returns undefined when nothing is active", () => {
    expect(swapActive(["a", "b"], () => false, 1)).toBeUndefined();
  });

  it("leaves a single item alone", () => {
    expect(swapActive(["a"], (item) => item === "a", 1)).toEqual(["a"]);
  });

  it("does not modify its input", () => {
    const items = ["a", "b", "c"];
    swapActive(items, isB, 1);
    expect(items).toEqual(["a", "b", "c"]);
  });
});

describe("rotate", () => {
  // Rotating by the list length is a full turn.
  const FULL_TURN = 3;

  it("moves every item one slot forward, the last to the first", () => {
    expect(rotate(["a", "b", "c"], 1)).toEqual(["c", "a", "b"]);
  });

  it("moves every item one slot back, the first to the last", () => {
    expect(rotate(["a", "b", "c"], -1)).toEqual(["b", "c", "a"]);
  });

  it("is the identity for a full turn and for nothing to rotate", () => {
    expect(rotate(["a", "b", "c"], FULL_TURN)).toEqual(["a", "b", "c"]);
    expect(rotate([], 1)).toEqual([]);
  });
});

describe("moveActiveTo", () => {
  const isC = (item: string) => item === "c";

  it("moves the active item to the start, shifting the others along", () => {
    expect(moveActiveTo(["a", "b", "c", "d"], isC, "start")).toEqual([
      "c",
      "a",
      "b",
      "d",
    ]);
  });

  it("moves the active item to the end, shifting the others back", () => {
    expect(moveActiveTo(["a", "b", "c", "d"], isC, "end")).toEqual([
      "a",
      "b",
      "d",
      "c",
    ]);
  });

  it("leaves an item already at the edge in place", () => {
    expect(moveActiveTo(["c", "a", "b"], isC, "start")).toEqual([
      "c",
      "a",
      "b",
    ]);
    expect(moveActiveTo(["a", "b", "c"], isC, "end")).toEqual(["a", "b", "c"]);
  });

  it("returns undefined when nothing is active", () => {
    expect(moveActiveTo(["a", "b"], () => false, "start")).toBeUndefined();
  });
});

describe("swapInDirection", () => {
  const GRID_WINDOW_COUNT = 4;
  const slots = layoutWindows(
    "grid",
    GRID_WINDOW_COUNT,
    { x: 0, y: 0, width: 200, height: 200 },
    {
      gap: { value: 0, unit: "points", edge: true, between: true },
      options: LAYOUT_OPTIONS,
    },
  );
  const items = ["a", "b", "c", "d"];
  const isC = (item: string) => item === "c";

  it("swaps the active item with its neighbour in that direction", () => {
    expect(swapInDirection(items, slots, isC, "right")).toEqual([
      "a",
      "b",
      "d",
      "c",
    ]);
    expect(swapInDirection(items, slots, isC, "up")).toEqual([
      "c",
      "b",
      "a",
      "d",
    ]);
  });

  it("returns undefined when nothing is active", () => {
    expect(swapInDirection(items, slots, () => false, "left")).toBeUndefined();
  });

  it("throws when there is no neighbour that way", () => {
    expect(() => swapInDirection(items, slots, isC, "left")).toThrow(
      "No window to the left",
    );
  });
});

describe("isReorderAction", () => {
  it("accepts every action and nothing else", () => {
    for (const action of REORDER_ACTIONS)
      expect(isReorderAction(action)).toBe(true);
    expect(isReorderAction("sideways")).toBe(false);
  });
});

/** Side length of every numbered-move test slot. */
const CELL = 100;
const THIRD = 3;
const BEYOND_LAST = 5;
const FRACTION = 1.5;

/** Slots deliberately out of reading order: item `k` sits in `SHUFFLED[k]`, so in reading order the items run b, c, d, a. */
const SHUFFLED: Rect[] = [
  { x: CELL, y: CELL, width: CELL, height: CELL },
  { x: 0, y: 0, width: CELL, height: CELL },
  { x: CELL, y: 0, width: CELL, height: CELL },
  { x: 0, y: CELL, width: CELL, height: CELL },
];
const ITEMS = ["a", "b", "c", "d"];
const is = (name: string) => (item: string) => item === name;

describe("swapWithNumbered", () => {
  it("swaps the active item with the item at that place in reading order", () => {
    expect(swapWithNumbered(ITEMS, SHUFFLED, is("a"), 1)).toEqual([
      "b",
      "a",
      "c",
      "d",
    ]);
    expect(swapWithNumbered(ITEMS, SHUFFLED, is("b"), THIRD)).toEqual([
      "a",
      "d",
      "c",
      "b",
    ]);
  });

  it("changes nothing when the active item is at that place", () => {
    expect(swapWithNumbered(ITEMS, SHUFFLED, is("b"), 1)).toEqual(ITEMS);
  });

  it("returns undefined when nothing is active", () => {
    expect(swapWithNumbered(ITEMS, SHUFFLED, is("z"), 1)).toBeUndefined();
  });

  it.each([0, BEYOND_LAST, FRACTION, -1])("rejects place %s", (place) => {
    expect(() => swapWithNumbered(ITEMS, SHUFFLED, is("a"), place)).toThrow(
      /no window number/,
    );
  });
});

describe("insertBeforeNumbered", () => {
  it("moves the active item before the numbered one and shifts the ones between along", () => {
    expect(insertBeforeNumbered(ITEMS, SHUFFLED, is("a"), 2)).toEqual([
      "d",
      "b",
      "a",
      "c",
    ]);
  });

  it("moves a window from early in reading order to a later place", () => {
    expect(insertBeforeNumbered(ITEMS, SHUFFLED, is("b"), THIRD)).toEqual([
      "a",
      "c",
      "b",
      "d",
    ]);
  });

  it("changes nothing when inserting before itself", () => {
    expect(insertBeforeNumbered(ITEMS, SHUFFLED, is("b"), 1)).toEqual(ITEMS);
  });

  it("returns undefined when nothing is active", () => {
    expect(insertBeforeNumbered(ITEMS, SHUFFLED, is("z"), 1)).toBeUndefined();
  });

  it.each([0, BEYOND_LAST, FRACTION])("rejects place %s", (place) => {
    expect(() => insertBeforeNumbered(ITEMS, SHUFFLED, is("a"), place)).toThrow(
      /no window number/,
    );
  });
});

describe("parseWindowNumber", () => {
  it("reads a whole number, ignoring surrounding space", () => {
    expect(parseWindowNumber(" 3 ")).toBe(THIRD);
  });

  it.each(["", "  ", "two", "1.5"])("rejects %j", (raw) => {
    expect(() => parseWindowNumber(raw)).toThrow(/whole number/);
  });
});
