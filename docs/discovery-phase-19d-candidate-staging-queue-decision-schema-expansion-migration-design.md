# Discovery Phase 19D — Candidate Staging Queue Decision Schema Expansion Migration Design

## Status

Phase 19D is a docs-only schema expansion migration design phase.

Current pushed baseline:

```text
d641ecd Document candidate decision schema readiness inspection
```

Phase 19D follows the Phase 19C readiness decision:

```text
Blocked pending schema planning
```

Phase 19D designs the schema expansion needed before Candidate Staging Queue decision helper implementation can proceed.

Phase 19D does not implement code.

Phase 19D does not modify tests, API routes, backend helpers, UI components, migrations, package files, or source files.

Phase 19D does not create a migration file.

Phase 19D does not apply a migration.

Phase 19D does not run browser QA.

Phase 19D does not run live database queries.

Phase 19D does not run database mutations.

## Discovery Engine Progress Snapshot

Progress after Phase 19D migration design:

```text
Discovery Engine overall: ~88.5%
Phase 19D progress: 100%
Current milestone: Candidate Staging Queue decision schema expansion migration design complete
```

Current major milestone status:

```text
Candidate Staging Queue read-only API/UI/detail/cursor milestone: closed for created_at and updated_at.
Candidate Staging Queue decision workflow design: complete and pushed.
Candidate Staging Queue decision workflow implementation plan: complete and pushed.
Candidate Staging Queue decision schema readiness inspection: complete and pushed.
Candidate Staging Queue decision schema expansion migration design: complete.
```

## Purpose

Phase 19C found that helper implementation should not proceed because local schema files did not confirm all planned statuses and decision metadata fields.

Phase 19D answers:

```text
What schema expansion should be designed before a future migration draft/apply phase?
```

## Phase 19C Blockers Being Addressed

Missing planned candidate_status values from local readiness evidence:

```text
under_review
approved_for_draft
needs_more_evidence
```

Missing planned decision metadata fields from local readiness evidence:

```text
decision_action
decision_reason
decision_notes
decided_at
decided_by
duplicate_of_candidate_id
```

Warnings from Phase 19C:

```text
Planned decision audit event names were not yet present locally.
```

## Local Design Inspection

Phase 19D inspected local files only.

Inspection summary:

```text
Relevant local files found: 87
Files mentioning discovery_candidate_tools: 13
Files mentioning candidate_status: 20
Files mentioning planned decision metadata fields: 58
Files mentioning audit table/event signals: 14
Files mentioning constraint/check signals: 57
```

No live database was queried.

No database mutation was performed.

No migration was drafted.

No migration was applied.

## Candidate Status Expansion Design

Planned first decision workflow statuses:

```text
under_review
approved_for_draft
rejected
archived
duplicate
needs_more_evidence
```

Statuses that Phase 19C did not confirm locally:

```text
under_review
approved_for_draft
needs_more_evidence
```

Status readiness table:

| Candidate status | Found locally | Evidence files |
| --- | --- | --- |
| `staged` | no | None found |
| `under_review` | no | None found |
| `approved_for_draft` | no | None found |
| `rejected` | yes | `app/api/admin/discovery/discovered-tools/[id]/route.ts`<br>`app/api/admin/discovery/discovered-tools/route.ts`<br>`app/api/admin/discovery/runs/[id]/candidate-preview/route.ts`<br>`app/api/admin/discovery/runs/manual/claim/route.ts`<br>`lib/admin-audit-log.ts`<br>+21 more |
| `archived` | yes | `lib/discovery/discovery-candidate-staging-admin.ts`<br>`lib/discovery-candidate-normalizer.ts`<br>`lib/homepage-control-types.ts`<br>`lib/supabase/database.types.ts`<br>`supabase/migrations/20260612000100_create_homepage_control_room.sql`<br>+8 more |
| `duplicate` | yes | `app/api/admin/discovery/candidate-staging-queue/route.ts`<br>`app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts`<br>`app/api/admin/discovery/discovered-tools/[id]/route.ts`<br>`app/api/admin/discovery/discovered-tools/route.ts`<br>`app/api/admin/discovery/intake/route.ts`<br>+32 more |
| `needs_more_evidence` | no | None found |

Migration design requirement:

```text
The future migration must make under_review, approved_for_draft, and needs_more_evidence valid candidate_status values before helper implementation can use them.
```

Important implementation note:

```text
Exact database representation must be verified before drafting/applying SQL.
```

If `candidate_status` is a CHECK constraint:

```text
The future migration must replace the existing candidate_status CHECK constraint with an expanded allow-list.
```

