# Discovery Phase 25FB — Read-Only Runtime Validation Harness Design Gate

## Phase status

Status: **Design gate for Gemini review**

Phase 25FB designs a future read-only runtime validation harness at the documentation level only.

This phase does not implement a harness, execute a harness, invoke routes, start a local server, import application modules, query a live database, call admin/public APIs, perform browser automation, make network calls, execute crawler activity, execute extraction activity, execute LLM activity, stage candidates, execute candidate decisions, approve candidates for draft, publish public data, mutate a database, change source files, change schema files, change migration files, generate types, change package files, or change lockfiles.

Operational reactivation remains blocked.

## Approved baseline

Phase 25FA was approved, committed, and pushed with:

```text
commit=1db6c4a
full_sha=1db6c4a4cdc91c21a867dca2ecd32f3d63852166
subject=Document Phase 25FA preconditions planning gate
origin_main=1db6c4a4cdc91c21a867dca2ecd32f3d63852166
final_status=## main...origin/main
npm_check_status=passed
gemini_review_status=APPROVED
operational_reactivation_status=blocked
```

Phase 25FA defined the preconditions that must be satisfied before any future read-only runtime validation harness design could be considered. Phase 25FB uses those preconditions to define a harness design contract, but it does not implement or execute that contract.

## Phase 25FB objective

The objective of Phase 25FB is to design the future harness boundary, input contract, execution guard model, output contract, abort rules, and review requirements for a possible later implementation planning gate.

Phase 25FB must:

1. Preserve Phase 25EX, Phase 25EY, Phase 25EZ, and Phase 25FA approved states.
2. Keep the work documentation-only.
3. Define a design contract without creating executable files.
4. Define a future harness architecture that is read-only by construction.
5. Define required safeguards before any future implementation.
6. Define output and redaction rules that prevent value exposure.
7. Define abort criteria that fail closed.
8. Keep operational reactivation blocked.

## Allowed source material

Allowed source material:

- Phase 25FA approved preconditions planning gate.
- Phase 25EZ approved scope narrowing gate.
- Phase 25EY approved follow-up planning gate.
- Phase 25EX approved static classification review.
- Phase 25EW approved classification planning document.
- Phase 25EV approved preserved detailed output review document.
- Phase 25EU v3 approved/passed execution review state.
- Current git metadata confirming Phase 25FA is the current baseline.

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

## Harness design status

Phase 25FB defines a **future harness design only**.

```text
harness_design_documented=true
harness_implemented=false
harness_executed=false
runtime_validation_executed=false
route_invocation_executed=false
local_server_started=false
live_db_read_executed=false
source_files_changed=false
operational_reactivation_status=blocked
```

## Future harness design principles

### Principle 1 — Explicit opt-in only

A future implementation must refuse to run unless a dedicated approval guard is present.

Design requirement:

```text
default_execution_allowed=false
explicit_james_approval_required=true
gemini_approval_required=true
single_phase_guard_required=true
```

The future guard name must be phase-specific and must not be reused across phases.

### Principle 2 — Static manifest only

A future harness must read a static validation manifest that is approved in a prior documentation phase.

Design requirement:

```text
dynamic_route_discovery_allowed=false
dependency_inventory_execution_allowed=false
route_listing_execution_allowed=false
application_module_import_allowed=false
manifest_source=approved_static_documentation_only
```

The manifest must list only routes that passed Phase 25FA preconditions in a later approved planning phase.

### Principle 3 — GET/HEAD preference with no automatic safety assumption

A future harness may prefer GET or HEAD methods, but method choice alone is not proof of read-only behavior.

Design requirement:

```text
preferred_methods=GET_OR_HEAD
method_alone_proves_read_only=false
mutation_risk_must_be_assessed_before_inclusion=true
```

Any route with unknown or possible side effects must remain blocked.

### Principle 4 — No mutation paths

A future harness must not include routes that are known, suspected, or ambiguous write paths.

Excluded actions:

- Candidate staging.
- Candidate update.
- Candidate decision execution.
- approve_for_draft.
- Public publishing.
- Database writes.
- Schema changes.
- Migration changes.
- Queue mutation.
- Audit mutation.
- Source modification.
- Package or lockfile modification.

