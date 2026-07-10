# Phase 25IR — Operational Reactivation Readiness Consolidated Batch Gate

## Phase identity

- Phase: `25IR`
- Batch: `B — Operational Reactivation Readiness`
- Phase type: consolidated documentation-led static readiness batch gate
- Approved predecessor phase: `25IQ`
- Approved predecessor commit: `9ac5a7fa052fb9efeaf55a241733043fd8804783`
- Repository branch: `main`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25IR consolidates the complete static readiness assessment required before any controlled runtime validation can be considered.

This is one coordinated Batch B package rather than a chain of repetitive planning micro-phases. It inventories the repository, classifies route and dependency risks, records unresolved blockers, defines rollback and stop conditions, and establishes the explicit authorization boundary for Batch C.

Phase 25IR performs no runtime execution, live route invocation, server startup, live database access, manifest population, mutation, cleanup, publishing, deployment, or public launch.

## Repository-grounded evidence summary

- Tracked files inspected through `git ls-files`: `759`
- Source files included in the bounded static scan: `223`
- Route files identified: `31`
- Read-only route candidates: `8`
- Mutation-capable or generic route files: `23`
- Unresolved route method classifications: `0`
- Authentication-related source files: `34`
- Database-related source files: `84`
- Outbound-network-related source files: `34`
- Logging-related source files: `65`
- Environment-variable identifiers referenced: `17`
- Harness/archive/manifest reference files: `98`
- Package script names identified: `10`

## Route and method inventory

| Route file | Methods | Auth reference | Database reference | Network call | Logging |
|---|---|---:|---:|---:|---:|
| `app/api/admin/audit-logs/route.ts` | GET | yes | yes | no | yes |
| `app/api/admin/csrf/route.ts` | GET | yes | no | no | no |
| `app/api/admin/discovery/candidate-extraction/invoke/route.ts` | POST | yes | no | no | yes |
| `app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts` | POST | yes | no | no | yes |
| `app/api/admin/discovery/candidate-staging-queue/route.ts` | GET | yes | yes | no | yes |
| `app/api/admin/discovery/discovered-tools/[id]/approve/route.ts` | POST | yes | yes | no | yes |
| `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts` | POST | yes | yes | no | yes |
| `app/api/admin/discovery/discovered-tools/[id]/route.ts` | GET, PATCH | yes | yes | no | yes |
| `app/api/admin/discovery/discovered-tools/bulk-status/route.ts` | POST | yes | yes | no | yes |
| `app/api/admin/discovery/discovered-tools/route.ts` | GET | yes | yes | no | yes |
| `app/api/admin/discovery/intake/route.ts` | POST | yes | yes | no | yes |
| `app/api/admin/discovery/runs/[id]/candidate-preview/route.ts` | GET | yes | no | no | yes |
| `app/api/admin/discovery/runs/manual/claim/route.ts` | POST | yes | yes | no | yes |
| `app/api/admin/discovery/runs/manual/route.ts` | POST | yes | yes | no | yes |
| `app/api/admin/discovery/runs/route.ts` | GET | yes | yes | no | yes |
| `app/api/admin/discovery/sources/[id]/route.ts` | PATCH | yes | yes | no | yes |
| `app/api/admin/discovery/sources/route.ts` | GET, POST | yes | yes | no | yes |
| `app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts` | POST | yes | no | no | yes |
| `app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts` | PATCH | yes | no | no | yes |
| `app/api/admin/homepage-control/drafts/[id]/publish/route.ts` | POST | yes | no | no | yes |
| `app/api/admin/homepage-control/drafts/[id]/route.ts` | PATCH | yes | no | no | yes |
| `app/api/admin/homepage-control/drafts/route.ts` | POST | yes | no | no | yes |
| `app/api/admin/login/route.ts` | POST | yes | yes | no | yes |
| `app/api/admin/logout/route.ts` | POST | yes | no | no | no |
| `app/api/admin/session/route.ts` | GET | yes | no | no | no |
| `app/api/admin/submissions/route.ts` | GET, PATCH, POST, PUT | yes | yes | no | yes |
| `app/api/admin/tools/route.ts` | DELETE, GET, POST, PUT | yes | yes | no | yes |
| `app/api/admin/upload-logo/route.ts` | POST | yes | yes | no | yes |
| `app/api/homepage-control/published/route.ts` | GET | no | no | no | no |
| `app/api/submit-tool/route.ts` | POST | no | yes | no | yes |
| `app/api/upload-logo/route.ts` | POST | no | yes | no | yes |

### Read-only route candidates

These are static candidates only. They are not an approved runtime manifest.

