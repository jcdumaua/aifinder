-- Add updated preview checklist support for Homepage Control Room.
--
-- REVIEW REQUIRED BEFORE EXECUTION.
-- Do not apply automatically. This migration is intended for James/Gemini review
-- before manual Supabase execution.
--
-- Purpose:
-- - Track preview-only checklist updates in homepage_control_checklist_runs.
-- - Allow audit action = 'updated-preview-checklist'.
-- - Make publish require a completed preview checklist run instead of relying on
--   draft-time checklist state.
--
-- Safety:
-- - No anon/authenticated grants are added.
-- - Existing deny-by-default RLS policies remain unchanged.
-- - The publish RPC stays restricted to service_role.

create unique index if not exists homepage_control_checklist_runs_config_id_unique_idx
  on public.homepage_control_checklist_runs (config_id);

alter table public.homepage_control_audit_events
  drop constraint if exists homepage_control_audit_events_action_check;

alter table public.homepage_control_audit_events
  add constraint homepage_control_audit_events_action_check
  check (
    action in (
      'created-draft',
      'updated-draft',
      'previewed',
      'published',
      'reverted',
      'validation-failed',
      'transitioned-to-preview',
      'updated-preview-checklist'
    )
  );

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
  v_checklist_run public.homepage_control_checklist_runs%rowtype;
  v_actor_label text := btrim(coalesce(p_actor_label, ''));
  v_published_at timestamptz := now();
begin
  if v_actor_label = '' then
    raise exception 'Homepage Control Room publish requires an actor label.';
  end if;

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

  select *
    into v_checklist_run
  from public.homepage_control_checklist_runs
  where config_id = p_config_id
  for update;

  if not found then
    raise exception 'Homepage Control Room config % must have a completed preview checklist before publish.', p_config_id;
  end if;

  if v_checklist_run.checklist is null
    or jsonb_typeof(v_checklist_run.checklist) <> 'array' then
    raise exception 'Homepage Control Room config % has invalid preview checklist JSON.', p_config_id;
  end if;

  if v_checklist_run.completed_at is null then
    raise exception 'Homepage Control Room config % preview checklist is not complete.', p_config_id;
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_checklist_run.checklist) as checklist_item(item)
    where checklist_item.item ->> 'required' = 'true'
      and coalesce(checklist_item.item ->> 'completed', 'false') <> 'true'
  ) then
    raise exception 'Homepage Control Room config % has incomplete required preview checklist items.', p_config_id;
  end if;

  if not exists (
    select 1
    from public.homepage_control_audit_events audit_event
    where audit_event.config_id = p_config_id
      and audit_event.action = 'previewed'
  ) then
    raise exception 'Homepage Control Room config % must be previewed before publish.', p_config_id;
  end if;

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
      'version', v_target.version,
      'checklistRunId', v_checklist_run.id
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