### Principle 5 — Authentication boundary must be explicit

A future harness design must specify authentication expectations before implementation.

Design requirement:

```text
unknown_auth_boundary_allowed=false
admin_route_requires_separate_approval=true
public_route_requires_separate_approval=true
credential_printing_allowed=false
cookie_printing_allowed=false
token_printing_allowed=false
session_value_printing_allowed=false
```

Routes with unknown auth boundaries remain blocked.

### Principle 6 — Output must be safe by construction

A future harness must avoid printing sensitive values and must summarize route validation outcomes instead of dumping raw responses.

Allowed output:

- Route path.
- Method.
- Expected status class.
- Actual status class.
- Pass/fail result.
- Redacted error category.
- Abort reason.
- Safety summary.

Disallowed output:

- Raw response body.
- Cookies.
- Tokens.
- Session values.
- Authorization headers.
- Database URLs.
- Service credentials.
- Environment values.
- Secret-like values.
- Full request headers.
- Full response headers.

### Principle 7 — Fail closed on uncertainty

A future harness must abort rather than infer safety.

Abort if:

- Route not present in approved manifest.
- Method mismatch.
- Auth boundary unknown.
- Runtime environment mismatch.
- Unexpected redirect.
- Unexpected status class.
- Any possible mutation indicator.
- Any potential secret-like value exposure.
- Dirty git working tree.
- Wrong branch.
- Wrong baseline commit.
- Missing approval marker.
- Unexpected file change.
- Nonzero project check.

## Future harness input contract

A future implementation may only accept a static manifest with fields equivalent to the following documentation-level contract:

```text
route_id=stable_static_identifier
route_path=static_route_path
method=GET_OR_HEAD_ONLY_UNLESS_SEPARATELY_APPROVED
auth_boundary=admin_only_or_public_or_internal
expected_status_class=2xx_or_3xx_or_4xx
read_only_reason=plain_language_reason
mutation_risk_status=ruled_out_at_planning_level
output_policy=summary_only_no_raw_body_no_sensitive_headers
approved_source_phase=phase_identifier
abort_on_deviation=true
```

A future harness must reject any manifest item missing one or more required fields.

## Future harness execution boundary

A future harness implementation must define its runtime boundary before execution.

Required future decisions:

```text
runtime_target=local_only_or_preview_or_production
local_server_start_required=true_or_false
network_target_allowlist=explicit_and_minimal
live_db_read_allowed=false_unless_separately_approved
admin_api_allowed=false_unless_separately_approved
public_route_allowed=false_unless_separately_approved
```

Phase 25FB does not decide or approve the runtime target. It only requires that a later phase make that decision explicitly.

## Future harness output contract

A future harness output must be line-oriented, minimal, and redacted.

Required output shape:

```text
phase=<phase_id>
harness_status=PASSED_OR_FAILED_OR_ABORTED
route_count=<number>
routes_passed=<number>
routes_failed=<number>
routes_blocked=<number>
values_printed=false
secret_like_output_detected=false
mutation_attempt_detected=false
operational_reactivation_status=blocked
```

Per-route output must be summary-only:

```text
route_id=<static_id>
method=<method>
result=PASSED_OR_FAILED_OR_BLOCKED
status_class=<class_only>
body_printed=false
headers_printed=false
mutation_detected=false
secret_like_output_detected=false
```

## Future harness log and clipboard rules

A future harness may produce a review package only after safety checks pass.

Design requirement:

- Tee logs to `/tmp/aifinder-<phase>-<task>-<timestamp>.log`.
- Capture `PIPESTATUS[0]`.
- Copy a review package to clipboard on success.
- Copy raw failure log to clipboard on failure.
- Preserve the original exit code.
- Never copy raw response bodies.
- Never copy raw headers.
- Never copy environment values.
- Never copy credentials or secret-like values.

## Future harness abort criteria

A future harness must abort before route invocation if any of the following occur:

```text
wrong_repo=true
wrong_branch=true
wrong_baseline=true
dirty_working_tree=true
missing_manifest=true
manifest_not_approved=true
manifest_has_unknown_route=true
manifest_has_missing_required_field=true
manifest_has_non_allowed_method=true
manifest_has_unknown_auth_boundary=true
manifest_has_mutation_risk=true
missing_explicit_approval_guard=true
unexpected_environment_target=true
project_check_failed=true
secret_like_value_detected_before_execution=true
```

