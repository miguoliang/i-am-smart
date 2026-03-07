import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E test configuration.
 * Run: pnpm exec playwright test (from repo root)
 * Or:  BASE_URL=https://www.iamsmart.top pnpm exec playwright test
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",

  use: {
    baseURL: process.env.BASE_URL ?? "https://preview.iamsmart.top",
    trace: "on-first-retry",
    // Give CSR pages time to hydrate
    navigationTimeout: 15_000,
    actionTimeout: 10_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
