import { describe, expect, it } from "vitest";
import type { Rect } from "./layouts/types";
import { isOrderId, ORDER_IDS, orderBySlot, readingOrder } from "./ordering";

interface Item {
  name: string;
  bounds: Rect;
  active?: boolean;
  bundleId?: string;
}

/** Side length of every test window and slot, so the second column or row starts at this offset. */
const CELL = 100;
/** A coordinate well clear of one window's width and height, so windows there share no row or column. */
const FAR = 300;
/** A vertical offset small enough that a window still overlaps most of a same-sized neighbour's height. */
const SLIGHT_OFFSET = 20;
/** A vertical offset that leaves only a sliver of overlap with a same-sized neighbour's height. */
const BARELY_OVERLAPPING_OFFSET = 90;
/** A horizontal shift that moves every slot clear of the windows' own positions. */
const SLOT_SHIFT = 1000;

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

const names = (items: readonly Item[]) => items.map((window) => window.name);

describe("isOrderId", () => {
  it("accepts every order and nothing else", () => {
    for (const id of ORDER_IDS) expect(isOrderId(id)).toBe(true);
    expect(isOrderId("random")).toBe(false);
  });
});

describe("readingOrder", () => {
  it("sorts rows top to bottom and each row left to right", () => {
    const windows = [
      item("d", FAR, FAR),
      item("b", FAR, 0),
      item("c", 0, FAR),
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
    const windows = [item("right", FAR, SLIGHT_OFFSET), item("left", 0, 0)];
    expect(names(readingOrder(windows, facts.boundsOf))).toEqual([
      "left",
      "right",
    ]);
  });

  it("starts a new row when the windows barely overlap vertically", () => {
    const windows = [
      item("lower-left", 0, BARELY_OVERLAPPING_OFFSET),
      item("upper-right", FAR, 0),
    ];
    expect(names(readingOrder(windows, facts.boundsOf))).toEqual([
      "upper-right",
      "lower-left",
    ]);
  });
});

describe("orderBySlot", () => {
  const windows = [
    item("bottom-right", CELL, CELL, { bundleId: "c" }),
    item("top-left", 0, 0, { bundleId: "b", active: true }),
    item("bottom-left", 0, CELL, { bundleId: "a" }),
    item("top-right", CELL, 0, { bundleId: "b" }),
  ];

  it("nearest keeps windows in the slots they already occupy", () => {
    expect(
      names(
        orderBySlot({
          order: "nearest",
          items: windows,
          slots: SLOTS,
          facts,
          priority: [],
          previousSlots: undefined,
        }),
      ),
    ).toEqual(["top-left", "top-right", "bottom-left", "bottom-right"]);
  });

  it("reading follows position order even when slots are elsewhere", () => {
    const shifted = SLOTS.map((slot) => ({ ...slot, x: slot.x + SLOT_SHIFT }));
    expect(
      names(
        orderBySlot({
          order: "reading",
          items: windows,
          slots: shifted,
          facts,
          priority: [],
          previousSlots: undefined,
        }),
      ),
    ).toEqual(["top-left", "top-right", "bottom-left", "bottom-right"]);
  });

  it("active-first puts the active window in slot 0 and the rest nearest", () => {
    const moved = [
      item("a", BARELY_OVERLAPPING_OFFSET, BARELY_OVERLAPPING_OFFSET),
      item("b", CELL, 0),
      item("c", 0, CELL),
      item("focused", CELL, CELL, { active: true }),
    ];
    // The rest take slots 1 to 3: "b" and "c" are already on theirs and "a" is beside the remaining one.
    expect(
      names(
        orderBySlot({
          order: "active-first",
          items: moved,
          slots: SLOTS,
          facts,
          priority: [],
          previousSlots: undefined,
        }),
      ),
    ).toEqual(["focused", "b", "c", "a"]);
  });

  it("active-first falls back to nearest when no window is active", () => {
    const inactive = windows.map((window) => ({ ...window, active: false }));
    expect(
      names(
        orderBySlot({
          order: "active-first",
          items: inactive,
          slots: SLOTS,
          facts,
          priority: [],
          previousSlots: undefined,
        }),
      ),
    ).toEqual(
      names(
        orderBySlot({
          order: "nearest",
          items: inactive,
          slots: SLOTS,
          facts,
          priority: [],
          previousSlots: undefined,
        }),
      ),
    );
  });

  it("app-priority ranks by list position, unlisted last, ties in reading order", () => {
    expect(
      names(
        orderBySlot({
          order: "app-priority",
          items: windows,
          slots: SLOTS,
          facts,
          priority: ["a", "b"],
          previousSlots: undefined,
        }),
      ),
    ).toEqual(["bottom-left", "top-left", "top-right", "bottom-right"]);
  });

  it("app-priority is reading order when the priority list is empty", () => {
    expect(
      names(
        orderBySlot({
          order: "app-priority",
          items: windows,
          slots: SLOTS,
          facts,
          priority: [],
          previousSlots: undefined,
        }),
      ),
    ).toEqual(names(readingOrder(windows, facts.boundsOf)));
  });

  describe("previous", () => {
    const COLUMNS: Rect[] = [0, 1, 2].map((index) => ({
      x: index * CELL,
      y: 0,
      width: CELL,
      height: CELL,
    }));
    const previous = (items: readonly Item[], slots: readonly Rect[]) =>
      names(
        orderBySlot({
          order: "previous",
          items,
          slots,
          facts,
          priority: [],
          previousSlots: COLUMNS,
        }),
      );

    it("ranks windows by the nearest previous slot, not by their current row", () => {
      // "low" sits below the row but is closest to the first stored column, so it stays ahead of "mid".
      const items = [
        item("mid", CELL, 0),
        item("low", 0, FAR),
        item("end", CELL * 2, 0),
      ];
      expect(previous(items, SLOTS)).toEqual(["low", "mid", "end"]);
      expect(names(readingOrder(items, facts.boundsOf))).toEqual([
        "mid",
        "end",
        "low",
      ]);
    });

    it("breaks ties between windows nearest the same slot in reading order", () => {
      const items = [item("right", SLIGHT_OFFSET, 0), item("left", 0, 0)];
      expect(previous(items, SLOTS)).toEqual(["left", "right"]);
    });

    it("is reading order without stored slots", () => {
      const items = [item("b", CELL, 0), item("a", 0, 0)];
      expect(
        names(
          orderBySlot({
            order: "previous",
            items,
            slots: SLOTS,
            facts,
            priority: [],
            previousSlots: undefined,
          }),
        ),
      ).toEqual(names(readingOrder(items, facts.boundsOf)));
    });
  });
});
