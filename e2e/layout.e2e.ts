import { test, expect } from "@playwright/test";
import { initLocalStorage } from "./utils/storage";

test.use({ viewport: { width: 1366, height: 900 } });

test("desktop layout shows code left and lesson right", async ({ page }) => {
  await initLocalStorage(page, { onceKey: "__expert_builder_e2e_inited" });

  await page.goto("/");
  await expect(page.getByTestId("text-app-title")).toHaveText("FP C# Academy");

  await expect(page.getByTestId("button-lesson-mode")).toHaveCount(0);
  await expect(page.getByTestId("button-coding-mode")).toHaveCount(0);

  const editorLabel = page.locator('span:has-text("Exercise.cs"):visible');
  const lessonHeading = page.locator('[data-testid="text-lesson-heading"]:visible');

  const editorBox = await editorLabel.boundingBox();
  const lessonBox = await lessonHeading.boundingBox();

  expect(editorBox).not.toBeNull();
  expect(lessonBox).not.toBeNull();
  expect(editorBox!.x).toBeLessThan(lessonBox!.x);

  const showExamplesBtn = page.getByTestId("button-show-examples");
  const drawerTitle = page.getByRole("heading", { name: "Reference Examples" });

  await expect(showExamplesBtn).toBeVisible();

  await showExamplesBtn.click();
  await expect(drawerTitle).toBeVisible();
  await page.getByRole("button", { name: "Close" }).click();
  await expect(drawerTitle).not.toBeVisible();
});