If `candidate_status` is a Postgres enum:

```text
The future migration must use ALTER TYPE ... ADD VALUE IF NOT EXISTS for missing statuses.
```

If `candidate_status` is plain text without constraint:

```text
The future migration should add or update validation constraints only after confirming existing data compatibility.
```

## Decision Metadata Column Design

Planned decision metadata fields:

```text
decision_action
decision_reason
decision_notes
decided_at
decided_by
duplicate_of_candidate_id
duplicate_of_tool_id
audit_correlation_id
updated_at
```

Fields that Phase 19C did not confirm locally:

```text
decision_action
decision_reason
decision_notes
decided_at
decided_by
duplicate_of_candidate_id
```

Decision metadata readiness table:

| Field | Found locally | Evidence files |
| --- | --- | --- |
| `candidate_status` | yes | `lib/discovery/discovery-candidate-extraction-invocation.ts`<br>`lib/discovery/discovery-candidate-staging-admin.ts`<br>`lib/discovery/discovery-candidate-staging-queue-read-model.ts`<br>`lib/discovery-candidate-normalizer.ts`<br>`lib/supabase/database.types.ts`<br>+15 more |
| `decision_action` | no | None found |
| `decision_reason` | no | None found |
| `decision_notes` | no | None found |
| `decided_at` | no | None found |
| `decided_by` | no | None found |
| `duplicate_of_candidate_id` | no | None found |
| `duplicate_of_tool_id` | yes | `lib/supabase/database.types.ts`<br>`supabase/migrations/20260602000200_create_discovered_tools_queue.sql`<br>`supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` |
| `audit_correlation_id` | yes | `app/api/admin/discovery/candidate-extraction/invoke/route.ts`<br>`lib/discovery/discovery-candidate-extraction-invocation.ts`<br>`lib/discovery/discovery-candidate-extraction-mapper.ts`<br>`lib/discovery/discovery-candidate-extraction-staging-pipeline.ts`<br>`lib/discovery/discovery-candidate-preview-live-staging-resolver.ts`<br>+25 more |
| `updated_at` | yes | `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts`<br>`app/api/admin/discovery/discovered-tools/[id]/route.ts`<br>`app/api/admin/discovery/discovered-tools/bulk-status/route.ts`<br>`app/api/admin/discovery/discovered-tools/route.ts`<br>`app/api/admin/discovery/runs/manual/claim/route.ts`<br>+35 more |

Recommended future columns on `public.discovery_candidate_tools`:

```text
decision_action text null
decision_reason text null
decision_notes text null
decided_at timestamptz null
decided_by text null
duplicate_of_candidate_id uuid null
duplicate_of_tool_id uuid null
```

Fields already expected or previously present:

```text
audit_correlation_id
updated_at
```

Validation design:

```text
decision_notes should be capped at 1000 characters.
decision_action should use a strict allow-list.
decision_reason should use either a strict global allow-list or action-specific validation in application code.
duplicate_of_candidate_id should only be populated for duplicate decisions when known.
duplicate_of_tool_id should only be populated for duplicate decisions when known.
```

## Audit Event Design

Planned decision audit event names:

```text
discovery_candidate_decision_approve_for_draft
discovery_candidate_decision_reject
discovery_candidate_decision_archive
discovery_candidate_decision_duplicate
discovery_candidate_decision_needs_more_evidence
```

Audit evidence table:

| Audit signal | Found locally | Evidence files |
| --- | --- | --- |
| `discovery_audit_events` | yes | `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts`<br>`app/api/admin/discovery/discovered-tools/[id]/route.ts`<br>`app/api/admin/discovery/discovered-tools/bulk-status/route.ts`<br>`app/api/admin/discovery/intake/route.ts`<br>`app/api/admin/discovery/runs/manual/claim/route.ts`<br>+9 more |
| `event_type` | yes | `app/api/admin/discovery/runs/manual/claim/route.ts`<br>`app/api/admin/discovery/runs/manual/route.ts`<br>`app/api/admin/discovery/runs/route.ts`<br>`app/api/admin/discovery/sources/[id]/route.ts`<br>`app/api/admin/discovery/sources/route.ts`<br>+4 more |
| `discovery_candidate_decision_approve_for_draft` | no | None found |
| `discovery_candidate_decision_reject` | no | None found |
| `discovery_candidate_decision_archive` | no | None found |
| `discovery_candidate_decision_duplicate` | no | None found |
| `discovery_candidate_decision_needs_more_evidence` | no | None found |

Audit schema design decision:

