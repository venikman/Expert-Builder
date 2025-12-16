import { test, expect } from "@playwright/test";
import { initLocalStorage } from "./utils/storage";

const pureFunctionsWrongSolution = `using System;

public class Exercise
{
    public static int Square(int n)
    {
        // Wrong on purpose: should be n * n
        return n;
    }
}
`;

test.use({ viewport: { width: 1280, height: 720 } });

test("submit failing solution shows destructive toast and does not mark progress", async ({ page }) => {
  test.setTimeout(120_000);

  await initLocalStorage(page, {
    items: { "code-pure-functions": pureFunctionsWrongSolution },
  });

  await page.goto("/");

  await page.locator('[data-testid="button-submit-code"]:visible').click();

  const notifications = page.getByLabel("Notifications (F8)");
  await expect(notifications.getByText("Some tests failed")).toBeVisible({ timeout: 120_000 });
  await expect(notifications.getByText(/tests passed\. Check the results for details\./)).toBeVisible();

  const storedProgressRaw = await page.evaluate(() => localStorage.getItem("lesson-progress"));
  const storedProgress = JSON.parse(storedProgressRaw ?? "{}");
  expect(storedProgress["pure-functions"]?.completed).not.toBe(true);
});
