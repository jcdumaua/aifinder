# Discovery Engine Phase 25BC — Discovery Sources Status Contract Reconciliation Decision Gate

## Metadata

```text
phase=25BC
title=Discovery Sources Status Contract Reconciliation Decision Gate
phase_type=decision_planning
baseline_phase=25BB
baseline_commit=e85ef4b
baseline_subject=Document Phase 25BB local schema history audit
operational_reactivation_status=blocked
local_only=true
```

## Boundary

This is a local-only decision planning gate.

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

## Inputs

Phase 25BC combines these prior findings:

```text
phase_25az_live_metadata_table_exists=true
phase_25az_live_metadata_status_column_found=false
phase_25bb_local_schema_history_audit_complete=true
phase_25bb_repository_evidence_collected=true
contract_reconciliation_required=true
```

## Local decision summary

```text
decision=migration_reconciliation_planning
next_phase=25BD
next_phase_title=Discovery Sources Status Migration Reconciliation Planning Gate
decision_reason=Local migration history contains status-column contract evidence while live metadata did not find the column.
migration_discovery_sources_statement_count=13
migration_discovery_sources_status_statement_count=2
migration_create_sources_with_status_count=2
migration_create_sources_without_status_count=2
migration_alter_sources_add_status_count=0
migration_alter_sources_drop_status_count=0
inspection_status_contract_present=true
doc_status_contract_ref_count=453
generated_type_status_ref_count=2576
local_migration_status_contract_evidence=true
local_migration_sources_without_status_evidence=false
local_drop_status_evidence=false
local_inspection_script_status_contract_evidence=true
```

## Decision

The selected planning decision is:

```text
selected_decision=migration_reconciliation_planning
selected_next_phase=25BD
selected_next_phase_title=Discovery Sources Status Migration Reconciliation Planning Gate
selected_decision_reason=Local migration history contains status-column contract evidence while live metadata did not find the column.
```

This is a planning decision only.

It does not authorize live execution, source changes, migration drafting, migration application, type generation, or operational reactivation.


## Evidence: discovery_sources migration statements

