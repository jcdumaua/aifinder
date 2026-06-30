# Discovery Phase 18A — Admin Shell Remaining Browser Supabase Read Audit Design

## Status

Phase 18A is a docs-only audit design phase.

Current pushed baseline:

```text
d1c25b3 Close admin shell Supabase read hardening gate
```

Phase 18A follows the completed Phase 17 milestone.

Phase 17 closed the tested `/admin/tools` browser read path by moving the browser from direct Supabase REST access to the project-owned `/api/admin/tools` route.

Phase 18A does not implement code.

Phase 18A does not modify tests, API routes, backend helpers, UI components, migrations, package files, or source files.

Phase 18A does not run browser QA.

Phase 18A does not run live database queries.

Phase 18A does not run database mutations.

## Discovery Engine Progress Snapshot

Current Discovery Engine progress as of Phase 18A:

```text
Phase 6 series: manual crawler trigger and dry executor foundations completed.
Phase 7 series: metadata fetch adapter, executor, and read-only run review UI foundations completed.
Phase 8 series: candidate extraction readiness, staging contract, and admin interface design foundations completed.
Phase 9 series: candidate staging schema and RLS migration planning/review/apply gates completed through the approved migration sequence.
Phase 10 series: candidate extraction staging pipeline smoke harness and live smoke result documentation completed.
Phase 11 series: manual live staging contract design completed.
Phase 14 series: candidate staging queue API read route completed.
Phase 15 series: candidate staging queue admin UI design and implementation planning completed.
Phase 16 series: candidate staging queue read-only UI, detail drawer, cursor pagination, and post-QA readiness completed.
Phase 17 series: admin-shell browser Supabase tools read hardening completed and closed.
Phase 18A: remaining admin-shell browser Supabase read audit design is in progress.
```

High-level status:

```text
Discovery Engine foundation: strong and steadily maturing.
Candidate Staging Queue: read-only API/UI/detail/cursor milestone closed for created_at and updated_at.
Admin shell tools read hardening: complete for /admin/tools.
Remaining admin shell Supabase read audit: now being designed.
```

## Phase 17 Closure Baseline

The completed Phase 17 milestone closed this exact browser-read path:

```text
No direct browser Supabase /rest/v1/tools read for the admin tools shell
```

Phase 18A uses that closed path as the baseline before designing the broader remaining-admin-shell audit.

## Why Phase 18A Exists

Phase 17 intentionally fixed the specific admin tools browser read path identified during Phase 16D QA.

Phase 17F explicitly limited the milestone decision:

```text
The gate does not claim that every future admin page has been audited.
```

Phase 18A exists to design a safe audit of the remaining admin shell for possible browser-side Supabase reads.

The Phase 18A goal is not to assume that more issues exist.

The Phase 18A goal is to define a safe, repeatable inspection process before any implementation work is approved.

## Audit Objective

Primary objective:

```text
Identify whether any remaining admin browser surfaces still import the browser Supabase client or perform browser-side Supabase reads.
```

Secondary objectives:

```text
Separate valid server-side admin API route Supabase usage from risky browser-side Supabase usage.
Avoid false positives from docs, tests, mocks, static strings, or server-only files.
Preserve the completed /admin/tools hardening milestone.
Preserve Candidate Staging Queue boundaries.
Avoid live database access.
Avoid database mutations.
Avoid source changes during the audit design phase.
```

## Phase 18A Inspection Method

This Phase 18A script performed a read-only local source inspection to inform the audit design.

The scan looked for:

