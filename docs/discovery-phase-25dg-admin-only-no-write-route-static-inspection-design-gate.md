# Discovery Phase 25DG — Admin-Only No-Write Route Static Inspection Design Gate

## Status

Documentation-only design gate.

Phase 25DG follows Phase 25DF, which selected the next readiness-validation scope as admin-only no-write route static inspection design.

Phase 25DG designs a future static inspection of tracked admin Discovery route files.

Phase 25DG does not execute the static route inspection.

Phase 25DG does not invoke routes.

Phase 25DG does not start a local server.

Phase 25DG does not query the live database.

Phase 25DG does not reactivate Discovery Engine operations.

Phase 25DG does not modify source code, schema, packages, generated types, or configuration.

## Scope

Allowed in this phase:

- Define the future static inspection target.
- Define the route-file inventory source.
- Define allowed static commands for a future execution gate.
- Define prohibited commands for a future execution gate.
- Define prohibited route behaviors to search for.
- Define classification outcomes.
- Define stop conditions.
- Define future approval, execution, and result-review sequence.
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

Phase 25DG starts after Phase 25DF was committed and pushed:

```text
HEAD=cbe8f84 Document Phase 25DF next-scope decision plan
HEAD full=cbe8f8407fe00bab3857e9373e72444d8a2c6813
branch=main
origin=https://github.com/jcdumaua/aifinder.git
```

Phase 25DF selected:

```text
next_scope_decision=advance_to_admin_only_no_write_route_static_inspection_design
next_scope_execution_allowed=false
next_scope_live_db_read_allowed=false
next_scope_admin_api_invocation_allowed=false
next_scope_local_server_startup_allowed=false
next_scope_mutation_allowed=false
next_scope_candidate_pipeline_allowed=false
next_scope_publishing_allowed=false
operational_reactivation_status=blocked
```

## Future static inspection target

The future static inspection target is:

```text
future_static_inspection_target=admin_discovery_route_files
future_static_inspection_scope=tracked_admin_discovery_route_files_only
future_static_inspection_execution_allowed=false_in_phase_25dg
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
operational_reactivation_status=blocked
```

The inspection target is static source review only.

It is not a runtime route smoke test.

It is not an admin API call.

It is not a live DB read.

It is not operational reactivation.

## Route file inventory

The future inspection must derive route files from tracked git paths under `app/api/admin/discovery`.

Inventory source:

```text
git ls-files | grep -E '^app/api/admin/discovery/.*/route\.ts$|^app/api/admin/discovery/route\.ts$'
```

Current inventory captured during Phase 25DG planning:

```text
Tracked admin Discovery route inventory
values_printed=false

included_route_paths:
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

This inventory is a planning baseline only.

If the route inventory changes before a future execution phase, the approval gate must either bind to the updated inventory or stop.

## Future allowed static commands

A future execution phase may allow only local static commands such as:

```text
git fetch origin main --quiet
git status --short --branch --untracked-files=all
git rev-parse HEAD
git log -1 --pretty=%s
git ls-files
grep
awk
sed for filenames and marker extraction only
npm run check
```

Allowed static commands must not execute route code.

Allowed static commands must not import route modules.

Allowed static commands must not start Next.js.

Allowed static commands must not instantiate Supabase clients.

Allowed static commands must not call network endpoints.

## Future prohibited commands

A future static inspection execution must prohibit:

```text
npm run dev
npm run start
next dev
next start
curl
wget
playwright
supabase
psql
SQL command execution
node scripts that invoke routes
node scripts that query the database
browser automation
route invocation
admin API invocation
public route invocation
```

## Future prohibited route behavior markers

A future static inspection should search selected route files for markers that may indicate mutation or operational execution.

At minimum, the future inspection should report whether route files contain:

```text
insert(
update(
upsert(
delete(
rpc(
approve_for_draft
candidate decision execution
public.tools write
discovered_tools write
crawler execution
extraction execution
LLM execution
```

A match does not automatically mean a route is unsafe, but any match must be classified and reviewed before future route invocation can be considered.

No future route may be treated as no-write merely because the static inspection passes generic checks.

## Future route classification outcomes

Each selected route must be classified as one of:

```text
static_classification=read_only_candidate
static_classification=mutation_capable_excluded
static_classification=operational_execution_capable_excluded
static_classification=ambiguous_excluded_pending_manual_review
static_classification=out_of_scope
```

Only `read_only_candidate` routes may proceed to a later approval gate for possible non-runtime or runtime readiness validation.

A later runtime validation gate is not approved by this phase.

## Future stop conditions

A future static inspection execution must stop if:

- Expected HEAD does not match.
- Expected subject does not match.
- Branch is not `main`.
- Origin does not match `jcdumaua/aifinder`.
- Working tree is not clean at start.
- Route inventory differs from the bound inventory without explicit approval.
- Required route files are missing.
- Any unapproved route file is included.
- Any route file cannot be classified.
- Any route contains mutation markers and is not excluded.
- Any route contains operational execution markers and is not excluded.
- Any secret-like value appears in output.
- `npm run check` fails.
- The working tree changes during execution.

## Future result package requirements

A future static inspection execution result package must include:

```text
execution_status=PASSED|CONTROLLED_NON_PASSING|SAFE_FAILURE
expected_head=<bound committed HEAD>
expected_subject=<bound committed subject>
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
```

The result package must not include secret values, raw environment values, keys, tokens, database URLs, raw row payloads, or live data.

## Future phase sequence

Phase 25DG only designs the static inspection.

The required next sequence is:

```text
Phase 25DH — Admin-Only No-Write Route Static Inspection Approval Gate
Phase 25DI — Admin-Only No-Write Route Static Inspection Execution Gate
Phase 25DJ — Admin-Only No-Write Route Static Inspection Result Review Gate
```

No phase may combine design, approval, execution, and result review.

## Reactivation decision

Operational reactivation remains blocked.

Reasons:

- Phase 25DG is design-only.
- No static route inspection execution has run.
- No route invocation is approved.
- No local server startup is approved.
- No live database read is approved.
- No admin API invocation is approved.
- No candidate pipeline step is approved.
- No public publishing step is approved.
- No DB mutation is approved.
- No route has been classified as eligible for later runtime validation.

## Recommended next phase

The next recommended phase is:

```text
Phase 25DH — Admin-Only No-Write Route Static Inspection Approval Gate
```

Phase 25DH should define the exact future approval phrase and bind the future Phase 25DI execution to the committed Phase 25DG HEAD and subject.

## Phase 25DG conclusion

Phase 25DG designs a future static inspection of admin Discovery route files.

This is a local-only source inspection design.

This does not execute the inspection.

This does not invoke routes.

This does not start a server.

This does not query the live database.

This does not authorize operational reactivation.

This does not authorize live database reads.

This does not authorize admin API invocation.

This does not authorize local server startup.

This does not authorize candidate extraction, candidate staging, candidate decisions, approve_for_draft, public publishing, or DB mutation.

Discovery Engine operational reactivation remains blocked.

## Gemini approval

Gemini reviewed Phase 25DG and returned:

```text
STATUS: APPROVED
```

Gemini confirmed:

- Phase 25DG remains documentation-only.
- The phase designs future route static inspection without executing it.
- The allowed command set and prohibited command set are strict enough for the future execution phase.
- Route invocation, local server startup, live DB reads, admin API invocation, mutations, candidate pipelines, and publishing remain prohibited.
- Marker checks and route classification outcomes are sufficient for the next execution design.
- Stop conditions and non-secret result package requirements are sufficient.
- Operational reactivation remains blocked.
- Phase 25DH is the correct next approval gate.

Phase 25DG is ready for commit after James approval.
