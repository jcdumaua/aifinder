# Phase 8H — Candidate Extraction Staging Table Migration SQL Draft / Review Gate

## Status / Scope

Status: draft for Gemini review.

Scope: documentation-only SQL draft and review gate for a future Supabase migration that may create a dedicated candidate extraction staging table.

This phase does not create a real migration file. It does not apply schema changes, refresh generated Supabase types, implement extraction, add API/UI behavior, create candidates, write to `discovered_tools`, or write to `public.tools`.

## Background

Phase 8F selected a dedicated candidate staging table as the safest storage direction for future extraction output. Phase 8G translated that decision into a schema and migration implementation plan. Phase 8H now provides the exact proposed SQL draft inside documentation so Gemini can review the table, RLS posture, indexes, constraints, and rollback before any real migration work begins.

Candidate extraction remains not implementation-ready after Phase 8H.

## Non-goals

Phase 8H does not:

- create a file under `supabase/migrations`;
- apply a migration;
- run `supabase db push`;
- modify generated Supabase types;
- add source code;
- add UI or API behavior;
- implement extraction;
- create candidate records;
- write to `discovered_tools`;
- write to `public.tools`;
- add approval, publish, duplicate resolution, ranking, recommendation, LLM, automation, scheduler, cron, crawler, or browser automation behavior;
- store raw HTML, headers, cookies, secrets, raw metadata, raw stats, raw JSON dumps, snippets, stack traces, transport payloads, raw candidate payloads, discovered/public tool payloads, or LLM prompts/responses.

## Phase 8F / 8G Decisions Carried Forward

The following decisions are carried forward:

- The preferred future staging storage is a dedicated table.
- The proposed table name is `public.discovery_candidate_tools`.
- Staged candidates are not approved tools.
- Staged candidates are not public tools.
- Direct `public.tools` writes remain forbidden.
- Extraction output must remain staging-only.
- Human review remains mandatory.
- Duplicate detection remains mandatory before any promotion path.
- Promotion and publish workflows remain out of scope.
- The first migration should avoid generic JSONB payload columns.
- The table must not include approval or publish semantics.
- Gemini must review exact migration SQL before any migration file is created.

## Current Schema Observations from Existing Migrations

Existing Discovery Engine migrations show these relevant patterns:

- `discovery_runs` uses UUID primary keys, status checks, JSONB stats, timestamps, and `public.set_updated_at()` update triggers.
- `discovered_tools` already has queue/review/public linkage semantics, including `status`, `raw_payload`, `approved_tool_id`, duplicate pointers, review fields, and public-tool approval paths. That makes it unsafe as the first raw extraction staging surface.
- `discovery_evidence` contains fields for extracted metadata and artifact storage paths. The future candidate staging table should not copy that raw/artifact pattern.
- `discovery_duplicate_candidates` is tied to `discovered_tools`, not a future dedicated candidate staging table.
- `discovery_audit_events.action` currently has a fixed check constraint limited to existing Discovery Queue actions: `approve`, `reject`, `flag`, `ignore`, `batch-action`, and `mark-duplicate`.
- Discovery tables use B-tree indexes for status, FK lookups, URL/domain lookup, and audit correlation.
- Existing Discovery Engine RLS uses a strict posture: enable RLS, revoke `anon` and `authenticated`, then create deny-all policies using `using (false) with check (false)`.
- Existing migrations use `public.set_updated_at()` for update timestamp triggers.
- Existing service-role RPCs revoke public execution and grant only narrowly reviewed server-side execution where needed.

## Proposed Future Migration Filename

Proposed future migration filename, not created in Phase 8H:

```text
supabase/migrations/YYYYMMDDHHMMSS_create_discovery_candidate_tools.sql
```

The timestamp must be chosen only when a future implementation phase is approved.

## Exact Proposed SQL Draft

The following SQL is a draft for review only. It must not be copied into a real migration until Gemini approves the SQL and James approves the implementation phase.

