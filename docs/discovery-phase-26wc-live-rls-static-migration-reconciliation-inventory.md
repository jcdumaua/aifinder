# Phase 26WC — Live RLS Static Migration Reconciliation Inventory

## Bound baseline

`c22a80064ecd33934addec19db381b31dd2a3dd7`

## Scope

Repository-only search of committed Supabase migrations for the 15 relations returned by the live catalog inspection and for RLS/policy declarations.

## Relation-reference hits

```text
supabase/migrations/20260617005500_cleanup_discovery_queue_smoke_test.sql:1:delete from public.discovery_audit_events
supabase/migrations/20260617005500_cleanup_discovery_queue_smoke_test.sql:3:  select id from public.discovered_tools
supabase/migrations/20260617005500_cleanup_discovery_queue_smoke_test.sql:7:delete from public.discovery_duplicate_candidates
supabase/migrations/20260617005500_cleanup_discovery_queue_smoke_test.sql:9:  select id from public.discovered_tools
supabase/migrations/20260617005500_cleanup_discovery_queue_smoke_test.sql:13:delete from public.discovery_evidence
supabase/migrations/20260617005500_cleanup_discovery_queue_smoke_test.sql:15:  select id from public.discovered_tools
supabase/migrations/20260617005500_cleanup_discovery_queue_smoke_test.sql:19:delete from public.discovered_tools
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:20:-- - write public.tools;
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:21:-- - write discovered_tools;
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:30:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:33:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:36:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:37:  drop constraint if exists discovery_candidate_preview_artifacts_schema_version_check;
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:39:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:40:  add constraint discovery_candidate_preview_artifacts_schema_version_check
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:48:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:49:  add constraint discovery_candidate_preview_artifacts_source_url_snapshot_length_check
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:55:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:56:  add constraint discovery_candidate_preview_artifacts_source_url_snapshot_https_check
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:65:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:66:  add constraint discovery_candidate_preview_artifacts_reviewable_source_url_snapshot_check
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:72:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:73:  drop constraint if exists discovery_candidate_preview_artifacts_safety_flags_allowlist_check;
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:75:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:76:  add constraint discovery_candidate_preview_artifacts_safety_flags_allowlist_check
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:96:create index if not exists discovery_candidate_preview_artifacts_source_url_snapshot_idx
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:97:  on public.discovery_candidate_preview_artifacts (source_url_snapshot);
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:99:comment on column public.discovery_candidate_preview_artifacts.source_url_snapshot is
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:102:comment on constraint discovery_candidate_preview_artifacts_reviewable_source_url_snapshot_check
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:103:  on public.discovery_candidate_preview_artifacts is
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:14:alter table public.discovery_candidate_tools
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:17:comment on column public.discovery_candidate_tools.discovery_source_id
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:20:alter table public.discovery_candidate_tools
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:21:  add constraint discovery_candidate_tools_discovery_source_id_fkey
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:23:  references public.discovery_sources(id)
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:26:create index if not exists discovery_candidate_tools_discovery_source_id_idx
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:27:  on public.discovery_candidate_tools (discovery_source_id);
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:29:create index if not exists discovery_candidate_tools_run_source_idx
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:30:  on public.discovery_candidate_tools (discovery_run_id, discovery_source_id);
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:36:alter table public.discovery_audit_events
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:37:  drop constraint if exists discovery_audit_events_action_check;
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:39:alter table public.discovery_audit_events
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:40:  add constraint discovery_audit_events_action_check
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:1:-- Harden discovered_tools access after initial discovery queue migration.
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:12:create or replace function public.set_discovered_tools_updated_at()
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:23:revoke all on table public.discovered_tools from public;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:24:revoke all on table public.discovered_tools from anon;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:25:revoke all on table public.discovered_tools from authenticated;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:27:revoke all on sequence public.discovered_tools_id_seq from public;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:28:revoke all on sequence public.discovered_tools_id_seq from anon;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:29:revoke all on sequence public.discovered_tools_id_seq from authenticated;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:31:revoke all on function public.set_discovered_tools_updated_at() from public;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:32:revoke all on function public.set_discovered_tools_updated_at() from anon;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:33:revoke all on function public.set_discovered_tools_updated_at() from authenticated;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:35:grant all on table public.discovered_tools to service_role;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:36:grant all on sequence public.discovered_tools_id_seq to service_role;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:37:grant execute on function public.set_discovered_tools_updated_at() to service_role;
supabase/migrations/20260612000300_publish_homepage_control_config.sql:28:  v_target public.homepage_control_configs%rowtype;
supabase/migrations/20260612000300_publish_homepage_control_config.sql:41:  from public.homepage_control_configs
supabase/migrations/20260612000300_publish_homepage_control_config.sql:87:    from public.homepage_control_audit_events audit_event
supabase/migrations/20260612000300_publish_homepage_control_config.sql:96:  update public.homepage_control_configs
supabase/migrations/20260612000300_publish_homepage_control_config.sql:104:  update public.homepage_control_configs
supabase/migrations/20260612000300_publish_homepage_control_config.sql:114:  insert into public.homepage_control_audit_events (
supabase/migrations/20260617004500_seed_discovery_queue_smoke_test.sql:1:insert into public.discovered_tools (
supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql:8:alter table public.homepage_control_audit_events
supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql:9:  drop constraint if exists homepage_control_audit_events_action_check;
supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql:11:alter table public.homepage_control_audit_events
supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql:12:  add constraint homepage_control_audit_events_action_check
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:44:  v_candidate public.discovery_candidate_tools%rowtype;
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:45:  v_updated public.discovery_candidate_tools%rowtype;
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:116:  from public.discovery_candidate_tools as candidate
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:146:    from public.discovery_candidate_tools as duplicate_target
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:160:  update public.discovery_candidate_tools as candidate
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:188:  insert into public.discovery_audit_events (
supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql:2:-- Forward-only draft migration for public.discovery_sources.status reconciliation.
supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql:12:-- Phase 25AY/25AZ metadata inspection found public.discovery_sources but did not find
supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql:13:-- public.discovery_sources.status through the approved metadata path.
supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql:19:alter table if exists public.discovery_sources
supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql:22:alter table if exists public.discovery_sources
supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql:23:  drop constraint if exists discovery_sources_status_check;
supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql:25:alter table if exists public.discovery_sources
supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql:26:  add constraint discovery_sources_status_check
supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql:32:comment on column public.discovery_sources.status is
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:4:-- Direct inserts into public.tools are blocked when the domain matches a
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:34:  duplicate_tools text;
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:38:  select string_agg(format('%s => tools ids [%s]', normalized_domain, ids), '; ')
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:39:  into duplicate_tools
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:44:    from public.tools
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:50:  if duplicate_tools is not null then
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:51:    raise exception 'Cannot add tools normalized-domain unique index. Resolve duplicate live tools first: %', duplicate_tools;
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:60:    from public.submitted_tools
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:83:      public.normalize_tool_domain(submitted_tools.website) as normalized_domain,
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:84:      string_agg(distinct submitted_tools.id::text, ', ' order by submitted_tools.id::text) as submission_ids,
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:85:      string_agg(distinct tools.id::text, ', ' order by tools.id::text) as tool_ids
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:86:    from public.submitted_tools
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:87:    join public.tools
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:88:      on public.normalize_tool_domain(tools.website) =
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:89:        public.normalize_tool_domain(submitted_tools.website)
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:90:    where submitted_tools.status = 'pending'
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:91:      and public.normalize_tool_domain(submitted_tools.website) is not null
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:92:    group by public.normalize_tool_domain(submitted_tools.website)
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:96:    raise exception 'Cannot add cross-table normalized-domain guards. Resolve pending submissions that duplicate live tools first: %', pending_submission_tool_conflicts;
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:100:alter table public.tools
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:104:alter table public.submitted_tools
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:108:create unique index if not exists tools_normalized_domain_unique
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:109:on public.tools (normalized_domain)
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:112:create unique index if not exists submitted_tools_pending_normalized_domain_unique
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:113:on public.submitted_tools (normalized_domain)
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:137:      from public.submitted_tools
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:138:      where submitted_tools.id = submission_id
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:139:        and submitted_tools.status = 'pending'
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:140:        and submitted_tools.normalized_domain = domain_value
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:158:      from public.tools
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:159:      where tools.normalized_domain = new_normalized_domain
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:204:    from public.submitted_tools
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:205:    where submitted_tools.status = 'pending'
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:206:      and submitted_tools.normalized_domain = new_normalized_domain
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:216:drop trigger if exists submitted_tools_reject_live_tool_duplicate
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:217:on public.submitted_tools;
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:219:create trigger submitted_tools_reject_live_tool_duplicate
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:221:on public.submitted_tools
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:225:drop trigger if exists tools_reject_pending_submission_duplicate
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:226:on public.tools;
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:228:create trigger tools_reject_pending_submission_duplicate
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:230:on public.tools
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:241:  submission public.submitted_tools%rowtype;
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:246:  from public.submitted_tools
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:261:    from public.tools
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:262:    where tools.normalized_domain = submission.normalized_domain
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:273:  insert into public.tools (
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:299:  update public.submitted_tools
supabase/migrations/20260612000100_create_homepage_control_room.sql:9:create table if not exists public.homepage_control_configs (
supabase/migrations/20260612000100_create_homepage_control_room.sql:29:  on public.homepage_control_configs (is_active)
supabase/migrations/20260612000100_create_homepage_control_room.sql:32:create index if not exists homepage_control_configs_status_idx
supabase/migrations/20260612000100_create_homepage_control_room.sql:33:  on public.homepage_control_configs (status);
supabase/migrations/20260612000100_create_homepage_control_room.sql:35:create index if not exists homepage_control_configs_created_at_idx
supabase/migrations/20260612000100_create_homepage_control_room.sql:36:  on public.homepage_control_configs (created_at desc);
supabase/migrations/20260612000100_create_homepage_control_room.sql:38:create index if not exists homepage_control_configs_published_at_idx
supabase/migrations/20260612000100_create_homepage_control_room.sql:39:  on public.homepage_control_configs (published_at desc);
supabase/migrations/20260612000100_create_homepage_control_room.sql:41:create table if not exists public.homepage_control_audit_events (
supabase/migrations/20260612000100_create_homepage_control_room.sql:43:  config_id uuid references public.homepage_control_configs (id) on delete set null,
supabase/migrations/20260612000100_create_homepage_control_room.sql:65:create index if not exists homepage_control_audit_events_config_id_idx
supabase/migrations/20260612000100_create_homepage_control_room.sql:66:  on public.homepage_control_audit_events (config_id);
supabase/migrations/20260612000100_create_homepage_control_room.sql:68:create index if not exists homepage_control_audit_events_action_idx
supabase/migrations/20260612000100_create_homepage_control_room.sql:69:  on public.homepage_control_audit_events (action);
supabase/migrations/20260612000100_create_homepage_control_room.sql:71:create index if not exists homepage_control_audit_events_created_at_idx
supabase/migrations/20260612000100_create_homepage_control_room.sql:72:  on public.homepage_control_audit_events (created_at desc);
supabase/migrations/20260612000100_create_homepage_control_room.sql:74:create table if not exists public.homepage_control_checklist_runs (
supabase/migrations/20260612000100_create_homepage_control_room.sql:76:  config_id uuid not null references public.homepage_control_configs (id) on delete cascade,
supabase/migrations/20260612000100_create_homepage_control_room.sql:84:create index if not exists homepage_control_checklist_runs_config_id_idx
supabase/migrations/20260612000100_create_homepage_control_room.sql:85:  on public.homepage_control_checklist_runs (config_id);
supabase/migrations/20260612000100_create_homepage_control_room.sql:87:create index if not exists homepage_control_checklist_runs_created_at_idx
supabase/migrations/20260612000100_create_homepage_control_room.sql:88:  on public.homepage_control_checklist_runs (created_at desc);
supabase/migrations/20260612000100_create_homepage_control_room.sql:90:create index if not exists homepage_control_checklist_runs_completed_at_idx
supabase/migrations/20260612000100_create_homepage_control_room.sql:91:  on public.homepage_control_checklist_runs (completed_at desc);
supabase/migrations/20260612000100_create_homepage_control_room.sql:109:from public.homepage_control_configs
supabase/migrations/20260612000100_create_homepage_control_room.sql:114:alter table public.homepage_control_configs enable row level security;
supabase/migrations/20260612000100_create_homepage_control_room.sql:115:alter table public.homepage_control_audit_events enable row level security;
supabase/migrations/20260612000100_create_homepage_control_room.sql:116:alter table public.homepage_control_checklist_runs enable row level security;
supabase/migrations/20260612000100_create_homepage_control_room.sql:118:revoke all on public.homepage_control_configs from anon;
supabase/migrations/20260612000100_create_homepage_control_room.sql:119:revoke all on public.homepage_control_audit_events from anon;
supabase/migrations/20260612000100_create_homepage_control_room.sql:120:revoke all on public.homepage_control_checklist_runs from anon;
supabase/migrations/20260612000100_create_homepage_control_room.sql:134:drop trigger if exists set_homepage_control_configs_updated_at
supabase/migrations/20260612000100_create_homepage_control_room.sql:135:  on public.homepage_control_configs;
supabase/migrations/20260612000100_create_homepage_control_room.sql:137:create trigger set_homepage_control_configs_updated_at
supabase/migrations/20260612000100_create_homepage_control_room.sql:138:before update on public.homepage_control_configs
supabase/migrations/20260612000100_create_homepage_control_room.sql:142:drop trigger if exists set_homepage_control_checklist_runs_updated_at
supabase/migrations/20260612000100_create_homepage_control_room.sql:143:  on public.homepage_control_checklist_runs;
supabase/migrations/20260612000100_create_homepage_control_room.sql:145:create trigger set_homepage_control_checklist_runs_updated_at
supabase/migrations/20260612000100_create_homepage_control_room.sql:146:before update on public.homepage_control_checklist_runs
supabase/migrations/20260612000100_create_homepage_control_room.sql:155:  on public.homepage_control_configs;
supabase/migrations/20260612000100_create_homepage_control_room.sql:158:on public.homepage_control_configs
supabase/migrations/20260612000100_create_homepage_control_room.sql:163:  on public.homepage_control_configs;
supabase/migrations/20260612000100_create_homepage_control_room.sql:166:on public.homepage_control_configs
supabase/migrations/20260612000100_create_homepage_control_room.sql:172:  on public.homepage_control_audit_events;
supabase/migrations/20260612000100_create_homepage_control_room.sql:175:on public.homepage_control_audit_events
supabase/migrations/20260612000100_create_homepage_control_room.sql:180:  on public.homepage_control_audit_events;
supabase/migrations/20260612000100_create_homepage_control_room.sql:183:on public.homepage_control_audit_events
supabase/migrations/20260612000100_create_homepage_control_room.sql:188:  on public.homepage_control_checklist_runs;
supabase/migrations/20260612000100_create_homepage_control_room.sql:191:on public.homepage_control_checklist_runs
supabase/migrations/20260612000100_create_homepage_control_room.sql:196:  on public.homepage_control_checklist_runs;
supabase/migrations/20260612000100_create_homepage_control_room.sql:199:on public.homepage_control_checklist_runs
supabase/migrations/20260612000100_create_homepage_control_room.sql:211:-- Future publish logic must validate public-safe tools, checklist completion, workflow state, audit
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:3:-- This table is intentionally separate from public.tools and
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:4:-- public.submitted_tools. Discovery candidates must be reviewed by an admin
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:5:-- before they can become live tools.
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:8:--   drop trigger if exists discovered_tools_set_updated_at on public.discovered_tools;
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:9:--   drop function if exists public.set_discovered_tools_updated_at();
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:10:--   drop table if exists public.discovered_tools;
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:12:create table if not exists public.discovered_tools (
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:25:  duplicate_of_tool_id bigint references public.tools(id) on delete set null,
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:26:  duplicate_of_submission_id bigint references public.submitted_tools(id) on delete set null,
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:31:  constraint discovered_tools_status_check
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:41:  constraint discovered_tools_confidence_score_check
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:51:alter table public.discovered_tools enable row level security;
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:53:create index if not exists discovered_tools_status_idx
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:54:on public.discovered_tools (status);
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:56:create index if not exists discovered_tools_normalized_domain_idx
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:57:on public.discovered_tools (normalized_domain);
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:59:create index if not exists discovered_tools_discovered_at_idx
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:60:on public.discovered_tools (discovered_at desc);
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:62:create unique index if not exists discovered_tools_active_normalized_domain_unique
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:63:on public.discovered_tools (normalized_domain)
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:67:create or replace function public.set_discovered_tools_updated_at()
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:77:drop trigger if exists discovered_tools_set_updated_at
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:78:on public.discovered_tools;
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:80:create trigger discovered_tools_set_updated_at
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:81:before update on public.discovered_tools
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:83:execute function public.set_discovered_tools_updated_at();
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:1:-- Draft Migration A: public-safe tools schema/view support for Homepage Control Room.
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:9:-- - Add public-safety state to live tools before Homepage Control publish is used.
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:10:-- - Expose public tools through a narrow public-safe view instead of the base table.
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:13:-- - This migration intentionally fails before mutating public.tools if generated
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:16:-- - This migration does not revoke anon select from public.tools. That hardening
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:18:--   public.public_safe_tools and been verified.
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:52:    from public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:59:    raise exception 'Cannot backfill tools.slug. Resolve duplicate generated slugs first: %',
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:65:  from public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:69:    raise exception 'Cannot backfill tools.slug. These tool ids have empty generated slugs: %',
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:74:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:77:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:80:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:83:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:86:update public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:91:update public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:96:-- Existing tools remain active; the newly added deleted_at column is null by
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:99:update public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:102:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:105:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:108:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:111:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:114:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:117:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:118:  drop constraint if exists tools_slug_non_empty_check;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:120:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:121:  add constraint tools_slug_non_empty_check
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:124:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:125:  drop constraint if exists tools_status_check;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:127:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:128:  add constraint tools_status_check
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:131:create unique index if not exists tools_active_slug_unique_idx
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:132:  on public.tools (slug)
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:135:create index if not exists tools_status_idx
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:136:  on public.tools (status);
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:138:create index if not exists tools_deleted_at_idx
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:139:  on public.tools (deleted_at);
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:141:create index if not exists tools_status_deleted_at_slug_idx
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:142:  on public.tools (status, deleted_at, slug);
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:144:create or replace function public.set_tools_updated_at()
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:155:drop trigger if exists tools_set_updated_at
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:156:  on public.tools;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:158:create trigger tools_set_updated_at
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:159:before update on public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:161:execute function public.set_tools_updated_at();
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:163:drop view if exists public.public_safe_tools;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:165:create view public.public_safe_tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:184:from public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:188:alter table public.tools enable row level security;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:190:drop policy if exists "Allow public read access to approved tools"
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:191:  on public.tools;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:194:-- public-safe tools. Migration B should revoke direct base-table anon access
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:195:-- after every public read path has moved to public.public_safe_tools.
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:196:create policy "Allow public read access to approved tools"
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:197:  on public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:203:grant select on public.public_safe_tools to anon;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:207:-- lib/homepage-control-public.ts are switched to public.public_safe_tools and
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:209:-- the base public.tools table. Do not execute that revoke in Migration A.
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:212:-- - If app code has already switched to public.public_safe_tools, first deploy an
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:214:-- - Migration A intentionally does not revoke anon select from public.tools. If
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:218:--     revoke select on public.public_safe_tools from anon;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:219:--     drop view if exists public.public_safe_tools;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:220:--     drop policy if exists "Allow public read access to approved tools" on public.tools;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:221:--     drop trigger if exists tools_set_updated_at on public.tools;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:222:--     drop function if exists public.set_tools_updated_at();
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:223:--     drop index if exists public.tools_status_deleted_at_slug_idx;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:224:--     drop index if exists public.tools_deleted_at_idx;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:225:--     drop index if exists public.tools_status_idx;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:226:--     drop index if exists public.tools_active_slug_unique_idx;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:227:--     alter table public.tools drop constraint if exists tools_status_check;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:228:--     alter table public.tools drop constraint if exists tools_slug_non_empty_check;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:229:--     alter table public.tools drop column if exists deleted_at;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:230:--     alter table public.tools drop column if exists status;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:231:--     alter table public.tools drop column if exists slug;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:232:--     alter table public.tools drop column if exists updated_at;
supabase/migrations/20260615001110_updated-preview-checklist.sql:8:-- - Track preview-only checklist updates in homepage_control_checklist_runs.
supabase/migrations/20260615001110_updated-preview-checklist.sql:18:create unique index if not exists homepage_control_checklist_runs_config_id_unique_idx
supabase/migrations/20260615001110_updated-preview-checklist.sql:19:  on public.homepage_control_checklist_runs (config_id);
supabase/migrations/20260615001110_updated-preview-checklist.sql:21:alter table public.homepage_control_audit_events
supabase/migrations/20260615001110_updated-preview-checklist.sql:22:  drop constraint if exists homepage_control_audit_events_action_check;
supabase/migrations/20260615001110_updated-preview-checklist.sql:24:alter table public.homepage_control_audit_events
supabase/migrations/20260615001110_updated-preview-checklist.sql:25:  add constraint homepage_control_audit_events_action_check
supabase/migrations/20260615001110_updated-preview-checklist.sql:52:  v_target public.homepage_control_configs%rowtype;
supabase/migrations/20260615001110_updated-preview-checklist.sql:53:  v_checklist_run public.homepage_control_checklist_runs%rowtype;
supabase/migrations/20260615001110_updated-preview-checklist.sql:65:  from public.homepage_control_configs
supabase/migrations/20260615001110_updated-preview-checklist.sql:102:  from public.homepage_control_checklist_runs
supabase/migrations/20260615001110_updated-preview-checklist.sql:130:    from public.homepage_control_audit_events audit_event
supabase/migrations/20260615001110_updated-preview-checklist.sql:137:  update public.homepage_control_configs
supabase/migrations/20260615001110_updated-preview-checklist.sql:145:  update public.homepage_control_configs
supabase/migrations/20260615001110_updated-preview-checklist.sql:155:  insert into public.homepage_control_audit_events (
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:17:-- - Do not use discovery_candidate_tools_.
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:18:-- - Do not use discovery_candidate_tools_source_url_length_check.
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:19:-- - Use discovery_audit_events.action as the audit discriminator.
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:21:-- - Store decision details in discovery_audit_events.metadata JSONB.
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:23:-- - public.tools writes remain forbidden until a separate publish workflow phase is approved.
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:27:  IF to_regclass('public.discovery_candidate_tools') IS NULL THEN
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:28:    RAISE EXCEPTION 'public.discovery_candidate_tools table is required before candidate decision schema expansion';
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:31:  IF to_regclass('public.discovery_audit_events') IS NULL THEN
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:32:    RAISE EXCEPTION 'public.discovery_audit_events table is required before candidate decision schema expansion';
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:35:  IF to_regclass('public.tools') IS NULL THEN
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:36:    RAISE EXCEPTION 'public.tools table is required before duplicate_of_tool_id foreign key can be added';
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:40:ALTER TABLE public.discovery_candidate_tools
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:51:  ALTER TABLE public.discovery_candidate_tools
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:52:    DROP CONSTRAINT IF EXISTS discovery_candidate_tools_candidate_status_check;
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:54:  ALTER TABLE public.discovery_candidate_tools
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:55:    ADD CONSTRAINT discovery_candidate_tools_candidate_status_check
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:70:ALTER TABLE public.discovery_candidate_tools
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:71:  VALIDATE CONSTRAINT discovery_candidate_tools_candidate_status_check;
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:78:    WHERE conrelid = 'public.discovery_candidate_tools'::regclass
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:79:      AND conname = 'discovery_candidate_tools_decision_action_check'
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:81:    ALTER TABLE public.discovery_candidate_tools
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:82:      ADD CONSTRAINT discovery_candidate_tools_decision_action_check
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:97:ALTER TABLE public.discovery_candidate_tools
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:98:  VALIDATE CONSTRAINT discovery_candidate_tools_decision_action_check;
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:105:    WHERE conrelid = 'public.discovery_candidate_tools'::regclass
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:106:      AND conname = 'discovery_candidate_tools_decision_notes_length_check'
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:108:    ALTER TABLE public.discovery_candidate_tools
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:109:      ADD CONSTRAINT discovery_candidate_tools_decision_notes_length_check
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:118:ALTER TABLE public.discovery_candidate_tools
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:119:  VALIDATE CONSTRAINT discovery_candidate_tools_decision_notes_length_check;
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:126:    WHERE conrelid = 'public.discovery_candidate_tools'::regclass
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:127:      AND conname = 'discovery_candidate_tools_duplicate_of_candidate_id_fkey'
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:129:    ALTER TABLE public.discovery_candidate_tools
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:130:      ADD CONSTRAINT discovery_candidate_tools_duplicate_of_candidate_id_fkey
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:132:      REFERENCES public.discovery_candidate_tools(id)
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:138:ALTER TABLE public.discovery_candidate_tools
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:139:  VALIDATE CONSTRAINT discovery_candidate_tools_duplicate_of_candidate_id_fkey;
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:146:    WHERE conrelid = 'public.discovery_candidate_tools'::regclass
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:147:      AND conname = 'discovery_candidate_tools_duplicate_of_tool_id_fkey'
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:149:    ALTER TABLE public.discovery_candidate_tools
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:150:      ADD CONSTRAINT discovery_candidate_tools_duplicate_of_tool_id_fkey
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:152:      REFERENCES public.tools(id)
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:158:ALTER TABLE public.discovery_candidate_tools
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:159:  VALIDATE CONSTRAINT discovery_candidate_tools_duplicate_of_tool_id_fkey;
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:163:  ALTER TABLE public.discovery_audit_events
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:164:    DROP CONSTRAINT IF EXISTS discovery_audit_events_action_check;
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:166:  ALTER TABLE public.discovery_audit_events
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:167:    ADD CONSTRAINT discovery_audit_events_action_check
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:182:ALTER TABLE public.discovery_audit_events
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:183:  VALIDATE CONSTRAINT discovery_audit_events_action_check;
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:1:-- Patch approval RPC after public-safe tools cutover.
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:2:-- Ensures approved submissions create tools with explicit canonical slug/status
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:3:-- now that public.tools.slug is required.
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:12:  submission public.submitted_tools%rowtype;
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:18:  from public.submitted_tools
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:39:    from public.tools
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:40:    where tools.normalized_domain = submission.normalized_domain
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:41:      and tools.deleted_at is null
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:48:    from public.tools
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:49:    where tools.slug = tool_slug
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:50:      and tools.deleted_at is null
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:61:  insert into public.tools (
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:93:  update public.submitted_tools
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:7:-- staging, crawler execution, LLM execution, public publishing, public.tools
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:8:-- writes, discovered_tools writes, candidate staging writes, audit writes,
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:11:create table if not exists public.discovery_candidate_preview_artifacts (
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:15:    references public.discovery_sources(id)
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:19:    references public.discovery_runs(id)
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:42:  constraint discovery_candidate_preview_artifacts_schema_version_length_check
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:45:  constraint discovery_candidate_preview_artifacts_schema_version_check
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:48:  constraint discovery_candidate_preview_artifacts_status_check
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:59:  constraint discovery_candidate_preview_artifacts_candidate_name_length_check
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:62:  constraint discovery_candidate_preview_artifacts_candidate_website_url_length_check
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:68:  constraint discovery_candidate_preview_artifacts_candidate_website_url_https_check
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:74:  constraint discovery_candidate_preview_artifacts_category_hint_check
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:94:  constraint discovery_candidate_preview_artifacts_pricing_hint_check
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:100:  constraint discovery_candidate_preview_artifacts_confidence_bucket_check
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:106:  constraint discovery_candidate_preview_artifacts_evidence_summary_length_check
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:109:  constraint discovery_candidate_preview_artifacts_source_evidence_locator_length_check
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:115:  constraint discovery_candidate_preview_artifacts_safety_flags_count_check
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:118:  constraint discovery_candidate_preview_artifacts_safety_flags_allowlist_check
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:134:  constraint discovery_candidate_preview_artifacts_reviewable_required_fields_check
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:146:create index if not exists discovery_candidate_preview_artifacts_run_id_idx
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:147:  on public.discovery_candidate_preview_artifacts (discovery_run_id);
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:149:create index if not exists discovery_candidate_preview_artifacts_source_id_idx
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:150:  on public.discovery_candidate_preview_artifacts (discovery_source_id);
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:152:create index if not exists discovery_candidate_preview_artifacts_run_source_idx
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:153:  on public.discovery_candidate_preview_artifacts (
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:158:create index if not exists discovery_candidate_preview_artifacts_status_idx
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:159:  on public.discovery_candidate_preview_artifacts (preview_status);
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:161:create index if not exists discovery_candidate_preview_artifacts_schema_version_idx
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:162:  on public.discovery_candidate_preview_artifacts (preview_schema_version);
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:164:create index if not exists discovery_candidate_preview_artifacts_audit_correlation_idx
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:165:  on public.discovery_candidate_preview_artifacts (audit_correlation_id);
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:167:create index if not exists discovery_candidate_preview_artifacts_created_at_idx
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:168:  on public.discovery_candidate_preview_artifacts (created_at desc);
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:170:create unique index if not exists discovery_candidate_preview_artifacts_reviewable_run_source_uidx
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:171:  on public.discovery_candidate_preview_artifacts (
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:177:drop trigger if exists set_discovery_candidate_preview_artifacts_updated_at
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:178:  on public.discovery_candidate_preview_artifacts;
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:180:create trigger set_discovery_candidate_preview_artifacts_updated_at
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:181:before update on public.discovery_candidate_preview_artifacts
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:184:alter table public.discovery_candidate_preview_artifacts enable row level security;
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:186:revoke all on public.discovery_candidate_preview_artifacts from anon, authenticated;
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:188:drop policy if exists "Deny all access to discovery_candidate_preview_artifacts"
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:189:  on public.discovery_candidate_preview_artifacts;
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:191:create policy "Deny all access to discovery_candidate_preview_artifacts"
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:192:on public.discovery_candidate_preview_artifacts
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:197:comment on table public.discovery_candidate_preview_artifacts is
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:200:comment on column public.discovery_candidate_preview_artifacts.discovery_source_id is
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:203:comment on column public.discovery_candidate_preview_artifacts.discovery_run_id is
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:206:comment on column public.discovery_candidate_preview_artifacts.audit_correlation_id is
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:209:comment on column public.discovery_candidate_preview_artifacts.preview_schema_version is
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:212:comment on column public.discovery_candidate_preview_artifacts.preview_status is
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:215:comment on column public.discovery_candidate_preview_artifacts.candidate_name is
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:218:comment on column public.discovery_candidate_preview_artifacts.candidate_website_url is
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:221:comment on column public.discovery_candidate_preview_artifacts.evidence_summary is
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:224:comment on column public.discovery_candidate_preview_artifacts.source_evidence_locator is
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:227:comment on column public.discovery_candidate_preview_artifacts.safety_flags is
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:230:comment on column public.discovery_candidate_preview_artifacts.preview_generated_at is
supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql:1:-- Patch migration to finalize the public-safe tools schema logic.
supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql:3:-- This patch is safe to apply if 20260615002000_draft_public_safe_tools_schema.sql is already active.
supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql:31:drop function if exists public.set_tools_updated_at();
supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql:33:drop trigger if exists tools_set_updated_at on public.tools;
supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql:34:create trigger tools_set_updated_at
supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql:35:before update on public.tools
supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql:41:grant select on public.public_safe_tools to anon, authenticated;
supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql:45:-- Note: If this causes a collision, the unique index tools_active_slug_unique_idx
supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql:47:update public.tools
supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql:52:comment on view public.public_safe_tools is 'Public-safe view for tools. Always use this instead of public.tools for client-side reads.';
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:5:create table if not exists public.discovery_candidate_tools (
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:9:    references public.discovery_runs(id)
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:39:  possible_duplicate_tool_id bigint references public.tools(id) on delete set null,
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:40:  possible_duplicate_discovered_tool_id uuid references public.discovered_tools(id) on delete set null,
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:41:  possible_duplicate_candidate_id uuid references public.discovery_candidate_tools(id) on delete set null,
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:59:  constraint discovery_candidate_tools_source_url_length_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:61:  constraint discovery_candidate_tools_source_url_https_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:63:  constraint discovery_candidate_tools_source_url_normalized_length_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:65:  constraint discovery_candidate_tools_source_url_normalized_https_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:67:  constraint discovery_candidate_tools_source_domain_length_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:69:  constraint discovery_candidate_tools_source_evidence_kind_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:71:  constraint discovery_candidate_tools_source_evidence_locator_length_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:74:  constraint discovery_candidate_tools_extraction_mode_length_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:76:  constraint discovery_candidate_tools_extraction_mode_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:78:  constraint discovery_candidate_tools_extraction_version_length_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:81:  constraint discovery_candidate_tools_candidate_name_length_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:83:  constraint discovery_candidate_tools_candidate_website_url_length_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:85:  constraint discovery_candidate_tools_candidate_website_url_https_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:87:  constraint discovery_candidate_tools_candidate_canonical_url_length_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:89:  constraint discovery_candidate_tools_candidate_canonical_url_https_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:91:  constraint discovery_candidate_tools_candidate_normalized_domain_length_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:93:  constraint discovery_candidate_tools_candidate_description_length_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:95:  constraint discovery_candidate_tools_candidate_category_hint_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:114:  constraint discovery_candidate_tools_candidate_pricing_hint_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:119:  constraint discovery_candidate_tools_platform_hints_count_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:121:  constraint discovery_candidate_tools_social_links_count_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:123:  constraint discovery_candidate_tools_app_links_count_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:126:  constraint discovery_candidate_tools_evidence_summary_length_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:128:  constraint discovery_candidate_tools_confidence_bucket_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:130:  constraint discovery_candidate_tools_risk_flags_count_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:133:  constraint discovery_candidate_tools_duplicate_check_status_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:135:  constraint discovery_candidate_tools_duplicate_signal_types_count_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:138:  constraint discovery_candidate_tools_candidate_status_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:140:  constraint discovery_candidate_tools_no_approval_status_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:142:  constraint discovery_candidate_tools_review_notes_length_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:144:  constraint discovery_candidate_tools_rejection_reason_code_length_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:147:  constraint discovery_candidate_tools_cleanup_status_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:151:create index if not exists discovery_candidate_tools_run_id_idx
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:152:  on public.discovery_candidate_tools (discovery_run_id);
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:154:create index if not exists discovery_candidate_tools_candidate_status_idx
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:155:  on public.discovery_candidate_tools (candidate_status);
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:157:create index if not exists discovery_candidate_tools_created_at_idx
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:158:  on public.discovery_candidate_tools (created_at desc);
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:160:create index if not exists discovery_candidate_tools_review_queue_idx
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:161:  on public.discovery_candidate_tools (candidate_status, created_at desc);
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:163:create index if not exists discovery_candidate_tools_candidate_canonical_url_idx
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:164:  on public.discovery_candidate_tools (candidate_canonical_url);
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:166:create index if not exists discovery_candidate_tools_candidate_normalized_domain_idx
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:167:  on public.discovery_candidate_tools (candidate_normalized_domain);
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:169:create index if not exists discovery_candidate_tools_source_url_normalized_idx
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:170:  on public.discovery_candidate_tools (source_url_normalized);
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:172:create index if not exists discovery_candidate_tools_duplicate_check_status_idx
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:173:  on public.discovery_candidate_tools (duplicate_check_status);
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:175:create index if not exists discovery_candidate_tools_cleanup_idx
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:176:  on public.discovery_candidate_tools (cleanup_status, eligible_for_cleanup_at);
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:178:create unique index if not exists discovery_candidate_tools_run_canonical_active_uidx
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:179:  on public.discovery_candidate_tools (discovery_run_id, candidate_canonical_url)
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:182:drop trigger if exists set_discovery_candidate_tools_updated_at
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:183:  on public.discovery_candidate_tools;
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:185:create trigger set_discovery_candidate_tools_updated_at
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:186:before update on public.discovery_candidate_tools
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:189:alter table public.discovery_candidate_tools enable row level security;
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:191:revoke all on public.discovery_candidate_tools from anon, authenticated;
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:193:drop policy if exists "Deny all access to discovery_candidate_tools"
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:194:  on public.discovery_candidate_tools;
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:196:create policy "Deny all access to discovery_candidate_tools"
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:197:on public.discovery_candidate_tools
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:202:comment on table public.discovery_candidate_tools is
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:205:comment on column public.discovery_candidate_tools.discovery_run_id is
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:208:comment on column public.discovery_candidate_tools.source_evidence_locator is
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:211:comment on column public.discovery_candidate_tools.evidence_summary is
```

