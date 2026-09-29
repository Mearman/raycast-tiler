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

function totalCost(
  cost: readonly number[][],
  assignment: readonly number[],
): number {
  return assignment.reduce(
    (total, column, row) => total + (cost[row]?.[column] ?? Infinity),
    0,
  );
}

/** Multiplier of the linear congruential generator (Numerical Recipes parameters). */
const LCG_MULTIPLIER = 1664525;
/** Increment of the linear congruential generator. */
const LCG_INCREMENT = 1013904223;
/** Modulus of the linear congruential generator, 2 to the power 32. */
const LCG_MODULUS = 4294967296;
/** Discards the low-order bits of the generator state, which have short periods. */
const LCG_LOW_BITS_DIVISOR = 65536;
/** Exclusive upper bound of each generated matrix cost. */
const COST_RANGE = 100;
/** Largest matrix size checked against brute force, bounded by the factorial number of permutations. */
const MAX_BRUTE_FORCE_SIZE = 6;
/** Number of seeds tried for each matrix size. */
const SEEDS_PER_SIZE = 25;
/** Prime that spreads consecutive seeds across the generator's state space. */
const SEED_STRIDE = 7919;

function pseudoRandomMatrix(size: number, seed: number): number[][] {
  let state = seed;
  const next = () => {
    state = (state * LCG_MULTIPLIER + LCG_INCREMENT) % LCG_MODULUS;

    return Math.floor(state / LCG_LOW_BITS_DIVISOR) % COST_RANGE;
  };

  return Array.from({ length: size }, () => Array.from({ length: size }, next));
}

describe("minimumCostAssignment", () => {
  it("matches the brute-force optimum on small matrices", () => {
    for (let size = 1; size <= MAX_BRUTE_FORCE_SIZE; size++) {
      for (let seed = 1; seed <= SEEDS_PER_SIZE; seed++) {
        const cost = pseudoRandomMatrix(size, seed * SEED_STRIDE + size);
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