```text
If discovery_audit_events.event_type is text, no database schema expansion is required for planned event names.
If discovery_audit_events.event_type is a strict enum or constrained text, a future migration must expand the allowed event_type values.
```

Governance rule remains:

```text
Audit event write failure should block candidate status update.
```

Reason:

```text
An unaudited candidate decision mutation is worse than a failed mutation.
```

## Draft SQL Shape

The following SQL is design-only and must not be applied in Phase 19D.

```sql
-- Draft design only. Do not apply in Phase 19D.
-- Exact constraint names must be verified before a future migration draft/apply phase.

-- 1. Expand candidate_status allowed values.
-- If candidate_status is implemented as a CHECK constraint:
--   - drop the existing candidate_status CHECK constraint by exact name
--   - recreate it with the full allowed status set:
--       staged
--       under_review
--       approved_for_draft
--       rejected
--       archived
--       duplicate
--       needs_more_evidence
--
-- If candidate_status is implemented as a Postgres enum:
--   - ALTER TYPE ... ADD VALUE IF NOT EXISTS for:
--       under_review
--       approved_for_draft
--       needs_more_evidence
--
-- 2. Add decision metadata columns to public.discovery_candidate_tools.
ALTER TABLE public.discovery_candidate_tools
  ADD COLUMN IF NOT EXISTS decision_action text,
  ADD COLUMN IF NOT EXISTS decision_reason text,
  ADD COLUMN IF NOT EXISTS decision_notes text,
  ADD COLUMN IF NOT EXISTS decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS decided_by text,
  ADD COLUMN IF NOT EXISTS duplicate_of_candidate_id uuid,
  ADD COLUMN IF NOT EXISTS duplicate_of_tool_id uuid;

-- 3. Add bounded decision metadata validation.
-- Suggested constraints:
--   decision_notes length <= 1000
--   decision_action allow-list:
--     approve_for_draft, reject, archive, duplicate, needs_more_evidence
--   decision_reason allow-list can be action-specific only if implemented safely.
--
-- 4. Add indexes only if query plans need them.
-- Likely candidates:
--   candidate_status
--   decided_at
--   duplicate_of_candidate_id
--   duplicate_of_tool_id
--
-- 5. Audit event names may require schema expansion only if event_type is constrained.
-- If event_type is text, no database migration is required for names.

```

## Data Compatibility Checks for Future Migration

A future migration draft should include preflight or safe assertions for:

```text
Existing candidate_status values are within the current known allow-list.
No existing row would violate the expanded candidate_status constraint.
decision_notes length constraint is safe for existing rows because the new column starts null.
duplicate_of_candidate_id and duplicate_of_tool_id are nullable.
decided_at and decided_by are nullable.
```

## Index Design

Indexes are not required in the first migration unless query patterns need them.

Potential future indexes:

```text
discovery_candidate_tools(candidate_status)
discovery_candidate_tools(decided_at)
discovery_candidate_tools(duplicate_of_candidate_id)
discovery_candidate_tools(duplicate_of_tool_id)
```

Recommendation:

```text
Do not add indexes in the first schema expansion unless query needs are proven.
```

## Rollback / Down Migration Design

Rollback design depends on the actual status representation.

If CHECK constraint:

```text
A down migration can restore the previous CHECK constraint only if no rows use the new statuses.
```

If enum:

```text
Postgres enum value removal is not straightforward and should be treated as forward-only.
```

Decision metadata columns rollback:

```text
Dropping decision metadata columns would lose audit-linked decision metadata.
Do not design destructive rollback unless this is a local-only draft.
Prefer forward-only correction migrations for production.
```

## Future Migration Draft Requirements

A future migration draft phase must:

```text
Inspect exact current local migration/schema representation.
Use exact constraint names.
Avoid guessing candidate_status constraint names.
Avoid live DB apply.
Avoid supabase db push unless separately approved.
Include idempotent ADD COLUMN IF NOT EXISTS where safe.
Include non-destructive nullable columns first.
Preserve existing candidate rows.
Preserve existing audit rows.
Preserve public.tools boundary.
```

## Future Type Generation Boundary

After a future migration is applied in an approved schema phase, generated database types may need updating.

Type generation should be a separate approved step if it changes generated files.

Phase 19D does not generate types.

## Preserved Boundaries

Phase 19D preserves the Phase 19A/19B/19C boundaries:

```text
Approve for draft does not publish.
public.tools write remains forbidden until a separate publish workflow phase is approved.
No future decision implementation may run live database mutations without separate explicit approval.
No UI decision buttons before mutation API safety is designed, implemented, and tested.
Do not implement a mutation that can fail because candidate_status constraints were guessed.
```

