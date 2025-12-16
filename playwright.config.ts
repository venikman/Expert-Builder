import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 1280, height: 800 },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on",
  },
  outputDir: "test-results",
  webServer: [
    {
      command: "bun run dev",
      url: "http://localhost:5050/api/lessons",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "bun run dev:client",
      url: "http://localhost:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
      },
      testIgnore: ["**/lighthouse.e2e.ts"],
    },
    {
      name: "chromium-lighthouse",
      testMatch: ["**/lighthouse.e2e.ts"],
      workers: 1,
      use: {
        browserName: "chromium",
        launchOptions: {
          args: ["--remote-debugging-port=9222"],
        },
      },
    },
  ],
});
