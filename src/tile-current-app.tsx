import { type LaunchProps } from "@raycast/api";
import { isLayoutId } from "./layouts/types";
import { runTile } from "./tile";

export default async function Command(
  props: LaunchProps<{ arguments: Arguments.TileCurrentApp }>,
): Promise<void> {
  const { layout } = props.arguments;
  await runTile("current-app", isLayoutId(layout) ? layout : undefined);
}
