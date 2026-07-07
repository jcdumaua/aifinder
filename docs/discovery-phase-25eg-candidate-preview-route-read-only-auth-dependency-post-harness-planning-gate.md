# Discovery Phase 25EG — Candidate Preview Route Read-Only Auth Dependency Post-Harness Planning Gate

## Status

Drafted for Gemini review.

## Phase type

Documentation-only post-harness planning gate.

## Current binding

```text
phase=25EG
base_head=868c7e14e8f054d13b4a2ac12e8323c0db264538
base_subject=Document Phase 25EF harness execution result
phase_25ef_doc=docs/discovery-phase-25ef-candidate-preview-route-read-only-auth-dependency-source-only-harness-execution-result-review-gate.md
harness_path=testing/discovery-candidate-preview-read-only-auth-contract-source-harness.mjs
source_change_allowed=false
harness_execution_allowed=false
runtime_validation_execution_allowed=false
route_invocation_allowed=false
module_import_execution_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
db_mutation_allowed=false
candidate_pipeline_allowed=false
publishing_allowed=false
operational_reactivation_status=blocked
```

## Purpose

Phase 25EG plans the next safe layer after the source-only harness execution result was approved and documented.

This phase does not execute the harness again. It does not perform runtime validation. It does not invoke the candidate preview route, import application modules, start a local server, read from a live database, mutate a database, execute a candidate pipeline, publish anything, or reactivate operations.

## Prior accepted result

```text
phase_25ed_harness_implementation=approved_committed_and_pushed
phase_25ee_harness_execution=approved
phase_25ee_harness_execution_count=1
phase_25ee_harness_status_code=0
phase_25ee_harness_output_result=passed
phase_25ef_execution_result_review=approved_committed_and_pushed
source_only_file_read_contract_status=passed
runtime_route_validation_status=not_started
live_db_validation_status=not_started
candidate_pipeline_execution_status=not_started
public_publishing_status=not_started
operational_reactivation_status=blocked
```

## Phase 25EG v2 rebound note

```text
phase_25eg_v1_status=failed_safely
phase_25eg_v1_failure=wrapper_marker_name_mismatch
failure_detail=Phase 25EF document records harness_execution_count=1 while the v1 wrapper expected phase_25ee_harness_execution_count=1
source_problem_detected=false
doc_problem_detected=false
harness_execution_performed=false
v2_correction=accept_actual Phase 25EF document markers and equivalent prefixed completion-package markers
```

## Planning conclusion

The read-only auth dependency split has now passed:

1. Source implementation.
2. Source-only verification.
3. Source-only harness design.
4. Source-only harness implementation.
5. Source-only harness execution.
6. Execution result documentation.

This establishes confidence in the static/source-only contract only.

It does not establish route runtime behavior, live database behavior, production readiness, candidate pipeline readiness, public publishing readiness, or operational reactivation readiness.

## Recommended next layer

The safest next layer is a documentation-only decision gate that chooses whether to stop at source-only validation for this dependency or plan a narrowly scoped runtime route validation.

Recommended next phase:

```text
next_phase=Phase 25EH
next_phase_title=Candidate Preview Route Read-Only Auth Dependency Runtime Route Validation Decision Gate
next_phase_type=docs_only_decision
source_change_allowed=false
harness_execution_allowed=false
runtime_validation_execution_allowed=false
route_invocation_allowed=false
local_server_startup_allowed=false
live_db_read_allowed=false
db_mutation_allowed=false
operational_reactivation_allowed=false
```

Phase 25EH should decide between:

```text
option_a=stop_after_source_only_validation_and_continue_non_runtime_hardening
option_b=plan_a_future_route_runtime_validation_without_executing_it
option_c=defer_runtime_route_validation_until_broader_admin_route_test_strategy
```

No runtime execution should occur in Phase 25EH.

## Future route runtime validation risk notes

A future runtime route validation phase would be a materially higher-risk layer than the completed source-only harness because it may require:

1. Route handler execution.
2. Request object construction.
3. Session/auth fixture design.
4. Potential interaction with code paths that access data.
5. A more complex distinction between safe no-DB simulation and live DB behavior.

Therefore, any future runtime route validation must remain behind separate planning, Gemini approval, and explicit operator approval.

## Suggested future runtime approval phrase

If a future runtime execution phase is ever approved, it must require a new explicit phrase. Suggested inactive phrase:

```text
Approve future candidate preview read-only auth runtime route validation exactly once
```

This phrase is inactive in Phase 25EG.

## Explicitly blocked in Phase 25EG

```text
source_changes=false
harness_execution=false
runtime_validation_execution=false
route_invocation=false
local_server_startup=false
live_db_read=false
admin_api_invocation=false
public_route_invocation=false
module_import_execution=false
browser_automation=false
crawler_execution=false
extraction_execution=false
llm_execution=false
candidate_staging=false
candidate_decision_execution=false
approve_for_draft=false
public_publishing=false
db_mutation=false
schema_or_migration_change=false
generated_type_change=false
package_or_lockfile_change=false
environment_value_printing=false
operational_reactivation=false
```

## Planning result

```text
planning_result=post_harness_decision_gate_recommended
recommended_next_phase=Phase 25EH Candidate Preview Route Read-Only Auth Dependency Runtime Route Validation Decision Gate
source_only_contract_status=passed
runtime_route_validation_status=not_started
live_db_validation_status=not_started
candidate_pipeline_execution_status=not_started
public_publishing_status=not_started
operational_reactivation_status=blocked
```

## Boundaries preserved

- Documentation-only post-harness planning.
- No source changes.
- No harness execution.
- No runtime validation execution.
- No route invocation.
- No local server startup.
- No live database read.
- No admin API invocation.
- No public route invocation.
- No module import execution.
- No browser automation.
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

