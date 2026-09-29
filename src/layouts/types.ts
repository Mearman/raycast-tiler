/** An axis-aligned rectangle in integer points. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Computes one rectangle per window inside `area`.
 *
 * Returns exactly `count` rectangles in window order, which tile `area` without overlap. Returns an empty array when `count` is 0.
 */
export type AreaLayout = (count: number, area: Readonly<Rect>) => Rect[];

/** Settings a layout may read. Layouts that do not use a setting ignore it. */
export interface LayoutOptions {
  /**
   * How much the grid layout penalises empty cells, relative to how far its cells are from the area's own shape. Zero ignores empty cells and follows the area's shape alone; larger values prefer full rows. Must not be negative.
   */
  emptyCellWeight: number;
}

/** An {@link AreaLayout} that may also read the layout options. */
export type Layout = (
  count: number,
  area: Readonly<Rect>,
  options: Readonly<LayoutOptions>,
) => Rect[];

export const LAYOUT_IDS = [
  "grid",
  "columns",
  "rows",
  "main-stack",
  "spiral",
] as const;

export type LayoutId = (typeof LAYOUT_IDS)[number];

export function isLayoutId(value: unknown): value is LayoutId {
  return LAYOUT_IDS.some((id) => id === value);
}
