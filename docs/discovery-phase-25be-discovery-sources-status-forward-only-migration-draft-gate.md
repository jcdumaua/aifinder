# Discovery Engine Phase 25BE — Discovery Sources Status Forward-Only Migration Draft Gate

## Metadata

```text
phase=25BE
title=Discovery Sources Status Forward-Only Migration Draft Gate
phase_type=migration_draft
baseline_phase=25BD
baseline_commit=d599537
baseline_subject=Document Phase 25BD migration reconciliation plan
migration_file=supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql
operational_reactivation_status=blocked
draft_only=true
```

## Boundary

This phase drafts a migration file only.

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

```text
phase_25bd_strategy=forward_only_reviewed_migration_draft
phase_25bc_decision=migration_reconciliation_planning
phase_25az_live_metadata_table_exists=true
phase_25az_live_metadata_status_column_found=false
operational_reactivation_status=blocked
```

## Draft output

```text
migration_file=supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql
forward_only=true
idempotent=true
historical_migration_edit=false
apply_migration=false
type_generation=false
source_change=false
inspection_script_change=false
```

## Drafted column contract

```text
target_table=public.discovery_sources
target_column=status
draft_column_type=text
draft_nullable=true
draft_default=none
draft_check_values=active,inactive,paused,blocked
existing_rows_preserved=true
destructive_change=false
```

## Local evidence summary

```text
migration_status_statement_count=3
migration_create_sources_with_status_count=3
migration_alter_sources_add_status_count=0
candidate_status_line_count=2
enum_type_mentions=0
check_constraint_mentions=2
```

## Draft rationale

The migration draft uses a forward-only guarded pattern:

```text
add_column_if_not_exists=true
column_type=text
nullable=true
default=none
check_constraint=active,inactive,paused,blocked
```

This draft avoids a not-null requirement because existing live rows must be preserved and no approved backfill has been planned.

This draft avoids a default because implicit data fill or rewrite should not be introduced in the same draft without a separate review.

This draft avoids introducing an enum type because type creation and enum lifecycle management would add schema complexity beyond the missing-column reconciliation. If enum-backed status is required later, it should be planned separately.

This draft preserves existing rows and does not touch application payload tables.


## Migration draft SQL

```text
-- Discovery Engine Phase 25BE
-- Forward-only draft migration for public.discovery_sources.status reconciliation.
--
-- Boundary:
-- - Draft only.
-- - Do not apply from this phase.
-- - Do not edit historical migrations.
-- - Do not run Supabase CLI from this phase.
-- - Do not generate types from this phase.
--
-- Rationale:
-- Phase 25AY/25AZ metadata inspection found public.discovery_sources but did not find
-- public.discovery_sources.status through the approved metadata path.
-- Phase 25BC selected migration_reconciliation_planning.
-- Phase 25BD selected a forward-only reviewed migration draft.

begin;

alter table if exists public.discovery_sources
  add column if not exists status text;

alter table if exists public.discovery_sources
  drop constraint if exists discovery_sources_status_check;

alter table if exists public.discovery_sources
  add constraint discovery_sources_status_check
  check (
    status is null
    or status in ('active', 'inactive', 'paused', 'blocked')
  );

comment on column public.discovery_sources.status is
  'Discovery source lifecycle status. Drafted in Phase 25BE as forward-only reconciliation for the Discovery Engine status-count contract.';

commit;
```

## Local evidence: status statements

