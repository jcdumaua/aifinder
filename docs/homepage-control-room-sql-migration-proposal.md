# Homepage Control Room SQL Migration Proposal

## Purpose

This document proposes the future SQL migration for AiFinder’s Homepage Control Room.

This is documentation only.

Do not run this SQL, create tables, create policies, change Supabase, add API routes, or connect the public homepage until this proposal is reviewed and approved.

## Migration Goals

The future SQL should support:

- Versioned homepage control configs
- Draft, preview, and published states
- Only one active published config
- Public-safe homepage reads
- Admin-only writes
- Protected audit events
- Protected checklist runs
- Tool UUID/ID references for featured placements
- App-layer hydration of tool IDs
- Rollback/revert support
- Future cache/revalidation support

## Proposed Tables

The migration should eventually create:

1. `homepage_control_configs`
2. `homepage_control_audit_events`
3. `homepage_control_checklist_runs`
4. `public_homepage_control_config` view

## 1. `homepage_control_configs`

### Proposed SQL Shape

```sql
create table public.homepage_control_configs (
  id uuid primary key default gen_random_uuid(),

  status text not null check (status in ('draft', 'preview', 'published')),

  version integer not null,
  is_active_published boolean not null default false,

  content_config jsonb not null default '{}'::jsonb,
  layout_config jsonb not null default '{}'::jsonb,
  tool_placements jsonb not null default '[]'::jsonb,
  starter_chips jsonb not null default '[]'::jsonb,

  validation_errors jsonb not null default '[]'::jsonb,
  validation_warnings jsonb not null default '[]'::jsonb,

  created_by uuid null,
  created_by_label text null,

  published_by uuid null,
  published_by_label text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz null,

  reverted_from_config_id uuid null references public.homepage_control_configs(id)
);
```

### Required Constraint

Only one config may be active published:

```sql
create unique index homepage_control_one_active_published
on public.homepage_control_configs (is_active_published)
where is_active_published = true;
```

### Required Indexes

```sql
create index homepage_control_configs_status_idx
on public.homepage_control_configs (status);

create index homepage_control_configs_published_idx
on public.homepage_control_configs (is_active_published, published_at desc);

create index homepage_control_configs_created_at_idx
on public.homepage_control_configs (created_at desc);
```

## 2. `homepage_control_audit_events`

### Proposed SQL Shape

```sql
create table public.homepage_control_audit_events (
  id uuid primary key default gen_random_uuid(),

  config_id uuid null references public.homepage_control_configs(id),

  action text not null check (
    action in (
      'created-draft',
      'updated-draft',
      'previewed',
      'published',
      'reverted',
      'validation-failed'
    )
  ),

  message text not null,

  actor_id uuid null,
  actor_label text null,

  validation_errors jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now()
);
```

### Required Indexes

```sql
create index homepage_control_audit_config_id_idx
on public.homepage_control_audit_events (config_id);

create index homepage_control_audit_action_idx
on public.homepage_control_audit_events (action);

create index homepage_control_audit_created_at_idx
on public.homepage_control_audit_events (created_at desc);

create index homepage_control_audit_actor_id_idx
on public.homepage_control_audit_events (actor_id);
```

## 3. `homepage_control_checklist_runs`

### Proposed SQL Shape

```sql
create table public.homepage_control_checklist_runs (
  id uuid primary key default gen_random_uuid(),

  config_id uuid not null references public.homepage_control_configs(id),

  checklist_items jsonb not null default '{}'::jsonb,
  all_required_complete boolean not null default false,

  completed_by uuid null,
  completed_by_label text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Required Checklist Items

The JSONB checklist snapshot should include:

- Content validation
- Layout validation
- Tool placement validation
- Workflow validation
- Audit event readiness
- Double-S Safety Check
- Discovery Search Quality QA
- Desktop QA
- Tablet/iPad QA
- Mobile QA
- Accessibility/readability QA

### Required Indexes

```sql
create index homepage_control_checklist_config_id_idx
on public.homepage_control_checklist_runs (config_id);

