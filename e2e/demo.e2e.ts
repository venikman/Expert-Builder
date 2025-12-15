import { test, expect } from "@playwright/test";

const pureFunctionsSolution = `using System;

public class Exercise
{
    public static int Square(int n)
    {
        return n * n;
    }

    public static void Main()
    {
        Console.WriteLine($"Square(5) = {Square(5)}");
        Console.WriteLine($"Square(-3) = {Square(-3)}");
        Console.WriteLine($"Square(0) = {Square(0)}");
    }
}`;

// Slower actions for demo visibility
const DELAY = 500;

test.use({
  viewport: { width: 1280, height: 800 },
  video: "on",
});

test("demo: complete lesson flow", async ({ page }) => {
  test.setTimeout(120_000);

  // Pre-load solution
  await page.addInitScript(({ solution }) => {
    localStorage.clear();
    localStorage.setItem("code-pure-functions", solution);
  }, { solution: pureFunctionsSolution });

  await page.goto("/");

  // Wait for app to load
  await expect(page.getByTestId("text-app-title")).toHaveText("FP C# Academy");
  await page.waitForTimeout(DELAY);

  // Show lesson content
  await expect(page.getByRole("heading", { name: "What are Pure Functions?" })).toBeVisible();
  await page.waitForTimeout(DELAY * 2);

  // Click Run to show console output
  await page.locator('[data-testid="button-run-code"]:visible').click();
  await page.waitForTimeout(DELAY);

  // Wait for console output
  await expect(page.getByText("Square(5) = 25")).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(DELAY * 2);

  // Submit the solution
  await page.locator('[data-testid="button-submit-code"]:visible').click();

  // Wait for success notification
  const notifications = page.getByLabel("Notifications (F8)");
  await expect(notifications.getByText("All tests passed!")).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(DELAY * 2);

  // Open progress dialog
  await page.getByRole("button", { name: "Open lesson progress" }).click();
  await page.waitForTimeout(DELAY);

  // Verify completion
  await expect(page.getByText("Completed 1 of 5 lessons")).toBeVisible();
  await page.waitForTimeout(DELAY);

  // Scroll to show Coming Soon section
  const comingSoon = page.getByText("Coming Soon");
  await comingSoon.scrollIntoViewIfNeeded();
  await page.waitForTimeout(DELAY * 3);
});
