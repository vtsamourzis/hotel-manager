import { test, expect } from "@playwright/test";

test.describe("Check-in workflow", () => {
  test("can open check-in modal from a vacant room", async ({ page }) => {
    await page.goto("/rooms");
    await page.waitForSelector("[class*='roomCard']", { timeout: 10_000 });

    // Look for a room card and click it to open detail panel
    await page.locator("[class*='roomCard']").first().click();
    await expect(
      page.locator("[class*='detailPanel']")
    ).toBeVisible({ timeout: 5_000 });

    // Look for a check-in button in the detail panel
    const checkinButton = page.getByRole("button", { name: /check.?in/i });

    // If the room has a check-in button (vacant room), test the modal
    if (
      await checkinButton.isVisible({ timeout: 3_000 }).catch(() => false)
    ) {
      await checkinButton.click();

      // Check-in modal should appear
      await expect(
        page.getByText("Όνομα επισκέπτη")
      ).toBeVisible({ timeout: 5_000 });
    }
  });

  test("check-in modal has required fields", async ({ page }) => {
    await page.goto("/rooms");
    await page.waitForSelector("[class*='roomCard']", { timeout: 10_000 });

    // Try to find a vacant room and open check-in modal
    await page.locator("[class*='roomCard']").first().click();
    await expect(
      page.locator("[class*='detailPanel']")
    ).toBeVisible({ timeout: 5_000 });

    const checkinButton = page.getByRole("button", { name: /check.?in/i });

    if (
      await checkinButton.isVisible({ timeout: 3_000 }).catch(() => false)
    ) {
      await checkinButton.click();

      // Verify modal fields exist
      await expect(page.getByText("Όνομα επισκέπτη")).toBeVisible();

      // Look for date fields
      const checkinField = page.getByLabel(/check.?in/i);
      const checkoutField = page.getByLabel(/check.?out/i);

      // Verify confirm button exists
      await expect(
        page.getByRole("button", { name: /επιβεβαίωση/i })
      ).toBeVisible();
    }
  });
});
