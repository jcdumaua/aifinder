# Discovery Phase 25DH — Admin-Only No-Write Route Static Inspection Approval Gate

## Status

Documentation-only approval gate.

Phase 25DH follows Phase 25DG, which designed a future static inspection of tracked admin Discovery route files.

Phase 25DH defines the exact approval phrase and execution constraints for a future Phase 25DI static route inspection.

Phase 25DH does not execute the static route inspection.

Phase 25DH does not invoke routes.

Phase 25DH does not start a local server.

Phase 25DH does not query the live database.

Phase 25DH does not reactivate Discovery Engine operations.

Phase 25DH does not modify source code, schema, packages, generated types, or configuration.

## Scope

Allowed in this phase:

- Define the exact future approval phrase for Phase 25DI.
- Bind future Phase 25DI generation to the committed Phase 25DH HEAD and subject.
- Preserve the route inventory binding requirement.
- Define future allowed static commands.
- Define future prohibited commands.
- Define future classification and result package requirements.
- Preserve operational reactivation as blocked.

Not allowed in this phase:

- No static route inspection execution.
- No operational execution.
- No operational reactivation.
- No route invocation.
- No local server startup.
- No live database read.
- No deployed route call.
- No browser automation.
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

Phase 25DH starts after Phase 25DG was committed and pushed:

```text
HEAD=a1a4506 Document Phase 25DG route static inspection design
HEAD full=a1a45061d5aa4d28f998ff2a9d9d64bf34c1ebb2
branch=main
origin=https://github.com/jcdumaua/aifinder.git
```

Phase 25DG designed:

```text
future_static_inspection_target=admin_discovery_route_files
future_static_inspection_scope=tracked_admin_discovery_route_files_only
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
operational_reactivation_status=blocked
```

## Future Phase 25DI approval requirement

Phase 25DI must not run unless James provides this exact phrase:

```text
Approve Phase 25DI admin-only no-write route static inspection execution exactly once
```

No shortened phrase, paraphrase, or implied approval is sufficient.

The approval must occur after Phase 25DH is reviewed, approved, committed, and pushed.

## Future Phase 25DI expected HEAD rule

The Phase 25DI execution gate must use the committed Phase 25DH HEAD as its expected HEAD.

Because Phase 25DH is not committed yet while this document is being drafted, the future Phase 25DI execution script must be generated only after Phase 25DH commit and push completes.

The future execution script must hardcode:

- Expected branch: `main`
- Expected remote: `https://github.com/jcdumaua/aifinder.git`
- Expected HEAD: the Phase 25DH commit SHA
- Expected subject: the Phase 25DH commit subject
- Required future static inspection target: `admin_discovery_route_files`
- Required future static inspection scope: `tracked_admin_discovery_route_files_only`

## Bound route inventory for future Phase 25DI

The future Phase 25DI execution must bind to a route inventory captured from tracked git files.

The current planning inventory is:

