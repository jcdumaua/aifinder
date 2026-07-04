# Phase 25C — Discovery Engine Current-State Map and Risk Register Documentation
## Boundary

This Phase 25C document is a docs-only planning and risk-register artifact. It preserves the following limits:

- Docs-only planning document creation.
- Read-only repository inspection.
- No source edits.
- No API edits.
- No admin writes.
- No direct DB access.
- No live DB reads.
- No DB mutation.
- No candidate decision execution.
- No approve_for_draft.
- No extraction execution.
- No crawler execution.
- No LLM extraction execution.
- No evidence acquisition.
- No public tools writes.
- No schema/migration/typegen changes.
- No package installs.
- No package/lockfile changes.
- No commit.
- No push.


## Status

Drafted for Gemini review.

## Phase purpose

Phase 25C documents the Discovery Engine current-state map and risk register before any next executable gate, runtime verification gate, live database check, candidate decision operation, or public publishing step.

This phase converts the Phase 25B inventory into a decision-support document that separates what is already implemented, what is only planned or documented, what remains blocked, and which risks must stay visible before the next phase.

## Baseline terminal context

- Repository: `/Users/jamescarlodumaua/aifinder`
- Branch: `main`
- Baseline HEAD at doc creation: `cb09144`
- Baseline subject: `Document Discovery Engine current-state inventory`
- Synchronized with `origin/main`: yes
- Discovery/phase docs inspected: `246`
- Discovery-related testing scripts inspected: `38`
- `lib/discovery` files inspected: `12`
- Admin discovery API files inspected: `15`
- Opt-in execution marker lines observed: `38`

## Safety boundary

Allowed in Phase 25C:

- Create this documentation file.
- Map existing Discovery Engine lanes at a documentation level.
- Register risks and mitigations for the next safe phase.
- Run repository checks.
- Prepare a Gemini review package.

Forbidden in Phase 25C:

- No source changes.
- No API changes.
- No UI changes.
- No package or lockfile changes.
- No schema, migration, or type generation changes.
- No live database reads.
- No DB mutation.
- No candidate decision execution.
- No `approve_for_draft`.
- No public `tools` writes.
- No `discovered_tools` writes.
- No commit until Gemini review and explicit James approval.
- No push until a committed phase receives explicit James approval.

## Current-state map

### 1. Governance and phase-control lane

Current state:

- Discovery Engine work is controlled by named phase gates.
- Terminal output is treated as the source of truth.
- Gemini review is required before commits for review-sensitive phases.
- Human approval remains required before commit and push.
- Docs-only phases remain distinct from executable script phases and live smoke phases.

Operational meaning:

- The Discovery Engine is not blocked by missing process discipline.
- The main risk is process drift: accidentally treating a planning document as implementation approval.

Required guard:

- Every future phase must continue to state allowed scope, forbidden scope, verification commands, and whether live data access or mutation is forbidden.

### 2. Discovery run and source intake lane

Current state:

- Discovery run concepts, manual crawler/executor boundaries, and admin review workflows have been progressively documented and implemented in constrained gates.
- Earlier phases established controlled run claim behavior and metadata/static evidence acquisition boundaries.
- Current docs indicate that intake and review lanes exist, but each live operation still depends on explicit phase approval and opt-in controls.

Operational meaning:

- The project has moved beyond pure concept design.
- The lane remains safety-sensitive because source intake can easily expand into crawler automation, evidence acquisition, candidate extraction, or live database mutation.

Required guard:

- Keep intake phases read-only or opt-in unless a phase explicitly authorizes a narrow execution path.

### 3. URL safety and acquisition lane

Current state:

- URL safety, request planning, bounded acquisition, and fetch adapter concepts have been previously implemented or documented across earlier Discovery Engine phases.
- Static evidence acquisition was treated separately from candidate extraction and public publishing.
- The acquisition lane is not permission to run broad crawling.

Operational meaning:

- The project has the early building blocks for controlled evidence capture.
- The major risk is scope creep from one-source evidence acquisition into broad external crawling.

Required guard:

- Any acquisition phase must state exact source count, exact opt-in marker, expected network behavior, and cleanup expectations.

### 4. Evidence and review lane

Current state:

- Admin-facing review concepts and read-only result review have been developed through earlier phases.
- Evidence handling has been intentionally separated from candidate staging and candidate approval.
- Review UI/read routes should not be treated as proof that candidate extraction or decision execution is approved.

