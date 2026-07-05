# Discovery Engine Phase 25CD — Discovery Sources Status Metadata Verification Post-Success Type Generation Reactivation Planning Gate

## Metadata

```text
phase=25CD
title=Discovery Sources Status Metadata Verification Post-Success Type Generation Reactivation Planning Gate
phase_type=post_success_planning
baseline_phase=25CC
baseline_commit=b331f7b
baseline_subject=Document Phase 25CC metadata verification success
operational_reactivation_status=blocked
planning_only=true
```

## Boundary

This is post-success planning only.

This phase does not rerun Phase 25CB.

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

This phase does not reactivate any operational flow.

This phase does not commit or push.

## Input success being planned from

Phase 25CC documented that Phase 25CB successfully verified the remote metadata state for `public.discovery_sources.status`.

```text
phase_25cb_execution_status=passed
phase_25cb_psql_metadata_query_exit_code=0
phase_25cb_metadata_query_completed=true
phase_25cb_live_database_queried=true
metadata_verification_success=true
remote_schema_state_confirmed=true
table_public_discovery_sources_exists=true
status_column_metadata_confirmed=true
status_column_exists=true
status_column_type_confirmed=text
status_column_nullable_confirmed=YES
status_check_constraint_confirmed=true
status_check_constraint_values_confirmed=true
rls_enabled_confirmed=true
schema_mismatch_confirmed=false
```

The success remains metadata-only.

```text
type_generation_complete=false
application_source_updated=false
inspection_script_execution_complete=false
candidate_execution_allowed=false
approve_for_draft_allowed=false
public_tools_writes_allowed=false
discovered_tools_writes_allowed=false
operational_reactivation=false
operational_reactivation_status=blocked
```

## Planning conclusion

The next safe step is not immediate type generation or reactivation.

The next safe step is a separate Supabase type-generation preflight planning gate.

```text
planning_conclusion=type_generation_preflight_planning_required
remote_metadata_verification_complete=true
type_generation_ready_for_planning=true
type_generation_ready_for_execution=false
source_update_ready=false
inspection_script_update_ready=false
operational_reactivation_ready=false
```

## Type generation risk framing

Type generation can alter repository files and therefore must be isolated behind its own gate.

```text
type_generation_changes_repository_files=true
type_generation_may_touch_generated_database_types=true
type_generation_requires_scope_guard=true
type_generation_requires_expected_output_path=true
type_generation_requires_clean_repo=true
type_generation_requires_no_unrelated_changes=true
type_generation_requires_diff_review=true
type_generation_requires_gemini_review=true
type_generation_requires_fresh_james_approval=true
type_generation_requires_separate_commit_gate=true
```

The future type generation path must not become a broader source-code reactivation path.

```text
type_generation_not_same_as_source_update=true
type_generation_not_same_as_runtime_wiring=true
type_generation_not_same_as_candidate_execution=true
type_generation_not_same_as_operational_reactivation=true
```

## Future Phase 25CE recommendation

Recommended next phase:

```text
next_phase=25CE
next_phase_title=Supabase Type Generation Preflight Planning Gate for Discovery Sources Status Metadata Reconciliation
next_phase_type=type_generation_preflight_planning
future_exact_approval_phrase=Approve plan Phase 25CE Supabase type generation preflight for discovery_sources status metadata reconciliation.
fresh_james_approval_required=false
fresh_gemini_review_required=true
type_generation_execution_authorized=false
source_change_authorized=false
inspection_script_change_authorized=false
operational_reactivation_status=blocked
```

Phase 25CE should plan the type generation gate without running it.

```text
phase_25ce_should_be_planning_only=true
phase_25ce_should_not_run_supabase_cli=true
phase_25ce_should_not_run_type_generation=true
phase_25ce_should_not_modify_generated_types=true
phase_25ce_should_not_modify_source=true
phase_25ce_should_not_modify_inspection_script=true
phase_25ce_should_not_run_operational_reactivation=true
```

## Future type generation gate requirements

A later execution gate should be explicitly approved and should enforce narrow output scope.

```text
future_type_generation_execution_requires_fresh_james_approval=true
future_type_generation_execution_requires_exact_approval_phrase=true
future_type_generation_execution_requires_clean_repo=true
future_type_generation_execution_requires_expected_baseline_head=true
future_type_generation_execution_requires_expected_output_file_allowlist=true
future_type_generation_execution_requires_no_package_changes=true
future_type_generation_execution_requires_no_migration_changes=true
future_type_generation_execution_requires_no_source_changes_outside_generated_types=true
future_type_generation_execution_requires_no_operational_reactivation=true
future_type_generation_execution_requires_post_generation_diff_review=true
```

## Candidate downstream sequence

After type generation is safely handled, downstream planning should remain separated.

```text
post_typegen_source_reconciliation_requires_separate_phase=true
inspection_script_update_requires_separate_phase=true
read_only_static_verification_requires_separate_phase=true
admin_route_reactivation_requires_separate_phase=true
candidate_queue_reactivation_requires_separate_phase=true
candidate_decision_reactivation_requires_separate_phase=true
public_write_reactivation_requires_separate_phase=true
```

## Security follow-up remains

Phase 25CA and Phase 25CC documented that a live URI was previously pasted during this workflow.

The Supabase database password should be rotated after the verification path stabilizes.

```text
known_prior_secret_exposure=true
supabase_database_password_rotation_required_after_workflow=true
rotation_pending=true
rotation_should_happen_before_broad_operational_reactivation=true
do_not_store_old_secret=true
do_not_reuse_pasted_secret_in_docs=true
```

Password rotation itself should be handled as a separate security maintenance action, not bundled into type generation.

```text
password_rotation_not_part_of_type_generation=true
password_rotation_requires_operator_action_in_supabase_dashboard=true
password_rotation_should_not_be_logged=true
password_rotation_should_not_be_documented_with_secret_values=true
```

## Explicitly blocked from Phase 25CD

```text
rerun_phase_25cb=false
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
modify_generated_types=false
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
phase_25cb_success_input_analyzed=true
metadata_verification_success_carried_forward=true
post_success_planning_completed=true
type_generation_preflight_planning_required=true
type_generation_execution_not_authorized=true
source_change_not_authorized=true
inspection_script_change_not_authorized=true
operational_reactivation_status=blocked
security_rotation_reminder_carried_forward=true
future_type_generation_scope_guard_required=true
future_exact_approval_phrase_defined=true
live_retry_not_run=true
psql_not_run=true
supabase_cli_not_run=true
sql_not_run=true
type_generation_not_run=true
source_change=false
inspection_script_change=false
next_phase_25ce_recommended=true
```

## Gemini review request

Gemini should review this Phase 25CD post-success planning gate.

Specific review questions:

1. Does this planning gate correctly follow Phase 25CC without executing type generation or reactivation?
2. Does it correctly carry forward the successful metadata verification result for `public.discovery_sources.status`?
3. Is a separate Supabase type generation preflight planning gate the correct next step?
4. Are the type generation scope guards sufficient before any generated type file changes?
5. Does the plan correctly keep source updates, inspection script updates, candidate execution, public writes, and operational reactivation blocked?
6. Does it correctly preserve the Supabase password rotation follow-up as a separate security action?
7. Is Phase 25CE the correct next phase?
