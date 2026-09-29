import { LaunchProps } from "@raycast/api";
import { isLayoutId } from "./layouts";
import { isScope } from "./scope";
import { runTile } from "./tile";

export default async function Command(
  props: LaunchProps<{ arguments: Arguments.TileLayout }>,
): Promise<void> {
  const { layout, scope } = props.arguments;
  if (!isLayoutId(layout)) throw new Error(`Unknown layout "${layout}"`);
  await runTile(isScope(scope) ? scope : "desktop", layout);
}