Operational meaning:

- The evidence/review lane is useful for human oversight.
- It still needs clear separation from mutation-capable lanes.

Required guard:

- Review endpoints and UI controls must remain read-only unless a future phase explicitly authorizes a controlled write.

### 5. Candidate extraction and staging lane

Current state:

- Candidate extraction and staging have been designed and tested through controlled phases.
- The staging pipeline has used opt-in smoke execution and documented live smoke results.
- Candidate staging is separate from public `tools` publishing.
- Candidate status and audit boundaries have been repeatedly documented.

Operational meaning:

- Candidate staging appears mature enough for controlled internal workflow evolution.
- It is not equivalent to public publishing.

Required guard:

- Future phases must preserve insert-only or explicitly approved mutation scope.
- No public write path should be introduced through a staging phase.

### 6. Candidate queue and read-only candidate listing lane

Current state:

- Candidate queue and read-only candidate listing work has been separated into planning and implementation gates.
- Read-only scripts exist or have been documented for candidate listing/aggregate inspection.
- These scripts should not select, approve, reject, mutate, or publish candidates.

Operational meaning:

- The queue visibility lane is suitable for more operational reporting.
- It remains risky if a future phase combines queue visibility with decision execution.

Required guard:

- Keep listing/aggregate scripts read-only.
- Any future decision action must be isolated in a separate, explicitly approved phase.

### 7. Candidate decision and approval lane

Current state:

- Candidate decision UI controls and live smoke results have been documented through multiple safety gates.
- Cleanup planning and smoke-result documentation are part of the record.
- Approval phrases and mutation boundaries remain highly sensitive.

Operational meaning:

- Decision flow is one of the highest-risk lanes because it can move staged candidates toward draft approval or public readiness.
- Documentation exists, but operational execution must remain gated.

Required guard:

- No candidate decision execution without explicit phase name, exact command, exact target candidate UUID, exact approval phrase, and post-run verification.

### 8. Public publishing lane

Current state:

- Public publishing remains forbidden in the current Discovery Engine control sequence.
- Candidate staging and candidate decisions must not be conflated with public `tools` writes.
- No Phase 25C work authorizes production publishing.

Operational meaning:

- The public site remains protected from accidental Discovery Engine write-through.
- The risk is indirect publishing through helper reuse or relaxed admin controls.

Required guard:

- Future phases must continue to state: no public `tools` writes and no `discovered_tools` writes unless explicitly authorized.

### 9. Schema, migration, and type-generation lane

Current state:

- Prior phases included migration drafting and apply gates.
- Phase 25C does not inspect or modify schema state.
- No type generation is authorized here.

Operational meaning:

- Schema work is separate from documentation mapping.
- Risk increases if runtime scripts assume columns, constraints, or types not verified in the current phase.

Required guard:

- Any schema-dependent executable phase must include a dedicated preflight and must not silently run migrations or typegen.

### 10. Stabilization and completion lane

Current state:

- Recent phases have moved toward stabilization, current-state inventory, and next-safe-scope planning.
- Phase 25B produced the current-state inventory.
- Phase 25C turns that inventory into risk-aware execution guidance.

Operational meaning:

- The Discovery Engine is close to operational maturity, but the remaining work is about controlled sequencing rather than broad feature expansion.
- The safest next phases should convert this map into one bounded verification or planning step at a time.

Required guard:

- Do not jump directly from current-state documentation to mutation-capable runtime work.

## Risk register

