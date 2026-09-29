import {
  getPreferenceValues,
  showToast,
  Toast,
  WindowManagement,
} from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { isAllowed } from "./filter";
import { isLayoutId, layoutWindows } from "./layouts";
import { loadLists } from "./storage";

/** Which windows a tiling command arranges. */
export type Scope = "current-app" | "desktop";

type Window = WindowManagement.Window;

function parseGap(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return 0;
  const gap = Number(raw);
  if (!Number.isFinite(gap) || gap < 0)
    throw new Error(`Gap must be a non-negative number, got "${raw}"`);
  return gap;
}

/** Puts the active window first so order-sensitive layouts (main-stack, spiral) give it the largest slot. */
function activeFirst(windows: Window[]): Window[] {
  return [
    ...windows.filter((window) => window.active),
    ...windows.filter((window) => !window.active),
  ];
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

async function tileWindows(scope: Scope): Promise<void> {
  const { layout, gap: rawGap } = getPreferenceValues<Preferences>();
  if (!isLayoutId(layout)) throw new Error(`Unknown layout "${layout}"`);
  const gap = parseGap(rawGap);

  const [lists, desktops, scoped] = await Promise.all([
    loadLists(),
    WindowManagement.getDesktops(),
    windowsInScope(scope),
  ]);

  const allowed = scoped.filter((window) =>
    isAllowed(window.application?.bundleId, lists),
  );
  const tileable = allowed.filter(
    (window) => window.positionable && window.resizable,
  );
  const skipped = allowed.length - tileable.length;

  const byDesktop = Map.groupBy(
    activeFirst(tileable),
    (window) => window.desktopId,
  );
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
    return layoutWindows(layout, windows.length, area, gap).map(
      (rect, index) => {
        const window = windows[index];
        if (window === undefined)
          throw new Error("Layout returned more rectangles than windows");
        return { window, desktopId, rect };
      },
    );
  });

  if (moves.length === 0) {
    await showToast({
      style: Toast.Style.Failure,
      title: "No windows to tile",
    });
    return;
  }

  const results = await Promise.allSettled(
    moves.map(({ window, desktopId, rect }) =>
      WindowManagement.setWindowBounds({
        id: window.id,
        desktopId,
        bounds: {
          position: { x: rect.x, y: rect.y },
          size: { width: rect.width, height: rect.height },
        },
      }),
    ),
  );

  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );
  const tiled = moves.length - failures.length;
  if (failures.length === 0 && skipped === 0) {
    await showToast({
      style: Toast.Style.Success,
      title: `Tiled ${tiled} ${tiled === 1 ? "window" : "windows"}`,
    });
    return;
  }
  const notes = [
    skipped > 0 ? `${skipped} could not be moved or resized` : undefined,
    failures[0] === undefined ? undefined : String(failures[0].reason),
  ].filter((note) => note !== undefined);
  await showToast({
    style: Toast.Style.Failure,
    title: `Tiled ${tiled} of ${moves.length + skipped} windows`,
    message: notes.join("; "),
  });
}

/** Runs a tiling command, reporting any error as a failure toast. */
export async function runTile(scope: Scope): Promise<void> {
  try {
    await tileWindows(scope);
  } catch (error) {
    await showFailureToast(error, { title: "Could not tile windows" });
  }
}