- `app/api/admin/audit-logs/route.ts`
- `app/api/admin/csrf/route.ts`
- `app/api/admin/discovery/candidate-staging-queue/route.ts`
- `app/api/admin/discovery/discovered-tools/route.ts`
- `app/api/admin/discovery/runs/[id]/candidate-preview/route.ts`
- `app/api/admin/discovery/runs/route.ts`
- `app/api/admin/session/route.ts`
- `app/api/homepage-control/published/route.ts`

### Mutation-capable or generic route files

These files are excluded from any future default Batch C manifest unless separately reviewed and explicitly approved.

- `app/api/admin/discovery/candidate-extraction/invoke/route.ts`
- `app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts`
- `app/api/admin/discovery/discovered-tools/[id]/approve/route.ts`
- `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts`
- `app/api/admin/discovery/discovered-tools/[id]/route.ts`
- `app/api/admin/discovery/discovered-tools/bulk-status/route.ts`
- `app/api/admin/discovery/intake/route.ts`
- `app/api/admin/discovery/runs/manual/claim/route.ts`
- `app/api/admin/discovery/runs/manual/route.ts`
- `app/api/admin/discovery/sources/[id]/route.ts`
- `app/api/admin/discovery/sources/route.ts`
- `app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts`
- `app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts`
- `app/api/admin/homepage-control/drafts/[id]/publish/route.ts`
- `app/api/admin/homepage-control/drafts/[id]/route.ts`
- `app/api/admin/homepage-control/drafts/route.ts`
- `app/api/admin/login/route.ts`
- `app/api/admin/logout/route.ts`
- `app/api/admin/submissions/route.ts`
- `app/api/admin/tools/route.ts`
- `app/api/admin/upload-logo/route.ts`
- `app/api/submit-tool/route.ts`
- `app/api/upload-logo/route.ts`

### Unresolved route files

- None found by the bounded static scan.

## Authentication boundary inventory

- `app/api/admin/audit-logs/route.ts`
- `app/api/admin/csrf/route.ts`
- `app/api/admin/discovery/candidate-extraction/invoke/route.ts`
- `app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts`
- `app/api/admin/discovery/candidate-staging-queue/route.ts`
- `app/api/admin/discovery/discovered-tools/[id]/approve/route.ts`
- `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts`
- `app/api/admin/discovery/discovered-tools/[id]/route.ts`
- `app/api/admin/discovery/discovered-tools/bulk-status/route.ts`
- `app/api/admin/discovery/discovered-tools/route.ts`
- `app/api/admin/discovery/intake/route.ts`
- `app/api/admin/discovery/runs/[id]/candidate-preview/route.ts`
- `app/api/admin/discovery/runs/manual/claim/route.ts`
- `app/api/admin/discovery/runs/manual/route.ts`
- `app/api/admin/discovery/runs/route.ts`
- `app/api/admin/discovery/sources/[id]/route.ts`
- `app/api/admin/discovery/sources/route.ts`
- `app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts`
- `app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts`
- `app/api/admin/homepage-control/drafts/[id]/publish/route.ts`
- `app/api/admin/homepage-control/drafts/[id]/route.ts`
- `app/api/admin/homepage-control/drafts/route.ts`
- `app/api/admin/login/route.ts`
- `app/api/admin/logout/route.ts`
- `app/api/admin/session/route.ts`
- `app/api/admin/submissions/route.ts`
- `app/api/admin/tools/route.ts`
- `app/api/admin/upload-logo/route.ts`
- `lib/admin-auth-read-only.ts`
- `lib/admin-auth.ts`
- `testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs`
- `testing/discovery-candidate-extraction-invocation-route.test.mjs`
- `testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs`
- `testing/discovery-candidate-preview-route.test.mjs`

Batch C must define the exact authentication precondition for every approved route and fail closed on missing, invalid, expired, or ambiguous session state.

## Database dependency inventory

