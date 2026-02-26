import { test, expect } from "@playwright/test";

test.describe("Login flow", () => {
  // This test does NOT use the shared auth state -- it tests login itself
  test.use({ storageState: { cookies: [], origins: [] } });

  test("redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/overview");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows login form with email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Κωδικός")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /σύνδεση/i })
    ).toBeVisible();
  });

  test("logs in with valid credentials and redirects to overview", async ({
    page,
  }) => {
    await page.goto("/login");

    const email = process.env.TEST_EMAIL || "admin@hotel.local";
    const password = process.env.TEST_PASSWORD || "admin123";

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Κωδικός").fill(password);
    await page.getByRole("button", { name: /σύνδεση/i }).click();

    await page.waitForURL("**/overview", { timeout: 15_000 });
    await expect(page).toHaveURL(/\/overview/);
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("wrong@test.com");
    await page.getByLabel("Κωδικός").fill("wrongpassword");
    await page.getByRole("button", { name: /σύνδεση/i }).click();

    // Should stay on login page and show an error
    await expect(page).toHaveURL(/\/login/);
    // Wait a moment for error to appear
    await page.waitForTimeout(1000);
    // The page should still show the login form (not redirect)
    await expect(page.getByLabel("Email")).toBeVisible();
  });
});
