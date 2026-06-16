-- Patch approval RPC after public-safe tools cutover.
-- Ensures approved submissions create tools with explicit canonical slug/status
-- now that public.tools.slug is required.

create or replace function public.approve_submitted_tool(submission_id bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  submission public.submitted_tools%rowtype;
  inserted_tool_id bigint;
  tool_slug text;
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

  tool_slug := public.aifinder_tool_slug(submission.name);

  if tool_slug is null or btrim(tool_slug) = '' then
    raise exception 'Submission name cannot produce a public tool slug: %', submission_id;
  end if;

  if exists (
    select 1
    from public.tools
    where tools.normalized_domain = submission.normalized_domain
      and tools.deleted_at is null
  ) then
    raise exception 'A live tool with this website/domain already exists: %', submission.normalized_domain;
  end if;

  if exists (
    select 1
    from public.tools
    where tools.slug = tool_slug
      and tools.deleted_at is null
  ) then
    raise exception 'A live tool with this slug already exists: %', tool_slug;
  end if;

  perform set_config(
    'aifinder.approving_submission_id',
    submission_id::text,
    true
  );

  insert into public.tools (
    name,
    slug,
    status,
    deleted_at,
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
    tool_slug,
    'approved',
    null,
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

revoke all on function public.approve_submitted_tool(bigint) from public;
revoke all on function public.approve_submitted_tool(bigint) from anon;
revoke all on function public.approve_submitted_tool(bigint) from authenticated;
grant execute on function public.approve_submitted_tool(bigint) to service_role;
