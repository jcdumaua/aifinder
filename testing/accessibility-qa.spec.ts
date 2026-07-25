import AxeBuilder from "@axe-core/playwright";
import { expect, type Locator, type Page, test } from "@playwright/test";
import {
  SYNTHETIC_ROUTES,
  SYNTHETIC_TOOL,
  collectCategoricalPageFailures,
  installLoopbackBrowserGuard,
} from "./browser-qa-fixtures";

async function visitSyntheticRoute(page: Page, route: string) {
  const guard = await installLoopbackBrowserGuard(page);
  const pageFailures = collectCategoricalPageFailures(page);

  await page.goto(route);
  await page.waitForLoadState("networkidle");

  return { guard, pageFailures };
}

async function expectNoAxeViolations(page: Page, contextLabel: string) {
  const results = await new AxeBuilder({ page })
    .withTags([
      "wcag2a",
      "wcag2aa",
      "wcag21a",
      "wcag21aa",
      "wcag22a",
      "wcag22aa",
    ])
    .analyze();
  if (results.violations.length !== 0) {
    const ruleIds = results.violations
      .map((violation) => violation.id.replace(/[^a-z0-9-]/gi, "-"))
      .sort()
      .join("_");
    throw new Error(
      `AXE_RULE_IDS_${contextLabel.replace(/[^a-z0-9]/gi, "-")}_${ruleIds}`,
    );
  }
}

async function expectLabeledInteractiveControls(
  locator: Locator,
  contextLabel: string,
) {
  const missingLabels = await locator.evaluate((root) =>
    Array.from(
      root.querySelectorAll<HTMLElement>(
        "button, a[href], input, select, textarea",
      ),
    )
      .filter((element) => {
        if (
          element.matches("[aria-hidden='true'], input[type='hidden']") ||
          element.closest("[aria-hidden='true']")
        ) {
          return false;
        }
        const ariaLabel = element.getAttribute("aria-label")?.trim();
        const ariaLabelledBy = element.getAttribute("aria-labelledby")?.trim();
        const title = element.getAttribute("title")?.trim();
        const text = element.textContent?.trim();
        const placeholder =
          element instanceof HTMLInputElement
            ? element.placeholder.trim()
            : "";
        const id = element.id;
        const nativeLabels =
          (element instanceof HTMLInputElement ||
            element instanceof HTMLSelectElement ||
            element instanceof HTMLTextAreaElement) &&
          element.labels &&
          element.labels.length > 0;
        const explicitLabel =
          id && root.querySelector(`label[for="${CSS.escape(id)}"]`);
        const wrappingLabel = element.closest("label");
        return (
          !ariaLabel &&
          !ariaLabelledBy &&
          !title &&
          !text &&
          !placeholder &&
          !nativeLabels &&
          !explicitLabel &&
          !wrappingLabel
        );
      })
      .map((element) => {
        const inputType =
          element instanceof HTMLInputElement ? element.type.toUpperCase() : "NA";
        const hasPlaceholder =
          element instanceof HTMLInputElement && Boolean(element.placeholder);
        const hiddenByLayout =
          element.getClientRects().length === 0 ||
          window.getComputedStyle(element).visibility === "hidden";
        return `${element.tagName}_TYPE_${inputType}_PLACEHOLDER_${
          hasPlaceholder ? "YES" : "NO"
        }_LAYOUT_HIDDEN_${hiddenByLayout ? "YES" : "NO"}`;
      }),
  );

  if (missingLabels.length !== 0) {
    throw new Error(
      `UNLABELED_CONTROLS_${contextLabel.replace(/[^a-z0-9]/gi, "-")}_${missingLabels.join("_")}`,
    );
  }
}

function expectSafePage(
  pageFailures: string[],
  externalAttempts: number,
  externalCategories: string[],
  contextLabel: string,
) {
  if (pageFailures.length !== 0) {
    throw new Error(
      `PAGE_FAILURE_CODES_${contextLabel}_${[...new Set(pageFailures)].sort().join("_")}`,
    );
  }
  if (externalAttempts !== 0) {
    throw new Error(
      `EXTERNAL_BROWSER_ATTEMPTS_${contextLabel}_${externalCategories.join("_")}`,
    );
  }
}

function focusableControls(container: Locator) {
  return container.locator(
    [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled]):not([type='hidden'])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(","),
  );
}

async function expectFocusWraps(page: Page, container: Locator) {
  const controls = focusableControls(container);
  const count = await controls.count();
  expect(count, "DIALOG_FOCUSABLE_COUNT").toBeGreaterThan(1);

  const first = controls.first();
  const last = controls.last();
  await last.focus();
  await page.keyboard.press("Tab");
  await expect(first, "FOCUS_WRAP_FORWARD").toBeFocused();

  await first.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(last, "FOCUS_WRAP_REVERSE").toBeFocused();
}

async function openSearchDialog(page: Page) {
  const searchInput = page.getByLabel("Search AI tools");
  const opener = page.getByRole("button", { name: "Search", exact: true });
  await searchInput.fill(SYNTHETIC_TOOL.name);
  await opener.click();

  const dialog = page.getByRole("dialog", { name: "AI search results" });
  await expect(dialog, "SEARCH_DIALOG_VISIBLE").toBeVisible();
  return { dialog, opener };
}

