# Discovery Engine Phase 25BQ — Discovery Sources Status Metadata Verification Retry Pre-psql Failure Analysis and Harness Correction Planning Gate

## Metadata

```text
phase=25BQ
title=Discovery Sources Status Metadata Verification Retry Pre-psql Failure Analysis and Harness Correction Planning Gate
phase_type=failure_analysis_and_harness_correction_planning
baseline_phase=25BP
baseline_commit=45b6515
baseline_subject=Document Phase 25BP pre-psql verification failure
operational_reactivation_status=blocked
planning_only=true
```

## Boundary

This is failure analysis and harness correction planning only.

This phase does not rerun Phase 25BO.

This phase does not run `psql`.

This phase does not run Supabase CLI.

This phase does not run SQL.

This phase does not run live DB reads.

This phase does not run live metadata reads.

This phase does not scan `.env` files.

This phase does not inspect or print database URLs.

This phase does not access row payload.

This phase does not enumerate rows.

This phase does not count rows.

This phase does not count status values.

This phase does not run grouped counts.

This phase does not mutate database state.

This phase does not apply a migration.

This phase does not create or edit a migration.

This phase does not generate types.

This phase does not modify source code.

This phase does not modify the read-only inspection script.

This phase does not commit or push.

## Input failure being analyzed

Phase 25BP documented that Phase 25BO failed closed before `psql` ran.

```text
phase_25bo_execution_status=failed_closed
phase_25bo_failure_point=pre_psql
phase_25bo_psql_metadata_query_exit_code=not_run
phase_25bo_metadata_query_completed=false
phase_25bo_status_column_metadata_confirmed=false
phase_25bo_schema_mismatch_confirmed=false
metadata_query_reached_psql=false
live_database_queried=false
root_cause_unknown=true
```

## Analysis

Phase 25BO failed before the metadata query could run.

Therefore, Phase 25BO did not produce evidence about:

```text
schema_success_confirmed=false
schema_mismatch_confirmed=false
connection_failure_confirmed=false
sql_error_confirmed=false
status_column_metadata_confirmed=false
```

The failure class is local harness/preflight, not database metadata.

```text
classification=phase_25bo_pre_psql_harness_or_preflight_failure
failure_domain=local_wrapper_preflight
database_query_attempted=false
raw_psql_output_available=false
psql_stderr_available=false
exact_failed_preflight_step_available=false
root_cause_confirmed=false
```

## Harness gap identified

Phase 25BO improved `psql` output capture, but its failure package did not expose the exact pre-`psql` safety trap that halted the wrapper.

That means the next harness must capture wrapper-level step telemetry, not only `psql` stdout/stderr.

```text
gap=pre_psql_step_failure_not_identified_in_failure_package
psql_capture_improved=true
wrapper_step_capture_insufficient=true
failure_package_needs_last_step=true
failure_package_needs_failed_step=true
failure_package_needs_safe_log_excerpt=true
```

## Corrected recovery path

The next safe path is not another blind live retry.

The next safe path is to plan a corrected Phase 25BR wrapper that adds wrapper-step telemetry before any future metadata query attempt.

```text
selected_recovery_path=corrected_retry_wrapper_with_pre_psql_step_telemetry
immediate_live_retry_authorized=false
blind_retry_authorized=false
metadata_verification_retry_authorized=false
type_generation_authorized=false
source_change_authorized=false
operational_reactivation_authorized=false
```

## Future Phase 25BR recommendation

Recommended next phase:

```text
next_phase=25BR
next_phase_title=Discovery Sources Status Metadata Verification Retry Wrapper Correction Preflight Gate
next_phase_type=corrected_retry_wrapper_preflight_planning
live_retry_authorized=false
metadata_verification_retry_authorized=false
fresh_gemini_review_required=true
fresh_james_approval_required=true
operational_reactivation_status=blocked
```

Phase 25BR should define the corrected wrapper before any future live retry.

## Future corrected wrapper requirements

The future corrected wrapper should add safe wrapper-step telemetry:

```text
current_step_variable_required=true
last_completed_step_required=true
failed_step_required=true
failure_reason_required=true
failure_stage_required=true
pre_psql_failure_package_required=true
safe_log_excerpt_required=true
redacted_output_required=true
raw_local_log_path_required=true
raw_psql_output_path_required_even_if_not_run=true
do_not_print_database_url=true
do_not_scan_env_files=true
metadata_database_url_terminal_env_only=true
```

Required wrapper steps:

```text
step_approval_phrase_check=true
step_database_url_env_presence_check=true
step_repo_identity_check=true
step_branch_check=true
step_head_baseline_check=true
step_origin_sync_check=true
step_working_tree_clean_check=true
step_prerequisite_docs_check=true
step_migration_static_check=true
step_inspection_script_static_check=true
step_psql_binary_check=true
step_npm_check=true
step_sql_file_write=true
step_before_psql_marker=true
step_psql_query_attempt=true
step_success_marker_validation=true
```

Each step must set a safe step name before execution.

```text
step_names_must_not_contain_secrets=true
failure_package_must_include_current_step=true
failure_package_must_include_last_completed_step=true
failure_package_must_include_psql_status=true
failure_package_must_include_whether_psql_was_invoked=true
```

## Future retry scope remains unchanged

The future metadata verification target remains narrow:

```text
verification_target_table=public.discovery_sources
verification_target_column=status
verification_goal=confirm_status_column_metadata_after_apply
metadata_query_only=true
row_payload_access=false
row_enumeration=false
row_count_output=false
status_value_count_output=false
grouped_count_output=false
db_mutation=false
type_generation=false
source_change=false
inspection_script_change=false
operational_reactivation=false
```

## Explicitly blocked after Phase 25BQ

```text
rerun_phase_25bo=false
run_psql=false
run_supabase_cli=false
run_sql=false
run_live_db_read=false
run_live_metadata_read=false
scan_env_files=false
inspect_database_url=false
print_database_url=false
row_payload_access=false
row_enumeration=false
status_value_count=false
grouped_count=false
apply_migration=false
run_type_generation=false
modify_source_code=false
modify_inspection_script=false
candidate_decision_execution=false
approve_for_draft=false
public_tools_writes=false
discovered_tools_writes=false
reactivate_operational_flow=false
```

## Success criteria

```text
phase_25bo_pre_psql_failure_analyzed_without_overclaim=true
schema_success_not_claimed=true
schema_mismatch_not_claimed=true
connection_failure_not_claimed=true
root_cause_remains_unknown=true
harness_gap_identified=true
wrapper_step_telemetry_required=true
corrected_retry_wrapper_preflight_required=true
immediate_retry_blocked=true
type_generation_deferred=true
source_change_deferred=true
operational_reactivation_status=blocked
next_phase_25br_recommended=true
```

## Gemini review request

Gemini should review this Phase 25BQ failure analysis and harness correction planning gate.

Specific review questions:

1. Does this analysis correctly treat Phase 25BO as a pre-`psql` harness/preflight failure?
2. Does it correctly avoid claiming schema success, schema mismatch, connection failure, or SQL failure?
3. Is it correct to require wrapper-step telemetry before another live retry?
4. Does the plan correctly keep type generation, source changes, candidate execution, public writes, and operational reactivation blocked?
5. Is Phase 25BR corrected retry wrapper preflight planning the correct next phase?
