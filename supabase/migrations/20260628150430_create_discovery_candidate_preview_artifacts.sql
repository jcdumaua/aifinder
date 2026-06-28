-- Phase 13D — Candidate Preview Artifact Migration Draft.
-- Draft only: do not apply without Gemini review and explicit user approval.
-- This migration drafts the future read-only candidate preview artifact table
-- for the Discovery Engine Admin UI preview provider.
--
-- This migration does not add provider code, API routes, UI wiring, live
-- staging, crawler execution, LLM execution, public publishing, public.tools
-- writes, discovered_tools writes, candidate staging writes, audit writes,
-- public grants, authenticated grants, or type generation.

create table if not exists public.discovery_candidate_preview_artifacts (
  id uuid primary key default gen_random_uuid(),

  discovery_source_id uuid not null
    references public.discovery_sources(id)
    on delete restrict,

  discovery_run_id uuid not null
    references public.discovery_runs(id)
    on delete restrict,

  audit_correlation_id uuid not null default gen_random_uuid(),

  preview_schema_version text not null default 'candidate_preview_artifact.v1',
  preview_status text not null default 'pending_review',

  candidate_name text,
  candidate_website_url text,
  category_hint text,
  pricing_hint text,
  confidence_bucket text,
  evidence_summary text,
  source_evidence_locator text,

  safety_flags text[] not null default '{}'::text[],

  preview_generated_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint discovery_candidate_preview_artifacts_schema_version_length_check
    check (char_length(preview_schema_version) between 1 and 80),

  constraint discovery_candidate_preview_artifacts_schema_version_check
    check (preview_schema_version = 'candidate_preview_artifact.v1'),

  constraint discovery_candidate_preview_artifacts_status_check
    check (
      preview_status in (
        'unavailable',
        'pending_review',
        'reviewable',
        'blocked',
        'stale'
      )
    ),

  constraint discovery_candidate_preview_artifacts_candidate_name_length_check
    check (candidate_name is null or char_length(candidate_name) between 1 and 160),

  constraint discovery_candidate_preview_artifacts_candidate_website_url_length_check
    check (
      candidate_website_url is null
      or char_length(candidate_website_url) between 1 and 2048
    ),

  constraint discovery_candidate_preview_artifacts_candidate_website_url_https_check
    check (
      candidate_website_url is null
      or candidate_website_url ~ '^https://[^[:space:]]+$'
    ),

  constraint discovery_candidate_preview_artifacts_category_hint_check
    check (
      category_hint is null
      or category_hint in (
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

  constraint discovery_candidate_preview_artifacts_pricing_hint_check
    check (
      pricing_hint is null
      or pricing_hint in ('Free + Paid', 'Free', 'Paid')
    ),

  constraint discovery_candidate_preview_artifacts_confidence_bucket_check
    check (
      confidence_bucket is null
      or confidence_bucket in ('low', 'medium', 'high', 'review', 'blocked')
    ),

  constraint discovery_candidate_preview_artifacts_evidence_summary_length_check
    check (evidence_summary is null or char_length(evidence_summary) <= 1000),

  constraint discovery_candidate_preview_artifacts_source_evidence_locator_length_check
    check (
      source_evidence_locator is null
      or char_length(source_evidence_locator) between 1 and 160
    ),

  constraint discovery_candidate_preview_artifacts_safety_flags_count_check
    check (coalesce(array_length(safety_flags, 1), 0) <= 24),

  constraint discovery_candidate_preview_artifacts_safety_flags_allowlist_check
    check (
      safety_flags <@ array[
        'bounded_preview',
        'server_sanitized',
        'source_run_matched',
        'no_public_write',
        'no_discovered_write',
        'no_raw_html',
        'no_llm_output',
        'unsafe_url_blocked',
        'stale_schema_blocked',
        'ambiguous_preview_blocked'
      ]::text[]
    ),

  constraint discovery_candidate_preview_artifacts_reviewable_required_fields_check
    check (
      preview_status <> 'reviewable'
      or (
        candidate_name is not null
        and candidate_website_url is not null
        and source_evidence_locator is not null
        and preview_generated_at is not null
      )
    )
);

create index if not exists discovery_candidate_preview_artifacts_run_id_idx
  on public.discovery_candidate_preview_artifacts (discovery_run_id);

create index if not exists discovery_candidate_preview_artifacts_source_id_idx
  on public.discovery_candidate_preview_artifacts (discovery_source_id);

create index if not exists discovery_candidate_preview_artifacts_run_source_idx
  on public.discovery_candidate_preview_artifacts (
    discovery_run_id,
    discovery_source_id
  );

create index if not exists discovery_candidate_preview_artifacts_status_idx
  on public.discovery_candidate_preview_artifacts (preview_status);

create index if not exists discovery_candidate_preview_artifacts_schema_version_idx
  on public.discovery_candidate_preview_artifacts (preview_schema_version);

create index if not exists discovery_candidate_preview_artifacts_audit_correlation_idx
  on public.discovery_candidate_preview_artifacts (audit_correlation_id);

create index if not exists discovery_candidate_preview_artifacts_created_at_idx
  on public.discovery_candidate_preview_artifacts (created_at desc);

create unique index if not exists discovery_candidate_preview_artifacts_reviewable_run_source_uidx
  on public.discovery_candidate_preview_artifacts (
    discovery_run_id,
    discovery_source_id
  )
  where preview_status = 'reviewable';

drop trigger if exists set_discovery_candidate_preview_artifacts_updated_at
  on public.discovery_candidate_preview_artifacts;

create trigger set_discovery_candidate_preview_artifacts_updated_at
before update on public.discovery_candidate_preview_artifacts
for each row execute function public.set_updated_at();

alter table public.discovery_candidate_preview_artifacts enable row level security;

revoke all on public.discovery_candidate_preview_artifacts from anon, authenticated;

drop policy if exists "Deny all access to discovery_candidate_preview_artifacts"
  on public.discovery_candidate_preview_artifacts;

create policy "Deny all access to discovery_candidate_preview_artifacts"
on public.discovery_candidate_preview_artifacts
for all
using (false)
with check (false);

comment on table public.discovery_candidate_preview_artifacts is
  'Server-derived, sanitized, pre-staging candidate preview artifacts for Discovery Engine admin review.';

comment on column public.discovery_candidate_preview_artifacts.discovery_source_id is
  'Required source row that produced or supplied the preview evidence.';

comment on column public.discovery_candidate_preview_artifacts.discovery_run_id is
  'Required discovery run that produced or supplied the preview evidence.';

comment on column public.discovery_candidate_preview_artifacts.audit_correlation_id is
  'Correlation identifier for connecting future preview, extraction, review, and staging events without exposing raw payloads.';

comment on column public.discovery_candidate_preview_artifacts.preview_schema_version is
  'Versioned contract for preview artifact provider compatibility checks.';

comment on column public.discovery_candidate_preview_artifacts.preview_status is
  'Preview lifecycle status; only reviewable artifacts may be displayed as actionable previews by future provider logic.';

comment on column public.discovery_candidate_preview_artifacts.candidate_name is
  'Bounded sanitized candidate display name for admin preview only.';

comment on column public.discovery_candidate_preview_artifacts.candidate_website_url is
  'Bounded sanitized HTTPS candidate website URL for admin preview only.';

comment on column public.discovery_candidate_preview_artifacts.evidence_summary is
  'Bounded sanitized evidence summary; never raw HTML, raw LLM output, or raw payload data.';

comment on column public.discovery_candidate_preview_artifacts.source_evidence_locator is
  'Safe bounded locator for the evidence origin, not raw evidence content.';

comment on column public.discovery_candidate_preview_artifacts.safety_flags is
  'Short allowlist-style safety tokens only; no raw payloads, secrets, stack traces, cookies, CSRF tokens, SQL errors, or service-role details.';

comment on column public.discovery_candidate_preview_artifacts.preview_generated_at is
  'Timestamp used by future provider logic for freshness checks.';
