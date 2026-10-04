import { runUndo } from "./tile";

export default async function Command(): Promise<void> {
  await runUndo();
}