| ID | Risk | Impact | Likelihood | Current control | Required mitigation before next risky phase |
|---|---|---:|---:|---|---|
| R1 | Phase stacking on top of an unpushed local commit | High | Medium | Repo ahead/behind preflight | Require synced `main...origin/main` before creating new phase docs or commits |
| R2 | Docs-only phase accidentally changes source/API/UI files | High | Low | Git diff path verification | Verify only the Phase 25C doc changed before review |
| R3 | Candidate decision execution occurs during mapping work | Critical | Low | Explicit forbidden scope | Do not run any decision script, approval phrase, or candidate UUID command in Phase 25C |
| R4 | Staging is mistaken for public publishing readiness | Critical | Medium | Repeated public-write prohibition | Keep candidate staging, decision, and public publishing as separate lanes |
| R5 | Live DB read or mutation occurs through an inspection command | High | Low | Terminal command review | Use file/repo inspection only; no Supabase SQL, no DB push, no live smoke |
| R6 | Opt-in smoke markers are triggered accidentally | High | Medium | Env-marker inspection | Do not export `AIFINDER_RUN_DISCOVERY_*` variables unless a future phase explicitly requires them |
| R7 | Crawler/acquisition scope creeps beyond one bounded source | High | Medium | Acquisition lane separation | Future acquisition phases must define source count, URL boundary, timeout, and no-extraction boundary |
| R8 | Evidence review is treated as extraction approval | Medium | Medium | Lane separation | Require a separate extraction/staging approval gate |
| R9 | Queue listing scripts become mutation scripts | High | Medium | Read-only script boundary | Keep aggregate/listing scripts read-only and separately review any write-capable script |
| R10 | Candidate cleanup planning is mistaken for cleanup execution | High | Medium | Documentation-only wording | Cleanup execution must require exact row/UUID, exact command, and explicit approval |
| R11 | Schema assumptions drift from live database state | High | Medium | Migration/typegen separation | Add schema preflight only in a dedicated future phase, not in Phase 25C |
| R12 | Package or lockfile changes enter a docs phase | Medium | Low | Package diff guard | Fail verification if package or lockfile changes appear |
| R13 | Admin UI review state is mistaken for production workflow completeness | Medium | Medium | Current-state map | Distinguish UI visibility from runtime authorization |
| R14 | Raw terminal evidence is lost after failure | Medium | Medium | `tee` and clipboard cleanup | Always copy raw terminal output even on script failure |
| R15 | Current-state map becomes stale as soon as next implementation phase lands | Medium | High | Phase-specific documentation | Update or supersede this map after the next executable implementation or live smoke phase |
| R16 | Gemini approval is skipped because the phase is docs-only | Medium | Low | Review package generation | Require Gemini review before commit because this doc guides future risk decisions |

## Next safe phase options

### Option A — Phase 25D: Current-State Map Gemini Review / Commit Gate

Purpose:

- Have Gemini review this Phase 25C map and risk register.
- Confirm the document accurately separates implemented, planned, blocked, and forbidden work.
- Commit only this documentation file after Gemini approval and explicit James approval.

Allowed:

- Review this doc.
- Apply documentation corrections only if Gemini identifies inaccuracies.
- Commit after explicit James approval.

Forbidden:

- No executable script changes.
- No source/API/UI changes.
- No DB work.
- No candidate operation.
- No push without explicit James approval.

### Option B — Phase 25D: Read-Only Runtime Verification Gate Planning

Purpose:

- Plan a future read-only script that verifies file-level and route-level Discovery Engine state without live DB access.

Allowed:

- Documentation-only plan.
- Exact command design.
- Expected output contract.

Forbidden:

- No script implementation yet.
- No live DB read.
- No mutation.

### Option C — Phase 25D: Candidate Queue Aggregate Verification Script Planning

Purpose:

- Continue toward bounded read-only operational reporting from the queue lane.

Allowed:

- Documentation-only script planning.

Forbidden:

- No candidate selection.
- No candidate decision.
- No mutation.

## Recommendation

Choose Option A first.

Reason:

Phase 25C is a control document that will influence the next implementation lane. It should be reviewed and committed before the project adds another executable Discovery Engine gate.

## Discovery Engine progress estimate

Discovery Engine progress remains **99%** after Phase 25C drafting.

Reason:

This phase improves safety, sequencing, and operational clarity, but it does not add a new runtime capability, live smoke result, public publishing path, or production mutation path.

## Terminal inspection appendix

### Recent Discovery/phase documentation files

