import { LaunchProps } from "@raycast/api";
import { isReorderAction } from "./reorder";
import { runReorder } from "./tile";

export default async function Command(
  props: LaunchProps<{ arguments: Arguments.MoveWindow }>,
): Promise<void> {
  const { action } = props.arguments;
  if (!isReorderAction(action)) throw new Error(`Unknown action "${action}"`);
  await runReorder(action);
}
