import type { Page } from "@playwright/test";
import { QA_DEVICE_MATRIX, type QaDevice } from "./qa-device-matrix";

export const SYNTHETIC_ROUTES = [
  "/",
  "/submit",
  "/compare",
  "/category/chatbots",
  "/tool/synthetic-tool",
  "/this-route-does-not-exist",
] as const;

export const SYNTHETIC_TOOL = {
  slug: "synthetic-tool",
  name: "Synthetic Tool",
  category: "Chatbots",
  description: "Fabricated browser-QA-only tool.",
  website: "https://example.invalid",
  logo: "/icon-192x192.png",
} as const;

export const SYNTHETIC_RESPONSIVE_DEVICES = QA_DEVICE_MATRIX;

function requiredDevice(slug: string): QaDevice {
  const device = QA_DEVICE_MATRIX.find((candidate) => candidate.slug === slug);
  if (!device) throw new Error("SYNTHETIC_DEVICE_ABSENT");
  return device;
}

export const REPRESENTATIVE_MODAL_DEVICES = [
  requiredDevice("desktop-1440x900"),
  requiredDevice("ipad-mini-portrait"),
  requiredDevice("iphone-se"),
  requiredDevice("galaxy-fold-closed"),
] as const;

export const HYDRATION_WARNING_PATTERN =
  /hydration|did not match|server rendered html|text content does not match/i;

export function isLoopbackBrowserUrl(rawUrl: string) {
  if (
    rawUrl.startsWith("data:") ||
    rawUrl.startsWith("blob:") ||
    rawUrl === "about:blank"
  ) {
    return true;
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }

  return (
    (parsed.protocol === "http:" || parsed.protocol === "https:") &&
    (parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1" ||
      parsed.hostname === "[::1]" ||
      parsed.hostname === "localhost")
  );
}

export async function installLoopbackBrowserGuard(page: Page) {
  let externalAttempts = 0;
  const externalCategories = new Set<string>();

  await page.route("**/*", async (route) => {
    const requestUrl = route.request().url();
    if (!isLoopbackBrowserUrl(requestUrl)) {
      externalAttempts += 1;
      let category = "UNPARSEABLE";
      try {
        const parsed = new URL(requestUrl);
        category =
          parsed.hostname === "example.invalid"
            ? "SYNTHETIC_INVALID_HOST"
            : parsed.hostname === "www.google.com"
              ? "REMOTE_FAVICON_HOST"
              : parsed.hostname === "aifinder.to" ||
                  parsed.hostname.endsWith(".aifinder.to")
                ? "PRODUCTION_HOST"
                : parsed.hostname === "supabase.co" ||
                    parsed.hostname.endsWith(".supabase.co")
                  ? "REAL_SUPABASE_HOST"
            : parsed.protocol === "http:" || parsed.protocol === "https:"
                    ? "OTHER_NON_LOOPBACK_HTTP"
                    : "NON_HTTP_PROTOCOL";
      } catch {
        category = "UNPARSEABLE";
      }
      externalCategories.add(category);
      await route.abort("blockedbyclient");
      return;
    }

    await route.continue();
  });

  return {
    externalAttempts: () => externalAttempts,
    externalCategories: () => [...externalCategories].sort(),
  };
}

export function collectCategoricalPageFailures(page: Page) {
  const failures: string[] = [];

  page.on("console", (message) => {
    if (HYDRATION_WARNING_PATTERN.test(message.text())) {
      failures.push("HYDRATION_WARNING");
    }
  });

  page.on("pageerror", () => {
    failures.push("UNEXPECTED_PAGE_ERROR");
  });

  return failures;
}
