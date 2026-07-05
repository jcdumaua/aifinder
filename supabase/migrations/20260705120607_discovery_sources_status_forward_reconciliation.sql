-- Discovery Engine Phase 25BE
-- Forward-only draft migration for public.discovery_sources.status reconciliation.
--
-- Boundary:
-- - Draft only.
-- - Do not apply from this phase.
-- - Do not edit historical migrations.
-- - Do not run Supabase CLI from this phase.
-- - Do not generate types from this phase.
--
-- Rationale:
-- Phase 25AY/25AZ metadata inspection found public.discovery_sources but did not find
-- public.discovery_sources.status through the approved metadata path.
-- Phase 25BC selected migration_reconciliation_planning.
-- Phase 25BD selected a forward-only reviewed migration draft.

begin;

alter table if exists public.discovery_sources
  add column if not exists status text;

alter table if exists public.discovery_sources
  drop constraint if exists discovery_sources_status_check;

alter table if exists public.discovery_sources
  add constraint discovery_sources_status_check
  check (
    status is null
    or status in ('active', 'inactive', 'paused', 'blocked')
  );

comment on column public.discovery_sources.status is
  'Discovery source lifecycle status. Drafted in Phase 25BE as forward-only reconciliation for the Discovery Engine status-count contract.';

commit;
