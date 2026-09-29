import type { Rect } from "./types";

/** Divisor turning a percentage into a fraction. */
const PERCENT = 100;

export const GAP_UNITS = ["points", "window", "screen"] as const;

/** What a gap value is measured against. */
export type GapUnit = (typeof GAP_UNITS)[number];

export function isGapUnit(value: unknown): value is GapUnit {
  return GAP_UNITS.some((unit) => unit === value);
}

/**
 * Space between windows and around the edge of the area.
 *
 * For `points` the value is a distance in points. For `window` and `screen` it is a percentage, taken per axis: of the window's own width or height, or of the area's width or height. A negative value makes neighbouring windows overlap.
 */
export interface Gap {
  value: number;
  unit: GapUnit;
  /** Whether the gap applies along the area's boundary. */
  edge: boolean;
  /** Whether the gap applies between neighbouring windows. */
  between: boolean;
}

function gapAlong(
  gap: Readonly<Gap>,
  axis: "x" | "y",
  rect: Readonly<Rect>,
  area: Readonly<Rect>,
): number {
  if (gap.unit === "points") return gap.value;
  const reference = gap.unit === "window" ? rect : area;
  const length = axis === "x" ? reference.width : reference.height;

  return (gap.value / PERCENT) * length;
}

/**
 * Shrinks `rect`, one of the rectangles a layout produced for `area`, to leave the gap.
 *
 * A side shared with a neighbour is inset by half the gap, so two neighbours end up a full gap apart (or overlapping by its size when negative); it is left flush when `gap.between` is off. A side on the area's boundary is inset by the full gap, but never outwards: a negative gap does not push windows past the edge; it is left flush when `gap.edge` is off.
 */
export function applyGap(
  rect: Readonly<Rect>,
  area: Readonly<Rect>,
  gap: Readonly<Gap>,
): Rect {
  const horizontal = gapAlong(gap, "x", rect, area);
  const vertical = gapAlong(gap, "y", rect, area);
  const inset = (full: number, onBoundary: boolean) => {
    if (onBoundary) return gap.edge ? Math.max(0, full) : 0;

    return gap.between ? full / 2 : 0;
  };
  const left = inset(horizontal, rect.x === area.x);
  const right = inset(horizontal, rect.x + rect.width === area.x + area.width);
  const top = inset(vertical, rect.y === area.y);
  const bottom = inset(vertical, rect.y + rect.height === area.y + area.height);

  return {
    x: rect.x + left,
    y: rect.y + top,
    width: rect.width - left - right,
    height: rect.height - top - bottom,
  };
}
