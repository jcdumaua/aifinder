# Discovery Phase 19C — Candidate Staging Queue Decision Schema Readiness Inspection

## Status

Phase 19C is a docs-only / inspection-only schema readiness phase.

Current pushed baseline:

```text
4415bf6 Document candidate staging queue decision workflow implementation plan
```

Phase 19C follows Gemini's Phase 19B recommendation to inspect schema readiness before implementing helper mutation logic.

Phase 19C does not implement code.

Phase 19C does not modify tests, API routes, backend helpers, UI components, migrations, package files, or source files.

Phase 19C does not draft a migration.

Phase 19C does not apply a migration.

Phase 19C does not run browser QA.

Phase 19C does not run live database queries.

Phase 19C does not run database mutations.

## Discovery Engine Progress Snapshot

Progress after Phase 19C schema readiness inspection:

```text
Discovery Engine overall: ~87%
Phase 19C progress: 100%
Current milestone: Candidate Staging Queue decision schema readiness inspection complete
```

## Purpose

Phase 19B warned:

```text
Do not implement a mutation that can fail because candidate_status constraints were guessed.
```

Phase 19C answers:

```text
Do local schema, migration, and type files confirm that the planned candidate_status values and decision metadata fields are available before helper implementation?
```

## Inspection Method

Phase 19C inspected local files only.

Inspected roots:

```text
supabase
lib
types
app/api/admin/discovery
testing
```

No app code was executed.

No live database was queried.

No database mutation was performed.

No migration was drafted.

No migration was applied.

## Inspection Summary

```text
Relevant local files found: 74
Files mentioning discovery_candidate_tools: 13
Files mentioning candidate_status: 20
Files mentioning planned candidate statuses: 50
Files mentioning planned decision metadata fields: 58
Files mentioning audit table candidates: 22
Readiness decision: Blocked pending schema planning
```

Readiness decision:

```text
Blocked pending schema planning
```

Blockers:

```text
- Planned candidate_status values not confirmed locally: under_review, approved_for_draft, needs_more_evidence
- Planned decision metadata fields not confirmed locally: decision_action, decision_reason, decision_notes, decided_at, decided_by, duplicate_of_candidate_id
```

Warnings:

```text
- Planned decision audit event names not yet present locally: discovery_candidate_decision_approve_for_draft, discovery_candidate_decision_reject, discovery_candidate_decision_archive, discovery_candidate_decision_duplicate, discovery_candidate_decision_needs_more_evidence
```

## Candidate Status Readiness

Planned statuses:

```text
under_review
approved_for_draft
rejected
archived
duplicate
needs_more_evidence
```

| Candidate status | Found locally | Evidence files |
| --- | --- | --- |
| `staged` | yes | `lib/discovery/discovery-candidate-extraction-invocation.ts`<br>`lib/discovery/discovery-candidate-extraction-staging-pipeline.ts`<br>`lib/discovery/discovery-candidate-staging-admin.ts`<br>`lib/discovery/discovery-candidate-staging-queue-read-model.ts`<br>`lib/discovery-candidate-normalizer.ts`<br>+21 more |
| `under_review` | no | None found |
| `approved_for_draft` | no | None found |
| `rejected` | yes | `app/api/admin/discovery/discovered-tools/[id]/route.ts`<br>`app/api/admin/discovery/discovered-tools/route.ts`<br>`app/api/admin/discovery/runs/[id]/candidate-preview/route.ts`<br>`app/api/admin/discovery/runs/manual/claim/route.ts`<br>`lib/admin-audit-log.ts`<br>+21 more |
| `archived` | yes | `lib/discovery/discovery-candidate-staging-admin.ts`<br>`lib/discovery-candidate-normalizer.ts`<br>`lib/homepage-control-types.ts`<br>`lib/supabase/database.types.ts`<br>`supabase/migrations/20260612000100_create_homepage_control_room.sql`<br>+8 more |
| `duplicate` | yes | `app/api/admin/discovery/candidate-staging-queue/route.ts`<br>`app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts`<br>`app/api/admin/discovery/discovered-tools/[id]/route.ts`<br>`app/api/admin/discovery/discovered-tools/route.ts`<br>`app/api/admin/discovery/intake/route.ts`<br>+32 more |
| `needs_more_evidence` | no | None found |

