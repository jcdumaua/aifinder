# Discovery Engine Phase 25CA — Discovery Sources Status Metadata Verification Connection Input Recovery Planning Gate

## Metadata

```text
phase=25CA
title=Discovery Sources Status Metadata Verification Connection Input Recovery Planning Gate
phase_type=connection_input_recovery_planning
baseline_phase=25BZ
baseline_commit=324adfb
baseline_subject=Document Phase 25BZ connection shape verification failure
operational_reactivation_status=blocked
planning_only=true
```

## Boundary

This is connection input recovery planning only.

This phase does not rerun Phase 25BY.

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

Phase 25BZ documented that Phase 25BY failed closed at the `connection_argument_shape_check` step.

```text
phase_25by_execution_status=failed_closed
phase_25by_failure_stage=connection_argument_shape_check
phase_25by_failure_reason=connection argument shape preflight failed
phase_25by_psql_invoked=false
phase_25by_psql_metadata_query_exit_code=not_run
phase_25by_metadata_query_completed=false
phase_25by_live_database_queried=false
phase_25by_status_column_metadata_confirmed=false
phase_25by_schema_mismatch_confirmed=false
connection_shape_failure_class=not_a_uri_connection_string
raw_database_url_printed=false
```

The preflight worked as intended.

```text
connection_preflight_successfully_prevented_psql=true
metadata_query_started=false
live_database_queried=false
remote_schema_state_confirmed=false
schema_success_confirmed=false
schema_mismatch_confirmed=false
```

## Recovery planning conclusion

The next action is not another retry.

The next action is safe operator recovery planning for assigning a real remote PostgreSQL URI-shaped connection input in terminal only.

```text
planning_conclusion=safe_connection_input_recovery_required
failure_domain=local_operator_connection_input
root_cause_class=connection_input_not_uri_connection_string
root_cause_confirmed=true
schema_issue_confirmed=false
migration_issue_confirmed=false
rls_issue_confirmed=false
query_shape_issue_confirmed=false
```

## Secret handling requirements

No raw connection string, password, database user, host, or database name should be pasted into chat, committed, or written into logs.

```text
raw_database_url_must_not_be_pasted_to_chat=true
raw_database_url_must_not_be_committed=true
raw_database_url_must_not_be_logged=true
raw_database_url_must_not_be_written_to_result_package=true
raw_database_url_must_not_be_written_to_step_log=true
raw_database_url_must_not_be_printed_to_terminal=true
secret_rotation_reminder_required=true
```

Because a live database URI was pasted earlier in this workflow, the Supabase database password should be rotated after this recovery path is complete.

```text
known_prior_secret_exposure=true
supabase_database_password_rotation_required_after_workflow=true
rotation_should_happen_after_verification_path_stabilizes=true
do_not_store_old_secret=true
do_not_reuse_pasted_secret_in_docs=true
```

## Safe terminal recovery guidance

The future retry should require the operator to set the metadata connection input in terminal only.

The connection input must be the full remote PostgreSQL URI-shaped connection string copied from the trusted Supabase project database connection settings.

```text
safe_terminal_guidance_required=true
use_terminal_env_only=true
do_not_scan_env_files=true
do_not_echo_database_url=true
do_not_paste_database_url_into_chat=true
single_quoted_export_required=true
placeholder_replacement_required=true
remote_postgresql_uri_required=true
postgresql_uri_scheme_required=true
remote_host_required=true
password_required=true
local_socket_input_disallowed=true
bare_password_input_disallowed=true
non_uri_input_disallowed=true
```

The operator must not assign only a password, project reference, host name, or copied shell prompt fragment.

```text
bare_password_input_invalid=true
project_ref_only_input_invalid=true
host_only_input_invalid=true
pooler_host_only_input_invalid=true
shell_prompt_fragment_invalid=true
partial_uri_invalid=true
unquoted_special_character_risk=true
```

## Future Phase 25CB recommendation

