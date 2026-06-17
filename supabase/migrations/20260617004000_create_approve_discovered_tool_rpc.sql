-- Phase 3D: Approve discovered tools into public.tools.
-- This RPC keeps promotion atomic:
-- - lock discovered tool row
-- - validate required public tool fields
-- - block duplicate live tool domains/slugs
-- - block approval when a pending public submission already uses the same domain
-- - insert into public.tools
-- - mark discovered tool approved and store approved_tool_id
-- - write discovery audit event

create or replace function public.approve_discovered_tool(
  p_discovered_tool_id uuid,
  p_actor_id uuid default null,
  p_actor_label text default 'AiFinder Admin'
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate public.discovered_tools%rowtype;
  inserted_tool_id bigint;
  tool_slug text;
  candidate_domain text;
  safe_actor_label text;
begin
  select *
  into candidate
  from public.discovered_tools
  where id = p_discovered_tool_id
  for update;

  if not found then
    raise exception 'Discovered tool not found: %', p_discovered_tool_id;
  end if;

  if candidate.status = 'approved' and candidate.approved_tool_id is not null then
    return candidate.approved_tool_id;
  end if;

  if candidate.status = 'approved' and candidate.approved_tool_id is null then
    raise exception 'Discovered tool is approved but missing approved_tool_id: %',
      p_discovered_tool_id;
  end if;

  if candidate.status not in ('new', 'pending_review') then
    raise exception 'Discovered tool must be new or pending_review before approval. Current status: %',
      candidate.status;
  end if;

  if candidate.name is null or btrim(candidate.name) = '' then
    raise exception 'Discovered tool name is required: %', p_discovered_tool_id;
  end if;

  if candidate.description is null or btrim(candidate.description) = '' then
    raise exception 'Discovered tool description is required: %', p_discovered_tool_id;
  end if;

  if candidate.website is null or btrim(candidate.website) = '' then
    raise exception 'Discovered tool website is required: %', p_discovered_tool_id;
  end if;

  if candidate.category is null or btrim(candidate.category) = '' then
    raise exception 'Discovered tool category is required: %', p_discovered_tool_id;
  end if;

  candidate_domain := public.normalize_tool_domain(candidate.website);

  if candidate_domain is null then
    raise exception 'Discovered tool website cannot be normalized: %',
      p_discovered_tool_id;
  end if;

  tool_slug := public.aifinder_tool_slug(candidate.name);

  if tool_slug is null or btrim(tool_slug) = '' then
    raise exception 'Discovered tool name cannot produce a public tool slug: %',
      p_discovered_tool_id;
  end if;

  if exists (
    select 1
    from public.tools
    where tools.normalized_domain = candidate_domain
      and tools.deleted_at is null
  ) then
    raise exception 'A live tool with this website/domain already exists: %',
      candidate_domain;
  end if;

  if exists (
    select 1
    from public.tools
    where tools.slug = tool_slug
      and tools.deleted_at is null
  ) then
    raise exception 'A live tool with this slug already exists: %',
      tool_slug;
  end if;

  if exists (
    select 1
    from public.submitted_tools
    where submitted_tools.status = 'pending'
      and submitted_tools.normalized_domain = candidate_domain
  ) then
    raise exception 'A pending submission with this website/domain already exists: %',
      candidate_domain;
  end if;

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
    candidate.name,
    tool_slug,
    'approved',
    null,
    candidate.category,
    candidate.description,
    candidate.website,
    coalesce(nullif(candidate.pricing, ''), 'Free + Paid'),
    candidate.logo_url,
    coalesce(candidate.platforms, array[]::text[]),
    false,
    'General use',
    array[]::text[]
  )
  returning id into inserted_tool_id;

  update public.discovered_tools
  set
    status = 'approved',
    approved_tool_id = inserted_tool_id,
    rejected_reason = null,
    updated_at = now()
  where id = p_discovered_tool_id;

  safe_actor_label := coalesce(nullif(btrim(p_actor_label), ''), 'AiFinder Admin');

  insert into public.discovery_audit_events (
    discovered_tool_id,
    action,
    actor_id,
    actor_label,
    message,
    metadata
  )
  values (
    p_discovered_tool_id,
    'approve',
    p_actor_id,
    safe_actor_label,
    'Approved discovered tool into live tools.',
    jsonb_build_object(
      'approved_tool_id', inserted_tool_id,
      'previous_status', candidate.status,
      'slug', tool_slug,
      'normalized_domain', candidate_domain
    )
  );

  return inserted_tool_id;
end;
$$;

revoke all on function public.approve_discovered_tool(uuid, uuid, text) from public;
revoke all on function public.approve_discovered_tool(uuid, uuid, text) from anon;
revoke all on function public.approve_discovered_tool(uuid, uuid, text) from authenticated;
grant execute on function public.approve_discovered_tool(uuid, uuid, text) to service_role;
