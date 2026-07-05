# Discovery Engine Phase 25BJ — Discovery Sources Status Post-Apply Metadata Verification Preflight Gate

## Metadata

```text
phase=25BJ
title=Discovery Sources Status Post-Apply Metadata Verification Preflight Gate
phase_type=metadata_verification_preflight
baseline_phase=25BI
baseline_commit=49be827
baseline_subject=Document Phase 25BI live apply result
migration_file=supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql
operational_reactivation_status=blocked
planning_only=true
```

## Boundary

This is a post-apply metadata verification preflight planning gate only.

This phase does not run Supabase CLI.

This phase does not run SQL.

This phase does not run live DB reads.

This phase does not run live metadata reads.

This phase does not scan `.env` files.

This phase does not access row payload.

This phase does not enumerate rows.

This phase does not count live status values.

This phase does not run grouped counts.

This phase does not mutate database state.

This phase does not apply a migration.

This phase does not create a migration.

This phase does not edit a migration.

This phase does not edit historical migrations.

This phase does not generate types.

This phase does not change RLS policies.

This phase does not change grants.

This phase does not modify source code.

This phase does not modify the read-only inspection script.

This phase does not commit or push.

## Prior execution result

Phase 25BI documented the Phase 25BH live apply as successful.

```text
phase_25bh_execution_status=success
phase_25bh_command=supabase db push
phase_25bh_supabase_db_push_exit_code=0
phase_25bh_output_marker=Finished supabase db push.
migration_file=supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql
operational_reactivation_status=blocked
```

This preflight does not assert that metadata verification has already succeeded.

The live metadata verification remains pending.

## Verification target

The next live verification should be scoped only to post-apply metadata for `public.discovery_sources.status`.

```text
verification_target_table=public.discovery_sources
verification_target_column=status
verification_goal=confirm_status_column_metadata_after_apply
expected_table_exists=true
expected_status_column_exists=true
expected_information_schema_status_visible=true
expected_column_type=text
expected_column_nullable=true
expected_check_constraint=discovery_sources_status_check
row_payload_access=false
row_enumeration=false
status_value_count=false
grouped_count=false
```

## Future verification query contract

The future Phase 25BK verification must use metadata-only queries.

Allowed metadata checks:

```text
check_table_exists=true
check_status_column_exists=true
check_status_column_type=true
check_status_column_nullable=true
check_status_column_default=true
check_status_check_constraint_present=true
check_policy_metadata_optional=true
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

## Future live verification phase

Recommended future phase:

```text
next_phase=25BK
next_phase_title=Discovery Sources Status Post-Apply Metadata Verification Gate
next_phase_type=live_metadata_verification
future_exact_approval_phrase=Approve run Phase 25BK metadata-safe live verification for discovery_sources status after migration apply.
fresh_james_approval_required=true
single_live_metadata_verification_attempt=true
metadata_query_only=true
```

Phase 25BK should verify the metadata result only. It must not combine verification with type generation, source changes, candidate execution, public publishing, or operational reactivation.

## Future Phase 25BK fail-closed requirements

Phase 25BK must fail closed unless all of the following are true:

```text
repo_must_equal=https://github.com/jcdumaua/aifinder.git
branch_must_equal=main
expected_baseline_commit_after_25bj_commit_required=true
working_tree_must_be_clean=true
origin_main_must_match_head=true
phase_25bi_result_doc_must_exist=true
phase_25bj_preflight_doc_must_exist=true
migration_file_must_exist=true
exact_approval_phrase_required=true
fresh_james_approval_required=true
metadata_query_must_be_read_only=true
row_payload_access_must_be_false=true
row_count_output_must_be_false=true
status_value_count_output_must_be_false=true
grouped_count_output_must_be_false=true
type_generation_must_be_false=true
source_change_must_be_false=true
operational_reactivation_must_be_false=true
```

## Future success interpretation

If Phase 25BK confirms `public.discovery_sources.status` metadata exists after the apply, that should be interpreted narrowly.

```text
metadata_verification_success_means=status_column_metadata_confirmed
metadata_verification_success_does_not_mean=type_generation_complete
metadata_verification_success_does_not_mean=application_source_updated
metadata_verification_success_does_not_mean=inspection_script_rerun_complete
metadata_verification_success_does_not_mean=operational_reactivation
metadata_verification_success_does_not_mean=candidate_execution_allowed
metadata_verification_success_does_not_mean=public_writes_allowed
```

## Future failure interpretation

If Phase 25BK fails to confirm the status column metadata, the workflow must stop.

```text
metadata_verification_failed_closed=true
no_type_generation_after_failed_metadata_verification=true
no_source_change_after_failed_metadata_verification=true
no_operational_reactivation_after_failed_metadata_verification=true
no_live_retry_without_new_review=true
failure_result_documentation_required=true
```

## Explicitly blocked from Phase 25BJ

```text
run_supabase_cli=false
run_dashboard_sql=false
run_sql=false
run_live_db_read=false
run_live_metadata_inspection=false
scan_env_files=false
row_payload_access=false
row_enumeration=false
status_value_count=false
grouped_count=false
apply_migration=false
create_migration=false
edit_migration=false
edit_historical_migration=false
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
post_apply_metadata_verification_preflight_complete=true
future_metadata_verification_phase_defined=true
future_exact_approval_phrase_defined=true
live_metadata_verification_not_run=true
supabase_cli_not_run=true
sql_not_run=true
live_db_reads=false
row_payload_access=false
type_generation=false
source_change=false
inspection_script_change=false
operational_reactivation_status=blocked
next_phase_25bk_recommended=true
```

## Gemini review request

Gemini should review this Phase 25BJ post-apply metadata verification preflight gate for safety and boundary correctness.

Specific review questions:

1. Does this preflight correctly follow Phase 25BI without running live metadata verification?
2. Is the future Phase 25BK metadata verification scope sufficiently narrow?
3. Are row payload access, row counts, status counts, grouped counts, writes, type generation, source changes, and operational reactivation correctly blocked?
4. Is the future exact approval phrase sufficiently explicit?
5. Does the success interpretation avoid overclaiming beyond metadata confirmation?
6. Is Phase 25BK the correct next phase after Phase 25BJ is committed and reviewed?
