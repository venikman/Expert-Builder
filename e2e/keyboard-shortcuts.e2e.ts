import { test, expect } from "@playwright/test";
import { initLocalStorage } from "./utils/storage";

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

// Monaco editor uses CtrlCmd which maps to Meta (Cmd) on macOS, Ctrl elsewhere
const isMacOS = process.platform === "darwin";
const ctrlOrCmd = isMacOS ? "Meta" : "Control";

test.describe("keyboard shortcuts", () => {
  test.beforeEach(async ({ page }) => {
    await initLocalStorage(page, {
      items: { "code-pure-functions": pureFunctionsSolution },
    });

    await page.goto("/");
    await expect(page.getByTestId("text-app-title")).toHaveText("FP C# Academy");
  });

  test("CtrlCmd+Enter runs code", async ({ page }) => {
    test.setTimeout(60_000);

    // Click on the Monaco editor to focus it properly
    const editorContainer = page.locator(".monaco-editor").first();
    await editorContainer.click();

    // Small delay to ensure editor is focused
    await page.waitForTimeout(200);

    // Press CtrlCmd+Enter to run code (Meta on macOS, Ctrl elsewhere)
    await page.keyboard.press(`${ctrlOrCmd}+Enter`);

    // Check that the Run button shows loading state (disabled while running)
    const runButton = page.getByTestId("button-run-code");
    await expect(runButton).toBeDisabled({ timeout: 5_000 });

    // Wait for output tab to show results
    const consoleTab = page.getByRole("tab", { name: "Console" });
    await consoleTab.click();
    await expect(page.getByRole("tabpanel", { name: "Console" })).toBeVisible({ timeout: 30_000 });
  });

  test("CtrlCmd+Shift+Enter submits code for grading", async ({ page }) => {
    test.setTimeout(120_000);

    // Click on the Monaco editor to focus it properly
    const editorContainer = page.locator(".monaco-editor").first();
    await editorContainer.click();

    // Small delay to ensure editor is focused
    await page.waitForTimeout(200);

    // Press CtrlCmd+Shift+Enter to submit
    await page.keyboard.press(`${ctrlOrCmd}+Shift+Enter`);

    // Check that the Submit button shows loading state (disabled while grading)
    const submitButton = page.getByTestId("button-submit-code");
    await expect(submitButton).toBeDisabled({ timeout: 5_000 });

    // Wait for grading to complete - should show success notification
    const notifications = page.getByLabel("Notifications (F8)");
    await expect(notifications.getByText("All tests passed!")).toBeVisible({ timeout: 120_000 });
  });

  test("keyboard shortcuts modal opens and displays shortcuts", async ({ page }) => {
    // Click the keyboard shortcuts button
    await page.getByTestId("button-keyboard-shortcuts").click();

    // Check that the modal is visible with expected content
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByText("Keyboard Shortcuts")).toBeVisible();

    // Verify some shortcut groups are displayed
    await expect(page.getByText("Code Execution")).toBeVisible();
    await expect(page.getByText("Editor")).toBeVisible();
    await expect(page.getByText("Run code")).toBeVisible();
    await expect(page.getByText("Submit for grading")).toBeVisible();
  });
});
