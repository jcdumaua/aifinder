import fs from "node:fs";

const EXPECTED_FAILURES = Object.freeze([
  "EXPECTED_FAIL_SKIP_LINK_CONTRACT",
  "EXPECTED_FAIL_DIALOG_FOCUS_STACK",
  "EXPECTED_FAIL_DIALOG_CONSUMER_BINDINGS",
  "EXPECTED_FAIL_BROWSER_QA_RUNTIME_CONTRACT",
  "EXPECTED_FAIL_INSTALLABILITY_PUBLIC_PERIMETER",
]);

function source(repositoryPath) {
  try {
    return fs.readFileSync(repositoryPath, "utf8");
  } catch {
    return "";
  }
}

function exactCount(text, value) {
  return text.split(value).length - 1;
}

function requireContract(condition) {
  if (!condition) throw new Error("CONTRACT_FALSE");
}

function verifySkipLink() {
  const skipLink = source("components/public/skip-link.tsx");
  const layout = source("app/layout.tsx");
  const css = source("app/globals.css");

  requireContract(skipLink.includes('href="#aifinder-main-content"'));
  requireContract(
    exactCount(skipLink, "Skip to main content") === 1 &&
      !/useEffect|useState|localStorage|sessionStorage|fetch\(/.test(skipLink),
  );
  requireContract(
    layout.includes('import { SkipLink } from "@/components/public/skip-link";'),
  );
  requireContract(exactCount(layout, '<SkipLink />') === 1);
  requireContract(exactCount(layout, 'id="aifinder-main-content"') === 1);
  requireContract(layout.includes('tabIndex={-1}'));
  requireContract(!/<main[^>]+id="aifinder-main-content"/.test(layout));
  requireContract(
    css.includes(".aifinder-skip-link") &&
      css.includes(".aifinder-skip-link:focus-visible") &&
      /\.aifinder-skip-link:focus-visible\s*\{[^}]*transform:\s*translateY\(0\);/s.test(
        css,
      ),
  );
}

function verifyDialogFocusStack() {
  const hook = source("lib/use-dialog-focus.ts");

  requireContract(hook.includes("export function useDialogFocus"));
  requireContract(hook.includes("const dialogFocusStack"));
  requireContract(
    hook.includes(
      "return dialogFocusStack[dialogFocusStack.length - 1] === token;",
    ),
  );
  requireContract(hook.includes("previousOpenRef"));
  requireContract(hook.includes("initialFocusRef"));
  requireContract(hook.includes('event.key === "Escape"'));
  requireContract(hook.includes('event.key !== "Tab"'));
  requireContract(
    hook.includes(
      "if (event.shiftKey && activeElement === firstFocusable)",
    ) && hook.includes("lastFocusable.focus();"),
  );
  requireContract(
    hook.includes(
      "if (!event.shiftKey && activeElement === lastFocusable)",
    ) && hook.includes("firstFocusable.focus();"),
  );
  requireContract(
    hook.includes(
      "if (restoreFocus && wasTopmost && opener?.isConnected && isFocusable(opener))",
    ),
  );
  requireContract(hook.includes("isConnected"));
  requireContract(hook.includes("removeEventListener"));
  requireContract(
    !/console\.|localStorage|sessionStorage|location\.|document\.URL|fetch\(/.test(
      hook,
    ),
  );
}

function verifyDialogConsumers() {
  const homepage = source("app/page.tsx");
  const details = source("components/tool-details-modal.tsx");
  const submit = source("app/submit/page.tsx");

  requireContract(
    homepage.includes('import { useDialogFocus } from "@/lib/use-dialog-focus";'),
  );
  requireContract(homepage.includes("searchDialogRef"));
  requireContract(homepage.includes("searchCloseButtonRef"));
  requireContract(homepage.includes("useDialogFocus({"));
  requireContract(
    homepage.includes(
      "normalizePublicToolRow(tool, { logoFallback: getLogoUrl })",
    ),
  );
  requireContract(
    details.includes('import { useDialogFocus } from "@/lib/use-dialog-focus";'),
  );
  requireContract(details.includes("dialogRef"));
  requireContract(details.includes("closeButtonRef"));
  requireContract(details.includes("useDialogFocus({"));
  requireContract(
    submit.includes('import { useDialogFocus } from "@/lib/use-dialog-focus";'),
  );
  requireContract(exactCount(submit, "useDialogFocus({") === 2);
  requireContract(!submit.includes("FOCUSABLE_SELECTOR"));
}

function verifyBrowserRuntime() {
  const fixture = source("testing/browser-qa-fixtures.ts");
  const stub = source("testing/synthetic-supabase-stub.mjs");
  const runner = source("testing/run-synthetic-browser-qa.mjs");
  const config = source("playwright.synthetic.config.ts");
  const accessibility = source("testing/accessibility-qa.spec.ts");
  const responsive = source("testing/responsive-qa.spec.ts");
  const packageJson = source("package.json");
  const manifest = source("testing/static-test-safety-manifest.json");
  const workflow = source(".github/workflows/static-readiness.yml");
  const gate = source(
    "docs/discovery-phase-30gd-30gp-accessibility-responsive-browser-qa-gate.md",
  );

  for (const route of [
    '"/"',
    '"/submit"',
    '"/compare"',
    '"/category/chatbots"',
    '"/tool/synthetic-tool"',
    '"/this-route-does-not-exist"',
  ]) {
    requireContract(fixture.includes(route));
  }
  requireContract(fixture.includes("SYNTHETIC_RESPONSIVE_DEVICES = QA_DEVICE_MATRIX"));
  requireContract(
    fixture.includes("installLoopbackBrowserGuard") &&
      fixture.includes("if (!isLoopbackBrowserUrl(requestUrl))") &&
      fixture.includes('await route.abort("blockedbyclient")'),
  );
  requireContract(stub.includes('server.listen(0, "127.0.0.1"'));
  requireContract(stub.includes('request.method !== "GET"'));
  requireContract(stub.includes("/rest/v1/public_safe_tools"));
  requireContract(stub.includes("/rest/v1/homepage_control_configs"));
  for (const mode of [
    "--preflight",
    "--expect-red",
    "--accessibility",
    "--responsive",
    "--all",
  ]) {
    requireContract(runner.includes(mode));
  }
  requireContract(runner.includes("AUTHORIZED_CANDIDATE_PATHS"));
  requireContract(runner.includes("AUTHORIZED_CANDIDATE_PATHS.length"));
  requireContract(
    runner.includes(
      ".filter((repositoryPath) => !isEnvironmentPath(repositoryPath))",
    ) &&
      runner.includes("copiedEnvironmentPaths.length !== 0") &&
      runner.includes("ENVIRONMENT_PATH_ENTERED_TEMP_COPY"),
  );
  requireContract(runner.includes("NON_LOOPBACK_NETWORK_DENIED"));
  requireContract(runner.includes("127.0.0.1"));
  requireContract(runner.includes("snapshotRepository"));
  requireContract(config.includes('screenshot: "off"'));
  requireContract(config.includes('trace: "off"'));
  requireContract(config.includes('video: "off"'));
  requireContract(accessibility.includes("@phase30gd-red"));
  const submitTestStart = accessibility.indexOf(
    'test("@phase30gd-red submit popup owns Escape and restores its opener"',
  );
  const submitGuardStart = accessibility.indexOf(
    "const guard = await installLoopbackBrowserGuard(page);",
    submitTestStart,
  );
  const submitFailureCollectorStart = accessibility.indexOf(
    "const pageFailures = collectCategoricalPageFailures(page);",
    submitTestStart,
  );
  const submitHistoryNavigation = accessibility.indexOf(
    'await page.goto("/");',
    submitTestStart,
  );
  const submitPageNavigation = accessibility.indexOf(
    'await page.goto("/submit");',
    submitTestStart,
  );
  requireContract(
    submitTestStart !== -1 &&
      submitGuardStart > submitTestStart &&
      submitFailureCollectorStart > submitGuardStart &&
      submitFailureCollectorStart < submitHistoryNavigation &&
      submitHistoryNavigation < submitPageNavigation,
  );
  requireContract(responsive.includes("SYNTHETIC_RESPONSIVE_DEVICES"));
  requireContract(
    packageJson.includes('"test:accessibility-responsive-static"') &&
      packageJson.includes('"qa:synthetic-browser"') &&
      packageJson.includes('"qa:synthetic-browser:accessibility"') &&
      packageJson.includes('"qa:synthetic-browser:responsive"'),
  );
  requireContract(
    manifest.includes("testing/accessibility-responsive-static-assertions.mjs") &&
      manifest.includes("testing/run-synthetic-browser-qa.mjs"),
  );
  requireContract(
    workflow.includes("npm run test:accessibility-responsive-static"),
  );
  requireContract(
    gate.includes(
      "PASSED_PHASE_30GD_30GP_EXACT_28_PATH_ACCESSIBILITY_RESPONSIVE_SYNTHETIC_BROWSER_ASSURANCE_IMPLEMENTATION_READY_FOR_GEMINI_FINAL_REVIEW",
    ),
  );
}

function verifyInstallabilityPerimeter() {
  const perimeter = source(
    "testing/production-perimeter-static-assertions.mjs",
  );
  requireContract(
    perimeter.includes("INSTALLABILITY_PUBLIC_PERIMETER_ASSERTIONS"),
  );
  requireContract(
    perimeter.includes("MANIFEST.PUBLIC_PATHS_ONLY") &&
      perimeter.includes("/^\\/(?:[A-Za-z0-9._~-]+\\/?)*$/"),
  );
  requireContract(
    perimeter.includes("MANIFEST.NO_EXTERNAL_OR_PRIVATE_PATHS") &&
      perimeter.includes('publicPath.startsWith("//")') &&
      perimeter.includes('publicPath.includes("..")') &&
      perimeter.includes('/^\\/(?:api|admin)(?:\\/|$)/.test(publicPath)'),
  );
  requireContract(
    perimeter.includes("MANIFEST.SAME_ORIGIN_INSTALLABILITY") &&
      perimeter.includes("new URL(publicPath, CANONICAL_ORIGIN)") &&
      perimeter.includes(
        'equal(resolved.origin, CANONICAL_ORIGIN, "manifest same-origin path")',
      ),
  );
}

const checks = [
  verifySkipLink,
  verifyDialogFocusStack,
  verifyDialogConsumers,
  verifyBrowserRuntime,
  verifyInstallabilityPerimeter,
];

const failed = [];
for (let index = 0; index < checks.length; index += 1) {
  try {
    checks[index]();
  } catch {
    failed.push(EXPECTED_FAILURES[index]);
  }
}

if (failed.length > 0) {
  for (const category of failed) {
    console.log(category);
  }
  console.log(
    `FAIL_ACCESSIBILITY_RESPONSIVE_STATIC groups=5 pass=${5 - failed.length} fail=${failed.length} internal_failures=0`,
  );
  process.exitCode = 1;
} else {
  console.log(
    "PASS_ACCESSIBILITY_RESPONSIVE_STATIC groups=5 pass=5 fail=0 internal_failures=0",
  );
}
