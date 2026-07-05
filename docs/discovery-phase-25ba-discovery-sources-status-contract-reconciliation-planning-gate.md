# Discovery Engine Phase 25BA — Discovery Sources Status Contract Reconciliation Planning Gate

## Metadata

```text
phase=25BA
title=Discovery Sources Status Contract Reconciliation Planning Gate
phase_type=planning
baseline_phase=25AZ
baseline_commit=f971831
baseline_subject=Document Phase 25AZ metadata inspection result
operational_reactivation_status=blocked
planning_only=true
```

## Boundary

This is a planning-only contract reconciliation gate.

This phase does not run live DB reads.

This phase does not run live metadata reads.

This phase does not run the read-only inspection script.

This phase does not run Supabase CLI.

This phase does not run Supabase dashboard SQL.

This phase does not scan `.env` files.

This phase does not access row payload.

This phase does not enumerate rows.

This phase does not count live status values.

This phase does not run grouped counts.

This phase does not mutate database state.

This phase does not change schema.

This phase does not create or apply migrations.

This phase does not generate types.

This phase does not change RLS policies.

This phase does not change grants.

This phase does not modify source code.

This phase does not modify the inspection script.

This phase does not commit or push.

## Why this phase exists

Phase 25AZ documented a successful Phase 25AY metadata-safe live schema inspection result.

The key Phase 25AY metadata finding was:

```text
table_exists=true
status_column_exists=false
information_schema_status_visible=false
```

That means the approved metadata query found `public.discovery_sources`, but did not find `public.discovery_sources.status`.

This explains the earlier Phase 25AR failure pattern:

```text
public.discovery_sources total/timestamp checks = succeeded
public.discovery_sources status_count active = failed
public.discovery_sources status_count inactive = failed
public.discovery_sources status_count paused = failed
public.discovery_sources status_count blocked = failed
```

Phase 25BA exists to plan how to reconcile the mismatch between local repository expectations and the live metadata result before any remediation is attempted.

## Current known facts

```text
phase_25ar_failed_closed=true
phase_25ar_source_status_count_failures=4
phase_25ay_metadata_query_succeeded=true
public_discovery_sources_exists=true
public_discovery_sources_relation_kind=r
public_discovery_sources_status_column_found=false
information_schema_status_visible=false
current_user_has_table_select=true
rls_enabled=true
rls_forced=false
policy_metadata_present=true
policy_metadata_count=1
operational_reactivation_status=blocked
```

## Primary contract mismatch

The active mismatch is:

```text
local_contract_expectation=public.discovery_sources.status is used by inspection status-count logic
live_metadata_result=public.discovery_sources.status was not found through approved metadata inspection
contract_reconciliation_required=true
```

This mismatch must be resolved before any operational reactivation or live retry.

## Reconciliation questions

Phase 25BA should answer these planning questions without making changes:

1. Is `public.discovery_sources.status` actually required by the Discovery Engine source contract?
2. Was `status` ever introduced in a repository migration for `public.discovery_sources`?
3. Is the read-only inspection script outdated relative to the actual live schema?
4. Is the live schema missing a column that the repository intended to create?
5. Is there a differently named source lifecycle column that should be used instead of `status`?
6. Are Phase 25AR source-status counts operationally necessary, or should source status be removed from the aggregate-only inspection contract?
7. If a migration is needed, what should be drafted in a separate reviewed phase?
8. If script reconciliation is needed, what should be changed in a separate reviewed implementation phase?
9. If type generation is needed, when should it be authorized and after which migration/apply gate?
10. What explicit approval gates are required before any live retry?

## Candidate reconciliation paths

### Path A — Inspection script contract correction

Use this path if local repository evidence shows that `public.discovery_sources` intentionally does not have a `status` column.

Possible future action:

```text
future_action=modify_read_only_inspection_script_to_remove_or_replace_discovery_sources_status_counts
phase_type=future_implementation_gate
live_db_reads=false
db_mutation=false
schema_change=false
```

This path would require a separate implementation plan and Gemini approval before any script modification.

### Path B — Migration draft for missing source status column

Use this path if local repository evidence shows that `public.discovery_sources.status` is required but missing from the live schema.

Possible future action:

```text
future_action=draft_migration_for_public_discovery_sources_status
phase_type=future_migration_draft_gate
apply_migration=false
live_db_mutation=false
type_generation=false
```

This path must not apply the migration in the draft phase.

A migration apply gate, type generation gate, and post-apply verification gate would need separate approvals.

### Path C — Local schema history audit before selecting remediation

Use this path if current evidence is insufficient.

Possible future action:

```text
future_action=local_repository_schema_history_audit
phase_type=future_local_review_gate
live_db_reads=false
source_change=false
schema_change=false
```

This is the safest immediate next technical phase if the contract history is not already conclusive.

### Path D — Metadata-access limitation investigation

Use this path only if there is credible evidence that metadata visibility itself is incomplete despite the table-level metadata result.

Possible future action:

```text
future_action=separate_metadata_access_limitation_planning
phase_type=future_planning_gate
live_metadata_reads=false_until_approved
row_payload_access=false
```

This path is secondary because Phase 25AY found the table and policy metadata successfully.

## Recommended next phase

Recommended next phase:

```text
next_phase=25BB
next_phase_title=Discovery Sources Status Local Schema History Audit Gate
next_phase_type=local_review
```

Phase 25BB should be local-only.

It should inspect repository migration history, schema docs, generated types if present, inspection script expectations, and discovery source lifecycle docs.

It should not run live DB reads, live metadata reads, Supabase CLI, Supabase dashboard SQL, `.env` scanning, row enumeration, or grouped counts.

## Explicitly blocked from Phase 25BA

```text
run_live_retry=false
run_live_metadata_inspection=false
run_live_db_read=false
run_supabase_cli=false
run_dashboard_sql=false
scan_env_files=false
row_payload_access=false
row_enumeration=false
status_value_count=false
grouped_count=false
modify_inspection_script=false
modify_source_code=false
modify_schema=false
create_migration=false
apply_migration=false
run_type_generation=false
change_rls=false
change_grants=false
refresh_schema_cache=false
reactivate_operational_flow=false
```

## Future approval gates required

Any future remediation must be split into separate gates:

```text
local_schema_history_audit_gate_required=true
reconciliation_decision_gate_required=true
implementation_plan_gate_required_if_script_change=true
migration_draft_gate_required_if_schema_change=true
migration_apply_gate_required_if_live_schema_change=true
type_generation_gate_required_if_schema_changes=true
post_change_live_verification_preflight_required=true
fresh_james_approval_required_for_any_live_execution=true
gemini_review_required_before_commit=true
```

## Success criteria for Phase 25BA

```text
contract_mismatch_documented=true
candidate_reconciliation_paths_defined=true
recommended_next_phase_defined=true
operational_reactivation_status=blocked
live_retry_blocked=true
schema_change_blocked=true
script_change_blocked=true
migration_blocked=true
type_generation_blocked=true
```

## Gemini review request

Gemini should review this Phase 25BA planning gate for boundary safety and planning correctness.

Specific review questions:

1. Does this plan correctly preserve the Phase 25AZ finding that `public.discovery_sources` exists but `status` metadata was not found?
2. Does this plan correctly avoid choosing a remediation before a local schema history audit?
3. Are the candidate reconciliation paths complete and safely separated?
4. Is Phase 25BB local-only schema history audit the correct next phase?
5. Does the plan correctly keep operational reactivation blocked?
6. Does the plan correctly block live retry, live metadata reads, row enumeration, grouped counts, migration, type generation, and script/source changes?
