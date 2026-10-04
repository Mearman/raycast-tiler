import { environment, LaunchType, showHUD } from "@raycast/api";
import { runAutoTile } from "./tile";
import { loadAutoTile, saveAutoTile } from "./storage";

/** Switches auto tiling on or off, then tiles now when it was switched on. */
export async function setAutoTiling(enabled: boolean): Promise<void> {
  await saveAutoTile(enabled);
  await showHUD(enabled ? "Auto tiling on" : "Auto tiling off");
  if (enabled) await runAutoTile("now");
}

export async function toggleAutoTiling(): Promise<void> {
  await setAutoTiling(!(await loadAutoTile()));
}

/**
 * The scheduled check. A background run re-tiles quietly when auto tiling is on and the windows have changed. Opening it by hand only reports the state, which also lets Raycast start the schedule.
 */
export async function checkAutoTiling(): Promise<void> {
  const enabled = await loadAutoTile();
  if (environment.launchType === LaunchType.Background) {
    if (enabled) await runAutoTile("quiet");

    return;
  }
  await showHUD(enabled ? "Auto tiling is on" : "Auto tiling is off");
}