## Decision Metadata Field Readiness

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

## Audit Readiness

| Audit signal | Found locally | Evidence files |
| --- | --- | --- |
| `discovery_audit_events` | yes | `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts`<br>`app/api/admin/discovery/discovered-tools/[id]/route.ts`<br>`app/api/admin/discovery/discovered-tools/bulk-status/route.ts`<br>`app/api/admin/discovery/intake/route.ts`<br>`app/api/admin/discovery/runs/manual/claim/route.ts`<br>+9 more |
| `audit_events` | yes | `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts`<br>`app/api/admin/discovery/discovered-tools/[id]/route.ts`<br>`app/api/admin/discovery/discovered-tools/bulk-status/route.ts`<br>`app/api/admin/discovery/intake/route.ts`<br>`app/api/admin/discovery/runs/manual/claim/route.ts`<br>+17 more |
| `discovery_candidate_decision_approve_for_draft` | no | None found |
| `discovery_candidate_decision_reject` | no | None found |
| `discovery_candidate_decision_archive` | no | None found |
| `discovery_candidate_decision_duplicate` | no | None found |
| `discovery_candidate_decision_needs_more_evidence` | no | None found |

Audit decision:

```text
Audit event write failure should block candidate status update.
```

Reason:

```text
An unaudited candidate decision mutation is worse than a failed mutation.
```

## Relevant Local Files