```text
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql: alter table public.discovery_candidate_tools add constraint discovery_candidate_tools_discovery_source_id_fkey foreign key (discovery_source_id) references public.discovery_sources(id) on delete restrict;
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql: -- Phase 13D — Candidate Preview Artifact Migration Draft. -- Draft only: do not apply without Gemini review and explicit user approval. -- This migration drafts the future read-only candidate preview artifact table -- for the Discovery Engine Admin UI preview provider. -- -- This migration does not add provider code, API routes, UI wiring, live -- staging, crawler execution, LLM execution, public publishing, public.tools -- writes, discovered_tools writes, candidate staging writes, audit writes, -- public grants, authenticated grants, or type generation. create table if not exists public.discovery_candidate_preview_artifacts ( id uuid primary key default gen_random_uuid(), discovery_source_id uuid not null references public.discovery_sources(id) on delete restrict, discovery_run_id uuid not null references public.discovery_runs(id) on delete restrict, audit_correlation_id uuid not null default gen_random_uuid(), preview_schema_version text not null default 'candidate_preview_artifact.v1', preview_status text not null default 'pending_review', candidate_name text, candidate_website_url text, category_hint text, pricing_hint text, confidence_bucket text, evidence_summary text, sourc
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- 2. Discovery Sources -- Defines where tools are found (e.g., Product Hunt, Twitter, RSS) create table if not exists public.discovery_sources ( id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, description text, url text, source_type text not null check (source_type in ('rss', 'api', 'scraper', 'manual', 'webhook')), config jsonb not null default '{}'::jsonb, is_active boolean not null default true, last_run_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now() );
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- 3. Discovery Runs -- Tracks individual crawler/discovery executions create table if not exists public.discovery_runs ( id uuid primary key default gen_random_uuid(), source_id uuid references public.discovery_sources(id) on delete cascade, status text not null check (status in ('pending', 'running', 'completed', 'failed')), stats jsonb not null default '{ "tools_found": 0, "tools_new": 0, "tools_duplicates": 0, "errors": 0 }'::jsonb, error_log text, started_at timestamptz default now(), finished_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now() );
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- 4. Discovered Tools -- Stores raw tool data awaiting admin review. create table if not exists public.discovered_tools ( id uuid primary key default gen_random_uuid(), source_id uuid references public.discovery_sources(id) on delete set null, run_id uuid references public.discovery_runs(id) on delete set null, name text not null, description text, website text, canonical_url text, normalized_domain text, slug text, status text not null default 'new' check (status in ('new', 'pending_review', 'approved', 'rejected', 'ignored', 'duplicate')), pricing text, platforms text[], category text, logo_url text, raw_payload jsonb not null default '{}'::jsonb, discovery_score float default 0.0, -- Approval and Review fields approved_tool_id bigint references public.tools(id) on delete set null, duplicate_of_tool_id bigint references public.tools(id) on delete set null, duplicate_of_discovered_tool_id uuid references public.discovered_tools(id) on delete set null, reviewed_at timestamptz, reviewed_by uuid, -- Typically auth.users.id rejected_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now() );
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- 8. Performance and Deduplication Indexes create index if not exists discovery_sources_active_idx on public.discovery_sources (is_active);
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- 9. Triggers for updated_at -- Assumes public.set_updated_at() utility function exists. drop trigger if exists set_discovery_sources_updated_at on public.discovery_sources;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: create trigger set_discovery_sources_updated_at before update on public.discovery_sources for each row execute function public.set_updated_at();
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- 10. RLS - Admin Only Hardening alter table public.discovery_sources enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- Revoke access from public roles revoke all on public.discovery_sources from anon, authenticated;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- Deny-by-default policies drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: create policy "Deny all access to discovery_sources" on public.discovery_sources for all using (false) with check (false);
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- 11. Comments for Schema Documentation comment on table public.discovery_sources is 'Registry of sources for automated tool discovery.';
```

## Evidence: discovery_sources status migration statements

```text
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- 3. Discovery Runs -- Tracks individual crawler/discovery executions create table if not exists public.discovery_runs ( id uuid primary key default gen_random_uuid(), source_id uuid references public.discovery_sources(id) on delete cascade, status text not null check (status in ('pending', 'running', 'completed', 'failed')), stats jsonb not null default '{ "tools_found": 0, "tools_new": 0, "tools_duplicates": 0, "errors": 0 }'::jsonb, error_log text, started_at timestamptz default now(), finished_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now() );
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- 4. Discovered Tools -- Stores raw tool data awaiting admin review. create table if not exists public.discovered_tools ( id uuid primary key default gen_random_uuid(), source_id uuid references public.discovery_sources(id) on delete set null, run_id uuid references public.discovery_runs(id) on delete set null, name text not null, description text, website text, canonical_url text, normalized_domain text, slug text, status text not null default 'new' check (status in ('new', 'pending_review', 'approved', 'rejected', 'ignored', 'duplicate')), pricing text, platforms text[], category text, logo_url text, raw_payload jsonb not null default '{}'::jsonb, discovery_score float default 0.0, -- Approval and Review fields approved_tool_id bigint references public.tools(id) on delete set null, duplicate_of_tool_id bigint references public.tools(id) on delete set null, duplicate_of_discovered_tool_id uuid references public.discovered_tools(id) on delete set null, reviewed_at timestamptz, reviewed_by uuid, -- Typically auth.users.id rejected_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now() );
```

## Evidence: create discovery_sources with status

