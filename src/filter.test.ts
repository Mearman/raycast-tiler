import { describe, expect, it } from "vitest";
import { isAllowed, isAppLists, toggle } from "./filter";

describe("isAllowed", () => {
  it("allows everything when both lists are empty", () => {
    expect(isAllowed("com.example.a", { include: [], exclude: [] })).toBe(true);
    expect(isAllowed(undefined, { include: [], exclude: [] })).toBe(true);
  });

  it("rejects excluded applications", () => {
    expect(
      isAllowed("com.example.a", { include: [], exclude: ["com.example.a"] }),
    ).toBe(false);
    expect(
      isAllowed("com.example.b", { include: [], exclude: ["com.example.a"] }),
    ).toBe(true);
  });

  it("restricts to the include list when it is non-empty", () => {
    const lists = { include: ["com.example.a"], exclude: [] };
    expect(isAllowed("com.example.a", lists)).toBe(true);
    expect(isAllowed("com.example.b", lists)).toBe(false);
    expect(isAllowed(undefined, lists)).toBe(false);
  });

  it("lets exclude win over include", () => {
    expect(
      isAllowed("com.example.a", {
        include: ["com.example.a"],
        exclude: ["com.example.a"],
      }),
    ).toBe(false);
  });
});

describe("toggle", () => {
  it("adds a missing id and removes a present one", () => {
    expect(toggle(["a"], "b")).toEqual(["a", "b"]);
    expect(toggle(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("isAppLists", () => {
  it("accepts well-formed lists and rejects everything else", () => {
    expect(isAppLists({ include: [], exclude: ["a"] })).toBe(true);
    expect(isAppLists({ include: [1], exclude: [] })).toBe(false);
    expect(isAppLists({ include: [] })).toBe(false);
    expect(isAppLists(null)).toBe(false);
    expect(isAppLists("x")).toBe(false);
  });
});
