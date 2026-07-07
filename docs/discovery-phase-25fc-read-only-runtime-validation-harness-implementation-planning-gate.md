# Discovery Phase 25FC — Read-Only Runtime Validation Harness Implementation Planning Gate

## Phase status

Status: **Implementation planning gate for Gemini review**

Phase 25FC plans how a future read-only runtime validation harness could be implemented, but it does not implement the harness.

This phase is documentation-only. It does not create executable files, edit source files, implement a harness, execute a harness, invoke routes, start a local server, import application modules, query a live database, call admin/public APIs, perform browser automation, make network calls, execute crawler activity, execute extraction activity, execute LLM activity, stage candidates, execute candidate decisions, approve candidates for draft, publish public data, mutate a database, change schema files, change migration files, generate types, change package files, or change lockfiles.

Operational reactivation remains blocked.

## Approved baseline

Phase 25FB was approved, committed, and pushed with:

```text
commit=8287882
full_sha=82878827b501e8870dc6131781f9c79f8d41208c
subject=Document Phase 25FB harness design gate
origin_main=82878827b501e8870dc6131781f9c79f8d41208c
final_status=## main...origin/main
npm_check_status=passed
gemini_review_status=APPROVED
operational_reactivation_status=blocked
```

Phase 25FB documented the future read-only runtime validation harness contract at design level only. Phase 25FC converts that design into a safe future implementation plan, but it does not implement the plan.

## Phase 25FC objective

The objective of Phase 25FC is to define the safest implementation plan for a future harness implementation gate.

Phase 25FC must:

1. Preserve Phase 25EX, Phase 25EY, Phase 25EZ, Phase 25FA, and Phase 25FB approved states.
2. Keep the work documentation-only.
3. Identify the future file target and implementation boundaries.
4. Define the future script structure and safety gates.
5. Define the future static manifest handling rules.
6. Define the future output and redaction rules.
7. Define future verification steps before a later implementation commit.
8. Keep all runtime activity blocked.
9. Keep operational reactivation blocked.

## Allowed source material

Allowed source material:

- Phase 25FB approved harness design gate.
- Phase 25FA approved preconditions planning gate.
- Phase 25EZ approved scope narrowing gate.
- Phase 25EY approved follow-up planning gate.
- Phase 25EX approved static classification review.
- Phase 25EW approved classification planning document.
- Phase 25EV approved preserved detailed output review document.
- Phase 25EU v3 approved/passed execution review state.
- Current git metadata confirming Phase 25FB is the current baseline.

Disallowed source material:

- Fresh dependency inventory execution.
- Fresh route listing execution.
- Fresh harness execution.
- Application module imports.
- Runtime route validation.
- Local server startup.
- Live database reads.
- Admin API invocation.
- Public route invocation.
- Browser automation.
- Network calls.
- Environment value inspection or printing.
- Source file inspection that imports or executes application modules.

## Future implementation scope

A future implementation phase may create exactly one executable harness file, only after separate approval:

```text
future_file=testing/discovery-read-only-runtime-validation-harness.mjs
future_change_type=single_new_executable_script
source_behavior_change_allowed=false
package_change_allowed=false
lockfile_change_allowed=false
schema_change_allowed=false
migration_change_allowed=false
generated_type_change_allowed=false
```

The future implementation must not modify application source, route files, helper modules, package files, lockfiles, schemas, migrations, generated types, or public UI.

## Future script structure

The future harness implementation should use a strict structure equivalent to:

```text
main()
  print_boundary()
  verify_repo_safety()
  verify_required_approval_guard()
  verify_static_manifest()
  verify_runtime_target_policy()
  verify_output_safety_policy()
  run_project_check()
  stop_before_runtime_by_default()
```

The future implementation must default to stopping before runtime validation.

A second explicit phase-specific opt-in would be required before any later execution phase.

## Future approval guard

The future implementation must not perform runtime validation unless a later execution phase defines and requires a dedicated approval guard.

Future planning requirement:

```text
default_runtime_execution=false
implementation_phase_runtime_execution=false
execution_requires_later_phase=true
execution_guard_name_must_be_phase_specific=true
```

Phase 25FC does not define an active execution guard and does not approve any execution.

## Future static manifest plan

The future harness implementation should include a static in-file manifest placeholder only if approved by a later implementation gate.

Manifest constraints:

```text
dynamic_route_discovery=false
dependency_inventory_execution=false
route_listing_execution=false
application_module_import=false
manifest_source=approved_static_documentation_only
manifest_items_default_empty_or_blocked=true
```

The initial future implementation should prefer an empty or blocked manifest until a separate approved manifest population phase exists.

## Future route item contract

Future manifest entries must require:

```text
route_id=required
route_path=required
method=GET_OR_HEAD_ONLY_UNLESS_SEPARATELY_APPROVED
auth_boundary=required_and_not_unknown
expected_status_class=required
read_only_reason=required
mutation_risk_status=ruled_out_at_planning_level
output_policy=summary_only_no_raw_body_no_sensitive_headers
approved_source_phase=required
abort_on_deviation=true
```

Any missing field must cause the future harness to abort before any runtime activity.

## Future runtime target policy

The future implementation must not hardcode production runtime validation.

Required future behavior:

```text
runtime_target_default=none
runtime_target_required_before_execution=true
network_target_allowlist_required=true
local_server_start_forbidden_without_separate_approval=true
live_db_read_forbidden_without_separate_approval=true
admin_api_forbidden_without_separate_approval=true
public_route_forbidden_without_separate_approval=true
```

Phase 25FC does not approve any runtime target.

## Future no-mutation policy

The future implementation must enforce no-mutation planning constraints before any execution can be considered.

Forbidden future behavior:

- POST validation.
- PUT validation.
- PATCH validation.
- DELETE validation.
- Candidate staging.
- Candidate update.
- Candidate decision execution.
- approve_for_draft.
- Public publishing.
- Database writes.
- Audit writes.
- Queue mutation.
- Schema changes.
- Migration changes.
- Generated type changes.
- Source changes during validation.
- Package or lockfile changes.

GET and HEAD must still be treated as not automatically safe.

## Future output policy

The future implementation must print only summary-level output.

Allowed future output:

```text
phase
harness_status
route_count
routes_passed
routes_failed
routes_blocked
values_printed=false
secret_like_output_detected=false
mutation_attempt_detected=false
operational_reactivation_status=blocked
```

Allowed per-route output:

```text
route_id
method
result
status_class
body_printed=false
headers_printed=false
mutation_detected=false
secret_like_output_detected=false
```

Forbidden future output:

- Raw response bodies.
- Raw request headers.
- Raw response headers.
- Cookies.
- Tokens.
- Session values.
- Authorization headers.
- Database URLs.
- Service credentials.
- Environment values.
- Secret-like values.

## Future script safety requirements

The future script must:

- Use `main`.
- Tee logs to `/tmp/aifinder-<phase>-<task>-<timestamp>.log`.
- Capture `PIPESTATUS[0]`.
- Copy a review package to clipboard on success.
- Copy raw failure log to clipboard on failure.
- Preserve the original exit code.
- Enforce repo safety checks.
- Enforce scope checks.
- Print clear PASSED/FAILED lines.
- Print a Discovery Engine progress report on success.
- Avoid broad false-positive secret checks that flag safe boundary language.
- Use narrow value-exposure checks for actual value-like patterns.

## Future pre-runtime abort criteria

The future implementation must abort before runtime activity if any of these conditions are true:

```text
wrong_repo=true
wrong_branch=true
wrong_baseline=true
dirty_working_tree=true
missing_required_approval_marker=true
missing_required_execution_guard=true
manifest_missing=true
manifest_unapproved=true
manifest_has_unknown_route=true
manifest_has_missing_required_field=true
manifest_has_non_allowed_method=true
manifest_has_unknown_auth_boundary=true
manifest_has_mutation_risk=true
runtime_target_unapproved=true
network_target_unapproved=true
project_check_failed=true
secret_like_value_detected_before_execution=true
```

## Future execution-phase separation

Phase 25FC requires these future gates to remain separate:

```text
implementation_planning_gate=Phase 25FC
gemini_review_gate=Phase 25FC_review
implementation_gate=separate_future_phase
execution_planning_gate=separate_future_phase
runtime_execution_gate=separate_future_phase
local_commit_gate=after_gemini_approval
push_gate=after_local_commit_verification
```

For the current user workflow, the post-Gemini commit and push may be combined into one script, but the script must still verify the local commit before pushing.

## Recommended next phase

Phase 25FC recommends proceeding next to:

```text
Phase 25FD — Read-Only Runtime Validation Harness Implementation Gate
```