Future live mutation approval phrase remains:

```text
Approve Phase 19 live candidate decision mutation smoke
```

Normal phase approval must not imply live mutation approval.

## Candidate Staging Queue Boundary

Phase 19D does not change existing Candidate Staging Queue implementation.

Candidate Staging Queue milestone status remains:

```text
Read-only API/UI/detail/cursor pagination milestone closed for created_at and updated_at.
confidence_bucket cursor continuation remains deferred unless separately approved.
```

## Relevant Local Files

| File | target table | candidate_status | decision field | audit table/event | constraint/check signal |
| --- | --- | --- | --- | --- | --- |
| `app/api/admin/discovery/candidate-extraction/invoke/route.ts` | no | no | yes | no | yes |
| `app/api/admin/discovery/candidate-staging-queue/route.ts` | no | no | no | no | yes |
| `app/api/admin/discovery/discovered-tools/[id]/approve/route.ts` | no | no | no | no | yes |
| `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts` | no | no | yes | yes | yes |
| `app/api/admin/discovery/discovered-tools/[id]/route.ts` | no | no | yes | yes | yes |
| `app/api/admin/discovery/discovered-tools/bulk-status/route.ts` | no | no | yes | yes | yes |
| `app/api/admin/discovery/discovered-tools/route.ts` | no | no | yes | no | no |
| `app/api/admin/discovery/intake/route.ts` | no | no | no | yes | yes |
| `app/api/admin/discovery/runs/[id]/candidate-preview/route.ts` | no | no | no | no | no |
| `app/api/admin/discovery/runs/manual/claim/route.ts` | no | no | yes | yes | yes |
| `app/api/admin/discovery/runs/manual/route.ts` | no | no | yes | yes | yes |
| `app/api/admin/discovery/runs/route.ts` | no | no | yes | yes | no |
| `app/api/admin/discovery/sources/[id]/route.ts` | no | no | yes | yes | yes |
| `app/api/admin/discovery/sources/route.ts` | no | no | yes | yes | yes |
| `lib/admin-audit-log.ts` | no | no | no | no | no |
| `lib/admin-rate-limit.ts` | no | no | no | no | yes |
| `lib/discovered-tools.ts` | no | no | no | no | yes |
| `lib/discovery/discovery-candidate-extraction-invocation.ts` | no | yes | yes | no | no |
| `lib/discovery/discovery-candidate-extraction-mapper.ts` | no | no | yes | no | yes |
| `lib/discovery/discovery-candidate-extraction-staging-pipeline.ts` | no | no | yes | no | no |
| `lib/discovery/discovery-candidate-preview-live-staging-resolver.ts` | no | no | yes | no | no |
| `lib/discovery/discovery-candidate-preview-provider.ts` | no | no | yes | no | no |
| `lib/discovery/discovery-candidate-staging-admin.ts` | yes | yes | yes | no | yes |
| `lib/discovery/discovery-candidate-staging-queue-cursor.ts` | no | no | yes | no | yes |
| `lib/discovery/discovery-candidate-staging-queue-read-model.ts` | yes | yes | yes | no | yes |
| `lib/discovery-bounded-html-acquisition.ts` | no | no | no | no | yes |
| `lib/discovery-candidate-normalizer.ts` | no | yes | yes | no | yes |
| `lib/discovery-fetch-adapter.ts` | no | no | no | no | yes |
| `lib/discovery-manual-crawler.ts` | no | no | no | no | yes |
| `lib/discovery-run-results-review.ts` | no | no | no | no | no |
| `lib/discovery-static-html-evidence-audit-review.ts` | no | no | no | no | no |
| `lib/homepage-control-admin.ts` | no | no | yes | no | yes |
| `lib/homepage-control-defaults.ts` | no | no | no | no | yes |
| `lib/homepage-control-parser.ts` | no | no | yes | no | yes |
| `lib/homepage-control-public.ts` | no | no | yes | no | yes |
| `lib/homepage-control-schema.ts` | no | no | no | no | yes |
| `lib/homepage-control-types.ts` | no | no | yes | no | yes |
| `lib/homepage-control-validation.ts` | no | no | no | no | yes |
| `lib/public-tool-adapter.ts` | no | no | yes | no | no |
| `lib/supabase/database.types.ts` | yes | yes | yes | yes | yes |
| `lib/tool-validation.ts` | no | no | no | no | yes |
| `supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql` | no | no | no | no | no |
| `supabase/migrations/20260602000200_create_discovered_tools_queue.sql` | no | no | yes | no | yes |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | no | no | yes | no | yes |
| `supabase/migrations/20260612000200_harden_discovered_tools_access.sql` | no | no | yes | no | no |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | no | no | yes | no | yes |
| `supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql` | no | no | no | no | yes |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | no | no | yes | no | yes |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | no | no | yes | no | yes |
| `supabase/migrations/20260616002151_finalize_public_safe_tools_schema_patch.sql` | no | no | yes | no | no |
| `supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql` | no | no | yes | no | no |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | no | no | yes | yes | yes |
| `supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql` | no | no | yes | yes | no |
| `supabase/migrations/20260617005500_cleanup_discovery_queue_smoke_test.sql` | no | no | no | yes | no |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | yes | yes | yes | no | yes |
| `supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql` | yes | no | no | yes | yes |
| `supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql` | no | no | yes | no | yes |
| `supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql` | no | no | no | no | yes |
| `testing/accessibility-qa.spec.ts` | no | no | no | no | yes |
| `testing/admin-rate-limit.test.mjs` | no | no | no | no | yes |
| `testing/discovery-candidate-extraction-dry-run-panel.test.mjs` | no | no | yes | no | yes |
| `testing/discovery-candidate-extraction-invocation-route.test.mjs` | no | yes | yes | no | yes |
| `testing/discovery-candidate-extraction-invocation.test.mjs` | no | yes | yes | no | no |
| `testing/discovery-candidate-extraction-live-staging-panel.test.mjs` | no | yes | yes | no | no |
| `testing/discovery-candidate-extraction-mapper.test.mjs` | no | yes | yes | no | yes |
| `testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs` | yes | yes | yes | no | no |
| `testing/discovery-candidate-extraction-staging-pipeline.test.mjs` | no | yes | yes | no | no |
| `testing/discovery-candidate-normalizer.test.mjs` | no | yes | yes | no | yes |
| `testing/discovery-candidate-preview-live-staging-resolver.test.mjs` | no | yes | yes | no | no |
| `testing/discovery-candidate-preview-provider.test.mjs` | no | no | yes | no | no |
| `testing/discovery-candidate-preview-route.test.mjs` | no | no | yes | no | no |
| `testing/discovery-candidate-staging-admin.test.mjs` | yes | yes | yes | no | yes |
| `testing/discovery-candidate-staging-live-smoke.mjs` | yes | yes | yes | no | yes |
| `testing/discovery-candidate-staging-queue-admin-ui.test.mjs` | no | no | no | no | no |
| `testing/discovery-candidate-staging-queue-api-read-route.test.mjs` | no | no | yes | no | yes |
| `testing/discovery-candidate-staging-queue-cursor.test.mjs` | no | no | yes | no | yes |
| `testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs` | no | no | no | no | yes |
| `testing/discovery-candidate-staging-queue-read-model.test.mjs` | yes | yes | yes | no | yes |
| `testing/discovery-candidate-staging-rls-smoke.mjs` | yes | yes | yes | no | no |
| `testing/discovery-fetch-adapter.test.mjs` | no | no | no | no | yes |
| `testing/discovery-run-results-review.test.mjs` | no | no | no | no | no |
| `testing/discovery-static-html-evidence-audit-review.test.mjs` | no | no | no | no | no |
| `testing/phase14k-a-controlled-preview-artifact-preparation.mjs` | yes | no | yes | no | yes |
| `testing/phase14k-a-controlled-preview-artifact-preparation.test.mjs` | yes | no | yes | no | no |
| `testing/phase14p-controlled-exact-id-archive-cleanup.mjs` | yes | yes | yes | no | yes |
| `testing/phase14p-controlled-exact-id-archive-cleanup.test.mjs` | no | yes | yes | no | no |
| `testing/responsive-qa.spec.ts` | no | no | no | no | yes |

