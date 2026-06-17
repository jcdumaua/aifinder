-- Phase 3B — Discovery Engine Schema (Revised)
-- Documentation: Full infrastructure for discovery sources, runs, structured evidence, and cross-table deduplication.
-- This migration is in DRAFT and must be reviewed before execution.

-- 1. Enable pg_trgm for fuzzy matching on tool names
create extension if not exists pg_trgm;

-- 1B. Remove empty legacy discovered_tools table if it exists with the old bigint schema.
-- This table was an earlier draft/experiment and is empty in production.
do $$
declare
  legacy_count bigint;
  legacy_id_type text;
begin
  select c.data_type
  into legacy_id_type
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'discovered_tools'
    and c.column_name = 'id';

  if legacy_id_type is not null and legacy_id_type <> 'uuid' then
    execute 'select count(*) from public.discovered_tools' into legacy_count;

    if legacy_count > 0 then
      raise exception 'Refusing to replace legacy public.discovered_tools because it contains % rows', legacy_count;
    end if;

    drop table public.discovered_tools cascade;
  end if;
end $$;

-- 2. Discovery Sources
-- Defines where tools are found (e.g., Product Hunt, Twitter, RSS)
create table if not exists public.discovery_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  url text,
  source_type text not null check (source_type in ('rss', 'api', 'scraper', 'manual', 'webhook')),
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Discovery Runs
-- Tracks individual crawler/discovery executions
create table if not exists public.discovery_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.discovery_sources(id) on delete cascade,
  status text not null check (status in ('pending', 'running', 'completed', 'failed')),
  stats jsonb not null default '{
    "tools_found": 0,
    "tools_new": 0,
    "tools_duplicates": 0,
    "errors": 0
  }'::jsonb,
  error_log text,
  started_at timestamptz default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Discovered Tools
