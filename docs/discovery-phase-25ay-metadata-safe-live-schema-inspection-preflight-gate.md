# AiFinder Discovery Engine — Phase 25AY Metadata-Safe Live Schema Inspection Preflight Gate

## Phase

Phase 25AY — Metadata-Safe Live Schema Inspection Preflight Gate

## Status

Preflight documentation artifact only.

This phase defines the execution boundary for a future metadata-safe live schema inspection of `public.discovery_sources.status`.

It does not execute the future inspection.

It does not perform live database reads.

It does not perform live metadata inspection.

It does not modify the inspection script.

It does not perform a live retry.

It does not run Supabase CLI commands.

It does not inspect or mutate the live Supabase database.

## Current baseline

- Latest pushed baseline before this preflight gate: Phase 25AX.
- Baseline commit: `177b368`
- Baseline full commit: `177b3685234d04828da9be8fe9ae5ef5c275899f`
- Baseline subject: `Document Phase 25AX metadata inspection plan`

## Important stale approval handling

James previously provided the phrase:

```text
Approve run Phase 25AY metadata-safe live schema inspection for discovery_sources status only.
```

That prior phrase was sent before this Phase 25AY preflight existed and before this Phase 25AY preflight was reviewed.

Therefore:

```text
prior_approval_phrase_status=invalid_stale_before_preflight
fresh_james_approval_required_after_gemini=true
phase_25ay_execution_allowed_now=false
```

The same phrase may be used later only if all activation requirements below are satisfied.

## Preflight objective

Phase 25AY defines the exact future execution boundary for a metadata-safe live schema inspection.

Future execution objective:

```text
future_execution_goal=inspect_metadata_for_public_discovery_sources_status_only
future_execution_type=single_explicitly_approved_metadata_read
allowed_live_relation_scope=public.discovery_sources
allowed_live_column_scope=status
allowed_catalog_scope=metadata_only
max_execution_count=1
automatic_retry=false
```

The future execution must answer whether the live schema metadata can explain why `public.discovery_sources.status_count` failed for:

```text
failed_status_values=active,inactive,paused,blocked
```

## Future allowed metadata questions

The future execution may answer only these metadata questions:

```text
question_1=does_live_public_discovery_sources_exist
question_2=does_live_public_discovery_sources_status_column_exist
question_3=what_is_live_public_discovery_sources_status_data_type
question_4=is_status_type_enum_text_domain_or_other
question_5=are_active_inactive_paused_blocked_compatible_with_live_metadata
question_6=are_visible_policies_grants_or_rls_metadata_relevant_to_filtered_head_count
question_7=does_metadata_explain_unavailable_error_summaries_without_payload_access
```

## Future allowed metadata evidence classes

Future execution may use metadata-only evidence classes scoped to `public.discovery_sources.status`:

```text
allowed_metadata_class_1=information_schema.columns for public.discovery_sources.status
allowed_metadata_class_2=pg_catalog.pg_class relation metadata for public.discovery_sources
allowed_metadata_class_3=pg_catalog.pg_attribute column metadata for public.discovery_sources.status
allowed_metadata_class_4=pg_catalog.pg_type metadata for status column type
allowed_metadata_class_5=pg_catalog.pg_enum metadata only if status type is enum-backed
allowed_metadata_class_6=pg_catalog.pg_policy metadata scoped to public.discovery_sources only
allowed_metadata_class_7=role_or_grant_metadata scoped to public.discovery_sources only if safely readable
```

If a future implementation cannot safely access catalog metadata, it must fail closed rather than substitute row reads or status counts.

## Future output constraints

Future output must be a redacted metadata summary only:

```text
row_payload_output=false
secret_output=false
env_value_output=false
row_count_output=false
status_value_count_output=false
grouped_count_output=false
sample_row_output=false
candidate_payload_output=false
application_payload_output=false
raw_policy_body_output=false_unless_reviewed_safe
raw_sql_result_dump=false
```

Allowed output examples:

```text
table_exists=true_or_false
status_column_exists=true_or_false
status_data_type=redacted_safe_type_summary
status_udt_name=redacted_safe_type_summary
status_enum_labels_present=true_or_false_or_not_applicable
policy_metadata_present=true_or_false
grant_metadata_present=true_or_false
metadata_query_succeeded=true_or_false
error_summary=safe_structured_error_summary_without_secrets
```

## Future denylist

Future execution must not query, inspect, or touch:

```text
public.tools
public.discovered_tools
public.discovery_candidate_tools
public.discovery_candidate_preview_artifacts
candidate decision tables
public submission tables
application payload rows
stored evidence payloads
candidate payloads
tool payloads
user data tables
```

Future execution must not run:

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
LLM calls
evidence acquisition
candidate staging
candidate decision
approve_for_draft
public publishing
```

## Future fail-closed conditions

Future execution must fail closed if any condition is true:

```text
repo_not_on_expected_head=true
branch_not_main=true
origin_not_synced=true
working_tree_not_clean=true
AIFINDER_RUN_DISCOVERY_env_already_set=true
approval_phrase_missing_or_mismatched=true
unexpected_table_scope_detected=true
unexpected_column_scope_detected=true
row_payload_query_detected=true
mutation_keyword_detected=true
status_count_query_detected=true
group_by_detected=true
application_payload_table_detected=true
supabase_cli_required=true
env_value_would_be_printed=true
raw_result_dump_requested=true
automatic_retry_requested=true
```

## Future approval activation requirements

The approval phrase is:

```text
Approve run Phase 25AY metadata-safe live schema inspection for discovery_sources status only.
```

It becomes active only after all requirements are true:

```text
phase_25ay_preflight_document_committed=true
gemini_approves_phase_25ay_preflight=true
james_provides_fresh_approval_after_gemini=true
repo_head_matches_phase_25ay_preflight_commit=true
origin_main_matches_phase_25ay_preflight_commit=true
working_tree_clean=true
```

Current state in this preflight gate:

```text
phase_25ay_execution_allowed_now=false
approval_phrase_active_now=false
```

## Future execution implementation guidance

This preflight does not implement future execution.

If future execution is approved, the execution wrapper should:

```text
verify_repo_identity=true
verify_branch_main=true
verify_expected_head=true
verify_origin_main_synced=true
verify_working_tree_clean=true
verify_no_AIFINDER_RUN_DISCOVERY_env_pre_set=true
require_exact_fresh_approval_phrase=true
set_single_opt_in_env_for_metadata_execution_only=true
print_env_names_only=true
print_env_values=false
run_once=true
retry=false
copy_redacted_result_package_to_clipboard=true
```

Future execution must not modify source files, docs, scripts, schema, migrations, types, package files, or lockfiles.

## Boundary preserved in Phase 25AY preflight

Allowed in this gate:

```text
create_preflight_doc=true
verify_prior_doc_markers=true
verify_inspection_script_static_state_without_execution=true
run_node_check=true
run_npm_check=true
prepare_gemini_review_package=true
```

Not allowed in this gate:

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

1. Does Phase 25AY correctly remain preflight/documentation-only and avoid any live metadata inspection?
2. Is the stale approval handling correct, requiring fresh James approval after Gemini approval?
3. Are the future metadata questions and allowed metadata classes sufficiently narrow for `public.discovery_sources.status`?
4. Are the future output constraints and denylist sufficient to prevent row payload access, grouped counts, mutations, and operational reactivation?
5. Are the future fail-closed conditions complete enough?
6. Is the future approval activation sequence safe and unambiguous?
7. Is it safe to commit this Phase 25AY preflight documentation after James approval?

## Phase 25AY preflight conclusion

Phase 25AY defines the preflight boundary for a future metadata-safe live schema inspection.

The prior approval phrase is stale and not active.

The next step is not live execution.

The next step is not script execution.

The next step is Gemini review of this Phase 25AY preflight document, then commit only after approval.