Recommended next phase:

```text
next_phase=25CB
next_phase_title=Discovery Sources Status Metadata Verification Retry With Recovered Remote Connection Input
next_phase_type=live_metadata_verification_retry_with_recovered_remote_connection_input
future_exact_approval_phrase=Approve run Phase 25CB metadata-safe live verification retry with recovered remote connection input for discovery_sources status.
fresh_james_approval_required=true
fresh_gemini_review_required=true
single_live_retry_attempt_only=true
metadata_query_only=true
connection_shape_preflight_required=true
operational_reactivation_status=blocked
```

## Future Phase 25CB operator instructions

The future Phase 25CB run instructions should keep secrets local to terminal.

They should not print an example containing a database URI.

They should not include a literal placeholder that could be accidentally run as a non-URI value.

```text
future_instructions_should_not_print_uri_example=true
future_instructions_should_not_include_angle_bracket_placeholder=true
future_instructions_should_not_include_fake_database_url=true
future_instructions_should_say_set_the_env_var_to_the_full_remote_connection_uri=true
future_instructions_should_say_use_single_quotes_around_value=true
future_instructions_should_say_do_not_paste_value_into_chat=true
future_instructions_should_say_use_trusted_supabase_connection_settings=true
```

## Future Phase 25CB wrapper requirements

Future Phase 25CB should keep the Phase 25BY connection shape preflight.

```text
keep_connection_input_presence_check=true
keep_connection_input_non_empty_check=true
keep_connection_input_no_whitespace_only_check=true
keep_connection_input_scheme_check=true
keep_connection_input_remote_host_check=true
keep_connection_input_no_local_socket_fallback_check=true
keep_connection_input_placeholder_detection=true
keep_redacted_shape_summary=true
keep_raw_secret_output_blocked=true
keep_single_psql_attempt_maximum=true
keep_result_documentation_first_on_failure=true
```

The future wrapper should fail closed before `psql` if the connection input is not a valid remote URI-shaped connection string.

```text
fail_closed_before_psql_on_missing_connection=true
fail_closed_before_psql_on_empty_connection=true
fail_closed_before_psql_on_placeholder_connection=true
fail_closed_before_psql_on_unsupported_scheme=true
fail_closed_before_psql_on_missing_remote_host=true
fail_closed_before_psql_on_local_socket_shape=true
fail_closed_before_psql_on_localhost_shape=true
fail_closed_before_psql_on_missing_password=true
fail_closed_before_psql_on_unclassified_connection=true
```

## Future retry scope remains unchanged

The future retry scope remains unchanged and narrow.

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

If Phase 25CB succeeds, success remains narrow.

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

If Phase 25CB fails, document the result before analysis.

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

## Explicitly blocked from Phase 25CA

```text
rerun_phase_25by=false
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
phase_25by_connection_shape_failure_analyzed=true
connection_input_recovery_required=true
safe_terminal_guidance_defined=true
raw_secret_output_blocked=true
prior_secret_exposure_reminder_documented=true
supabase_database_password_rotation_required_after_workflow=true
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
next_phase_25cb_recommended=true
```

## Gemini review request

Gemini should review this Phase 25CA connection input recovery planning gate.

Specific review questions:

1. Does this planning gate correctly follow Phase 25BZ without executing another retry?
2. Does it correctly classify the issue as local connection input shape recovery without claiming schema success or mismatch?
3. Are the proposed operator recovery instructions safe and specific enough to avoid repeating a non-URI input?
4. Does the plan correctly avoid printing, storing, or committing database URLs or secrets?
5. Does it correctly include the database password rotation reminder after the workflow because a live URI was previously pasted?
6. Does the future Phase 25CB scope remain metadata-only and bounded to `public.discovery_sources.status`?
7. Is the future exact approval phrase sufficiently explicit?
8. Is Phase 25CB the correct next phase after Phase 25CA is committed and reviewed?