- `app/api/admin/audit-logs/route.ts`
- `app/api/admin/discovery/candidate-staging-queue/route.ts`
- `app/api/admin/discovery/discovered-tools/[id]/approve/route.ts`
- `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts`
- `app/api/admin/discovery/discovered-tools/[id]/route.ts`
- `app/api/admin/discovery/discovered-tools/bulk-status/route.ts`
- `app/api/admin/discovery/discovered-tools/route.ts`
- `app/api/admin/discovery/intake/route.ts`
- `app/api/admin/discovery/runs/manual/claim/route.ts`
- `app/api/admin/discovery/runs/manual/route.ts`
- `app/api/admin/discovery/runs/route.ts`
- `app/api/admin/discovery/sources/[id]/route.ts`
- `app/api/admin/discovery/sources/route.ts`
- `app/api/admin/login/route.ts`
- `app/api/admin/submissions/route.ts`
- `app/api/admin/tools/route.ts`
- `app/api/admin/upload-logo/route.ts`
- `app/api/submit-tool/route.ts`
- `app/api/upload-logo/route.ts`
- `app/category/[slug]/page.tsx`
- `app/compare/page.tsx`
- `app/page.tsx`
- `app/sitemap.ts`
- `app/submit/page.tsx`
- `app/tool/[slug]/page.tsx`
- `components/admin/admin-dashboard-client.tsx`
- `components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx`
- `components/admin/discovery/discovery-candidate-extraction-dry-run-utils.ts`
- `components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts`
- `components/admin/homepage-control-publish-button.tsx`
- `components/loading/dashboard-stats-skeleton.tsx`
- `components/loading/table-list-skeleton.tsx`
- `components/loading/tool-card-skeleton.tsx`
- `lib/admin-audit-log.ts`
- `lib/admin-auth-read-only.ts`
- `lib/admin-auth.ts`
- `lib/discovery-bounded-html-acquisition.ts`
- `lib/discovery/discovery-candidate-decision-admin.ts`
- `lib/discovery/discovery-candidate-preview-provider.ts`
- `lib/discovery/discovery-candidate-staging-admin.ts`
- `lib/discovery/discovery-candidate-staging-queue-cursor.ts`
- `lib/discovery/discovery-candidate-staging-queue-read-model.ts`
- `lib/discovery/discovery-supabase-admin.ts`
- `lib/homepage-control-admin.ts`
- `lib/homepage-control-public.ts`
- `lib/search-relevance.ts`
- `lib/supabase-admin.ts`
- `lib/supabase.ts`
- `lib/supabase/database.types.ts`
- `proxy.ts`
- `scripts/smoke-discovery-flow.mjs`
- `scripts/smoke-discovery-manual-metadata-fetch.mjs`
- `scripts/smoke-discovery-metadata-fetch.mjs`
- `scripts/smoke-discovery-preflight-validator.mjs`
- `testing/accessibility-qa.spec.ts`
- `testing/admin-shell-supabase-read-hardening.test.mjs`
- `testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs`
- `testing/discovery-bounded-html-acquisition.test.mjs`
- `testing/discovery-candidate-decision-admin-ui.test.mjs`
- `testing/discovery-candidate-decision-api-static-assertions.mjs`
- `testing/discovery-candidate-decision-read-only-listing-gate.mjs`
- `testing/discovery-candidate-extraction-dry-run-panel.test.mjs`
- `testing/discovery-candidate-extraction-invocation-route.test.mjs`
- `testing/discovery-candidate-extraction-live-staging-panel.test.mjs`
- `testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs`
- `testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs`
- `testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs`
- `testing/discovery-candidate-queue-fail-closed-ui-wiring-smoke.mjs`
- `testing/discovery-candidate-staging-admin.test.mjs`
- `testing/discovery-candidate-staging-live-smoke.mjs`
- `testing/discovery-candidate-staging-queue-admin-ui.test.mjs`
- `testing/discovery-candidate-staging-queue-api-read-route.test.mjs`
- `testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs`
- `testing/discovery-candidate-staging-queue-read-model.test.mjs`
- `testing/discovery-candidate-staging-rls-smoke.mjs`
- `testing/discovery-fetch-adapter.test.mjs`
- `testing/discovery-other-bucket-bounded-read-only-inspection.mjs`
- `testing/discovery-read-only-live-inspection.mjs`
- `testing/discovery-read-only-runtime-verification.mjs`
- `testing/discovery-static-html-evidence-executor.test.mjs`
- `testing/discovery-supabase-admin-noop-smoke.test.mjs`
- `testing/phase14k-a-controlled-preview-artifact-preparation.mjs`
- `testing/phase14k-a-controlled-preview-artifact-preparation.test.mjs`
- `testing/phase14p-controlled-exact-id-archive-cleanup.mjs`

Static references do not prove read-only behavior. Before Batch C, every selected route and helper must be traced to exact query operations, and mutation-capable methods must be excluded.

## Outbound network boundary inventory

