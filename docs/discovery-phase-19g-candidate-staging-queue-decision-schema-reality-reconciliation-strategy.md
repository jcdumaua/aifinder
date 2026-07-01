# Discovery Phase 19G — Candidate Staging Queue Decision Schema Reality Reconciliation / Final Migration Strategy

## Status

Phase 19G is a docs-only schema reality reconciliation and final migration strategy phase.

Current pushed baseline:

```text
73cb726 Document candidate decision manual constraint confirmation
```

Phase 19G follows Gemini's Phase 19F conclusion:

```text
candidate_status has no existing CHECK constraint.
discovery_audit_events uses action, not event_type.
Phase 19G should formalize the migration strategy from this SQL reality.
```

Phase 19G does not implement code.

Phase 19G does not modify tests, API routes, backend helpers, UI components, migrations, package files, or source files.

Phase 19G does not create a migration file.

Phase 19G does not draft a migration file.

Phase 19G does not apply a migration.

Phase 19G does not run type generation.

Phase 19G does not run browser QA.

Phase 19G does not run live database queries.

Phase 19G does not run database mutations.

## Discovery Engine Progress Snapshot

Progress after Phase 19G strategy reconciliation:

```text
Discovery Engine overall: ~91.5%
Phase 19G progress: 100%
Current milestone: Candidate Staging Queue decision schema final migration strategy complete
```

## Purpose

Phase 19F provided the raw SQL reality needed to stop guessing.

Phase 19G reconciles the intended decision workflow with actual local migration evidence.

Phase 19G answers:

```text
What exact migration strategy should be drafted next, given that candidate_status is unconstrained text and discovery_audit_events uses action instead of event_type?
```

## SQL Reality Summary

Candidate table migration inspected:

```text
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql
```

Audit table migration inspected:

```text
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql
```

candidate_status existing CHECK confirmed:

```text
True
```

discovery_audit_events.event_type confirmed:

```text
False
```

discovery_audit_events.action CHECK confirmed:

```text
True
```

public.tools target table signal confirmed:

```text
True
```

Candidate status strategy:

```text
Existing candidate_status CHECK signal found; migration strategy must inspect exact constraint before altering.
```

Audit strategy:

```text
discovery_audit_events uses action with a CHECK constraint, not event_type; migration strategy should expand/replace the action CHECK or use an existing allowed action with metadata.
```

## Final Candidate Status Strategy

Phase 19G strategy:

```text
Do not drop a guessed candidate_status constraint.
Do not use discovery_candidate_tools_.
Do not use discovery_candidate_tools_source_url_length_check.
Add a new named candidate_status CHECK constraint instead.
```

Recommended future constraint name:

```text
discovery_candidate_tools_candidate_status_check
```

Allowed first decision statuses:

```text
staged
under_review
approved_for_draft
rejected
archived
duplicate
needs_more_evidence
```

Deferred statuses remain out of first mutation implementation unless separately approved:

```text
promoted_to_publish_draft
published
```

Reason:

```text
Approve for draft does not publish.
public.tools write remains forbidden until a separate publish workflow phase is approved.
```

## Final Decision Metadata Strategy

Recommended nullable columns for the future migration draft:

```text
decision_action
decision_reason
decision_notes
decided_at
decided_by
duplicate_of_candidate_id
duplicate_of_tool_id
```

Required database-level constraint:

```text
decision_action should be constrained at the database level.
```

Allowed decision_action values:

```text
approve_for_draft
reject
archive
duplicate
needs_more_evidence
```

Application-level validation:

```text
decision_reason should remain TEXT and be validated in application code.
```

Length safety:

```text
decision_notes should be nullable and capped at 1000 characters.
```

Foreign key safety:

```text
duplicate_of_candidate_id should reference public.discovery_candidate_tools(id) ON DELETE SET NULL.
duplicate_of_tool_id should reference public.tools(id) ON DELETE SET NULL.
```

## Final Audit Strategy

Phase 19G rejects the imaginary event_type path:

```text
Do not design against discovery_audit_events.event_type unless a future schema phase explicitly adds that column.
```

Actual local audit discriminator:

```text
action
```

Recommended audit action strategy for the future migration draft:

```text
Use discovery_audit_events.action, not event_type.
Add or allow candidate_decision as the audit action for Candidate Staging Queue decisions.
Store the specific decision action, reason, notes, old status, new status, candidate id, duplicate ids, and audit correlation id in metadata JSONB.
```

