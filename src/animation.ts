import type { Rect } from "./layouts";

/** Starts fast and settles gently, so a window lands softly on its target. */
export function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

/** Fraction of the animation elapsed, from 0 to 1. A zero duration is complete immediately. */
export function progressAt(elapsedMs: number, durationMs: number): number {
  if (durationMs === 0) return 1;
  return Math.min(1, Math.max(0, elapsedMs / durationMs));
}

/** The rectangle `progress` of the way from `from` to `to`, rounded to whole points; exactly `to` at progress 1. */
export function interpolateRect(from: Rect, to: Rect, progress: number): Rect {
  const lerp = (start: number, end: number) =>
    Math.round(start + (end - start) * progress);
  return {
    x: lerp(from.x, to.x),
    y: lerp(from.y, to.y),
    width: lerp(from.width, to.width),
    height: lerp(from.height, to.height),
  };
}

/** One subject travelling from one rectangle to another. */
export type Move<T> = { subject: T; from: Rect; to: Rect };

/**
 * Moves every subject from its `from` to its `to` rectangle over `durationMs`, calling `apply` for all live subjects each frame.
 *
 * Frames are paced by the wall clock rather than a fixed count, so slow `apply` calls drop frames instead of stretching the animation. The last frame is always the exact target. A subject whose `apply` rejects is dropped from later frames and its error recorded; the others carry on. Returns the errors by subject.
 */
export async function animateMoves<T>(
  moves: readonly Move<T>[],
  apply: (subject: T, rect: Rect) => Promise<void>,
  durationMs: number,
  now: () => number = Date.now,
): Promise<Map<T, unknown>> {
  const failures = new Map<T, unknown>();
  const start = now();
  let finished = false;
  while (!finished) {
    const progress = progressAt(now() - start, durationMs);
    finished = progress === 1;
    const eased = easeOutCubic(progress);
    await Promise.all(
      moves
        .filter((move) => !failures.has(move.subject))
        .map(async (move) => {
          try {
            await apply(
              move.subject,
              interpolateRect(move.from, move.to, eased),
            );
          } catch (error) {
            failures.set(move.subject, error);
          }
        }),
    );
  }
  return failures;
}
