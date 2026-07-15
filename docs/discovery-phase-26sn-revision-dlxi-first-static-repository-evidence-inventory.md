# Phase 26SN — First Static Repository Evidence Inventory

## Bound baseline

`c454e62f9783e61e30d193ff7f84e6ab6792990a`

## Inspection boundary

Static inspection of committed repository paths and package metadata only.

No source was executed. No server was started. No route was invoked. No database, network service, environment value, credential, secret, or production system was accessed.

## Repository counts

- Tracked files: `1663`
- Route and app-entry candidates: `56`
- Test and QA artifact candidates: `4`
- Configuration artifact candidates: `8`
- Security-related path candidates: `457`
- UX-related path candidates: `94`
- Content/discovery path candidates: `1483`
- Operations/launch path candidates: `115`

## Route and application-entry candidates

```text
app/admin-login/layout.tsx
app/admin-login/page.tsx
app/admin/analytics/page.tsx
app/admin/discovered-tools/page.tsx
app/admin/discovery/page.tsx
app/admin/discovery/tools/[id]/page.tsx
app/admin/discovery/tools/page.tsx
app/admin/homepage-control/[id]/edit/page.tsx
app/admin/homepage-control/[id]/page.tsx
app/admin/homepage-control/[id]/preview/page.tsx
app/admin/homepage-control/page.tsx
app/admin/layout.tsx
app/admin/moderation/page.tsx
app/admin/notifications/page.tsx
app/admin/page.tsx
app/admin/security/page.tsx
app/admin/settings/page.tsx
app/admin/tools/page.tsx
app/api/admin/audit-logs/route.ts
app/api/admin/csrf/route.ts
app/api/admin/discovery/candidate-extraction/invoke/route.ts
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
app/api/admin/discovery/candidate-staging-queue/route.ts
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts
app/api/admin/discovery/discovered-tools/[id]/route.ts
app/api/admin/discovery/discovered-tools/bulk-status/route.ts
app/api/admin/discovery/discovered-tools/route.ts
app/api/admin/discovery/intake/route.ts
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
app/api/admin/discovery/runs/manual/claim/route.ts
app/api/admin/discovery/runs/manual/route.ts
app/api/admin/discovery/runs/route.ts
app/api/admin/discovery/sources/[id]/route.ts
app/api/admin/discovery/sources/route.ts
app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts
app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts
app/api/admin/homepage-control/drafts/[id]/publish/route.ts
app/api/admin/homepage-control/drafts/[id]/route.ts
app/api/admin/homepage-control/drafts/route.ts
app/api/admin/login/route.ts
app/api/admin/logout/route.ts
app/api/admin/session/route.ts
app/api/admin/submissions/route.ts
app/api/admin/tools/route.ts
app/api/admin/upload-logo/route.ts
app/api/homepage-control/published/route.ts
app/api/submit-tool/route.ts
app/api/upload-logo/route.ts
app/category/[slug]/page.tsx
app/compare/page.tsx
app/layout.tsx
app/page.tsx
app/submit/layout.tsx
app/submit/page.tsx
app/tool/[slug]/page.tsx
```

## Test and QA artifact candidates

```text
playwright.accessibility.config.ts
playwright.config.ts
testing/accessibility-qa.spec.ts
testing/responsive-qa.spec.ts
```

## Configuration artifact candidates

```text
components.json
eslint.config.mjs
next.config.ts
package-lock.json
package.json
postcss.config.mjs
public/vercel.svg
tsconfig.json
```

## Package scripts

```text
build: next build
check: npm run lint -- --quiet && npm run build
dev: next dev
lint: eslint
qa:accessibility: playwright test -c playwright.accessibility.config.ts
qa:responsive: playwright test testing/responsive-qa.spec.ts
smoke:discovery: node scripts/smoke-discovery-flow.mjs
smoke:discovery-candidate-staging:live: node --import ./testing/register-typescript-test-loader.mjs testing/discovery-candidate-staging-live-smoke.mjs
smoke:discovery-candidate-staging:rls: node --import ./testing/register-typescript-test-loader.mjs testing/discovery-candidate-staging-rls-smoke.mjs
start: next start
```

## Relevant package dependencies

The complete dependency-name inventory was inspected statically. Versions are package metadata, not runtime evidence.

```text
@axe-core/playwright: ^4.11.3
@base-ui/react: ^1.5.0
@playwright/test: ^1.60.0
@supabase/supabase-js: ^2.105.4
@tailwindcss/postcss: ^4
@types/react: ^19
@types/react-dom: ^19
eslint: ^9
eslint-config-next: 16.2.6
lucide-react: ^1.16.0
next: 16.2.6
react: 19.2.4
react-dom: 19.2.4
tailwind-merge: ^3.6.0
tailwindcss: ^4
typescript: ^5
```

## Interpretation boundary

Path names and package metadata identify evidence candidates only. They do not prove runtime correctness, security effectiveness, launch readiness, or GAP-001 impact.

## Current result

`STATIC_REPOSITORY_EVIDENCE_CANDIDATES_INVENTORIED`
