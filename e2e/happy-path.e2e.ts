import { test, expect } from "@playwright/test";

const pureFunctionsSolution = `using System;

public class Exercise
{
    public static int Square(int n)
    {
        return n * n;
    }
}
`;

test.use({ viewport: { width: 1280, height: 720 } });

test("happy path: submit passing solution marks progress", async ({ page }) => {
  test.setTimeout(120_000);

  await page.addInitScript(({ solution }) => {
    localStorage.clear();
    localStorage.setItem("code-pure-functions", solution);
  }, { solution: pureFunctionsSolution });

  await page.goto("/");

  await expect(page.getByTestId("text-app-title")).toHaveText("FP C# Academy");

  // Indicates the editor loaded saved code that differs from the skeleton.
  await expect(page.locator('[data-testid="button-reset-code"]:visible')).toBeVisible();

  await page.locator('[data-testid="button-submit-code"]:visible').click();

  const notifications = page.getByLabel("Notifications (F8)");
  await expect(notifications.getByText("All tests passed!")).toBeVisible({ timeout: 120_000 });
  await expect(
    notifications.getByText("Great job! You can move on to the next lesson.")
  ).toBeVisible();

  const progressButton = page.getByRole("button", { name: "Open lesson progress" });
  await expect(progressButton.getByText(/^1\/\d+$/)).toBeVisible();

  const storedProgressRaw = await page.evaluate(() => localStorage.getItem("lesson-progress"));
  const storedProgress = JSON.parse(storedProgressRaw ?? "{}");
  expect(storedProgress["pure-functions"]?.completed).toBe(true);
});
