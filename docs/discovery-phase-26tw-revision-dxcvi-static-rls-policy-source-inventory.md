# Phase 26TW — Static RLS and Policy Source Inventory

## Bound baseline

`c5ba2e534f81b64743f4d66e66daab5b57f1979b`

## Inspection boundary

Committed SQL, migration, and Supabase configuration files were inspected statically.

No SQL was executed. No database, Supabase CLI, network service, environment value, credential, row data, schema mutation, or production system was accessed.

## Inventory counts

- SQL and migration files: `22`
- RLS-related matches: `13`
- Table-definition or alteration matches: `66`
- Policy-related matches: `97`

## SQL and migration files

```text
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql
supabase/migrations/20260602000200_create_discovered_tools_queue.sql
supabase/migrations/20260612000100_create_homepage_control_room.sql
supabase/migrations/20260612000200_harden_discovered_tools_access.sql
supabase/migrations/20260612000300_publish_homepage_control_config.sql
supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql
supabase/migrations/20260615001110_updated-preview-checklist.sql
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql
supabase/migrations/20260616002151_finalize_public_safe_tools_schema_patch.sql
supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql
supabase/migrations/20260617004500_seed_discovery_queue_smoke_test.sql
supabase/migrations/20260617005500_cleanup_discovery_queue_smoke_test.sql
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql
supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql
```

## RLS-related evidence

```text
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:51:alter table public.discovered_tools enable row level security;
supabase/migrations/20260612000100_create_homepage_control_room.sql:114:alter table public.homepage_control_configs enable row level security;
supabase/migrations/20260612000100_create_homepage_control_room.sql:115:alter table public.homepage_control_audit_events enable row level security;
supabase/migrations/20260612000100_create_homepage_control_room.sql:116:alter table public.homepage_control_checklist_runs enable row level security;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:188:alter table public.tools enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:208:alter table public.discovery_sources enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:209:alter table public.discovery_runs enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:210:alter table public.discovered_tools enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:211:alter table public.discovery_evidence enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:212:alter table public.discovery_duplicate_candidates enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:213:alter table public.discovery_audit_events enable row level security;
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:189:alter table public.discovery_candidate_tools enable row level security;
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:184:alter table public.discovery_candidate_preview_artifacts enable row level security;
```

## Table-definition evidence

```text
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:100:alter table public.tools
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:104:alter table public.submitted_tools
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:12:create table if not exists public.discovered_tools (
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:51:alter table public.discovered_tools enable row level security;
supabase/migrations/20260612000100_create_homepage_control_room.sql:9:create table if not exists public.homepage_control_configs (
supabase/migrations/20260612000100_create_homepage_control_room.sql:41:create table if not exists public.homepage_control_audit_events (
supabase/migrations/20260612000100_create_homepage_control_room.sql:74:create table if not exists public.homepage_control_checklist_runs (
supabase/migrations/20260612000100_create_homepage_control_room.sql:114:alter table public.homepage_control_configs enable row level security;
supabase/migrations/20260612000100_create_homepage_control_room.sql:115:alter table public.homepage_control_audit_events enable row level security;
supabase/migrations/20260612000100_create_homepage_control_room.sql:116:alter table public.homepage_control_checklist_runs enable row level security;
supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql:8:alter table public.homepage_control_audit_events
supabase/migrations/20260614000100_allow_preview_transition_audit_action.sql:11:alter table public.homepage_control_audit_events
supabase/migrations/20260615001110_updated-preview-checklist.sql:21:alter table public.homepage_control_audit_events
supabase/migrations/20260615001110_updated-preview-checklist.sql:24:alter table public.homepage_control_audit_events
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:74:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:77:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:80:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:83:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:102:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:105:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:108:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:111:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:114:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:117:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:120:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:124:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:127:alter table public.tools
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:188:alter table public.tools enable row level security;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:227:--     alter table public.tools drop constraint if exists tools_status_check;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:228:--     alter table public.tools drop constraint if exists tools_slug_non_empty_check;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:229:--     alter table public.tools drop column if exists deleted_at;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:230:--     alter table public.tools drop column if exists status;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:231:--     alter table public.tools drop column if exists slug;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:232:--     alter table public.tools drop column if exists updated_at;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:35:create table if not exists public.discovery_sources (
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:51:create table if not exists public.discovery_runs (
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:70:create table if not exists public.discovered_tools (
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:102:create table if not exists public.discovery_evidence (
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:123:create table if not exists public.discovery_duplicate_candidates (
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:148:create table if not exists public.discovery_audit_events (
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:208:alter table public.discovery_sources enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:209:alter table public.discovery_runs enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:210:alter table public.discovered_tools enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:211:alter table public.discovery_evidence enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:212:alter table public.discovery_duplicate_candidates enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:213:alter table public.discovery_audit_events enable row level security;
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:5:create table if not exists public.discovery_candidate_tools (
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:189:alter table public.discovery_candidate_tools enable row level security;
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:14:alter table public.discovery_candidate_tools
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:20:alter table public.discovery_candidate_tools
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:36:alter table public.discovery_audit_events
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:39:alter table public.discovery_audit_events
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:11:create table if not exists public.discovery_candidate_preview_artifacts (
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:184:alter table public.discovery_candidate_preview_artifacts enable row level security;
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:30:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:33:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:36:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:39:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:48:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:55:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:65:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:72:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:75:alter table public.discovery_candidate_preview_artifacts
supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql:19:alter table if exists public.discovery_sources
supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql:22:alter table if exists public.discovery_sources
supabase/migrations/20260705120607_discovery_sources_status_forward_reconciliation.sql:25:alter table if exists public.discovery_sources
```

