import type { Rect } from "./layouts/types";

export interface Point {
  x: number;
  y: number;
}

function at<T>(items: readonly T[], index: number): T {
  const item = items[index];
  if (item === undefined)
    throw new Error(`Index ${String(index)} is outside the matrix`);

  return item;
}

/**
 * Solves the assignment problem with the Hungarian algorithm (Kuhn-Munkres, potentials formulation, O(n^3)).
 *
 * `cost` must be a square matrix; the result maps each row to the column assigned to it, with every column used exactly once and the total cost minimal.
 */
export function minimumCostAssignment(cost: readonly number[][]): number[] {
  const size = cost.length;
  // Row and column potentials and matching are 1-indexed; index 0 is a sentinel column.
  const rowPotential = new Array<number>(size + 1).fill(0);
  const columnPotential = new Array<number>(size + 1).fill(0);
  const rowOfColumn = new Array<number>(size + 1).fill(0);
  const previousColumn = new Array<number>(size + 1).fill(0);

  for (let row = 1; row <= size; row++) {
    rowOfColumn[0] = row;
    let column = 0;
    const slack = new Array<number>(size + 1).fill(Infinity);
    const visited = new Array<boolean>(size + 1).fill(false);
    do {
      visited[column] = true;
      const currentRow = at(rowOfColumn, column);
      let delta = Infinity;
      let nextColumn = 0;
      for (let candidate = 1; candidate <= size; candidate++) {
        if (visited[candidate] === true) continue;
        const reduced =
          at(at(cost, currentRow - 1), candidate - 1) -
          at(rowPotential, currentRow) -
          at(columnPotential, candidate);
        if (reduced < at(slack, candidate)) {
          slack[candidate] = reduced;
          previousColumn[candidate] = column;
        }
        if (at(slack, candidate) < delta) {
          delta = at(slack, candidate);
          nextColumn = candidate;
        }
      }
      for (let index = 0; index <= size; index++) {
        if (visited[index] === true) {
          const matchedRow = at(rowOfColumn, index);
          rowPotential[matchedRow] = at(rowPotential, matchedRow) + delta;
          columnPotential[index] = at(columnPotential, index) - delta;
        } else {
          slack[index] = at(slack, index) - delta;
        }
      }
      column = nextColumn;
    } while (at(rowOfColumn, column) !== 0);
    do {
      const previous = at(previousColumn, column);
      rowOfColumn[column] = at(rowOfColumn, previous);
      column = previous;
    } while (column !== 0);
  }

  const columnOfRow = new Array<number>(size).fill(0);
  for (let column = 1; column <= size; column++) {
    columnOfRow[at(rowOfColumn, column) - 1] = column - 1;
  }

  return columnOfRow;
}

/** One row per item, one column per slot: the squared distance between each item's centre and each slot's centre. */
function centreDistanceRows<T>(
  items: readonly T[],
  centreOf: (item: T) => Point,
  slots: readonly Rect[],
): number[][] {
  const slotCentres = slots.map((slot) => ({
    x: slot.x + slot.width / 2,
    y: slot.y + slot.height / 2,
  }));

  return items.map((item) => {
    const centre = centreOf(item);

    return slotCentres.map(
      (slotCentre) =>
        (centre.x - slotCentre.x) ** 2 + (centre.y - slotCentre.y) ** 2,
    );
  });
}

/**
 * Orders `items` by slot: element `k` of the result is the item assigned to `slots[k]`.
 *
 * Items are assigned so the total squared distance between each item's centre and its slot's centre is minimal, so windows end up in the slot nearest where they already are. Requires as many slots as items.
 */
export function assignToNearestSlots<T>(
  items: readonly T[],
  centreOf: (item: T) => Point,
  slots: readonly Rect[],
): T[] {
  if (items.length !== slots.length)
    throw new Error("Each item needs exactly one slot");
  const cost = centreDistanceRows(items, centreOf, slots);
  const ordered = new Array<T>(items.length);
  minimumCostAssignment(cost).forEach((slotIndex, itemIndex) => {
    ordered[slotIndex] = at(items, itemIndex);
  });

  return ordered;
}

/**
 * Orders `items` by slot: element `k` of the result is the item assigned to `slots[k]`, or `undefined` when no item takes that slot.
 *
 * There may be fewer items than slots. Items are assigned so that the total squared distance between each item's centre and its slot's centre is minimal, so items end up in the slots nearest where they already are while some slots stay open. Requires at most as many items as slots.
 */
export function occupyNearestSlots<T>(
  items: readonly T[],
  centreOf: (item: T) => Point,
  slots: readonly Rect[],
): (T | undefined)[] {
  if (items.length > slots.length)
    throw new Error("Each item needs its own slot");
  const cost = centreDistanceRows(items, centreOf, slots);
  // Phantom rows at zero cost square the matrix; they add a constant zero to every total, so the real rows keep the optimal columns among themselves.
  while (cost.length < slots.length)
    cost.push(new Array<number>(slots.length).fill(0));
  const occupied = new Array<T | undefined>(slots.length).fill(undefined);
  minimumCostAssignment(cost).forEach((slotIndex, itemIndex) => {
    if (itemIndex < items.length) occupied[slotIndex] = at(items, itemIndex);
  });

  return occupied;
}