```text
docs/discovery-phase-6w-real-fetch-boundary-plan.md
docs/discovery-phase-6x-fetch-only-adapter-implementation-plan.md
docs/discovery-phase-6z-authenticated-metadata-fetch-smoke-plan.md
docs/discovery-phase-7a-manual-metadata-fetch-executor-design.md
docs/discovery-phase-7b-manual-metadata-fetch-executor-implementation-plan.md
docs/discovery-phase-7d-manual-metadata-fetch-results-review-design.md
docs/discovery-phase-7e-manual-metadata-fetch-results-review-implementation-plan.md
docs/discovery-phase-7g-metadata-fetch-review-scalability-hardening-plan.md
docs/discovery-phase-7h-manual-metadata-fetch-interpretation-boundary-design.md
docs/discovery-phase-7i-future-extraction-evidence-model-design.md
docs/discovery-phase-7j-future-extraction-acquisition-policy-design.md
docs/discovery-phase-7k-static-html-derived-evidence-prototype-design.md
docs/discovery-phase-7l-static-html-derived-evidence-implementation-plan.md
docs/discovery-phase-7n-static-html-evidence-executor-wiring-readiness-gate.md
docs/discovery-phase-7o-bounded-html-acquisition-contract-design.md
docs/discovery-phase-7p-bounded-html-acquisition-adapter-implementation-plan.md
docs/discovery-phase-7r-static-html-evidence-executor-wiring-plan.md
docs/discovery-phase-7t-static-html-evidence-admin-review-ui-plan.md
docs/discovery-phase-7v-static-html-evidence-end-to-end-smoke-test-plan.md
docs/discovery-phase-7x-static-html-evidence-smoke-test-results.md
docs/discovery-phase-7y-static-html-evidence-capability-closure-decision-gate.md
docs/discovery-phase-7z-static-evidence-audit-timeline-ui-plan.md
docs/discovery-phase-8a-static-evidence-audit-timeline-api-ui-implementation-plan.md
docs/discovery-phase-8c-static-evidence-audit-timeline-smoke-test-documentation.md
docs/discovery-phase-8d-static-evidence-capability-closure-next-phase-decision-gate.md
docs/discovery-phase-8e-candidate-extraction-readiness-gate-staging-contract-design.md
docs/discovery-phase-8f-candidate-extraction-contract-review-schema-decision-plan.md
docs/discovery-phase-8g-candidate-extraction-schema-migration-implementation-plan.md
docs/discovery-phase-8h-candidate-extraction-staging-table-migration-sql-draft-review-gate.md
docs/discovery-phase-8j-staging-candidate-lifecycle-normalization-implementation-plan.md
docs/discovery-phase-8k-candidate-normalizer-implementation-plan-test-design.md
docs/discovery-phase-8m-candidate-staging-migration-apply-generated-types-review-plan.md
docs/discovery-phase-8n-migration-apply-generated-types-target-discovery.md
docs/discovery-phase-8p-typed-supabase-client-integration-plan.md
docs/discovery-phase-8r-dedicated-typed-discovery-admin-helper-plan.md
docs/discovery-phase-8t-typed-discovery-client-no-op-smoke-test-plan.md
docs/discovery-phase-8v-discovery-admin-interface-design.md
docs/discovery-phase-8w-candidate-staging-admin-method-implementation-plan.md
docs/discovery-phase-8y-candidate-staging-admin-live-smoke-test-plan.md
docs/discovery-phase-9b-candidate-staging-live-smoke-result.md
docs/discovery-phase-9c-candidate-staging-smoke-hardening-rls-security-planning.md
docs/discovery-phase-9d-candidate-staging-rls-smoke-planning.md
docs/discovery-phase-9f-candidate-staging-rls-smoke-execution-approval-gate.md
docs/discovery-phase-9h-candidate-staging-rls-smoke-result.md
docs/discovery-phase-9i-candidate-staging-rls-security-closure-next-gate-planning.md
docs/discovery-phase-9j-candidate-staging-schema-audit-expansion-planning.md
docs/discovery-phase-9k-candidate-staging-schema-audit-expansion-implementation-plan.md
docs/discovery-phase-9m-candidate-staging-schema-audit-expansion-apply-gate.md
docs/discovery-phase-9n-candidate-staging-schema-audit-expansion-apply-type-generation-result.md
docs/discovery-phase-9o-candidate-staging-helper-mapping-update-plan.md
docs/discovery-phase-9q-post-schema-rls-smoke-planning-execution-gate.md
docs/discovery-phase-9s-post-schema-rls-smoke-execution-result.md
docs/phase-23a-product-bucket-transition-planning-gate.md
docs/phase-23b-visual-identity-homepage-upgrade-planning-gate.md
docs/phase-23c-visual-identity-brand-homepage-design-gate.md
docs/phase-23d-homepage-visual-upgrade-implementation-plan.md
docs/phase-23g-homepage-visual-upgrade-qa-accessibility-result.md
docs/phase-24b-production-deployment-verification-result.md
docs/phase-25a-discovery-engine-reentry-readiness-gate.md
docs/phase-25b-discovery-engine-current-state-inventory-next-safe-scope-plan.md
```