- `app/admin-login/page.tsx`
- `app/page.tsx`
- `app/submit/page.tsx`
- `components/admin/admin-dashboard-client.tsx`
- `components/admin/discovery/candidate-staging-queue-decision-dialog.tsx`
- `components/admin/discovery/candidate-staging-queue-panel.tsx`
- `components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx`
- `components/admin/discovery/discovery-candidate-extraction-live-staging-panel.tsx`
- `components/admin/discovery/discovery-queue-table.tsx`
- `components/admin/discovery/discovery-runs-table.tsx`
- `components/admin/discovery/discovery-sources-panel.tsx`
- `components/admin/discovery/discovery-tool-detail.tsx`
- `components/admin/homepage-control-create-draft-button.tsx`
- `components/admin/homepage-control-draft-editor.tsx`
- `components/admin/homepage-control-mark-preview-button.tsx`
- `components/admin/homepage-control-preview-checklist.tsx`
- `components/admin/homepage-control-publish-button.tsx`
- `lib/discovery-bounded-html-acquisition.ts`
- `lib/discovery-fetch-adapter.ts`
- `scripts/smoke-discovery-flow.mjs`
- `scripts/smoke-discovery-manual-metadata-fetch.mjs`
- `scripts/smoke-discovery-metadata-fetch.mjs`
- `scripts/smoke-discovery-preflight-validator.mjs`
- `testing/admin-rate-limit.test.mjs`
- `testing/admin-shell-supabase-read-hardening.test.mjs`
- `testing/discovery-bounded-html-acquisition.test.mjs`
- `testing/discovery-candidate-decision-admin-ui.test.mjs`
- `testing/discovery-candidate-decision-read-only-listing-gate.mjs`
- `testing/discovery-candidate-extraction-invocation-route.test.mjs`
- `testing/discovery-candidate-preview-route.test.mjs`
- `testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs`
- `testing/discovery-candidate-staging-queue-api-read-route.test.mjs`
- `testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs`
- `testing/discovery-fetch-adapter.test.mjs`

Batch C must use an explicit allowlist or an explicit no-outbound-network rule. Unexpected outbound traffic must stop the batch.

## Logging and secret-safety inventory

- `app/api/admin/audit-logs/route.ts`
- `app/api/admin/discovery/candidate-extraction/invoke/route.ts`
- `app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts`
- `app/api/admin/discovery/candidate-staging-queue/route.ts`
- `app/api/admin/discovery/discovered-tools/[id]/approve/route.ts`
- `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts`
- `app/api/admin/discovery/discovered-tools/[id]/route.ts`
- `app/api/admin/discovery/discovered-tools/bulk-status/route.ts`
- `app/api/admin/discovery/discovered-tools/route.ts`
- `app/api/admin/discovery/intake/route.ts`
- `app/api/admin/discovery/runs/[id]/candidate-preview/route.ts`
- `app/api/admin/discovery/runs/manual/claim/route.ts`
- `app/api/admin/discovery/runs/manual/route.ts`
- `app/api/admin/discovery/runs/route.ts`
- `app/api/admin/discovery/sources/[id]/route.ts`
- `app/api/admin/discovery/sources/route.ts`
- `app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts`
- `app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts`
- `app/api/admin/homepage-control/drafts/[id]/publish/route.ts`
- `app/api/admin/homepage-control/drafts/[id]/route.ts`
- `app/api/admin/homepage-control/drafts/route.ts`
- `app/api/admin/login/route.ts`
- `app/api/admin/submissions/route.ts`
- `app/api/admin/tools/route.ts`
- `app/api/admin/upload-logo/route.ts`
- `app/api/submit-tool/route.ts`
- `app/api/upload-logo/route.ts`
- `app/category/[slug]/page.tsx`
- `app/compare/page.tsx`
- `app/page.tsx`
- `app/sitemap.ts`
- `app/tool/[slug]/page.tsx`
- `components/public/tool-card.tsx`
- `lib/admin-audit-log.ts`
- `lib/admin-auth.ts`
- `lib/homepage-control-admin.ts`
- `scripts/smoke-discovery-flow.mjs`
- `scripts/smoke-discovery-manual-metadata-fetch.mjs`
- `scripts/smoke-discovery-metadata-fetch.mjs`
- `scripts/smoke-discovery-preflight-validator.mjs`
- `testing/admin-shell-supabase-read-hardening.test.mjs`
- `testing/discovery-bounded-html-acquisition.test.mjs`
- `testing/discovery-candidate-decision-admin-ui.test.mjs`
- `testing/discovery-candidate-decision-api-static-assertions.mjs`
- `testing/discovery-candidate-decision-execution-preflight.mjs`
- `testing/discovery-candidate-decision-read-only-listing-gate.mjs`
- `testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs`
- `testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs`
- `testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs`
- `testing/discovery-candidate-queue-fail-closed-presentation-smoke.mjs`
- `testing/discovery-candidate-queue-fail-closed-ui-wiring-smoke.mjs`
- `testing/discovery-candidate-staging-live-smoke.mjs`
- `testing/discovery-candidate-staging-queue-admin-ui.test.mjs`
- `testing/discovery-candidate-staging-queue-api-read-route.test.mjs`
- `testing/discovery-candidate-staging-queue-cursor.test.mjs`
- `testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs`
- `testing/discovery-candidate-staging-queue-read-model.test.mjs`
- `testing/discovery-candidate-staging-rls-smoke.mjs`
- `testing/discovery-other-bucket-bounded-read-only-inspection.mjs`
- `testing/discovery-read-only-live-inspection.mjs`
- `testing/discovery-read-only-runtime-validation-harness.mjs`
- `testing/discovery-read-only-runtime-verification.mjs`
- `testing/discovery-static-html-evidence-executor.test.mjs`
- `testing/phase14k-a-controlled-preview-artifact-preparation.mjs`
- `testing/phase14p-controlled-exact-id-archive-cleanup.mjs`

