# Discovery Phase 25DB — Operational Reactivation Preflight Design Gate

## Status

Documentation-only preflight design gate.

Phase 25DB follows Phase 25DA, which proposed the first reactivation planning target as an admin-only, no-write operational readiness preflight.

Phase 25DB does not execute the preflight.

Phase 25DB does not reactivate Discovery Engine operations.

Phase 25DB does not run live inspections.

Phase 25DB does not modify source code, schema, packages, generated types, or configuration.

## Scope

This phase designs the future no-write operational readiness preflight.

Allowed in this phase:

- Define the future preflight target.
- Define exact allowed and prohibited behavior.
- Define expected command shape for a future execution gate.
- Define expected result package shape.
- Define stop conditions.
- Define rollback and halt behavior.
- Define the approval gate that must come before execution.
- Preserve operational reactivation as blocked.

Not allowed in this phase:

- No operational execution.
- No operational reactivation.
- No live inspection rerun.
- No verifier execution.
- No Supabase CLI.
- No psql.
- No SQL command.
- No broad environment scanning.
- No environment value printing.
- No source code changes.
- No inspection harness changes.
- No API changes.
- No UI changes.
- No schema changes.
- No migration changes.
- No package or lockfile changes.
- No generated type changes.
- No DB mutation.
- No public tools writes.
- No discovered_tools writes.
- No candidate extraction.
- No candidate staging.
- No candidate decision execution.
- No approve_for_draft.
- No public publishing.

## Baseline

Phase 25DB starts after Phase 25DA was committed and pushed:

```text
HEAD=4dee1c0 Document Phase 25DA reactivation scope rollback plan
HEAD full=4dee1c0dc77e43ebcef3019d1a57ce5bb73e4152
branch=main
origin=https://github.com/jcdumaua/aifinder.git
```

Phase 25DA proposed:

```text
target=admin_only_no_write_operational_readiness_preflight
mutation_allowed=false
public_surface_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
```

## Future preflight target

Phase 25DB designs the future preflight as:

```text
future_preflight_target=admin_only_no_write_operational_readiness_preflight
future_execution_mode=local_static_plus_build_preflight
live_db_read_allowed=false
admin_api_invocation_allowed=false
local_server_startup_allowed=false
mutation_allowed=false
public_surface_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
```

This deliberately keeps the first operational readiness preflight below live operational execution.

The future preflight may inspect local tracked source files and run the existing project check command, but it must not start the app, call admin APIs, query the live database, or invoke Discovery Engine operational workflows.

## Candidate source surface

The future preflight should focus only on existing tracked Discovery/admin read-surface files.

The local inventory generated during Phase 25DB preparation is included below as planning evidence.

```text
Tracked Discovery/admin candidate inventory
values_printed=false

candidate_paths:
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
lib/discovery-bounded-html-acquisition.ts
lib/discovery-candidate-normalizer.ts
lib/discovery-fetch-adapter.ts
lib/discovery-manual-crawler.ts
lib/discovery-manual-metadata-fetch.ts
lib/discovery-request-plan.ts
lib/discovery-run-results-review.ts
lib/discovery-static-html-evidence-audit-review.ts
lib/discovery-static-html-evidence-executor.ts
lib/discovery-static-html-evidence-results-review.ts
lib/discovery-static-html-evidence.ts
lib/discovery-url-safety.ts
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
testing/discovery-read-only-live-inspection.mjs
testing/discovery-read-only-runtime-verification.mjs
testing/discovery-request-plan.test.mjs
testing/discovery-run-results-review.test.mjs
testing/discovery-static-html-evidence-audit-review.test.mjs
testing/discovery-static-html-evidence-executor.test.mjs
testing/discovery-static-html-evidence-results-review.test.mjs
testing/discovery-static-html-evidence.test.mjs
testing/discovery-supabase-admin-noop-smoke.test.mjs
testing/discovery-url-safety.test.mjs
```

If the future execution gate needs a narrower list than this inventory, Phase 25DC must define it before execution approval.

## Future execution command shape

A future execution gate should be generated only after Phase 25DC approval.

The future execution gate should be bound to the committed Phase 25DC approval-gate HEAD and subject.

The future execution gate should run local checks only.

Expected future command categories:

```text
git fetch origin main --quiet
git status --short --branch
git rev-parse HEAD
git log -1 --pretty=%s
git ls-files
grep fixed allowlist/prohibited markers in tracked files
npm run check
```

