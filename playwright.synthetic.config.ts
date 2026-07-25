import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL;
const chromiumExecutable = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;

if (!baseURL || !/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(baseURL)) {
  throw new Error("SYNTHETIC_LOOPBACK_BASE_URL_REQUIRED");
}
if (!chromiumExecutable || !chromiumExecutable.startsWith("/")) {
  throw new Error("SYNTHETIC_CHROMIUM_EXECUTABLE_REQUIRED");
}

export default defineConfig({
  testDir: "./testing",
  testMatch: ["accessibility-qa.spec.ts", "responsive-qa.spec.ts"],
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  reporter: [["json"]],
  use: {
    baseURL,
    browserName: "chromium",
    headless: true,
    ignoreHTTPSErrors: false,
    launchOptions: {
      executablePath: chromiumExecutable,
      args: [
        "--disable-background-networking",
        "--proxy-server=http://127.0.0.1:9",
        "--proxy-bypass-list=127.0.0.1;localhost;[::1]",
      ],
    },
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  outputDir: "test-results",
});
