import type { Rect } from "./layouts/types";

/** Exponent of the cubic ease-out curve. */
const CUBIC_EXPONENT = 3;

/** Starts fast and settles gently, so a window lands softly on its target. */
export function easeOutCubic(progress: number): number {
  return 1 - (1 - progress) ** CUBIC_EXPONENT;
}

/** Fraction of the animation elapsed, from 0 to 1. A zero duration is complete immediately. */
export function progressAt(elapsedMs: number, durationMs: number): number {
  if (durationMs === 0) return 1;

  return Math.min(1, Math.max(0, elapsedMs / durationMs));
}

/** How far position and size have each travelled towards the target, from 0 to 1. */
export interface Progress {
  position: number;
  size: number;
}

/** How long each part of a move takes and whether subjects move one after another. */
export interface Timing {
  /** Milliseconds a subject takes to reach its position. Zero applies it on the first frame. */
  moveMs: number;
  /** Milliseconds a subject takes to reach its size. Zero applies it on the first frame. */
  resizeMs: number;
  /** When true each subject finishes before the next starts, in the order given; otherwise all move together. */
  sequential: boolean;
}

/** The rectangle `progress` of the way from `from` to `to`, rounded to whole points; exactly `to` once both parts reach 1. */
export function interpolateRect(
  from: Readonly<Rect>,
  to: Readonly<Rect>,
  progress: Readonly<Progress>,
): Rect {
  const lerp = (start: number, end: number, fraction: number) =>
    Math.round(start + (end - start) * fraction);

  return {
    x: lerp(from.x, to.x, progress.position),
    y: lerp(from.y, to.y, progress.position),
    width: lerp(from.width, to.width, progress.size),
    height: lerp(from.height, to.height, progress.size),
  };
}

/** One subject travelling from one rectangle to another. */
export interface Move<T> {
  subject: T;
  from: Rect;
  to: Rect;
}

/**
 * Moves every subject from its `from` to its `to` rectangle, calling `apply` for all live subjects each frame.
 *
 * Position travels over `moveMs` and size over `resizeMs`, each eased independently, and a subject's animation lasts as long as the longer of the two. With `sequential` set, subjects animate one after another in the order given, each for that long; otherwise all animate together. Frames are paced by the wall clock rather than a fixed count, so slow `apply` calls drop frames instead of stretching the animation. The last frame is always the exact target. A subject whose `apply` rejects is dropped from later frames and its error recorded; the others carry on. Returns the errors by subject.
 */
export async function animateMoves<T>(
  moves: readonly Move<T>[],
  apply: (subject: T, rect: Readonly<Rect>) => Promise<void>,
  timing: Readonly<Timing>,
  now: () => number = Date.now,
): Promise<Map<T, unknown>> {
  const failures = new Map<T, unknown>();

  async function animateTogether(group: readonly Move<T>[]): Promise<void> {
    const start = now();
    let finished = false;
    while (!finished) {
      const elapsed = now() - start;
      const position = progressAt(elapsed, timing.moveMs);
      const size = progressAt(elapsed, timing.resizeMs);
      finished = position === 1 && size === 1;
      const eased = {
        position: easeOutCubic(position),
        size: easeOutCubic(size),
      };
      await Promise.all(
        group
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
  }

  if (timing.sequential) {
    for (const move of moves) await animateTogether([move]);
  } else {
    await animateTogether(moves);
  }

  return failures;
}
