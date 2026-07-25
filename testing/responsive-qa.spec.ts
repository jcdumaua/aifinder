import { expect, type Browser, type BrowserContext, type Page, test } from "@playwright/test";
import {
  REPRESENTATIVE_MODAL_DEVICES,
  SYNTHETIC_RESPONSIVE_DEVICES,
  SYNTHETIC_ROUTES,
  SYNTHETIC_TOOL,
  collectCategoricalPageFailures,
  installLoopbackBrowserGuard,
} from "./browser-qa-fixtures";
import type { QaDevice } from "./qa-device-matrix";

const baseURL = process.env.PLAYWRIGHT_BASE_URL;

if (!baseURL) {
  throw new Error("SYNTHETIC_LOOPBACK_BASE_URL_REQUIRED");
}

async function createDevicePage(
  browser: Browser,
  device: QaDevice,
) {
  const context = await browser.newContext({
    baseURL,
    viewport: { width: device.width, height: device.height },
    hasTouch: device.hasTouch,
    isMobile: device.isMobile,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const guard = await installLoopbackBrowserGuard(page);
  const pageFailures = collectCategoricalPageFailures(page);
  return { context, page, guard, pageFailures };
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    viewportWidth: window.innerWidth,
  }));

  expect(metrics.documentScrollWidth).toBeLessThanOrEqual(
    metrics.viewportWidth + 1,
  );
  expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}

async function expectPanelInsideVisualViewport(panel: ReturnType<Page["locator"]>) {
  const metrics = await panel.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const viewport = window.visualViewport;
    return {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: viewport?.width ?? window.innerWidth,
      height: viewport?.height ?? window.innerHeight,
    };
  });

  expect(metrics.left).toBeGreaterThanOrEqual(-1);
  expect(metrics.top).toBeGreaterThanOrEqual(-1);
  expect(metrics.right).toBeLessThanOrEqual(metrics.width + 1);
  expect(metrics.bottom).toBeLessThanOrEqual(metrics.height + 1);
}

async function closeContext(context: BrowserContext) {
  await context.close();
}

test.describe("Phase 30GD synthetic responsive assurance", () => {
  for (const device of SYNTHETIC_RESPONSIVE_DEVICES) {
    for (const route of SYNTHETIC_ROUTES) {
      test(`${device.slug} ${route} stays within its viewport`, async ({
        browser,
      }) => {
        const { context, page, guard, pageFailures } = await createDevicePage(
          browser,
          device,
        );
        try {
          await page.goto(route);
          await page.waitForLoadState("networkidle");
          await expectNoHorizontalOverflow(page);
          expect(pageFailures).toEqual([]);
          expect(guard.externalAttempts()).toBe(0);
        } finally {
          await closeContext(context);
        }
      });
    }
  }

  for (const device of REPRESENTATIVE_MODAL_DEVICES) {
    test(`${device.slug} keeps search and tool-details panels inside the visual viewport`, async ({
      browser,
    }) => {
      const { context, page, guard, pageFailures } = await createDevicePage(
        browser,
        device,
      );
      try {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
        await page.getByLabel("Search AI tools").fill(SYNTHETIC_TOOL.name);
        await page
          .getByRole("button", { name: "Search", exact: true })
          .click();

        const searchDialog = page.getByRole("dialog", {
          name: "AI search results",
        });
        await expect(searchDialog).toBeVisible();
        await expectPanelInsideVisualViewport(searchDialog);
        await expectNoHorizontalOverflow(page);

        await searchDialog
          .getByRole("button", {
            name: `Open ${SYNTHETIC_TOOL.name} details`,
          })
          .first()
          .click();
        const detailsDialog = page
          .getByRole("dialog")
          .filter({
            has: page.getByRole("button", {
              name: `Close ${SYNTHETIC_TOOL.name} details`,
            }),
          });
        await expect(detailsDialog).toBeVisible();
        await expectPanelInsideVisualViewport(detailsDialog);
        await expectNoHorizontalOverflow(page);

        expect(pageFailures).toEqual([]);
        expect(guard.externalAttempts()).toBe(0);
      } finally {
        await closeContext(context);
      }
    });
  }
});
