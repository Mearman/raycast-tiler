import { describe, expect, it } from "vitest";
import type { Rect } from "./layouts";
import { isOrderId, ORDER_IDS, orderBySlot, readingOrder } from "./ordering";

type Item = {
  name: string;
  bounds: Rect;
  active?: boolean;
  bundleId?: string;
};

function item(name: string, x: number, y: number, extra: Partial<Item> = {}) {
  return { name, bounds: { x, y, width: 100, height: 100 }, ...extra };
}

const facts = {
  boundsOf: (window: Item) => window.bounds,
  isActive: (window: Item) => window.active === true,
  bundleIdOf: (window: Item) => window.bundleId,
};

const SLOTS: Rect[] = [
  { x: 0, y: 0, width: 100, height: 100 },
  { x: 100, y: 0, width: 100, height: 100 },
  { x: 0, y: 100, width: 100, height: 100 },
  { x: 100, y: 100, width: 100, height: 100 },
];

const names = (items: Item[]) => items.map((window) => window.name);

describe("isOrderId", () => {
  it("accepts every order and nothing else", () => {
    for (const id of ORDER_IDS) expect(isOrderId(id)).toBe(true);
    expect(isOrderId("random")).toBe(false);
  });
});

describe("readingOrder", () => {
  it("sorts rows top to bottom and each row left to right", () => {
    const windows = [
      item("d", 300, 300),
      item("b", 300, 0),
      item("c", 0, 300),
      item("a", 0, 0),
    ];
    expect(names(readingOrder(windows, facts.boundsOf))).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("treats windows whose heights overlap substantially as one row", () => {
    const windows = [item("right", 300, 20), item("left", 0, 0)];
    expect(names(readingOrder(windows, facts.boundsOf))).toEqual([
      "left",
      "right",
    ]);
  });

  it("starts a new row when the windows barely overlap vertically", () => {
    const windows = [item("lower-left", 0, 90), item("upper-right", 300, 0)];
    expect(names(readingOrder(windows, facts.boundsOf))).toEqual([
      "upper-right",
      "lower-left",
    ]);
  });
});

describe("orderBySlot", () => {
  const windows = [
    item("bottom-right", 100, 100, { bundleId: "c" }),
    item("top-left", 0, 0, { bundleId: "b", active: true }),
    item("bottom-left", 0, 100, { bundleId: "a" }),
    item("top-right", 100, 0, { bundleId: "b" }),
  ];

  it("nearest keeps windows in the slots they already occupy", () => {
    expect(names(orderBySlot("nearest", windows, SLOTS, facts, []))).toEqual([
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ]);
  });

  it("reading follows position order even when slots are elsewhere", () => {
    const shifted = SLOTS.map((slot) => ({ ...slot, x: slot.x + 1000 }));
    expect(names(orderBySlot("reading", windows, shifted, facts, []))).toEqual([
      "top-left",
      "top-right",
      "bottom-left",
      "bottom-right",
    ]);
  });

  it("active-first puts the active window in slot 0 and the rest nearest", () => {
    const moved = [
      item("a", 90, 90),
      item("b", 100, 0),
      item("c", 0, 100),
      item("focused", 100, 100, { active: true }),
    ];
    // The rest take slots 1 to 3: "b" and "c" are already on theirs and "a" is beside the remaining one.
    expect(names(orderBySlot("active-first", moved, SLOTS, facts, []))).toEqual(
      ["focused", "b", "c", "a"],
    );
  });

  it("active-first falls back to nearest when no window is active", () => {
    const inactive = windows.map((window) => ({ ...window, active: false }));
    expect(
      names(orderBySlot("active-first", inactive, SLOTS, facts, [])),
    ).toEqual(names(orderBySlot("nearest", inactive, SLOTS, facts, [])));
  });

  it("app-priority ranks by list position, unlisted last, ties in reading order", () => {
    expect(
      names(orderBySlot("app-priority", windows, SLOTS, facts, ["a", "b"])),
    ).toEqual(["bottom-left", "top-left", "top-right", "bottom-right"]);
  });

  it("app-priority is reading order when the priority list is empty", () => {
    expect(
      names(orderBySlot("app-priority", windows, SLOTS, facts, [])),
    ).toEqual(names(readingOrder(windows, facts.boundsOf)));
  });
});
