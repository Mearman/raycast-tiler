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
export type Layout = (count: number, area: Readonly<Rect>) => Rect[];

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