```text
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- 3. Discovery Runs -- Tracks individual crawler/discovery executions create table if not exists public.discovery_runs ( id uuid primary key default gen_random_uuid(), source_id uuid references public.discovery_sources(id) on delete cascade, status text not null check (status in ('pending', 'running', 'completed', 'failed')), stats jsonb not null default '{ "tools_found": 0, "tools_new": 0, "tools_duplicates": 0, "errors": 0 }'::jsonb, error_log text, started_at timestamptz default now(), finished_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now() );
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- 4. Discovered Tools -- Stores raw tool data awaiting admin review. create table if not exists public.discovered_tools ( id uuid primary key default gen_random_uuid(), source_id uuid references public.discovery_sources(id) on delete set null, run_id uuid references public.discovery_runs(id) on delete set null, name text not null, description text, website text, canonical_url text, normalized_domain text, slug text, status text not null default 'new' check (status in ('new', 'pending_review', 'approved', 'rejected', 'ignored', 'duplicate')), pricing text, platforms text[], category text, logo_url text, raw_payload jsonb not null default '{}'::jsonb, discovery_score float default 0.0, -- Approval and Review fields approved_tool_id bigint references public.tools(id) on delete set null, duplicate_of_tool_id bigint references public.tools(id) on delete set null, duplicate_of_discovered_tool_id uuid references public.discovered_tools(id) on delete set null, reviewed_at timestamptz, reviewed_by uuid, -- Typically auth.users.id rejected_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now() );
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql: -- Phase 13D — Candidate Preview Artifact Migration Draft. -- Draft only: do not apply without Gemini review and explicit user approval. -- This migration drafts the future read-only candidate preview artifact table -- for the Discovery Engine Admin UI preview provider. -- -- This migration does not add provider code, API routes, UI wiring, live -- staging, crawler execution, LLM execution, public publishing, public.tools -- writes, discovered_tools writes, candidate staging writes, audit writes, -- public grants, authenticated grants, or type generation. create table if not exists public.discovery_candidate_preview_artifacts ( id uuid primary key default gen_random_uuid(), discovery_source_id uuid not null references public.discovery_sources(id) on delete restrict, discovery_run_id uuid not null references public.discovery_runs(id) on delete restrict, audit_correlation_id uuid not null default gen_random_uuid(), preview_schema_version text not null default 'candidate_preview_artifact.v1', preview_status text not null default 'pending_review', candidate_name text, candidate_website_url text, category_hint text, pricing_hint text, confidence_bucket text, evidence_summary text, sourc
```

## Local evidence: candidate status lines

```text
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: status text not null check (status in ('pending', 'running', 'completed', 'failed')),
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: status text not null default 'new' check (status in ('new', 'pending_review', 'approved', 'rejected', 'ignored', 'duplicate')),
```

## Explicitly blocked from Phase 25BE

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
run_type_generation=false
modify_source_code=false
modify_inspection_script=false
change_rls=false
change_grants=false
refresh_schema_cache=false
reactivate_operational_flow=false
```

## Required next phase

Recommended next phase:

```text
next_phase=25BF
next_phase_title=Discovery Sources Status Forward-Only Migration Draft Review Gate
next_phase_type=review
```

Phase 25BF should review the migration draft before commit/push or any apply planning.

No live apply should be authorized directly from this phase.

## Future gates remain required

```text
migration_draft_review_required=true
commit_push_gate_required_after_review=true
migration_apply_preflight_required=true
fresh_james_approval_required_for_live_apply=true
type_generation_planning_required_after_apply_if_needed=true
post_apply_metadata_verification_preflight_required=true
operational_reactivation_requires_separate_gate=true
```

## Success criteria

```text
migration_draft_created=true
forward_only=true
idempotent=true
historical_migration_edit=false
apply_migration=false
type_generation=false
source_change=false
inspection_script_change=false
operational_reactivation_status=blocked
next_phase_25bf_recommended=true
```

## Gemini review request

Gemini should review this Phase 25BE migration draft gate for SQL safety, contract fit, and boundary preservation.

Specific review questions:

1. Does the migration draft correctly implement the Phase 25BD forward-only strategy?
2. Is the  approach safe and sufficiently conservative?
3. Is the nullable/no-default design appropriate before a separately approved backfill or not-null decision?
4. Is the check constraint for , , , and  appropriate for the existing inspection contract?
5. Does the draft avoid destructive changes and historical migration editing?
6. Does the phase correctly keep apply, type generation, source changes, and operational reactivation blocked?
