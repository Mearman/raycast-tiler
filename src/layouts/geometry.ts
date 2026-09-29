/**
 * Splits the span [start, start + length) into `parts` contiguous integer spans that sum exactly to `length`.
 *
 * Boundaries are rounded from the exact fractions, so span sizes differ by at most one and no point is lost or duplicated.
 */
export function splitSpan(
  start: number,
  length: number,
  parts: number,
): { start: number; size: number }[] {
  return Array.from({ length: parts }, (_, index) => {
    const from = Math.round((length * index) / parts);
    const to = Math.round((length * (index + 1)) / parts);

    return { start: start + from, size: to - from };
  });
}