## Evidence Snippets

### `app/api/admin/discovery/candidate-extraction/invoke/route.ts`

```text
L8: checkAdminRateLimit,
L32: "audit_correlation_id",
L110: checkRateLimit?: (
L142: const rateLimit = dependencies.checkRateLimit
L143: ? dependencies.checkRateLimit(rateLimitInput)
L144: : checkAdminRateLimit(rateLimitInput);
L200: audit_correlation_id: body.audit_correlation_id,
```

### `app/api/admin/discovery/candidate-staging-queue/route.ts`

```text
L166: const duplicateCheckStatus = getOptionalParam(
L168: "duplicateCheckStatus",
L199: if (duplicateCheckStatus !== undefined) {
L200: input.duplicateCheckStatus = duplicateCheckStatus;
```

### `app/api/admin/discovery/discovered-tools/[id]/approve/route.ts`

```text
L8: checkAdminRateLimit,
L92: const rateLimit = checkAdminRateLimit({
```

### `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts`

```text
L8: checkAdminRateLimit,
L123: console.warn("Unauthorized Discovery Engine duplicate request.", {
L137: const rateLimit = checkAdminRateLimit({
L139: action: ADMIN_RATE_LIMIT_ACTIONS.discoveryToolDuplicate,
L215: { error: error instanceof Error ? error.message : "Invalid duplicate data." },
L227: console.error("Failed to load discovered tool before duplicate mark.", {
L231: return jsonResponse({ error: "Failed to mark duplicate." }, 500);
L238: const { data: duplicateCandidate, error: duplicateError } = await supabaseAdmin
L239: .from("discovery_duplicate_candidates")
L254: if (duplicateError) {
L255: console.error("Failed to create Discovery Engine duplicate candidate.", {
L256: message: duplicateError.message,
L259: return jsonResponse({ error: "Failed to mark duplicate." }, 500);
L265: status: "duplicate",
L266: updated_at: new Date().toISOString(),
L269: .select("id, status, updated_at")
L273: console.error("Failed to update discovered tool duplicate status.", {
L278: { error: "Duplicate candidate created, but status update failed." },
```

