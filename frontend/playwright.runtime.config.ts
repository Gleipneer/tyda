import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-runtime",
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "on-first-retry",
    viewport: { width: 1280, height: 720 },
  },
  webServer: undefined,
});
