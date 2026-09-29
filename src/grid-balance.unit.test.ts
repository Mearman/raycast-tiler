import { describe, expect, it } from "vitest";
import {
  emptyCellWeightFor,
  GRID_BALANCES,
  isGridBalance,
} from "./grid-balance";

/** A weight no preset uses, so a preset result cannot come from it. */
const CUSTOM_WEIGHT = 7.5;

describe("emptyCellWeightFor", () => {
  it("ignores the custom weight for the fixed presets", () => {
    expect(emptyCellWeightFor("screen-shape", CUSTOM_WEIGHT)).toBe(0);
    expect(emptyCellWeightFor("even-rows", CUSTOM_WEIGHT)).toBeGreaterThan(0);
    expect(emptyCellWeightFor("even-rows", CUSTOM_WEIGHT)).not.toBe(
      CUSTOM_WEIGHT,
    );
  });

  it("uses the custom weight for the custom balance", () => {
    expect(emptyCellWeightFor("custom", CUSTOM_WEIGHT)).toBe(CUSTOM_WEIGHT);
  });
});

describe("isGridBalance", () => {
  it("accepts every balance and nothing else", () => {
    for (const balance of GRID_BALANCES)
      expect(isGridBalance(balance)).toBe(true);
    expect(isGridBalance("random")).toBe(false);
  });
});