## RLS and policy declaration hits

```text
supabase/migrations/20260612000100_create_homepage_control_room.sql:114:alter table public.homepage_control_configs enable row level security;
supabase/migrations/20260612000100_create_homepage_control_room.sql:115:alter table public.homepage_control_audit_events enable row level security;
supabase/migrations/20260612000100_create_homepage_control_room.sql:116:alter table public.homepage_control_checklist_runs enable row level security;
supabase/migrations/20260612000100_create_homepage_control_room.sql:157:create policy "Admin can read homepage control configs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:165:create policy "Admin can write homepage control configs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:174:create policy "Admin can read homepage control audit events"
supabase/migrations/20260612000100_create_homepage_control_room.sql:182:create policy "Admin can insert homepage control audit events"
supabase/migrations/20260612000100_create_homepage_control_room.sql:190:create policy "Admin can read homepage control checklist runs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:198:create policy "Admin can write homepage control checklist runs"
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:51:alter table public.discovered_tools enable row level security;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:188:alter table public.tools enable row level security;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:196:create policy "Allow public read access to approved tools"
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:184:alter table public.discovery_candidate_preview_artifacts enable row level security;
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:191:create policy "Deny all access to discovery_candidate_preview_artifacts"
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:189:alter table public.discovery_candidate_tools enable row level security;
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:196:create policy "Deny all access to discovery_candidate_tools"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:208:alter table public.discovery_sources enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:209:alter table public.discovery_runs enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:210:alter table public.discovered_tools enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:211:alter table public.discovery_evidence enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:212:alter table public.discovery_duplicate_candidates enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:213:alter table public.discovery_audit_events enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225:create policy "Deny all access to discovery_sources"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:229:create policy "Deny all access to discovery_runs"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:233:create policy "Deny all access to discovered_tools"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:237:create policy "Deny all access to discovery_evidence"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:241:create policy "Deny all access to discovery_duplicate_candidates"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:245:create policy "Deny all access to discovery_audit_events"
```

## Reconciliation questions

1. Do the eight discovery relations have one committed deny-all policy each?
2. Do the three homepage-control relations have the intended admin-only policies?
3. Is the public insertion boundary for `submitted_tools` represented exactly?
4. Are the two live `tools` read policies both represented and intentional?
5. Are zero policies on `admin_audit_archives` and `admin_audit_logs` intentional?
6. Is RLS enabled but not forced on all 15 relations by design?

## Boundary

This inventory does not recommend or execute any migration or database change.
