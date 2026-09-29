import { describe, expect, it } from "vitest";
import {
  animateMoves,
  easeOutCubic,
  interpolateRect,
  progressAt,
  type Move,
} from "./animation";
import type { Rect } from "./layouts";

const FROM: Rect = { x: 0, y: 0, width: 100, height: 100 };
const TO: Rect = { x: 200, y: 100, width: 300, height: 50 };

describe("easeOutCubic", () => {
  it("runs from 0 to 1 and never decreases", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    const samples = Array.from({ length: 21 }, (_, index) =>
      easeOutCubic(index / 20),
    );
    samples.slice(1).forEach((value, index) => {
      expect(value).toBeGreaterThanOrEqual(samples[index] ?? Infinity);
    });
  });
});

describe("progressAt", () => {
  it("clamps to the range 0 to 1", () => {
    expect(progressAt(-50, 200)).toBe(0);
    expect(progressAt(100, 200)).toBe(0.5);
    expect(progressAt(900, 200)).toBe(1);
  });

  it("treats a zero duration as complete", () => {
    expect(progressAt(0, 0)).toBe(1);
  });
});

describe("interpolateRect", () => {
  it("returns the endpoints exactly", () => {
    expect(interpolateRect(FROM, TO, { position: 0, size: 0 })).toEqual(FROM);
    expect(interpolateRect(FROM, TO, { position: 1, size: 1 })).toEqual(TO);
  });

  it("advances position and size independently", () => {
    expect(interpolateRect(FROM, TO, { position: 0.5, size: 0.5 })).toEqual({
      x: 100,
      y: 50,
      width: 200,
      height: 75,
    });
    expect(interpolateRect(FROM, TO, { position: 1, size: 0 })).toEqual({
      x: 200,
      y: 100,
      width: 100,
      height: 100,
    });
  });
});

describe("animateMoves", () => {
  function steppingClock(step: number): () => number {
    let time = 0;
    return () => {
      const current = time;
      time += step;
      return current;
    };
  }

  it("ends every subject on its exact target, having passed through intermediate frames", async () => {
    const frames: Rect[] = [];
    const moves: Move<string>[] = [{ subject: "a", from: FROM, to: TO }];
    const failures = await animateMoves(
      moves,
      async (_, rect) => {
        frames.push(rect);
      },
      { moveMs: 200, resizeMs: 200 },
      steppingClock(50),
    );
    expect(failures.size).toBe(0);
    expect(frames.length).toBeGreaterThan(2);
    expect(frames.at(-1)).toEqual(TO);
    const middle = frames.slice(0, -1);
    expect(middle.every((frame) => frame.x < TO.x)).toBe(true);
  });

  it("applies the target once when the duration is zero", async () => {
    const frames: Rect[] = [];
    await animateMoves(
      [{ subject: "a", from: FROM, to: TO }],
      async (_, rect) => {
        frames.push(rect);
      },
      { moveMs: 0, resizeMs: 0 },
      steppingClock(50),
    );
    expect(frames).toEqual([TO]);
  });

  it("applies a zero-duration resize on the first frame while the move still animates", async () => {
    const frames: Rect[] = [];
    await animateMoves(
      [{ subject: "a", from: FROM, to: TO }],
      async (_, rect) => {
        frames.push(rect);
      },
      { moveMs: 200, resizeMs: 0 },
      steppingClock(50),
    );
    expect(frames.length).toBeGreaterThan(2);
    for (const frame of frames) {
      expect(frame.width).toBe(TO.width);
      expect(frame.height).toBe(TO.height);
    }
    const first = frames[0];
    expect(first?.x).toBeGreaterThan(FROM.x);
    expect(first?.x).toBeLessThan(TO.x);
    expect(frames.at(-1)).toEqual(TO);
  });

  it("applies a zero-duration move on the first frame while the resize still animates", async () => {
    const frames: Rect[] = [];
    await animateMoves(
      [{ subject: "a", from: FROM, to: TO }],
      async (_, rect) => {
        frames.push(rect);
      },
      { moveMs: 0, resizeMs: 200 },
      steppingClock(50),
    );
    expect(frames.length).toBeGreaterThan(2);
    for (const frame of frames) {
      expect(frame.x).toBe(TO.x);
      expect(frame.y).toBe(TO.y);
    }
    const first = frames[0];
    expect(first?.width).toBeGreaterThan(FROM.width);
    expect(first?.width).toBeLessThan(TO.width);
    expect(frames.at(-1)).toEqual(TO);
  });

  it("lasts as long as the longer of the two durations", async () => {
    const frames: Rect[] = [];
    const stepMs = 50;
    const resizeMs = 400;
    await animateMoves(
      [{ subject: "a", from: FROM, to: TO }],
      async (_, rect) => {
        frames.push(rect);
      },
      { moveMs: stepMs, resizeMs },
      steppingClock(stepMs),
    );
    expect(frames).toHaveLength(resizeMs / stepMs);
    expect(frames.at(-1)).toEqual(TO);
  });

  it("drops a failing subject from later frames and keeps animating the rest", async () => {
    const calls: string[] = [];
    const failures = await animateMoves(
      [
        { subject: "bad", from: FROM, to: TO },
        { subject: "good", from: FROM, to: TO },
      ],
      async (subject) => {
        calls.push(subject);
        if (subject === "bad") throw new Error("cannot move");
      },
      { moveMs: 200, resizeMs: 200 },
      steppingClock(50),
    );
    expect([...failures.keys()]).toEqual(["bad"]);
    expect(calls.filter((call) => call === "bad")).toHaveLength(1);
    expect(calls.filter((call) => call === "good").length).toBeGreaterThan(1);
  });
});
