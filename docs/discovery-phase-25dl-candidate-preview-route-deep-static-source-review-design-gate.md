# Discovery Phase 25DL — Candidate Preview Route Deep Static Source Review Design Gate

## Status

Documentation-only design gate.

Phase 25DL follows Phase 25DK, which rejected direct runtime validation and selected deeper route-specific static source review design as the next safe scope.

Phase 25DL designs a future deep static source review for the candidate preview route:

```text
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
```

Phase 25DL does not execute the deep static source review.

Phase 25DL does not invoke the route.

Phase 25DL does not start a local server.

Phase 25DL does not query the live database.

Phase 25DL does not reactivate Discovery Engine operations.

Phase 25DL does not modify source code, schema, packages, generated types, or configuration.

## Scope

Allowed in this phase:

- Define the future route-specific deep static source review target.
- Define future source review categories.
- Define future allowed local static commands.
- Define future prohibited runtime commands.
- Define future helper/import review requirements.
- Define future classification outcomes.
- Define future stop conditions.
- Define future result package requirements.
- Preserve operational reactivation as blocked.

Not allowed in this phase:

- No deep static source review execution.
- No runtime validation.
- No operational execution.
- No operational reactivation.
- No route invocation.
- No local server startup.
- No live database read.
- No deployed route call.
- No admin API invocation.
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

Phase 25DL starts after Phase 25DK was committed and pushed:

```text
HEAD=5437b67 Document Phase 25DK runtime validation scope decision
HEAD full=5437b67bc7c6ece3396662ba210bf2cd471ac5a5
branch=main
origin=https://github.com/jcdumaua/aifinder.git
```

Phase 25DK selected:

```text
next_scope_decision=advance_to_candidate_preview_route_deep_static_source_review_design
runtime_validation_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
operational_reactivation_status=blocked
```

## Candidate route design report

The candidate route design report for this phase is:

```text
Candidate preview route design report
values_printed=false
source_lines_printed=false
deep_source_review_executed=false
candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
candidate_route_present=true
candidate_route_tracked=true
runtime_validation_allowed_in_phase_25dl=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
```

This confirms the route target exists as a tracked local file for future review design.

It does not inspect source semantics.

It does not execute the route.

It does not approve runtime validation.

## Design constraints

The deep static source review design constraints are:

```text
Candidate preview route deep static source review design constraints
values_printed=false
future_review_target=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
future_deep_static_source_review_allowed=false_in_phase_25dl
future_runtime_validation_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false

future_static_review_allowed_inputs:
- route source file path only
- tracked helper/import file paths referenced by the route
- non-secret marker summaries
- npm run check result

future_static_review_prohibited_outputs:
- environment values
- database URLs
- keys or tokens
- raw live row payloads
- request cookies or session material
- source excerpts longer than necessary marker snippets
```

## Future deep static source review target

The future source review target is:

```text
future_deep_static_source_review_target=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
future_deep_static_source_review_scope=candidate_preview_route_and_direct_static_import_dependencies
future_deep_static_source_review_execution_allowed=false_in_phase_25dl
runtime_validation_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
operational_reactivation_status=blocked
```

The future deep static source review is local-only and source-only.

It is not a route smoke test.

It is not an admin API call.

It is not a live database read.

It is not runtime validation.

It is not operational reactivation.

## Future review categories

A future execution phase should review the candidate route for:

### Route shape

- Exported HTTP methods.
- Dynamic segment handling for `[id]`.
- Request parsing behavior.
- Response status behavior.
- Error handling.
- Cache and dynamic route behavior.

### Authentication and authorization

- Whether admin authentication is required.
- Whether user/session context is validated.
- Whether the route can be reached without admin authorization.
- Whether unauthorized responses are fail-closed.
- Whether helper imports enforce admin-only access.

### Supabase and database access

- Supabase client creation path.
- Whether service-role access is used.
- Whether query methods are read-only.
- Whether any `insert`, `update`, `upsert`, `delete`, or `rpc` path exists.
- Whether selected tables are limited to candidate-preview needs.
- Whether selected fields are minimal.
- Whether result cardinality is bounded.
- Whether missing rows fail safely.
- Whether errors avoid exposing secrets or raw internals.

### Helper/import dependency review

- Direct imports from the route.
- Whether imported helpers can mutate.
- Whether imported helpers can execute crawler, extraction, LLM, candidate, decision, or publishing operations.
- Whether imported helpers can trigger side effects on import.
- Whether helper dependencies are stable and scoped.

### Output and data minimization

- Whether route output is limited to candidate preview needs.
- Whether output excludes credentials, tokens, internal notes, raw payloads, and unnecessary live data.
- Whether future runtime validation can avoid printing live row payloads.
- Whether future result packages can report only non-secret metadata.

## Future allowed local static commands

A future source review execution may use only local static commands such as:

```text
git fetch origin main --quiet
git status --short --branch --untracked-files=all
git rev-parse HEAD
git log -1 --pretty=%s
git ls-files
grep
awk
sed for filename, import, and marker extraction only
wc for line counts only
npm run check
```

Allowed commands must not execute route code.

Allowed commands must not import route modules.

Allowed commands must not start Next.js.

Allowed commands must not instantiate Supabase clients.

Allowed commands must not query a database.

Allowed commands must not call network endpoints.

## Future prohibited commands and behaviors

A future source review execution must prohibit:

```text
npm run dev
npm run start
next dev
next start
curl
wget
playwright
browser automation
supabase
psql
SQL command execution
node scripts that invoke routes
node scripts that query the database
route invocation
admin API invocation
public route invocation
module import execution
candidate extraction
candidate staging
candidate decision execution
approve_for_draft
public publishing
DB mutation
```

