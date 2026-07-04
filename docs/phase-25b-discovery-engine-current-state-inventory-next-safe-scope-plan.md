# Phase 25B — Discovery Engine Current-State Inventory and Next Safe Scope Plan

## Status

```text
PHASE_25B_DISCOVERY_ENGINE_CURRENT_STATE_INVENTORY_NEXT_SAFE_SCOPE_PLAN_DOCUMENTED=true
PHASE_25B_DOCS_ONLY_CURRENT_STATE_INVENTORY=true
REPO_STATUS=## main...origin/main
LATEST_COMMIT=c725e79 Document Discovery Engine re-entry readiness gate
WORKING_TREE_CLEAN_BEFORE_PHASE=true
BRANCH_SYNCED_WITH_ORIGIN_MAIN_BEFORE_PHASE=true
SOURCE_CHANGE_EXECUTED=false
API_CHANGE_EXECUTED=false
ADMIN_WRITE_EXECUTED=false
DIRECT_DB_ACCESS_EXECUTED=false
LIVE_DB_READ_EXECUTED=false
DB_READ_EXECUTED=false
DB_MUTATION_EXECUTED=false
CANDIDATE_DECISION_EXECUTED=false
APPROVE_FOR_DRAFT_EXECUTED=false
EXTRACTION_EXECUTED=false
CRAWLER_EXECUTED=false
LLM_EXTRACTION_EXECUTED=false
EVIDENCE_ACQUISITION_EXECUTED=false
PUBLIC_TOOLS_WRITE_EXECUTED=false
SCHEMA_MIGRATION_TYPEGEN_CHANGE_EXECUTED=false
PACKAGE_CHANGE_EXECUTED=false
LOCKFILE_CHANGE_EXECUTED=false
COMMIT_EXECUTED_BY_THIS_PHASE=false
PUSH_EXECUTED_BY_THIS_PHASE=false
```

## Purpose

Phase 25B creates the formal Discovery Engine current-state inventory and next safe scope plan after Phase 25A re-entry readiness was approved and pushed.

This phase keeps Discovery Engine re-entry in a planning-only state. It does not reactivate operational behavior.

## Baseline

```text
previous_phase=Phase 25A — Discovery Engine Re-Entry Readiness Gate
previous_commit=c725e79 Document Discovery Engine re-entry readiness gate
phase_25a_result=PASS
phase_25a_gemini_review=APPROVED
phase_25a_recommended_next_phase=Phase 25B — Discovery Engine Current-State Inventory and Next Safe Scope Plan
```

Phase 25A established that Discovery Engine is safe to re-enter only under docs-only/readiness workflow and that Phase 25B should remain current-state inventory before any live DB read, mutation, or implementation.

## Hard Boundaries

Phase 25B preserved and extends the Phase 25A hard boundaries:

```text
NO_SOURCE_EDITS=true
NO_API_EDITS=true
NO_ADMIN_WRITES=true
NO_DIRECT_DB_ACCESS=true
NO_LIVE_DB_READS=true
NO_DB_MUTATIONS=true
NO_CANDIDATE_DECISION_EXECUTION=true
NO_APPROVE_FOR_DRAFT=true
NO_EXTRACTION_EXECUTION=true
NO_CRAWLER_EXECUTION=true
NO_LLM_EXTRACTION_EXECUTION=true
NO_EVIDENCE_ACQUISITION=true
NO_PUBLIC_TOOLS_WRITES=true
NO_SCHEMA_MIGRATION_TYPEGEN_CHANGES=true
NO_PACKAGE_OR_LOCKFILE_CHANGES=true
NO_COMMIT_WITHOUT_JAMES_APPROVAL=true
NO_PUSH_WITHOUT_JAMES_APPROVAL=true
```

## Repository Inspection Summary

Phase 25B inspected the repository only.

```text
discovery_related_doc_count=250
discovery_related_source_test_count=82
npm_run_check=PASS
```

Generated inspection artifacts outside the repository:

```text
/tmp/aifinder-phase-25b-discovery-docs-list.txt
/tmp/aifinder-phase-25b-discovery-source-test-list.txt
/tmp/aifinder-phase-25b-recent-discovery-commits.txt
/tmp/aifinder-phase-25b-recent-discovery-doc-changes.txt
/tmp/aifinder-phase-25b-current-state-marker-search.txt
/tmp/aifinder-phase-25b-risk-boundary-search.txt
```

## Discovery Engine Component Inventory

### Admin pages

```text
app/admin/discovery/page.tsx
app/admin/discovery/tools/page.tsx
app/admin/discovery/tools/[id]/page.tsx
```

