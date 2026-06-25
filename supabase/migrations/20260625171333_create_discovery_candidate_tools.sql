-- Phase 8I — Candidate extraction staging table.
-- Creates staging-only candidate records for future reviewed extraction work.
-- This migration does not add extraction, API, UI, approval, publish, or promotion behavior.

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
  'Staging-only candidate tool records from future Discovery Engine extraction.';

comment on column public.discovery_candidate_tools.discovery_run_id is
  'Required reference to the discovery run that produced this staged candidate.';

comment on column public.discovery_candidate_tools.source_evidence_locator is
  'Safe bounded locator for evidence origin, such as execution mode and URL index.';

comment on column public.discovery_candidate_tools.evidence_summary is
  'Bounded safe summary for admin review only.';

comment on column public.discovery_candidate_tools.confidence_bucket is
  'Coarse advisory confidence only; must not approve, publish, rank, or promote a tool.';

comment on column public.discovery_candidate_tools.candidate_status is
  'Staging-only lifecycle status; production-state statuses are forbidden.';