```sql
-- Phase 8H draft only.
-- Proposed future migration filename:
-- supabase/migrations/YYYYMMDDHHMMSS_create_discovery_candidate_tools.sql
--
-- Purpose:
-- Create a dedicated staging-only table for future candidate extraction output.
-- This table must not store raw HTML, raw metadata, raw stats, raw JSON dumps,
-- snippets, headers, cookies, secrets, stack traces, transport payloads,
-- raw candidate payloads, discovered/public tool payloads, or LLM payloads.

create table if not exists public.discovery_candidate_tools (
  id uuid primary key default gen_random_uuid(),

  discovery_run_id uuid not null
    references public.discovery_runs(id)
    on delete restrict,

  source_url text not null,
  source_url_normalized text not null,
  source_domain text,
  source_evidence_kind text not null default 'static_html_derived_evidence',
  source_evidence_locator text,

  extraction_mode text not null,
  extraction_version text not null,

  candidate_name text not null,
  candidate_website_url text not null,
  candidate_canonical_url text not null,
  candidate_normalized_domain text not null,
  candidate_description text,
  candidate_category_hint text,
  candidate_pricing_hint text,
  candidate_platform_hints text[] not null default '{}'::text[],
  candidate_social_links text[] not null default '{}'::text[],
  candidate_app_links text[] not null default '{}'::text[],

  evidence_summary text,
  confidence_bucket text,
  risk_flags text[] not null default '{}'::text[],

  duplicate_check_status text not null default 'not_checked',
  duplicate_signal_types text[] not null default '{}'::text[],
  duplicate_blocking boolean not null default false,
  possible_duplicate_tool_id bigint references public.tools(id) on delete set null,
  possible_duplicate_discovered_tool_id uuid references public.discovered_tools(id) on delete set null,
  possible_duplicate_candidate_id uuid references public.discovery_candidate_tools(id) on delete set null,
  duplicate_checked_at timestamptz,

  candidate_status text not null default 'staged',
  reviewed_at timestamptz,
  reviewed_by uuid,
  review_notes text,
  rejection_reason_code text,

  audit_correlation_id uuid not null default gen_random_uuid(),

  cleanup_status text not null default 'active',
  eligible_for_cleanup_at timestamptz,
  archived_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint discovery_candidate_tools_source_url_length_check
    check (char_length(source_url) between 1 and 2048),
  constraint discovery_candidate_tools_source_url_https_check
    check (source_url ~ '^https://[^[:space:]]+$'),
  constraint discovery_candidate_tools_source_url_normalized_length_check
    check (char_length(source_url_normalized) between 1 and 2048),
  constraint discovery_candidate_tools_source_url_normalized_https_check
    check (source_url_normalized ~ '^https://[^[:space:]]+$'),
  constraint discovery_candidate_tools_source_domain_length_check
    check (source_domain is null or char_length(source_domain) between 1 and 255),
  constraint discovery_candidate_tools_source_evidence_kind_check
    check (source_evidence_kind in ('static_html_derived_evidence')),
  constraint discovery_candidate_tools_source_evidence_locator_length_check
    check (source_evidence_locator is null or char_length(source_evidence_locator) between 1 and 160),

  constraint discovery_candidate_tools_extraction_mode_length_check
    check (char_length(extraction_mode) between 1 and 80),
  constraint discovery_candidate_tools_extraction_mode_check
    check (extraction_mode in ('deterministic_static_evidence')),
  constraint discovery_candidate_tools_extraction_version_length_check
    check (char_length(extraction_version) between 1 and 80),

  constraint discovery_candidate_tools_candidate_name_length_check
    check (char_length(candidate_name) between 1 and 160),
  constraint discovery_candidate_tools_candidate_website_url_length_check
    check (char_length(candidate_website_url) between 1 and 2048),
  constraint discovery_candidate_tools_candidate_website_url_https_check
    check (candidate_website_url ~ '^https://[^[:space:]]+$'),
  constraint discovery_candidate_tools_candidate_canonical_url_length_check
    check (char_length(candidate_canonical_url) between 1 and 2048),
  constraint discovery_candidate_tools_candidate_canonical_url_https_check
    check (candidate_canonical_url ~ '^https://[^[:space:]]+$'),
  constraint discovery_candidate_tools_candidate_normalized_domain_length_check
    check (char_length(candidate_normalized_domain) between 1 and 255),
  constraint discovery_candidate_tools_candidate_description_length_check
    check (candidate_description is null or char_length(candidate_description) <= 1000),
  constraint discovery_candidate_tools_candidate_category_hint_check
    check (
      candidate_category_hint is null
      or candidate_category_hint in (
        'Chatbots',
        'Image AI',
        'Video AI',
        'Voice AI',
        'Writing',
        'Coding',
        'Business',
        'Productivity',
        'Education AI',
        'Marketing AI',
        'SEO AI',
        'Design AI',
        'AI Agents'
      )
    ),
  constraint discovery_candidate_tools_candidate_pricing_hint_check
    check (
      candidate_pricing_hint is null
      or candidate_pricing_hint in ('Free + Paid', 'Free', 'Paid')
    ),
  constraint discovery_candidate_tools_platform_hints_count_check
    check (coalesce(array_length(candidate_platform_hints, 1), 0) <= 12),
  constraint discovery_candidate_tools_social_links_count_check
    check (coalesce(array_length(candidate_social_links, 1), 0) <= 12),
  constraint discovery_candidate_tools_app_links_count_check
    check (coalesce(array_length(candidate_app_links, 1), 0) <= 12),

  constraint discovery_candidate_tools_evidence_summary_length_check
    check (evidence_summary is null or char_length(evidence_summary) <= 1000),
  constraint discovery_candidate_tools_confidence_bucket_check
    check (confidence_bucket is null or confidence_bucket in ('low', 'medium', 'high')),
  constraint discovery_candidate_tools_risk_flags_count_check
    check (coalesce(array_length(risk_flags, 1), 0) <= 16),

  constraint discovery_candidate_tools_duplicate_check_status_check
    check (duplicate_check_status in ('not_checked', 'pending', 'suspected', 'blocked', 'cleared')),
  constraint discovery_candidate_tools_duplicate_signal_types_count_check
    check (coalesce(array_length(duplicate_signal_types, 1), 0) <= 16),

  constraint discovery_candidate_tools_candidate_status_check
    check (candidate_status in ('staged', 'needs_review', 'duplicate_suspected', 'rejected', 'archived')),
  constraint discovery_candidate_tools_no_approval_status_check
    check (lower(candidate_status) not in ('approved', 'published', 'promoted', 'live', 'public')),
  constraint discovery_candidate_tools_review_notes_length_check
    check (review_notes is null or char_length(review_notes) <= 1000),
  constraint discovery_candidate_tools_rejection_reason_code_length_check
    check (rejection_reason_code is null or char_length(rejection_reason_code) between 1 and 80),

  constraint discovery_candidate_tools_cleanup_status_check
    check (cleanup_status in ('active', 'cleanup_eligible', 'archived'))
);

create index if not exists discovery_candidate_tools_run_id_idx
  on public.discovery_candidate_tools (discovery_run_id);

create index if not exists discovery_candidate_tools_candidate_status_idx
  on public.discovery_candidate_tools (candidate_status);

create index if not exists discovery_candidate_tools_created_at_idx
  on public.discovery_candidate_tools (created_at desc);

create index if not exists discovery_candidate_tools_review_queue_idx
  on public.discovery_candidate_tools (candidate_status, created_at desc);

create index if not exists discovery_candidate_tools_candidate_canonical_url_idx
  on public.discovery_candidate_tools (candidate_canonical_url);

create index if not exists discovery_candidate_tools_candidate_normalized_domain_idx
  on public.discovery_candidate_tools (candidate_normalized_domain);

create index if not exists discovery_candidate_tools_source_url_normalized_idx
  on public.discovery_candidate_tools (source_url_normalized);

create index if not exists discovery_candidate_tools_duplicate_check_status_idx
  on public.discovery_candidate_tools (duplicate_check_status);

create index if not exists discovery_candidate_tools_cleanup_idx
  on public.discovery_candidate_tools (cleanup_status, eligible_for_cleanup_at);

create unique index if not exists discovery_candidate_tools_run_canonical_active_uidx
  on public.discovery_candidate_tools (discovery_run_id, candidate_canonical_url)
  where candidate_status in ('staged', 'needs_review', 'duplicate_suspected');

drop trigger if exists set_discovery_candidate_tools_updated_at
  on public.discovery_candidate_tools;

create trigger set_discovery_candidate_tools_updated_at
before update on public.discovery_candidate_tools
for each row execute function public.set_updated_at();

alter table public.discovery_candidate_tools enable row level security;

revoke all on public.discovery_candidate_tools from anon, authenticated;

drop policy if exists "Deny all access to discovery_candidate_tools"
  on public.discovery_candidate_tools;

create policy "Deny all access to discovery_candidate_tools"
on public.discovery_candidate_tools
for all
using (false)
with check (false);

comment on table public.discovery_candidate_tools is
  'Staging-only candidate tool records from future Discovery Engine extraction; not approved tools and not public tools.';

comment on column public.discovery_candidate_tools.discovery_run_id is
  'Required reference to the discovery run that produced this staged candidate.';

comment on column public.discovery_candidate_tools.source_evidence_locator is
  'Safe bounded locator for evidence origin, such as execution mode and URL index; never raw evidence.';

comment on column public.discovery_candidate_tools.evidence_summary is
  'Bounded safe summary only; must not contain raw page text, snippets, raw HTML, headers, cookies, secrets, stack traces, or transport payloads.';

comment on column public.discovery_candidate_tools.confidence_bucket is
  'Coarse advisory confidence only; must not approve, publish, rank, or promote a tool.';

comment on column public.discovery_candidate_tools.candidate_status is
  'Staging-only lifecycle status; approval, publish, promotion, live, and public statuses are forbidden.';
```

