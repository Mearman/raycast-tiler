import { runReorder } from "./tile";

export default async function Command(): Promise<void> {
  await runReorder("down");
}
