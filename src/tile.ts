import {
  closeMainWindow,
  getPreferenceValues,
  showToast,
  Toast,
  WindowManagement,
} from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { animateMoves } from "./animation";
import { windowSetChanged } from "./window-set";
import { isAllowed } from "./filter";
import { emptyCellWeightFor, isGridBalance } from "./grid-balance";
import { isGapUnit } from "./layouts/gap";
import { isLayoutId, type LayoutId, type Rect } from "./layouts/types";
import { layoutWindows } from "./layouts/layout-windows";
import { isOrderId, orderBySlot, type OrderId } from "./ordering";
import {
  insertBeforeNumbered,
  moveActiveTo,
  parseWindowNumber,
  rotate,
  swapActive,
  swapInDirection,
  swapWithNumbered,
  type NumberedMove,
  type ReorderAction,
} from "./reorder";
import { rectsMatch } from "./rects";
import type { Scope } from "./scope";
import { orderBySlotStably } from "./stability";
import { loadLastTiling, loadLists, saveLastTiling } from "./storage";

type Window = WindowManagement.Window;

function parseNumber(name: string, raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return 0;
  const value = Number(raw);
  if (!Number.isFinite(value))
    throw new Error(`${name} must be a number, got "${raw}"`);

  return value;
}

function parseNonNegative(name: string, raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return 0;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0)
    throw new Error(`${name} must be a non-negative number, got "${raw}"`);

  return value;
}

type PlacedWindow = Window & {
  bounds: Exclude<Window["bounds"], "fullscreen">;
};

/** A fullscreen window has no position to tile from, and resizing it would take it out of fullscreen. */
function isPlaced(window: Window): window is PlacedWindow {
  return window.bounds !== "fullscreen";
}

function rectOf(window: PlacedWindow): Rect {
  const { position, size } = window.bounds;

  return {
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
  };
}

async function windowsInScope(scope: Scope): Promise<Window[]> {
  const windows = await WindowManagement.getWindowsOnActiveDesktop();
  if (scope === "desktop") return windows;
  const active = await WindowManagement.getActiveWindow();
  const bundleId = active.application?.bundleId;
  if (bundleId === undefined)
    throw new Error(
      "The active window does not belong to an identifiable application",
    );

  return windows.filter((window) => window.application?.bundleId === bundleId);
}

async function windowsOfApps(apps: readonly string[]): Promise<Window[]> {
  const windows = await WindowManagement.getWindowsOnActiveDesktop();

  return windows.filter((window) => {
    const bundleId = window.application?.bundleId;

    return bundleId !== undefined && apps.includes(bundleId);
  });
}

/** Rearranges windows already in slot order; `undefined` means this group has nothing to rearrange. */
type Rearrange = (
  ordered: readonly PlacedWindow[],
  slots: readonly Rect[],
  isFocused: (window: PlacedWindow) => boolean,
) => PlacedWindow[] | undefined;

interface TileRequest {
  scope: Scope;
  /** Overrides the layout preference. */
  layout: LayoutId | undefined;
  /** Overrides the window order preference. */
  order: OrderId | undefined;
  /** Applied to each desktop's windows after ordering, to reorder windows within the layout. */
  rearrange: Rearrange | undefined;
  /** Past-tense verb for the result toast. */
  verb: string;
  /**
   * Set for auto tiling, which tiles the applications of the last tiling on the active desktop. `quiet` is the background run: it tiles only when the set of their windows has changed since the last tiling, and skips closing Raycast and the success toast. `now` is a run the user asked for, which tiles whatever the set.
   */
  auto: "now" | "quiet" | undefined;
}

