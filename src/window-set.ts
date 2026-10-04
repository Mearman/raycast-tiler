/**
 * Whether the windows to tile differ from those the last tiling arranged.
 *
 * `previous` is `undefined` when no window IDs were stored, which counts as a change. The order of the IDs does not matter.
 */
export function windowSetChanged(
  previous: readonly string[] | undefined,
  current: readonly string[],
): boolean {
  if (previous === undefined) return true;
  const stored = new Set(previous);

  return (
    stored.size !== new Set(current).size ||
    current.some((id) => !stored.has(id))
  );
}
