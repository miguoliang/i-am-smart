import { defineConfig } from "eslint/config";
import { baseConfig, globalIgnores, storybookOverrides, scriptsOverrides } from "@i-am-smart/eslint-config";

const eslintConfig = defineConfig([
  ...baseConfig,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/**",
    "storybook-static/**",
    "scripts/svg-to-png.mjs",
    "supabase/functions/**",
  ]),
  {
    files: ["src/lib/utils/logger.ts"],
    rules: { "no-console": "off" },
  },
  scriptsOverrides,
  storybookOverrides,
]);

export default eslintConfig;