Recommended action value:

```text
candidate_decision
```

Reason:

```text
A single audit action keeps the existing audit table model stable while metadata carries the decision-specific detail.
```

Important future migration requirement:

```text
If the existing action CHECK constraint blocks candidate_decision, the future migration draft must safely replace or expand that action CHECK.
```

Safe approach for action CHECK handling:

```text
Use exact local SQL evidence or a guarded dynamic migration block.
Do not guess a constraint name.
Do not use event_type.
```

## Future Migration Draft Shape

The following is strategy-only SQL shape.

It must not be created as a migration file in Phase 19G.

It must not be applied in Phase 19G.

```sql
-- Draft shape only. Do not create/apply in Phase 19G.

-- 1. candidate_status reality:
-- public.discovery_candidate_tools.candidate_status is text with default staged.
-- No existing candidate_status CHECK constraint is confirmed by Phase 19F/19G evidence.
-- Future migration should ADD a new named CHECK constraint.

ALTER TABLE public.discovery_candidate_tools
  ADD CONSTRAINT discovery_candidate_tools_candidate_status_check
  CHECK (
    candidate_status IN (
      'staged',
      'under_review',
      'approved_for_draft',
      'rejected',
      'archived',
      'duplicate',
      'needs_more_evidence'
    )
  );

-- 2. decision metadata columns should be nullable first.
ALTER TABLE public.discovery_candidate_tools
  ADD COLUMN IF NOT EXISTS decision_action text,
  ADD COLUMN IF NOT EXISTS decision_reason text,
  ADD COLUMN IF NOT EXISTS decision_notes text,
  ADD COLUMN IF NOT EXISTS decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS decided_by text,
  ADD COLUMN IF NOT EXISTS duplicate_of_candidate_id uuid,
  ADD COLUMN IF NOT EXISTS duplicate_of_tool_id uuid;

-- 3. decision_action should be database-constrained.
ALTER TABLE public.discovery_candidate_tools
  ADD CONSTRAINT discovery_candidate_tools_decision_action_check
  CHECK (
    decision_action IS NULL OR decision_action IN (
      'approve_for_draft',
      'reject',
      'archive',
      'duplicate',
      'needs_more_evidence'
    )
  );

-- 4. decision_notes length should be bounded.
ALTER TABLE public.discovery_candidate_tools
  ADD CONSTRAINT discovery_candidate_tools_decision_notes_length_check
  CHECK (decision_notes IS NULL OR char_length(decision_notes) <= 1000);

-- 5. duplicate references should use foreign keys if target tables are confirmed.
ALTER TABLE public.discovery_candidate_tools
  ADD CONSTRAINT discovery_candidate_tools_duplicate_of_candidate_id_fkey
  FOREIGN KEY (duplicate_of_candidate_id)
  REFERENCES public.discovery_candidate_tools(id)
  ON DELETE SET NULL;

ALTER TABLE public.discovery_candidate_tools
  ADD CONSTRAINT discovery_candidate_tools_duplicate_of_tool_id_fkey
  FOREIGN KEY (duplicate_of_tool_id)
  REFERENCES public.tools(id)
  ON DELETE SET NULL;

-- 6. audit reality:
-- discovery_audit_events uses action, not event_type.
-- Future migration must not add imaginary event_type usage without a separate design.
-- Strategy option A: expand/replace existing action CHECK to include candidate_decision.
-- Strategy option B: use an existing allowed action and store decision details in metadata.
-- Phase 19G recommends Strategy A only if the exact action CHECK handling can be done safely.

```

## Exact SQL Evidence — discovery_candidate_tools / candidate_status

### `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` lines 1-31

```sql
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
```

### `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` lines 36-70

```sql
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
```

### `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` lines 130-164

```sql
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
```

### `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` lines 172-206

```sql
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
```

### `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` lines 209-218

```sql
'Safe bounded locator for evidence origin, such as execution mode and URL index.';

comment on column public.discovery_candidate_tools.evidence_summary is
  'Bounded safe summary for admin review only.';

comment on column public.discovery_candidate_tools.confidence_bucket is
  'Coarse advisory confidence only; must not approve, publish, rank, or promote a tool.';

comment on column public.discovery_candidate_tools.candidate_status is
  'Staging-only lifecycle status; production-state statuses are forbidden.';
```

