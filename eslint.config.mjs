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
    "public/sw.js",
    "public/sw 2.js",
    "public/workbox-*.js",
    "docker/**",
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
    // Allow setState in effect for useCardNavigation - legitimate synchronization use case
    files: ["src/app/learn/hooks/useCardNavigation.ts"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
