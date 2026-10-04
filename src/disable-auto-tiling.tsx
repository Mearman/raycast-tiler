import { setAutoTiling } from "./auto-tile-commands";

export default async function Command(): Promise<void> {
  await setAutoTiling(false);
}
