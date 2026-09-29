declare module "@raycast/eslint-plugin" {
  import type { Linter } from "eslint";

  /** The parts of the untyped `@raycast/eslint-plugin` this project uses. */
  const plugin: { configs: { recommended: Linter.Config[] } };

  export default plugin;
}