-- Stores raw tool data awaiting admin review.
create table if not exists public.discovered_tools (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.discovery_sources(id) on delete set null,
  run_id uuid references public.discovery_runs(id) on delete set null,
  name text not null,
  description text,
  website text,
  canonical_url text,
  normalized_domain text,
  slug text,
  status text not null default 'new' check (status in ('new', 'pending_review', 'approved', 'rejected', 'ignored', 'duplicate')),
  pricing text,
  platforms text[],
  category text,
  logo_url text,
  raw_payload jsonb not null default '{}'::jsonb,
  discovery_score float default 0.0,
  
  -- Approval and Review fields
  approved_tool_id bigint references public.tools(id) on delete set null,
  duplicate_of_tool_id bigint references public.tools(id) on delete set null,
  duplicate_of_discovered_tool_id uuid references public.discovered_tools(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid, -- Typically auth.users.id
  rejected_reason text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Discovery Evidence
-- Stores structured metadata extracted during discovery.
create table if not exists public.discovery_evidence (
  id uuid primary key default gen_random_uuid(),
  discovered_tool_id uuid not null references public.discovered_tools(id) on delete cascade,
  source_url text,
  final_url text,
  page_title text,
  meta_description text,
  logo_url text,
  pricing_text text,
  extracted_json jsonb not null default '{}'::jsonb,
  confidence_score numeric default 0,
  content_hash text,
  raw_html_storage_path text,
  screenshot_storage_path text,
  fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Discovery Duplicate Candidates
-- Tracks potential matches across tools, submissions, and other discovery entries.
create table if not exists public.discovery_duplicate_candidates (
  id uuid primary key default gen_random_uuid(),
  discovered_tool_id uuid not null references public.discovered_tools(id) on delete cascade,
  
  candidate_type text not null check (candidate_type in ('tool', 'submission', 'discovered_tool')),
  candidate_tool_id bigint references public.tools(id) on delete set null,
  candidate_submission_id bigint references public.submitted_tools(id) on delete set null,
  candidate_discovered_tool_id uuid references public.discovered_tools(id) on delete set null,
  
  match_type text not null check (match_type in ('canonical_url', 'normalized_domain', 'slug', 'exact_name', 'fuzzy_name')),
  match_score numeric not null default 0,
  is_blocking boolean not null default false,
  reason text,
  created_at timestamptz not null default now(),

  -- Ensure only the relevant candidate ID is filled for the type
  constraint discovery_duplicate_candidates_id_check check (
    (candidate_type = 'tool' and candidate_tool_id is not null and candidate_submission_id is null and candidate_discovered_tool_id is null) or
    (candidate_type = 'submission' and candidate_submission_id is not null and candidate_tool_id is null and candidate_discovered_tool_id is null) or
    (candidate_type = 'discovered_tool' and candidate_discovered_tool_id is not null and candidate_tool_id is null and candidate_submission_id is null)
  )
);

-- 7. Discovery Audit Events
-- Tracks lifecycle changes and admin decisions for discovered tools.
create table if not exists public.discovery_audit_events (
  id uuid primary key default gen_random_uuid(),
  discovered_tool_id uuid references public.discovered_tools(id) on delete set null,
  action text not null check (action in ('approve', 'reject', 'flag', 'ignore', 'batch-action', 'mark-duplicate')),
  actor_id uuid,
  actor_label text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 8. Performance and Deduplication Indexes
create index if not exists discovery_sources_active_idx on public.discovery_sources (is_active);
create index if not exists discovery_runs_status_idx on public.discovery_runs (status);

-- Discovered Tools Indexes
create index if not exists discovered_tools_canonical_url_idx on public.discovered_tools (canonical_url);
create index if not exists discovered_tools_normalized_domain_idx on public.discovered_tools (normalized_domain);
create index if not exists discovered_tools_slug_idx on public.discovered_tools (slug);
create index if not exists discovered_tools_name_idx on public.discovered_tools (name);
create index if not exists discovered_tools_status_idx on public.discovered_tools (status);
create index if not exists discovered_tools_name_trgm_idx on public.discovered_tools using gin (name gin_trgm_ops);

-- Duplicate Candidate Indexes
create index if not exists discovery_duplicate_candidates_tool_idx on public.discovery_duplicate_candidates (candidate_tool_id) where candidate_tool_id is not null;
create index if not exists discovery_duplicate_candidates_submission_idx on public.discovery_duplicate_candidates (candidate_submission_id) where candidate_submission_id is not null;
create index if not exists discovery_duplicate_candidates_discovered_idx on public.discovery_duplicate_candidates (candidate_discovered_tool_id) where candidate_discovered_tool_id is not null;
create index if not exists discovery_duplicate_candidates_discovered_tool_id_idx on public.discovery_duplicate_candidates (discovered_tool_id);
create index if not exists discovery_duplicate_candidates_match_type_idx on public.discovery_duplicate_candidates (match_type);
create index if not exists discovery_duplicate_candidates_blocking_idx on public.discovery_duplicate_candidates (is_blocking);

-- Audit and Evidence Indexes
create index if not exists discovery_evidence_discovered_tool_id_idx on public.discovery_evidence (discovered_tool_id);
create index if not exists discovery_audit_events_tool_id_idx on public.discovery_audit_events (discovered_tool_id);

-- 9. Triggers for updated_at
-- Assumes public.set_updated_at() utility function exists.

drop trigger if exists set_discovery_sources_updated_at on public.discovery_sources;
create trigger set_discovery_sources_updated_at
before update on public.discovery_sources
for each row execute function public.set_updated_at();

drop trigger if exists set_discovery_runs_updated_at on public.discovery_runs;
create trigger set_discovery_runs_updated_at
before update on public.discovery_runs
for each row execute function public.set_updated_at();

drop trigger if exists set_discovered_tools_updated_at on public.discovered_tools;
create trigger set_discovered_tools_updated_at
before update on public.discovered_tools
for each row execute function public.set_updated_at();

drop trigger if exists set_discovery_evidence_updated_at on public.discovery_evidence;
create trigger set_discovery_evidence_updated_at
before update on public.discovery_evidence
for each row execute function public.set_updated_at();

-- 10. RLS - Admin Only Hardening

alter table public.discovery_sources enable row level security;
alter table public.discovery_runs enable row level security;
alter table public.discovered_tools enable row level security;
alter table public.discovery_evidence enable row level security;
alter table public.discovery_duplicate_candidates enable row level security;
alter table public.discovery_audit_events enable row level security;

-- Revoke access from public roles
revoke all on public.discovery_sources from anon, authenticated;
revoke all on public.discovery_runs from anon, authenticated;
revoke all on public.discovered_tools from anon, authenticated;
revoke all on public.discovery_evidence from anon, authenticated;
revoke all on public.discovery_duplicate_candidates from anon, authenticated;
revoke all on public.discovery_audit_events from anon, authenticated;

-- Deny-by-default policies
drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
create policy "Deny all access to discovery_sources"
on public.discovery_sources for all using (false) with check (false);

drop policy if exists "Deny all access to discovery_runs" on public.discovery_runs;
create policy "Deny all access to discovery_runs"
on public.discovery_runs for all using (false) with check (false);

drop policy if exists "Deny all access to discovered_tools" on public.discovered_tools;
create policy "Deny all access to discovered_tools"
on public.discovered_tools for all using (false) with check (false);

drop policy if exists "Deny all access to discovery_evidence" on public.discovery_evidence;
create policy "Deny all access to discovery_evidence"
on public.discovery_evidence for all using (false) with check (false);

drop policy if exists "Deny all access to discovery_duplicate_candidates" on public.discovery_duplicate_candidates;
create policy "Deny all access to discovery_duplicate_candidates"
on public.discovery_duplicate_candidates for all using (false) with check (false);

drop policy if exists "Deny all access to discovery_audit_events" on public.discovery_audit_events;
create policy "Deny all access to discovery_audit_events"
on public.discovery_audit_events for all using (false) with check (false);

-- 11. Comments for Schema Documentation
comment on table public.discovery_sources is 'Registry of sources for automated tool discovery.';
comment on table public.discovery_runs is 'Log of crawler/automated discovery job executions.';
comment on table public.discovered_tools is 'The Discovery Queue. Tools found by engine awaiting admin triage.';
comment on table public.discovery_evidence is 'Extracted metadata and storage paths for crawler artifacts.';
comment on table public.discovery_duplicate_candidates is 'Identified potential matches across existing tools and submissions.';
comment on table public.discovery_audit_events is 'History of admin triage actions within the Discovery Engine.';