async function openToolDetailsDialog(page: Page, searchDialog: Locator) {
  const opener = searchDialog
    .getByRole("button", { name: `Open ${SYNTHETIC_TOOL.name} details` })
    .first();
  await opener.click();

  const dialog = page
    .getByRole("dialog")
    .filter({
      has: page.getByRole("button", {
        name: `Close ${SYNTHETIC_TOOL.name} details`,
      }),
    });
  await expect(dialog, "DETAILS_DIALOG_VISIBLE").toBeVisible();
  return { dialog, opener };
}

test.describe("Phase 30GD synthetic accessibility assurance", () => {
  for (const route of SYNTHETIC_ROUTES) {
    test(`${route} passes Axe, labeling, and hydration checks`, async ({
      page,
    }) => {
      const { guard, pageFailures } = await visitSyntheticRoute(page, route);

      await expectNoAxeViolations(page, route);
      await expectLabeledInteractiveControls(page.locator("body"), route);
      expectSafePage(
        pageFailures,
        guard.externalAttempts(),
        guard.externalCategories(),
        "ROUTE",
      );
    });
  }

  test("not-found route exposes its title, main landmark, and return navigation", async ({
    page,
  }) => {
    const { guard, pageFailures } = await visitSyntheticRoute(
      page,
      "/this-route-does-not-exist",
    );

    await expect(
      page.getByRole("heading", { name: "Page not found", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("link", { name: "Return home" })).toHaveAttribute(
      "href",
      "/",
    );
    expectSafePage(
      pageFailures,
      guard.externalAttempts(),
      guard.externalCategories(),
      "NOT_FOUND",
    );
  });

  test("@phase30gd-red skip link is first focus and moves focus to the shared target", async ({
    page,
  }) => {
    const { guard, pageFailures } = await visitSyntheticRoute(page, "/");
    const skipLink = page.getByRole("link", { name: "Skip to main content" });

    await page.keyboard.press("Tab");
    await expect(skipLink, "SKIP_LINK_FIRST_FOCUS").toBeFocused();
    await expect(skipLink, "SKIP_LINK_VISIBLE_FOCUS").toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("#aifinder-main-content")).toBeFocused();

    expectSafePage(
      pageFailures,
      guard.externalAttempts(),
      guard.externalCategories(),
      "SKIP_LINK",
    );
  });

  test("@phase30gd-red search dialog owns focus and restores its opener", async ({
    page,
  }) => {
    const { guard, pageFailures } = await visitSyntheticRoute(page, "/");
    const { dialog, opener } = await openSearchDialog(page);
    const closeButton = dialog.getByRole("button", {
      name: "Close search results",
    });

    await expect(closeButton, "SEARCH_INITIAL_FOCUS").toBeFocused();
    await expectFocusWraps(page, dialog);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener, "SEARCH_OPENER_RESTORED").toBeFocused();

    expectSafePage(
      pageFailures,
      guard.externalAttempts(),
      guard.externalCategories(),
      "SEARCH_DIALOG",
    );
  });

  test("@phase30gd-red nested tool details owns focus without closing search", async ({
    page,
  }) => {
    const { guard, pageFailures } = await visitSyntheticRoute(page, "/");
    const { dialog: searchDialog, opener: searchOpener } =
      await openSearchDialog(page);
    const { dialog: detailsDialog, opener: detailsOpener } =
      await openToolDetailsDialog(page, searchDialog);
    const detailsClose = detailsDialog.getByRole("button", {
      name: `Close ${SYNTHETIC_TOOL.name} details`,
    });

    await expect(detailsClose, "DETAILS_INITIAL_FOCUS").toBeFocused();
    await expectFocusWraps(page, detailsDialog);
    await page.keyboard.press("Escape");
    await expect(detailsDialog).toBeHidden();
    await expect(searchDialog).toBeVisible();
    await expect(detailsOpener, "DETAILS_OPENER_RESTORED").toBeFocused();

    await page.keyboard.press("Escape");
    await expect(searchDialog).toBeHidden();
    await expect(searchOpener, "SEARCH_OPENER_RESTORED_NESTED").toBeFocused();

    expectSafePage(
      pageFailures,
      guard.externalAttempts(),
      guard.externalCategories(),
      "NESTED_DIALOG",
    );
  });

  test("@phase30gd-red submit popup owns Escape and restores its opener", async ({
    page,
  }) => {
    const guard = await installLoopbackBrowserGuard(page);
    const pageFailures = collectCategoricalPageFailures(page);
    await page.goto("/");
    await page.goto("/submit");
    await page.waitForLoadState("networkidle");

    const dialog = page.getByRole("dialog", {
      name: "Submit your AI tool to AiFinder",
    });
    const closeButton = dialog.getByRole("button", {
      name: "Close submit tool page",
    });
    await expect(closeButton, "SUBMIT_INITIAL_FOCUS").toBeFocused();
    await expectFocusWraps(page, dialog);

    const popupOpener = dialog.getByRole("button", {
      name: "Submit for Review",
    });
    await popupOpener.click();
    const popup = page.getByRole("alert").filter({
      has: page.getByRole("button", { name: "OK", exact: true }),
    });
    await expect(popup).toBeVisible();
    await expect(
      popup.getByRole("button", { name: "OK", exact: true }),
      "SUBMIT_POPUP_INITIAL_FOCUS",
    ).toBeFocused();
    await expectFocusWraps(page, popup);

    await page.keyboard.press("Escape");
    await expect(popup).toBeHidden();
    await expect(dialog).toBeVisible();
    await expect(popupOpener, "SUBMIT_OPENER_RESTORED").toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page).toHaveURL(/\/$/);
    expectSafePage(
      pageFailures,
      guard.externalAttempts(),
      guard.externalCategories(),
      "SUBMIT_POPUP",
    );
  });
});