No secret values were requested or printed by this scan. Batch C must confirm that logs cannot expose authorization headers, cookies, tokens, database credentials, connection strings, environment-variable values, row contents containing sensitive data, or approval phrases.

## Environment-variable identifiers

Only identifier names are recorded; values were neither read nor printed.

- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`
- `AIFINDER_ADMIN_COOKIE`
- `AIFINDER_BASE_URL`
- `AIFINDER_PHASE_14P_CLEANUP_APPROVAL`
- `AIFINDER_RUN_CANDIDATE_DECISION_EXECUTION_PREFLIGHT`
- `CANDIDATE_STAGING_QUEUE_CURSOR_SECRET`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PROJECT_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NODE_ENV`
- `PLAYWRIGHT_BASE_URL`
- `PLAYWRIGHT_SKIP_WEB_SERVER`
- `SUPABASE_ADMIN_KEY`
- `SUPABASE_SERVICE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`

Any future presence check must report only present/missing state and must never print values.

## Runtime harness, manifest, and archive references

- `docs/archive-index/discovery-read-only-runtime-validation-harness-static-evidence-archive-index.md`
- `docs/discovery-phase-25ea-candidate-preview-route-read-only-auth-dependency-runtime-validation-planning-gate.md`
- `docs/discovery-phase-25eb-candidate-preview-route-read-only-auth-dependency-runtime-validation-harness-design-gate.md`
- `docs/discovery-phase-25ey-discovery-admin-route-read-only-dependency-inventory-classification-result-review-follow-up-planning-gate.md`
- `docs/discovery-phase-25ez-static-classification-follow-up-scope-narrowing-gate.md`
- `docs/discovery-phase-25fa-read-only-runtime-validation-preconditions-planning-gate.md`
- `docs/discovery-phase-25fb-read-only-runtime-validation-harness-design-gate.md`
- `docs/discovery-phase-25fc-read-only-runtime-validation-harness-implementation-planning-gate.md`
- `docs/discovery-phase-25fe-discovery-admin-route-read-only-dependency-inventory-detailed-output-preservation-decision-gate.md`
- `docs/discovery-phase-25ff-read-only-runtime-validation-harness-manifest-population-planning-gate.md`
- `docs/discovery-phase-25fg-read-only-runtime-validation-harness-manifest-population-gate.md`
- `docs/discovery-phase-25fh-read-only-runtime-validation-harness-manifest-entry-selection-planning-gate.md`
- `docs/discovery-phase-25fi-read-only-runtime-validation-harness-manifest-entry-selection-gate.md`
- `docs/discovery-phase-25fj-read-only-runtime-validation-harness-zero-entry-selection-result-review-gate.md`
- `docs/discovery-phase-25fk-read-only-runtime-validation-harness-static-evidence-table-planning-gate.md`
- `docs/discovery-phase-25fl-read-only-runtime-validation-harness-static-evidence-table-construction-gate.md`
- `docs/discovery-phase-25fm-read-only-runtime-validation-harness-static-evidence-table-review-gate.md`
- `docs/discovery-phase-25fn-read-only-runtime-validation-harness-static-evidence-source-coverage-review-planning-gate.md`
- `docs/discovery-phase-25fo-read-only-runtime-validation-harness-static-evidence-source-coverage-review-gate.md`
- `docs/discovery-phase-25fp-read-only-runtime-validation-harness-static-evidence-source-expansion-planning-gate.md`
- `docs/discovery-phase-25fq-read-only-runtime-validation-harness-static-evidence-source-expansion-decision-gate.md`
- `docs/discovery-phase-25fr-read-only-runtime-validation-harness-static-evidence-rebuild-planning-gate.md`
- `docs/discovery-phase-25fs-read-only-runtime-validation-harness-static-evidence-rebuild-gate.md`
- `docs/discovery-phase-25ft-read-only-runtime-validation-harness-static-evidence-rebuild-review-gate.md`
- `docs/discovery-phase-25fu-read-only-runtime-validation-harness-static-evidence-blocked-row-taxonomy-planning-gate.md`
- `docs/discovery-phase-25fv-read-only-runtime-validation-harness-static-evidence-blocked-row-taxonomy-classification-gate.md`
- `docs/discovery-phase-25fw-read-only-runtime-validation-harness-static-evidence-blocked-row-taxonomy-classification-review-gate.md`
- `docs/discovery-phase-25fx-read-only-runtime-validation-harness-static-evidence-blocked-row-disposition-planning-gate.md`
- `docs/discovery-phase-25fy-read-only-runtime-validation-harness-static-evidence-blocked-row-disposition-classification-gate.md`
- `docs/discovery-phase-25fz-read-only-runtime-validation-harness-static-evidence-blocked-row-disposition-classification-review-gate.md`
- `docs/discovery-phase-25ga-read-only-runtime-validation-harness-static-evidence-archive-candidate-cleanup-planning-gate.md`
- `docs/discovery-phase-25gb-read-only-runtime-validation-harness-static-evidence-archive-candidate-cleanup-eligibility-classification-gate.md`
- `docs/discovery-phase-25gc-read-only-runtime-validation-harness-static-evidence-archive-candidate-cleanup-eligibility-review-gate.md`
- `docs/discovery-phase-25gd-read-only-runtime-validation-harness-static-evidence-archive-index-planning-gate.md`
- `docs/discovery-phase-25ge-read-only-runtime-validation-harness-static-evidence-archive-index-planning-review-gate.md`
- `docs/discovery-phase-25gf-read-only-runtime-validation-harness-static-evidence-archive-index-creation-planning-gate.md`
- `docs/discovery-phase-25gg-read-only-runtime-validation-harness-static-evidence-archive-index-creation-planning-review-gate.md`
- `docs/discovery-phase-25gh-read-only-runtime-validation-harness-static-evidence-archive-index-creation-approval-gate.md`
- `docs/discovery-phase-25gi-read-only-runtime-validation-harness-static-evidence-archive-index-creation-artifact-planning-gate.md`
- `docs/discovery-phase-25gj-read-only-runtime-validation-harness-static-evidence-archive-index-creation-artifact-planning-review-gate.md`
- `docs/discovery-phase-25gk-read-only-runtime-validation-harness-static-evidence-archive-index-creation-artifact-approval-gate.md`
- `docs/discovery-phase-25gl-read-only-runtime-validation-harness-static-evidence-archive-index-creation-artifact-construction-planning-gate.md`
- `docs/discovery-phase-25gm-read-only-runtime-validation-harness-static-evidence-archive-index-creation-artifact-construction-planning-review-gate.md`
- `docs/discovery-phase-25gn-read-only-runtime-validation-harness-static-evidence-archive-index-creation-artifact-construction-approval-gate.md`
- `docs/discovery-phase-25gp-read-only-runtime-validation-harness-static-evidence-archive-index-creation-artifact-construction-review-gate.md`
- `docs/discovery-phase-25gq-read-only-runtime-validation-harness-static-evidence-archive-index-refinement-planning-gate.md`
- `docs/discovery-phase-25gr-read-only-runtime-validation-harness-static-evidence-archive-index-refinement-planning-review-gate.md`
- `docs/discovery-phase-25gs-read-only-runtime-validation-harness-static-evidence-archive-index-refinement-approval-gate.md`
- `docs/discovery-phase-25gu-read-only-runtime-validation-harness-static-evidence-archive-index-refinement-review-gate.md`
- `docs/discovery-phase-25gv-read-only-runtime-validation-harness-static-evidence-archive-index-post-refinement-disposition-planning-gate.md`
- `docs/discovery-phase-25gw-read-only-runtime-validation-harness-static-evidence-archive-index-post-refinement-disposition-planning-review-gate.md`
- `docs/discovery-phase-25gx-read-only-runtime-validation-harness-static-evidence-archive-index-post-refinement-disposition-closure-approval-gate.md`
- `docs/discovery-phase-25gy-read-only-runtime-validation-harness-static-evidence-archive-index-post-refinement-disposition-closure-gate.md`
- `docs/discovery-phase-25gz-read-only-runtime-validation-harness-static-evidence-archive-index-post-refinement-disposition-closure-review-gate.md`
- `docs/discovery-phase-25ha-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-follow-up-planning-gate.md`
- `docs/discovery-phase-25hb-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-follow-up-review-gate.md`
- `docs/discovery-phase-25hc-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-follow-up-closure-confirmation-gate.md`
- `docs/discovery-phase-25hd-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-transition-planning-gate.md`
- `docs/discovery-phase-25he-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-transition-review-gate.md`
- `docs/discovery-phase-25hf-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-transition-closure-confirmation-gate.md`
- `docs/discovery-phase-25hg-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-disposition-planning-gate.md`
- `docs/discovery-phase-25hh-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-disposition-review-gate.md`
- `docs/discovery-phase-25hi-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-disposition-closure-confirmation-gate.md`
- `docs/discovery-phase-25hj-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-final-disposition-planning-gate.md`
- `docs/discovery-phase-25hk-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-final-disposition-review-gate.md`
- `docs/discovery-phase-25hl-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-final-disposition-closure-confirmation-gate.md`
- `docs/discovery-phase-25hm-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-ledger-consolidation-planning-gate.md`
- `docs/discovery-phase-25hn-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-ledger-consolidation-review-gate.md`
- `docs/discovery-phase-25ho-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-ledger-consolidation-closure-confirmation-gate.md`
- `docs/discovery-phase-25hp-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-ledger-finalization-planning-gate.md`
- `docs/discovery-phase-25hq-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-ledger-finalization-review-gate.md`
- `docs/discovery-phase-25hr-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-ledger-finalization-closure-confirmation-gate.md`
- `docs/discovery-phase-25hs-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-final-ledger-reference-disposition-planning-gate.md`
- `docs/discovery-phase-25ht-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-final-ledger-reference-disposition-review-gate.md`
- `docs/discovery-phase-25hu-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-final-ledger-reference-disposition-closure-confirmation-gate.md`
- `docs/discovery-phase-25hv-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-planning-gate.md`
- `docs/discovery-phase-25hw-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-review-gate.md`
- `docs/discovery-phase-25hx-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-review-follow-up-planning-gate.md`
- `docs/discovery-phase-25hy-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-successor-review-gate.md`
- `docs/discovery-phase-25hz-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-successor-review-follow-up-planning-gate.md`
- `docs/discovery-phase-25ia-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-continuity-review-gate.md`
- `docs/discovery-phase-25ib-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-continuity-review-follow-up-planning-gate.md`
- `docs/discovery-phase-25ic-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-continuity-successor-review-gate.md`
- `docs/discovery-phase-25id-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-continuity-successor-review-follow-up-planning-gate.md`
- `docs/discovery-phase-25ie-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-continuity-preservation-review-gate.md`
- `docs/discovery-phase-25if-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-continuity-preservation-review-follow-up-planning-gate.md`
- `docs/discovery-phase-25ig-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-continuity-preservation-successor-review-gate.md`
- `docs/discovery-phase-25ih-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-continuity-preservation-successor-review-follow-up-planning-gate.md`
- `docs/discovery-phase-25ii-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-continuity-preservation-confirmation-review-gate.md`
- `docs/discovery-phase-25ij-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-continuity-preservation-confirmation-review-follow-up-planning-gate.md`
- `docs/discovery-phase-25ik-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-continuity-preservation-confirmation-successor-review-gate.md`
- `docs/discovery-phase-25il-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-continuity-preservation-confirmation-successor-review-follow-up-planning-gate.md`
- `docs/discovery-phase-25im-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-continuity-preservation-confirmation-successor-review-continuation-gate.md`
- `docs/discovery-phase-25in-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-continuity-preservation-confirmation-successor-review-continuation-follow-up-planning-gate.md`
- `docs/discovery-phase-25io-read-only-runtime-validation-harness-static-evidence-archive-index-post-closure-governance-historical-reference-baseline-continuity-preservation-continuation-confirmation-review-gate.md`
- `docs/discovery-phase-25ip-post-closure-governance-batch-transition-operational-reactivation-readiness-planning-gate.md`
- `docs/discovery-phase-25iq-governance-chain-batch-closure-review-gate.md`
- `testing/discovery-read-only-runtime-validation-harness.mjs`