### `app/api/admin/discovery/discovered-tools/[id]/route.ts`

```text
L5: checkAdminRateLimit,
L84: const { data: duplicateCandidates, error: duplicateError } = await supabaseAdmin
L85: .from("discovery_duplicate_candidates")
L90: if (duplicateError) {
L91: console.error("Failed to fetch Discovery Engine duplicate candidates.", {
L92: message: duplicateError.message,
L95: return jsonResponse({ error: "Failed to fetch duplicate candidates." }, 500);
L99: .from("discovery_audit_events")
L153: duplicateCandidates: duplicateCandidates || [],
L162: "rejected",
L164: "duplicate",
L170: rejected: "reject",
L172: duplicate: "mark-duplicate",
L236: const rateLimit = checkAdminRateLimit({
L311: updated_at: new Date().toISOString(),
L314: if (status === "rejected" && reason) {
L315: updatePayload.rejected_reason = reason;
L322: .select("id, status, rejected_reason, updated_at")
```

### `app/api/admin/discovery/discovered-tools/bulk-status/route.ts`

```text
L8: checkAdminRateLimit,
L135: const rateLimit = checkAdminRateLimit({
L216: updated_at: updatedAt,
L219: .select("id, status, updated_at");
L244: .from("discovery_audit_events")
```

### `app/api/admin/discovery/discovered-tools/route.ts`

```text
L12: "rejected",
L14: "duplicate",
L37: updated_at: string | null;
L128: "updated_at",
L200: const { data: duplicateRows, error: duplicateRowsError } = toolIds.length
L202: .from("discovery_duplicate_candidates")
L207: if (duplicateRowsError) {
L208: console.error("Failed to fetch Discovery Engine queue duplicate summaries.", {
L209: message: duplicateRowsError.message,
L212: return jsonResponse({ error: "Failed to fetch duplicate summaries." }, 500);
L217: const duplicateSummaryRows = (duplicateRows || []) as Array<{
L222: const duplicateSummaryByTool = new Map<
L224: { duplicate_count: number; blocking_duplicate_count: number }
L227: duplicateSummaryRows.forEach((duplicateRow) => {
L228: const current = duplicateSummaryByTool.get(duplicateRow.discovered_tool_id) || {
L229: duplicate_count: 0,
L230: blocking_duplicate_count: 0,
L233: current.duplicate_count += 1;
```

### `app/api/admin/discovery/intake/route.ts`

```text
L8: checkAdminRateLimit,
L29: type DuplicateWarning = {
L126: unsafeCheck: true,
L167: .from("discovery_audit_events")
L172: .from("discovery_duplicate_candidates")
L212: const rateLimit = checkAdminRateLimit({
L291: .in("status", ["new", "pending_review", "approved", "duplicate"])
L296: console.error("Failed to check existing discovered tools.", {
L300: return jsonResponse({ error: "Failed to check discovery queue." }, 500);
L325: console.error("Failed to check live tools during discovery intake.", {
L329: return jsonResponse({ error: "Failed to check live tools." }, 500);
L341: console.error("Failed to check pending submissions during discovery intake.", {
L345: return jsonResponse({ error: "Failed to check pending submissions." }, 500);
L348: const duplicateWarnings: DuplicateWarning[] = [];
L354: duplicateWarnings.push({
L367: duplicateWarnings.push({
L414: const intakeStatus = duplicateWarnings.length > 0 ? "duplicate" : "new";
L425: tools_duplicates: duplicateWarnings.length > 0 ? 1 : 0,
```