create index homepage_control_checklist_complete_idx
on public.homepage_control_checklist_runs (all_required_complete);

create index homepage_control_checklist_created_at_idx
on public.homepage_control_checklist_runs (created_at desc);
```

## 4. Public-Safe View

The public homepage should not read base tables directly.

The future public-safe view should only expose the active published homepage config.

### Proposed SQL Shape

```sql
create view public.public_homepage_control_config as
select
  id,
  version,
  content_config,
  layout_config,
  tool_placements,
  starter_chips,
  published_at
from public.homepage_control_configs
where status = 'published'
  and is_active_published = true
limit 1;
```

## Public View Safety Rules

The public-safe view must not expose:

- Drafts
- Previews
- Audit events
- Checklist runs
- Validation errors
- Validation warnings
- Created-by fields
- Published-by fields
- Admin notes
- Actor IDs
- Secrets
- Tokens
- Environment values

## Tool Placement Strategy

`tool_placements` should store Tool UUID/ID references only.

The public view should not resolve Tool IDs into full tool objects.

The app layer should hydrate:

Tool ID → current tool record → current slug/name/logo/category/rating/pricing

This keeps homepage tool data current if a tool is renamed, re-rated, archived, or updated.

Before publishing, validation must check that featured Tool UUID/ID references still point to valid, public-safe, non-deleted tools.

## RLS Proposal

### Base Tables

The base Control Room tables should have RLS enabled:

```sql
alter table public.homepage_control_configs enable row level security;
alter table public.homepage_control_audit_events enable row level security;
alter table public.homepage_control_checklist_runs enable row level security;
```

### Public Access

Public anonymous users should not read base tables.

The anonymous role should only be allowed to select from the public-safe view if the final Supabase permissions model supports that safely.

### Admin Access

Admin reads/writes should happen through protected Admin API routes that verify:

- Authenticated Admin session
- CSRF protection
- Server-side validation
- Safe workflow transition
- Audit event creation where required

Do not rely on frontend checks only.

## Publish Transaction Requirements

The eventual publish operation should be atomic.

A protected server-side publish flow should:

1. Validate the selected preview config.
2. Validate content/layout/tool placements/starter chips.
3. Confirm checklist completion.
4. Confirm Double-S Safety Check.
5. Confirm Discovery Search Quality QA.
6. Create audit event.
7. Deactivate current active published config.
8. Activate the selected published config.
9. Set `published_by`, `published_by_label`, and `published_at`.
10. Trigger cache/revalidation after the database write succeeds.

## Rollback/Revert Requirements

The eventual revert operation should:

1. Select a previous validated published config.
2. Revalidate it.
3. Create an audit event.
4. Deactivate the current active published config.
5. Activate the restored config or restored copy.
6. Trigger cache/revalidation.
7. Fall back to safe defaults if validation fails.

## Retention Proposal

Recommended future retention direction:

- Published versions: keep last 10 published versions at minimum.
- Audit events: treat as permanent unless a future approved retention policy says otherwise.
- Abandoned drafts: may be pruned after 30 days only after a future approved policy.
- Checklist runs: keep enough history to prove publish readiness.

## Open Questions Before Real Migration

Before SQL is actually run, decide:

- Should `created_by` / `published_by` reference an Admin profiles table now or later?
- Should public view access be direct from anon role or only through a server-side fetch?
- Should publish/revert be implemented as SQL RPC functions or protected Next.js API routes?
- Should `updated_at` be maintained by trigger or application logic?
- Should `version` be a sequence, timestamp, or calculated number?
- Should reverted configs be activated directly or copied into a new row?
- Should validation errors be stored permanently or only for failed attempts?
- Should abandoned draft pruning be manual or scheduled later?

## Recommended Next Step

1. James reviews this SQL proposal.
2. Gemini reviews this SQL proposal for security, RLS, scalability, and migration risk.
3. Revise the proposal if needed.
4. Only after approval, create an actual SQL migration draft.
5. Do not apply SQL to Supabase until separately approved.
