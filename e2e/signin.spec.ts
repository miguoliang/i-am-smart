import { test, expect } from "@playwright/test";

/**
 * Sign-in page — form elements, validation, and terms checkbox gate.
 */
test.describe("Sign-in page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signin");
  });

  test("renders page heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /聪明的背单词工具/ })
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /登录/ })).toBeVisible();
  });

  test("shows terms checkbox unchecked by default", async ({ page }) => {
    const checkbox = page.getByRole("checkbox");
    await expect(checkbox).not.toBeChecked();
  });

  test("OAuth buttons are disabled before accepting terms", async ({
    page,
  }) => {
    const wechat = page.getByRole("button", { name: /微信登录/ });
    const apple = page.getByRole("button", { name: /Apple/ });
    await expect(wechat).toBeDisabled();
    await expect(apple).toBeDisabled();
  });

  test("send-OTP button is disabled when phone field is empty", async ({
    page,
  }) => {
    const btn = page.getByRole("button", { name: /发送验证码/ });
    await expect(btn).toBeDisabled();
  });

  test("OAuth buttons become enabled after accepting terms", async ({
    page,
  }) => {
    await page.getByRole("checkbox").check();
    // After checking, buttons re-render as enabled — wait for enabled state
    await expect(
      page.getByRole("button", { name: /微信登录|微信扫码登录/ })
    ).toBeEnabled({ timeout: 5_000 });
    await expect(
      page.getByRole("button", { name: /Apple/ })
    ).toBeEnabled({ timeout: 5_000 });
  });

  test("shows phone format error for invalid number", async ({ page }) => {
    await page.getByRole("checkbox").check();
    await page.getByRole("textbox", { name: /手机号/ }).fill("12345");
    // Trigger validation by moving focus away
    await page.keyboard.press("Tab");
    await expect(page.getByText(/手机号格式不正确/)).toBeVisible();
    await expect(page.getByRole("button", { name: /发送验证码/ })).toBeDisabled();
  });

  test("send-OTP button becomes enabled for valid phone number", async ({
    page,
  }) => {
    await page.getByRole("checkbox").check();
    await page.getByRole("textbox", { name: /手机号/ }).fill("13800138000");
    await expect(page.getByRole("button", { name: /发送验证码/ })).toBeEnabled();
  });

  test("contains links to terms and privacy policy", async ({ page }) => {
    await expect(page.getByRole("link", { name: /服务条款/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /隐私政策/ })).toBeVisible();
  });
});