async function tileWindows(request: Readonly<TileRequest>): Promise<void> {
  // Raycast never dismisses its own window, so close it here: the desktop stays visible during the transition, and the previous application regains focus before the focused window is read.
  if (request.auto !== "quiet")
    await closeMainWindow({ clearRootSearch: true });
  const { scope, rearrange, verb, auto } = request;
  const {
    layout: preferredLayout,
    windowOrder,
    fillOpenSpace,
    gap: rawGap,
    gapUnit,
    gapAtEdge,
    gapBetween,
    gridBalance,
    sequentialTransitions,
    gridEmptyCellPenalty: rawCustomPenalty,
    moveDuration: rawMoveDuration,
    resizeDuration: rawResizeDuration,
  } = getPreferenceValues<Preferences>();
  const layout = request.layout ?? preferredLayout;
  if (!isLayoutId(layout))
    throw new Error(`Unknown layout "${String(layout)}"`);
  const order = request.order ?? windowOrder;
  if (!isOrderId(order))
    throw new Error(`Unknown window order "${String(order)}"`);
  if (!isGapUnit(gapUnit))
    throw new Error(`Unknown gap unit "${String(gapUnit)}"`);
  if (!isGridBalance(gridBalance))
    throw new Error(`Unknown grid balance "${String(gridBalance)}"`);
  const emptyCellWeight = emptyCellWeightFor(
    gridBalance,
    gridBalance === "custom"
      ? parseNonNegative("Grid empty cell penalty", rawCustomPenalty)
      : 0,
  );
  const gap = {
    value: parseNumber("Gap", rawGap),
    unit: gapUnit,
    edge: gapAtEdge,
    between: gapBetween,
  };
  const timing = {
    moveMs: parseNonNegative("Move duration", rawMoveDuration),
    sequential: sequentialTransitions,
    resizeMs: parseNonNegative("Resize duration", rawResizeDuration),
  };

  // `Window.active` is true for every window of the frontmost application, so the one focused window is found by id.
  const focusedId =
    rearrange !== undefined || order === "active-first"
      ? (await WindowManagement.getActiveWindow()).id
      : undefined;
  const isFocused = (window: PlacedWindow): boolean => window.id === focusedId;

  const lastTiling =
    rearrange === undefined ? await loadLastTiling() : undefined;
  const autoApps = auto === undefined ? undefined : lastTiling?.bundleIds;
  if (auto !== undefined && autoApps === undefined) {
    if (auto === "now")
      await showToast({
        style: Toast.Style.Failure,
        title: "Tile the windows once before using auto tiling",
      });

    return;
  }
  const [lists, desktops, scoped] = await Promise.all([
    loadLists(),
    WindowManagement.getDesktops(),
    autoApps === undefined ? windowsInScope(scope) : windowsOfApps(autoApps),
  ]);

  const allowed = scoped.filter((window) =>
    isAllowed(window.application?.bundleId, lists),
  );
  const tileable = allowed.filter(
    (window): window is PlacedWindow =>
      window.positionable && window.resizable && isPlaced(window),
  );
  const skipped = allowed.length - tileable.length;
  if (
    auto === "quiet" &&
    !windowSetChanged(
      lastTiling?.windowIds,
      tileable.map((window) => window.id),
    )
  )
    return;

  const facts = {
    boundsOf: rectOf,
    isActive: isFocused,
    bundleIdOf: (window: PlacedWindow) => window.application?.bundleId,
  };

  const byDesktop = Map.groupBy(tileable, (window) => window.desktopId);
  const moves = [...byDesktop].flatMap(([desktopId, windows]) => {
    const desktop = desktops.find((candidate) => candidate.id === desktopId);
    if (desktop === undefined)
      throw new Error(
        `Desktop ${desktopId} is not among the available desktops`,
      );
    const area = {
      x: 0,
      y: 0,
      width: desktop.size.width,
      height: desktop.size.height,
    };
    const rects = layoutWindows(layout, windows.length, area, {
      gap,
      options: { emptyCellWeight },
    });
    const ordered =
      rearrange === undefined
        ? orderBySlotStably({
            fillOpenSpace,
            items: windows,
            slots: rects,
            previousSlots: lastTiling?.slots,
            facts,
            order,
            priority: lists.include,
          })
        : orderBySlot({
            order,
            items: windows,
            slots: rects,
            facts,
            priority: lists.include,
            previousSlots: undefined,
          });
    const bySlot =
      rearrange === undefined ? ordered : rearrange(ordered, rects, isFocused);
    if (bySlot === undefined) return [];

    return bySlot.map((window, index) => {
      const rect = rects[index];
      if (rect === undefined)
        throw new Error("Layout returned fewer rectangles than windows");

      return { window, desktopId, rect };
    });
  });

  if (moves.length === 0) {
    if (auto === "quiet") return;
    await showToast({
      style: Toast.Style.Failure,
      title:
        rearrange === undefined
          ? "No windows to tile"
          : "The focused window is not among the tiled windows",
    });

    return;
  }
  if (rearrange === undefined)
    await saveLastTiling({
      scope,
      layout,
      slots: moves.map((move) => move.rect),
      bundleIds:
        autoApps ??
        [
          ...new Set(moves.map((move) => move.window.application?.bundleId)),
        ].filter((bundleId) => bundleId !== undefined),
      windowIds: moves.map((move) => move.window.id),
    });

  // Windows already on their target are left alone, which also keeps them out of the sequential transition's time budget.
  const outstanding = moves.filter(
    (move) => !rectsMatch(rectOf(move.window), move.rect),
  );
  const failures = await animateMoves(
    outstanding.map((move) => ({
      subject: move,
      from: rectOf(move.window),
      to: move.rect,
    })),
    async ({ window, desktopId }, rect) =>
      WindowManagement.setWindowBounds({
        id: window.id,
        desktopId,
        bounds: {
          position: { x: rect.x, y: rect.y },
          size: { width: rect.width, height: rect.height },
        },
      }),
    timing,
  );

  const tiled = moves.length - failures.size;
  if (failures.size === 0 && skipped === 0) {
    if (auto === "quiet") return;
    await showToast({
      style: Toast.Style.Success,
      title: `${verb} ${String(tiled)} ${tiled === 1 ? "window" : "windows"}`,
    });

    return;
  }
  const notes = [
    skipped > 0
      ? `${String(skipped)} could not be moved or resized`
      : undefined,
    failures.size === 0 ? undefined : String([...failures.values()][0]),
  ].filter((note) => note !== undefined);
  await showToast({
    style: Toast.Style.Failure,
    title: `${verb} ${String(tiled)} of ${String(moves.length + skipped)} windows`,
    message: notes.join("; "),
  });
}