```text
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- 3. Discovery Runs -- Tracks individual crawler/discovery executions create table if not exists public.discovery_runs ( id uuid primary key default gen_random_uuid(), source_id uuid references public.discovery_sources(id) on delete cascade, status text not null check (status in ('pending', 'running', 'completed', 'failed')), stats jsonb not null default '{ "tools_found": 0, "tools_new": 0, "tools_duplicates": 0, "errors": 0 }'::jsonb, error_log text, started_at timestamptz default now(), finished_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now() );
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- 4. Discovered Tools -- Stores raw tool data awaiting admin review. create table if not exists public.discovered_tools ( id uuid primary key default gen_random_uuid(), source_id uuid references public.discovery_sources(id) on delete set null, run_id uuid references public.discovery_runs(id) on delete set null, name text not null, description text, website text, canonical_url text, normalized_domain text, slug text, status text not null default 'new' check (status in ('new', 'pending_review', 'approved', 'rejected', 'ignored', 'duplicate')), pricing text, platforms text[], category text, logo_url text, raw_payload jsonb not null default '{}'::jsonb, discovery_score float default 0.0, -- Approval and Review fields approved_tool_id bigint references public.tools(id) on delete set null, duplicate_of_tool_id bigint references public.tools(id) on delete set null, duplicate_of_discovered_tool_id uuid references public.discovered_tools(id) on delete set null, reviewed_at timestamptz, reviewed_by uuid, -- Typically auth.users.id rejected_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now() );
```

## Evidence: create discovery_sources without status

```text
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql: -- Phase 13D — Candidate Preview Artifact Migration Draft. -- Draft only: do not apply without Gemini review and explicit user approval. -- This migration drafts the future read-only candidate preview artifact table -- for the Discovery Engine Admin UI preview provider. -- -- This migration does not add provider code, API routes, UI wiring, live -- staging, crawler execution, LLM execution, public publishing, public.tools -- writes, discovered_tools writes, candidate staging writes, audit writes, -- public grants, authenticated grants, or type generation. create table if not exists public.discovery_candidate_preview_artifacts ( id uuid primary key default gen_random_uuid(), discovery_source_id uuid not null references public.discovery_sources(id) on delete restrict, discovery_run_id uuid not null references public.discovery_runs(id) on delete restrict, audit_correlation_id uuid not null default gen_random_uuid(), preview_schema_version text not null default 'candidate_preview_artifact.v1', preview_status text not null default 'pending_review', candidate_name text, candidate_website_url text, category_hint text, pricing_hint text, confidence_bucket text, evidence_summary text, sourc
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- 2. Discovery Sources -- Defines where tools are found (e.g., Product Hunt, Twitter, RSS) create table if not exists public.discovery_sources ( id uuid primary key default gen_random_uuid(), name text not null unique, slug text not null unique, description text, url text, source_type text not null check (source_type in ('rss', 'api', 'scraper', 'manual', 'webhook')), config jsonb not null default '{}'::jsonb, is_active boolean not null default true, last_run_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now() );
```

## Evidence: alter discovery_sources add status

```text
(no matches)
```

## Evidence: alter discovery_sources drop status

```text
(no matches)
```

## Evidence: docs/source status contract references