The Phase 25FD harness remains governed as:

`unedited_empty_manifest_inert`

Phase 25IR does not edit, import, execute, configure, populate, connect, or activate it.

## Package and configuration inventory

### Package script names

- `build`
- `check`
- `dev`
- `lint`
- `qa:accessibility`
- `qa:responsive`
- `smoke:discovery`
- `smoke:discovery-candidate-staging:live`
- `smoke:discovery-candidate-staging:rls`
- `start`

### Relevant configuration files

- `eslint.config.mjs`
- `next.config.ts`
- `package.json`
- `proxy.ts`
- `tsconfig.json`

Script names and configuration paths are inventory evidence only. Phase 25IR does not execute runtime, deployment, database, migration, or publishing scripts.

## Consolidated blocker register

| Blocker ID | State | Requirement |
|---|---|---|
| `B2-ROUTE-METHOD` | `OPEN` | 23 route file(s) expose mutation-capable or generic handlers; Batch C must exclude them unless separately reviewed. |
| `B2-DB-READONLY-PROOF` | `OPEN` | 84 source file(s) reference database clients or query primitives; read-only behavior must be proven for the exact Batch C manifest. |
| `B2-ENV-PRESENCE` | `OPEN` | 17 environment-variable identifier(s) are referenced; presence checks must remain value-hidden. |
| `B2-LOG-REDACTION` | `OPEN` | 65 source file(s) contain logging calls; sensitive-value redaction must be confirmed before runtime validation. |
| `B2-NETWORK-ALLOWLIST` | `OPEN` | 34 source file(s) contain outbound-request primitives; Batch C requires an explicit network boundary. |