/**
 * Runs a tiling command, reporting any error as a failure toast.
 *
 * Uses `layout` when given, otherwise the layout preference.
 */
export async function runTile(scope: Scope, layout?: LayoutId): Promise<void> {
  try {
    await tileWindows({
      scope,
      layout,
      order: undefined,
      rearrange: undefined,
      verb: "Tiled",
      auto: undefined,
    });
  } catch (error) {
    await showFailureToast(error, { title: "Could not tile windows" });
  }
}

const REARRANGE: Record<ReorderAction, Rearrange> = {
  left: (ordered, slots, isFocused) =>
    swapInDirection(ordered, slots, isFocused, "left"),
  right: (ordered, slots, isFocused) =>
    swapInDirection(ordered, slots, isFocused, "right"),
  up: (ordered, slots, isFocused) =>
    swapInDirection(ordered, slots, isFocused, "up"),
  down: (ordered, slots, isFocused) =>
    swapInDirection(ordered, slots, isFocused, "down"),
  forward: (ordered, _, isFocused) => swapActive(ordered, isFocused, 1),
  back: (ordered, _, isFocused) => swapActive(ordered, isFocused, -1),
  start: (ordered, _, isFocused) => moveActiveTo(ordered, isFocused, "start"),
  end: (ordered, _, isFocused) => moveActiveTo(ordered, isFocused, "end"),
  "rotate-forward": (ordered) => rotate(ordered, 1),
  "rotate-back": (ordered) => rotate(ordered, -1),
};

async function reorderWith(rearrange: Rearrange): Promise<void> {
  const last = await loadLastTiling();
  await tileWindows({
    scope: last?.scope ?? "desktop",
    layout: last?.layout,
    order: "nearest",
    rearrange,
    verb: "Reordered",
    auto: undefined,
  });
}

/**
 * Reorders the windows within the layout the last tiling command used, reporting any error as a failure toast.
 *
 * Windows are first matched to slots by where they are now, so this acts on the arrangement on screen. With no earlier tiling it uses the desktop scope and the layout preference.
 */
export async function runReorder(action: ReorderAction): Promise<void> {
  try {
    await reorderWith(REARRANGE[action]);
  } catch (error) {
    await showFailureToast(error, { title: "Could not reorder windows" });
  }
}

const NUMBERED: Record<NumberedMove, typeof swapWithNumbered> = {
  swap: swapWithNumbered,
  insert: insertBeforeNumbered,
};

/**
 * Swaps the focused window with, or inserts it before, the window at `position` in reading order (counting from 1), reporting any error as a failure toast.
 *
 * `position` is the raw text of the command argument. Windows are matched to slots as in {@link runReorder}.
 */
export async function runNumberedReorder(
  move: NumberedMove,
  position: string,
): Promise<void> {
  try {
    const number = parseWindowNumber(position);
    await reorderWith((ordered, slots, isFocused) =>
      NUMBERED[move](ordered, slots, isFocused, number),
    );
  } catch (error) {
    await showFailureToast(error, { title: "Could not reorder windows" });
  }
}

/**
 * Re-tiles the applications of the last tiling, reporting any error as a failure toast.
 *
 * A `quiet` run does so only when the set of their windows has changed since the last tiling; a `now` run always does.
 *
 * Uses the layout and scope of the last tiling. Windows of other applications are left alone. Does nothing when no tiling has run.
 */
export async function runAutoTile(mode: "now" | "quiet"): Promise<void> {
  try {
    const last = await loadLastTiling();
    if (last === undefined) {
      if (mode === "now")
        await showToast({
          style: Toast.Style.Failure,
          title: "Tile the windows once before using auto tiling",
        });

      return;
    }
    await tileWindows({
      scope: last.scope,
      layout: last.layout,
      order: undefined,
      rearrange: undefined,
      verb: "Tiled",
      auto: mode,
    });
  } catch (error) {
    await showFailureToast(error, { title: "Could not auto tile windows" });
  }
}
