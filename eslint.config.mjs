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
    "public/workbox-*.js",
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
]);

export default eslintConfig;
