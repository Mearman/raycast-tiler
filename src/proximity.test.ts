import { describe, expect, it } from "vitest";
import { assignToNearestSlots, minimumCostAssignment } from "./proximity";

function permutations(size: number): number[][] {
  if (size === 0) return [[]];
  return permutations(size - 1).flatMap((shorter) =>
    Array.from({ length: size }, (_, position) => [
      ...shorter.slice(0, position),
      size - 1,
      ...shorter.slice(position),
    ]),
  );
}

function totalCost(cost: number[][], assignment: number[]): number {
  return assignment.reduce(
    (total, column, row) => total + (cost[row]?.[column] ?? Infinity),
    0,
  );
}

function pseudoRandomMatrix(size: number, seed: number): number[][] {
  let state = seed;
  const next = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return Math.floor(state / 65536) % 100;
  };
  return Array.from({ length: size }, () => Array.from({ length: size }, next));
}

describe("minimumCostAssignment", () => {
  it("matches the brute-force optimum on small matrices", () => {
    for (let size = 1; size <= 6; size++) {
      for (let seed = 1; seed <= 25; seed++) {
        const cost = pseudoRandomMatrix(size, seed * 7919 + size);
        const best = Math.min(
          ...permutations(size).map((assignment) =>
            totalCost(cost, assignment),
          ),
        );
        const assignment = minimumCostAssignment(cost);
        expect(new Set(assignment).size).toBe(size);
        expect(totalCost(cost, assignment)).toBe(best);
      }
    }
  });

  it("returns an empty assignment for an empty matrix", () => {
    expect(minimumCostAssignment([])).toEqual([]);
  });
});

describe("assignToNearestSlots", () => {
  const slots = [
    { x: 0, y: 0, width: 100, height: 100 },
    { x: 100, y: 0, width: 100, height: 100 },
    { x: 200, y: 0, width: 100, height: 100 },
  ];

  it("keeps windows in the slots nearest where they already are", () => {
    const windows = [
      { name: "right", x: 240, y: 40 },
      { name: "left", x: 10, y: 60 },
      { name: "middle", x: 120, y: 10 },
    ];
    const ordered = assignToNearestSlots(
      windows,
      (window) => ({ x: window.x, y: window.y }),
      slots,
    );
    expect(ordered.map((window) => window.name)).toEqual([
      "left",
      "middle",
      "right",
    ]);
  });

  it("minimises total movement rather than assigning greedily", () => {
    // "a" is closest to slot 1 (centre x=150), so a greedy pass gives it that slot and strands "b" in slot 0, 150 points away. The optimum sends "a" to slot 0 and "b" to slot 1.
    const windows = [
      { name: "a", x: 110, y: 50 },
      { name: "b", x: 200, y: 50 },
    ];
    const twoSlots = [
      { x: 0, y: 0, width: 100, height: 100 },
      { x: 100, y: 0, width: 100, height: 100 },
    ];
    const ordered = assignToNearestSlots(
      windows,
      (window) => ({ x: window.x, y: window.y }),
      twoSlots,
    );
    expect(ordered.map((window) => window.name)).toEqual(["a", "b"]);
  });

  it("rejects a mismatch between items and slots", () => {
    expect(() =>
      assignToNearestSlots([1, 2], () => ({ x: 0, y: 0 }), slots),
    ).toThrow();
  });
});
