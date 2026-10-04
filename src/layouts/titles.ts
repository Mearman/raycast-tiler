import type { LayoutId } from "./types";

/** The name each layout goes by in the interface; the Layout preference lists the same names. */
export const LAYOUT_TITLES: Record<LayoutId, string> = {
  grid: "Grid",
  columns: "Columns",
  rows: "Rows",
  "main-stack": "Main and Stack",
  spiral: "Spiral",
};