| File | target table | candidate_status | planned statuses | decision fields | audit signals |
| --- | --- | --- | --- | --- | --- |
| `app/api/admin/discovery/candidate-extraction/invoke/route.ts` | no | no | no | yes | no |
| `app/api/admin/discovery/candidate-staging-queue/route.ts` | no | no | yes | no | no |
| `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts` | no | no | yes | yes | yes |
| `app/api/admin/discovery/discovered-tools/[id]/route.ts` | no | no | yes | yes | yes |
| `app/api/admin/discovery/discovered-tools/bulk-status/route.ts` | no | no | no | yes | yes |
| `app/api/admin/discovery/discovered-tools/route.ts` | no | no | yes | yes | no |
| `app/api/admin/discovery/intake/route.ts` | no | no | yes | no | yes |
| `app/api/admin/discovery/runs/[id]/candidate-preview/route.ts` | no | no | yes | no | no |
| `app/api/admin/discovery/runs/manual/claim/route.ts` | no | no | yes | yes | yes |
| `app/api/admin/discovery/runs/manual/route.ts` | no | no | no | yes | yes |
| `app/api/admin/discovery/runs/route.ts` | no | no | no | yes | yes |
| `app/api/admin/discovery/sources/[id]/route.ts` | no | no | yes | yes | yes |
| `app/api/admin/discovery/sources/route.ts` | no | no | no | yes | yes |
| `lib/admin-audit-log.ts` | no | no | yes | no | no |
| `lib/admin-rate-limit.ts` | no | no | yes | no | no |
| `lib/discovered-tools.ts` | no | no | yes | no | no |
| `lib/discovery/discovery-candidate-extraction-invocation.ts` | no | yes | yes | yes | no |
| `lib/discovery/discovery-candidate-extraction-mapper.ts` | no | no | yes | yes | no |
| `lib/discovery/discovery-candidate-extraction-staging-pipeline.ts` | no | no | no | yes | no |
| `lib/discovery/discovery-candidate-preview-live-staging-resolver.ts` | no | no | no | yes | no |
| `lib/discovery/discovery-candidate-preview-provider.ts` | no | no | yes | yes | no |
| `lib/discovery/discovery-candidate-staging-admin.ts` | yes | yes | yes | yes | no |
| `lib/discovery/discovery-candidate-staging-queue-cursor.ts` | no | no | yes | yes | no |
| `lib/discovery/discovery-candidate-staging-queue-read-model.ts` | yes | yes | yes | yes | no |
| `lib/discovery-candidate-normalizer.ts` | no | yes | yes | yes | no |
| `lib/discovery-manual-crawler.ts` | no | no | yes | no | no |
| `lib/discovery-static-html-evidence-audit-review.ts` | no | no | no | no | yes |
| `lib/homepage-control-admin.ts` | no | no | no | yes | yes |
| `lib/homepage-control-parser.ts` | no | no | no | yes | no |
| `lib/homepage-control-public.ts` | no | no | no | yes | no |
| `lib/homepage-control-schema.ts` | no | no | yes | no | no |
| `lib/homepage-control-types.ts` | no | no | yes | yes | no |
| `lib/public-tool-adapter.ts` | no | no | no | yes | no |
| `lib/supabase/database.types.ts` | yes | yes | yes | yes | yes |
| `supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql` | no | no | yes | no | no |
| `supabase/migrations/20260602000200_create_discovered_tools_queue.sql` | no | no | yes | yes | no |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | no | no | yes | yes | yes |
| `supabase/migrations/20260612000200_harden_discovered_tools_access.sql` | no | no | no | yes | no |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | no | no | no | yes | yes |
| `supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql` | no | no | no | no | yes |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | no | no | no | yes | yes |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | no | no | yes | yes | no |
| `supabase/migrations/20260616002151_finalize_public_safe_tools_schema_patch.sql` | no | no | yes | yes | no |
| `supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql` | no | no | no | yes | no |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | no | no | yes | yes | yes |
| `supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql` | no | no | yes | yes | yes |
| `supabase/migrations/20260617005500_cleanup_discovery_queue_smoke_test.sql` | no | no | yes | no | yes |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | yes | yes | yes | yes | no |
| `supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql` | yes | no | yes | no | yes |
| `supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql` | no | no | no | yes | no |
| `supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql` | no | no | yes | no | no |
| `testing/discovery-candidate-extraction-dry-run-panel.test.mjs` | no | no | yes | yes | yes |
| `testing/discovery-candidate-extraction-invocation-route.test.mjs` | no | yes | yes | yes | no |
| `testing/discovery-candidate-extraction-invocation.test.mjs` | no | yes | yes | yes | no |
| `testing/discovery-candidate-extraction-live-staging-panel.test.mjs` | no | yes | yes | yes | yes |
| `testing/discovery-candidate-extraction-mapper.test.mjs` | no | yes | yes | yes | no |
| `testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs` | yes | yes | no | yes | no |
| `testing/discovery-candidate-extraction-staging-pipeline.test.mjs` | no | yes | no | yes | no |
| `testing/discovery-candidate-normalizer.test.mjs` | no | yes | yes | yes | no |
| `testing/discovery-candidate-preview-live-staging-resolver.test.mjs` | no | yes | yes | yes | no |
| `testing/discovery-candidate-preview-provider.test.mjs` | no | no | yes | yes | no |
| `testing/discovery-candidate-preview-route.test.mjs` | no | no | yes | yes | no |
| `testing/discovery-candidate-staging-admin.test.mjs` | yes | yes | yes | yes | no |
| `testing/discovery-candidate-staging-live-smoke.mjs` | yes | yes | no | yes | no |
| `testing/discovery-candidate-staging-queue-admin-ui.test.mjs` | no | no | yes | no | no |
| `testing/discovery-candidate-staging-queue-api-read-route.test.mjs` | no | no | yes | yes | no |
| `testing/discovery-candidate-staging-queue-cursor.test.mjs` | no | no | yes | yes | no |
| `testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs` | no | no | yes | no | no |
| `testing/discovery-candidate-staging-queue-read-model.test.mjs` | yes | yes | yes | yes | no |
| `testing/discovery-candidate-staging-rls-smoke.mjs` | yes | yes | no | yes | no |
| `testing/phase14k-a-controlled-preview-artifact-preparation.mjs` | yes | no | no | yes | no |
| `testing/phase14k-a-controlled-preview-artifact-preparation.test.mjs` | yes | no | no | yes | no |
| `testing/phase14p-controlled-exact-id-archive-cleanup.mjs` | yes | yes | yes | yes | no |
| `testing/phase14p-controlled-exact-id-archive-cleanup.test.mjs` | no | yes | yes | yes | no |

