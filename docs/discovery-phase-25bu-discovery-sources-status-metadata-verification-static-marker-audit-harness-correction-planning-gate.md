# Discovery Engine Phase 25BU — Discovery Sources Status Metadata Verification Static Marker Audit and Harness Correction Planning Gate

## Metadata

```text
phase=25BU
title=Discovery Sources Status Metadata Verification Static Marker Audit and Harness Correction Planning Gate
phase_type=static_marker_audit_and_harness_correction_planning
baseline_phase=25BT
baseline_commit=6bf854e
baseline_subject=Document Phase 25BT static marker verification failure
operational_reactivation_status=blocked
planning_only=true
```

## Boundary

This is static marker audit and harness correction planning only.

This phase does not rerun Phase 25BS.

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

## Input failure being audited

Phase 25BT documented that Phase 25BS failed closed at the local static files check.

```text
phase_25bs_execution_status=failed_closed
phase_25bs_failure_stage=static_files_check
phase_25bs_failure_reason=inspection script marker missing
phase_25bs_failed_step=static_files_check
phase_25bs_last_completed_step=prerequisite_docs_check
phase_25bs_psql_invoked=false
phase_25bs_metadata_query_completed=false
phase_25bs_live_database_queried=false
phase_25bs_status_column_metadata_confirmed=false
phase_25bs_schema_mismatch_confirmed=false
```

## Static marker audit

The Phase 25BS wrapper expected this local source marker:

```text
broken_static_marker=readOnlyLiveInspection
target_file=testing/discovery-read-only-live-inspection.mjs
target_file_exists=true
target_marker_present=false
target_node_check_passed=true
target_file_unchanged=true
migration_file_unchanged=true
```

The failed marker was an execution-wrapper static assertion, not a database assertion.

```text
failure_domain=local_execution_wrapper
database_query_attempted=false
psql_invoked=false
live_database_queried=false
schema_success_confirmed=false
schema_mismatch_confirmed=false
connection_failure_confirmed=false
sql_failure_confirmed=false
```

## Audit conclusion

The Phase 25BS failure was caused by a brittle wrapper marker expectation.

The correction should be made in the future live retry wrapper, not in the repository source or inspection script.

```text
audit_conclusion=wrapper_static_marker_expectation_too_brittle
root_cause_class=local_wrapper_static_marker_mismatch
root_cause_confirmed=true
source_file_drift_confirmed=false
migration_file_drift_confirmed=false
inspection_script_change_required=false
source_change_required=false
wrapper_check_correction_required=true
```

## Harness correction plan

The corrected future wrapper should remove the brittle function-name marker check.

The corrected future wrapper should keep static safety checks that are contract-based and file-based.

```text
remove_brittle_marker_check=true
do_not_require_marker=readOnlyLiveInspection
replace_with_file_exists_check=true
replace_with_node_check=true
replace_with_git_unchanged_check=true
keep_prerequisite_doc_marker_checks=true
keep_migration_marker_checks=true
keep_wrapper_step_telemetry=true
keep_single_psql_attempt_maximum=true
keep_redacted_output_capture=true
keep_failure_package_for_any_failure=true
```

Recommended static checks for the future wrapper:

```text
required_static_check_target_file_exists=true
required_static_check_target_file_node_check=true
required_static_check_target_file_git_unchanged=true
required_static_check_migration_file_exists=true
required_static_check_migration_file_git_unchanged=true
required_static_check_phase_docs_present=true
required_static_check_phase_docs_markers_present=true
required_static_check_working_tree_clean=true
required_static_check_origin_sync=true
required_static_check_no_source_modification=true
required_static_check_no_inspection_script_modification=true
```

## Future Phase 25BV recommendation

Recommended next phase:

```text
next_phase=25BV
next_phase_title=Discovery Sources Status Metadata Verification Retry With Corrected Static Check and Wrapper-Step Telemetry
next_phase_type=live_metadata_verification_retry_with_corrected_static_check
future_exact_approval_phrase=Approve run Phase 25BV metadata-safe live verification retry with corrected static check and wrapper-step telemetry for discovery_sources status.
fresh_james_approval_required=true
fresh_gemini_review_required=true
single_live_retry_attempt_only=true
metadata_query_only=true
operational_reactivation_status=blocked
```

## Future corrected retry scope

The future Phase 25BV retry scope remains unchanged and narrow.

```text
verification_target_table=public.discovery_sources
verification_target_column=status
verification_goal=confirm_status_column_metadata_after_apply
expected_status_column_exists=true
expected_information_schema_status_visible=true
expected_column_type=text
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

## Future success interpretation

If Phase 25BV succeeds, success remains narrow.

```text
success_means=status_column_metadata_confirmed_after_apply
success_does_not_mean=type_generation_complete
success_does_not_mean=application_source_updated
success_does_not_mean=inspection_script_execution_complete
success_does_not_mean=operational_reactivation
success_does_not_mean=candidate_execution_allowed
success_does_not_mean=public_writes_allowed
```

## Future failure interpretation

If Phase 25BV fails, document the result before analysis.

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

## Explicitly blocked from Phase 25BU

```text
rerun_phase_25bs=false
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
phase_25bs_static_marker_failure_audited=true
wrapper_static_marker_mismatch_confirmed=true
brittle_marker_check_identified=true
source_change_not_required=true
inspection_script_change_not_required=true
wrapper_check_correction_required=true
future_retry_phase_defined=true
future_exact_approval_phrase_defined=true
live_retry_not_run=true
psql_not_run=true
supabase_cli_not_run=true
sql_not_run=true
type_generation=false
source_change=false
inspection_script_change=false
operational_reactivation_status=blocked
next_phase_25bv_recommended=true
```

## Gemini review request

Gemini should review this Phase 25BU static marker audit and harness correction planning gate.

Specific review questions:

1. Does this audit correctly classify the Phase 25BS failure as a local wrapper static marker mismatch?
2. Does it correctly avoid claiming metadata success, schema mismatch, connection failure, or SQL failure?
3. Is the recommended correction to remove the brittle wrapper marker check and replace it with file existence, syntax, git-unchanged, and prerequisite marker checks?
4. Does the plan correctly avoid modifying source code or the inspection script?
5. Does the future Phase 25BV scope remain metadata-only and bounded to `public.discovery_sources.status`?
6. Is the future exact approval phrase sufficiently explicit?
7. Is Phase 25BV the correct next phase after Phase 25BU is committed and reviewed?
