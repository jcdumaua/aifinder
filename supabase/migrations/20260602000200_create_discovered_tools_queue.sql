-- Create an admin-only queue for automatically discovered AI tool candidates.
--
-- This table is intentionally separate from public.tools and
-- public.submitted_tools. Discovery candidates must be reviewed by an admin
-- before they can become live tools.
--
-- Rollback SQL:
--   drop trigger if exists discovered_tools_set_updated_at on public.discovered_tools;
--   drop function if exists public.set_discovered_tools_updated_at();
--   drop table if exists public.discovered_tools;

create table if not exists public.discovered_tools (
  id bigint generated always as identity primary key,
  name text not null,
  website text not null,
  normalized_domain text generated always as (
    public.normalize_tool_domain(website)
  ) stored,
  source text not null,
  category text,
  description text,
  status text not null default 'pending',
  discovered_at timestamptz not null default now(),
  reviewed_at timestamptz,
  duplicate_of_tool_id bigint references public.tools(id) on delete set null,
  duplicate_of_submission_id bigint references public.submitted_tools(id) on delete set null,
  confidence_score numeric(4, 3),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint discovered_tools_status_check
    check (
      status in (
        'pending',
        'approved',
        'rejected',
        'duplicate',
        'needs_review'
      )
    ),
  constraint discovered_tools_confidence_score_check
    check (
      confidence_score is null
      or (
        confidence_score >= 0
        and confidence_score <= 1
      )
    )
);

alter table public.discovered_tools enable row level security;

create index if not exists discovered_tools_status_idx
on public.discovered_tools (status);

create index if not exists discovered_tools_normalized_domain_idx
on public.discovered_tools (normalized_domain);

create index if not exists discovered_tools_discovered_at_idx
on public.discovered_tools (discovered_at desc);

create unique index if not exists discovered_tools_active_normalized_domain_unique
on public.discovered_tools (normalized_domain)
where normalized_domain is not null
  and status in ('pending', 'needs_review');

create or replace function public.set_discovered_tools_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists discovered_tools_set_updated_at
on public.discovered_tools;

create trigger discovered_tools_set_updated_at
before update on public.discovered_tools
for each row
execute function public.set_discovered_tools_updated_at();