### `app/api/admin/discovery/runs/[id]/candidate-preview/route.ts`

```text
L53: if (!result.rejected) return 200;
```

### `app/api/admin/discovery/runs/manual/claim/route.ts`

```text
L9: checkAdminRateLimit,
L66: "updated_at",
L80: updated_at: string;
L88: | "manual_crawler_executor_claim_rejected"
L94: | "request_plan_preflight_rejected"
L289: const { error } = await supabaseAdmin.from("discovery_audit_events").insert({
L297: event_type: eventType,
L327: return run.started_at || run.updated_at || run.created_at;
L792: function createRejectedPreflightStats({
L794: rejectedAt,
L799: rejectedAt: string;
L808: execution_status: "rejected_preflight",
L809: reason: "rejected_preflight",
L816: rejected_at: rejectedAt,
L817: rejected_by: getActorLabel(actor),
L866: console.error("Failed to check running manual crawler runs.", {
L872: throw new Error("Failed to check active discovery runs.");
L899: updated_at: recoveredAt,
```

### `app/api/admin/discovery/runs/manual/route.ts`

```text
L8: checkAdminRateLimit,
L75: const rateLimit = checkAdminRateLimit({
L143: console.error("Failed to check active manual crawler runs.", {
L147: return jsonResponse({ error: "Failed to check active discovery runs." }, 500);
L187: "updated_at",
L209: updated_at: string;
L213: .from("discovery_audit_events")
L221: event_type: "manual_crawler_run_trigger_created",
```

### `app/api/admin/discovery/runs/route.ts`

```text
L110: "updated_at",
L140: event_type: string;
L152: event_type: string;
L172: .from("discovery_audit_events")
L188: const message = getManualMetadataFetchAuditMessage(auditRow.metadata.event_type);
L194: event_type: auditRow.metadata.event_type,
L214: event_type: staticEvidenceAudit.eventType,
L236: event_type: auditRow.metadata.event_type,
L250: event_type: normalized.eventType,
```

### `app/api/admin/discovery/sources/[id]/route.ts`

```text
L8: checkAdminRateLimit,
L95: unsafeCheck: true,
L198: event_type: "source_updated",
L228: const rateLimit = checkAdminRateLimit({
L261: unsafeCheck: true,
L280: unsafeCheck: true,
L323: console.error("Failed to check duplicate discovery source slug.", {
L327: return jsonResponse({ error: "Failed to check discovery sources." }, 500);
L364: "id, name, slug, description, url, source_type, config, is_active, last_run_at, created_at, updated_at"
L383: .from("discovery_audit_events")
```

### `app/api/admin/discovery/sources/route.ts`

```text
L8: checkAdminRateLimit,
L90: unsafeCheck: true,
L171: "updated_at",
L225: const rateLimit = checkAdminRateLimit({
L257: unsafeCheck: true,
L267: unsafeCheck: true,
L287: console.error("Failed to check existing discovery source.", {
L291: return jsonResponse({ error: "Failed to check discovery sources." }, 500);
L316: "id, name, slug, description, url, source_type, config, is_active, last_run_at, created_at, updated_at"
L329: .from("discovery_audit_events")
L337: event_type: "source_created",
```

### `lib/admin-audit-log.ts`

```text
L11: | "submission_rejected"
```

### `lib/admin-rate-limit.ts`

```text
L15: discoveryToolDuplicate: "discovery-tool-duplicate",
L67: type CheckAdminRateLimitInput = {
L110: [ADMIN_RATE_LIMIT_ACTIONS.discoveryToolDuplicate]: {
L204: export function checkAdminRateLimit({
L209: }: CheckAdminRateLimitInput): AdminRateLimitResult {
```

### `lib/discovered-tools.ts`

```text
L4: "rejected",
L5: "duplicate",
L21: duplicateOfToolId?: number | null;
L30: rejected: "Rejected",
L31: duplicate: "Duplicate",
L56: "Sample duplicate-state candidate for table layout preparation.",
L57: status: "duplicate",
L59: duplicateOfToolId: 42,
L70: "Sample needs-review candidate for moderation and quality checks.",
```

### `lib/discovery/discovery-candidate-extraction-invocation.ts`

