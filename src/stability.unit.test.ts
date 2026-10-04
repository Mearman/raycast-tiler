import { describe, expect, it } from "vitest";
import type { Rect } from "./layouts/types";
import { orderBySlot, type OrderId } from "./ordering";
import { RECT_TOLERANCE_PT } from "./rects";
import { orderBySlotStably } from "./stability";

interface Item {
  name: string;
  bounds: Rect;
  active?: boolean;
}

/** Side length of every test window and slot, so the next column starts at this offset. */
const CELL = 100;
/** Vertical position of a floating window's row, clear of the settled row's height. */
const ROW_BELOW = 300;
/** Coordinates for stored slots far from every window, so nothing counts as settled. */
const FAR_AWAY = 10_000;
/** Windows in the stored arrangement of columns. */
const STORED = 3;
/** Windows in a layout grown past the stored one. */
const GROWN = 5;

function item(name: string, x: number, y: number, extra: Partial<Item> = {}) {
  return { name, bounds: { x, y, width: CELL, height: CELL }, ...extra };
}

const facts = {
  boundsOf: (window: Item) => window.bounds,
  isActive: (window: Item) => window.active === true,
  bundleIdOf: () => undefined,
};

/** `count` side-by-side slots, the layout a previous tiling of `count` windows left behind. */
const columns = (count: number): Rect[] =>
  Array.from({ length: count }, (_, index) => ({
    x: index * CELL,
    y: 0,
    width: CELL,
    height: CELL,
  }));

/** The four screen quadrants, a layout whose bottom row sits where no stored column did. */
const quadrants = (): Rect[] => [
  { x: 0, y: 0, width: CELL, height: CELL },
  { x: CELL, y: 0, width: CELL, height: CELL },
  { x: 0, y: CELL, width: CELL, height: CELL },
  { x: CELL, y: CELL, width: CELL, height: CELL },
];

function stable(options: {
  items: readonly Item[];
  slots: readonly Rect[];
  previousSlots: readonly Rect[] | undefined;
  order?: OrderId;
  fillOpenSpace?: boolean;
}): Item[] {
  return orderBySlotStably({
    fillOpenSpace: options.fillOpenSpace ?? true,
    items: options.items,
    slots: options.slots,
    previousSlots: options.previousSlots,
    facts,
    order: options.order ?? "reading",
    priority: [],
  });
}

function plainOrder(
  items: readonly Item[],
  slots: readonly Rect[],
  order: OrderId = "reading",
): Item[] {
  return orderBySlot({
    order,
    items,
    slots,
    facts,
    priority: [],
    previousSlots: undefined,
  });
}

const names = (items: readonly Item[]) => items.map((window) => window.name);

/** Three windows on the stored three columns and one floating below them. */
const grown = () => ({
  items: [
    item("a", 0, 0),
    item("b", CELL, 0),
    item("c", CELL * 2, 0),
    item("f", 0, ROW_BELOW),
  ],
  previous: columns(STORED),
});

describe("orderBySlotStably", () => {
  it("keeps the settled windows nearest and fills the open slot, where the window order alone would differ", () => {
    const { items, previous } = grown();
    // "c" would take the bottom-left quadrant in reading order; keeping "a" and "b" nearest leaves it open for "f" and pushes "c" to the bottom-right.
    expect(
      names(stable({ items, slots: quadrants(), previousSlots: previous })),
    ).toEqual(["a", "b", "f", "c"]);
    expect(names(plainOrder(items, quadrants()))).toEqual(["a", "b", "c", "f"]);
  });

  it("uses the window order alone when the flag is off", () => {
    const { items, previous } = grown();
    expect(
      names(
        stable({
          items,
          slots: quadrants(),
          previousSlots: previous,
          fillOpenSpace: false,
        }),
      ),
    ).toEqual(names(plainOrder(items, quadrants())));
  });

  it("uses the window order alone when no slots were stored", () => {
    const { items } = grown();
    expect(
      names(stable({ items, slots: quadrants(), previousSlots: undefined })),
    ).toEqual(names(plainOrder(items, quadrants())));
  });

  it("uses the window order alone when no window sits on a stored slot", () => {
    const { items } = grown();
    const farAway: Rect[] = [
      { x: FAR_AWAY, y: FAR_AWAY, width: CELL, height: CELL },
    ];
    expect(
      names(stable({ items, slots: quadrants(), previousSlots: farAway })),
    ).toEqual(names(plainOrder(items, quadrants())));
  });

  it("uses the window order alone when exactly half the windows are settled", () => {
    const items = [
      item("a", 0, 0),
      item("b", CELL * 2, 0),
      item("late", 0, ROW_BELOW),
      item("later", CELL, ROW_BELOW),
    ];
    expect(
      names(
        stable({ items, slots: quadrants(), previousSlots: columns(STORED) }),
      ),
    ).toEqual(names(plainOrder(items, quadrants())));
  });

  it("uses the window order alone when every window is settled", () => {
    const items = [item("a", 0, 0), item("b", CELL, 0), item("c", CELL * 2, 0)];
    expect(
      names(
        stable({
          items,
          slots: columns(STORED),
          previousSlots: columns(STORED),
        }),
      ),
    ).toEqual(names(plainOrder(items, columns(STORED))));
  });

  it("settles a window nudged within the rectangle tolerance", () => {
    const { items, previous } = grown();
    const nudged = [item("a", RECT_TOLERANCE_PT, 0), ...items.slice(1)];
    expect(
      names(
        stable({ items: nudged, slots: quadrants(), previousSlots: previous }),
      ),
    ).toEqual(["a", "b", "f", "c"]);
  });

  it("uses the window order alone for a window nudged past the tolerance", () => {
    const { items, previous } = grown();
    const nudged = [item("a", RECT_TOLERANCE_PT + 1, 0), ...items.slice(1)];
    expect(
      names(
        stable({ items: nudged, slots: quadrants(), previousSlots: previous }),
      ),
    ).toEqual(names(plainOrder(nudged, quadrants())));
  });

  it("puts the active floating window in the first open slot", () => {
    const items = [
      item("a", 0, 0),
      item("b", CELL, 0),
      item("c", CELL * 2, 0),
      item("late", 0, ROW_BELOW),
      item("focused", CELL * 2, ROW_BELOW, { active: true }),
    ];
    // Reading order alone would give "late" the first open slot, being left of "focused".
    expect(
      names(
        stable({
          items,
          slots: columns(GROWN),
          previousSlots: columns(STORED),
          order: "active-first",
        }),
      ),
    ).toEqual(["a", "b", "c", "focused", "late"]);
  });

  it("settles two windows sharing one stored slot into distinct slots", () => {
    const items = [
      item("first", 0, 0),
      item("second", 0, RECT_TOLERANCE_PT),
      item("f", CELL, ROW_BELOW),
    ];
    const result = stable({
      items,
      slots: columns(STORED),
      previousSlots: columns(1),
    });
    // Which of the two takes the first column is a tie; the floating window always ends in the last.
    expect(result.at(-1)?.name).toBe("f");
    expect([...names(result)].sort()).toEqual(["f", "first", "second"]);
  });

  it("passes the stored slots on to the previous window order", () => {
    // "low" is nearest the first stored column, so Previous Order puts it first although reading order puts it last.
    const items = [item("mid", CELL, 0), item("low", 0, ROW_BELOW)];
    const previous = columns(STORED);
    expect(
      names(
        stable({
          items,
          slots: columns(2),
          previousSlots: previous,
          order: "previous",
          fillOpenSpace: false,
        }),
      ),
    ).toEqual(["low", "mid"]);
  });
});
