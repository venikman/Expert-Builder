import { test, expect } from "@playwright/test";

test("next/prev lesson navigation updates lesson content", async ({ page }) => {
  await page.goto("/");

  const heading = page.locator('[data-testid="text-lesson-heading"]:visible');
  const prevLesson = page.getByTestId("button-prev-lesson");
  const nextLesson = page.getByTestId("button-next-lesson");

  await expect(prevLesson).toBeDisabled();
  await expect(nextLesson).toBeEnabled();

  const firstTitle = await heading.innerText();

  await nextLesson.click();
  await expect(page.getByTestId("badge-lesson-number")).toHaveText(/^2\/\d+$/);
  await expect(prevLesson).toBeEnabled();
  await expect(heading).not.toHaveText(firstTitle);

  await prevLesson.click();
  await expect(page.getByTestId("badge-lesson-number")).toHaveText(/^1\/\d+$/);
  await expect(prevLesson).toBeDisabled();
  await expect(heading).toHaveText(firstTitle);
});

