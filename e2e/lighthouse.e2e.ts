import { test, expect } from "@playwright/test";
import { playAudit } from "playwright-lighthouse";

// Dev mode has lower perf due to unminified code, HMR, source maps
const IS_PROD = process.env.CI || process.env.PROD_TEST;

test.describe("Lighthouse", () => {
  test("should meet performance thresholds", async ({ page }, testInfo) => {
    // Only run in Chromium (Lighthouse requires it)
    test.skip(testInfo.project.name !== "chromium", "Lighthouse only works in Chromium");

    await page.goto("/");
    await expect(page.getByTestId("text-app-title")).toBeVisible();

    const result = await playAudit({
      page,
      port: 9222,
      thresholds: {
        performance: IS_PROD ? 70 : 30, // Dev mode is slower
        accessibility: 90,
        "best-practices": 80,
        seo: 80,
      },
    });

    const scores = {
      performance: Math.round(result.lhr.categories.performance.score * 100),
      accessibility: Math.round(result.lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(result.lhr.categories["best-practices"].score * 100),
      seo: Math.round(result.lhr.categories.seo.score * 100),
    };

    console.log(`\nLighthouse Scores (${IS_PROD ? "prod" : "dev"} mode):`);
    console.log(`  Performance:    ${scores.performance}`);
    console.log(`  Accessibility:  ${scores.accessibility}`);
    console.log(`  Best Practices: ${scores.bestPractices}`);
    console.log(`  SEO:            ${scores.seo}\n`);
  });
});
