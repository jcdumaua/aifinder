# AiFinder Phase 27DL — Security Hardening Risk Triage Matrix

## Status
`PENDING_GEMINI_REVIEW_AS_BATCH_COMPONENT`

## Baseline
```text
Commit: 12970bf090a32343911ff67f2e86cbb7dab19485
Source: Approved Phase 27DK hardening candidate list
Total candidates: 82
Code changes: PROHIBITED
```

## Triage Totals
```text
CRITICAL_HARDENING=16
STANDARD_HARDENING=37
TESTING_HARDENING=29
```

## Critical Hardening
```text
app/api/admin/login/route.ts|AUTH_SESSION_ROUTE
app/api/admin/logout/route.ts|AUTH_SESSION_ROUTE
app/api/admin/session/route.ts|AUTH_SESSION_ROUTE
lib/admin-auth.ts|CORE_ADMIN_SECURITY_PRIMITIVE
lib/admin-rate-limit.ts|CORE_ADMIN_SECURITY_PRIMITIVE
lib/discovery/discovery-candidate-decision-admin.ts|PRIVILEGED_DISCOVERY_MUTATION_SERVICE
lib/discovery/discovery-candidate-staging-admin.ts|PRIVILEGED_DISCOVERY_MUTATION_SERVICE
lib/discovery/discovery-supabase-admin.ts|PRIVILEGED_DISCOVERY_MUTATION_SERVICE
lib/supabase-admin.ts|CORE_ADMIN_SECURITY_PRIMITIVE
scripts/discovery-admin-audit-sequence-metadata-query-candidate.sql|DATABASE_QUERY_SURFACE
supabase/migrations/20260612000300_publish_homepage_control_config.sql|DATABASE_POLICY_OR_MUTATION_DEFINITION
supabase/migrations/20260615001110_updated-preview-checklist.sql|DATABASE_POLICY_OR_MUTATION_DEFINITION
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql|DATABASE_POLICY_OR_MUTATION_DEFINITION
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql|DATABASE_POLICY_OR_MUTATION_DEFINITION
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql|DATABASE_POLICY_OR_MUTATION_DEFINITION
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql|DATABASE_POLICY_OR_MUTATION_DEFINITION
```

## Standard Hardening
```text
app/admin-login/layout.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin-login/page.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/analytics/page.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/discovered-tools/page.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/discovery/page.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/discovery/tools/[id]/page.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/discovery/tools/page.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/homepage-control/[id]/edit/page.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/homepage-control/[id]/page.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/homepage-control/[id]/preview/page.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/homepage-control/page.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/layout.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/moderation/page.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/notifications/page.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/page.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/security/page.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/settings/page.tsx|ADMIN_PAGE_OR_LAYOUT
app/admin/tools/page.tsx|ADMIN_PAGE_OR_LAYOUT
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx|ADMIN_UI_ACTION_SURFACE
components/admin/discovery/discovery-candidate-extraction-live-staging-panel.tsx|ADMIN_UI_ACTION_SURFACE
components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts|ADMIN_UI_ACTION_SURFACE
components/admin/discovery/discovery-queue-table.tsx|ADMIN_UI_ACTION_SURFACE
components/admin/discovery/discovery-runs-table.tsx|ADMIN_UI_ACTION_SURFACE
components/admin/discovery/discovery-sources-panel.tsx|ADMIN_UI_ACTION_SURFACE
components/admin/discovery/discovery-tool-detail.tsx|ADMIN_UI_ACTION_SURFACE
components/admin/discovery/manual-metadata-fetch-results-review.tsx|ADMIN_UI_ACTION_SURFACE
components/admin/discovery/manual-static-html-evidence-audit-timeline.tsx|ADMIN_UI_ACTION_SURFACE
components/admin/discovery/manual-static-html-evidence-results-review.tsx|ADMIN_UI_ACTION_SURFACE
components/admin/homepage-control-create-draft-button.tsx|ADMIN_UI_ACTION_SURFACE
components/admin/homepage-control-draft-editor.tsx|ADMIN_UI_ACTION_SURFACE
components/admin/homepage-control-mark-preview-button.tsx|ADMIN_UI_ACTION_SURFACE
components/admin/homepage-control-preview-checklist.tsx|ADMIN_UI_ACTION_SURFACE
components/admin/homepage-control-publish-button.tsx|ADMIN_UI_ACTION_SURFACE
components/admin/homepage-preview-banner.tsx|ADMIN_UI_ACTION_SURFACE
components/empty-states/no-pending-admin-items-empty-state.tsx|OTHER_SECURITY_SURFACE
lib/admin-audit-log.ts|ADMIN_LIBRARY_SURFACE
lib/homepage-control-admin.ts|ADMIN_LIBRARY_SURFACE
```