## Future classification outcomes

The future deep static source review should classify the candidate route as one of:

```text
candidate_preview_deep_static_classification=source_review_read_only_candidate
candidate_preview_deep_static_classification=source_review_mutation_capable_excluded
candidate_preview_deep_static_classification=source_review_operational_execution_capable_excluded
candidate_preview_deep_static_classification=source_review_auth_boundary_ambiguous_excluded
candidate_preview_deep_static_classification=source_review_data_minimization_ambiguous_excluded
candidate_preview_deep_static_classification=source_review_dependency_ambiguous_excluded
candidate_preview_deep_static_classification=source_review_blocked_pending_manual_review
```

A route may be classified as `source_review_read_only_candidate` only if the future source review finds:

- No mutation path.
- No operational execution path.
- Admin-only protection is evident.
- Dynamic route parameter handling is bounded.
- Direct helper dependencies do not introduce side effects.
- Query scope and selected fields appear bounded.
- Runtime validation could be designed without printing raw live row payloads.

Even a `source_review_read_only_candidate` classification does not approve runtime validation.

## Future stop conditions

A future deep static source review execution must stop if:

- Expected HEAD does not match.
- Expected subject does not match.
- Branch is not `main`.
- Origin does not match `jcdumaua/aifinder`.
- Working tree is not clean at start.
- Candidate route path differs.
- Candidate route is missing.
- Candidate route is not tracked.
- Any required helper/import file is missing.
- Import dependency review cannot be completed with local static commands.
- Any mutation marker appears and cannot be safely explained as non-executable or excluded.
- Any operational execution marker appears and cannot be safely excluded.
- Authentication or authorization boundary is ambiguous.
- Data minimization is ambiguous.
- Any secret-like value appears in output.
- `npm run check` fails.
- The working tree changes during execution.

## Future result package requirements

A future source review execution result package must include:

```text
execution_status=PASSED|CONTROLLED_NON_PASSING|SAFE_FAILURE
expected_head=<bound committed HEAD>
expected_subject=<bound committed subject>
candidate_route=app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
future_deep_static_source_review_scope=candidate_preview_route_and_direct_static_import_dependencies
runtime_validation_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
admin_api_invocation_allowed=false
mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
candidate_preview_deep_static_classification=<classification>
admin_auth_boundary_status=clear|ambiguous|blocked
mutation_path_status=not_detected|detected_excluded|ambiguous
operational_execution_path_status=not_detected|detected_excluded|ambiguous
data_minimization_status=clear|ambiguous|blocked
dependency_review_status=complete|ambiguous|blocked
npm_check_status=passed|failed|not_run
values_printed=false
operational_reactivation_status=blocked
```

The result package must not include secret values, raw environment values, keys, tokens, database URLs, raw row payloads, cookies, session material, or unnecessary source excerpts.

## Future phase sequence

Phase 25DL only designs the deep static source review.

The required next sequence is:

```text
Phase 25DM — Candidate Preview Route Deep Static Source Review Approval Gate
Phase 25DN — Candidate Preview Route Deep Static Source Review Execution Gate
Phase 25DO — Candidate Preview Route Deep Static Source Review Result Review Gate
```

No phase may combine design, approval, execution, and result review.

## Runtime validation remains out of scope

Runtime validation is not approved.

A future runtime validation path would require later phases after Phase 25DO, including:

- Runtime validation scope decision.
- Runtime validation design gate.
- Runtime validation approval gate.
- Runtime validation execution gate.
- Runtime validation result review gate.

Those future phases would still need to decide whether to use local server startup or deployed route invocation, how to handle admin authentication, how to avoid printing live payloads, and how to preserve no-write boundaries.

## Reactivation decision

Operational reactivation remains blocked.

Reasons:

- Phase 25DL is design-only.
- No deep static source review has executed.
- No runtime validation is approved.
- The candidate route remains only a static read-only candidate.
- No route-specific source review result exists.
- No route invocation is approved.
- No local server startup is approved.
- No live database read is approved.
- No admin API invocation is approved.
- No candidate pipeline step is approved.
- No public publishing step is approved.
- No DB mutation is approved.

## Recommended next phase

The next recommended phase is:

```text
Phase 25DM — Candidate Preview Route Deep Static Source Review Approval Gate
```

Phase 25DM should define the exact future approval phrase and bind the future Phase 25DN execution to the committed Phase 25DL HEAD and subject.

## Phase 25DL conclusion

Phase 25DL designs a future route-specific deep static source review for:

```text
app/api/admin/discovery/runs/[id]/candidate-preview/route.ts
```

This is safer than moving directly to runtime validation.

This does not execute the source review.

This does not authorize operational reactivation.

This does not authorize route invocation.

This does not authorize live database reads.

This does not authorize admin API invocation.

This does not authorize local server startup.

This does not authorize candidate extraction, candidate staging, candidate decisions, approve_for_draft, public publishing, or DB mutation.

Discovery Engine operational reactivation remains blocked.

## Gemini approval

Gemini reviewed Phase 25DL and returned:

```text
STATUS: APPROVED
```

Gemini confirmed:

- Phase 25DL remains documentation-only.
- The future deep static source review is designed without executing it.
- Route shape, authentication and authorization, database access, helper dependencies, data minimization, classification outcomes, stop conditions, and result package requirements are sufficient.
- The distinction between static read-only candidate, source-review candidate, and runtime-approved route is preserved.
- Route invocation, local server startup, live DB reads, admin API invocation, mutations, candidate pipelines, and publishing remain prohibited.
- Operational reactivation remains blocked.
- Phase 25DM is the logical next approval gate.

Phase 25DL is ready for commit after James approval.
