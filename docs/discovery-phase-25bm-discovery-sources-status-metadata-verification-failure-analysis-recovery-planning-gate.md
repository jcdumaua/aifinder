# Discovery Engine Phase 25BM — Discovery Sources Status Metadata Verification Failure Analysis and Recovery Planning Gate

## Metadata

```text
phase=25BM
title=Discovery Sources Status Metadata Verification Failure Analysis and Recovery Planning Gate
phase_type=failure_analysis_and_recovery_planning
baseline_phase=25BL
baseline_commit=5685b79
baseline_subject=Document Phase 25BL failed metadata verification
operational_reactivation_status=blocked
planning_only=true
```

## Boundary

This is failure analysis and recovery planning only.

This phase does not rerun Phase 25BK.

This phase does not run `psql`.

This phase does not run Supabase CLI.

This phase does not run SQL.

This phase does not run live DB reads.

This phase does not run live metadata reads.

This phase does not scan `.env` files.

This phase does not print, validate, or inspect database URLs.

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

Phase 25BL documented that Phase 25BK failed closed.

```text
phase_25bk_execution_status=failed_closed
phase_25bk_failure_point=psql_metadata_query
phase_25bk_psql_metadata_query_exit_code=2
phase_25bk_metadata_query_completed=false
phase_25bk_status_column_confirmed=false
schema_mismatch_confirmed=false
root_cause_unknown=true
no_live_retry_without_new_review=true
```

## Analysis

The available evidence is enough to classify Phase 25BK as a harness/execution failure, not a schema verification result.

```text
classification=metadata_verification_harness_or_connection_failure
schema_success_confirmed=false
schema_mismatch_confirmed=false
metadata_query_completed=false
raw_psql_error_unavailable=true
failure_package_unavailable=true
```

A `psql` exit code of `2` commonly indicates a connection, command-line, or client-side execution problem rather than a successful SQL query returning negative metadata. Because the raw `psql` error output was unavailable, the exact cause remains unknown.

Possible root-cause classes:

```text
possible_cause_database_url_format=true
possible_cause_database_url_shell_quoting=true
possible_cause_terminal_env_variable_value=true
possible_cause_network_or_ipv6=true
possible_cause_authentication_or_credential_issue=true
possible_cause_ssl_or_pooler_mode=true
possible_cause_psql_client_behavior=true
possible_cause_wrapper_output_capture_gap=true
```

## Recovery decision

The safe recovery path is not an immediate retry.

The safe recovery path is to first plan an improved retry wrapper that captures the `psql` failure output reliably and separates connection verification from metadata verification.

```text
selected_recovery_path=metadata_verification_retry_preflight_with_improved_output_capture
immediate_live_retry_authorized=false
blind_retry_authorized=false
type_generation_authorized=false
source_change_authorized=false
operational_reactivation_authorized=false
```

## Future Phase 25BN recommendation

Recommended next phase:

```text
next_phase=25BN
next_phase_title=Discovery Sources Status Metadata Verification Retry Preflight With Improved Output Capture
next_phase_type=retry_preflight_planning
live_retry_authorized=false
metadata_verification_retry_authorized=false
fresh_gemini_review_required=true
fresh_james_approval_required=true
operational_reactivation_status=blocked
```

Phase 25BN should plan a safer retry wrapper before any live retry.

## Future retry wrapper requirements

Any future retry wrapper should:

```text
require_exact_fresh_approval_phrase=true
require_clean_repo=true
require_origin_main_equals_head=true
require_expected_baseline_after_25bn_commit=true
do_not_scan_env_files=true
database_url_terminal_env_only=true
do_not_print_database_url=true
capture_psql_stdout_and_stderr_before_exit=true
create_failure_package_even_if_psql_fails=true
copy_failure_package_to_clipboard=true
preserve_psql_exit_code=true
single_retry_attempt_only=true
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

## Future retry query scope

Future retry query scope should remain unchanged from Phase 25BJ unless Phase 25BN explicitly changes it after review.

```text
verification_target_table=public.discovery_sources
verification_target_column=status
verification_goal=confirm_status_column_metadata_after_apply
expected_status_column_exists=true
expected_information_schema_status_visible=true
expected_column_type=text
expected_column_nullable=true
expected_check_constraint=discovery_sources_status_check
```

## Explicitly blocked after Phase 25BM

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
phase_25bk_failure_analyzed_without_overclaim=true
schema_success_not_claimed=true
schema_mismatch_not_claimed=true
root_cause_remains_unknown=true
recovery_path_selected=true
immediate_retry_blocked=true
retry_preflight_required=true
type_generation_deferred=true
source_change_deferred=true
operational_reactivation_status=blocked
next_phase_25bn_recommended=true
```

## Gemini review request

Gemini should review this Phase 25BM failure analysis and recovery planning gate.

Specific review questions:

1. Does this analysis correctly treat Phase 25BK as a failed verification attempt, not as evidence of a schema mismatch?
2. Is it correct to avoid an immediate live retry?
3. Is the selected recovery path, a retry preflight with improved output capture, the safest next step?
4. Are type generation, source changes, candidate execution, public writes, and operational reactivation correctly blocked?
5. Is Phase 25BN the correct next phase?
