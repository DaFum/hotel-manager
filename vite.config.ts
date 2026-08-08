import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    // e2e/ belongs to Playwright, not Vitest.
    exclude: ["node_modules/**", "dist/**", "e2e/**"],
  },
});
