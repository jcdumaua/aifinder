# Discovery Engine Phase 25BG — Discovery Sources Status Migration Apply Preflight Planning Gate

## Metadata

```text
phase=25BG
title=Discovery Sources Status Migration Apply Preflight Planning Gate
phase_type=apply_preflight_planning
baseline_phase=25BF
baseline_commit=837a3ed
baseline_subject=Document Phase 25BF migration draft review
migration_file=supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql
operational_reactivation_status=blocked
planning_only=true
```

## Boundary

This is an apply preflight planning gate only.

This phase does not apply a migration.

This phase does not run Supabase CLI.

This phase does not run Supabase dashboard SQL.

This phase does not run live DB reads.

This phase does not run live metadata reads.

This phase does not scan `.env` files.

This phase does not access row payload.

This phase does not enumerate rows.

This phase does not count live status values.

This phase does not run grouped counts.

This phase does not mutate database state.

This phase does not create a migration.

This phase does not edit a migration.

This phase does not edit historical migrations.

This phase does not generate types.

This phase does not change RLS policies.

This phase does not change grants.

This phase does not modify source code.

This phase does not modify the read-only inspection script.

This phase does not commit or push.

## Reviewed apply candidate

```text
migration_file=supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql
migration_origin_phase=25BE
migration_review_phase=25BF
migration_draft_static_review_result=approved_for_apply_preflight_planning
target_table=public.discovery_sources
target_column=status
column_addition=add column if not exists status text
column_nullable=true
column_default=none
check_constraint=discovery_sources_status_check
allowed_values=active,inactive,paused,blocked
```

## Apply preflight plan

The future live apply phase must be isolated as Phase 25BH.

```text
future_live_apply_phase=25BH
future_live_apply_title=Discovery Sources Status Live Migration Apply Gate
future_live_apply_allowed_from_phase_25bg=false
fresh_james_approval_required=true
future_exact_approval_phrase=Approve run Phase 25BH live migration apply for discovery_sources status reconciliation.
```

Phase 25BG only defines the preflight plan.

It does not execute any live command.

## Future Phase 25BH gate requirements

The future Phase 25BH live apply gate must fail closed unless all of the following are true:

```text
expected_baseline_commit_after_25bg_commit_required=true
repo_must_equal=https://github.com/jcdumaua/aifinder.git
branch_must_equal=main
working_tree_must_be_clean=true
origin_main_must_match_head=true
migration_file_must_exist=true
migration_file_must_match_phase_25be_static_markers=true
phase_25bf_review_doc_must_exist=true
phase_25bg_preflight_doc_must_exist=true
exact_approval_phrase_required=true
fresh_james_approval_required=true
apply_migration_only=true
type_generation=false
source_change=false
inspection_script_change=false
operational_reactivation=false
```

## Future live apply command boundary

The future Phase 25BH gate may execute only the approved migration apply command path selected in that phase.

The future command must be documented before execution and must be copied into the Phase 25BH result package.

The future apply wrapper must:

```text
verify_supabase_cli_available=true
verify_supabase_project_context=true
avoid_printing_secrets=true
avoid_scanning_env_files=true
execute_single_apply_attempt=true
capture_stdout_stderr=true
preserve_exit_code=true
copy_result_or_failure_log_to_clipboard=true
fail_closed_on_nonzero_exit=true
fail_closed_on_unexpected_repo_state=true
fail_closed_on_dirty_working_tree=true
```

## Future failure handling

If the future live apply fails, the gate must stop and document:

```text
migration_apply_failed_closed=true
no_type_generation_after_failed_apply=true
no_live_retry_without_new_review=true
no_source_change_after_failed_apply=true
no_operational_reactivation_after_failed_apply=true
failure_log_required=true
gemini_review_required_after_failure=true
```

## Future success handling

If the future live apply succeeds, the gate must still keep operational reactivation blocked.

A successful apply should recommend separate follow-up gates only:

```text
post_apply_type_generation_planning_required=true
post_apply_metadata_verification_preflight_required=true
post_apply_read_only_status_column_metadata_verification_required=true
operational_reactivation_requires_separate_review_gate=true
candidate_decision_execution_remains_blocked=true
public_tools_writes_remain_blocked=true
discovered_tools_writes_remain_blocked=true
```

## Explicitly blocked from Phase 25BG

```text
apply_migration=false
run_supabase_cli=false
run_dashboard_sql=false
run_live_db_read=false
run_live_metadata_inspection=false
scan_env_files=false
row_payload_access=false
row_enumeration=false
status_value_count=false
grouped_count=false
create_migration=false
edit_migration=false
edit_historical_migration=false
run_type_generation=false
modify_source_code=false
modify_inspection_script=false
change_rls=false
change_grants=false
refresh_schema_cache=false
reactivate_operational_flow=false
```

## Success criteria

```text
apply_preflight_planning_complete=true
future_live_apply_phase_defined=true
future_exact_approval_phrase_defined=true
live_apply_not_executed=true
supabase_cli_not_run=true
live_db_reads=false
live_metadata_reads=false
env_scanning=false
db_mutation=false
type_generation=false
source_change=false
inspection_script_change=false
operational_reactivation_status=blocked
next_phase_25bh_recommended=true
```

## Gemini review request

Gemini should review this Phase 25BG apply preflight planning gate for deployment safety and boundary separation.

Specific review questions:

1. Does this preflight plan correctly follow the Phase 25BF review without applying the migration?
2. Is the future approval phrase sufficiently explicit for a live apply gate?
3. Are the future Phase 25BH fail-closed requirements sufficient?
4. Does the plan correctly separate migration apply from type generation, metadata verification, source changes, and operational reactivation?
5. Does the plan correctly block live DB reads, live metadata reads, Supabase CLI, and DB mutation during Phase 25BG?
6. Is Phase 25BH live migration apply gate the correct next phase after Phase 25BG is committed and reviewed?
