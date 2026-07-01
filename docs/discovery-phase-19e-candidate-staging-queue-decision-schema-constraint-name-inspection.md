# Discovery Phase 19E — Candidate Staging Queue Decision Schema Constraint Name Inspection

## Status

Phase 19E is a docs-only / local-inspection-only constraint name inspection phase.

Current pushed baseline:

```text
e3340ff Document candidate decision schema expansion design
```

Phase 19E follows Gemini's Phase 19D recommendation:

```text
Constraint-name inspection must happen first.
```

Phase 19E does not implement code.

Phase 19E does not modify tests, API routes, backend helpers, UI components, migrations, package files, or source files.

Phase 19E does not create a migration file.

Phase 19E does not draft migration SQL beyond inspection notes.

Phase 19E does not apply a migration.

Phase 19E does not run type generation.

Phase 19E does not run browser QA.

Phase 19E does not run live database queries.

Phase 19E does not run database mutations.

## Discovery Engine Progress Snapshot

Progress after Phase 19E constraint name inspection:

```text
Discovery Engine overall: ~89.5%
Phase 19E progress: 100%
Current milestone: Candidate Staging Queue decision schema constraint name inspection complete
```

## Gemini Changes Requested Patch

Gemini requested changes before commit.

Patch decision:

```text
Blocked: Manual/local exact constraint confirmation required before migration drafting.
```

Reason:

```text
The automated extracted candidate_status identifier `discovery_candidate_tools_` is unsafe and rejected.
It appears incomplete or artifact-like and must not be used in ALTER TABLE ... DROP CONSTRAINT SQL.
```

Required correction:

```text
Phase 19E must not claim readiness to draft migration SQL until exact candidate_status and audit event_type definitions are manually confirmed from local migration files.
Manually confirm exact local SQL identifiers first.
Phase 19E must not claim readiness to draft migration SQL until exact candidate_status and audit event_type definitions are manually confirmed from local migration files.
```

Candidate status exact identifier candidates from stricter local inspection:

```text
discovery_candidate_tools_source_url_length_check
```

Audit event_type exact identifier candidates from stricter local inspection:

```text
None safely confirmed
```

Manual inspection target files should include any migration that creates or alters:

```text
public.discovery_candidate_tools
public.discovery_audit_events
candidate_status
event_type
```

Gemini-required next phase:

```text
Phase 19F — Candidate Staging Queue Decision Schema Manual Constraint Confirmation
```

That phase should paste exact SQL lines from the local migration files into the document before any migration draft is created.

## Manual Local SQL Evidence Snapshot After Patch

Candidate status related local migration evidence:

| File | Line | Evidence |
| --- | ---: | --- |
| `supabase/migrations/20260602000200_create_discovered_tools_queue.sql` | 31 | `constraint discovered_tools_status_check` |
| `supabase/migrations/20260602000200_create_discovered_tools_queue.sql` | 32 | `check (` |
| `supabase/migrations/20260602000200_create_discovered_tools_queue.sql` | 41 | `constraint discovered_tools_confidence_score_check` |
| `supabase/migrations/20260602000200_create_discovered_tools_queue.sql` | 42 | `check (` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 11 | `status text not null check (status in ('draft', 'preview', 'published', 'archived')),` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 12 | `version integer not null check (version > 0),` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 17 | `pre_publish_checklist jsonb not null default '[]'::jsonb,` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 44 | `action text not null check (` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 74 | `create table if not exists public.homepage_control_checklist_runs (` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 77 | `checklist jsonb not null default '[]'::jsonb,` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 84 | `create index if not exists homepage_control_checklist_runs_config_id_idx` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 85 | `on public.homepage_control_checklist_runs (config_id);` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 87 | `create index if not exists homepage_control_checklist_runs_created_at_idx` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 88 | `on public.homepage_control_checklist_runs (created_at desc);` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 90 | `create index if not exists homepage_control_checklist_runs_completed_at_idx` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 91 | `on public.homepage_control_checklist_runs (completed_at desc);` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 116 | `alter table public.homepage_control_checklist_runs enable row level security;` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 120 | `revoke all on public.homepage_control_checklist_runs from anon;` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 142 | `drop trigger if exists set_homepage_control_checklist_runs_updated_at` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 143 | `on public.homepage_control_checklist_runs;` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 145 | `create trigger set_homepage_control_checklist_runs_updated_at` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 146 | `before update on public.homepage_control_checklist_runs` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 169 | `with check (false);` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 185 | `with check (false);` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 187 | `drop policy if exists "Admin can read homepage control checklist runs"` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 188 | `on public.homepage_control_checklist_runs;` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 190 | `create policy "Admin can read homepage control checklist runs"` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 191 | `on public.homepage_control_checklist_runs` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 195 | `drop policy if exists "Admin can write homepage control checklist runs"` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 196 | `on public.homepage_control_checklist_runs;` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 198 | `create policy "Admin can write homepage control checklist runs"` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 199 | `on public.homepage_control_checklist_runs` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 202 | `with check (false);` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 211 | `-- Future publish logic must validate public-safe tools, checklist completion, workflow state, audit` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 7 | `-- - Require preview status, completed required checklist items, and a preview audit event.` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 67 | `if v_target.pre_publish_checklist is null` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 68 | `or jsonb_typeof(v_target.pre_publish_checklist) <> 'array' then` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 69 | `raise exception 'Homepage Control Room config % has invalid pre-publish checklist JSON.', p_config_id;` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 78 | `from jsonb_array_elements(v_target.pre_publish_checklist) as checklist_item(item)` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 79 | `where checklist_item.item ->> 'required' = 'true'` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 80 | `and coalesce(checklist_item.item ->> 'completed', 'false') <> 'true'` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 82 | `raise exception 'Homepage Control Room config % has incomplete required checklist items.', p_config_id;` |
| `supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql` | 9 | `drop constraint if exists homepage_control_audit_events_action_check;` |
| `supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql` | 12 | `add constraint homepage_control_audit_events_action_check` |
| `supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql` | 13 | `check (` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 1 | `-- Add updated preview checklist support for Homepage Control Room.` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 8 | `-- - Track preview-only checklist updates in homepage_control_checklist_runs.` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 9 | `-- - Allow audit action = 'updated-preview-checklist'.` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 10 | `-- - Make publish require a completed preview checklist run instead of relying on` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 11 | `--   draft-time checklist state.` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 18 | `create unique index if not exists homepage_control_checklist_runs_config_id_unique_idx` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 19 | `on public.homepage_control_checklist_runs (config_id);` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 22 | `drop constraint if exists homepage_control_audit_events_action_check;` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 25 | `add constraint homepage_control_audit_events_action_check` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 26 | `check (` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 35 | `'updated-preview-checklist'` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 53 | `v_checklist_run public.homepage_control_checklist_runs%rowtype;` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 91 | `if v_target.pre_publish_checklist is null` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 92 | `or jsonb_typeof(v_target.pre_publish_checklist) <> 'array' then` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 93 | `raise exception 'Homepage Control Room config % has invalid pre-publish checklist JSON.', p_config_id;` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 101 | `into v_checklist_run` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 102 | `from public.homepage_control_checklist_runs` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 107 | `raise exception 'Homepage Control Room config % must have a completed preview checklist before publish.', p_config_id;` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 110 | `if v_checklist_run.checklist is null` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 111 | `or jsonb_typeof(v_checklist_run.checklist) <> 'array' then` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 112 | `raise exception 'Homepage Control Room config % has invalid preview checklist JSON.', p_config_id;` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 115 | `if v_checklist_run.completed_at is null then` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 116 | `raise exception 'Homepage Control Room config % preview checklist is not complete.', p_config_id;` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 121 | `from jsonb_array_elements(v_checklist_run.checklist) as checklist_item(item)` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 122 | `where checklist_item.item ->> 'required' = 'true'` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 123 | `and coalesce(checklist_item.item ->> 'completed', 'false') <> 'true'` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 125 | `raise exception 'Homepage Control Room config % has incomplete required preview checklist items.', p_config_id;` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 173 | `'checklistRunId', v_checklist_run.id` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 118 | `drop constraint if exists tools_slug_non_empty_check;` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 121 | `add constraint tools_slug_non_empty_check` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 122 | `check (btrim(slug) <> '');` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 125 | `drop constraint if exists tools_status_check;` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 128 | `add constraint tools_status_check` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 129 | `check (status in ('approved', 'draft', 'archived'));` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 227 | `--     alter table public.tools drop constraint if exists tools_status_check;` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 228 | `--     alter table public.tools drop constraint if exists tools_slug_non_empty_check;` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 41 | `source_type text not null check (source_type in ('rss', 'api', 'scraper', 'manual', 'webhook')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 54 | `status text not null check (status in ('pending', 'running', 'completed', 'failed')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 80 | `status text not null default 'new' check (status in ('new', 'pending_review', 'approved', 'rejected', 'ignored', 'duplicate')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 127 | `candidate_type text not null check (candidate_type in ('tool', 'submission', 'discovered_tool')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 132 | `match_type text not null check (match_type in ('canonical_url', 'normalized_domain', 'slug', 'exact_name', 'fuzzy_name')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 139 | `constraint discovery_duplicate_candidates_id_check check (` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 151 | `action text not null check (action in ('approve', 'reject', 'flag', 'ignore', 'batch-action', 'mark-duplicate')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 226 | `on public.discovery_sources for all using (false) with check (false);` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 230 | `on public.discovery_runs for all using (false) with check (false);` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 234 | `on public.discovered_tools for all using (false) with check (false);` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 238 | `on public.discovery_evidence for all using (false) with check (false);` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 242 | `on public.discovery_duplicate_candidates for all using (false) with check (false);` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 246 | `on public.discovery_audit_events for all using (false) with check (false);` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 5 | `create table if not exists public.discovery_candidate_tools (` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 36 | `duplicate_check_status text not null default 'not_checked',` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 41 | `possible_duplicate_candidate_id uuid references public.discovery_candidate_tools(id) on delete set null,` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 42 | `duplicate_checked_at timestamptz,` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 44 | `candidate_status text not null default 'staged',` |
| `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` | 59 | `constraint discovery_candidate_tools_source_url_length_check` |
| _truncated_ |  | additional evidence omitted |

Audit event_type related local migration evidence:

| File | Line | Evidence |
| --- | ---: | --- |
| `supabase/migrations/20260602000200_create_discovered_tools_queue.sql` | 31 | `constraint discovered_tools_status_check` |
| `supabase/migrations/20260602000200_create_discovered_tools_queue.sql` | 32 | `check (` |
| `supabase/migrations/20260602000200_create_discovered_tools_queue.sql` | 41 | `constraint discovered_tools_confidence_score_check` |
| `supabase/migrations/20260602000200_create_discovered_tools_queue.sql` | 42 | `check (` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 11 | `status text not null check (status in ('draft', 'preview', 'published', 'archived')),` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 12 | `version integer not null check (version > 0),` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 17 | `pre_publish_checklist jsonb not null default '[]'::jsonb,` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 44 | `action text not null check (` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 74 | `create table if not exists public.homepage_control_checklist_runs (` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 77 | `checklist jsonb not null default '[]'::jsonb,` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 84 | `create index if not exists homepage_control_checklist_runs_config_id_idx` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 85 | `on public.homepage_control_checklist_runs (config_id);` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 87 | `create index if not exists homepage_control_checklist_runs_created_at_idx` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 88 | `on public.homepage_control_checklist_runs (created_at desc);` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 90 | `create index if not exists homepage_control_checklist_runs_completed_at_idx` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 91 | `on public.homepage_control_checklist_runs (completed_at desc);` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 116 | `alter table public.homepage_control_checklist_runs enable row level security;` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 120 | `revoke all on public.homepage_control_checklist_runs from anon;` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 142 | `drop trigger if exists set_homepage_control_checklist_runs_updated_at` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 143 | `on public.homepage_control_checklist_runs;` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 145 | `create trigger set_homepage_control_checklist_runs_updated_at` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 146 | `before update on public.homepage_control_checklist_runs` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 169 | `with check (false);` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 185 | `with check (false);` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 187 | `drop policy if exists "Admin can read homepage control checklist runs"` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 188 | `on public.homepage_control_checklist_runs;` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 190 | `create policy "Admin can read homepage control checklist runs"` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 191 | `on public.homepage_control_checklist_runs` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 195 | `drop policy if exists "Admin can write homepage control checklist runs"` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 196 | `on public.homepage_control_checklist_runs;` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 198 | `create policy "Admin can write homepage control checklist runs"` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 199 | `on public.homepage_control_checklist_runs` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 202 | `with check (false);` |
| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 211 | `-- Future publish logic must validate public-safe tools, checklist completion, workflow state, audit` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 7 | `-- - Require preview status, completed required checklist items, and a preview audit event.` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 67 | `if v_target.pre_publish_checklist is null` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 68 | `or jsonb_typeof(v_target.pre_publish_checklist) <> 'array' then` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 69 | `raise exception 'Homepage Control Room config % has invalid pre-publish checklist JSON.', p_config_id;` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 78 | `from jsonb_array_elements(v_target.pre_publish_checklist) as checklist_item(item)` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 79 | `where checklist_item.item ->> 'required' = 'true'` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 80 | `and coalesce(checklist_item.item ->> 'completed', 'false') <> 'true'` |
| `supabase/migrations/20260612000300_publish_homepage_control_config.sql` | 82 | `raise exception 'Homepage Control Room config % has incomplete required checklist items.', p_config_id;` |
| `supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql` | 9 | `drop constraint if exists homepage_control_audit_events_action_check;` |
| `supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql` | 12 | `add constraint homepage_control_audit_events_action_check` |
| `supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql` | 13 | `check (` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 1 | `-- Add updated preview checklist support for Homepage Control Room.` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 8 | `-- - Track preview-only checklist updates in homepage_control_checklist_runs.` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 9 | `-- - Allow audit action = 'updated-preview-checklist'.` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 10 | `-- - Make publish require a completed preview checklist run instead of relying on` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 11 | `--   draft-time checklist state.` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 18 | `create unique index if not exists homepage_control_checklist_runs_config_id_unique_idx` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 19 | `on public.homepage_control_checklist_runs (config_id);` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 22 | `drop constraint if exists homepage_control_audit_events_action_check;` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 25 | `add constraint homepage_control_audit_events_action_check` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 26 | `check (` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 35 | `'updated-preview-checklist'` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 53 | `v_checklist_run public.homepage_control_checklist_runs%rowtype;` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 91 | `if v_target.pre_publish_checklist is null` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 92 | `or jsonb_typeof(v_target.pre_publish_checklist) <> 'array' then` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 93 | `raise exception 'Homepage Control Room config % has invalid pre-publish checklist JSON.', p_config_id;` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 101 | `into v_checklist_run` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 102 | `from public.homepage_control_checklist_runs` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 107 | `raise exception 'Homepage Control Room config % must have a completed preview checklist before publish.', p_config_id;` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 110 | `if v_checklist_run.checklist is null` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 111 | `or jsonb_typeof(v_checklist_run.checklist) <> 'array' then` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 112 | `raise exception 'Homepage Control Room config % has invalid preview checklist JSON.', p_config_id;` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 115 | `if v_checklist_run.completed_at is null then` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 116 | `raise exception 'Homepage Control Room config % preview checklist is not complete.', p_config_id;` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 121 | `from jsonb_array_elements(v_checklist_run.checklist) as checklist_item(item)` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 122 | `where checklist_item.item ->> 'required' = 'true'` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 123 | `and coalesce(checklist_item.item ->> 'completed', 'false') <> 'true'` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 125 | `raise exception 'Homepage Control Room config % has incomplete required preview checklist items.', p_config_id;` |
| `supabase/migrations/20260615001110_updated-preview-checklist.sql` | 173 | `'checklistRunId', v_checklist_run.id` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 118 | `drop constraint if exists tools_slug_non_empty_check;` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 121 | `add constraint tools_slug_non_empty_check` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 122 | `check (btrim(slug) <> '');` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 125 | `drop constraint if exists tools_status_check;` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 128 | `add constraint tools_status_check` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 129 | `check (status in ('approved', 'draft', 'archived'));` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 227 | `--     alter table public.tools drop constraint if exists tools_status_check;` |
| `supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql` | 228 | `--     alter table public.tools drop constraint if exists tools_slug_non_empty_check;` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 41 | `source_type text not null check (source_type in ('rss', 'api', 'scraper', 'manual', 'webhook')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 54 | `status text not null check (status in ('pending', 'running', 'completed', 'failed')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 80 | `status text not null default 'new' check (status in ('new', 'pending_review', 'approved', 'rejected', 'ignored', 'duplicate')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 127 | `candidate_type text not null check (candidate_type in ('tool', 'submission', 'discovered_tool')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 132 | `match_type text not null check (match_type in ('canonical_url', 'normalized_domain', 'slug', 'exact_name', 'fuzzy_name')),` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 139 | `constraint discovery_duplicate_candidates_id_check check (` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 148 | `create table if not exists public.discovery_audit_events (` |
| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 151 | `action text not null check (action in ('approve', 'reject', 'flag', 'ignore', 'batch-action', 'mark-duplicate')),` |
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
| _truncated_ |  | additional evidence omitted |


## Preserved Boundary Normalization After Gemini Patch

The Phase 19E patch explicitly preserves the decision-workflow boundaries:

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

Candidate Staging Queue milestone status remains:

```text
Read-only API/UI/detail/cursor pagination milestone closed for created_at and updated_at.
confidence_bucket cursor continuation remains deferred unless separately approved.
```


## Purpose

Phase 19D designed the schema expansion required to unblock Candidate Staging Queue decision workflow implementation.

Gemini then confirmed that exact constraint/type identifiers must be inspected before drafting safe migration SQL.

Phase 19E answers:

```text
What local schema representation and exact identifiers can be confirmed for candidate_status and discovery_audit_events.event_type?
```

## Inspection Method

Phase 19E inspected local files only.

Inspected roots:

```text
supabase
lib
types
```

Primary local source:

```text
supabase/migrations
```

No live database was queried.

No database mutation was performed.

No migration was drafted.

No migration was applied.

## Candidate Status Representation

Local inference:

```text
CHECK constraint or constrained text
```

Confirmed local candidate_status identifiers:

```text
discovery_candidate_tools_
```

Planned values from the decision workflow:

```text
staged
under_review
approved_for_draft
rejected
archived
duplicate
needs_more_evidence
```

New values required by Phase 19D:

```text
under_review
approved_for_draft
needs_more_evidence
```

Candidate status migration implication:

```text
If candidate_status is CHECK-constrained text, Phase 19F should draft a migration that drops/recreates the exact candidate_status CHECK constraint.
If candidate_status is a Postgres enum, Phase 19F should draft a migration that adds missing enum values with ALTER TYPE.
If representation remains unconfirmed, Phase 19F must not draft SQL until manual confirmation is completed.
```

## Audit Event Type Representation

Local inference:

```text
Not confirmed from local SQL
```

Confirmed local event_type identifiers:

```text
None confirmed
```

Planned decision audit event names:

```text
discovery_candidate_decision_approve_for_draft
discovery_candidate_decision_reject
discovery_candidate_decision_archive
discovery_candidate_decision_duplicate
discovery_candidate_decision_needs_more_evidence
```

Audit event migration implication:

```text
If discovery_audit_events.event_type is CHECK-constrained text or enum-backed, Phase 19F should include event_type expansion in the same migration draft.
If event_type is plain text, Phase 19F should not add unnecessary event_type schema constraints.
If event_type representation remains unconfirmed, Phase 19F must document the uncertainty and avoid guessing.
```

## Decision Action Constraint Recommendation

Gemini Phase 19D recommendation:

```text
decision_action should be constrained at the database level.
decision_reason should remain TEXT and be validated in application code.
duplicate_of_candidate_id and duplicate_of_tool_id should have foreign keys in the first migration draft.
audit event_type handling should be part of the same migration if constrained.
```

Phase 19E preserves these recommendations for Phase 19F.

Planned decision actions:

```text
approve_for_draft
reject
archive
duplicate
needs_more_evidence
```

## Inspection Result

Recommendation:

```text
Blocked: Manual/local exact constraint confirmation required before migration drafting.
```

Phase 19E is patched after Gemini changes requested and ready for re-review before commit.


## Phase 19E Boundary Confirmation Normalization

Phase 19E is documentation-only and local-inspection-only.

Phase 19E does not:

- implement code
- modify tests
- modify API routes
- modify backend helpers
- modify UI components
- modify Supabase migrations
- modify package files
- create migration files
- draft migration SQL for application
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

