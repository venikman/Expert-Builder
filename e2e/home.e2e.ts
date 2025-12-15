import { test, expect } from "@playwright/test";

test("loads the app and shows the first lesson", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("text-app-title")).toHaveText("FP C# Academy");
  await expect(page.getByTestId("badge-lesson-number")).toHaveText(/^1\/\d+$/);
  await expect(page.locator('[data-testid="text-lesson-heading"]:visible')).toHaveText(
    "Pure Functions"
  );
});

