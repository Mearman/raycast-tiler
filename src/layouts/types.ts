/** An axis-aligned rectangle in integer points. */
export type Rect = { x: number; y: number; width: number; height: number };

/** Settings a layout may read. Layouts that do not use a setting ignore it. */
export type LayoutOptions = {
  /** Points of each stacked window left visible beyond the one above it. */
  stackOffset: number;
};

/**
 * A layout that needs only the window count and the area.
 *
 * Returns exactly `count` rectangles in window order, tiling `area` without overlap. Returns an empty array when `count` is 0.
 */
export type AreaLayout = (count: number, area: Rect) => Rect[];

/**
 * Any layout, given every setting a layout may read.
 *
 * Returns exactly `count` rectangles in window order. Returns an empty array when `count` is 0. An {@link AreaLayout} is a `Layout` that ignores the options; stack layouts read them and deliberately overlap.
 */
export type Layout = (
  count: number,
  area: Rect,
  options: LayoutOptions,
) => Rect[];

/** Layouts whose rectangles tile the area exactly. */
export const TILING_LAYOUT_IDS = [
  "grid",
  "columns",
  "rows",
  "main-stack",
  "spiral",
] as const;

/** Layouts of equal-sized windows overlapping in a cascade. */
export const STACK_LAYOUT_IDS = ["stack-horizontal", "stack-vertical"] as const;

export const LAYOUT_IDS = [...TILING_LAYOUT_IDS, ...STACK_LAYOUT_IDS] as const;

export type LayoutId = (typeof LAYOUT_IDS)[number];

export function isLayoutId(value: unknown): value is LayoutId {
  return LAYOUT_IDS.some((id) => id === value);
}