```text
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:64: The query-shape fix did not resolve the remaining `public.discovery_sources.status_count` failures.
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:119: public.discovery_sources status_count active = failed
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:120: public.discovery_sources status_count inactive = failed
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:121: public.discovery_sources status_count paused = failed
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:122: public.discovery_sources status_count blocked = failed
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:147: Because the four `public.discovery_sources.status_count` checks still failed after that query-shape fix, the prior failure should no longer be attributed to selecting `item.statusColumn` in the projection.
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:162: This points away from the Phase 25AO projection-shape hypothesis and toward a narrower `public.discovery_sources.status` contract, live schema/cache, permission, policy, generated type, or PostgREST-facing column issue.
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:166: Phase 25AS does not conclude that `public.discovery_sources.status` is absent.
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:209: - live PostgREST schema cache mismatch for public.discovery_sources.status
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:212: - generated client/query interaction specific to public.discovery_sources.status
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:253: 3. Is it correct that the Phase 25AO projection fix did not resolve the remaining `public.discovery_sources.status_count` failures?
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:254: 4. Is the remaining failure correctly scoped to `public.discovery_sources.status_count` for `active`, `inactive`, `paused`, and `blocked`?
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:45: public.discovery_sources status_count active
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:46: public.discovery_sources status_count inactive
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:47: public.discovery_sources status_count paused
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:48: public.discovery_sources status_count blocked
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:68: The retry still failed for `public.discovery_sources.status_count`.
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:72: The remaining failure must be treated as a narrower `public.discovery_sources.status` status-count query failure.
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:98: public.discovery_sources.status_count is the remaining failure class
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:105: 1. Live PostgREST schema cache mismatch for `public.discovery_sources.status`.
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:107: 3. Permission or policy issue specific to filtered count queries on `public.discovery_sources.status`.
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:108: 4. Column type, enum, domain, or cast mismatch for `discovery_sources.status`.
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:217: 3. Is the remaining failure correctly scoped to `public.discovery_sources.status_count` while `public.discovery_sources` reachability and `public.discovery_runs.status_count` remain healthy?
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:231: The recommended next step is a diagnostic planning gate focused on the remaining `public.discovery_sources.status_count` failure class.
docs/discovery-phase-25ae-read-only-live-inspection-retry-approval-preflight-gate.md:36: The failure was limited to `public.discovery_sources.status` aggregate status-count probes.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:37: The retry exited non-zero because four `public.discovery_sources.status` aggregate status-count checks still failed.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:154: public.discovery_sources status_count active ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:155: public.discovery_sources status_count inactive ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:156: public.discovery_sources status_count paused ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:157: public.discovery_sources status_count blocked ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:160: The structured serialized fields for each failed `public.discovery_sources.status` check were:
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:179: - Only `public.discovery_sources.status` aggregate status-count probes fail.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:188: Controlled failed-closed retry with structured but still unavailable Supabase error details for discovery_sources.status checks.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:234: - Review why `public.discovery_sources.status` aggregate checks fail while count/timestamps succeed.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:247: 3. Modify the probe to omit `discovery_sources.status` checks if Gemini approves infrastructure readiness as count/timestamp-only for sources.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:255: 3. Is the repeated failure isolated to `public.discovery_sources.status` aggregate status-count checks?
docs/discovery-phase-25t-read-only-live-inspection-scope-planning-gate.md:92: | `public.discovery_sources` | Confirm source inventory exists and count source statuses | Counts by status/type only |
docs/discovery-phase-25ai-discovery-sources-status-contract-local-schema-review-planning-gate.md:11: This phase plans a local repository schema review for the repeated `public.discovery_sources.status` aggregate status-count failure.
docs/discovery-phase-25ai-discovery-sources-status-contract-local-schema-review-planning-gate.md:40: public.discovery_sources.status
docs/discovery-phase-25ai-discovery-sources-status-contract-local-schema-review-planning-gate.md:54: 1. Does the repository define a `status` column on `public.discovery_sources`?
docs/discovery-phase-25ai-discovery-sources-status-contract-local-schema-review-planning-gate.md:204: interpretation=<what this implies for discovery_sources.status contract>
docs/discovery-phase-25ai-discovery-sources-status-contract-local-schema-review-planning-gate.md:240: public.discovery_sources.status
docs/discovery-phase-25ai-discovery-sources-status-contract-local-schema-review-planning-gate.md:270: Use if local schema does not define `public.discovery_sources.status`.
docs/discovery-phase-25ai-discovery-sources-status-contract-local-schema-review-planning-gate.md:274: - The inspection script should likely remove or replace `discovery_sources.status` checks.
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:11: This phase reviews local repository evidence for the remaining `public.discovery_sources.status_count` failure class.
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:65: public.discovery_sources.status_count
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:120: ## discovery_sources_status_contract_evidence
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:1228: 2. Does the collected local evidence sufficiently identify what the repository says about `public.discovery_sources.status`?
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:1237: Phase 25AV records local repository evidence for the remaining `public.discovery_sources.status_count` failure class.
docs/discovery-phase-25ax-metadata-safe-live-schema-inspection-planning-gate.md:11: This phase plans a future metadata-safe live schema inspection for the remaining `public.discovery_sources.status_count` failure class.
docs/discovery-phase-25ax-metadata-safe-live-schema-inspection-planning-gate.md:53: The future Phase 25AY inspection should answer only metadata questions about `public.discovery_sources.status`.
docs/discovery-phase-25ax-metadata-safe-live-schema-inspection-planning-gate.md:60: future_scope=public.discovery_sources.status_only
docs/discovery-phase-25ax-metadata-safe-live-schema-inspection-planning-gate.md:75: question_2=does_live_public_discovery_sources_status_column_exist
docs/discovery-phase-25ax-metadata-safe-live-schema-inspection-planning-gate.md:76: question_3=what_is_live_public_discovery_sources_status_data_type
docs/discovery-phase-25ax-metadata-safe-live-schema-inspection-planning-gate.md:90: information_schema.columns for public.discovery_sources.status
docs/discovery-phase-25ax-metadata-safe-live-schema-inspection-planning-gate.md:91: pg_catalog.pg_class and pg_catalog.pg_attribute metadata for discovery_sources.status
docs/discovery-phase-25ax-metadata-safe-live-schema-inspection-planning-gate.md:185: Approve run Phase 25AY metadata-safe live schema inspection for discovery_sources status only.
docs/discovery-phase-25ax-metadata-safe-live-schema-inspection-planning-gate.md:245: 3. Are the future allowed metadata classes appropriate for diagnosing `public.discovery_sources.status` without row payload access?
docs/discovery-phase-25az-metadata-inspection-result-documentation-and-analysis-gate.md:76: metadata_scope=public.discovery_sources.status
docs/discovery-phase-25az-metadata-inspection-result-documentation-and-analysis-gate.md:109: The live metadata result shows that `public.discovery_sources` exists, but the `status` column is not present or not visible through the approved metadata path.
docs/discovery-phase-25az-metadata-inspection-result-documentation-and-analysis-gate.md:119: It narrows the earlier Phase 25AR failures from a broad query-shape or connectivity problem to a live schema/metadata contract mismatch for `public.discovery_sources.status`.
docs/discovery-phase-25az-metadata-inspection-result-documentation-and-analysis-gate.md:145: 4. The live metadata inspection did not find a `status` column on `public.discovery_sources`.
docs/discovery-phase-25az-metadata-inspection-result-documentation-and-analysis-gate.md:155: public.discovery_sources status_count active = failed
docs/discovery-phase-25az-metadata-inspection-result-documentation-and-analysis-gate.md:156: public.discovery_sources status_count inactive = failed
docs/discovery-phase-25az-metadata-inspection-result-documentation-and-analysis-gate.md:157: public.discovery_sources status_count paused = failed
docs/discovery-phase-25az-metadata-inspection-result-documentation-and-analysis-gate.md:158: public.discovery_sources status_count blocked = failed
docs/discovery-phase-25az-metadata-inspection-result-documentation-and-analysis-gate.md:167: public.discovery_sources.status metadata visible = false
docs/discovery-phase-25az-metadata-inspection-result-documentation-and-analysis-gate.md:178: The repository inspection script expects `public.discovery_sources.status` to exist because it attempts status-filtered counts for discovery sources.
docs/discovery-phase-25az-metadata-inspection-result-documentation-and-analysis-gate.md:271: 1. update the inspection script's `public.discovery_sources` status-count expectation if the live schema intentionally has no `status` column;
docs/discovery-phase-25az-metadata-inspection-result-documentation-and-analysis-gate.md:273: 3. perform a repository migration-history review to determine whether `status` was ever expected on `public.discovery_sources`;
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:11: This phase analyzes the repeated `public.discovery_sources.status` aggregate status-count failure and plans the next safe diagnostic direction.
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:40: actual_query_succeeded=false means the public.discovery_sources.status aggregate queries did not succeed.
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:68: public.discovery_sources status_count active ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:69: public.discovery_sources status_count inactive ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:70: public.discovery_sources status_count paused ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:71: public.discovery_sources status_count blocked ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:89: - Analyze possible causes of the `public.discovery_sources.status` aggregate query failure.
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:134: The repeated failure is narrow. Count and timestamp probes on `public.discovery_sources` succeed, but status-value-filtered count probes fail.
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:138: 1. `public.discovery_sources.status` column does not exist.
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:178: - Review migrations, type files, and source references for `discovery_sources.status`.
... truncated: 453 total rows, showing first 80 ...
```