## Explanation of Each SQL Section

### Table identity and run relationship

The table uses a UUID primary key and a required `discovery_run_id` FK to `public.discovery_runs(id)`. The proposed FK uses `on delete restrict` so a discovery run cannot be removed while staging candidates still reference it unless a future cleanup policy explicitly handles that lifecycle.

### Source and evidence locator fields

The source fields store safe URL/domain references and a bounded evidence locator. They do not store raw evidence, raw HTML, snippets, raw metadata, raw stats, headers, cookies, or transport payloads.

### Extraction identity fields

`extraction_mode` and `extraction_version` identify the future extraction contract. The first proposed mode is `deterministic_static_evidence`, which keeps Phase 8H aligned with the current no-LLM static evidence track.

### Candidate fields

Candidate fields are safe, bounded, normalized hints only. The proposed table stores name, sanitized HTTPS URLs, normalized domain, bounded description, category hint, pricing hint, bounded link arrays, risk flags, and evidence summary.

These fields are not verified product data and must not be rendered as approved/public tool records.

### Confidence field

`confidence_bucket` is coarse and advisory only: `low`, `medium`, or `high`. It is not a ranking system and must not approve, publish, promote, or bypass duplicate review.

### Duplicate advisory fields

Duplicate fields are advisory only. They support later duplicate detection, but do not implement duplicate detection and do not resolve duplicates by themselves. Pointers to `public.tools`, `discovered_tools`, or another staging candidate remain nullable and informational.

