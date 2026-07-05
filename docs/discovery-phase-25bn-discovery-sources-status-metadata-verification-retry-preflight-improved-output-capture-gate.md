# Discovery Engine Phase 25BN — Discovery Sources Status Metadata Verification Retry Preflight With Improved Output Capture

## Metadata

```text
phase=25BN
title=Discovery Sources Status Metadata Verification Retry Preflight With Improved Output Capture
phase_type=retry_preflight_planning
baseline_phase=25BM
baseline_commit=3bdbcd9
baseline_subject=Document Phase 25BM metadata verification recovery plan
operational_reactivation_status=blocked
planning_only=true
```

## Boundary

This is retry preflight planning only.

This phase does not rerun Phase 25BK.

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

## Prior failure

Phase 25BM classified Phase 25BK as a failed verification attempt, not a schema mismatch.

```text
prior_failed_phase=25BK
prior_failure_documentation_phase=25BL
prior_analysis_phase=25BM
phase_25bk_execution_status=failed_closed
phase_25bk_failure_point=psql_metadata_query
phase_25bk_psql_metadata_query_exit_code=2
schema_success_confirmed=false
schema_mismatch_confirmed=false
root_cause_unknown=true
selected_recovery_path=metadata_verification_retry_preflight_with_improved_output_capture
```

## Retry goal

The retry goal is not broader than Phase 25BK.

The retry goal is to run the same metadata-safe verification with improved output capture so that success confirms the metadata contract, while failure preserves the actual client or connection error for review.

```text
retry_goal=metadata_safe_verification_with_reliable_error_capture
verification_target_table=public.discovery_sources
verification_target_column=status
verification_goal=confirm_status_column_metadata_after_apply
expected_status_column_exists=true
expected_information_schema_status_visible=true
expected_column_type=text
expected_column_nullable=true
expected_check_constraint=discovery_sources_status_check
```

## Future Phase 25BO

Recommended future phase:

```text
next_phase=25BO
next_phase_title=Discovery Sources Status Metadata Verification Retry With Improved Output Capture
next_phase_type=live_metadata_verification_retry
future_exact_approval_phrase=Approve run Phase 25BO metadata-safe live verification retry with improved output capture for discovery_sources status after migration apply.
fresh_james_approval_required=true
fresh_gemini_review_required=true
single_live_retry_attempt_only=true
metadata_query_only=true
```

Phase 25BO must not combine metadata verification with type generation, source changes, candidate execution, public publishing, or operational reactivation.

## Improved output capture requirements

The future Phase 25BO wrapper must preserve useful error output even when `psql` exits nonzero.

```text
capture_stdout=true
capture_stderr=true
capture_combined_output=true
write_raw_output_file=true
write_failure_package_on_any_nonzero_exit=true
copy_failure_package_to_clipboard=true
print_failure_package_path=true
preserve_psql_exit_code=true
do_not_delete_temp_files_before_exit=true
show_safe_redacted_diagnostic_labels=true
do_not_print_database_url=true
database_url_terminal_env_only=true
do_not_scan_env_files=true
```

Required future output files:

```text
future_raw_output_file_required=true
future_failure_package_required=true
future_key_value_output_required_on_success=true
future_log_file_required=true
```

## Future Phase 25BO fail-closed checks

```text
repo_must_equal=https://github.com/jcdumaua/aifinder.git
branch_must_equal=main
expected_baseline_commit_after_25bn_commit_required=true
working_tree_must_be_clean=true
origin_main_must_match_head=true
phase_25bl_failure_doc_must_exist=true
phase_25bm_recovery_plan_must_exist=true
phase_25bn_retry_preflight_doc_must_exist=true
migration_file_must_exist=true
inspection_script_must_remain_unchanged=true
exact_approval_phrase_required=true
fresh_james_approval_required=true
metadata_database_url_terminal_env_only=true
metadata_query_must_be_read_only=true
row_payload_access_must_be_false=true
row_count_output_must_be_false=true
status_value_count_output_must_be_false=true
grouped_count_output_must_be_false=true
db_mutation_must_be_false=true
type_generation_must_be_false=true
source_change_must_be_false=true
inspection_script_change_must_be_false=true
operational_reactivation_must_be_false=true
```

## Metadata query scope

The metadata query scope remains metadata-only.

Allowed checks:

```text
check_table_exists=true
check_status_column_exists=true
check_status_column_type=true
check_status_column_nullable=true
check_status_column_default=true
check_status_check_constraint_present=true
check_rls_metadata_optional=true
```

Blocked checks:

```text
select_row_payload=false
select_table_rows=false
count_rows=false
count_status_values=false
group_by_status=false
join_application_tables=false
write_any_table=false
mutate_any_table=false
refresh_schema_cache=false
generate_types=false
```

## Success interpretation

If Phase 25BO succeeds, the conclusion must remain narrow.

```text
success_means=status_column_metadata_confirmed_after_apply
success_does_not_mean=type_generation_complete
success_does_not_mean=application_source_updated
success_does_not_mean=inspection_script_execution_complete
success_does_not_mean=operational_reactivation
success_does_not_mean=candidate_execution_allowed
success_does_not_mean=public_writes_allowed
```

## Failure interpretation

If Phase 25BO fails, the workflow must document the failure package first.

```text
failure_means=retry_failed_closed
failure_package_required=true
raw_error_output_required=true
no_success_claim_after_failure=true
no_schema_mismatch_claim_without_query_result=true
no_type_generation_after_failure=true
no_source_change_after_failure=true
no_operational_reactivation_after_failure=true
no_live_retry_without_new_review=true
```

## Explicitly blocked from Phase 25BN

```text
rerun_phase_25bk=false
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
retry_preflight_planning_complete=true
future_retry_phase_defined=true
future_exact_approval_phrase_defined=true
improved_output_capture_required=true
failure_package_required_on_nonzero_exit=true
live_retry_not_run=true
psql_not_run=true
supabase_cli_not_run=true
sql_not_run=true
type_generation=false
source_change=false
inspection_script_change=false
operational_reactivation_status=blocked
next_phase_25bo_recommended=true
```

## Gemini review request

Gemini should review this Phase 25BN retry preflight planning gate.

Specific review questions:

1. Does this retry preflight correctly follow Phase 25BM without executing a live retry?
2. Are the improved output capture requirements sufficient to prevent another silent failure?
3. Does the future Phase 25BO scope remain metadata-only and bounded to `public.discovery_sources.status`?
4. Does the plan correctly block type generation, source changes, candidate execution, public writes, and operational reactivation?
5. Is the future exact approval phrase sufficiently explicit?
6. Is Phase 25BO the correct next phase after Phase 25BN is committed and reviewed?
