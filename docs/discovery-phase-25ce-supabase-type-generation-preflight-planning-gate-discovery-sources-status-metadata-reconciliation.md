# Discovery Engine Phase 25CE — Supabase Type Generation Preflight Planning Gate for Discovery Sources Status Metadata Reconciliation

## Metadata

```text
phase=25CE
title=Supabase Type Generation Preflight Planning Gate for Discovery Sources Status Metadata Reconciliation
phase_type=type_generation_preflight_planning
baseline_phase=25CD
baseline_commit=5138d24
baseline_subject=Document Phase 25CD post-success typegen planning
operational_reactivation_status=blocked
planning_only=true
```

## Boundary

This is Supabase type generation preflight planning only.

This phase does not run Supabase CLI.

This phase does not run type generation.

This phase does not run `psql`.

This phase does not run SQL.

This phase does not run live DB reads.

This phase does not run live metadata reads.

This phase does not scan `.env` files.

This phase does not inspect or print database URLs.

This phase does not modify generated types.

This phase does not modify source code.

This phase does not modify the read-only inspection script.

This phase does not apply migrations.

This phase does not create or edit migrations.

This phase does not execute candidate decisions.

This phase does not write to public tools.

This phase does not write to discovered tools.

This phase does not reactivate any operational flow.

This phase does not commit or push.

## Input state from Phase 25CD

Phase 25CD established that remote metadata verification is complete and that type generation requires a separate preflight path.

```text
phase_25cd_planning_conclusion=type_generation_preflight_planning_required
remote_metadata_verification_complete=true
type_generation_ready_for_planning=true
type_generation_ready_for_execution=false
source_update_ready=false
inspection_script_update_ready=false
operational_reactivation_ready=false
```

Phase 25CC carried the successful metadata result:

```text
phase_25cb_execution_status=passed
metadata_verification_success=true
remote_schema_state_confirmed=true
status_column_metadata_confirmed=true
status_column_type_confirmed=text
status_column_nullable_confirmed=YES
status_check_constraint_confirmed=true
status_check_constraint_values_confirmed=true
rls_enabled_confirmed=true
schema_mismatch_confirmed=false
```

## Planning conclusion

The next safe action is not type generation execution.

The next safe action is a read-only type generation preflight inspection phase that discovers the current generated type file path, current Supabase config/project-reference context, and likely output scope without modifying files.

```text
planning_conclusion=readonly_type_generation_preflight_inspection_required
type_generation_preflight_planned=true
type_generation_execution_authorized=false
supabase_cli_execution_authorized=false
generated_type_modification_authorized=false
source_change_authorized=false
operational_reactivation_status=blocked
```

## Why inspection must happen before type generation

The generated database type file path must be resolved before any generation command is allowed.

```text
generated_type_output_path_not_yet_confirmed=true
supabase_project_reference_not_yet_confirmed=true
type_generation_command_not_yet_approved=true
type_generation_output_diff_not_yet_known=true
allowlist_not_yet_finalized=true
```

The future preflight should discover, not assume, the existing generated types location.

Potential locations must be treated as candidates only until verified in the repository.

```text
candidate_generated_type_path_lib_database_types_ts=true
candidate_generated_type_path_types_supabase_ts=true
candidate_generated_type_path_database_types_ts=true
candidate_generated_type_path_app_database_types_ts=true
candidate_paths_are_not_allowlisted_until_verified=true
```

## Future Phase 25CF recommendation

Recommended next phase:

```text
next_phase=25CF
next_phase_title=Supabase Type Generation Preflight Inspection Gate for Discovery Sources Status Metadata Reconciliation
next_phase_type=read_only_type_generation_preflight_inspection
future_exact_approval_phrase=Approve run Phase 25CF Supabase type generation preflight inspection for discovery_sources status metadata reconciliation.
fresh_james_approval_required=true
fresh_gemini_review_required=false
type_generation_execution_authorized=false
source_change_authorized=false
inspection_script_change_authorized=false
operational_reactivation_status=blocked
```

## Future Phase 25CF allowed actions

Phase 25CF should be read-only and inspection-only.

```text
phase_25cf_should_be_read_only=true
phase_25cf_should_not_run_type_generation=true
phase_25cf_should_not_run_supabase_gen_types=true
phase_25cf_should_not_modify_generated_types=true
phase_25cf_should_not_modify_source=true
phase_25cf_should_not_modify_inspection_script=true
phase_25cf_should_not_run_operational_reactivation=true
```

Allowed Phase 25CF inspections:

```text
allow_git_status_check=true
allow_repo_identity_check=true
allow_branch_and_head_check=true
allow_find_existing_generated_type_files=true
allow_read_supabase_config_without_secret_values=true
allow_list_non_secret_supabase_config_paths=true
allow_detect_package_scripts_containing_typegen_words=true
allow_detect_existing_database_type_imports=true
allow_detect_existing_generated_database_type_exports=true
allow_dry_scope_report_without_execution=true
```

Blocked Phase 25CF actions:

```text
block_supabase_cli_execution=true
block_supabase_gen_types=true
block_psql=true
block_sql=true
block_live_db_read=true
block_env_file_scanning=true
block_database_url_printing=true
block_generated_type_modification=true
block_source_modification=true
block_package_modification=true
block_migration_modification=true
block_operational_reactivation=true
```

## Future type generation execution gate requirements

A later type generation execution phase must be separate from Phase 25CF.