### Human review fields

Review fields are staging-only. They allow a future admin review workflow to record safe review metadata, but do not add approval, publish, public-tool insertion, or promotion semantics.

### Audit correlation fields

`audit_correlation_id` gives future audit events a safe correlation identifier without storing raw audit rows or raw event metadata on the staging record.

### Cleanup fields

Cleanup fields allow future retention policy design. They do not delete approved/public tools and do not authorize cleanup tooling in Phase 8H.

### Checks and length constraints

The SQL draft uses check constraints to bound text length, restrict status values, restrict confidence buckets, restrict category/pricing hints, bound arrays, and require HTTPS URL shape for source/candidate URLs. These database constraints are guardrails only; future extraction code must still normalize and validate before insert.

### Indexes

The SQL draft adds B-tree indexes for run lookup, status/review queues, created ordering, canonical URL/domain duplicate checks, source URL lookup, duplicate status, and cleanup queues. It also adds a partial unique index to prevent duplicate active staged candidates with the same canonical URL within a single run.

### Updated timestamp trigger

The SQL draft reuses the existing `public.set_updated_at()` trigger pattern seen in existing migrations.

### RLS and privileges

The SQL draft enables RLS, revokes all table access from `anon` and `authenticated`, and creates a deny-all policy. This matches the strict Discovery Engine hardening posture. Direct browser/client Supabase access remains forbidden.

