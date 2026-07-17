# AiFinder Phase 27DH — Static Security Source Audit Ledger

## Status
`PENDING_GEMINI_REVIEW_AS_BATCH_COMPONENT`

## Baseline
```text
Commit: 65a63864165061c36a54a2815b71909e4b339453
Analysis: BOUNDED_STATIC_SOURCE_CLASSIFICATION
Runtime execution: NO
Environment values read: NO
Database access: NO
```

## Classification Totals
```text
Total reviewed security-surface files: 174
SECURE_BY_DESIGN: 92
REQUIRES_HARDENING: 82
OBSOLETE_AND_REMOVAL_CANDIDATE: 0
```

## Surface Totals
```text
Service-role files: 38
Environment-reference files: 55
Admin-path files: 86
Middleware/proxy files: 1
Logging files: 65
Database-mutation files: 92
Dormant-chain reference files: 4
```

## Hardening Trigger Counts
```text
ADMIN_WITHOUT_STATIC_AUTH_GUARD_SIGNAL = 49
LOGGING_AND_ENV_WITHOUT_REDACTION_SIGNAL = 17
SERVICE_ROLE_WITHOUT_SERVER_ONLY_SIGNAL = 22
```

## Files Requiring Hardening Review
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
app/api/admin/login/route.ts
app/api/admin/logout/route.ts
app/api/admin/session/route.ts
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
components/admin/discovery/discovery-candidate-extraction-live-staging-panel.tsx
components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts
components/admin/discovery/discovery-queue-table.tsx
components/admin/discovery/discovery-runs-table.tsx
components/admin/discovery/discovery-sources-panel.tsx
components/admin/discovery/discovery-tool-detail.tsx
components/admin/discovery/manual-metadata-fetch-results-review.tsx
components/admin/discovery/manual-static-html-evidence-audit-timeline.tsx
components/admin/discovery/manual-static-html-evidence-results-review.tsx
components/admin/homepage-control-create-draft-button.tsx
components/admin/homepage-control-draft-editor.tsx
components/admin/homepage-control-mark-preview-button.tsx
components/admin/homepage-control-preview-checklist.tsx
components/admin/homepage-control-publish-button.tsx
components/admin/homepage-preview-banner.tsx
components/empty-states/no-pending-admin-items-empty-state.tsx
lib/admin-audit-log.ts
lib/admin-auth.ts
lib/admin-rate-limit.ts
lib/discovery/discovery-candidate-decision-admin.ts
lib/discovery/discovery-candidate-staging-admin.ts
lib/discovery/discovery-supabase-admin.ts
lib/homepage-control-admin.ts
lib/supabase-admin.ts
scripts/discovery-admin-audit-sequence-metadata-query-candidate.sql
scripts/smoke-discovery-flow.mjs
scripts/smoke-discovery-manual-metadata-fetch.mjs
scripts/smoke-discovery-metadata-fetch.mjs
scripts/smoke-discovery-preflight-validator.mjs
supabase/migrations/20260612000300_publish_homepage_control_config.sql
supabase/migrations/20260615001110_updated-preview-checklist.sql
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql
testing/admin-rate-limit.test.mjs
testing/admin-shell-supabase-read-hardening.test.mjs
testing/discovery-candidate-decision-admin-ui.test.mjs
testing/discovery-candidate-decision-execution-preflight.mjs
testing/discovery-candidate-decision-read-only-listing-gate.mjs
testing/discovery-candidate-extraction-dry-run-panel.test.mjs
testing/discovery-candidate-extraction-invocation-route.test.mjs
testing/discovery-candidate-extraction-live-staging-panel.test.mjs
testing/discovery-candidate-preview-live-staging-resolver.test.mjs
testing/discovery-candidate-preview-provider.test.mjs
testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs
testing/discovery-candidate-preview-route.test.mjs
testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs
testing/discovery-candidate-queue-fail-closed-ui-wiring-smoke.mjs
testing/discovery-candidate-staging-admin.test.mjs
testing/discovery-candidate-staging-live-smoke.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs
testing/discovery-candidate-staging-queue-read-model.test.mjs
testing/discovery-read-only-runtime-validation-harness.mjs
testing/discovery-read-only-runtime-verification.mjs
testing/discovery-supabase-admin-noop-smoke.test.mjs
testing/phase14k-a-controlled-preview-artifact-preparation.mjs
testing/phase14p-controlled-exact-id-archive-cleanup.mjs
```

These classifications are conservative static signals. They do not assert an exploitable vulnerability and do not authorize code changes.
