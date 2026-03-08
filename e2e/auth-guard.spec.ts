import { test, expect } from "@playwright/test";

/**
 * Auth guard tests — unauthenticated users must be redirected to /signin
 * for protected routes.
 *
 * Note: /learn is accessible in guest mode (no redirect).
 * /pay, /stats, and /operator still require authentication.
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
  test("/learn allows unauthenticated users (guest mode)", async ({ page }) => {
    await page.goto("/learn", { waitUntil: "networkidle" });
    // Guest mode: should stay on /learn, not redirect to /signin
    await page.waitForTimeout(3000);
    expect(page.url()).toMatch(/\/learn/);
    expect(page.url()).not.toMatch(SIGNIN_RE);
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
