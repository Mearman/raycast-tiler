import { type LaunchProps } from "@raycast/api";
import { runNumberedReorder } from "./tile";

export default async function Command(
  props: LaunchProps<{ arguments: Arguments.InsertWindowBeforeNumber }>,
): Promise<void> {
  await runNumberedReorder("insert", props.arguments.position);
}