A future harness must abort during or after validation if any of the following occur:

```text
unexpected_network_target=true
unexpected_method=true
unexpected_status_class=true
unexpected_redirect=true
raw_body_would_be_printed=true
raw_headers_would_be_printed=true
secret_like_value_detected=true
mutation_attempt_detected=true
unexpected_file_change=true
```

## Future harness non-goals

A future harness must not:

- Discover routes dynamically.
- Rerun dependency inventory.
- Rerun route listing.
- Import application modules.
- Generate candidates.
- Stage candidates.
- Decide candidates.
- Approve candidates for draft.
- Publish public records.
- Mutate database rows.
- Apply migrations.
- Generate types.
- Modify source files.
- Modify packages or lockfiles.
- Reactivate operations.

## Recommended next phase

Phase 25FB recommends proceeding next to:

```text
Phase 25FC — Read-Only Runtime Validation Harness Implementation Planning Gate
```

Phase 25FC must remain documentation-only. It should decide whether the Phase 25FB design is sufficient to plan a future implementation, but it must not implement or execute the harness.

Phase 25FC must not:

- Create executable harness files.
- Execute runtime validation.
- Invoke routes.
- Start a local server.
- Query live databases.
- Call admin/public APIs.
- Import application modules.
- Change source files.
- Publicly publish data.
- Reactivate operations.

## Explicit non-recommendations

Phase 25FB does not recommend:

- Runtime route validation.
- Runtime validation harness implementation.
- Runtime validation harness execution.
- Route invocation.
- Local server startup.
- Live database reads.
- Admin API invocation.
- Public route invocation.
- Dependency inventory rerun.
- Route listing rerun.
- Application module import execution.
- Source changes.
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
5. Phase 25FB is harness design only.
6. Runtime validation harness implementation has not started.
7. Runtime validation harness execution has not occurred.
8. Runtime route validation has not occurred.
9. Live database validation has not started.
10. Candidate pipeline execution has not started.
11. Public publishing has not started.
12. No reactivation gate has been approved.

## Boundaries preserved in Phase 25FB

- Documentation-only harness design gate.
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

Gemini is asked to review whether Phase 25FB:

1. Correctly preserves the approved Phase 25EX, Phase 25EY, Phase 25EZ, and Phase 25FA states.
2. Correctly remains documentation-only.
3. Correctly designs a future harness contract without implementing or executing a harness.
4. Correctly keeps route invocation, local server startup, live DB reads, admin/public API calls, browser automation, and network calls blocked.
5. Correctly defines a safe input contract for any future harness implementation.
6. Correctly defines a safe output contract that avoids raw body, raw header, credential, token, cookie, session, environment, and secret-like value exposure.
7. Correctly defines abort criteria that fail closed before or during any future validation.
8. Correctly recommends Phase 25FC as the next documentation-only implementation planning gate.
9. Correctly keeps operational reactivation blocked.
10. Correctly avoids source, route, database, candidate, publishing, crawler, extraction, LLM, environment, and runtime activity.

## Review conclusion

Gemini decision: APPROVED.

Gemini confirmed that Phase 25FB:

- Preserves the approved Phase 25EX, Phase 25EY, Phase 25EZ, and Phase 25FA states.
- Remains strictly documentation-only.
- Designs a future harness contract without implementing or executing code.
- Keeps route invocation, local server startup, live database reads, admin/public API calls, browser automation, and network calls blocked.
- Defines rigorous and safe input contract requirements for future development.
- Defines output contract requirements that prevent raw body, raw header, credential, token, cookie, session, environment, and secret-like value exposure.
- Defines comprehensive fail-closed abort criteria.
- Correctly identifies Phase 25FC as the next documentation-only implementation planning gate.
- Keeps operational reactivation blocked.
- Avoids source, route, database, candidate, publishing, crawler, extraction, LLM, environment, and runtime activity.

Approved commit subject:

```text
Document Phase 25FB harness design gate
```