## Testing Hardening
```text
scripts/smoke-discovery-flow.mjs|MANUAL_OR_SMOKE_SCRIPT
scripts/smoke-discovery-manual-metadata-fetch.mjs|MANUAL_OR_SMOKE_SCRIPT
scripts/smoke-discovery-metadata-fetch.mjs|MANUAL_OR_SMOKE_SCRIPT
scripts/smoke-discovery-preflight-validator.mjs|MANUAL_OR_SMOKE_SCRIPT
testing/admin-rate-limit.test.mjs|TEST_OR_HARNESS
testing/admin-shell-supabase-read-hardening.test.mjs|TEST_OR_HARNESS
testing/discovery-candidate-decision-admin-ui.test.mjs|TEST_OR_HARNESS
testing/discovery-candidate-decision-execution-preflight.mjs|TEST_OR_HARNESS
testing/discovery-candidate-decision-read-only-listing-gate.mjs|TEST_OR_HARNESS
testing/discovery-candidate-extraction-dry-run-panel.test.mjs|TEST_OR_HARNESS
testing/discovery-candidate-extraction-invocation-route.test.mjs|TEST_OR_HARNESS
testing/discovery-candidate-extraction-live-staging-panel.test.mjs|TEST_OR_HARNESS
testing/discovery-candidate-preview-live-staging-resolver.test.mjs|TEST_OR_HARNESS
testing/discovery-candidate-preview-provider.test.mjs|TEST_OR_HARNESS
testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs|TEST_OR_HARNESS
testing/discovery-candidate-preview-route.test.mjs|TEST_OR_HARNESS
testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs|TEST_OR_HARNESS
testing/discovery-candidate-queue-fail-closed-ui-wiring-smoke.mjs|TEST_OR_HARNESS
testing/discovery-candidate-staging-admin.test.mjs|TEST_OR_HARNESS
testing/discovery-candidate-staging-live-smoke.mjs|TEST_OR_HARNESS
testing/discovery-candidate-staging-queue-admin-ui.test.mjs|TEST_OR_HARNESS
testing/discovery-candidate-staging-queue-api-read-route.test.mjs|TEST_OR_HARNESS
testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs|TEST_OR_HARNESS
testing/discovery-candidate-staging-queue-read-model.test.mjs|TEST_OR_HARNESS
testing/discovery-read-only-runtime-validation-harness.mjs|TEST_OR_HARNESS
testing/discovery-read-only-runtime-verification.mjs|TEST_OR_HARNESS
testing/discovery-supabase-admin-noop-smoke.test.mjs|TEST_OR_HARNESS
testing/phase14k-a-controlled-preview-artifact-preparation.mjs|TEST_OR_HARNESS
testing/phase14p-controlled-exact-id-archive-cleanup.mjs|TEST_OR_HARNESS
```

## Classification Meaning
- `CRITICAL_HARDENING`: server-side authorization, privileged service-role access, database policy/mutation definitions, or admin session boundaries.
- `STANDARD_HARDENING`: admin pages, components, and supporting libraries requiring invariant confirmation.
- `TESTING_HARDENING`: smoke scripts, tests, and source harnesses requiring safety-contract verification.

These tiers prioritize review effort. They do not prove vulnerability and do not authorize modification.
