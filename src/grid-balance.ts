/** Named choices for how strongly the grid layout avoids a short last row. */
export const GRID_BALANCES = ["even-rows", "screen-shape", "custom"] as const;

export type GridBalance = (typeof GRID_BALANCES)[number];

export function isGridBalance(value: unknown): value is GridBalance {
  return GRID_BALANCES.some((balance) => balance === value);
}

/**
 * Empty cell weight for each preset that has a fixed one.
 *
 * `even-rows` is the smallest whole number for which eight windows (two rows of four) and ten windows (two rows of five) both tile as full rows. Measured against the shape mismatch of the uneven alternatives, eight needs a weight above 2.6 and ten above 3.06. `screen-shape` ignores empty cells.
 */
const PRESET_WEIGHTS: Readonly<Record<"even-rows" | "screen-shape", number>> = {
  "even-rows": 4,
  "screen-shape": 0,
};

/** The empty cell weight for `balance`; `custom` uses `customWeight`. */
export function emptyCellWeightFor(
  balance: GridBalance,
  customWeight: number,
): number {
  return balance === "custom" ? customWeight : PRESET_WEIGHTS[balance];
}
