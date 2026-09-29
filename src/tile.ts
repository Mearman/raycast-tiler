import {
  getPreferenceValues,
  showToast,
  Toast,
  WindowManagement,
} from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { animateMoves } from "./animation";
import { isAllowed } from "./filter";
import { isLayoutId, layoutWindows, type LayoutId } from "./layouts";
import { assignToNearestSlots } from "./proximity";
import { loadLists } from "./storage";

/** Which windows a tiling command arranges. */
export type Scope = "current-app" | "desktop";

type Window = WindowManagement.Window;

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

function centreOf(window: PlacedWindow): { x: number; y: number } {
  const { position, size } = window.bounds;
  return { x: position.x + size.width / 2, y: position.y + size.height / 2 };
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

async function tileWindows(
  scope: Scope,
  layoutOverride: LayoutId | undefined,
): Promise<void> {
  const {
    layout: preferredLayout,
    gap: rawGap,
    stackOffset: rawStackOffset,
    moveDuration: rawMoveDuration,
    resizeDuration: rawResizeDuration,
  } = getPreferenceValues<Preferences>();
  const layout = layoutOverride ?? preferredLayout;
  if (!isLayoutId(layout)) throw new Error(`Unknown layout "${layout}"`);
  const gap = parseNonNegative("Gap", rawGap);
  const stackOffset = parseNonNegative("Stack offset", rawStackOffset);
  const durations = {
    moveMs: parseNonNegative("Move duration", rawMoveDuration),
    resizeMs: parseNonNegative("Resize duration", rawResizeDuration),
  };

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
    const rects = layoutWindows(layout, windows.length, area, gap, {
      stackOffset,
    });
    const bySlot = assignToNearestSlots(windows, centreOf, rects);
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
      title: "No windows to tile",
    });
    return;
  }

  const failures = await animateMoves(
    moves.map((move) => ({
      subject: move,
      from: {
        x: move.window.bounds.position.x,
        y: move.window.bounds.position.y,
        width: move.window.bounds.size.width,
        height: move.window.bounds.size.height,
      },
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
      title: `Tiled ${tiled} ${tiled === 1 ? "window" : "windows"}`,
    });
    return;
  }
  const notes = [
    skipped > 0 ? `${skipped} could not be moved or resized` : undefined,
    failures.size === 0 ? undefined : String([...failures.values()][0]),
  ].filter((note) => note !== undefined);
  await showToast({
    style: Toast.Style.Failure,
    title: `Tiled ${tiled} of ${moves.length + skipped} windows`,
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
    await tileWindows(scope, layout);
  } catch (error) {
    await showFailureToast(error, { title: "Could not tile windows" });
  }
}
