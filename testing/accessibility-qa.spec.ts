import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";

const hydrationWarningPattern =
  /hydration|did not match|server rendered html|text content does not match/i;

const axeRoutes = [
  { path: "/", name: "Homepage" },
  { path: "/submit", name: "Submit page" },
  { path: "/admin-login", name: "Admin login page" },
  { path: "/compare", name: "Compare page" },
] as const;

function collectHydrationWarnings(page: Page) {
  const messages: string[] = [];

  page.on("console", (message) => {
    const text = message.text();

    if (hydrationWarningPattern.test(text)) {
      messages.push(text);
    }
  });

  return messages;
}

async function expectNoAxeViolations(page: Page, contextLabel: string) {
  const results = await new AxeBuilder({ page }).analyze();

  expect(
    results.violations,
    `${contextLabel} has Axe accessibility violations`,
  ).toEqual([]);
}

async function expectFocusedElementVisible(page: Page) {
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const activeElement = document.activeElement as HTMLElement | null;
        if (!activeElement || activeElement === document.body) return false;

        const rect = activeElement.getBoundingClientRect();
        const style = window.getComputedStyle(activeElement);
        const hasFocusIndicator =
          style.outlineStyle !== "none" ||
          style.boxShadow !== "none" ||
          style.borderColor !== "rgba(0, 0, 0, 0)";

        return rect.width > 0 && rect.height > 0 && hasFocusIndicator;
      }),
    )
    .toBe(true);
}

async function expectLabeledButtonsAndLinks(locator: Locator) {
  const missingLabels = await locator.evaluate((root) => {
    const elements = Array.from(root.querySelectorAll("button, a"));

    return elements
      .filter((element) => {
        const ariaLabel = element.getAttribute("aria-label")?.trim();
        const text = element.textContent?.trim();
        return !ariaLabel && !text;
      })
      .map((element) => element.outerHTML.slice(0, 160));
  });

  expect(missingLabels).toEqual([]);
}

async function openSearchResultsModal(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Search AI tools").fill("chat");
  await page.getByRole("button", { name: /^Search$/ }).click();

  const dialog = page.getByRole("dialog", { name: "AI search results" });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function openToolDetailsModal(page: Page) {
  const searchDialog = await openSearchResultsModal(page);
  await searchDialog
    .getByRole("button", { name: /Open .* details/ })
    .first()
    .evaluate((button: HTMLButtonElement) => button.click());

  const detailsDialog = page
    .getByRole("dialog")
    .filter({ has: page.locator("button[aria-label^='Close'][aria-label$='details']") })
    .first();

  await expect(detailsDialog).toBeVisible();
  return detailsDialog;
}

test.describe("Accessibility QA framework", () => {
  for (const route of axeRoutes) {
    test(`${route.name} passes Axe and keyboard smoke checks`, async ({
      page,
    }) => {
      const hydrationWarnings = collectHydrationWarnings(page);

      await page.goto(route.path);
      await page.waitForLoadState("networkidle");

      await expectNoAxeViolations(page, route.name);
      await expectLabeledButtonsAndLinks(page.locator("body"));

      await page.keyboard.press("Tab");
      await expectFocusedElementVisible(page);

      expect(hydrationWarnings).toEqual([]);
    });
  }

  test("Search Results Modal passes Axe, labels, focus, and Escape checks", async ({
    page,
  }) => {
    const hydrationWarnings = collectHydrationWarnings(page);
    const dialog = await openSearchResultsModal(page);

    await expect(dialog).toHaveAccessibleName("AI search results");
    await expect(dialog.getByRole("button", { name: "Close search results" })).toBeVisible();
    await expectNoAxeViolations(page, "Search Results Modal");
    await expectLabeledButtonsAndLinks(dialog);

    await page.keyboard.press("Tab");
    await expectFocusedElementVisible(page);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect(hydrationWarnings).toEqual([]);
  });

  test("Tool Details Modal passes Axe, labels, focus, and Escape checks", async ({
    page,
  }) => {
    const hydrationWarnings = collectHydrationWarnings(page);
    const dialog = await openToolDetailsModal(page);

    await expect(dialog.locator("header img")).toBeVisible();
    await expect(dialog.locator("header h2")).toBeVisible();
    await expect(dialog.locator("header p").first()).toBeVisible();
    await expect(dialog.locator("header p").nth(1)).toBeVisible();
    await expect(dialog.locator("button[aria-label^='Close']")).toBeVisible();
    await expectNoAxeViolations(page, "Tool Details Modal");
    await expectLabeledButtonsAndLinks(dialog);

    await page.keyboard.press("Tab");
    await expectFocusedElementVisible(page);

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect(hydrationWarnings).toEqual([]);
  });

  test("Submit Tool Modal passes Axe, labels, focus, and Escape checks", async ({
    page,
  }) => {
    const hydrationWarnings = collectHydrationWarnings(page);

    await page.goto("/");
    await page.goto("/submit");
    await page.waitForLoadState("networkidle");

    const dialog = page.getByRole("dialog", {
      name: "Submit your AI tool to AiFinder",
    });

    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close submit tool page" })).toBeVisible();
    await expectNoAxeViolations(page, "Submit Tool Modal");
    await expectLabeledButtonsAndLinks(dialog);

    await page.keyboard.press("Tab");
    await expectFocusedElementVisible(page);

    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/$/);
    expect(hydrationWarnings).toEqual([]);
  });
});
