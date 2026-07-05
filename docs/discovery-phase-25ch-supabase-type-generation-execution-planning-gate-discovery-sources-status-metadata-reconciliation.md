# Discovery Engine Phase 25CH — Supabase Type Generation Execution Planning Gate for Discovery Sources Status Metadata Reconciliation

## Metadata

```text
phase=25CH
title=Supabase Type Generation Execution Planning Gate for Discovery Sources Status Metadata Reconciliation
phase_type=type_generation_execution_planning
baseline_phase=25CG
baseline_commit=7efef31
baseline_subject=Document Phase 25CG typegen preflight inspection
operational_reactivation_status=blocked
planning_only=true
```

## Boundary

This is type generation execution planning only.

This phase does not run Supabase CLI.

This phase does not run `supabase gen types`.

This phase does not run type generation.

This phase does not modify generated types.

This phase does not run `psql`.

This phase does not run SQL.

This phase does not run live DB reads.

This phase does not run live metadata reads.

This phase does not scan `.env` files.

This phase does not inspect or print database URLs.

This phase does not print Supabase project-ref values.

This phase does not modify source code.

This phase does not modify package files.

This phase does not modify lockfiles.

This phase does not modify migrations.

This phase does not modify the read-only inspection script.

This phase does not execute candidate decisions.

This phase does not write to public tools.

This phase does not write to discovered tools.

This phase does not reactivate any operational flow.

This phase does not commit or push.

## Input state from Phase 25CG

Phase 25CG documented a successful read-only preflight inspection.

```text
phase_25cf_inspection_status=completed
phase_25cf_readonly_inspection_only=true
phase_25cf_supabase_cli_run=false
phase_25cf_supabase_gen_types_run=false
phase_25cf_type_generation_run=false
phase_25cf_generated_types_modified=false
phase_25cf_source_change=false
phase_25cf_package_change=false
phase_25cf_migration_change=false
phase_25cf_inspection_script_change=false
phase_25cf_env_files_scanned=false
phase_25cf_database_url_printed=false
phase_25cf_operational_reactivation_status=blocked
```

Phase 25CG resolved the generated type target for planning:

```text
generated_type_output_path_resolution=single_candidate
generated_type_output_path_candidate=lib/supabase/database.types.ts
recommended_generated_type_output_allowlist=lib/supabase/database.types.ts
database_type_import_file_count=7
supabase_usage_file_count=35
typegen_related_script_count=0
supabase_config_present=false
supabase_temp_project_ref_file_present=true
supabase_temp_project_ref_value_printed=false
```

## Planning conclusion

The next safe action is a separately approved type generation execution gate.

```text
planning_conclusion=type_generation_execution_gate_ready_for_review
type_generation_execution_planned=true
type_generation_execution_authorized=false
supabase_cli_execution_authorized=false
generated_type_modification_authorized=false
source_change_authorized=false
package_change_authorized=false
migration_change_authorized=false
inspection_script_change_authorized=false
operational_reactivation_status=blocked
```

## Future Phase 25CI recommendation

Recommended next phase:

```text
next_phase=25CI
next_phase_title=Supabase Type Generation Execution Gate for Discovery Sources Status Metadata Reconciliation
next_phase_type=type_generation_execution
future_exact_approval_phrase=Approve run Phase 25CI Supabase type generation execution for discovery_sources status metadata reconciliation.
fresh_james_approval_required=true
fresh_gemini_review_required=true
type_generation_execution_authorized=false
source_change_authorized=false
package_change_authorized=false
migration_change_authorized=false
inspection_script_change_authorized=false
operational_reactivation_status=blocked
```

Phase 25CI should be allowed to execute type generation only after Gemini approval and fresh James approval.

```text
phase_25ci_should_run_supabase_cli=true
phase_25ci_should_run_supabase_gen_types=true
phase_25ci_should_run_type_generation=true
phase_25ci_should_generate_to_temp_file_first=true
phase_25ci_should_validate_temp_file_before_repo_write=true
phase_25ci_should_write_only_allowlisted_generated_type_target=true
phase_25ci_allowed_generated_type_target=lib/supabase/database.types.ts
phase_25ci_should_not_modify_source=true
phase_25ci_should_not_modify_package_files=true
phase_25ci_should_not_modify_lockfiles=true
phase_25ci_should_not_modify_migrations=true
phase_25ci_should_not_modify_inspection_script=true
phase_25ci_should_not_run_operational_reactivation=true
```

