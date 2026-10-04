import { describe, expect, it } from "vitest";
import { windowSetChanged } from "./window-set";

describe("windowSetChanged", () => {
  it("is a change when no window IDs were stored", () => {
    expect(windowSetChanged(undefined, ["a"])).toBe(true);
    expect(windowSetChanged(undefined, [])).toBe(true);
  });

  it("is no change for the same windows in any order", () => {
    expect(windowSetChanged(["a", "b"], ["b", "a"])).toBe(false);
    expect(windowSetChanged([], [])).toBe(false);
  });

  it("is a change when a window appears", () => {
    expect(windowSetChanged(["a"], ["a", "b"])).toBe(true);
  });

  it("is a change when a window goes", () => {
    expect(windowSetChanged(["a", "b"], ["a"])).toBe(true);
  });

  it("is a change when one window is replaced by another", () => {
    expect(windowSetChanged(["a", "b"], ["a", "c"])).toBe(true);
  });
});