### Discovery testing scripts

```text
testing/discovery-bounded-html-acquisition.test.mjs
testing/discovery-candidate-decision-admin-ui.test.mjs
testing/discovery-candidate-decision-api-static-assertions.mjs
testing/discovery-candidate-decision-execution-preflight.mjs
testing/discovery-candidate-decision-read-only-listing-gate.mjs
testing/discovery-candidate-extraction-dry-run-panel.test.mjs
testing/discovery-candidate-extraction-invocation-route.test.mjs
testing/discovery-candidate-extraction-invocation.test.mjs
testing/discovery-candidate-extraction-live-staging-panel.test.mjs
testing/discovery-candidate-extraction-mapper.test.mjs
testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs
testing/discovery-candidate-extraction-staging-pipeline.test.mjs
testing/discovery-candidate-normalizer.test.mjs
testing/discovery-candidate-preview-live-staging-resolver.test.mjs
testing/discovery-candidate-preview-provider.test.mjs
testing/discovery-candidate-preview-route.test.mjs
testing/discovery-candidate-queue-aggregate-bucket-breakdown.mjs
testing/discovery-candidate-queue-fail-closed-presentation-smoke.mjs
testing/discovery-candidate-queue-fail-closed-ui-wiring-smoke.mjs
testing/discovery-candidate-staging-admin.test.mjs
testing/discovery-candidate-staging-live-smoke.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
testing/discovery-candidate-staging-queue-cursor.test.mjs
testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs
testing/discovery-candidate-staging-queue-read-model.test.mjs
testing/discovery-candidate-staging-rls-smoke.mjs
testing/discovery-fetch-adapter.test.mjs
testing/discovery-manual-metadata-fetch.test.mjs
testing/discovery-other-bucket-bounded-read-only-inspection.mjs
testing/discovery-request-plan.test.mjs
testing/discovery-run-results-review.test.mjs
testing/discovery-static-html-evidence-audit-review.test.mjs
testing/discovery-static-html-evidence-executor.test.mjs
testing/discovery-static-html-evidence-results-review.test.mjs
testing/discovery-static-html-evidence.test.mjs
testing/discovery-supabase-admin-noop-smoke.test.mjs
testing/discovery-url-safety.test.mjs
```

### lib/discovery files

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

### Admin discovery API files

```text
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
```

### Opt-in execution marker sample