### Comments

Table and column comments document staging-only semantics and reinforce that the table must not be used as an approval, publish, or public-tool surface.

## RLS / Security Review Notes

The proposed first RLS posture is intentionally strict:

- RLS enabled.
- No `anon` access.
- No `authenticated` access.
- No public access.
- No public-safe view.
- No direct browser/client writes.
- Deny-by-default policy for all operations.
- Future writes only through server-side service-role code paths if a later phase separately approves extraction/staging writes.
- Future admin reads should go through protected server-side admin routes with existing admin-session and CSRF protections, not direct authenticated table access.

Existing migrations include admin-specific RLS examples for other systems, but the Discovery Engine schema currently uses deny-by-default policies and service-side admin route behavior. Because no direct admin RLS helper is established for this staging table, the safer first implementation should keep the table inaccessible to direct client roles.

## Index / Constraint Review Notes

Gemini should review whether:

- `on delete restrict` is the correct FK behavior for `discovery_run_id`;
- the proposed active-row partial unique index is too strict or appropriately scoped;
- `candidate_canonical_url` and `candidate_normalized_domain` indexes are sufficient for the first duplicate detection phase;
- global uniqueness should remain intentionally absent until duplicate workflow semantics are approved;
- URL regex checks are useful as guardrails without becoming false confidence;
- array count checks should be supplemented by future normalizer item-length checks;
- `rejected` and `archived` are sufficient terminal staging statuses for the first migration;
- `duplicate_blocking` should exist in the first migration or be deferred to a duplicate detection phase;
- nullable duplicate pointers to `public.tools` and `discovered_tools` are acceptable as advisory-only references.

Constraints intentionally avoid status values such as `approved`, `published`, `promoted`, `live`, and `public`.

The table intentionally omits columns named or shaped like:

- `raw_payload`;
- `raw_html`;
- `html`;
- `headers`;
- `cookies`;
- `secrets`;
- `metadata_raw`;
- `raw_metadata`;
- `raw_stats`;
- `json_dump`;
- `snippet`;
- `stack_trace`;
- `transport_payload`;
- `llm_prompt`;
- `llm_response`;
- `public_tool_payload`;
- `discovered_tool_payload`.

## Audit Event Compatibility Notes

The current `public.discovery_audit_events.action` check constraint only allows existing Discovery Queue actions. Future candidate extraction audit events may require a separate reviewed migration before they can be inserted into that table.

Proposed safe future candidate audit action names:

- `candidate_extraction_started`;
- `candidate_extraction_source_normalized`;
- `candidate_tool_staged`;
- `candidate_tool_rejected_by_normalizer`;
- `candidate_tool_duplicate_suspected`;
- `candidate_tool_review_status_changed`;
- `candidate_tool_rejected`;
- `candidate_tool_archived`;
- `candidate_tool_cleanup_eligible`;
- `candidate_tool_cleaned_up`;
- `candidate_extraction_completed`;
- `candidate_extraction_failed_safely`.

Gemini should decide whether a future implementation should:

- extend the existing `discovery_audit_events.action` check constraint;
- use an existing bounded action with a safe metadata event type;
- add a nullable `candidate_tool_id` FK to `discovery_audit_events`;
- create a candidate-specific audit table;
- keep candidate lifecycle audit events server-side only until a later audit schema phase.

Future audit metadata must be fixed-shape and safe. It may include bounded identifiers and labels such as:

- `run_id`;
- `candidate_tool_id`;
- `audit_correlation_id`;
- `event_type`;
- `candidate_status`;
- `duplicate_check_status`;
- `source_url_normalized`;
- `safe_failure_code`;
- `actor_id` or `actor_label` for admin actions.

