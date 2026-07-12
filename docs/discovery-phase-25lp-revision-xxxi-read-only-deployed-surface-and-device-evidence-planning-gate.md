# Phase 25LP — Revision XXXI Read-Only Deployed Surface and Device Evidence Planning Gate

## Status

`PLANNING_ONLY — NO LIVE ACCESS — OPERATIONAL_REACTIVATION_BLOCKED`

## Baseline

- Repository: `/Users/jamescarlodumaua/aifinder`
- Branch: `main`
- Approved Phase 25LO commit: `abffca61765de4e3b464f8bbb9386fd2077f3cee`
- Approved Phase 25LO subject: `Document Phase 25LO blocked local build verification result`
- Phase 25LO artifact: `docs/discovery-phase-25lo-revision-xxx-non-mutating-build-and-local-verification-result.md`
- Phase 25LO artifact SHA-256: `534369319623c189c9bb97e081d7115f9d961dcb3cb0cd67f84296bff62eb7c5`
- Phase 25LO artifact byte count: `5116`
- Phase 25LO result: `LOCAL_BUILD_VERIFICATION_BLOCKED`

## Purpose

Define the exact safe procedure for collecting read-only deployed-surface, device, user-flow, and accessibility evidence required for the public launch readiness assessment.

This phase is planning-only.

It performs no HTTP request, browser automation, accessibility scan, route invocation, login, database access, deployment, staging, commit, or push.

## Current Readiness Posture

`NOT_READY_FOR_PUBLIC_LAUNCH — EVIDENCE INCOMPLETE`

The Phase 25LO local build result remains blocked because suspect output was redacted pending review.

The deployed-surface and device evidence track may be planned independently, but no later result may override or bypass the Phase 25LO blocked state.

## Governing Principles

The later evidence collection must:

- remain read-only;
- target only explicitly approved public URLs;
- avoid admin, mutation, submission, approval, rejection, archive, publish, and candidate-decision actions;
- avoid authentication unless a separate gate authorizes it;
- avoid cookies, credentials, tokens, and session output;
- avoid production data extraction;
- preserve exact URL and viewport scope;
- record screenshots and summaries without private data;
- stop immediately on unexpected redirects, authentication prompts, or mutation-capable surfaces;
- keep the automated Discovery Engine blocked.

## Approved Target Surfaces

The later result phase may inspect only the following categories after exact URL approval:

1. Production homepage.
2. Custom-domain homepage.
3. Public category pages.
4. Public tool-detail pages, when present.
5. Public search UI.
6. Public compare UI.
7. Public favorites or bookmarks UI using local browser storage only.
8. Public sitemap.
9. Public robots output.
10. Public error and not-found states.

The following remain prohibited:

- `/admin` pages;
- admin APIs;
- mutation endpoints;
- submission mutation;
- candidate-decision endpoints;
- approval or rejection endpoints;
- archive or publishing endpoints;
- database APIs;
- authenticated account surfaces;
- preview deployments not explicitly approved.

## Network Boundary

The later execution must:

- use only `GET`, `HEAD`, or browser navigation that does not submit data;
- prohibit `POST`, `PUT`, `PATCH`, `DELETE`, and mutation-capable requests;
- prohibit form submission;
- prohibit file upload;
- prohibit login;
- prohibit administrative cookies;
- record requested hostnames;
- fail closed on unexpected third-party navigation;
- not follow outbound tool links beyond checking their rendered presence unless separately approved.

## Approved Device Matrix

The later result must collect evidence for:

- Desktop: `1440 × 900`
- Tablet landscape: `1024 × 768`
- Tablet portrait: `768 × 1024`
- Mobile: `390 × 844`

Each viewport must be tested independently.

No viewport result may be inferred from another.

## Core Public User Flows

### Homepage

Verify:

- page loads;
- primary heading appears;
- search input appears;
- categories appear;
- tool cards render;
- primary navigation remains usable;
- no visible application error appears.

### Category Navigation

Verify:

- category selection is available;
- category page loads;
- category title matches the selected category;
- tool cards render or a valid empty state appears;
- back navigation remains available.

### Search

Verify:

- search field accepts text locally;
- results update or submit through the approved read-only UI;
- empty search behavior is understandable;
- no mutation request occurs;
- no secret or private value appears.

### Tool Links

Verify:

- website, iOS, and Android controls render where applicable;
- disabled or absent links are handled clearly;
- outbound navigation is not executed unless separately approved;
- link targets can be inspected statically in the DOM without opening them.

### Compare

Verify:

- compare controls are visible;
- up to the approved number of tools can be selected;
- comparison UI opens;
- removal and close controls work;
- no server mutation occurs.

### Favorites or Bookmarks

Verify:

- favorite controls are visible;
- local-only state changes work where designed;
- no account or database write occurs;
- page reload behavior is documented.

### Error and Empty States

Verify:

- empty search;
- empty category, where safely reachable;
- invalid public route;
- missing tool route, where safely reachable;
- user-facing recovery navigation.

## Accessibility Evidence

The later result may collect only read-only accessibility evidence.

Required checks:

- keyboard navigation;
- visible focus;
- heading hierarchy;
- labels and accessible names;
- dialog or modal focus behavior;
- escape-key close behavior;
- tab containment where applicable;
- color contrast;
- image alternative text;
- reduced-motion behavior where applicable;
- automated accessibility scan output;
- no critical or serious issue ignored without review.

Automated scan findings must be recorded by severity and page.

No issue may default to pass.

## Screenshot Requirements

The later result should record:

- homepage screenshot for each viewport;
- category page screenshot for each viewport;
- search result screenshot for each viewport;
- compare UI screenshot for each viewport;
- one error or empty-state screenshot;
- accessibility-relevant focus screenshot where useful.

Screenshots must exclude:

- credentials;
- cookies;
- browser account identifiers;
- private tabs;
- personal bookmarks;
- notification content;
- local file paths;
- developer-tool values that may contain secrets.

## HTTP and Browser Evidence

Allowed evidence:

- URL hostname and path;
- HTTP status;
- redirect destination within the approved host;
- content type;
- selected non-secret security headers;
- page title;
- canonical URL;
- viewport;
- visible UI outcome;
- accessibility result counts;
- screenshot filenames and SHA-256 values.

Prohibited output:

- cookie values;
- authorization headers;
- response bodies from APIs;
- environment variables;
- source maps;
- private deployment metadata;
- database identifiers;
- tokens;
- session values.

## Security Header Scope

A later approved result may record only the presence or absence of:

- `strict-transport-security`;
- `content-security-policy`;
- `x-content-type-options`;
- `referrer-policy`;
- `permissions-policy`;
- `x-frame-options`, where used.

Header values should be summarized conservatively and must not include cookies or private metadata.

## Stop Conditions

The later execution must stop when:

- the approved hostname changes unexpectedly;
- login or admin access is required;
- a mutation request is attempted;
- a form submission cannot be safely prevented;
- a cookie or token value appears in output;
- a screenshot captures private content;
- the browser profile is not isolated;
- the page triggers an unsafe download;
- the repository working tree changes unexpectedly;
- the Phase 25LO blocked state is represented as resolved without separate evidence.

## Planned Result Classification

Phase 25LQ must select one:

### `DEPLOYED_SURFACE_AND_DEVICE_EVIDENCE_PASSED`

Allowed only when:

- all approved public pages load;
- core user flows work across all four viewports;
- no critical accessibility issue remains;
- no unexpected mutation or authentication occurs;
- screenshots and result artifacts are safely captured;
- network boundaries are preserved.

### `DEPLOYED_SURFACE_AND_DEVICE_EVIDENCE_FAILED`

Required when:

- a core public page or flow is broken;
- a critical accessibility issue is confirmed;
- required viewport coverage fails;
- approved public URLs do not resolve correctly;
- security-header or canonical behavior creates a material launch issue.

### `DEPLOYED_SURFACE_AND_DEVICE_EVIDENCE_BLOCKED`

Required when:

- URLs are not approved;
- browser isolation cannot be guaranteed;
- mutation-free behavior cannot be established;
- private or secret output risk exists;
- production access cannot be performed safely;
- evidence collection scope is incomplete.

## Planned Phase 25LQ Artifact

Exactly one Markdown result artifact:

`docs/discovery-phase-25lq-revision-xxxii-read-only-deployed-surface-and-device-evidence-result.md`

The result should include:

- baseline identity;
- exact approved URLs;
- host allowlist;
- device matrix;
- page and flow results;
- HTTP status and redirect summary;
- accessibility findings;
- screenshot inventory and hashes;
- network-boundary confirmation;
- result classification;
- unresolved blockers;
- confirmation that no mutation occurred.

## Repository Scope

Exactly one new Markdown artifact is allowed for Phase 25LP:

`docs/discovery-phase-25lp-revision-xxxi-read-only-deployed-surface-and-device-evidence-planning-gate.md`

No existing file may be modified.

## Prohibited Actions in Phase 25LP

- No HTTP request.
- No browser automation.
- No accessibility scan.
- No screenshot capture.
- No server startup.
- No route invocation.
- No login.
- No form submission.
- No outbound tool navigation.
- No production or preview access.
- No Supabase or database access.
- No environment-value printing.
- No deployment, DNS, or domain change.
- No source, API, UI, schema, migration, generated-type, package, or lockfile change.
- No staging, commit, or push.
- No crawler activation.
- No public launch.
- No operational Discovery Engine reactivation.

## Expected Result State

`READ_ONLY_DEPLOYED_SURFACE_AND_DEVICE_EVIDENCE_METHOD_ESTABLISHED`

## Operational Posture

- Discovery Engine progress estimate: `99%`
- Phase 25LO: `COMPLETE — BLOCKED RESULT PRESERVED`
- Public launch readiness: `DEPLOYED SURFACE AND DEVICE EVIDENCE PLANNING`
- Local build verification: `BLOCKED`
- Current posture: `NOT_READY_FOR_PUBLIC_LAUNCH — EVIDENCE INCOMPLETE`
- Automated Discovery Engine: `BLOCKED`
- Operational reactivation: `BLOCKED`