```text
L26: | "missing_audit_correlation_id"
L27: | "invalid_audit_correlation_id"
L50: audit_correlation_id: string;
L61: rejected: boolean;
L70: duplicate_or_eligibility_rejections: string[];
L71: audit_correlation_id: string | null;
L156: missing_audit_correlation_id: "Missing audit correlation ID.",
L157: invalid_audit_correlation_id: "Invalid audit correlation ID.",
L228: rejected: true,
L237: duplicate_or_eligibility_rejections: [],
L238: audit_correlation_id: context.auditCorrelationId ?? null,
L240: "invocation_rejected",
L256: rejected: false,
L265: duplicate_or_eligibility_rejections: [],
L266: audit_correlation_id: input.auditCorrelationId,
L313: rejected: false,
L322: duplicate_or_eligibility_rejections: [],
L323: audit_correlation_id: input.auditCorrelationId,
```

### `lib/discovery/discovery-candidate-extraction-mapper.ts`

```text
L6: type DiscoveryCandidateDuplicateCheckStatus,
L15: export type CandidateExtractionDuplicateAdvisory = {
L16: duplicateCheckStatus?: DiscoveryCandidateDuplicateCheckStatus | null;
L17: duplicateSignalTypes?: string[] | null;
L18: duplicateBlocking?: boolean | null;
L19: possibleDuplicateToolId?: number | null;
L20: possibleDuplicateDiscoveredToolId?: string | null;
L21: possibleDuplicateCandidateId?: string | null;
L40: duplicateAdvisory?: CandidateExtractionDuplicateAdvisory | null;
L57: | "invalid_audit_correlation_id"
L116: invalid_audit_correlation_id: "Invalid audit correlation ID.",
L274: return fail("invalid_audit_correlation_id", {
L320: case "invalid_audit_correlation_id":
L321: return "invalid_audit_correlation_id";
L470: const duplicateAdvisory = input.duplicateAdvisory ?? {};
L487: duplicate_check_status: duplicateAdvisory.duplicateCheckStatus,
L488: duplicate_signal_types: duplicateAdvisory.duplicateSignalTypes,
L489: duplicate_blocking: duplicateAdvisory.duplicateBlocking,
```

### `lib/discovery/discovery-candidate-extraction-staging-pipeline.ts`

```text
L186: stagingInput.normalizedCandidate.audit_correlation_id ?? null,
```

## Phase 19D Boundary Confirmation

Phase 19D is documentation-only.

Phase 19D does not:

- implement code
- modify tests
- modify API routes
- modify backend helpers
- modify UI components
- modify Supabase migrations
- modify package files
- create migration files
- apply migrations
- run type generation
- run browser QA
- run live database queries
- run database mutations
- create candidate rows
- update candidate rows
- create source rows
- create run rows
- write to `public.tools`
- write to `discovered_tools`
- approve candidates
- publish candidates
- promote candidates
- reject candidates
- archive candidates
- mark duplicates
- trigger crawler execution
- trigger candidate extraction execution

## Recommended Next Phase

Recommended next phase:

```text
Phase 19E — Candidate Staging Queue Decision Schema Expansion Migration Draft
```

Suggested Phase 19E scope:

```text
Draft the Supabase migration file only.
Use exact local schema/constraint representation.
Add missing candidate_status values and nullable decision metadata columns.
Document audit event_type handling.
Do not apply the migration.
Do not run supabase db push.
Do not run live DB queries.
Do not run live DB mutations.
```

Alternative if exact constraint names remain unclear:

```text
Phase 19E — Candidate Staging Queue Decision Schema Constraint Name Inspection
```

Suggested alternative scope:

```text
Local inspection only to identify exact candidate_status constraint/type representation before drafting migration SQL.
```

## Gemini Review Questions

Gemini should review:

```text
Does the migration design correctly address the Phase 19C blockers?
Should the first schema expansion add all decision metadata fields as nullable columns?
Should decision_action be constrained at database level in the first migration or only in application validation?
Should decision_reason be constrained at database level in the first migration or only in application validation?
Should duplicate_of_candidate_id and duplicate_of_tool_id have foreign keys in the first migration, or remain nullable plain UUIDs initially?
Should audit event_type handling be part of the same migration or deferred until exact event_type representation is confirmed?
Should Phase 19E draft the migration, or should there be a constraint-name inspection phase first?
```

## Conclusion

Phase 19D designs the schema expansion required to unblock Candidate Staging Queue decision helper implementation.

The migration design preserves:

```text
Approve for draft does not publish.
public.tools write remains forbidden.
No live mutation without separate explicit approval.
No helper implementation until schema readiness is resolved.
```

Phase 19D is ready for Gemini review before commit.
