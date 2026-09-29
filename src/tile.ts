import {
  getPreferenceValues,
  showToast,
  Toast,
  WindowManagement,
} from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { animateMoves } from "./animation";
import { isAllowed } from "./filter";
import {
  isGapUnit,
  isLayoutId,
  layoutWindows,
  type LayoutId,
  type Rect,
} from "./layouts";
import { isOrderId, orderBySlot, type OrderId } from "./ordering";
import { moveActiveTo, rotate, swapActive } from "./reorder";
import type { Scope } from "./scope";
import { loadLastTiling, loadLists, saveLastTiling } from "./storage";

export type { Scope } from "./scope";

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

/** Rearranges windows already in slot order; `undefined` means this group has nothing to rearrange. */
type Rearrange = (
  ordered: PlacedWindow[],
  isFocused: (window: PlacedWindow) => boolean,
) => PlacedWindow[] | undefined;

type TileRequest = {
  scope: Scope;
  /** Overrides the layout preference. */
  layout: LayoutId | undefined;
  /** Overrides the window order preference. */
  order: OrderId | undefined;
  /** Applied to each desktop's windows after ordering, to reorder windows within the layout. */
  rearrange: Rearrange | undefined;
  /** Past-tense verb for the result toast. */
  verb: string;
};

async function tileWindows(request: TileRequest): Promise<void> {
  const { scope, rearrange, verb } = request;
  const {
    layout: preferredLayout,
    windowOrder,
    gap: rawGap,
    gapUnit,
    gapAtEdge,
    gapBetween,
    moveDuration: rawMoveDuration,
    resizeDuration: rawResizeDuration,
  } = getPreferenceValues<Preferences>();
  const layout = request.layout ?? preferredLayout;
  if (!isLayoutId(layout)) throw new Error(`Unknown layout "${layout}"`);
  const order = request.order ?? windowOrder;
  if (!isOrderId(order)) throw new Error(`Unknown window order "${order}"`);
  if (!isGapUnit(gapUnit)) throw new Error(`Unknown gap unit "${gapUnit}"`);
  const gap = {
    value: parseNumber("Gap", rawGap),
    unit: gapUnit,
    edge: gapAtEdge,
    between: gapBetween,
  };
  const durations = {
    moveMs: parseNonNegative("Move duration", rawMoveDuration),
    resizeMs: parseNonNegative("Resize duration", rawResizeDuration),
  };

  // `Window.active` is true for every window of the frontmost application, so the one focused window is found by id.
  const focusedId =
    rearrange !== undefined || order === "active-first"
      ? (await WindowManagement.getActiveWindow()).id
      : undefined;
  const isFocused = (window: PlacedWindow): boolean => window.id === focusedId;

  const [lists, desktops, scoped] = await Promise.all([
    loadLists(),
    WindowManagement.getDesktops(),
    windowsInScope(scope),
  ]);

  const allowed = scoped.filter((window) =>
    isAllowed(window.application?.bundleId, lists),
  );
  const tileable = allowed.filter(
    (window): window is PlacedWindow =>
      window.positionable && window.resizable && isPlaced(window),
  );
  const skipped = allowed.length - tileable.length;

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
    const rects = layoutWindows(layout, windows.length, area, gap);
    const ordered = orderBySlot(
      order,
      windows,
      rects,
      {
        boundsOf: rectOf,
        isActive: isFocused,
        bundleIdOf: (window) => window.application?.bundleId,
      },
      lists.include,
    );
    const bySlot =
      rearrange === undefined ? ordered : rearrange(ordered, isFocused);
    if (bySlot === undefined) return [];
    return bySlot.map((window, index) => {
      const rect = rects[index];
      if (rect === undefined)
        throw new Error("Layout returned fewer rectangles than windows");
      return { window, desktopId, rect };
    });
  });

  if (moves.length === 0) {
    await showToast({
      style: Toast.Style.Failure,
      title:
        rearrange === undefined
          ? "No windows to tile"
          : "The focused window is not among the tiled windows",
    });
    return;
  }
  if (rearrange === undefined) await saveLastTiling({ scope, layout });

  const failures = await animateMoves(
    moves.map((move) => ({
      subject: move,
      from: rectOf(move.window),
      to: move.rect,
    })),
    ({ window, desktopId }, rect) =>
      WindowManagement.setWindowBounds({
        id: window.id,
        desktopId,
        bounds: {
          position: { x: rect.x, y: rect.y },
          size: { width: rect.width, height: rect.height },
        },
      }),
    durations,
  );

  const tiled = moves.length - failures.size;
  if (failures.size === 0 && skipped === 0) {
    await showToast({
      style: Toast.Style.Success,
      title: `${verb} ${tiled} ${tiled === 1 ? "window" : "windows"}`,
    });
    return;
  }
  const notes = [
    skipped > 0 ? `${skipped} could not be moved or resized` : undefined,
    failures.size === 0 ? undefined : String([...failures.values()][0]),
  ].filter((note) => note !== undefined);
  await showToast({
    style: Toast.Style.Failure,
    title: `${verb} ${tiled} of ${moves.length + skipped} windows`,
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
    });
  } catch (error) {
    await showFailureToast(error, { title: "Could not tile windows" });
  }
}

/** A change to the order of the windows in the current layout. */
export type ReorderAction =
  | "move-forward"
  | "move-back"
  | "move-start"
  | "move-end"
  | "rotate-forward"
  | "rotate-back";

const REARRANGE: Record<ReorderAction, Rearrange> = {
  "move-forward": (ordered, isFocused) => swapActive(ordered, isFocused, 1),
  "move-back": (ordered, isFocused) => swapActive(ordered, isFocused, -1),
  "move-start": (ordered, isFocused) =>
    moveActiveTo(ordered, isFocused, "start"),
  "move-end": (ordered, isFocused) => moveActiveTo(ordered, isFocused, "end"),
  "rotate-forward": (ordered) => rotate(ordered, 1),
  "rotate-back": (ordered) => rotate(ordered, -1),
};

/**
 * Reorders the windows within the layout the last tiling command used, reporting any error as a failure toast.
 *
 * Windows are first matched to slots by where they are now, so this acts on the arrangement on screen. With no earlier tiling it uses the desktop scope and the layout preference.
 */
export async function runReorder(action: ReorderAction): Promise<void> {
  try {
    const last = await loadLastTiling();
    await tileWindows({
      scope: last?.scope ?? "desktop",
      layout: last?.layout,
      order: "nearest",
      rearrange: REARRANGE[action],
      verb: "Reordered",
    });
  } catch (error) {
    await showFailureToast(error, { title: "Could not reorder windows" });
  }
}
