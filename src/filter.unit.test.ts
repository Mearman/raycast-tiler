import { describe, expect, it } from "vitest";
import { isAllowed, isAppLists, move, toggle } from "./filter";

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

describe("move", () => {
  // Offset that pulls the last of three entries to the start.
  const TO_START = -2;
  // Offset that overshoots the end of a three-entry list.
  const PAST_END = 5;

  it("moves an entry by the offset", () => {
    expect(move(["a", "b", "c"], "a", 1)).toEqual(["b", "a", "c"]);
    expect(move(["a", "b", "c"], "c", TO_START)).toEqual(["c", "a", "b"]);
  });

  it("stops at either end", () => {
    expect(move(["a", "b", "c"], "a", -1)).toEqual(["a", "b", "c"]);
    expect(move(["a", "b", "c"], "c", PAST_END)).toEqual(["a", "b", "c"]);
  });

  it("leaves the list unchanged when the entry is absent", () => {
    const list = ["a", "b"];
    expect(move(list, "z", 1)).toEqual(list);
  });
});
