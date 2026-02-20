import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export const baseConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-console": "error",
    },
  },
]);

export const storybookOverrides = {
  files: ["**/*.stories.tsx", "**/*.stories.ts"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
  },
};

export const scriptsOverrides = {
  files: ["scripts/**/*.mjs"],
  rules: {
    "no-console": "off",
  },
};

export const miniprogramOverrides = {
  files: ["**/*.ts"],
  rules: {
    "no-console": "off",
    "@typescript-eslint/no-explicit-any": "warn",
  },
};

export { globalIgnores };
