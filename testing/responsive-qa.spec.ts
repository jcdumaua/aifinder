import { expect, test } from "@playwright/test";

const routes = ["/", "/submit"];
const hydrationWarningPattern =
  /hydration|did not match|server rendered html|text content does not match/i;

test.describe("Responsive QA smoke checks", () => {
  for (const route of routes) {
    test(`${route} has no horizontal document overflow or hydration warnings`, async ({
      page,
    }) => {
      const consoleMessages: string[] = [];

      page.on("console", (message) => {
        const text = message.text();

        if (hydrationWarningPattern.test(text)) {
          consoleMessages.push(text);
        }
      });

      await page.goto(route);
      await page.waitForLoadState("networkidle");

      const metrics = await page.evaluate(() => ({
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth,
      }));

      expect(metrics.documentScrollWidth).toBeLessThanOrEqual(
        metrics.viewportWidth + 1,
      );
      expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(
        metrics.viewportWidth + 1,
      );
      expect(consoleMessages).toEqual([]);
    });
  }
});
