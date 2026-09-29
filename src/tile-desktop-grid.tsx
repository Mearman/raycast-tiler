import { runTile } from "./tile";

export default async function Command(): Promise<void> {
  await runTile("desktop", "grid");
}
