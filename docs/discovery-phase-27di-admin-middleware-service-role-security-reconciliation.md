# AiFinder Phase 27DI — Admin, Middleware, and Service-Role Security Reconciliation

## Status
`PENDING_GEMINI_REVIEW_AS_BATCH_COMPONENT`

## Service-Role Surface Paths
```text
app/api/submit-tool/route.ts
lib/discovery/discovery-supabase-admin.ts
lib/supabase-admin.ts
scripts/smoke-discovery-flow.mjs
scripts/smoke-discovery-manual-metadata-fetch.mjs
scripts/smoke-discovery-metadata-fetch.mjs
scripts/smoke-discovery-preflight-validator.mjs
supabase/migrations/20260612000200_harden_discovered_tools_access.sql
supabase/migrations/20260612000300_publish_homepage_control_config.sql
supabase/migrations/20260615001110_updated-preview-checklist.sql
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql
testing/admin-shell-supabase-read-hardening.test.mjs
testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs
testing/discovery-candidate-decision-admin-ui.test.mjs
testing/discovery-candidate-decision-read-only-listing-gate.mjs
testing/discovery-candidate-extraction-dry-run-panel.test.mjs
testing/discovery-candidate-extraction-invocation-route.test.mjs
testing/discovery-candidate-extraction-live-staging-panel.test.mjs
testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs
testing/discovery-candidate-preview-live-staging-resolver.test.mjs
testing/discovery-candidate-preview-provider.test.mjs
testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs
testing/discovery-candidate-preview-route.test.mjs
testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs
testing/discovery-candidate-queue-fail-closed-ui-wiring-smoke.mjs
testing/discovery-candidate-staging-live-smoke.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs
testing/discovery-candidate-staging-queue-read-model.test.mjs
testing/discovery-candidate-staging-rls-smoke.mjs
testing/discovery-other-bucket-bounded-read-only-inspection.mjs
testing/discovery-read-only-live-inspection.mjs
testing/phase14k-a-controlled-preview-artifact-preparation.mjs
testing/phase14p-controlled-exact-id-archive-cleanup.mjs
```

## Admin Surface Paths
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
components/admin/admin-dashboard-client.tsx
components/admin/discovery/candidate-staging-queue-decision-dialog.tsx
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
components/admin/discovery/candidate-staging-queue-panel.tsx
components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx
components/admin/discovery/discovery-candidate-extraction-dry-run-utils.ts
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
lib/admin-auth-read-only.ts
lib/admin-auth.ts
lib/admin-rate-limit.ts
lib/discovery/discovery-candidate-decision-admin.ts
lib/discovery/discovery-candidate-staging-admin.ts
lib/discovery/discovery-supabase-admin.ts
lib/homepage-control-admin.ts
lib/supabase-admin.ts
scripts/discovery-admin-audit-sequence-metadata-execution-wrapper-candidate.sh
scripts/discovery-admin-audit-sequence-metadata-query-candidate.sql
testing/admin-rate-limit.test.mjs
testing/admin-shell-supabase-read-hardening.test.mjs
testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs
testing/discovery-candidate-decision-admin-ui.test.mjs
testing/discovery-candidate-staging-admin.test.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
testing/discovery-supabase-admin-noop-smoke.test.mjs
```

## Middleware / Proxy Surface Paths
```text
proxy.ts
```

## Static Invariants Applied
- Service-role usage with a client-component marker is classified `REQUIRES_HARDENING`.
- Service-role usage without a server-boundary signal is classified `REQUIRES_HARDENING`.
- Admin-oriented files without a static authorization-guard signal are classified `REQUIRES_HARDENING`.
- Presence of an authorization term is not proof of correct authorization; source-level follow-up remains required for flagged files.
- No source lines, secret names with values, request bodies, database identifiers, or responses were emitted.

## Current State
```text
SERVICE_ROLE_ISOLATION=STATIC_RECONCILIATION_COMPLETE_PENDING_REVIEW
ADMIN_ROUTE_SAFETY=STATIC_RECONCILIATION_COMPLETE_PENDING_REVIEW
MIDDLEWARE_PROXY_SAFETY=STATIC_RECONCILIATION_COMPLETE_PENDING_REVIEW
CODE_MUTATION=NOT_AUTHORIZED
```
