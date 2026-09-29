/** Which windows a tiling command arranges. */
export const SCOPES = ["current-app", "desktop"] as const;

export type Scope = (typeof SCOPES)[number];

export function isScope(value: unknown): value is Scope {
  return SCOPES.some((scope) => scope === value);
}
