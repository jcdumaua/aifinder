# Discovery Engine Phase 25BD — Discovery Sources Status Migration Reconciliation Planning Gate

## Metadata

```text
phase=25BD
title=Discovery Sources Status Migration Reconciliation Planning Gate
phase_type=planning
baseline_phase=25BC
baseline_commit=861facd
baseline_subject=Document Phase 25BC reconciliation decision
selected_decision=migration_reconciliation_planning
operational_reactivation_status=blocked
planning_only=true
```

## Boundary

This is a planning-only migration reconciliation gate.

This phase does not create a migration.

This phase does not apply a migration.

This phase does not edit historical migrations.

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

This phase does not generate types.

This phase does not change RLS policies.

This phase does not change grants.

This phase does not modify source code.

This phase does not modify the read-only inspection script.

This phase does not commit or push.

## Inputs

Phase 25BD is based on the Phase 25BC decision:

```text
phase_25bc_decision=migration_reconciliation_planning
phase_25bc_next_phase=25BD
phase_25bc_decision_source=local_repository_only
phase_25az_live_metadata_table_exists=true
phase_25az_live_metadata_status_column_found=false
phase_25bb_local_schema_history_audit_complete=true
operational_reactivation_status=blocked
```

The decision basis remains local-only plus the already documented Phase 25AZ live metadata result. This phase makes no new live claim.

## Planning conclusion

The selected migration reconciliation plan is:

```text
migration_reconciliation_strategy=forward_only_reviewed_migration_draft
edit_historical_migrations=false
apply_migration_now=false
type_generation_now=false
live_retry_now=false
operational_reactivation_now=false
```

The safest next technical move is to draft a forward-only migration in a separate reviewed phase, not to edit old migrations and not to apply anything live yet.

## Rationale

Phase 25AZ showed that `public.discovery_sources` exists in live metadata, but `status` was not found through the approved metadata query.

Phase 25BB collected local repository evidence.

Phase 25BC selected `migration_reconciliation_planning` as the next remediation path.

Given that decision, Phase 25BD narrows the plan:

1. do not rewrite historical migration files;
2. do not apply live database changes from this phase;
3. use a forward-only draft migration as the next safest artifact;
4. make the future migration idempotent and reviewable;
5. separate migration draft, migration apply, type generation, and live verification into different gates.

## Future migration draft requirements

The future migration draft phase should be:

```text
next_phase=25BE
next_phase_title=Discovery Sources Status Forward-Only Migration Draft Gate
next_phase_type=migration_draft
```

The future Phase 25BE migration draft should follow these requirements:

```text
forward_only=true
idempotent=true
historical_migration_edit=false
apply_migration=false
live_db_mutation=false
type_generation=false
source_change=false
inspection_script_change=false
gemini_review_required=true
commit_allowed_after_review=true
push_allowed_after_commit_gate=true
```

## Future migration design constraints

The future migration draft should be designed to reconcile the missing `public.discovery_sources.status` contract while minimizing risk.

Required draft considerations:

```text
target_table=public.discovery_sources
target_column=status
column_addition_must_be_guarded=true
existing_rows_must_be_preserved=true
destructive_change=false
drop_column=false
rename_column=false
truncate_table=false
delete_rows=false
update_public_tools=false
update_discovered_tools=false
```

The future draft must choose and justify the exact column definition from local repository evidence.

The future draft must document:

1. whether `status` should be text, enum-backed, or another existing project type;
2. whether a default is required;
3. whether `not null` is safe or should be deferred;
4. whether any check constraint is required;
5. whether any index is required;
6. whether RLS policy changes are unnecessary or need a separate planning gate;
7. whether generated types should wait until after an apply gate.

## Preferred safe draft shape

A future migration draft may use a guarded pattern similar to:

```text
alter_table_if_column_missing=true
add_column_if_not_exists=true
no_data_rewrite_unless_separately_approved=true
no_backfill_unless_separately_approved=true
```

This phase does not authorize the exact SQL.

The exact SQL must be generated only in Phase 25BE if Gemini approves this plan.

## Required future gates

The full remediation sequence must remain split:

```text
phase_25be=migration_draft_gate
phase_25bf=migration_draft_review_commit_push_gate_or_apply_preflight_planning
phase_25bg=migration_apply_preflight_gate_if_needed
phase_25bh=explicit_live_migration_apply_gate_if_approved
phase_25bi=post_apply_type_generation_planning_gate_if_needed
phase_25bj=post_apply_read_only_metadata_verification_preflight_if_needed
fresh_james_approval_required_for_any_live_execution=true
gemini_review_required_before_commit=true
```

## Explicitly blocked from Phase 25BD

```text
create_migration=false
edit_migration=false
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
run_type_generation=false
modify_source_code=false
modify_inspection_script=false
change_rls=false
change_grants=false
refresh_schema_cache=false
reactivate_operational_flow=false
```

## Operational decision

Operational reactivation remains blocked.

```text
operational_reactivation_status=blocked
reactivation_reason=live_schema_contract_mismatch_not_reconciled
```

## Success criteria

```text
migration_reconciliation_planning_complete=true
forward_only_migration_draft_selected=true
historical_migration_edit_rejected=true
live_execution_rejected=true
migration_apply_rejected=true
type_generation_rejected=true
source_change_rejected=true
inspection_script_change_rejected=true
operational_reactivation_status=blocked
next_phase_25be_recommended=true
```

## Gemini review request

Gemini should review this Phase 25BD migration reconciliation planning gate for safety and correctness.

Specific review questions:

1. Does this plan correctly implement the Phase 25BC decision without executing remediation?
2. Is forward-only reviewed migration drafting the safest next step?
3. Does the plan correctly reject editing historical migrations?
4. Does the plan correctly separate migration draft, apply, type generation, and verification into separate future gates?
5. Are the future Phase 25BE migration draft requirements sufficiently constrained?
6. Does the plan correctly keep operational reactivation blocked?