### API routes

```text
app/api/admin/discovery/candidate-extraction/invoke/route.ts
app/api/admin/discovery/candidate-staging-queue/route.ts
app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts
app/api/admin/discovery/discovered-tools/route.ts
app/api/admin/discovery/discovered-tools/[id]/route.ts
app/api/admin/discovery/discovered-tools/[id]/approve/route.ts
app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts
app/api/admin/discovery/discovered-tools/bulk-status/route.ts
app/api/admin/discovery/intake/route.ts
app/api/admin/discovery/runs/route.ts
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
app/api/admin/discovery/runs/manual/route.ts
app/api/admin/discovery/runs/manual/claim/route.ts
app/api/admin/discovery/sources/route.ts
app/api/admin/discovery/sources/[id]/route.ts
```

### Admin UI components

```text
components/admin/discovery/candidate-staging-queue-decision-dialog.tsx
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
components/admin/discovery/candidate-staging-queue-panel.tsx
components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx
components/admin/discovery/discovery-candidate-extraction-live-staging-panel.tsx
components/admin/discovery/discovery-queue-table.tsx
components/admin/discovery/discovery-runs-table.tsx
components/admin/discovery/discovery-sources-panel.tsx
components/admin/discovery/discovery-tool-detail.tsx
components/admin/discovery/manual-metadata-fetch-results-review.tsx
components/admin/discovery/manual-static-html-evidence-audit-timeline.tsx
components/admin/discovery/manual-static-html-evidence-results-review.tsx
```

### Discovery library modules

```text
lib/discovery/discovery-candidate-decision-admin.ts
lib/discovery/discovery-candidate-decision-validation.ts
lib/discovery/discovery-candidate-extraction-invocation.ts
lib/discovery/discovery-candidate-extraction-mapper.ts
lib/discovery/discovery-candidate-extraction-staging-pipeline.ts
lib/discovery/discovery-candidate-preview-live-staging-resolver.ts
lib/discovery/discovery-candidate-preview-provider.ts
lib/discovery/discovery-candidate-queue-fail-closed-presentation.ts
lib/discovery/discovery-candidate-staging-admin.ts
lib/discovery/discovery-candidate-staging-queue-cursor.ts
lib/discovery/discovery-candidate-staging-queue-read-model.ts
lib/discovery/discovery-supabase-admin.ts
```

### Test and smoke harnesses

```text
testing/discovery-candidate-decision-read-only-listing-gate.mjs
testing/discovery-candidate-decision-execution-preflight.mjs
testing/discovery-candidate-decision-api-static-assertions.mjs
testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs
testing/discovery-candidate-staging-live-smoke.mjs
testing/discovery-candidate-staging-rls-smoke.mjs
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
testing/discovery-candidate-staging-queue-read-model.test.mjs
testing/discovery-other-bucket-bounded-read-only-inspection.mjs
testing/discovery-static-html-evidence-executor.test.mjs
testing/discovery-manual-metadata-fetch.test.mjs
```

## Current-State Interpretation

The Discovery Engine is not dormant because files are absent. It is inactive by governance.

The repository contains implemented and tested Discovery Engine capabilities across these lanes:

```text
discovery_source_management=present
manual_discovery_runs=present
manual_metadata_fetch=present
static_html_evidence=present
candidate_extraction=present
candidate_staging=present
candidate_staging_queue_read_model=present
candidate_preview=present
candidate_decision_validation=present
candidate_decision_admin=present
admin_queue_fail_closed_presentation=present
read_only_candidate_listing_gate=present
```

However, Phase 25B does not execute or reactivate any of these capabilities.

## Completed / Stabilized Areas

Based on the recent Discovery Engine closure history and current inventory, the following are treated as stabilized or closed for re-entry purposes:

```text
discovery_engine_final_stabilization=closed
discovery_engine_completion_closure_handoff=closed
admin_queue_fail_closed_presentation_lane=closed
homepage_product_transition=closed
phase_25a_reentry_readiness=closed_and_pushed
```

## Areas That Remain Gated

The following areas remain gated and require explicit future phase authorization before any execution:

```text
live_database_reads=gated
database_mutations=gated
candidate_decision_execution=gated
approve_for_draft=gated
candidate_cleanup_or_status_reopen=gated
candidate_extraction_execution=gated
live_staging_or_repopulation=gated
crawler_execution=gated
llm_extraction_execution=gated
evidence_acquisition=gated
public_tools_publishing=gated
schema_migration_typegen_package_changes=gated
```

## Current Risk Register

### Risk 1 — Accidental operational reactivation