## Evidence Snippets

### `app/api/admin/discovery/candidate-extraction/invoke/route.ts`

```text
L32: "audit_correlation_id",
L200: audit_correlation_id: body.audit_correlation_id,
```

### `app/api/admin/discovery/candidate-staging-queue/route.ts`

```text
L166: const duplicateCheckStatus = getOptionalParam(
L168: "duplicateCheckStatus",
L199: if (duplicateCheckStatus !== undefined) {
L200: input.duplicateCheckStatus = duplicateCheckStatus;
```

### `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts`

```text
L123: console.warn("Unauthorized Discovery Engine duplicate request.", {
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
L311: updated_at: new Date().toISOString(),
L314: if (status === "rejected" && reason) {
L315: updatePayload.rejected_reason = reason;
L322: .select("id, status, rejected_reason, updated_at")
```

### `app/api/admin/discovery/discovered-tools/bulk-status/route.ts`

```text
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
```

### `app/api/admin/discovery/intake/route.ts`

```text
L29: type DuplicateWarning = {
L167: .from("discovery_audit_events")
L172: .from("discovery_duplicate_candidates")
L291: .in("status", ["new", "pending_review", "approved", "duplicate"])
L348: const duplicateWarnings: DuplicateWarning[] = [];
L354: duplicateWarnings.push({
L367: duplicateWarnings.push({
L414: const intakeStatus = duplicateWarnings.length > 0 ? "duplicate" : "new";
L425: tools_duplicates: duplicateWarnings.length > 0 ? 1 : 0,
L466: duplicate_warnings: duplicateWarnings,
L510: duplicate_warnings: duplicateWarnings,
L531: let duplicateCandidateId: string | null = null;
L533: if (duplicateWarnings.length > 0) {
L534: const primaryDuplicate = duplicateWarnings[0];
L536: const { data: duplicateCandidate, error: duplicateError } =
L538: .from("discovery_duplicate_candidates")
```

### `app/api/admin/discovery/runs/[id]/candidate-preview/route.ts`

```text
L53: if (!result.rejected) return 200;
```

### `app/api/admin/discovery/runs/manual/claim/route.ts`

```text
L66: "updated_at",
L80: updated_at: string;
L88: | "manual_crawler_executor_claim_rejected"
L94: | "request_plan_preflight_rejected"
L289: const { error } = await supabaseAdmin.from("discovery_audit_events").insert({
L327: return run.started_at || run.updated_at || run.created_at;
L792: function createRejectedPreflightStats({
L794: rejectedAt,
L799: rejectedAt: string;
L808: execution_status: "rejected_preflight",
L809: reason: "rejected_preflight",
L816: rejected_at: rejectedAt,
L817: rejected_by: getActorLabel(actor),
L899: updated_at: recoveredAt,
L962: updated_at: failedAt,
L990: message: "Metadata-fetch smoke mode rejected a run without exactly one request plan.",
```

### `app/api/admin/discovery/runs/manual/route.ts`

```text
L187: "updated_at",
L209: updated_at: string;
L213: .from("discovery_audit_events")
```

### `app/api/admin/discovery/runs/route.ts`

```text
L17: const MAX_AUDIT_EVENTS_PER_PAGE = 100;
L110: "updated_at",
L172: .from("discovery_audit_events")
L176: .limit(MAX_AUDIT_EVENTS_PER_PAGE);
L269: audit_events: auditEventsByRunId.get(run.id) || [],
L272: static_evidence_audit_events:
```

### `app/api/admin/discovery/sources/[id]/route.ts`

```text
L323: console.error("Failed to check duplicate discovery source slug.", {
L364: "id, name, slug, description, url, source_type, config, is_active, last_run_at, created_at, updated_at"
L383: .from("discovery_audit_events")
```

### `app/api/admin/discovery/sources/route.ts`

```text
L171: "updated_at",
L316: "id, name, slug, description, url, source_type, config, is_active, last_run_at, created_at, updated_at"
L329: .from("discovery_audit_events")
```

