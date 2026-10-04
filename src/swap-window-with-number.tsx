import { type LaunchProps } from "@raycast/api";
import { runNumberedReorder } from "./tile";

export default async function Command(
  props: LaunchProps<{ arguments: Arguments.SwapWindowWithNumber }>,
): Promise<void> {
  await runNumberedReorder("swap", props.arguments.position);
}
