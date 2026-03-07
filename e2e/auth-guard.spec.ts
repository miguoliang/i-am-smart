import { test, expect } from "@playwright/test";

/**
 * Auth guard tests — unauthenticated users must be redirected to /signin
 * for all protected routes.
 *
 * Note: /learn and /pay use client-side auth guards (useEffect).
 * They are expected to redirect after React hydration completes.
 * Failures here indicate a real auth-guard regression.
 */

const SIGNIN_RE = /\/signin/;

/**
 * Wait for a client-side redirect to /signin.
 * CSR auth guards fire in useEffect after hydration — give enough time.
 */
async function expectRedirectToSignin(
  page: import("@playwright/test").Page,
  path: string,
  timeoutMs = 15_000
) {
  await page.goto(path, { waitUntil: "networkidle" });
  await page.waitForURL(SIGNIN_RE, { timeout: timeoutMs });
  expect(page.url()).toMatch(SIGNIN_RE);
}

test.describe("Auth guard — protected routes redirect to /signin", () => {
  test("/learn redirects unauthenticated users", async ({ page }) => {
    await expectRedirectToSignin(page, "/learn");
  });

  test("/stats redirects unauthenticated users", async ({ page }) => {
    await expectRedirectToSignin(page, "/stats");
  });

  test("/pay redirects unauthenticated users", async ({ page }) => {
    await expectRedirectToSignin(page, "/pay");
  });

  test("/operator redirects unauthenticated users", async ({ page }) => {
    await page.goto("/operator", { waitUntil: "networkidle" });
    // Operator may redirect to /operator/login or /signin
    await page.waitForURL(/\/(signin|operator\/login)/, { timeout: 15_000 });
    expect(page.url()).toMatch(/\/(signin|operator\/login)/);
  });
});
