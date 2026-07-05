# AiFinder Discovery Engine — Phase 25AX Metadata-Safe Live Schema Inspection Planning Gate

## Phase

Phase 25AX — Metadata-Safe Live Schema Inspection Planning Gate

## Status

Planning documentation artifact only.

This phase plans a future metadata-safe live schema inspection for the remaining `public.discovery_sources.status_count` failure class.

It does not execute the inspection script.

It does not perform live database reads.

It does not perform live metadata inspection.

It does not modify the inspection script.

It does not perform a live retry.

It does not run Supabase CLI commands.

It does not inspect or mutate the live Supabase database.

## Current baseline

- Latest pushed baseline before this planning gate: Phase 25AW.
- Baseline commit: `9740125`
- Baseline full commit: `974012583154510361876c8ff22b41db23b335b2`
- Baseline subject: `Document Phase 25AW evidence decision`

## Reason for this planning gate

Phase 25AW decided:

```text
local_repository_contract_evidence=sufficient_for_next_decision
live_database_state_proven=false
operational_reactivation_justified=false
immediate_retry_justified=false
immediate_script_change_justified=false
immediate_schema_change_justified=false
```

Therefore, the next safe step is planning only.

The future diagnostic should inspect live metadata only after a separate reviewed preflight gate and explicit James approval.

## Future inspection objective

The future Phase 25AY inspection should answer only metadata questions about `public.discovery_sources.status`.

Future objective:

```text
future_phase=25AY
future_diagnostic_class=metadata_safe_live_schema_inspection
future_scope=public.discovery_sources.status_only
row_payload_access=false
row_enumeration=false
status_value_enumeration=false
grouped_live_status_counts=false
db_mutation=false
schema_mutation=false
```

## Metadata questions to answer in future Phase 25AY

Future Phase 25AY should answer only these bounded metadata questions:

```text
question_1=does_live_public_discovery_sources_exist
question_2=does_live_public_discovery_sources_status_column_exist
question_3=what_is_live_public_discovery_sources_status_data_type
question_4=is_status_type_enum_text_domain_or_other
question_5=are_active_inactive_paused_blocked_compatible_with_live_metadata
question_6=are_visible_policies_grants_or_rls_metadata_relevant_to_filtered_head_count
question_7=can_current_empty_error_summaries_be_explained_by_metadata_or permissions
```

The future diagnostic must not answer these by reading row payloads.

## Allowed future metadata classes

The future Phase 25AY plan may include metadata-only evidence classes such as:

```text
information_schema.columns for public.discovery_sources.status
pg_catalog.pg_class and pg_catalog.pg_attribute metadata for discovery_sources.status
pg_catalog.pg_type metadata for the status column type
pg_catalog.pg_enum metadata only if the status type is enum-backed
pg_catalog.pg_policy metadata scoped to public.discovery_sources only
role/grant metadata scoped to public.discovery_sources only if safely readable
PostgREST-facing schema visibility metadata if a safe path is defined
```

Any future metadata query must be:

```text
read_only=true
metadata_only=true
single_purpose=true
no_row_payloads=true
no_status_value_counts=true
no_group_by=true
no_application_payload_tables=true
no_mutation=true
```

## Explicit future denylist

Future Phase 25AY must not query or touch:

```text
public.tools
public.discovered_tools
public.discovery_candidate_tools
public.discovery_candidate_preview_artifacts
candidate decision tables
public submission tables
application payload rows
```

Future Phase 25AY must not run:

```text
supabase db push
supabase migration repair
supabase gen types
schema cache refresh
RLS changes
grant changes
migration apply
production crawler
extraction
evidence acquisition
candidate staging
candidate decision
approve_for_draft
public publishing
```

## Future execution form

Phase 25AX does not implement this future execution.

Recommended future execution design for Phase 25AY:

```text
execution_type=single_explicitly_approved_metadata_read
script_or_command=to_be_planned_in_phase_25AY_preflight_only
allowed_live_relation_scope=public.discovery_sources
allowed_live_column_scope=status
allowed_catalog_scope=metadata_only
max_execution_count=1
automatic_retry=false
clipboard_output=redacted_metadata_summary_only
secret_output=false
row_payload_output=false
```

The future Phase 25AY command must fail closed if:

```text
repo_not_on_expected_head=true
branch_not_main=true
origin_not_synced=true
working_tree_not_clean=true
AIFINDER_RUN_DISCOVERY_env_already_set=true
unexpected_table_scope_detected=true
row_payload_query_detected=true
mutation_keyword_detected=true
status_count_query_detected=true
group_by_detected=true
application_payload_table_detected=true
```

## Approval boundary

The future approval phrase is:

```text
Approve run Phase 25AY metadata-safe live schema inspection for discovery_sources status only.
```

This phrase is recorded for planning only in Phase 25AX.

It is not active until:

```text
phase_25ax_committed=true
phase_25ay_preflight_document_prepared=true
gemini_approves_phase_25ay_preflight=true
james_explicitly_approves_phase_25ay_execution=true
```

Do not treat the phrase as approval during Phase 25AX.

Do not execute Phase 25AY from this document.

## Phase 25AX boundary

Allowed in Phase 25AX:

```text
create_planning_doc=true
verify_prior_doc_markers=true
verify_inspection_script_static_state_without_execution=true
run_node_check=true
run_npm_check=true
prepare_gemini_review_package=true
```

Not allowed in Phase 25AX:

```text
live_db_reads=false
live_metadata_inspection=false
inspection_script_execution=false
inspection_script_modification=false
live_retry=false
supabase_client_instantiation=false
supabase_dashboard_sql=false
supabase_cli_command=false
db_mutation=false
row_enumeration=false
live_status_enumeration=false
grouped_live_status_counts=false
schema_cache_refresh=false
schema_change=false
migration_apply=false
type_generation=false
rls_grant_change=false
application_payload_table_access=false
commit=false
push=false
```

## Required Gemini review questions

1. Does Phase 25AX correctly remain planning-only and avoid any live metadata inspection?
2. Are the future Phase 25AY metadata questions sufficiently narrow and safe?
3. Are the future allowed metadata classes appropriate for diagnosing `public.discovery_sources.status` without row payload access?
4. Is the future denylist complete enough to prevent application payload reads, grouped counts, mutations, and operational reactivation?
5. Is the future approval phrase clearly inactive until a separately reviewed Phase 25AY preflight gate and explicit James approval?
6. Is it correct that Phase 25AX does not implement or execute the future metadata inspection?
7. Is it safe to commit this Phase 25AX planning documentation after James approval?

## Phase 25AX conclusion

Phase 25AX plans a future metadata-safe live schema inspection.

The next step is not another live retry.

The next step is not script execution.

The next step is not a live metadata inspection.

The recommended next step is Gemini review of this Phase 25AX planning document, then commit only after approval.
