# Discovery Engine Phase 25CN — Credential Rotation Security Closure or Reactivation Dependency Planning Gate

## Metadata

```text
phase=25CN
title=Credential Rotation Security Closure or Reactivation Dependency Planning Gate
phase_type=security_dependency_planning
baseline_phase=25CM
baseline_commit=077288f
baseline_subject=Document Phase 25CM post-typegen verification result
planning_only=true
operational_reactivation_status=blocked
```

## Boundary

This is credential-rotation security closure / reactivation dependency planning only.

This phase does not rotate credentials.

This phase does not request or accept secrets.

This phase does not ask for database URLs.

This phase does not inspect or print database URLs.

This phase does not inspect or print Supabase project-ref values.

This phase does not inspect or print tokens, passwords, service-role keys, anon keys, or `.env` contents.

This phase does not run Supabase CLI.

This phase does not run `supabase gen types`.

This phase does not run type generation.

This phase does not run `psql`.

This phase does not run SQL.

This phase does not run live DB reads.

This phase does not run live metadata reads.

This phase does not modify generated types.

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

## Gemini review instruction

```text
Review as AiFinder Senior Reviewer.
Check boundary, accuracy, repo health, file scope, secret safety, and next phase.
Reply with:
STATUS: APPROVED
or:
STATUS: BLOCKED
with required fixes.
```

## Current verified state

Phase 25CM documented and pushed the approved post-typegen verification result.

```text
phase_25cm_commit=077288f
phase_25cm_commit_subject=Document Phase 25CM post-typegen verification result
phase_25cm_pushed_to_main=true
phase_25cm_repo_synced_after_push=true
post_typegen_verification_passed=true
generated_type_target=lib/supabase/database.types.ts
generated_type_target_contains_discovery_sources_status=true
node_check_passed=true
npm_run_check_passed=true
operational_reactivation_status=blocked
```

## Primary technical objective

The primary technical objective of Phase 25CN is to close or explicitly block the credential-rotation security dependency before any operational reactivation planning proceeds.

```text
primary_objective=close_or_block_credential_rotation_dependency_before_operational_reactivation
credential_rotation_required=true
credential_rotation_dependency_for_reactivation=true
operational_reactivation_blocked_until_rotation_resolved_or_explicitly_blocked=true
```

## Security dependency source

During the verification workflow, a live database connection URI was previously pasted into chat.

This phase must not repeat or preserve the secret.

```text
known_prior_secret_exposure=true
secret_value_not_repeated=true
secret_value_not_recorded=true
secret_value_not_requested=true
secret_value_not_committed=true
secret_value_not_logged=true
supabase_database_password_rotation_required=true
rotation_required_before_broad_operational_reactivation=true
```

## Safe operator action model

Credential rotation must happen outside ChatGPT and outside repository files.

The operator should use the Supabase dashboard / provider UI directly.

```text
rotation_executor=human_operator_outside_chat
rotation_location=supabase_dashboard_or_provider_ui
rotation_secrets_pasted_to_chat=false
rotation_secrets_committed_to_repo=false
rotation_secrets_logged=false
rotation_env_contents_pasted=false
rotation_db_url_pasted=false
rotation_project_ref_pasted=false
```

This phase documents the plan only.

```text
phase_25cn_rotates_password=false
phase_25cn_updates_vercel_env=false
phase_25cn_updates_local_env=false
phase_25cn_runs_connectivity_tests=false
phase_25cn_validates_new_secret=false
phase_25cn_closes_rotation=false
phase_25cn_plans_safe_closure_path=true
```

## Acceptable future proof without exposing secrets

A future security-closure phase may accept a non-secret operator confirmation.

It must not require secret values.

```text
acceptable_future_confirmation_no_secret=true
acceptable_future_confirmation_phrase=Operator confirms Supabase database password was rotated and required deployment/local secret stores were updated without exposing secret values.
acceptable_future_confirmation_should_not_include_old_password=true
acceptable_future_confirmation_should_not_include_new_password=true
acceptable_future_confirmation_should_not_include_database_url=true
acceptable_future_confirmation_should_not_include_access_token=true
acceptable_future_confirmation_should_not_include_service-role-key=true
acceptable_future_confirmation_should_not_include_env_file_contents=true
```

## Future Phase 25CO recommendation

Recommended next phase:

```text
next_phase=25CO
next_phase_title=Credential Rotation Completion Confirmation or Reactivation Block Documentation Gate
next_phase_type=security_dependency_closure_or_block_documentation
future_operator_confirmation_phrase=Operator confirms Supabase database password was rotated and required deployment/local secret stores were updated without exposing secret values.
fresh_james_confirmation_required=true
fresh_gemini_review_required=true
source_change_authorized=false
package_change_authorized=false
migration_change_authorized=false
inspection_script_change_authorized=false
generated_type_change_authorized=false
operational_reactivation_status=blocked
```

Phase 25CO should document one of two outcomes.

```text
phase_25co_outcome_option=rotation_confirmed_without_secrets
phase_25co_outcome_option=rotation_not_confirmed_reactivation_blocked
phase_25co_should_not_rotate_password=true
phase_25co_should_not_request_secret_values=true
phase_25co_should_not_print_secret_values=true
phase_25co_should_not_run_supabase_cli=true
phase_25co_should_not_run_psql=true
phase_25co_should_not_run_sql=true
phase_25co_should_not_run_live_db_read=true
phase_25co_should_not_modify_source=true
phase_25co_should_not_modify_package_files=true
phase_25co_should_not_modify_migrations=true
phase_25co_should_not_modify_generated_types=true
phase_25co_should_not_reactivate_operational_flow=true
```

## Reactivation gate dependency rule

No operational reactivation phase should proceed unless the credential-rotation dependency is either confirmed resolved or explicitly documented as blocking reactivation.

```text
reactivation_dependency_rule=rotation_confirmed_or_reactivation_blocked
reactivation_planning_allowed_if_rotation_confirmed=true
reactivation_planning_allowed_if_rotation_not_confirmed=false
reactivation_execution_allowed_if_rotation_confirmed=false
reactivation_execution_still_requires_separate_phase=true
reactivation_execution_still_requires_fresh_james_approval=true
reactivation_execution_still_requires_gemini_review=true
public_write_reactivation_allowed=false
candidate_decision_execution_allowed=false
```

## Safe checklist for operator outside ChatGPT

This checklist is non-secret and should be completed outside chat.

```text
operator_step_1=Open Supabase dashboard directly.
operator_step_2=Rotate or reset the database password through Supabase controls.
operator_step_3=Update required deployment secret stores, such as Vercel environment variables, without pasting values into chat.
operator_step_4=Update required local secret stores, such as local .env files, without committing or pasting values.
operator_step_5=Redeploy or restart only if required by the secret store update process.
operator_step_6=Confirm completion using only the non-secret confirmation phrase.
operator_step_7=Do not paste old password, new password, database URL, project ref, access token, service-role key, anon key, or .env content.
```

## Explicitly blocked from Phase 25CN

```text
rotate_password=false
request_password=false
request_database_url=false
request_secret=false
print_secret=false
store_secret=false
commit_secret=false
scan_env_files=false
inspect_database_url=false
print_database_url=false
print_project_ref_value=false
run_supabase_cli=false
run_supabase_gen_types=false
run_type_generation=false
modify_generated_types=false
run_psql=false
run_sql=false
run_live_db_read=false
run_live_metadata_read=false
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
commit=false
push=false
```

## Success criteria

```text
phase_25cn_security_dependency_plan_created=true
primary_objective_defined=true
credential_rotation_dependency_carried_forward=true
safe_operator_action_model_defined=true
acceptable_non_secret_confirmation_defined=true
future_phase_25co_defined=true
reactivation_dependency_rule_defined=true
operator_secret_safety_checklist_defined=true
secret_values_not_requested=true
secret_values_not_recorded=true
operational_reactivation_status=blocked
next_phase_25co_recommended=true
```

## Gemini review request

Review as AiFinder Senior Reviewer.

Check boundary, accuracy, repo health, file scope, secret safety, and next phase.

Reply with:

```text
STATUS: APPROVED
```

or:

```text
STATUS: BLOCKED
with required fixes.
```

Specific review questions:

1. Does this planning gate correctly follow Phase 25CM and keep operational reactivation blocked?
2. Does it correctly define the primary technical objective as closing or explicitly blocking the credential-rotation dependency before reactivation planning?
3. Does it correctly avoid requesting, printing, storing, or committing secrets, database URLs, passwords, project-ref values, tokens, or `.env` contents?
4. Is the safe operator action model appropriate, with rotation performed outside ChatGPT and outside repo files?
5. Is the proposed non-secret future confirmation phrase sufficient without exposing credentials?
6. Does it correctly define Phase 25CO as credential rotation completion confirmation or reactivation block documentation?
7. Are reactivation planning and execution still correctly separated and blocked pending rotation closure and later fresh approval?
