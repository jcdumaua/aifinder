-- Add complete database-level duplicate protection for tool website domains.
--
-- Important approval note:
-- Direct inserts into public.tools are blocked when the domain matches a
-- pending submission. Approvals should use public.approve_submitted_tool(),
-- which marks the transaction with the approved submission id, inserts the
-- live tool, and marks the submission approved atomically.

create or replace function public.normalize_tool_domain(website_value text)
returns text
language sql
immutable
as $$
  select nullif(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(lower(btrim(coalesce(website_value, ''))), '^https?://', ''),
          '^[^/@]+@',
          ''
        ),
        '[/\?#].*$',
        ''
      ),
      '^www\.',
      ''
    ),
    ''
  );
$$;

do $$
declare
  duplicate_tools text;
  duplicate_pending_submissions text;
  pending_submission_tool_conflicts text;
begin
  select string_agg(format('%s => tools ids [%s]', normalized_domain, ids), '; ')
  into duplicate_tools
  from (
    select
      public.normalize_tool_domain(website) as normalized_domain,
      string_agg(id::text, ', ' order by id) as ids
    from public.tools
    where public.normalize_tool_domain(website) is not null
    group by public.normalize_tool_domain(website)
    having count(*) > 1
  ) duplicates;

  if duplicate_tools is not null then
    raise exception 'Cannot add tools normalized-domain unique index. Resolve duplicate live tools first: %', duplicate_tools;
  end if;

  select string_agg(format('%s => submission ids [%s]', normalized_domain, ids), '; ')
  into duplicate_pending_submissions
  from (
    select
      public.normalize_tool_domain(website) as normalized_domain,
      string_agg(id::text, ', ' order by id) as ids
    from public.submitted_tools
    where status = 'pending'
      and public.normalize_tool_domain(website) is not null
    group by public.normalize_tool_domain(website)
    having count(*) > 1
  ) duplicates;

  if duplicate_pending_submissions is not null then
    raise exception 'Cannot add pending-submission normalized-domain unique index. Resolve duplicate pending submissions first: %', duplicate_pending_submissions;
  end if;

  select string_agg(
    format(
      '%s => pending submission ids [%s] conflict with live tool ids [%s]',
      normalized_domain,
      submission_ids,
      tool_ids
    ),
    '; '
  )
  into pending_submission_tool_conflicts
  from (
    select
      public.normalize_tool_domain(submitted_tools.website) as normalized_domain,
      string_agg(distinct submitted_tools.id::text, ', ' order by submitted_tools.id::text) as submission_ids,
      string_agg(distinct tools.id::text, ', ' order by tools.id::text) as tool_ids
    from public.submitted_tools
    join public.tools
      on public.normalize_tool_domain(tools.website) =
        public.normalize_tool_domain(submitted_tools.website)
    where submitted_tools.status = 'pending'
      and public.normalize_tool_domain(submitted_tools.website) is not null
    group by public.normalize_tool_domain(submitted_tools.website)
  ) conflicts;

  if pending_submission_tool_conflicts is not null then
    raise exception 'Cannot add cross-table normalized-domain guards. Resolve pending submissions that duplicate live tools first: %', pending_submission_tool_conflicts;
  end if;
end $$;

alter table public.tools
add column if not exists normalized_domain text
generated always as (public.normalize_tool_domain(website)) stored;

alter table public.submitted_tools
add column if not exists normalized_domain text
generated always as (public.normalize_tool_domain(website)) stored;

create unique index if not exists tools_normalized_domain_unique
on public.tools (normalized_domain)
where normalized_domain is not null;

create unique index if not exists submitted_tools_pending_normalized_domain_unique
on public.submitted_tools (normalized_domain)
where normalized_domain is not null
  and status = 'pending';

create or replace function public.is_current_approved_submission(
  submission_id bigint,
  domain_value text
)
returns boolean
language plpgsql
stable
as $$
declare
  approved_submission_id text;
