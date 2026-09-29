import { runTile } from "./tile";

export default async function Command(): Promise<void> {
  await runTile("current-app", "grid");
}
