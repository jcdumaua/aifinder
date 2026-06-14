-- Implement Homepage Control Room publish RPC.
-- REVIEW REQUIRED BEFORE EXECUTION.
--
-- Purpose:
-- - Replace the disabled publish RPC skeleton with an atomic database publish core.
-- - Keep publishing restricted to trusted server-side Admin workflows via service role.
-- - Require preview status, completed required checklist items, and a preview audit event.
--
-- Important safety notes:
-- - Do not expose this RPC to anon/authenticated roles.
-- - SECURITY DEFINER functions are risky; keep search_path pinned and grants locked down.
-- - This migration does not build UI, API routes, or public homepage wiring.
-- - Apply only after James/Gemini review and Supabase-side verification.

drop function if exists public.publish_homepage_control_config(uuid, uuid, text);

create function public.publish_homepage_control_config(
  p_config_id uuid,
  p_actor_id uuid,
  p_actor_label text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_target public.homepage_control_configs%rowtype;
  v_actor_label text := btrim(coalesce(p_actor_label, ''));
  v_published_at timestamptz := now();
begin
  if v_actor_label = '' then
    raise exception 'Homepage Control Room publish requires an actor label.';
  end if;

  -- Serialize publish operations so concurrent publishes cannot leave multiple configs active.
  perform pg_advisory_xact_lock(hashtext('homepage_control_publish'));

  select *
    into v_target
  from public.homepage_control_configs
  where id = p_config_id
  for update;

  if not found then
    raise exception 'Homepage Control Room config % was not found.', p_config_id;
  end if;

  if v_target.status <> 'preview' then
    raise exception 'Homepage Control Room config % must be in preview status before publish. Current status: %.',
      p_config_id,
      v_target.status;
  end if;

  if v_target.config is null or jsonb_typeof(v_target.config) <> 'object' then
    raise exception 'Homepage Control Room config % has invalid config JSON.', p_config_id;
  end if;

  if v_target.content is null or jsonb_typeof(v_target.content) <> 'object' then
    raise exception 'Homepage Control Room config % has invalid content JSON.', p_config_id;
  end if;

  if v_target.tool_placements is null or jsonb_typeof(v_target.tool_placements) <> 'array' then
    raise exception 'Homepage Control Room config % has invalid tool placement JSON.', p_config_id;
  end if;

  if v_target.pre_publish_checklist is null
    or jsonb_typeof(v_target.pre_publish_checklist) <> 'array' then
    raise exception 'Homepage Control Room config % has invalid pre-publish checklist JSON.', p_config_id;
  end if;

  if btrim(coalesce(v_target.content #>> '{hero,title}', '')) = '' then
    raise exception 'Homepage Control Room config % is missing required hero title content.', p_config_id;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_target.pre_publish_checklist) as checklist_item(item)
    where checklist_item.item ->> 'required' = 'true'
      and coalesce(checklist_item.item ->> 'completed', 'false') <> 'true'
  ) then
    raise exception 'Homepage Control Room config % has incomplete required checklist items.', p_config_id;
  end if;

  if not exists (
    select 1
    from public.homepage_control_audit_events audit_event
    where audit_event.config_id = p_config_id
      and audit_event.action = 'previewed'
  ) then
    raise exception 'Homepage Control Room config % must be previewed before publish.', p_config_id;
  end if;

  -- Atomic publish:
  -- First deactivate any currently active config, then activate the reviewed target.
  update public.homepage_control_configs
  set
    is_active = false,
    updated_by = p_actor_id,
    updated_at = v_published_at
  where is_active = true
    and id <> p_config_id;

  update public.homepage_control_configs
  set
    status = 'published',
    is_active = true,
    published_at = v_published_at,
    published_by = p_actor_id,
    updated_by = p_actor_id,
    updated_at = v_published_at
  where id = p_config_id;

  insert into public.homepage_control_audit_events (
    config_id,
    action,
    actor_id,
    actor_label,
    message,
    metadata
  )
  values (
    p_config_id,
    'published',
    p_actor_id,
    v_actor_label,
    'Homepage Control Room config published.',
    jsonb_build_object(
      'source', 'homepage-control-publish-rpc',
      'publishedAt', v_published_at,
      'version', v_target.version
    )
  );

  return jsonb_build_object(
    'success', true,
    'config_id', p_config_id,
    'status', 'published',
    'published_at', v_published_at
  );
end;
$$;

revoke all on function public.publish_homepage_control_config(uuid, uuid, text) from public;
revoke all on function public.publish_homepage_control_config(uuid, uuid, text) from anon;
revoke all on function public.publish_homepage_control_config(uuid, uuid, text) from authenticated;
grant execute on function public.publish_homepage_control_config(uuid, uuid, text) to service_role;