begin
  approved_submission_id := nullif(
    current_setting('aifinder.approving_submission_id', true),
    ''
  );

  return approved_submission_id is not null
    and approved_submission_id = submission_id::text
    and exists (
      select 1
      from public.submitted_tools
      where submitted_tools.id = submission_id
        and submitted_tools.status = 'pending'
        and submitted_tools.normalized_domain = domain_value
    );
end;
$$;

create or replace function public.reject_pending_submission_live_tool_duplicate()
returns trigger
language plpgsql
as $$
declare
  new_normalized_domain text;
begin
  new_normalized_domain := public.normalize_tool_domain(new.website);

  if new.status = 'pending'
    and new_normalized_domain is not null
    and exists (
      select 1
      from public.tools
      where tools.normalized_domain = new_normalized_domain
    )
  then
    raise exception 'Pending submission duplicates an existing live tool domain: %', new_normalized_domain;
  end if;

  return new;
end;
$$;

create or replace function public.reject_live_tool_pending_submission_duplicate()
returns trigger
language plpgsql
as $$
declare
  new_normalized_domain text;
  approval_submission_id bigint;
begin
  new_normalized_domain := public.normalize_tool_domain(new.website);

  if new_normalized_domain is null then
    return new;
  end if;

  begin
    approval_submission_id := nullif(
      current_setting('aifinder.approving_submission_id', true),
      ''
    )::bigint;
  exception
    when invalid_text_representation then
      approval_submission_id := null;
  end;

  if approval_submission_id is not null
    and public.is_current_approved_submission(
      approval_submission_id,
      new_normalized_domain
    )
  then
    return new;
  end if;

  if exists (
    select 1
    from public.submitted_tools
    where submitted_tools.status = 'pending'
      and submitted_tools.normalized_domain = new_normalized_domain
  )
  then
    raise exception 'Live tool duplicates a pending submission domain: %', new_normalized_domain;
  end if;

  return new;
end;
$$;

drop trigger if exists submitted_tools_reject_live_tool_duplicate
on public.submitted_tools;

create trigger submitted_tools_reject_live_tool_duplicate
before insert or update of website, status
on public.submitted_tools
for each row
execute function public.reject_pending_submission_live_tool_duplicate();

drop trigger if exists tools_reject_pending_submission_duplicate
on public.tools;

create trigger tools_reject_pending_submission_duplicate
before insert or update of website
on public.tools
for each row
execute function public.reject_live_tool_pending_submission_duplicate();

create or replace function public.approve_submitted_tool(submission_id bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  submission public.submitted_tools%rowtype;
  inserted_tool_id bigint;
begin
  select *
  into submission
  from public.submitted_tools
  where id = submission_id
    and status = 'pending'
  for update;

  if not found then
    raise exception 'Pending submission not found: %', submission_id;
  end if;

  if submission.normalized_domain is null then
    raise exception 'Submission website cannot be normalized: %', submission_id;
  end if;

  if exists (
    select 1
    from public.tools
    where tools.normalized_domain = submission.normalized_domain
  ) then
    raise exception 'A live tool with this website/domain already exists: %', submission.normalized_domain;
  end if;

  perform set_config(
    'aifinder.approving_submission_id',
    submission_id::text,
    true
  );

  insert into public.tools (
    name,
    category,
    description,
    website,
    pricing,
    logo_url,
    platforms,
    featured,
    best_for,
    use_cases
  )
  values (
    submission.name,
    submission.category,
    submission.description,
    submission.website,
    coalesce(nullif(submission.pricing, ''), 'Free + Paid'),
    submission.logo_url,
    array[]::text[],
    false,
    'General use',
    array[]::text[]
  )
  returning id into inserted_tool_id;

  update public.submitted_tools
  set status = 'approved'
  where id = submission_id
    and status = 'pending';

  return inserted_tool_id;
end;
$$;
