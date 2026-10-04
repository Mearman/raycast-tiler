import { environment, Icon, LaunchType, MenuBarExtra } from "@raycast/api";
import { showFailureToast, usePromise } from "@raycast/utils";
import { setAutoTiling } from "./auto-tile-commands";
import { loadAutoTile } from "./storage";
import { runAutoTile, runTile } from "./tile";

/**
 * The menu bar item for auto tiling, and the scheduled check behind it.
 *
 * Raycast reruns this command on its interval while it is enabled. A background run re-tiles quietly when auto tiling is on and the windows of the last tiling's applications have changed.
 */
export default function Command() {
  const {
    data: enabled,
    isLoading,
    revalidate,
  } = usePromise(async () => {
    const on = await loadAutoTile();
    if (on && environment.launchType === LaunchType.Background)
      await runAutoTile("quiet");

    return on;
  });

  return (
    <MenuBarExtra
      icon={enabled === true ? Icon.AppWindowGrid2x2 : Icon.AppWindow}
      tooltip={enabled === true ? "Auto tiling is on" : "Auto tiling is off"}
      isLoading={isLoading}
    >
      <MenuBarExtra.Item
        title={enabled === true ? "Disable Auto Tiling" : "Enable Auto Tiling"}
        onAction={() => {
          setAutoTiling(enabled !== true)
            .then(revalidate)
            .catch(showFailureToast);
        }}
      />
      <MenuBarExtra.Section>
        <MenuBarExtra.Item
          title="Tile Windows Now"
          onAction={() => {
            runTile("desktop").catch(showFailureToast);
          }}
        />
        <MenuBarExtra.Item
          title="Tile App Now"
          onAction={() => {
            runTile("current-app").catch(showFailureToast);
          }}
        />
      </MenuBarExtra.Section>
    </MenuBarExtra>
  );
}