The future execution gate must not run:

```text
supabase
psql
SQL
next dev
next start
curl app routes
browser automation
admin API calls
crawler execution
extraction execution
LLM execution
candidate staging
candidate decision execution
approve_for_draft
public publishing
```

## Future preflight checks

The future preflight should verify:

1. Branch is `main`.
2. Origin matches `jcdumaua/aifinder`.
3. HEAD matches the Phase 25DC approval gate.
4. Working tree is clean.
5. Required environment names are present without printing values.
6. Local env loading reads only the required names.
7. Candidate source inventory contains only tracked files.
8. Admin-only and no-write target markers are present in the approved plan.
9. Prohibited operational markers are not executed.
10. `npm run check` passes.
11. No tracked files change during execution.
12. The result package contains no secret-like output.

## Future result package shape

The future execution gate must produce a non-secret result package with:

```text
execution_status=PASSED|CONTROLLED_NON_PASSING|SAFE_FAILURE
execution_count=1
expected_head=<Phase 25DC committed HEAD>
expected_subject=<Phase 25DC committed subject>
future_preflight_target=admin_only_no_write_operational_readiness_preflight
future_execution_mode=local_static_plus_build_preflight
live_db_read_allowed=false
admin_api_invocation_allowed=false
local_server_startup_allowed=false
mutation_allowed=false
public_surface_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
npm_check_status=passed|failed|not_run
final_git_status=<non-secret status>
values_printed=false
```

## Stop conditions

The future execution gate must stop if:

- Branch is not `main`.
- HEAD or subject does not match the committed approval gate.
- Origin does not match the expected repository.
- Working tree is not clean at start.
- Required environment names are missing after safe local env loading.
- Any environment value would be printed.
- Any unapproved `AIFINDER_RUN_DISCOVERY_*` variable is present.
- Any live database access is attempted.
- Any admin API route is invoked.
- Any local server startup is attempted.
- Any crawler, extraction, LLM, candidate, decision, or publishing path is invoked.
- Any file changes during execution.
- Any secret-like output is detected.

## Rollback and halt behavior

Because the future preflight is no-write and local-only, rollback remains containment and halt:

1. Stop immediately on boundary violation.
2. Do not retry.
3. Do not push.
4. Do not commit.
5. Copy only a safe failure package if secret-like output is detected.
6. Preserve operational reactivation as blocked.
7. Require a result review phase after any execution attempt.

## Approval requirement

Phase 25DB does not define an execution approval phrase.

The exact approval phrase must be defined later in Phase 25DC.

Phase 25DC must remain documentation-only and must bind the future execution to the committed Phase 25DC HEAD and subject.

## Required next phases

The next phase should be:

```text
Phase 25DC — Operational Reactivation Preflight Approval Gate
```

After Phase 25DC is approved, committed, and pushed, only then may a future execution gate be generated.

The later execution phase should be:

```text
Phase 25DD — Bounded Operational Reactivation Preflight Execution Gate
```

After any Phase 25DD execution, the required result review phase should be:

```text
Phase 25DE — Operational Reactivation Preflight Result Review Gate
```

## Reactivation decision

Operational reactivation remains blocked.

Reasons:

- Phase 25DB is design-only.
- No preflight approval phrase has been defined.
- No execution script has been approved.
- No operational preflight has been executed.
- No operational result review exists.
- No candidate pipeline, public publishing, DB mutation, or operational workflow has been approved.

## Phase 25DB conclusion

Phase 25DB designs the first no-write operational readiness preflight.

The future preflight is intentionally limited to local static and build checks.

It does not authorize operational reactivation.

It does not authorize live database access.

It does not authorize admin API invocation.

It does not authorize local server startup.

It does not authorize candidate extraction, staging, decision execution, approve_for_draft, or publishing.

Discovery Engine operational reactivation remains blocked.

## Gemini approval

Gemini reviewed Phase 25DB and returned:

```text
STATUS: APPROVED
```

Gemini confirmed:

- Phase 25DB remains documentation-only.
- `local_static_plus_build_preflight` is safer than live admin/API/DB checks as the first operational readiness preflight.
- The phase correctly prohibits local server startup, admin API invocation, live database reads, mutations, candidate pipeline activity, and publishing.
- Stop conditions, containment-based rollback, and non-secret result package constraints are comprehensive.
- Operational reactivation remains blocked.
- Phase 25DC is the correct next approval gate.

Phase 25DB is ready for commit after James approval.