All blockers remain open until resolved by evidence reviewed within Batch B or by an explicitly approved Batch C preflight. No blocker may be waived implicitly.

## Proposed minimal manifest rules

Phase 25IR does not create or populate a runtime manifest. A future Batch C manifest must:

1. use an exact immutable baseline commit;
2. contain only explicitly approved route identifiers;
3. default to GET/HEAD/OPTIONS-only candidates;
4. exclude all mutation-capable or generic handlers unless separately authorized;
5. include authentication preconditions;
6. include database read-only proof for every selected dependency;
7. include a network boundary;
8. include log-redaction requirements;
9. include timeout, maximum-item, and maximum-output limits;
10. include a deterministic stop-on-first-failure rule;
11. contain no secret or environment-variable values;
12. require explicit human and Gemini authorization.

Candidate count from this static inventory: `8`.

Candidate state:

`CANDIDATE_ONLY_NOT_APPROVED_NOT_POPULATED`

## Rollback and stop conditions

Batch C must stop immediately if any of the following occurs:

- repository baseline mismatch;
- dirty or unexpected working tree;
- manifest mismatch or unapproved route;
- authentication ambiguity or failure;
- mutation-capable method or helper exposure;
- attempted database write;
- unexpected row change, audit change, or timestamp change;
- unexpected outbound network request;
- secret-like output or environment-value output;
- server startup outside the approved command boundary;
- timeout, excessive output, or non-deterministic retry;
- package, lockfile, schema, migration, generated-type, source, API, or UI change;
- deployment or publishing side effect;
- inability to prove read-only completion.

