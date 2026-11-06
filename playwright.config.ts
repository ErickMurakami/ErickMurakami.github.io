import { defineConfig } from "@playwright/test";
export default defineConfig({
  timeout: 120000,
  testDir: "./tests/browser",
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4321", browserName: "chromium" },
  webServer: {
    command: "python3 -m http.server 4321 --bind 127.0.0.1 --directory dist",
    url: "http://127.0.0.1:4321",
    stdout: "ignore",
    stderr: "ignore",
    reuseExistingServer: !process.env.CI,
  },
});
