-- Phase 9L — Candidate staging schema and audit expansion draft.
-- Draft only: do not apply without Gemini review and explicit user approval.
-- This migration adds source accountability to staged candidates and expands
-- candidate-staging audit action compatibility. It does not add audit writes,
-- RLS policy changes, public grants, public-safe views, API/UI behavior,
-- extraction behavior, crawler automation, LLM behavior, approval, publishing,
-- promotion, ranking, or recommendation behavior.

-- 1. Source accountability for staged candidates.
-- The column is nullable first for a safe staged rollout. Future helper mapping
-- should write this value for new staged candidates after generated types are
-- refreshed and reviewed.

alter table public.discovery_candidate_tools
  add column if not exists discovery_source_id uuid null;

comment on column public.discovery_candidate_tools.discovery_source_id
  is 'Source row that produced or supplied the candidate evidence for staging.';

alter table public.discovery_candidate_tools
  add constraint discovery_candidate_tools_discovery_source_id_fkey
  foreign key (discovery_source_id)
  references public.discovery_sources(id)
  on delete restrict;

create index if not exists discovery_candidate_tools_discovery_source_id_idx
  on public.discovery_candidate_tools (discovery_source_id);

create index if not exists discovery_candidate_tools_run_source_idx
  on public.discovery_candidate_tools (discovery_run_id, discovery_source_id);

-- 2. Candidate staging audit action compatibility.
-- Preserve existing Discovery Engine audit actions and add candidate-staging
-- action values before any future audit writes are implemented.

alter table public.discovery_audit_events
  drop constraint if exists discovery_audit_events_action_check;

alter table public.discovery_audit_events
  add constraint discovery_audit_events_action_check
  check (
    action in (
      'approve',
      'reject',
      'flag',
      'ignore',
      'batch-action',
      'mark-duplicate',
      'candidate-staged',
      'candidate-stage-failed',
      'candidate-duplicate-hint-recorded',
      'candidate-cleanup-performed'
    )
  );