Phase 25FD may implement the future harness file only if Gemini approves this implementation plan. Phase 25FD must not execute the harness or perform runtime validation.

Phase 25FD must preserve:

```text
harness_execution=false
runtime_validation=false
route_invocation=false
local_server_startup=false
live_db_read=false
admin_api_invocation=false
public_route_invocation=false
source_behavior_change=false
operational_reactivation_status=blocked
```

## Explicit non-recommendations

Phase 25FC does not recommend:

- Runtime route validation.
- Runtime validation harness execution.
- Route invocation.
- Local server startup.
- Live database reads.
- Admin API invocation.
- Public route invocation.
- Dependency inventory rerun.
- Route listing rerun.
- Application module import execution.
- Source behavior changes.
- Schema changes.
- Migration changes.
- Generated type changes.
- Package or lockfile changes.
- Browser automation.
- Network calls.
- Crawler execution.
- Extraction execution.
- LLM execution.
- Candidate staging.
- Candidate decision execution.
- approve_for_draft.
- Public publishing.
- Operational reactivation.

## Operational reactivation status

Operational reactivation remains blocked.

Reasons:

1. Phase 25EX was static-output-only.
2. Phase 25EY was follow-up planning only.
3. Phase 25EZ was scope narrowing only.
4. Phase 25FA was preconditions planning only.
5. Phase 25FB was harness design only.
6. Phase 25FC is implementation planning only.
7. Runtime validation harness implementation has not started.
8. Runtime validation harness execution has not occurred.
9. Runtime route validation has not occurred.
10. Live database validation has not started.
11. Candidate pipeline execution has not started.
12. Public publishing has not started.
13. No reactivation gate has been approved.

## Boundaries preserved in Phase 25FC

- Documentation-only implementation planning gate.
- No dependency inventory execution.
- No route listing execution.
- No harness implementation.
- No harness execution.
- No application module import execution.
- No source changes outside this document.
- No runtime validation.
- No route invocation.
- No local server startup.
- No live database read.
- No admin API invocation.
- No public route invocation.
- No browser automation.
- No network call.
- No crawler execution.
- No extraction execution.
- No LLM execution.
- No candidate staging.
- No candidate decision execution.
- No approve_for_draft.
- No public publishing.
- No DB mutation.
- No schema, migration, generated type, package, or lockfile changes.
- No environment values printed.
- Operational reactivation remains blocked.

## Gemini review request

Gemini is asked to review whether Phase 25FC:

1. Correctly preserves the approved Phase 25EX, Phase 25EY, Phase 25EZ, Phase 25FA, and Phase 25FB states.
2. Correctly remains documentation-only.
3. Correctly plans future implementation without implementing or executing a harness.
4. Correctly identifies a single future harness file target without source behavior changes.
5. Correctly requires runtime execution to remain blocked by default.
6. Correctly keeps route invocation, local server startup, live DB reads, admin/public API calls, browser automation, and network calls blocked.
7. Correctly defines future manifest, runtime target, no-mutation, output, log, clipboard, and abort policies.
8. Correctly recommends Phase 25FD as the next implementation gate while keeping harness execution blocked.
9. Correctly keeps operational reactivation blocked.
10. Correctly avoids source, route, database, candidate, publishing, crawler, extraction, LLM, environment, and runtime activity.

## Review conclusion

Gemini decision: APPROVED.

Gemini confirmed that Phase 25FC:

- Preserves the approved Phase 25EX, Phase 25EY, Phase 25EZ, Phase 25FA, and Phase 25FB states.
- Remains strictly documentation-only.
- Plans future implementation without implementing or executing a harness.
- Identifies a single isolated future harness target: `testing/discovery-read-only-runtime-validation-harness.mjs`.
- Requires runtime execution to remain blocked by default.
- Keeps route invocation, local server startup, live database reads, admin/public API calls, browser automation, and network calls blocked.
- Defines robust future policies for manifests, runtime targets, no-mutation behavior, output redaction, logging, clipboard handling, and abort criteria.
- Correctly identifies Phase 25FD as the next implementation gate while keeping harness execution blocked.
- Keeps operational reactivation blocked.
- Avoids source, route, database, candidate, publishing, crawler, extraction, LLM, environment, and runtime activity.

Approved commit subject:

```text
Document Phase 25FC harness implementation plan
```