### `lib/admin-audit-log.ts`

```text
L11: | "submission_rejected"
```

### `lib/admin-rate-limit.ts`

```text
L15: discoveryToolDuplicate: "discovery-tool-duplicate",
L110: [ADMIN_RATE_LIMIT_ACTIONS.discoveryToolDuplicate]: {
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
```

### `lib/discovery/discovery-candidate-extraction-invocation.ts`

```text
L26: | "missing_audit_correlation_id"
L27: | "invalid_audit_correlation_id"
L50: audit_correlation_id: string;
L61: rejected: boolean;
L67: candidates_staged_count: number;
L70: duplicate_or_eligibility_rejections: string[];
L71: audit_correlation_id: string | null;
L156: missing_audit_correlation_id: "Missing audit correlation ID.",
L157: invalid_audit_correlation_id: "Invalid audit correlation ID.",
L228: rejected: true,
L234: candidates_staged_count: 0,
L237: duplicate_or_eligibility_rejections: [],
L238: audit_correlation_id: context.auditCorrelationId ?? null,
L240: "invocation_rejected",
L256: rejected: false,
L262: candidates_staged_count: 0,
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
```

### `lib/discovery/discovery-candidate-extraction-staging-pipeline.ts`

```text
L44: status: "staged";
L46: candidateStatus: "staged";
L86: stagedCount: number;
L186: stagingInput.normalizedCandidate.audit_correlation_id ?? null,
L198: status: "staged",
L263: const stagedCount = results.filter((result) => result.ok).length;
L279: stagedCount,
```

### `lib/discovery/discovery-candidate-preview-live-staging-resolver.ts`

```text
L130: const auditCorrelationId = normalizeScopedId(invocationInput.audit_correlation_id);
```

## Interpretation

Missing local evidence is treated as a blocker for mutation implementation.

A missing status or field does not prove the production database lacks it.

It means Phase 19C did not confirm readiness from local schema, migration, or type files.

The safe rule remains:

```text
Do not implement a mutation that can fail because candidate_status constraints were guessed.
```

## Readiness Gate Result

Schema readiness result:

```text
Blocked pending schema planning
```

The helper implementation should not proceed yet.

## Preserved Boundaries

Phase 19C preserves the Phase 19A/19B boundaries:

```text
Approve for draft does not publish.
public.tools write remains forbidden until a separate publish workflow phase is approved.
No future decision implementation may run live database mutations without separate explicit approval.
No UI decision buttons before mutation API safety is designed, implemented, and tested.
```

Future live mutation approval phrase remains:

```text
Approve Phase 19 live candidate decision mutation smoke
```

Normal phase approval must not imply live mutation approval.

## Candidate Staging Queue Boundary

Phase 19C does not change existing Candidate Staging Queue implementation.

Candidate Staging Queue milestone status remains:

```text
Read-only API/UI/detail/cursor pagination milestone closed for created_at and updated_at.
confidence_bucket cursor continuation remains deferred unless separately approved.
```

## Phase 19C Boundary Confirmation

Phase 19C is documentation-only and inspection-only.

Phase 19C does not:

- implement code
- modify tests
- modify API routes
- modify backend helpers
- modify UI components
- modify Supabase migrations
- modify package files
- draft migrations
- apply migrations
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
Phase 19D — Candidate Staging Queue Decision Schema Expansion Migration Design
```

Recommended next scope:

```text
Docs-only schema/migration design for missing candidate statuses and decision metadata fields. No migration apply, no DB push, no live DB mutation.
```

## Gemini Review Questions

Gemini should review:

```text
Is the local schema inspection sufficient for readiness?
Does the readiness decision correctly block or allow helper implementation?
Should missing planned statuses require a migration design phase before helper implementation?
Should missing decision metadata fields require a migration design phase before helper implementation?
Should audit event write failure continue to block candidate status update?
Is the recommended next phase correct?
```

## Conclusion

Phase 19C completed local schema readiness inspection for the Candidate Staging Queue decision workflow.

Readiness decision:

```text
Blocked pending schema planning
```

Phase 19C is ready for Gemini review before commit.