## Future Phase 25CI CLI source and project-ref handling

Phase 25CI must not use package installation or broad command discovery.

```text
future_cli_resolution_allow_local_node_modules_binary=true
future_cli_resolution_allow_global_supabase_binary=true
future_cli_resolution_block_npx=true
future_cli_resolution_block_package_install=true
future_cli_resolution_block_package_json_modification=true
future_cli_resolution_fail_closed_if_supabase_cli_missing=true
```

The project reference must come from the already detected local temp project-ref file, without printing the value.

```text
future_project_ref_source=supabase/.temp/project-ref
future_project_ref_value_printed=false
future_project_ref_value_committed=false
future_project_ref_value_logged=false
future_project_ref_shape_check_required=true
future_project_ref_nonempty_required=true
future_project_ref_no_whitespace_required=true
future_project_ref_no_slash_required=true
future_project_ref_no_colon_required=true
future_project_ref_no_url_shape_required=true
future_project_ref_fail_closed_if_missing=true
future_project_ref_fail_closed_if_invalid_shape=true
```

No database URL or `.env` file should be used by the future type generation execution gate.

```text
future_execution_scan_env_files=false
future_execution_use_database_url=false
future_execution_print_database_url=false
future_execution_print_project_ref=false
future_execution_print_access_token=false
future_execution_print_secret_values=false
```

## Future Phase 25CI planned command shape

The future command shape is intentionally variable-based and must not print the resolved project-ref value.

```text
future_type_generation_command_shape="$SUPABASE_CLI gen types typescript --project-id $AIFINDER_PHASE_25CI_SUPABASE_PROJECT_REF --schema public > $AIFINDER_PHASE_25CI_TEMP_GENERATED_TYPES"
future_type_generation_command_printed_with_values=false
future_type_generation_output_first_target=temp_file
future_type_generation_final_repo_target=lib/supabase/database.types.ts
future_type_generation_direct_stdout_to_repo_file=false
future_type_generation_temp_file_validation_required=true
future_type_generation_repo_write_requires_validation_success=true
```

## Future Phase 25CI temp file validation

The generated temp file must be validated before replacing the repository target.

```text
future_temp_file_nonempty_required=true
future_temp_file_contains_database_type_required=true
future_temp_file_contains_public_schema_required=true
future_temp_file_contains_discovery_sources_required=true
future_temp_file_contains_status_required=true
future_temp_file_contains_status_text_shape_expected=true
future_temp_file_contains_candidate_status_or_other_unrelated_change_allowed_for_diff_review=true
future_temp_file_validation_fail_closed=true
future_repo_target_backup_not_required_if_git_clean=true
future_repo_target_replace_only_after_validation=true
```

## Future Phase 25CI repository write scope

The only allowed repository write is the generated type target.

```text
future_execution_output_allowlist=lib/supabase/database.types.ts
future_execution_allowed_changed_path_count=1
future_execution_allowed_changed_path=lib/supabase/database.types.ts
future_execution_block_source_changes=true
future_execution_block_package_changes=true
future_execution_block_lockfile_changes=true
future_execution_block_migration_changes=true
future_execution_block_inspection_script_changes=true
future_execution_block_docs_changes=true
future_execution_block_operational_reactivation=true
future_execution_fail_closed_on_unexpected_path=true
```

Phase 25CI should not commit or push.

```text
future_execution_commit=false
future_execution_push=false
future_execution_result_package_required=true
future_execution_gemini_review_required_before_commit=true
future_execution_result_documentation_phase_required=true
```

## Future Phase 25CI verification requirements

After repository target replacement, Phase 25CI must run verification.

```text
future_execution_git_diff_check_required=true
future_execution_node_check_inspection_script_required=true
future_execution_npm_run_check_required=true
future_execution_diff_stat_required=true
future_execution_target_file_diff_required=true
future_execution_changed_path_allowlist_required=true
future_execution_no_secret_pattern_check_required=true
future_execution_result_package_required=true
```

