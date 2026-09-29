import { LaunchProps } from "@raycast/api";
import { isLayoutId } from "./layouts";
import { runTile } from "./tile";

export default async function Command(
  props: LaunchProps<{ arguments: Arguments.TileDesktop }>,
): Promise<void> {
  const { layout } = props.arguments;
  await runTile("desktop", isLayoutId(layout) ? layout : undefined);
}