## Evidence: generated type status references

```text
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:64: The query-shape fix did not resolve the remaining `public.discovery_sources.status_count` failures.
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:76: allowed_tables=public.discovery_sources, public.discovery_runs
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:89: - grouped live status counts
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:103: public.discovery_sources total_count = ok, count 1
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:104: public.discovery_sources latest_created_at = ok, value_present true
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:105: public.discovery_sources latest_updated_at = ok, value_present true
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:109: public.discovery_runs status_count queued = ok, count 0
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:110: public.discovery_runs status_count running = ok, count 0
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:111: public.discovery_runs status_count completed = ok, count 2
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:112: public.discovery_runs status_count failed = ok, count 0
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:113: public.discovery_runs status_count blocked = ok, count 0
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:119: public.discovery_sources status_count active = failed
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:120: public.discovery_sources status_count inactive = failed
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:121: public.discovery_sources status_count paused = failed
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:122: public.discovery_sources status_count blocked = failed
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:144: .eq(item.statusColumn, statusValue)
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:147: Because the four `public.discovery_sources.status_count` checks still failed after that query-shape fix, the prior failure should no longer be attributed to selecting `item.statusColumn` in the projection.
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:152: table=public.discovery_sources
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:153: check=status_count
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:154: status_column=status
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:155: status_values=active,inactive,paused,blocked
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:158: The live `public.discovery_sources` table itself remains reachable, because total count and timestamp aggregate checks succeeded.
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:160: The `public.discovery_runs.status` count checks remain healthy.
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:162: This points away from the Phase 25AO projection-shape hypothesis and toward a narrower `public.discovery_sources.status` contract, live schema/cache, permission, policy, generated type, or PostgREST-facing column issue.
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:166: Phase 25AS does not conclude that `public.discovery_sources.status` is absent.
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:168: Phase 25AS does not conclude that the live status values are different.
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:176: ## Operational status after Phase 25AR
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:181: operational_reactivation_status=blocked
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:209: - live PostgREST schema cache mismatch for public.discovery_sources.status
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:211: - status column permission/policy issue specific to filtered count queries
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:212: - generated client/query interaction specific to public.discovery_sources.status
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:213: - enum/type/cast mismatch in status filter values
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:228: - No live status enumeration.
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:229: - No grouped live status counts.
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:231: - No broadening beyond `public.discovery_sources` and `public.discovery_runs`.
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:253: 3. Is it correct that the Phase 25AO projection fix did not resolve the remaining `public.discovery_sources.status_count` failures?
docs/discovery-phase-25as-read-only-live-inspection-retry-after-query-shape-fix-result-documentation.md:254: 4. Is the remaining failure correctly scoped to `public.discovery_sources.status_count` for `active`, `inactive`, `paused`, and `blocked`?
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:24: - Baseline subject: `Update read-only inspection status count projection`
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:36: Phase 25AO modified only the source-status count query shape.
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:38: The source-status count projection changed from:
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:41: .select(item.statusColumn, { count: 'exact', head: true })
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:42: .eq(item.statusColumn, statusValue)
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:49: .eq(item.statusColumn, statusValue)
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:52: The explicit status filter was preserved:
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:55: .eq(item.statusColumn, statusValue)
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:63: eq_status_column_count=0 was a static-detector false negative.
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:64: .eq(item.statusColumn, statusValue) was already present.
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:65: The source-status query should not be treated as missing an explicit filter.
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:72: Preserve .eq(item.statusColumn, statusValue).
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:84: scoped status-count id projection/filter sequence = 1
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:85: old status-count projection/filter sequence = 0
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:86: item.statusColumn filter count = 1
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:92: The scoped status-count sequence now exists exactly once:
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:96: .eq(item.statusColumn, statusValue)
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:99: The old source-status projection sequence is absent:
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:102: .select(item.statusColumn, { count: 'exact', head: true })
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:103: .eq(item.statusColumn, statusValue)
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:111: public.discovery_sources
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:136: - No live status enumeration.
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:137: - No grouped live status counts.
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:152: - No live status enumeration.
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:153: - No grouped live status counts.
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:155: - No broadening beyond `public.discovery_sources` and `public.discovery_runs`.
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:173: ## Operational status after Phase 25AO
docs/discovery-phase-25ap-read-only-inspection-query-shape-implementation-result-documentation.md:208: 2. Is it correct that Phase 25AO preserved `.eq(item.statusColumn, statusValue)` and changed only the projection to `.select('id', { count: 'exact', head: true })`?
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:45: public.discovery_sources status_count active
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:46: public.discovery_sources status_count inactive
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:47: public.discovery_sources status_count paused
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:48: public.discovery_sources status_count blocked
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:65: .eq(item.statusColumn, statusValue)
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:68: The retry still failed for `public.discovery_sources.status_count`.
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:72: The remaining failure must be treated as a narrower `public.discovery_sources.status` status-count query failure.
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:79: public.discovery_sources total_count
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:80: public.discovery_sources latest_created_at
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:81: public.discovery_sources latest_updated_at
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:85: public.discovery_runs status_count queued
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:86: public.discovery_runs status_count running
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:87: public.discovery_runs status_count completed
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:88: public.discovery_runs status_count failed
docs/discovery-phase-25at-discovery-sources-status-count-post-retry-failure-analysis-planning-gate.md:89: public.discovery_runs status_count blocked
... truncated: 2576 total rows, showing first 80 ...
```

