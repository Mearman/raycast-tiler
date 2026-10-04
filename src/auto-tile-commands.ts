import { showHUD } from "@raycast/api";
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
