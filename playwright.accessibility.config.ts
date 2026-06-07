import { defineConfig, devices } from "@playwright/test";
import { QA_DEVICE_MATRIX } from "./testing/qa-device-matrix";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const accessibilityDeviceSlugs = [
  "desktop-1440x900",
  "ipad-mini-portrait",
  "ipad-mini-landscape",
  "iphone-15",
] as const;

const accessibilityDevices = QA_DEVICE_MATRIX.filter((device) =>
  accessibilityDeviceSlugs.includes(
    device.slug as (typeof accessibilityDeviceSlugs)[number],
  ),
);

export default defineConfig({
  testDir: "./testing",
  testMatch: "accessibility-qa.spec.ts",
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
        command: "npm run start",
        url: baseUrl,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  projects: accessibilityDevices.map((device) => ({
    name: `accessibility-${device.slug}`,
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
