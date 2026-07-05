# Discovery Engine Phase 25BX — Discovery Sources Status Metadata Verification Connection Argument Preflight Planning Gate

## Metadata

```text
phase=25BX
title=Discovery Sources Status Metadata Verification Connection Argument Preflight Planning Gate
phase_type=connection_argument_preflight_planning
baseline_phase=25BW
baseline_commit=5ac1a69
baseline_subject=Document Phase 25BW psql socket verification failure
operational_reactivation_status=blocked
planning_only=true
```

## Boundary

This is connection argument preflight planning only.

This phase does not rerun Phase 25BV.

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

## Input failure being planned from

Phase 25BW documented that Phase 25BV failed closed at the `psql_query_attempt` step.

```text
phase_25bv_execution_status=failed_closed
phase_25bv_failure_stage=psql_query_attempt
phase_25bv_failure_reason=metadata query failed with exit code 2
phase_25bv_psql_invoked=true
phase_25bv_psql_metadata_query_exit_code=2
phase_25bv_metadata_query_completed=false
phase_25bv_status_column_metadata_confirmed=false
phase_25bv_schema_mismatch_confirmed=false
captured_psql_output_class=local_socket_connection_failure
remote_metadata_database_reached=false
remote_schema_state_confirmed=false
root_cause_class=connection_argument_or_environment_resolution_issue
```

The captured output showed local socket fallback:

```text
local_socket_path=/tmp/.s.PGSQL.5432
local_socket_fallback_detected=true
remote_connection_not_confirmed=true
```

## Planning conclusion

The next retry must validate the connection argument shape before allowing `psql` execution.

This is a local execution-harness input validation issue, not a schema finding.

```text
planning_conclusion=connection_argument_shape_preflight_required
failure_domain=local_connection_argument_resolution
schema_success_confirmed=false
schema_mismatch_confirmed=false
sql_result_available=false
remote_schema_state_confirmed=false
root_cause_confirmed=false
```

## Connection argument preflight requirements

Future Phase 25BY must perform safe, non-secret connection argument preflight before any `psql` attempt.

```text
connection_input_presence_check_required=true
connection_input_non_empty_check_required=true
connection_input_no_whitespace_only_check_required=true
connection_input_scheme_check_required=true
connection_input_remote_host_check_required=true
connection_input_no_local_socket_fallback_required=true
connection_input_placeholder_detection_required=true
connection_input_redacted_summary_required=true
connection_input_must_not_be_printed=true
connection_input_must_not_be_written_to_result_package=true
connection_input_must_not_be_written_to_step_log=true
```

Allowed connection shape:

```text
allowed_connection_scheme_postgresql=true
allowed_connection_scheme_postgres=true
remote_host_required=true
local_socket_path_disallowed=true
empty_connection_string_disallowed=true
placeholder_connection_string_disallowed=true
raw_secret_output_disallowed=true
```

Safe redacted summary allowed:

```text
redacted_summary_scheme_allowed=true
redacted_summary_host_class_allowed=true
redacted_summary_port_presence_allowed=true
redacted_summary_sslmode_presence_allowed=true
redacted_summary_password_presence_allowed=true
redacted_summary_raw_host_value_disallowed=false
redacted_summary_raw_password_disallowed=true
redacted_summary_raw_user_disallowed=true
redacted_summary_raw_database_disallowed=true
```

## Future Phase 25BY recommendation

Recommended next phase:

```text
next_phase=25BY
next_phase_title=Discovery Sources Status Metadata Verification Retry With Connection Argument Preflight
next_phase_type=live_metadata_verification_retry_with_connection_argument_preflight
future_exact_approval_phrase=Approve run Phase 25BY metadata-safe live verification retry with connection argument preflight for discovery_sources status.
fresh_james_approval_required=true
fresh_gemini_review_required=true
single_live_retry_attempt_only=true
metadata_query_only=true
operational_reactivation_status=blocked
```

## Future Phase 25BY wrapper steps

Future Phase 25BY should keep the previous safe wrapper sequence and insert the connection argument shape check before `psql_binary_check`.

```text
step_approval_phrase_check=true
step_metadata_url_env_presence_check=true
step_connection_argument_shape_check=true
step_repo_identity_check=true
step_branch_check=true
step_head_baseline_check=true
step_origin_sync_check=true
step_working_tree_clean_check=true
step_prerequisite_docs_check=true
step_corrected_static_files_check=true
step_psql_binary_check=true
step_npm_check=true
step_sql_file_write=true
step_before_psql=true
step_psql_query_attempt=true
step_success_marker_validation=true
```

The connection argument shape check must fail closed before `psql` if the variable is empty, placeholder-like, lacks a supported URI scheme, or cannot be classified as a remote connection target.

```text
fail_closed_before_psql_on_missing_connection=true
fail_closed_before_psql_on_placeholder_connection=true
fail_closed_before_psql_on_unsupported_scheme=true
fail_closed_before_psql_on_local_socket_shape=true
fail_closed_before_psql_on_unclassified_connection=true
```

## Terminal guidance for future run

Future run instructions should use a separately assigned connection variable and avoid placeholder execution.

```text
use_terminal_env_only=true
do_not_scan_env_files=true
do_not_echo_database_url=true
do_not_paste_database_url_into_chat=true
recommended_assignment_style=single_quoted_export
database_url_placeholder_must_be_replaced=true
```

The future script should visibly check for unreplaced placeholder text before running.

```text
placeholder_text_detection_required=true
literal_placeholder_less_than_greater_than_detection_required=true
literal_your_database_url_detection_required=true
```

## Future retry scope remains unchanged

The future Phase 25BY retry scope remains unchanged and narrow.

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

If Phase 25BY succeeds, success remains narrow.

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

If Phase 25BY fails, document the result before analysis.

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

## Explicitly blocked from Phase 25BX

```text
rerun_phase_25bv=false
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
phase_25bv_psql_local_socket_failure_analyzed=true
connection_argument_preflight_required=true
local_socket_fallback_guard_required=true
placeholder_detection_required=true
raw_secret_output_blocked=true
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
next_phase_25by_recommended=true
```

## Gemini review request

Gemini should review this Phase 25BX connection argument preflight planning gate.

Specific review questions:

1. Does this planning gate correctly follow Phase 25BW without executing another retry?
2. Does it correctly classify the failure as a connection argument or environment resolution issue without claiming schema success or mismatch?
3. Are the proposed connection argument preflight checks sufficient to prevent local socket fallback?
4. Does the plan correctly avoid printing or storing database URLs or secrets?
5. Does the future Phase 25BY scope remain metadata-only and bounded to `public.discovery_sources.status`?
6. Is the future exact approval phrase sufficiently explicit?
7. Is Phase 25BY the correct next phase after Phase 25BX is committed and reviewed?
