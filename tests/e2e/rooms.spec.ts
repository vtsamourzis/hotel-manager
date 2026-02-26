import { test, expect } from "@playwright/test";

test.describe("Room state management", () => {
  test("displays room grid with rooms", async ({ page }) => {
    await page.goto("/rooms");

    // Wait for room cards to load
    await page.waitForSelector("[class*='roomCard']", { timeout: 10_000 });

    // Should show at least some rooms (10 rooms total)
    const roomCards = page.locator("[class*='roomCard']");
    await expect(roomCards.first()).toBeVisible();
  });

  test("opens room detail panel when clicking a room", async ({ page }) => {
    await page.goto("/rooms");
    await page.waitForSelector("[class*='roomCard']", { timeout: 10_000 });

    // Click the first room card
    await page.locator("[class*='roomCard']").first().click();

    // Detail panel should slide in -- look for the panel container
    await expect(
      page.locator("[class*='detailPanel']")
    ).toBeVisible({ timeout: 5_000 });
  });

  test("can navigate between floor tabs", async ({ page }) => {
    await page.goto("/rooms");
    await page.waitForSelector("[class*='roomCard']", { timeout: 10_000 });

    // Look for floor tab buttons
    const floorTabs = page.locator(
      "[class*='floorTab'], [class*='filterBtn']"
    );
    const tabCount = await floorTabs.count();

    if (tabCount > 1) {
      // Click second tab
      await floorTabs.nth(1).click();
      // Page should still show rooms (content changes)
      await expect(
        page.locator("[class*='roomCard']").first()
      ).toBeVisible();
    }
  });
});
