import { defineConfig, devices } from "@playwright/test";
import { QA_DEVICE_MATRIX } from "./testing/qa-device-matrix";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "./testing",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: baseUrl,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_SKIP_WEB_SERVER
    ? undefined
    : {
        command: "npm run dev -- -H 127.0.0.1",
        url: baseUrl,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: QA_DEVICE_MATRIX.map((device) => ({
    name: device.slug,
    use: {
      ...devices["Desktop Chrome"],
      viewport: {
        width: device.width,
        height: device.height,
      },
      hasTouch: device.hasTouch,
      isMobile: device.isMobile,
    },
  })),
});
