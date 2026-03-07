import { test, expect } from "@playwright/test";

/**
 * 404 / not-found page — visiting a non-existent path renders a 404 UI
 * and does NOT redirect to /signin.
 */
test.describe("404 Not Found page", () => {
  test("renders 404 content for unknown path", async ({ page }) => {
    const response = await page.goto("/this-path-does-not-exist-xyz-404");
    // Next.js returns 404 status for not-found pages
    expect(response?.status()).toBe(404);
  });

  test("shows a 404 indicator on the page", async ({ page }) => {
    await page.goto("/this-path-does-not-exist-xyz-404");
    // Use the h1 heading specifically to avoid strict-mode violation
    await expect(
      page.getByRole("heading", { name: "404" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("does not redirect to /signin for 404 pages", async ({ page }) => {
    await page.goto("/this-path-does-not-exist-xyz-404");
    // Wait briefly to confirm we stay on the 404 path (not bounced to signin)
    await page.waitForTimeout(2000);
    expect(page.url()).not.toMatch(/\/signin/);
  });
});