Discovery Engine has many implemented routes, helpers, UI panels, and scripts. A casual run could accidentally cross from planning into live behavior.

Mitigation:
Keep Phase 25B docs-only. Any future executable phase must define exact command, opt-in env var, expected output, stop conditions, and Gemini review.

### Risk 2 — Live DB read ambiguity

Some previous Discovery Engine lanes included read-only live checks. Phase 25B does not authorize live DB reads.

Mitigation:
A future live-read phase must explicitly name the query, table, columns, row limits, read-only enforcement, and no-mutation proof.

### Risk 3 — Candidate decision sensitivity

Candidate decision routes and admin helpers exist, including decision action vocabulary around `approve_for_draft`.

Mitigation:
No candidate decision execution and no `approve_for_draft` remain hard boundaries unless separately approved in a future execution phase.

### Risk 4 — Public publishing boundary

Discovery Engine work must not publish into public tools or discovered tools without a separate publishing gate.

Mitigation:
Keep `public.tools` writes and public publishing forbidden in all near-term re-entry phases.

### Risk 5 — Evidence/extraction/crawler escalation

Static evidence, metadata fetch, extraction, and staging capabilities exist and can become operational.

Mitigation:
Phase 25B recommends one more docs-only planning gate before any non-mutating executable check.

## Candidate Next Lanes

### Lane A — Phase 25C: Discovery Engine Current-State Map and Risk Register Documentation

Type:
Docs-only.

Purpose:
Turn this inventory into a concise permanent map of completed capabilities, inactive capabilities, gated operations, and risks.

Allowed:
- docs-only current-state map
- refine risk register
- identify exact future executable gate requirements
- no repo behavior changes

Forbidden:
- source edits
- live DB reads
- DB mutations
- candidate decisions
- `approve_for_draft`
- extraction/crawler/LLM/evidence execution
- package changes

### Lane B — Phase 25C: Read-Only Candidate Listing Gate Review Plan

Type:
Docs-only.

Purpose:
Review the previously implemented read-only candidate listing gate and decide whether a future non-mutating read-only execution should be proposed.

Allowed:
- inspect existing script and docs only
- define future read-only live-read safety conditions
- no execution

Forbidden:
- live DB read in Phase 25C
- DB mutation
- candidate decision execution
- candidate UUID selection for action
- `approve_for_draft`

### Lane C — Phase 25C: Candidate Decision Admin Queue Reliability Planning

Type:
Docs-only.

Purpose:
Plan a future reliability or UX refinement lane for candidate decision/admin queue behavior without executing decisions.

Allowed:
- docs-only queue reliability plan
- inspect existing components/helpers/tests
- define future QA-only gates

Forbidden:
- source edits
- live admin writes
- candidate decision execution
- `approve_for_draft`
- DB mutation

### Lane D — Phase 25C: Other Bucket / Discovery Source Expansion Planning

Type:
Docs-only.

Purpose:
Plan future Discovery Engine source expansion or other-bucket work without crawler/extraction execution.

Allowed:
- docs-only source planning
- inspect prior other-bucket docs/scripts
- define future approval gates

Forbidden:
- crawler execution
- extraction execution
- live staging
- public publishing
- DB mutation

## Recommended Next Lane

Recommended:

```text
Phase 25C — Discovery Engine Current-State Map and Risk Register Documentation
```

Rationale:
Before selecting a narrow executable path, Discovery Engine re-entry should have a concise current-state map and risk register. This is safer than immediately planning live-read or candidate listing execution because it preserves context after a long Discovery Engine phase sequence.

## Gemini Review Questions

1. Is this current-state inventory accurate and safe enough as a docs-only Phase 25B plan?
2. Are the hard boundaries sufficiently strict for Discovery Engine re-entry?
3. Is the recommended Phase 25C current-state map/risk-register documentation safer than immediately planning a live read?
4. Should Phase 25C remain docs-only before any executable Discovery Engine gate?
5. Are any additional risks or missing inventory categories important before proceeding?

## Result Decision

```text
phase_25b_current_state_inventory_result=READY_FOR_GEMINI_REVIEW
recommended_next_phase=Phase 25C — Discovery Engine Current-State Map and Risk Register Documentation
```

## Safety Notes

This Phase 25B document is docs-only. It does not introduce source behavior changes, API changes, admin writes, direct database access, live database reads, database mutations, candidate decisions, `approve_for_draft`, extraction, crawler execution, LLM extraction, evidence acquisition, public tools writes, schema/migration/typegen changes, package changes, lockfile changes, commits, pushes, or Discovery Engine operational reactivation.
