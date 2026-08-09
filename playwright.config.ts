import { defineConfig, devices } from "@playwright/test";

/**
 * CI images often ship a pinned Chromium build; honour it instead of
 * downloading a second copy.
 */
const executablePath = process.env.CHROMIUM_PATH;

export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4173",
    launchOptions: executablePath ? { executablePath } : {},
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
