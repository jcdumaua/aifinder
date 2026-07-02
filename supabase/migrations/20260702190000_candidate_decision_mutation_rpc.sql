-- Discovery Phase 19O — Candidate Decision Mutation RPC Draft
--
-- Draft only.
-- Do not apply this migration until a separate migration review/apply gate approves it.
--
-- Purpose:
-- Create public.admin_apply_discovery_candidate_decision(...) so a candidate decision
-- update and its candidate_decision audit event are committed atomically.
--
-- Boundaries:
-- - No public tool table writes.
-- - No discovered tool table writes.
-- - No publish workflow.
-- - duplicate_of_tool_id is accepted as a parameter for future compatibility but
--   rejected by this first draft until separately approved.
-- - Route/UI implementation remains out of scope.

create or replace function public.admin_apply_discovery_candidate_decision(
  p_candidate_id uuid,
  p_action text,
  p_reason text,
  p_notes text default null,
  p_duplicate_of_candidate_id uuid default null,
  p_duplicate_of_tool_id bigint default null,
  p_actor_label text default null,
  p_request_correlation_id text default null
)
returns table (
  id uuid,
  candidate_status text,
  decision_action text,
  decision_reason text,
  decision_notes text,
  decided_at timestamptz,
  decided_by text,
  duplicate_of_candidate_id uuid,
  duplicate_of_tool_id bigint
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_candidate public.discovery_candidate_tools%rowtype;
  v_updated public.discovery_candidate_tools%rowtype;
  v_action text;
  v_next_status text;
  v_reason text;
  v_notes text;
  v_actor text;
  v_message text;
begin
  v_action := btrim(coalesce(p_action, ''));
  v_reason := btrim(coalesce(p_reason, ''));
  v_actor := nullif(btrim(coalesce(p_actor_label, '')), '');

  if v_actor is null then
    v_actor := 'admin';
  end if;

  if v_action not in (
    'approve_for_draft',
    'reject',
    'duplicate',
    'needs_more_evidence',
    'archive'
  ) then
    raise exception 'invalid_action'
      using errcode = '22023';
  end if;

  if length(v_reason) < 3 or length(v_reason) > 200 then
    raise exception 'invalid_reason'
      using errcode = '22023';
  end if;

  if p_notes is null or btrim(p_notes) = '' then
    v_notes := null;
  else
    v_notes := btrim(p_notes);

    if length(v_notes) > 1000 then
      raise exception 'invalid_notes'
        using errcode = '22023';
    end if;
  end if;

  if p_duplicate_of_tool_id is not null then
    raise exception 'invalid_duplicate_target'
      using errcode = '22023';
  end if;

  case v_action
    when 'approve_for_draft' then
      v_next_status := 'approved_for_draft';
      v_message := 'Candidate approved for draft.';
    when 'reject' then
      v_next_status := 'rejected';
      v_message := 'Candidate rejected.';
    when 'duplicate' then
      v_next_status := 'duplicate';
      v_message := 'Candidate marked as duplicate.';
    when 'needs_more_evidence' then
      v_next_status := 'needs_more_evidence';
      v_message := 'Candidate marked as needing more evidence.';
    when 'archive' then
      v_next_status := 'archived';
      v_message := 'Candidate archived.';
    else
      raise exception 'invalid_action'
        using errcode = '22023';
  end case;

  select *
  into v_candidate
  from public.discovery_candidate_tools as candidate
  where candidate.id = p_candidate_id
  for update;

  if not found then
    raise exception 'candidate_not_found'
      using errcode = 'P0002';
  end if;

  if v_candidate.candidate_status not in (
    'staged',
    'under_review',
    'needs_more_evidence'
  ) then
    raise exception 'decision_conflict'
      using errcode = 'P0001';
  end if;

  if v_action = 'duplicate' then
    if p_duplicate_of_candidate_id is null then
      raise exception 'invalid_duplicate_target'
        using errcode = '22023';
    end if;

    if p_duplicate_of_candidate_id = p_candidate_id then
      raise exception 'invalid_duplicate_target'
        using errcode = '22023';
    end if;

    perform 1
    from public.discovery_candidate_tools as duplicate_target
    where duplicate_target.id = p_duplicate_of_candidate_id;

    if not found then
      raise exception 'invalid_duplicate_target'
        using errcode = '22023';
    end if;
  else
    if p_duplicate_of_candidate_id is not null then
      raise exception 'invalid_duplicate_target'
        using errcode = '22023';
    end if;
  end if;

  update public.discovery_candidate_tools as candidate
  set
    candidate_status = v_next_status,
    decision_action = v_action,
    decision_reason = v_reason,
    decision_notes = v_notes,
    decided_at = now(),
    decided_by = v_actor,
    duplicate_of_candidate_id = case
      when v_action = 'duplicate' then p_duplicate_of_candidate_id
      else null
    end,
    duplicate_of_tool_id = null,
    updated_at = now()
  where candidate.id = p_candidate_id
    and candidate.candidate_status in (
      'staged',
      'under_review',
      'needs_more_evidence'
    )
  returning candidate.*
  into v_updated;

  if not found then
    raise exception 'decision_conflict'
      using errcode = 'P0001';
  end if;

  insert into public.discovery_audit_events (
    action,
    actor_label,
    message,
    metadata
  )
  values (
    'candidate_decision',
    v_actor,
    v_message,
    jsonb_build_object(
      'candidate_id', v_updated.id,
      'action', v_action,
      'previous_candidate_status', v_candidate.candidate_status,
      'next_candidate_status', v_updated.candidate_status,
      'decision_reason', v_reason,
      'has_decision_notes', v_notes is not null,
      'duplicate_of_candidate_id', v_updated.duplicate_of_candidate_id,
      'duplicate_of_tool_id', v_updated.duplicate_of_tool_id,
      'request_correlation_id', p_request_correlation_id
    )
  );

  return query
  select
    v_updated.id,
    v_updated.candidate_status,
    v_updated.decision_action,
    v_updated.decision_reason,
    v_updated.decision_notes,
    v_updated.decided_at,
    v_updated.decided_by,
    v_updated.duplicate_of_candidate_id,
    v_updated.duplicate_of_tool_id;
end;
$$;

revoke all on function public.admin_apply_discovery_candidate_decision(
  uuid,
  text,
  text,
  text,
  uuid,
  bigint,
  text,
  text
) from public;

revoke all on function public.admin_apply_discovery_candidate_decision(
  uuid,
  text,
  text,
  text,
  uuid,
  bigint,
  text,
  text
) from anon;

revoke all on function public.admin_apply_discovery_candidate_decision(
  uuid,
  text,
  text,
  text,
  uuid,
  bigint,
  text,
  text
) from authenticated;

grant execute on function public.admin_apply_discovery_candidate_decision(
  uuid,
  text,
  text,
  text,
  uuid,
  bigint,
  text,
  text
) to service_role;

comment on function public.admin_apply_discovery_candidate_decision(
  uuid,
  text,
  text,
  text,
  uuid,
  bigint,
  text,
  text
) is
'Applies an admin candidate decision atomically with a candidate_decision audit event. Drafted in Discovery Phase 19O; not applied until separately approved.';