```text
admin browser surfaces under app/admin
admin browser components under components/admin
admin API route surfaces under app/api/admin
browser Supabase imports from lib/supabase
Supabase `.from(` usage
`.from("tools")` usage
/rest/v1 literals
service-role markers
```

The scan did not modify source files.

The scan did not run live database queries.

The scan did not run browser QA.

The scan did not run database mutations.

## Inspection Summary

Source candidates found by Phase 18A inspection:

```text
Total Supabase/admin candidates: 97
Potential remaining admin browser candidates: 2
Admin API/server route candidates: 27
Phase 17 completed baseline paths observed: 3
```

Candidate table:

| Path | Browser surface | Server route | Client marker | Browser Supabase import | Supabase `.from(` | `.from("tools")` | REST literal | Service-role marker | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `app/admin/analytics/page.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/admin/discovered-tools/page.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/admin/discovery/page.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/admin/discovery/tools/[id]/page.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/admin/discovery/tools/page.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/admin/homepage-control/[id]/edit/page.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/admin/homepage-control/[id]/page.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/admin/homepage-control/[id]/preview/page.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/admin/homepage-control/page.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/admin/layout.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/admin/moderation/page.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/admin/notifications/page.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/admin/page.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/admin/security/page.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/admin/settings/page.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/admin/tools/page.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `app/api/admin/audit-logs/route.ts` | no | yes | no | no | yes | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/csrf/route.ts` | no | yes | no | no | no | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/discovery/candidate-extraction/invoke/route.ts` | no | yes | no | no | no | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/discovery/candidate-staging-queue/route.ts` | no | yes | no | no | no | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/discovery/discovered-tools/[id]/approve/route.ts` | no | yes | no | no | no | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts` | no | yes | no | no | yes | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/discovery/discovered-tools/[id]/route.ts` | no | yes | no | no | yes | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/discovery/discovered-tools/bulk-status/route.ts` | no | yes | no | no | yes | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/discovery/discovered-tools/route.ts` | no | yes | no | no | yes | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/discovery/intake/route.ts` | no | yes | no | no | yes | yes | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/discovery/runs/[id]/candidate-preview/route.ts` | no | yes | no | no | no | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/discovery/runs/manual/claim/route.ts` | no | yes | no | no | yes | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/discovery/runs/manual/route.ts` | no | yes | no | no | yes | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/discovery/runs/route.ts` | no | yes | no | no | yes | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/discovery/sources/[id]/route.ts` | no | yes | no | no | yes | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/discovery/sources/route.ts` | no | yes | no | no | yes | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts` | no | yes | no | no | no | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts` | no | yes | no | no | no | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/homepage-control/drafts/[id]/publish/route.ts` | no | yes | no | no | no | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/homepage-control/drafts/[id]/route.ts` | no | yes | no | no | no | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/homepage-control/drafts/route.ts` | no | yes | no | no | no | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/login/route.ts` | no | yes | no | no | no | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/logout/route.ts` | no | yes | no | no | no | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/session/route.ts` | no | yes | no | no | no | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/submissions/route.ts` | no | yes | no | no | yes | yes | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/admin/tools/route.ts` | no | yes | no | no | yes | yes | no | no | Phase 17 completed path; include only as baseline context, not a new remaining-read finding. |
| `app/api/admin/upload-logo/route.ts` | no | yes | no | no | yes | no | no | no | Admin API route/server surface; server-side Supabase usage can be valid if behind admin security. |
| `app/api/submit-tool/route.ts` | no | no | no | no | yes | yes | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `app/api/upload-logo/route.ts` | no | no | no | no | yes | no | no | no | General Supabase-related source candidate. |
| `app/category/[slug]/page.tsx` | no | no | no | no | yes | no | no | no | General Supabase-related source candidate. |
| `app/compare/page.tsx` | no | no | no | no | yes | no | no | no | General Supabase-related source candidate. |
| `app/page.tsx` | no | no | yes | yes | yes | no | no | no | General Supabase-related source candidate. |
| `app/sitemap.ts` | no | no | no | no | yes | no | no | no | General Supabase-related source candidate. |
| `app/tool/[slug]/page.tsx` | no | no | no | no | yes | no | no | no | General Supabase-related source candidate. |
| `components/admin/admin-dashboard-client.tsx` | yes | no | yes | no | yes | no | no | no | Phase 17 completed path; include only as baseline context, not a new remaining-read finding. |
| `components/admin/discovery/candidate-staging-queue-detail-drawer.tsx` | yes | no | yes | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/discovery/candidate-staging-queue-panel.tsx` | yes | no | yes | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx` | yes | no | yes | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/discovery/discovery-candidate-extraction-dry-run-utils.ts` | yes | no | no | no | no | no | no | no | Admin browser surface mentions Supabase; Phase 18B should inspect whether it is direct browser DB access or harmless text. |
| `components/admin/discovery/discovery-candidate-extraction-live-staging-panel.tsx` | yes | no | yes | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts` | yes | no | no | no | no | no | no | no | Admin browser surface mentions Supabase; Phase 18B should inspect whether it is direct browser DB access or harmless text. |
| `components/admin/discovery/discovery-queue-table.tsx` | yes | no | yes | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/discovery/discovery-runs-table.tsx` | yes | no | yes | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/discovery/discovery-sources-panel.tsx` | yes | no | yes | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/discovery/discovery-tool-detail.tsx` | yes | no | yes | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/discovery/manual-metadata-fetch-results-review.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/discovery/manual-static-html-evidence-audit-timeline.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/discovery/manual-static-html-evidence-results-review.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/homepage-control-create-draft-button.tsx` | yes | no | yes | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/homepage-control-draft-editor.tsx` | yes | no | yes | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/homepage-control-mark-preview-button.tsx` | yes | no | yes | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/homepage-control-preview-checklist.tsx` | yes | no | yes | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/homepage-control-publish-button.tsx` | yes | no | yes | no | no | no | no | no | General Supabase-related source candidate. |
| `components/admin/homepage-preview-banner.tsx` | yes | no | no | no | no | no | no | no | General Supabase-related source candidate. |
| `lib/admin-audit-log.ts` | no | no | no | no | yes | no | no | no | General Supabase-related source candidate. |
| `lib/discovery/discovery-candidate-preview-provider.ts` | no | no | no | no | yes | no | no | no | General Supabase-related source candidate. |
| `lib/discovery/discovery-candidate-staging-admin.ts` | no | no | no | no | yes | no | no | no | General Supabase-related source candidate. |
| `lib/discovery/discovery-supabase-admin.ts` | no | no | no | no | no | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `lib/homepage-control-admin.ts` | no | no | no | no | yes | yes | no | no | General Supabase-related source candidate. |
| `lib/homepage-control-public.ts` | no | no | no | no | yes | no | no | no | General Supabase-related source candidate. |
| `lib/supabase-admin.ts` | no | no | no | no | no | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `scripts/smoke-discovery-flow.mjs` | no | no | no | no | yes | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `scripts/smoke-discovery-manual-metadata-fetch.mjs` | no | no | no | no | yes | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `scripts/smoke-discovery-metadata-fetch.mjs` | no | no | no | no | yes | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `scripts/smoke-discovery-preflight-validator.mjs` | no | no | no | no | yes | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `testing/admin-shell-supabase-read-hardening.test.mjs` | no | no | no | yes | yes | yes | yes | yes | Phase 17 completed path; include only as baseline context, not a new remaining-read finding. |
| `testing/discovery-candidate-extraction-dry-run-panel.test.mjs` | no | no | no | no | no | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `testing/discovery-candidate-extraction-invocation-route.test.mjs` | no | no | no | no | no | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `testing/discovery-candidate-extraction-live-staging-panel.test.mjs` | no | no | no | no | no | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs` | no | no | no | no | yes | yes | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `testing/discovery-candidate-preview-live-staging-resolver.test.mjs` | no | no | no | no | no | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `testing/discovery-candidate-preview-provider.test.mjs` | no | no | no | no | no | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `testing/discovery-candidate-preview-route.test.mjs` | no | no | no | no | no | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `testing/discovery-candidate-staging-live-smoke.mjs` | no | no | no | no | yes | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `testing/discovery-candidate-staging-queue-admin-ui.test.mjs` | no | no | yes | no | no | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `testing/discovery-candidate-staging-queue-api-read-route.test.mjs` | no | no | no | no | no | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs` | no | no | yes | no | no | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `testing/discovery-candidate-staging-queue-read-model.test.mjs` | no | no | no | no | no | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `testing/discovery-candidate-staging-rls-smoke.mjs` | no | no | no | no | yes | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `testing/phase14k-a-controlled-preview-artifact-preparation.mjs` | no | no | no | no | yes | no | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |
| `testing/phase14p-controlled-exact-id-archive-cleanup.mjs` | no | no | no | no | yes | yes | no | yes | Service-role marker found; Phase 18B should confirm server-only handling. |

## Interpretation Rules

Phase 18A does not classify every candidate as a defect.

Phase 18B should classify candidates using the following rules.

### Safe / Expected Usage

Likely safe usage includes:

```text
Server-side admin API routes under app/api/admin that use existing admin security.
Server-side Supabase admin usage that never reaches the browser bundle.
Static regression tests that mention forbidden patterns as strings.
Documentation files.
Mocks that intentionally block /rest/v1/* in browser QA.
The completed Phase 17 /api/admin/tools server-side GET implementation.
```

### Risk Candidate Usage

Potential risk candidates include:

```text
Client components using "use client" and importing lib/supabase.
Admin browser components under components/admin that import lib/supabase.
Admin browser pages under app/admin that perform supabase.from(...).
Browser code that can request /rest/v1/* directly.
Browser code that exposes service-role markers or server-only credentials.
Browser code that reads database tables directly instead of using an admin API boundary.
```

### False Positive Examples

Possible false positives include:

```text
Text in documentation.
Test assertions that intentionally include forbidden strings.
Server-only API route code.
Supabase references in comments.
Non-admin public pages outside Phase 18A scope.
```

## Proposed Phase 18B Audit Plan

Recommended next phase:

```text
Phase 18B — Admin Shell Remaining Browser Supabase Read Static Audit
```

Phase 18B should be inspection-only and should not implement fixes.

Proposed Phase 18B scope:

```text
Run a dedicated static audit script.
Classify all admin browser Supabase candidates.
Separate browser-risk candidates from server-safe candidates.
Produce a docs-only audit result.
Recommend targeted hardening phases only if actual remaining browser-side Supabase reads are found.
```

Phase 18B should verify:

```text
No direct browser Supabase import in admin client surfaces unless explicitly justified.
No admin browser .from(...) reads unless explicitly justified.
No direct browser /rest/v1/* requests in admin shell code.
No service-role marker in browser surfaces.
No Candidate Staging Queue regression.
```

Phase 18B should not:

```text
Change source code.
Change tests.
Change API routes.
Run browser QA.
Run live database queries.
Run database mutations.
Commit implementation changes.
```

## Potential Future Fix Pattern

If Phase 18B finds real remaining browser-side Supabase reads, future implementation phases should follow the Phase 17 pattern.

Preferred pattern:

```text
Admin browser UI -> project-owned admin API route -> requireAdminSecurity(request) -> server-side Supabase query -> explicit safe projection -> JSON response
```

Required implementation safeguards:

```text
Use existing admin session/rate-limit helpers.
Use explicit safe projections.
Keep GET handlers read-only.
Avoid service-role exposure.
Add static regression tests.
Run browser/network QA after implementation.
Document QA results.
Close with a readiness gate.
```

## Candidate Staging Queue Boundary

Phase 18A does not change Candidate Staging Queue work.

Candidate Staging Queue milestone status remains:

```text
Read-only API/UI/detail/cursor pagination milestone closed for created_at and updated_at.
confidence_bucket cursor continuation remains deferred unless separately approved.
```

Files intentionally out of scope:

```text
app/api/admin/discovery/candidate-staging-queue/route.ts
components/admin/discovery/candidate-staging-queue-panel.tsx
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
lib/discovery/discovery-candidate-staging-queue-cursor.ts
lib/discovery/discovery-candidate-staging-queue-read-model.ts
testing/discovery-candidate-staging-queue-cursor.test.mjs
testing/discovery-candidate-staging-queue-read-model.test.mjs
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs
```

## Phase 18A Boundary Confirmation

Phase 18A is documentation-only.

Phase 18A does not:

- implement code
- modify tests
- modify API routes
- modify backend helpers
- modify UI components
- modify Supabase migrations
- modify package files
- run browser QA
- run live database queries
- run database mutations
- create candidate rows
- create source rows
- create run rows
- write to `public.tools`
- write to `discovered_tools`
- approve candidates
- publish candidates
- promote candidates
- reject candidates
- archive candidates
- delete candidates
- trigger crawler execution
- trigger candidate extraction execution

## Readiness Decision

Phase 18A readiness decision:

```text
Ready for Phase 18B static audit.
```

Phase 18A should not be treated as proof that remaining browser Supabase reads exist.

Phase 18A only defines the safe audit design and captures the initial inspection signals.

## Recommended Next Phase

Recommended next phase:

```text
Phase 18B — Admin Shell Remaining Browser Supabase Read Static Audit
```

Alternative next phase:

```text
Return to Candidate Staging Queue roadmap if the admin shell audit can wait.
```

## Conclusion

Phase 18A establishes a safe audit design for the remaining admin shell.

The completed Phase 17 milestone remains closed.

The next safe step is a docs-only/static-audit phase that classifies any remaining admin browser Supabase usage before deciding whether more implementation hardening is needed.