## Rejected actions for Phase 25BC

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

## Required next gate

The next phase must be the selected planning gate:

```text
next_phase=25BD
next_phase_title=Discovery Sources Status Migration Reconciliation Planning Gate
next_phase_type=planning
live_execution_allowed=false
source_change_allowed=false
schema_change_allowed=false
migration_apply_allowed=false
type_generation_allowed=false
operational_reactivation_allowed=false
```

The next phase may plan the selected remediation path, but must not execute it unless a later reviewed implementation or migration gate authorizes the change.

## Success criteria

```text
decision_gate_complete=true
decision_source=local_repository_only
live_db_reads=false
live_metadata_reads=false
env_scanning=false
db_mutation=false
schema_change=false
migration_apply=false
type_generation=false
source_change=false
inspection_script_change=false
operational_reactivation_status=blocked
next_phase_defined=true
```

## Gemini review request

Gemini should review this Phase 25BC decision gate for evidence quality, decision correctness, and boundary safety.

Specific review questions:

1. Does this decision preserve the Phase 25AZ live metadata finding without adding new live claims?
2. Does this decision correctly use Phase 25BB local evidence as the decision basis?
3. Is the selected decision appropriate for the local evidence shown?
4. Does this phase correctly avoid executing the selected remediation?
5. Does this phase correctly keep operational reactivation blocked?
6. Is the selected next phase safe and appropriately scoped?
