import { describe, expect, it } from "vitest";
import { moveActiveTo, rotate, swapActive } from "./reorder";

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
  it("moves every item one slot forward, the last to the first", () => {
    expect(rotate(["a", "b", "c"], 1)).toEqual(["c", "a", "b"]);
  });

  it("moves every item one slot back, the first to the last", () => {
    expect(rotate(["a", "b", "c"], -1)).toEqual(["b", "c", "a"]);
  });

  it("is the identity for a full turn and for nothing to rotate", () => {
    expect(rotate(["a", "b", "c"], 3)).toEqual(["a", "b", "c"]);
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
