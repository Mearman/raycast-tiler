import { commitTypes } from "./release.config";

export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", commitTypes.map(({ type }) => type)],
  },
};