## Policy-definition evidence

```text
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:4:-- Direct inserts into public.tools are blocked when the domain matches a
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:249:  for update;
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:273:  insert into public.tools (
supabase/migrations/20260612000100_create_homepage_control_room.sql:121:grant select on public.public_homepage_control_config to anon;
supabase/migrations/20260612000100_create_homepage_control_room.sql:154:drop policy if exists "Admin can read homepage control configs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:157:create policy "Admin can read homepage control configs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:159:for select
supabase/migrations/20260612000100_create_homepage_control_room.sql:160:using (false);
supabase/migrations/20260612000100_create_homepage_control_room.sql:162:drop policy if exists "Admin can write homepage control configs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:165:create policy "Admin can write homepage control configs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:167:for all
supabase/migrations/20260612000100_create_homepage_control_room.sql:168:using (false)
supabase/migrations/20260612000100_create_homepage_control_room.sql:169:with check (false);
supabase/migrations/20260612000100_create_homepage_control_room.sql:171:drop policy if exists "Admin can read homepage control audit events"
supabase/migrations/20260612000100_create_homepage_control_room.sql:174:create policy "Admin can read homepage control audit events"
supabase/migrations/20260612000100_create_homepage_control_room.sql:176:for select
supabase/migrations/20260612000100_create_homepage_control_room.sql:177:using (false);
supabase/migrations/20260612000100_create_homepage_control_room.sql:179:drop policy if exists "Admin can insert homepage control audit events"
supabase/migrations/20260612000100_create_homepage_control_room.sql:182:create policy "Admin can insert homepage control audit events"
supabase/migrations/20260612000100_create_homepage_control_room.sql:184:for insert
supabase/migrations/20260612000100_create_homepage_control_room.sql:185:with check (false);
supabase/migrations/20260612000100_create_homepage_control_room.sql:187:drop policy if exists "Admin can read homepage control checklist runs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:190:create policy "Admin can read homepage control checklist runs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:192:for select
supabase/migrations/20260612000100_create_homepage_control_room.sql:193:using (false);
supabase/migrations/20260612000100_create_homepage_control_room.sql:195:drop policy if exists "Admin can write homepage control checklist runs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:198:create policy "Admin can write homepage control checklist runs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:200:for all
supabase/migrations/20260612000100_create_homepage_control_room.sql:201:using (false)
supabase/migrations/20260612000100_create_homepage_control_room.sql:202:with check (false);
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:35:grant all on table public.discovered_tools to service_role;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:36:grant all on sequence public.discovered_tools_id_seq to service_role;
supabase/migrations/20260612000200_harden_discovered_tools_access.sql:37:grant execute on function public.set_discovered_tools_updated_at() to service_role;
supabase/migrations/20260612000300_publish_homepage_control_config.sql:10:-- - Do not expose this RPC to anon/authenticated roles.
supabase/migrations/20260612000300_publish_homepage_control_config.sql:43:  for update;
supabase/migrations/20260612000300_publish_homepage_control_config.sql:114:  insert into public.homepage_control_audit_events (
supabase/migrations/20260612000300_publish_homepage_control_config.sql:147:grant execute on function public.publish_homepage_control_config(uuid, uuid, text) to service_role;
supabase/migrations/20260615001110_updated-preview-checklist.sql:16:-- - The publish RPC stays restricted to service_role.
supabase/migrations/20260615001110_updated-preview-checklist.sql:67:  for update;
supabase/migrations/20260615001110_updated-preview-checklist.sql:104:  for update;
supabase/migrations/20260615001110_updated-preview-checklist.sql:155:  insert into public.homepage_control_audit_events (
supabase/migrations/20260615001110_updated-preview-checklist.sql:189:grant execute on function public.publish_homepage_control_config(uuid, uuid, text) to service_role;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:190:drop policy if exists "Allow public read access to approved tools"
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:195:-- after every public read path has moved to public.public_safe_tools.
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:196:create policy "Allow public read access to approved tools"
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:198:  for select
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:199:  to anon
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:200:  using (status = 'approved' and deleted_at is null);
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:202:grant usage on schema public to anon;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:203:grant select on public.public_safe_tools to anon;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:207:-- lib/homepage-control-public.ts are switched to public.public_safe_tools and
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:212:-- - If app code has already switched to public.public_safe_tools, first deploy an
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:220:--     drop policy if exists "Allow public read access to approved tools" on public.tools;
supabase/migrations/20260616002151_finalize_public_safe_tools_schema_patch.sql:61:grant select on public.public_safe_tools to anon, authenticated;
supabase/migrations/20260616002251_finalize_public_safe_tools_schema_patch.sql:41:grant select on public.public_safe_tools to anon, authenticated;
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:21:  for update;
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:61:  insert into public.tools (
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:105:grant execute on function public.approve_submitted_tool(bigint) to service_role;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:183:-- 9. Triggers for updated_at
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:224:drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225:create policy "Deny all access to discovery_sources"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:226:on public.discovery_sources for all using (false) with check (false);
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:228:drop policy if exists "Deny all access to discovery_runs" on public.discovery_runs;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:229:create policy "Deny all access to discovery_runs"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:230:on public.discovery_runs for all using (false) with check (false);
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:232:drop policy if exists "Deny all access to discovered_tools" on public.discovered_tools;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:233:create policy "Deny all access to discovered_tools"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:234:on public.discovered_tools for all using (false) with check (false);
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:236:drop policy if exists "Deny all access to discovery_evidence" on public.discovery_evidence;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:237:create policy "Deny all access to discovery_evidence"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:238:on public.discovery_evidence for all using (false) with check (false);
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:240:drop policy if exists "Deny all access to discovery_duplicate_candidates" on public.discovery_duplicate_candidates;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:241:create policy "Deny all access to discovery_duplicate_candidates"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:242:on public.discovery_duplicate_candidates for all using (false) with check (false);
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:244:drop policy if exists "Deny all access to discovery_audit_events" on public.discovery_audit_events;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:245:create policy "Deny all access to discovery_audit_events"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:246:on public.discovery_audit_events for all using (false) with check (false);
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:1:-- Phase 3D: Approve discovered tools into public.tools.
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:7:-- - insert into public.tools
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:32:  for update;
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:112:  insert into public.tools (
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:154:  insert into public.discovery_audit_events (
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:183:grant execute on function public.approve_discovered_tool(uuid, uuid, text) to service_role;
supabase/migrations/20260617004500_seed_discovery_queue_smoke_test.sql:1:insert into public.discovered_tools (
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:193:drop policy if exists "Deny all access to discovery_candidate_tools"
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:196:create policy "Deny all access to discovery_candidate_tools"
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:198:for all
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:199:using (false)
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:200:with check (false);
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:188:drop policy if exists "Deny all access to discovery_candidate_preview_artifacts"
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:191:create policy "Deny all access to discovery_candidate_preview_artifacts"
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:193:for all
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:194:using (false)
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:195:with check (false);
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:118:  for update;
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:188:  insert into public.discovery_audit_events (
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:267:) to service_role;
```

## Interpretation boundary

Committed migration text establishes intended policy structure only. It does not prove:

- that every migration was applied;
- that deployed RLS state matches source;
- that no later manual change exists;
- that policies behave correctly at runtime;
- that service-role usage is appropriately isolated.

## Current determination

`STATIC_RLS_POLICY_SOURCE_INVENTORY_COMPLETE_DEPLOYED_STATE_NOT_VERIFIED`