```text
Tracked admin Discovery route inventory
values_printed=false

bound_route_paths_for_future_phase_25di:
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

If the route inventory changes after Phase 25DH is committed, Phase 25DI must stop unless a new approval gate explicitly updates the binding.

## Future Phase 25DI allowed behavior

Phase 25DI may execute exactly one local static route inspection if and only if the exact approval phrase is provided.

Allowed future behavior:

- Validate expected branch, origin, HEAD, and subject.
- Validate the working tree is clean.
- Safely load only required environment names from local env files without printing values.
- Validate required environment names are present without printing values.
- Confirm no unexpected `AIFINDER_RUN_DISCOVERY_*` variables are set.
- Inspect tracked route files under `app/api/admin/discovery`.
- Use only local static commands such as `git ls-files`, `grep`, `awk`, `sed`, and `npm run check`.
- Search for mutation and operational execution markers.
- Classify each bound route as read-only candidate, mutation-capable excluded, operational execution capable excluded, ambiguous excluded pending manual review, or out of scope.
- Verify no tracked or untracked file changes occurred during execution.
- Produce a non-secret result package.
- Copy only the non-secret result package to clipboard.

## Future Phase 25DI prohibited behavior

Phase 25DI must not:

- Run more than once.
- Invoke routes.
- Start a local server.
- Call deployed routes.
- Call admin APIs.
- Call public routes.
- Import route modules for execution.
- Instantiate route handlers.
- Execute browser automation.
- Execute crawler code.
- Execute extraction code.
- Execute LLM code.
- Execute candidate staging.
- Execute candidate decisions.
- Execute approve_for_draft.
- Write public tools.
- Write discovered_tools.
- Query the live database.
- Mutate the database.
- Run Supabase CLI.
- Run psql.
- Execute SQL directly.
- Print raw environment values.
- Print keys, tokens, credentials, or database URLs.
- Print raw row payloads.
- Reactivate operations.

## Future Phase 25DI required classifications

Every inspected route must receive exactly one classification:

\`\`\`text
static_classification=read_only_candidate
static_classification=mutation_capable_excluded
static_classification=operational_execution_capable_excluded
static_classification=ambiguous_excluded_pending_manual_review
static_classification=out_of_scope
\`\`\`

A route may be treated as `read_only_candidate` only if the static inspection finds no unclassified mutation or operational execution markers.

A route with any ambiguous marker must be excluded pending manual review.

## Future Phase 25DI stop conditions

Phase 25DI must stop if:

- Expected HEAD does not match.
- Expected subject does not match.
- Branch is not `main`.
- Origin does not match `jcdumaua/aifinder`.
- Working tree is not clean at start.
- Route inventory differs from the bound inventory.
- Any required route file is missing.
- Any unapproved route file is included.
- Any route file cannot be classified.
- Any route contains mutation markers and is not excluded.
- Any route contains operational execution markers and is not excluded.
- Any secret-like value appears in output.
- `npm run check` fails.
- The working tree changes during execution.
- The one-run marker already exists.

## Future Phase 25DI result package requirements

The future Phase 25DI result package must include:

\`\`\`text
execution_status=PASSED|CONTROLLED_NON_PASSING|SAFE_FAILURE
execution_count=1
expected_head=<Phase 25DH committed HEAD>
expected_subject=<Phase 25DH committed subject>
future_static_inspection_target=admin_discovery_route_files
future_static_inspection_scope=tracked_admin_discovery_route_files_only
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
routes_inspected_count=<count>
routes_read_only_candidate_count=<count>
routes_excluded_count=<count>
routes_ambiguous_count=<count>
npm_check_status=passed|failed|not_run
values_printed=false
operational_reactivation_status=blocked
\`\`\`

The result package must not include secret values, raw environment values, keys, tokens, database URLs, raw row payloads, or live data.

## Required follow-up after Phase 25DI

After any Phase 25DI execution attempt, the next phase must be:

\`\`\`text
Phase 25DJ — Admin-Only No-Write Route Static Inspection Result Review Gate
\`\`\`

Phase 25DJ must document:

- Whether Phase 25DI ran exactly once.
- The exact approval phrase used.
- The expected HEAD and subject.
- Whether the route inventory matched.
- The routes inspected count.
- Route classification counts.
- Whether `npm run check` passed.
- Whether the working tree remained unchanged.
- Whether any prohibited path was attempted.
- Whether any secret-like output was detected.
- Whether operational reactivation remains blocked.

## Reactivation decision

Operational reactivation remains blocked.

Reasons:

- Phase 25DH is approval-planning only.
- Phase 25DI has not executed.
- No route invocation has been approved.
- No local server startup has been approved.
- No live database read has been approved.
- No admin API invocation has been approved.
- No operational workflow has been approved.
- No candidate pipeline step has been approved.
- No public publishing step has been approved.
- No DB mutation has been approved.

## Recommended next phase

After Phase 25DH is reviewed, approved, committed, and pushed, the next phase may be:

\`\`\`text
Phase 25DI — Admin-Only No-Write Route Static Inspection Execution Gate
\`\`\`

Phase 25DI requires the exact approval phrase before execution:

\`\`\`text
${FUTURE_APPROVAL_PHRASE}
\`\`\`

## Phase 25DH conclusion

Phase 25DH defines the future bounded route static inspection execution approval gate.

This phase does not execute the inspection.

This phase does not invoke routes.

This phase does not start a server.

This phase does not query the live database.

This phase does not reactivate operations.

Discovery Engine operational reactivation remains blocked.

## Gemini approval

Gemini reviewed Phase 25DH and returned:

```text
STATUS: APPROVED
```

Gemini confirmed:

- Phase 25DH remains documentation-only.
- The exact future approval phrase is clearly defined: `Approve Phase 25DI admin-only no-write route static inspection execution exactly once`.
- The future Phase 25DI execution must bind to the committed Phase 25DH HEAD and subject.
- Route inventory binding, one-run guard, stop conditions, classification requirements, and non-secret result package requirements are sufficient.
- Route invocation, local server startup, live DB reads, mutations, candidate pipelines, and publishing remain prohibited.
- Operational reactivation remains blocked.
- Phase 25DI is the correct next execution phase only after the exact approval phrase is supplied.

Phase 25DH is ready for commit after James approval.