Future audit metadata must not include raw HTML, raw visible text, snippets, raw metadata, raw stats, raw JSON dumps, headers, cookies, secrets, stack traces, transport payloads, discovered/public tool payloads, raw candidate payloads, or LLM prompts/responses.

## Rollback SQL Draft

This rollback SQL is also draft-only. It must be reviewed again before use and applies only to the future migration that creates `public.discovery_candidate_tools`.

Rollback must not touch `public.tools`, `discovered_tools`, approved public data, unrelated discovery runs, or unrelated audit events.

```sql
-- Phase 8H rollback draft only.
-- Review again before use in any future migration rollback.

drop policy if exists "Deny all access to discovery_candidate_tools"
  on public.discovery_candidate_tools;

drop trigger if exists set_discovery_candidate_tools_updated_at
  on public.discovery_candidate_tools;

drop index if exists public.discovery_candidate_tools_run_canonical_active_uidx;
drop index if exists public.discovery_candidate_tools_cleanup_idx;
drop index if exists public.discovery_candidate_tools_duplicate_check_status_idx;
drop index if exists public.discovery_candidate_tools_source_url_normalized_idx;
drop index if exists public.discovery_candidate_tools_candidate_normalized_domain_idx;
drop index if exists public.discovery_candidate_tools_candidate_canonical_url_idx;
drop index if exists public.discovery_candidate_tools_review_queue_idx;
drop index if exists public.discovery_candidate_tools_created_at_idx;
drop index if exists public.discovery_candidate_tools_candidate_status_idx;
drop index if exists public.discovery_candidate_tools_run_id_idx;

drop table if exists public.discovery_candidate_tools;
```

## Future Verification / Smoke-Test Plan

A future implementation phase must verify:

- the migration applies cleanly;
- `public.discovery_candidate_tools` exists;
- RLS is enabled;
- `anon` access is denied;
- `authenticated` public/client access is denied unless a separate reviewed admin policy is approved;
- no public-safe view exposes the table;
- service-role/server access remains bounded to approved server-side code paths;
- unsafe status values such as `approved`, `published`, `promoted`, `live`, and `public` are rejected;
- overlong candidate/source text is rejected;
- unsafe non-HTTPS URLs are rejected by both normalizer and SQL guardrails;
- candidate insert behavior is not implemented unless separately approved;
- no `public.tools` rows are written;
- no `discovered_tools` rows are written;
- no raw unsafe payload appears in table fields;
- audit metadata contains no raw unsafe payloads;
- generated Supabase types are refreshed only in the future implementation phase;
- rollback removes only the staging table objects if reviewed and approved.

## Required Gemini Review Questions

Gemini should explicitly answer:

1. Is the table shape safe for staging-only candidate extraction output?
2. Is the SQL safe to turn into a real migration in the next approved phase?
3. Is the RLS posture strict enough?
4. Are the constraints sufficient to prevent approval/publish semantics?
5. Are the length bounds appropriate?
6. Are the URL guardrails appropriate, or should URL validation remain purely in application normalizers?
7. Are the indexes correct for review queues and future duplicate detection?
8. Is the partial unique index scoped safely?
9. Are the advisory duplicate fields appropriate for the first migration?
10. Is audit event compatibility handled safely?
11. Should future candidate audit events extend `discovery_audit_events` or use a separate candidate audit table?
12. Is the rollback plan safe?
13. Should generated Supabase type updates be included only in the later migration implementation phase?
14. Is it safe to create a real migration file in the next approved phase?

## Final Phase 8H Decision Summary

Phase 8H proposes exact SQL for a future `public.discovery_candidate_tools` staging table, but does not authorize implementation.

Decision state after Phase 8H:

- Candidate extraction remains not implementation-ready.
- No real migration file is authorized by this document alone.
- No schema apply is authorized.
- No generated Supabase type update is authorized.
- No code, API, UI, automation, or extraction behavior is authorized.
- Direct `public.tools` writes remain forbidden.
- Staged candidates remain unapproved and non-public.
- Human review remains mandatory.
- Duplicate detection remains mandatory before any promotion path.
- Promotion and publish workflows remain out of scope.

Recommended next action: send this document to Gemini for SQL/schema/RLS review before creating any real migration file.
