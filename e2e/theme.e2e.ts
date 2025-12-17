import { test, expect } from "@playwright/test"
import { initLocalStorage } from "./utils/storage"

test.use({ viewport: { width: 1280, height: 720 } })

test("design system theme variables are applied", async ({ page }) => {
  await initLocalStorage(page, { onceKey: "__expert_builder_e2e_inited" })

  await page.goto("/")
  await expect(page.getByTestId("text-app-title")).toHaveText("FP C# Academy")

  const snapshot = await page.evaluate(() => {
    const rootStyle = getComputedStyle(document.documentElement)
    const bodyStyle = getComputedStyle(document.body)

    return {
      isDark: document.documentElement.classList.contains("dark"),
      background: rootStyle.getPropertyValue("--background").trim(),
      foreground: rootStyle.getPropertyValue("--foreground").trim(),
      primary: rootStyle.getPropertyValue("--primary").trim(),
      fontFamily: bodyStyle.fontFamily,
    }
  })

  expect(snapshot.isDark).toBe(true)
  expect(snapshot.background).not.toBe("")
  expect(snapshot.foreground).not.toBe("")
  expect(snapshot.primary).not.toBe("")
  expect(snapshot.fontFamily.toLowerCase()).toContain("jetbrains")

  const scrollSnapshot = await page.evaluate(() => {
    const heading = document.querySelector<HTMLElement>(
      '[data-testid="text-lesson-heading"]'
    )
    const scrollAreaRoot = heading?.parentElement?.nextElementSibling as HTMLElement | null
    const materialViewport = scrollAreaRoot?.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]'
    )

    if (!materialViewport) {
      return { found: false }
    }

    const scrollHeight = materialViewport.scrollHeight
    const clientHeight = materialViewport.clientHeight
    const before = materialViewport.scrollTop

    materialViewport.scrollTo(0, 200)

    return {
      found: true,
      scrollHeight,
      clientHeight,
      before,
      after: materialViewport.scrollTop,
    }
  })

  expect(scrollSnapshot.found).toBe(true)
  if (scrollSnapshot.found && scrollSnapshot.scrollHeight > scrollSnapshot.clientHeight) {
    expect(scrollSnapshot.after).toBeGreaterThan(scrollSnapshot.before)
  }
})
