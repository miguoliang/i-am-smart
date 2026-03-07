import { test, expect } from "@playwright/test";

/**
 * Pricing page — plan cards, prices, and CTA buttons render correctly.
 */
test.describe("Pricing page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/pricing");
  });

  test("has correct page title", async ({ page }) => {
    await expect(page).toHaveTitle(/聪明的背单词工具/);
  });

  test("displays main heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /选择.*提分计划/ })
    ).toBeVisible();
  });

  test("shows Free plan with ¥0 price", async ({ page }) => {
    await expect(page.getByText(/免费版/)).toBeVisible();
    await expect(page.getByText(/¥0/)).toBeVisible();
  });

  test("shows Pro plan with monthly price", async ({ page }) => {
    await expect(page.getByText(/Pro版/)).toBeVisible();
    // Monthly price should be visible (¥29 or similar)
    await expect(page.getByText(/¥\d+\s*\/\s*月/)).toBeVisible();
  });

  test("shows annual plan with discount", async ({ page }) => {
    // Annual option with savings — use first() to avoid strict-mode on multiple matches
    await expect(page.getByText(/年/).first()).toBeVisible();
    await expect(page.getByText(/off|折|省/i).first()).toBeVisible();
  });

  test("Free plan has start CTA", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /免费开始|立即免费|开始使用/ }).first()
    ).toBeVisible();
  });

  test("Pro plan has upgrade CTA", async ({ page }) => {
    // Page has both a link and a button with this label — either is fine
    await expect(
      page.getByRole("link", { name: /升级.*Pro|立即升级/ }).first()
    ).toBeVisible();
  });

  test("shows payment method labels", async ({ page }) => {
    await expect(page.getByText(/微信支付|支付宝/)).toBeVisible();
  });

  test("shows refund guarantee", async ({ page }) => {
    await expect(page.getByText(/退款/)).toBeVisible();
  });
});
