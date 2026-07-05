# Discovery Engine Phase 25BR — Discovery Sources Status Metadata Verification Retry Wrapper Correction Preflight Gate

## Metadata

```text
phase=25BR
title=Discovery Sources Status Metadata Verification Retry Wrapper Correction Preflight Gate
phase_type=corrected_retry_wrapper_preflight_planning
baseline_phase=25BQ
baseline_commit=ed4567e
baseline_subject=Document Phase 25BQ pre-psql harness correction plan
operational_reactivation_status=blocked
planning_only=true
```

## Boundary

This is corrected retry wrapper preflight planning only.

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

## Input failure and correction target

Phase 25BQ established that Phase 25BO failed before `psql` ran.

```text
prior_failed_phase=25BO
prior_failure_documentation_phase=25BP
prior_analysis_phase=25BQ
phase_25bo_execution_status=failed_closed
phase_25bo_failure_point=pre_psql
phase_25bo_psql_metadata_query_exit_code=not_run
metadata_query_reached_psql=false
live_database_queried=false
schema_success_confirmed=false
schema_mismatch_confirmed=false
connection_failure_confirmed=false
root_cause_unknown=true
```

The identified harness gap was:

```text
gap=pre_psql_step_failure_not_identified_in_failure_package
wrapper_step_capture_insufficient=true
failure_package_needs_current_step=true
failure_package_needs_last_completed_step=true
failure_package_needs_failed_step=true
failure_package_needs_safe_log_excerpt=true
```

## Corrected future Phase 25BS

Recommended future phase:

```text
next_phase=25BS
next_phase_title=Discovery Sources Status Metadata Verification Retry With Wrapper-Step Telemetry
next_phase_type=live_metadata_verification_retry_with_wrapper_step_telemetry
future_exact_approval_phrase=Approve run Phase 25BS metadata-safe live verification retry with wrapper-step telemetry for discovery_sources status after pre-psql harness correction.
fresh_james_approval_required=true
fresh_gemini_review_required=true
single_live_retry_attempt_only=true
metadata_query_only=true
operational_reactivation_status=blocked
```

## Corrected wrapper requirements

The future Phase 25BS wrapper must track safe wrapper-step telemetry before every safety check.

```text
current_step_variable_required=true
last_completed_step_variable_required=true
failed_step_variable_required=true
mark_step_function_required=true
complete_step_function_required=true
fail_closed_function_must_record_step=true
failure_package_must_include_current_step=true
failure_package_must_include_last_completed_step=true
failure_package_must_include_failed_step=true
failure_package_must_include_failure_reason=true
failure_package_must_include_whether_psql_was_invoked=true
failure_package_must_include_psql_exit_code_or_not_run=true
failure_package_must_include_safe_log_excerpt=true
failure_package_must_include_local_file_paths=true
failure_package_must_be_written_for_pre_psql_failure=true
failure_package_must_be_written_for_psql_failure=true
failure_package_must_be_written_for_success_marker_failure=true
```

## Required step names

The future wrapper should use safe, non-secret step names.

```text
step_00_start=start
step_01_approval_phrase_check=approval_phrase_check
step_02_metadata_url_presence_check=metadata_url_env_presence_check
step_03_repo_identity_check=repo_identity_check
step_04_branch_check=branch_check
step_05_head_baseline_check=head_baseline_check
step_06_origin_sync_check=origin_sync_check
step_07_working_tree_clean_check=working_tree_clean_check
step_08_prerequisite_docs_check=prerequisite_docs_check
step_09_static_files_check=static_files_check
step_10_psql_binary_check=psql_binary_check
step_11_npm_check=npm_check
step_12_sql_file_write=sql_file_write
step_13_before_psql=before_psql
step_14_psql_query_attempt=psql_query_attempt
step_15_success_marker_validation=success_marker_validation
step_16_result_package_write=result_package_write
```

These step names must not contain secrets or environment values.

```text
step_names_must_not_contain_secrets=true
step_names_must_not_contain_database_url=true
step_names_must_not_contain_credentials=true
```

## Corrected failure package requirements

The future failure package must distinguish pre-`psql`, `psql`, and post-`psql` marker-validation failures.

```text
pre_psql_failure_classification_required=true
psql_failure_classification_required=true
post_psql_marker_failure_classification_required=true
psql_invoked_boolean_required=true
psql_status_required=true
metadata_query_completed_boolean_required=true
live_database_queried_boolean_required=true
status_column_metadata_confirmed_boolean_required=true
schema_mismatch_confirmed_boolean_required=true
root_cause_confirmed_boolean_required=true
```

Required safe diagnostic fields:

```text
phase_required=true
baseline_commit_required=true
current_step_required=true
last_completed_step_required=true
failed_step_required=true
failure_reason_required=true
psql_invoked_required=true
psql_status_required=true
work_dir_required=true
log_path_required=true
raw_output_path_required=true
redacted_output_path_required=true
failure_package_path_required=true
```

## Corrected retry scope

The future Phase 25BS retry scope remains unchanged and narrow.

```text
verification_target_table=public.discovery_sources
verification_target_column=status
verification_goal=confirm_status_column_metadata_after_apply
expected_status_column_exists=true
expected_information_schema_status_visible=true
expected_column_type=text
expected_column_nullable=true
expected_check_constraint=discovery_sources_status_check
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

## Corrected retry success interpretation

If Phase 25BS succeeds, success remains narrow.

```text
success_means=status_column_metadata_confirmed_after_apply
success_does_not_mean=type_generation_complete
success_does_not_mean=application_source_updated
success_does_not_mean=inspection_script_execution_complete
success_does_not_mean=operational_reactivation
success_does_not_mean=candidate_execution_allowed
success_does_not_mean=public_writes_allowed
```

## Corrected retry failure interpretation

If Phase 25BS fails, document the result before analysis.

```text
failure_means=retry_failed_closed
failure_package_required=true
failed_step_must_be_known=true
no_success_claim_after_failure=true
no_schema_mismatch_claim_without_query_result=true
no_type_generation_after_failure=true
no_source_change_after_failure=true
no_operational_reactivation_after_failure=true
no_live_retry_without_new_review=true
failure_result_documentation_required_before_analysis=true
```

## Explicitly blocked from Phase 25BR

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
corrected_retry_wrapper_preflight_complete=true
future_retry_phase_defined=true
future_exact_approval_phrase_defined=true
wrapper_step_telemetry_required=true
pre_psql_failure_package_required=true
psql_failure_package_required=true
failed_step_required=true
psql_invoked_boolean_required=true
live_retry_not_run=true
psql_not_run=true
supabase_cli_not_run=true
sql_not_run=true
type_generation=false
source_change=false
inspection_script_change=false
operational_reactivation_status=blocked
next_phase_25bs_recommended=true
```

## Gemini review request

Gemini should review this Phase 25BR corrected retry wrapper preflight planning gate.

Specific review questions:

1. Does this preflight correctly follow Phase 25BQ without executing a live retry?
2. Are the wrapper-step telemetry requirements sufficient to identify any future pre-`psql` failure step?
3. Does the future Phase 25BS scope remain metadata-only and bounded to `public.discovery_sources.status`?
4. Does the plan correctly block type generation, source changes, candidate execution, public writes, and operational reactivation?
5. Is the future exact approval phrase sufficiently explicit?
6. Is Phase 25BS the correct next phase after Phase 25BR is committed and reviewed?
