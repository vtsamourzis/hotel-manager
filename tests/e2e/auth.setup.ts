import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, "../../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  // Navigate to login page
  await page.goto("/login");

  // Fill in credentials from environment
  // For E2E tests, use TEST_EMAIL / TEST_PASSWORD env vars
  // Falls back to a default test account for local development
  const email = process.env.TEST_EMAIL || "admin@hotel.local";
  const password = process.env.TEST_PASSWORD || "admin123";

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Κωδικός").fill(password);
  await page.getByRole("button", { name: /σύνδεση/i }).click();

  // Wait for redirect to overview (successful login)
  await page.waitForURL("**/overview", { timeout: 15_000 });

  // Verify we're on the overview page
  await expect(page).toHaveURL(/\/overview/);

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