Expected diff focus:

```text
future_diff_should_include_discovery_sources_status_type_reconciliation=true
future_diff_should_not_include_source_logic_changes=true
future_diff_should_not_include_package_changes=true
future_diff_should_not_include_lockfile_changes=true
future_diff_should_not_include_migration_changes=true
future_diff_should_not_include_docs_changes=true
future_diff_should_not_include_inspection_script_changes=true
```

## Future downstream sequence

Type generation execution does not authorize source reconciliation or reactivation.

```text
type_generation_success_does_not_authorize_source_wiring=true
type_generation_success_does_not_authorize_inspection_script_execution=true
type_generation_success_does_not_authorize_admin_route_reactivation=true
type_generation_success_does_not_authorize_candidate_queue_reactivation=true
type_generation_success_does_not_authorize_candidate_decision_execution=true
type_generation_success_does_not_authorize_public_writes=true
type_generation_success_does_not_authorize_operational_reactivation=true
```

Required downstream phases remain separate:

```text
post_typegen_result_documentation_requires_separate_phase=true
post_typegen_generated_type_commit_requires_separate_phase=true
post_typegen_source_reconciliation_requires_separate_phase=true
inspection_script_update_requires_separate_phase=true
read_only_static_verification_requires_separate_phase=true
runtime_reactivation_planning_requires_separate_phase=true
live_operational_reactivation_requires_separate_phase=true
```

## Security follow-up

The Supabase database password should still be rotated after this verification path stabilizes and before broad operational reactivation.

```text
known_prior_secret_exposure=true
supabase_database_password_rotation_required_after_workflow=true
rotation_pending=true
rotation_should_happen_before_broad_operational_reactivation=true
password_rotation_not_part_of_type_generation=true
password_rotation_should_not_be_logged=true
password_rotation_should_not_be_documented_with_secret_values=true
```

## Explicitly blocked from Phase 25CH

```text
run_supabase_cli=false
run_supabase_gen_types=false
run_type_generation=false
modify_generated_types=false
run_psql=false
run_sql=false
run_live_db_read=false
run_live_metadata_read=false
scan_env_files=false
inspect_database_url=false
print_database_url=false
print_project_ref_value=false
modify_source_code=false
modify_package_files=false
modify_lockfiles=false
modify_migrations=false
modify_inspection_script=false
candidate_decision_execution=false
approve_for_draft=false
public_tools_writes=false
discovered_tools_writes=false
reactivate_operational_flow=false
```

## Success criteria

```text
phase_25ch_type_generation_execution_plan_created=true
phase_25cf_result_carried_forward=true
generated_type_output_allowlist_locked_for_planning=true
future_type_generation_command_shape_defined=true
future_project_ref_handling_defined=true
future_temp_file_validation_defined=true
future_repo_write_scope_defined=true
future_verification_requirements_defined=true
type_generation_execution_not_authorized=true
supabase_cli_execution_not_authorized=true
generated_type_modification_not_authorized=true
source_change_not_authorized=true
package_change_not_authorized=true
migration_change_not_authorized=true
inspection_script_change_not_authorized=true
operational_reactivation_status=blocked
security_rotation_reminder_carried_forward=true
next_phase_25ci_recommended=true
```

## Gemini review request

Gemini should review this Phase 25CH type generation execution planning gate.

Specific review questions:

1. Does this planning gate correctly follow Phase 25CG without running Supabase CLI or type generation?
2. Is the future Phase 25CI command shape safe because it generates to a temp file before replacing the allowlisted target?
3. Is `lib/supabase/database.types.ts` the correct sole output allowlist based on Phase 25CF/25CG?
4. Are the project-ref handling rules sufficient to avoid printing or committing project-ref values or secrets?
5. Are the fail-closed checks sufficient for missing CLI, missing project-ref, invalid generated temp output, and unexpected changed paths?
6. Does the future Phase 25CI plan correctly block source changes, package changes, migration changes, inspection script changes, public writes, candidate execution, commits, pushes, and operational reactivation?
7. Is Phase 25CI Supabase Type Generation Execution Gate the correct next phase after this planning gate is reviewed, committed, and pushed?
