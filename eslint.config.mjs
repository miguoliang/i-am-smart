import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/**",
    "storybook-static/**",
    "docker/**",
    "deploy/**",
    "scripts/svg-to-png.mjs",
  ]),
  {
    rules: {
      // Prevent direct console usage - use logger utility instead
      "no-console": "error",
    },
  },
  {
    // Allow console usage only in the logger utility file
    files: ["src/lib/utils/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // CLI scripts may use console
    files: ["scripts/**/*.mjs"],
    rules: {
      "no-console": "off",
    },
  },
  {
    // Disable no-explicit-any for Storybook files (needed for generic component types)
    files: ["**/*.stories.tsx", "**/*.stories.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
