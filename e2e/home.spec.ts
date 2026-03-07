import { test, expect } from "@playwright/test";

/**
 * Home page — loads correctly and contains key marketing elements.
 */
test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("has correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/聪明的背单词工具/);
  });

  test("displays hero headline", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /每天.*分钟.*记住.*个英语单词/ })
    ).toBeVisible();
  });

  test("displays CTA button linking to /learn or /signin", async ({ page }) => {
    const cta = page.getByRole("link", { name: /免费试试/ }).first();
    await expect(cta).toBeVisible();
    const href = await cta.getAttribute("href");
    expect(href).toMatch(/\/(learn|signin)/);
  });

  test("displays key feature cards", async ({ page }) => {
    // Use heading role to avoid strict-mode conflict with paragraph text
    await expect(
      page.getByRole("heading", { name: /科学算法/ })
    ).toBeVisible();
    await expect(page.getByText(/SM-2/).first()).toBeVisible();
  });

  test("footer contains ICP record", async ({ page }) => {
    await expect(page.getByText(/湘ICP备/)).toBeVisible();
  });

  test("navbar has 立即使用 link", async ({ page }) => {
    const navLink = page.getByRole("link", { name: /立即使用/ });
    await expect(navLink).toBeVisible();
  });
});
