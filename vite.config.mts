import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    testTimeout: 15_000,
    // e2e/ belongs to Playwright, not Vitest.
    exclude: ["node_modules/**", "dist/**", "e2e/**"],
  },
});
