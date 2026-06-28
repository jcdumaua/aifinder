-- Phase 14C-C — Preview Artifact Trusted Source URL Migration Draft
-- Draft only: do not apply without Gemini review and explicit user approval.
--
-- Purpose:
-- Add a trusted, server-derived source URL snapshot to candidate preview
-- artifacts so future backend live staging can map a reviewed preview to
-- CandidateExtractionMapperInput.sourceUrl without using candidateWebsiteUrl
-- or any client-supplied value.
--
-- This migration draft does not:
-- - apply schema changes;
-- - regenerate generated types;
-- - modify provider code;
-- - modify API routes;
-- - modify UI;
-- - enable backend live staging;
-- - enable UI live staging;
-- - create preview artifacts;
-- - stage candidates;
-- - write public.tools;
-- - write discovered_tools;
-- - run crawler or LLM execution.
--
-- Design basis:
-- - Phase 14C-A rejected mapping candidate_website_url to source_url.
-- - Phase 14C-B selected the hybrid trusted source URL strategy:
--   store source_url_snapshot on preview artifacts, then validate source/run
--   lineage in the provider.

alter table public.discovery_candidate_preview_artifacts
  add column if not exists source_url_snapshot text;

alter table public.discovery_candidate_preview_artifacts
  alter column preview_schema_version set default 'candidate_preview_artifact.v2';

alter table public.discovery_candidate_preview_artifacts
  drop constraint if exists discovery_candidate_preview_artifacts_schema_version_check;

alter table public.discovery_candidate_preview_artifacts
  add constraint discovery_candidate_preview_artifacts_schema_version_check
  check (
    preview_schema_version in (
      'candidate_preview_artifact.v1',
      'candidate_preview_artifact.v2'
    )
  );

alter table public.discovery_candidate_preview_artifacts
  add constraint discovery_candidate_preview_artifacts_source_url_snapshot_length_check
  check (
    source_url_snapshot is null
    or char_length(source_url_snapshot) between 1 and 2048
  );

alter table public.discovery_candidate_preview_artifacts
  add constraint discovery_candidate_preview_artifacts_source_url_snapshot_https_check
  check (
    source_url_snapshot is null
    or source_url_snapshot ~ '^https://[^[:space:]]+$'
  );

-- Keep existing historical rows from blocking migration application while
-- enforcing the new rule for future inserts/updates. Future provider logic
-- must reject old v1 reviewable artifacts for backend activation.
alter table public.discovery_candidate_preview_artifacts
  add constraint discovery_candidate_preview_artifacts_reviewable_source_url_snapshot_check
  check (
    preview_status <> 'reviewable'
    or source_url_snapshot is not null
  ) not valid;

alter table public.discovery_candidate_preview_artifacts
  drop constraint if exists discovery_candidate_preview_artifacts_safety_flags_allowlist_check;

alter table public.discovery_candidate_preview_artifacts
  add constraint discovery_candidate_preview_artifacts_safety_flags_allowlist_check
  check (
    safety_flags <@ array[
      'bounded_preview',
      'server_sanitized',
      'source_run_matched',
      'no_public_write',
      'no_discovered_write',
      'no_raw_html',
      'no_llm_output',
      'unsafe_url_blocked',
      'stale_schema_blocked',
      'ambiguous_preview_blocked',
      'source_url_snapshot_validated',
      'source_url_snapshot_missing_blocked',
      'source_url_snapshot_unsafe_blocked',
      'source_url_drift_blocked'
    ]::text[]
  );

create index if not exists discovery_candidate_preview_artifacts_source_url_snapshot_idx
  on public.discovery_candidate_preview_artifacts (source_url_snapshot);

comment on column public.discovery_candidate_preview_artifacts.source_url_snapshot is
  'Server-derived HTTPS source URL snapshot captured at preview-generation time. Used by future backend staging as the reviewed source URL, distinct from candidate_website_url and never client supplied.';

comment on constraint discovery_candidate_preview_artifacts_reviewable_source_url_snapshot_check
  on public.discovery_candidate_preview_artifacts is
  'Future reviewable preview artifacts must carry a trusted source URL snapshot. Constraint is initially not valid so historical rows do not block migration application.';