```text
docs/discovery-phase-10c-candidate-extraction-mapper-implementation-plan.md:AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1
docs/discovery-phase-10f-candidate-extraction-staging-pipeline-integration-plan.md:AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1
docs/discovery-phase-10h-candidate-extraction-staging-pipeline-smoke-gate-plan.md:AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1
docs/discovery-phase-10h-candidate-extraction-staging-pipeline-smoke-gate-plan.md:AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1 node testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs
docs/discovery-phase-10l-candidate-extraction-staging-pipeline-live-smoke-result.md:AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1 node testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs
docs/discovery-phase-10m-candidate-extraction-staging-pipeline-production-integration-readiness-gate.md:- The smoke harness avoids environment loading, DB client creation, and DB operations unless `AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1` is set.
docs/discovery-phase-10m-candidate-extraction-staging-pipeline-production-integration-readiness-gate.md:This phase also does not rerun the live smoke and does not set `AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1`.
docs/discovery-phase-10s-candidate-extraction-invocation-api-route-live-verification-result.md:AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1
docs/discovery-phase-10s-candidate-extraction-invocation-api-route-live-verification-result.md:AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1
docs/discovery-phase-10w-candidate-extraction-admin-ui-dry-run-panel-post-implementation-review-live-dry-run-gate.md:- `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1` was not set.
docs/discovery-phase-10w-candidate-extraction-admin-ui-dry-run-panel-post-implementation-review-live-dry-run-gate.md:- `AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1` was not set.
docs/discovery-phase-11e-candidate-extraction-manual-live-staging-verification-result.md:AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1 node testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs
docs/discovery-phase-12a-candidate-extraction-api-admin-ui-live-staging-enablement-design-gate.md:AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE=1 node testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs
docs/discovery-phase-19n-candidate-decision-mutation-api-implementation-plan.md:AIFINDER_RUN_DISCOVERY_CANDIDATE_DECISION_API_SMOKE=1
docs/discovery-phase-19v-candidate-decision-mutation-api-live-smoke-result.md:AIFINDER_RUN_DISCOVERY_CANDIDATE_DECISION_API_SMOKE=1 accepted
docs/discovery-phase-9b-candidate-staging-live-smoke-result.md:AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_LIVE_SMOKE=1 npm run smoke:discovery-candidate-staging:live
docs/discovery-phase-9d-candidate-staging-rls-smoke-planning.md:AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1
docs/discovery-phase-9d-candidate-staging-rls-smoke-planning.md:AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1 npm run smoke:discovery-candidate-staging:rls
docs/discovery-phase-9f-candidate-staging-rls-smoke-execution-approval-gate.md:   AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1
docs/discovery-phase-9f-candidate-staging-rls-smoke-execution-approval-gate.md:- set `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1`;
docs/discovery-phase-9f-candidate-staging-rls-smoke-execution-approval-gate.md:AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1
docs/discovery-phase-9f-candidate-staging-rls-smoke-execution-approval-gate.md:AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1 npm run smoke:discovery-candidate-staging:rls
docs/discovery-phase-9f-candidate-staging-rls-smoke-execution-approval-gate.md:The final command is opt-out only unless `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1` is explicitly set. In preflight it should confirm:
docs/discovery-phase-9h-candidate-staging-rls-smoke-result.md:AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1 npm run smoke:discovery-candidate-staging:rls
docs/discovery-phase-9j-candidate-staging-schema-audit-expansion-planning.md:- `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1` was not set.
docs/discovery-phase-9j-candidate-staging-schema-audit-expansion-planning.md:- set `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1`.
docs/discovery-phase-9k-candidate-staging-schema-audit-expansion-implementation-plan.md:- `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1` was not set.
docs/discovery-phase-9m-candidate-staging-schema-audit-expansion-apply-gate.md:- `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1` was not set.
docs/discovery-phase-9m-candidate-staging-schema-audit-expansion-apply-gate.md:This phase performs local inspection and safe read-only remote schema inspection only. It does not apply the migration, run `supabase db push`, mutate the database, insert/update/delete rows, regenerate Supabase types, modify source code, modify tests, modify helpers, modify smoke scripts, modify package scripts, add API/UI/extraction/crawler/LLM integration, write to `public.tools`, write to `discovered_tools`, add audit event writes, run the live RLS smoke, or set `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1`.
docs/discovery-phase-9n-candidate-staging-schema-audit-expansion-apply-type-generation-result.md:- `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1` was not set.
docs/discovery-phase-9o-candidate-staging-helper-mapping-update-plan.md:AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1
docs/discovery-phase-9q-post-schema-rls-smoke-planning-execution-gate.md:AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1
docs/discovery-phase-9q-post-schema-rls-smoke-planning-execution-gate.md:AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1 npm run smoke:discovery-candidate-staging:rls
docs/discovery-phase-9s-post-schema-rls-smoke-execution-result.md:AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1 npm run smoke:discovery-candidate-staging:rls
testing/discovery-candidate-extraction-staging-pipeline-smoke.mjs:const OPT_IN_ENV = "AIFINDER_RUN_DISCOVERY_EXTRACTION_STAGING_PIPELINE_SMOKE";
testing/discovery-candidate-staging-live-smoke.mjs:const OPT_IN_ENV = "AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_LIVE_SMOKE";
testing/discovery-candidate-staging-rls-smoke.mjs:const OPT_IN_ENV = "AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE";
testing/discovery-other-bucket-bounded-read-only-inspection.mjs:const RUN_ENV = "AIFINDER_RUN_DISCOVERY_OTHER_BUCKET_BOUNDED_READ_ONLY_INSPECTION";
```

## Review checklist

Before commit, verify:

- [ ] Gemini confirms the map is accurate enough for next-phase planning.
- [ ] Gemini confirms the risk register does not accidentally authorize execution.
- [ ] Only this file is changed.
- [ ] `git diff --check` passes.
- [ ] `npm run check` passes.
- [ ] No package or lockfile changed.
- [ ] No source/API/UI/schema/migration/typegen file changed.
- [ ] James explicitly approves commit.
- [ ] James separately approves push after commit.