Rollback for this static Batch B phase is simply removal of the uncommitted Phase 25IR artifact. No runtime or database rollback is needed because no operational action occurred.

## Batch B readiness decision

The consolidated static inventory is complete enough for senior review, but operational reactivation is not authorized.

Readiness state:

`BATCH_B_STATIC_READINESS_COMPLETE_PENDING_GEMINI_REVIEW`

Runtime authorization state:

`BATCH_C_NOT_AUTHORIZED`

Operational reactivation state:

`BLOCKED`

## Authorized actions

Phase 25IR authorizes only:

- creation of this single consolidated readiness artifact;
- bounded read-only source and metadata inspection;
- non-mutating project checks;
- Gemini review packaging;
- after explicit Gemini approval, a separate commit-and-push gate for this artifact.

## Prohibited actions

Phase 25IR prohibits:

- runtime harness execution;
- runtime manifest creation or population;
- route invocation or server startup;
- live database access or mutation;
- cleanup, archival execution, publishing, candidate decisions, or deployment;
- source, API, UI, schema, migration, generated-type, package, or lockfile changes;
- environment-variable or credential value output;
- automatic Batch C authorization;
- operational reactivation;
- public launch.

## Gemini senior-review questions

Gemini should approve Phase 25IR only if all answers are affirmative:

1. Is Phase 25IR anchored to exact Phase 25IQ commit `9ac5a7fa052fb9efeaf55a241733043fd8804783`?
2. Is exactly one consolidated documentation artifact introduced?
3. Was the inventory produced through bounded static repository inspection only?
4. Are route methods, authentication references, database references, network primitives, logging calls, environment identifiers, harness references, package scripts, and configuration paths represented without secret values?
5. Are mutation-capable and unresolved routes excluded from default Batch C eligibility?
6. Does the proposed manifest remain candidate-only, unapproved, and unpopulated?
7. Are blockers explicit and fail-closed?
8. Are rollback and stop conditions sufficient for a future controlled read-only validation?
9. Does the Phase 25FD harness remain `unedited_empty_manifest_inert`?
10. Are runtime execution, live database access, cleanup, publishing, deployment, Batch C, Batch D, operational reactivation, and public launch still unauthorized?
11. Are environment-variable and credential values neither requested nor printed?
12. Does operational reactivation remain `BLOCKED`?

## Conditional successor

Only after Gemini approval and a separate Phase 25IR commit-and-push gate may the project consider a Batch C authorization package.

No Batch C execution may occur without a separately reviewed exact manifest, explicit human approval, Gemini approval, and fail-closed execution script.