```text
future_type_generation_execution_phase_required=true
future_type_generation_execution_requires_fresh_gemini_review=true
future_type_generation_execution_requires_fresh_james_approval=true
future_type_generation_execution_requires_exact_approval_phrase=true
future_type_generation_execution_requires_clean_repo=true
future_type_generation_execution_requires_expected_baseline_head=true
future_type_generation_execution_requires_resolved_project_ref=true
future_type_generation_execution_requires_resolved_output_file_allowlist=true
future_type_generation_execution_requires_no_package_changes=true
future_type_generation_execution_requires_no_migration_changes=true
future_type_generation_execution_requires_no_source_changes_outside_generated_types=true
future_type_generation_execution_requires_no_operational_reactivation=true
future_type_generation_execution_requires_post_generation_diff_review=true
future_type_generation_execution_requires_result_documentation_before_commit=true
```

## Proposed future type generation execution shape

The final command is intentionally not authorized here.

The later execution phase should choose the exact command only after Phase 25CF resolves the current project configuration and output path.

```text
type_generation_command_finalization_deferred=true
supabase_project_ref_resolution_deferred=true
generated_type_output_path_resolution_deferred=true
generated_type_file_allowlist_resolution_deferred=true
command_example_with_project_ref_not_printed=true
command_example_with_secret_not_printed=true
```

The execution should avoid broad repository changes.

```text
expected_execution_diff_should_be_generated_types_only=true
expected_execution_diff_should_include_status_column_type=true
expected_execution_diff_should_not_include_migration_changes=true
expected_execution_diff_should_not_include_source_logic_changes=true
expected_execution_diff_should_not_include_package_changes=true
expected_execution_diff_should_not_include_lockfile_changes=true
expected_execution_diff_should_not_include_inspection_script_changes=true
```

## Post-typegen downstream separation

Type generation alone does not authorize runtime or operational reactivation.

```text
type_generation_success_does_not_authorize_source_wiring=true
type_generation_success_does_not_authorize_inspection_script_execution=true
type_generation_success_does_not_authorize_admin_route_reactivation=true
type_generation_success_does_not_authorize_candidate_queue_reactivation=true
type_generation_success_does_not_authorize_candidate_decision_execution=true
type_generation_success_does_not_authorize_public_writes=true
type_generation_success_does_not_authorize_operational_reactivation=true
```

Downstream work must remain phased:

```text
post_typegen_result_documentation_requires_separate_phase=true
post_typegen_source_reconciliation_requires_separate_phase=true
inspection_script_update_requires_separate_phase=true
read_only_static_verification_requires_separate_phase=true
runtime_reactivation_planning_requires_separate_phase=true
live_operational_reactivation_requires_separate_phase=true
```

## Security follow-up remains

Phase 25CA, Phase 25CC, and Phase 25CD carried the security follow-up that a live URI was previously pasted during this workflow.

The Supabase database password should be rotated after this verification path stabilizes and before broad operational reactivation.

```text
known_prior_secret_exposure=true
supabase_database_password_rotation_required_after_workflow=true
rotation_pending=true
rotation_should_happen_before_broad_operational_reactivation=true
password_rotation_not_part_of_type_generation=true
password_rotation_requires_operator_action_in_supabase_dashboard=true
password_rotation_should_not_be_logged=true
password_rotation_should_not_be_documented_with_secret_values=true
```

## Explicitly blocked from Phase 25CE

```text
run_supabase_cli=false
run_supabase_gen_types=false
run_type_generation=false
run_psql=false
run_sql=false
run_live_db_read=false
run_live_metadata_read=false
scan_env_files=false
inspect_database_url=false
print_database_url=false
modify_generated_types=false
modify_source_code=false
modify_inspection_script=false
modify_package_files=false
modify_lockfiles=false
modify_migrations=false
candidate_decision_execution=false
approve_for_draft=false
public_tools_writes=false
discovered_tools_writes=false
reactivate_operational_flow=false
```

## Success criteria

```text
phase_25cd_post_success_plan_carried_forward=true
phase_25ce_type_generation_preflight_planned=true
readonly_type_generation_preflight_inspection_required=true
generated_type_output_path_resolution_deferred=true
supabase_project_ref_resolution_deferred=true
type_generation_execution_not_authorized=true
source_change_not_authorized=true
inspection_script_change_not_authorized=true
operational_reactivation_status=blocked
security_rotation_reminder_carried_forward=true
future_phase_25cf_defined=true
future_exact_approval_phrase_defined=true
supabase_cli_not_run=true
type_generation_not_run=true
generated_types_not_modified=true
source_change=false
inspection_script_change=false
next_phase_25cf_recommended=true
```

## Gemini review request

Gemini should review this Phase 25CE Supabase type generation preflight planning gate.

Specific review questions:

1. Does this planning gate correctly follow Phase 25CD without running Supabase CLI or type generation?
2. Does it correctly require read-only inspection before any generated type output path is allowed?
3. Are the Phase 25CF allowed and blocked actions sufficiently strict?
4. Are the future type generation execution scope guards sufficient before any generated type file changes?
5. Does it correctly keep source updates, package changes, migration changes, inspection script changes, candidate execution, public writes, and operational reactivation blocked?
6. Does it correctly preserve password rotation as a separate security action before broad operational reactivation?
7. Is Phase 25CF read-only type generation preflight inspection the correct next phase?
