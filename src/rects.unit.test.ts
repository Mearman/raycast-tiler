import { describe, expect, it } from "vitest";
import type { Rect } from "./layouts/types";
import { RECT_TOLERANCE_PT, rectsMatch } from "./rects";

/** Origin and size of the reference rectangle every case shifts one field of. */
const BASE: Readonly<Rect> = { x: 100, y: 200, width: 300, height: 400 };

/** Shift one field of the base rectangle, leaving the other three alone. */
function shifted(field: keyof Rect, by: number): Rect {
  return { ...BASE, [field]: BASE[field] + by };
}

describe("rectsMatch", () => {
  it("matches a rectangle against itself", () => {
    expect(rectsMatch(BASE, BASE)).toBe(true);
  });

  it.each([...(["x", "y", "width", "height"] as const)])(
    "matches when only %s differs by the tolerance",
    (field) => {
      expect(rectsMatch(shifted(field, RECT_TOLERANCE_PT), BASE)).toBe(true);
      expect(rectsMatch(shifted(field, -RECT_TOLERANCE_PT), BASE)).toBe(true);
    },
  );

  it.each([...(["x", "y", "width", "height"] as const)])(
    "does not match when only %s differs by more than the tolerance",
    (field) => {
      expect(rectsMatch(shifted(field, RECT_TOLERANCE_PT + 1), BASE)).toBe(
        false,
      );
      expect(rectsMatch(shifted(field, -RECT_TOLERANCE_PT - 1), BASE)).toBe(
        false,
      );
    },
  );

  it("matches several fields differing while each stays within the tolerance", () => {
    const near: Rect = {
      x: BASE.x + RECT_TOLERANCE_PT,
      y: BASE.y - RECT_TOLERANCE_PT,
      width: BASE.width + RECT_TOLERANCE_PT,
      height: BASE.height,
    };
    expect(rectsMatch(near, BASE)).toBe(true);
  });

  it("does not match when one of several shifted fields exceeds the tolerance", () => {
    const nearExceptWidth: Rect = {
      ...shifted("width", RECT_TOLERANCE_PT + 1),
      y: BASE.y - RECT_TOLERANCE_PT,
    };
    expect(rectsMatch(nearExceptWidth, BASE)).toBe(false);
  });
});