## Exact SQL Evidence — discovery_audit_events / action

### `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` lines 27-63

```sql
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
```

### `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` lines 94-130

```sql
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
```

### `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` lines 140-176

```sql
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
```

### `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` lines 205-241

```sql
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
```

### `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` lines 246-254

```sql
on public.discovery_audit_events for all using (false) with check (false);

-- 11. Comments for Schema Documentation
comment on table public.discovery_sources is 'Registry of sources for automated tool discovery.';
comment on table public.discovery_runs is 'Log of crawler/automated discovery job executions.';
comment on table public.discovered_tools is 'The Discovery Queue. Tools found by engine awaiting admin triage.';
comment on table public.discovery_evidence is 'Extracted metadata and storage paths for crawler artifacts.';
comment on table public.discovery_duplicate_candidates is 'Identified potential matches across existing tools and submissions.';
comment on table public.discovery_audit_events is 'History of admin triage actions within the Discovery Engine.';
```

## Candidate Status Evidence Line Snapshot

| File | Line | Evidence |
| --- | ---: | --- |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 36 | `duplicate_check_status text not null default 'not_checked',` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 42 | `duplicate_checked_at timestamptz,` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 44 | `candidate_status text not null default 'staged',` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 59 | `constraint discovery_candidate_tools_source_url_length_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 60 | `check (char_length(source_url) between 1 and 2048),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 61 | `constraint discovery_candidate_tools_source_url_https_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 62 | `check (source_url ~ '^https://[^[:space:]]+$'),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 63 | `constraint discovery_candidate_tools_source_url_normalized_length_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 64 | `check (char_length(source_url_normalized) between 1 and 2048),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 65 | `constraint discovery_candidate_tools_source_url_normalized_https_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 66 | `check (source_url_normalized ~ '^https://[^[:space:]]+$'),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 67 | `constraint discovery_candidate_tools_source_domain_length_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 68 | `check (source_domain is null or char_length(source_domain) between 1 and 255),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 69 | `constraint discovery_candidate_tools_source_evidence_kind_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 70 | `check (source_evidence_kind in ('static_html_derived_evidence')),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 71 | `constraint discovery_candidate_tools_source_evidence_locator_length_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 72 | `check (source_evidence_locator is null or char_length(source_evidence_locator) between 1 and 160),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 74 | `constraint discovery_candidate_tools_extraction_mode_length_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 75 | `check (char_length(extraction_mode) between 1 and 80),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 76 | `constraint discovery_candidate_tools_extraction_mode_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 77 | `check (extraction_mode in ('deterministic_static_evidence')),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 78 | `constraint discovery_candidate_tools_extraction_version_length_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 79 | `check (char_length(extraction_version) between 1 and 80),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 81 | `constraint discovery_candidate_tools_candidate_name_length_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 82 | `check (char_length(candidate_name) between 1 and 160),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 83 | `constraint discovery_candidate_tools_candidate_website_url_length_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 84 | `check (char_length(candidate_website_url) between 1 and 2048),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 85 | `constraint discovery_candidate_tools_candidate_website_url_https_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 86 | `check (candidate_website_url ~ '^https://[^[:space:]]+$'),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 87 | `constraint discovery_candidate_tools_candidate_canonical_url_length_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 88 | `check (char_length(candidate_canonical_url) between 1 and 2048),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 89 | `constraint discovery_candidate_tools_candidate_canonical_url_https_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 90 | `check (candidate_canonical_url ~ '^https://[^[:space:]]+$'),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 91 | `constraint discovery_candidate_tools_candidate_normalized_domain_length_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 92 | `check (char_length(candidate_normalized_domain) between 1 and 255),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 93 | `constraint discovery_candidate_tools_candidate_description_length_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 94 | `check (candidate_description is null or char_length(candidate_description) <= 1000),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 95 | `constraint discovery_candidate_tools_candidate_category_hint_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 96 | `check (` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 114 | `constraint discovery_candidate_tools_candidate_pricing_hint_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 115 | `check (` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 119 | `constraint discovery_candidate_tools_platform_hints_count_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 120 | `check (coalesce(array_length(candidate_platform_hints, 1), 0) <= 12),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 121 | `constraint discovery_candidate_tools_social_links_count_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 122 | `check (coalesce(array_length(candidate_social_links, 1), 0) <= 12),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 123 | `constraint discovery_candidate_tools_app_links_count_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 124 | `check (coalesce(array_length(candidate_app_links, 1), 0) <= 12),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 126 | `constraint discovery_candidate_tools_evidence_summary_length_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 127 | `check (evidence_summary is null or char_length(evidence_summary) <= 1000),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 128 | `constraint discovery_candidate_tools_confidence_bucket_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 129 | `check (confidence_bucket is null or confidence_bucket in ('low', 'medium', 'high')),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 130 | `constraint discovery_candidate_tools_risk_flags_count_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 131 | `check (coalesce(array_length(risk_flags, 1), 0) <= 16),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 133 | `constraint discovery_candidate_tools_duplicate_check_status_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 134 | `check (duplicate_check_status in ('not_checked', 'pending', 'suspected', 'blocked', 'cleared')),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 135 | `constraint discovery_candidate_tools_duplicate_signal_types_count_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 136 | `check (coalesce(array_length(duplicate_signal_types, 1), 0) <= 16),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 138 | `constraint discovery_candidate_tools_candidate_status_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 139 | `check (candidate_status in ('staged', 'needs_review', 'duplicate_suspected', 'rejected', 'archived')),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 140 | `constraint discovery_candidate_tools_no_approval_status_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 141 | `check (lower(candidate_status) not in ('approved', 'published', 'promoted', 'live', 'public')),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 142 | `constraint discovery_candidate_tools_review_notes_length_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 143 | `check (review_notes is null or char_length(review_notes) <= 1000),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 144 | `constraint discovery_candidate_tools_rejection_reason_code_length_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 145 | `check (rejection_reason_code is null or char_length(rejection_reason_code) between 1 and 80),` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 147 | `constraint discovery_candidate_tools_cleanup_status_check` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 148 | `check (cleanup_status in ('active', 'cleanup_eligible', 'archived'))` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 154 | `create index if not exists discovery_candidate_tools_candidate_status_idx` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 155 | `on public.discovery_candidate_tools (candidate_status);` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 161 | `on public.discovery_candidate_tools (candidate_status, created_at desc);` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 172 | `create index if not exists discovery_candidate_tools_duplicate_check_status_idx` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 173 | `on public.discovery_candidate_tools (duplicate_check_status);` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 180 | `where candidate_status in ('staged', 'needs_review', 'duplicate_suspected');` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 200 | `with check (false);` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 217 | `comment on column public.discovery_candidate_tools.candidate_status is` |

## Audit Action Evidence Line Snapshot

| File | Line | Evidence |
| --- | ---: | --- |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 41 | `source_type text not null check (source_type in ('rss', 'api', 'scraper', 'manual', 'webhook')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 54 | `status text not null check (status in ('pending', 'running', 'completed', 'failed')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 80 | `status text not null default 'new' check (status in ('new', 'pending_review', 'approved', 'rejected', 'ignored', 'duplicate')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 101 | `-- Stores structured metadata extracted during discovery.` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 127 | `candidate_type text not null check (candidate_type in ('tool', 'submission', 'discovered_tool')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 132 | `match_type text not null check (match_type in ('canonical_url', 'normalized_domain', 'slug', 'exact_name', 'fuzzy_name')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 139 | `constraint discovery_duplicate_candidates_id_check check (` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 148 | `create table if not exists public.discovery_audit_events (` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 151 | `action text not null check (action in ('approve', 'reject', 'flag', 'ignore', 'batch-action', 'mark-duplicate')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 155 | `metadata jsonb not null default '{}'::jsonb,` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 181 | `create index if not exists discovery_audit_events_tool_id_idx on public.discovery_audit_events (discovered_tool_id);` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 213 | `alter table public.discovery_audit_events enable row level security;` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 221 | `revoke all on public.discovery_audit_events from anon, authenticated;` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 226 | `on public.discovery_sources for all using (false) with check (false);` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 230 | `on public.discovery_runs for all using (false) with check (false);` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 234 | `on public.discovered_tools for all using (false) with check (false);` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 238 | `on public.discovery_evidence for all using (false) with check (false);` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 242 | `on public.discovery_duplicate_candidates for all using (false) with check (false);` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 244 | `drop policy if exists "Deny all access to discovery_audit_events" on public.discovery_audit_events;` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 245 | `create policy "Deny all access to discovery_audit_events"` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 246 | `on public.discovery_audit_events for all using (false) with check (false);` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 252 | `comment on table public.discovery_evidence is 'Extracted metadata and storage paths for crawler artifacts.';` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 254 | `comment on table public.discovery_audit_events is 'History of admin triage actions within the Discovery Engine.';` |

## Migration Draft Gate

Phase 19H may draft a migration only if Gemini approves this final strategy.

Migration draft strategy:

```text
Add new candidate_status CHECK constraint.
Add nullable decision metadata columns.
Add decision_action CHECK constraint.
Add decision_notes length CHECK constraint.
Add duplicate foreign keys.
Handle discovery_audit_events.action, not event_type.
Add/allow candidate_decision action if needed.
Do not publish to public.tools.
Do not create UI decision buttons yet.
Do not run live mutation smoke.
```

## Required Verification for Future Migration Draft

Future Phase 19H should verify:

```text
No existing candidate_status CHECK constraint is being dropped.
No guessed constraint name is used.
No event_type column is assumed.
Any action CHECK change is safe and explicit.
Migration file is draft-only.
No supabase db push is run.
No migration apply is run.
No type generation is run unless separately approved.
```

## Preserved Boundaries

Phase 19G preserves all Phase 19A/19B/19C/19D/19E/19F boundaries:

```text
Approve for draft does not publish.
public.tools write remains forbidden until a separate publish workflow phase is approved.
No future decision implementation may run live database mutations without separate explicit approval.
No UI decision buttons before mutation API safety is designed, implemented, and tested.
Do not implement a mutation that can fail because candidate_status constraints were guessed.
```

Future live mutation approval phrase remains:

```text
Approve Phase 19 live candidate decision mutation smoke
```

Normal phase approval must not imply live mutation approval.

## Candidate Staging Queue Boundary

Phase 19G does not change existing Candidate Staging Queue implementation.

Candidate Staging Queue milestone status remains:

```text
Read-only API/UI/detail/cursor pagination milestone closed for created_at and updated_at.
confidence_bucket cursor continuation remains deferred unless separately approved.
```

## Phase 19G Boundary Confirmation

Phase 19G is documentation-only and strategy-only.

Phase 19G does not:

- implement code
- modify tests
- modify API routes
- modify backend helpers
- modify UI components
- modify Supabase migrations
- modify package files
- create migration files
- apply migrations
- run type generation
- run browser QA
- run live database queries
- run database mutations
- create candidate rows
- update candidate rows
- create source rows
- create run rows
- write to `public.tools`
- write to `discovered_tools`
- approve candidates
- publish candidates
- promote candidates
- reject candidates
- archive candidates
- mark duplicates
- trigger crawler execution
- trigger candidate extraction execution

## Recommended Next Phase

Recommended next phase:

```text
Phase 19H — Candidate Staging Queue Decision Schema Expansion Migration Draft
```

Suggested Phase 19H scope:

```text
Draft the Supabase migration file only.
Add the new candidate_status CHECK constraint.
Add nullable decision metadata columns.
Add decision_action CHECK constraint.
Add decision_notes length CHECK constraint.
Add duplicate foreign keys.
Handle discovery_audit_events.action, not event_type.
Do not apply the migration.
Do not run supabase db push.
Do not run type generation.
Do not run live DB queries.
Do not run live DB mutations.
```

## Gemini Review Questions

Gemini should review:

```text
Does Phase 19G correctly reconcile candidate_status as unconstrained text?
Is adding a new named candidate_status CHECK constraint the correct migration strategy?
Does Phase 19G correctly reject event_type and use discovery_audit_events.action?
Should the future migration add candidate_decision to the action CHECK constraint?
Is metadata JSONB the right place for decision-specific audit details?
Are the proposed decision metadata columns and constraints safe?
Are the duplicate foreign keys safe to add in the first migration draft?
Is Phase 19H safe as a migration-draft-only next phase?
```

## Conclusion

Phase 19G finalizes the migration strategy from actual SQL evidence.

Final strategy:

```text
candidate_status: add a new named CHECK constraint.
audit events: use action, not event_type.
decision metadata: add nullable columns and bounded constraints.
duplicate links: add foreign keys.
migration draft: allowed next only after Gemini approval.
```

Phase 19G is ready for Gemini review before commit.
