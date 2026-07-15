# Phase 26WJ — Tools Second Read Policy Static Origin Trace

## Bound baseline

`3a6cb8662c62fcab861436f21a2586bc3821ee6e`

## Live observation

The live catalog returned two read policies on `public.tools`:

- `Allow public read access to approved tools`
- `Public can read tools`

## Repository-wide policy-name and tools-policy hits

```text
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:272:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:190:drop policy if exists "Allow public read access to approved tools"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:276:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:196:create policy "Allow public read access to approved tools"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:285:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:220:--     drop policy if exists "Allow public read access to approved tools" on public.tools;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:506:supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:193:drop policy if exists "Deny all access to discovery_candidate_tools"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:508:supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:196:create policy "Deny all access to discovery_candidate_tools"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:530:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:196:create policy "Allow public read access to approved tools"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:534:supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:196:create policy "Deny all access to discovery_candidate_tools"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:543:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:233:create policy "Deny all access to discovered_tools"
docs/discovery-phase-8h-candidate-extraction-staging-table-migration-sql-draft-review-gate.md:278:drop policy if exists "Deny all access to discovery_candidate_tools"
docs/discovery-phase-8h-candidate-extraction-staging-table-migration-sql-draft-review-gate.md:281:create policy "Deny all access to discovery_candidate_tools"
docs/discovery-phase-8h-candidate-extraction-staging-table-migration-sql-draft-review-gate.md:469:drop policy if exists "Deny all access to discovery_candidate_tools"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:181:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:190:drop policy if exists "Allow public read access to approved tools"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:183:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:196:create policy "Allow public read access to approved tools"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:191:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:220:--     drop policy if exists "Allow public read access to approved tools" on public.tools;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:204:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:232:drop policy if exists "Deny all access to discovered_tools" on public.discovered_tools;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:205:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:233:create policy "Deny all access to discovered_tools"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:223:supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:193:drop policy if exists "Deny all access to discovery_candidate_tools"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:224:supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:196:create policy "Deny all access to discovery_candidate_tools"
docs/discovery-phase-8g-candidate-extraction-schema-migration-implementation-plan.md:291:create policy "Deny all access to discovery_candidate_tools"
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:472:drop policy if exists "Deny all access to discovery_candidate_tools"
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:475:create policy "Deny all access to discovery_candidate_tools"
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:660:drop policy if exists "Deny all access to discovered_tools" on public.discovered_tools;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:661:create policy "Deny all access to discovered_tools"
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:445:drop policy if exists "Deny all access to discovery_candidate_tools"
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:452:create policy "Deny all access to discovery_candidate_tools"
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:190:drop policy if exists "Allow public read access to approved tools"
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:196:create policy "Allow public read access to approved tools"
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:220:--     drop policy if exists "Allow public read access to approved tools" on public.tools;
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:193:drop policy if exists "Deny all access to discovery_candidate_tools"
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:196:create policy "Deny all access to discovery_candidate_tools"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:232:drop policy if exists "Deny all access to discovered_tools" on public.discovered_tools;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:233:create policy "Deny all access to discovered_tools"
```

## Wider policy declaration hits

```text
supabase/migrations/20260612000100_create_homepage_control_room.sql:114:alter table public.homepage_control_configs enable row level security;
supabase/migrations/20260612000100_create_homepage_control_room.sql:115:alter table public.homepage_control_audit_events enable row level security;
supabase/migrations/20260612000100_create_homepage_control_room.sql:116:alter table public.homepage_control_checklist_runs enable row level security;
supabase/migrations/20260612000100_create_homepage_control_room.sql:154:drop policy if exists "Admin can read homepage control configs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:157:create policy "Admin can read homepage control configs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:162:drop policy if exists "Admin can write homepage control configs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:165:create policy "Admin can write homepage control configs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:171:drop policy if exists "Admin can read homepage control audit events"
supabase/migrations/20260612000100_create_homepage_control_room.sql:174:create policy "Admin can read homepage control audit events"
supabase/migrations/20260612000100_create_homepage_control_room.sql:179:drop policy if exists "Admin can insert homepage control audit events"
supabase/migrations/20260612000100_create_homepage_control_room.sql:182:create policy "Admin can insert homepage control audit events"
supabase/migrations/20260612000100_create_homepage_control_room.sql:187:drop policy if exists "Admin can read homepage control checklist runs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:190:create policy "Admin can read homepage control checklist runs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:195:drop policy if exists "Admin can write homepage control checklist runs"
supabase/migrations/20260612000100_create_homepage_control_room.sql:198:create policy "Admin can write homepage control checklist runs"
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:51:alter table public.discovered_tools enable row level security;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:188:alter table public.tools enable row level security;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:190:drop policy if exists "Allow public read access to approved tools"
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:196:create policy "Allow public read access to approved tools"
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:220:--     drop policy if exists "Allow public read access to approved tools" on public.tools;
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:184:alter table public.discovery_candidate_preview_artifacts enable row level security;
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:188:drop policy if exists "Deny all access to discovery_candidate_preview_artifacts"
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:191:create policy "Deny all access to discovery_candidate_preview_artifacts"
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:189:alter table public.discovery_candidate_tools enable row level security;
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:193:drop policy if exists "Deny all access to discovery_candidate_tools"
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:196:create policy "Deny all access to discovery_candidate_tools"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:208:alter table public.discovery_sources enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:209:alter table public.discovery_runs enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:210:alter table public.discovered_tools enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:211:alter table public.discovery_evidence enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:212:alter table public.discovery_duplicate_candidates enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:213:alter table public.discovery_audit_events enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:224:drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225:create policy "Deny all access to discovery_sources"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:228:drop policy if exists "Deny all access to discovery_runs" on public.discovery_runs;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:229:create policy "Deny all access to discovery_runs"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:232:drop policy if exists "Deny all access to discovered_tools" on public.discovered_tools;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:233:create policy "Deny all access to discovered_tools"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:236:drop policy if exists "Deny all access to discovery_evidence" on public.discovery_evidence;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:237:create policy "Deny all access to discovery_evidence"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:240:drop policy if exists "Deny all access to discovery_duplicate_candidates" on public.discovery_duplicate_candidates;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:241:create policy "Deny all access to discovery_duplicate_candidates"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:244:drop policy if exists "Deny all access to discovery_audit_events" on public.discovery_audit_events;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:245:create policy "Deny all access to discovery_audit_events"
docs/homepage-control-room-sql-migration-proposal.md:284:alter table public.homepage_control_configs enable row level security;
docs/homepage-control-room-sql-migration-proposal.md:285:alter table public.homepage_control_audit_events enable row level security;
docs/homepage-control-room-sql-migration-proposal.md:286:alter table public.homepage_control_checklist_runs enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:170:supabase/migrations/20260612000100_create_homepage_control_room.sql:114:alter table public.homepage_control_configs enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:171:supabase/migrations/20260612000100_create_homepage_control_room.sql:115:alter table public.homepage_control_audit_events enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:172:supabase/migrations/20260612000100_create_homepage_control_room.sql:116:alter table public.homepage_control_checklist_runs enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:208:supabase/migrations/20260602000200_create_discovered_tools_queue.sql:51:alter table public.discovered_tools enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:271:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:188:alter table public.tools enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:272:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:190:drop policy if exists "Allow public read access to approved tools"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:276:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:196:create policy "Allow public read access to approved tools"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:285:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:220:--     drop policy if exists "Allow public read access to approved tools" on public.tools;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:415:supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:184:alter table public.discovery_candidate_preview_artifacts enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:417:supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:188:drop policy if exists "Deny all access to discovery_candidate_preview_artifacts"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:419:supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:191:create policy "Deny all access to discovery_candidate_preview_artifacts"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:504:supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:189:alter table public.discovery_candidate_tools enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:506:supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:193:drop policy if exists "Deny all access to discovery_candidate_tools"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:508:supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:196:create policy "Deny all access to discovery_candidate_tools"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:519:supabase/migrations/20260612000100_create_homepage_control_room.sql:114:alter table public.homepage_control_configs enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:520:supabase/migrations/20260612000100_create_homepage_control_room.sql:115:alter table public.homepage_control_audit_events enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:521:supabase/migrations/20260612000100_create_homepage_control_room.sql:116:alter table public.homepage_control_checklist_runs enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:522:supabase/migrations/20260612000100_create_homepage_control_room.sql:157:create policy "Admin can read homepage control configs"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:523:supabase/migrations/20260612000100_create_homepage_control_room.sql:165:create policy "Admin can write homepage control configs"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:524:supabase/migrations/20260612000100_create_homepage_control_room.sql:174:create policy "Admin can read homepage control audit events"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:525:supabase/migrations/20260612000100_create_homepage_control_room.sql:182:create policy "Admin can insert homepage control audit events"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:526:supabase/migrations/20260612000100_create_homepage_control_room.sql:190:create policy "Admin can read homepage control checklist runs"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:527:supabase/migrations/20260612000100_create_homepage_control_room.sql:198:create policy "Admin can write homepage control checklist runs"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:528:supabase/migrations/20260602000200_create_discovered_tools_queue.sql:51:alter table public.discovered_tools enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:529:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:188:alter table public.tools enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:530:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:196:create policy "Allow public read access to approved tools"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:531:supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:184:alter table public.discovery_candidate_preview_artifacts enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:532:supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:191:create policy "Deny all access to discovery_candidate_preview_artifacts"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:533:supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:189:alter table public.discovery_candidate_tools enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:534:supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:196:create policy "Deny all access to discovery_candidate_tools"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:535:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:208:alter table public.discovery_sources enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:536:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:209:alter table public.discovery_runs enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:537:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:210:alter table public.discovered_tools enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:538:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:211:alter table public.discovery_evidence enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:539:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:212:alter table public.discovery_duplicate_candidates enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:540:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:213:alter table public.discovery_audit_events enable row level security;
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:541:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225:create policy "Deny all access to discovery_sources"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:542:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:229:create policy "Deny all access to discovery_runs"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:543:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:233:create policy "Deny all access to discovered_tools"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:544:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:237:create policy "Deny all access to discovery_evidence"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:545:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:241:create policy "Deny all access to discovery_duplicate_candidates"
docs/discovery-phase-26wc-live-rls-static-migration-reconciliation-inventory.md:546:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:245:create policy "Deny all access to discovery_audit_events"
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:136:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:208: alter table public.discovery_sources enable row level security;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:137:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:209: alter table public.discovery_runs enable row level security;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:138:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:210: alter table public.discovered_tools enable row level security;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:139:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:211: alter table public.discovery_evidence enable row level security;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:146:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:224: drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:147:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225: create policy "Deny all access to discovery_sources"
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:155:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:224: drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:156:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225: create policy "Deny all access to discovery_sources"
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:159:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:228: drop policy if exists "Deny all access to discovery_runs" on public.discovery_runs;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:164:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:224: drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:165:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225: create policy "Deny all access to discovery_sources"
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:168:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:228: drop policy if exists "Deny all access to discovery_runs" on public.discovery_runs;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:169:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:229: create policy "Deny all access to discovery_runs"
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:178:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:208: alter table public.discovery_sources enable row level security;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:179:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:209: alter table public.discovery_runs enable row level security;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:180:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:210: alter table public.discovered_tools enable row level security;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:181:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:211: alter table public.discovery_evidence enable row level security;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:185:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:213: alter table public.discovery_audit_events enable row level security;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:198:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:224: drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:199:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225: create policy "Deny all access to discovery_sources"
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:207:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:224: drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:208:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225: create policy "Deny all access to discovery_sources"
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:211:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:228: drop policy if exists "Deny all access to discovery_runs" on public.discovery_runs;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:216:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:224: drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:217:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225: create policy "Deny all access to discovery_sources"
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:220:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:228: drop policy if exists "Deny all access to discovery_runs" on public.discovery_runs;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:221:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:229: create policy "Deny all access to discovery_runs"
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:671:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:208: alter table public.discovery_sources enable row level security;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:672:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:209: alter table public.discovery_runs enable row level security;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:673:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:210: alter table public.discovered_tools enable row level security;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:687:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:224: drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:688:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225: create policy "Deny all access to discovery_sources"
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:694:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:224: drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:695:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225: create policy "Deny all access to discovery_sources"
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:701:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:224: drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:702:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225: create policy "Deny all access to discovery_sources"
docs/discovery-phase-25av-local-repository-evidence-review-for-discovery-sources-status-contract.md:705:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:228: drop policy if exists "Deny all access to discovery_runs" on public.discovery_runs;
docs/discovery-phase-8h-candidate-extraction-staging-table-migration-sql-draft-review-gate.md:274:alter table public.discovery_candidate_tools enable row level security;
docs/discovery-phase-8h-candidate-extraction-staging-table-migration-sql-draft-review-gate.md:278:drop policy if exists "Deny all access to discovery_candidate_tools"
docs/discovery-phase-8h-candidate-extraction-staging-table-migration-sql-draft-review-gate.md:281:create policy "Deny all access to discovery_candidate_tools"
docs/discovery-phase-8h-candidate-extraction-staging-table-migration-sql-draft-review-gate.md:469:drop policy if exists "Deny all access to discovery_candidate_tools"
docs/discovery-phase-25bc-discovery-sources-status-contract-reconciliation-decision-gate.md:119:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- 10. RLS - Admin Only Hardening alter table public.discovery_sources enable row level security;
docs/discovery-phase-25bc-discovery-sources-status-contract-reconciliation-decision-gate.md:121:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: -- Deny-by-default policies drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-25bc-discovery-sources-status-contract-reconciliation-decision-gate.md:122:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql: create policy "Deny all access to discovery_sources" on public.discovery_sources for all using (false) with check (false);
docs/discovery-phase-25bb-discovery-sources-status-local-schema-history-audit-gate.md:130:docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:636:alter table public.discovery_sources enable row level security;
docs/discovery-phase-25bb-discovery-sources-status-local-schema-history-audit-gate.md:132:docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:652:drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-25bb-discovery-sources-status-local-schema-history-audit-gate.md:133:docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:653:create policy "Deny all access to discovery_sources"
docs/discovery-phase-25bb-discovery-sources-status-local-schema-history-audit-gate.md:346:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:208:alter table public.discovery_sources enable row level security;
docs/discovery-phase-25bb-discovery-sources-status-local-schema-history-audit-gate.md:348:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:224:drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-25bb-discovery-sources-status-local-schema-history-audit-gate.md:349:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225:create policy "Deny all access to discovery_sources"
docs/discovery-phase-25bb-discovery-sources-status-local-schema-history-audit-gate.md:557:docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:636:alter table public.discovery_sources enable row level security;
docs/discovery-phase-25bb-discovery-sources-status-local-schema-history-audit-gate.md:559:docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:652:drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-25bb-discovery-sources-status-local-schema-history-audit-gate.md:560:docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:653:create policy "Deny all access to discovery_sources"
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:602:docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:636:alter table public.discovery_sources enable row level security;
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:604:docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:652:drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:605:docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:653:create policy "Deny all access to discovery_sources"
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:747:docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:636:alter table public.discovery_sources enable row level security;
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:751:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:208:alter table public.discovery_sources enable row level security;
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:336:- enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:50:supabase/migrations/20260602000200_create_discovered_tools_queue.sql:51:alter table public.discovered_tools enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:51:supabase/migrations/20260612000100_create_homepage_control_room.sql:114:alter table public.homepage_control_configs enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:52:supabase/migrations/20260612000100_create_homepage_control_room.sql:115:alter table public.homepage_control_audit_events enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:53:supabase/migrations/20260612000100_create_homepage_control_room.sql:116:alter table public.homepage_control_checklist_runs enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:54:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:188:alter table public.tools enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:55:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:208:alter table public.discovery_sources enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:56:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:209:alter table public.discovery_runs enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:57:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:210:alter table public.discovered_tools enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:58:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:211:alter table public.discovery_evidence enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:59:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:212:alter table public.discovery_duplicate_candidates enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:60:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:213:alter table public.discovery_audit_events enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:61:supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:189:alter table public.discovery_candidate_tools enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:62:supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:184:alter table public.discovery_candidate_preview_artifacts enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:71:supabase/migrations/20260602000200_create_discovered_tools_queue.sql:51:alter table public.discovered_tools enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:75:supabase/migrations/20260612000100_create_homepage_control_room.sql:114:alter table public.homepage_control_configs enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:76:supabase/migrations/20260612000100_create_homepage_control_room.sql:115:alter table public.homepage_control_audit_events enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:77:supabase/migrations/20260612000100_create_homepage_control_room.sql:116:alter table public.homepage_control_checklist_runs enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:95:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:188:alter table public.tools enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:108:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:208:alter table public.discovery_sources enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:109:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:209:alter table public.discovery_runs enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:110:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:210:alter table public.discovered_tools enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:111:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:211:alter table public.discovery_evidence enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:112:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:212:alter table public.discovery_duplicate_candidates enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:113:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:213:alter table public.discovery_audit_events enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:115:supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:189:alter table public.discovery_candidate_tools enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:121:supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:184:alter table public.discovery_candidate_preview_artifacts enable row level security;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:143:supabase/migrations/20260612000100_create_homepage_control_room.sql:154:drop policy if exists "Admin can read homepage control configs"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:144:supabase/migrations/20260612000100_create_homepage_control_room.sql:157:create policy "Admin can read homepage control configs"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:147:supabase/migrations/20260612000100_create_homepage_control_room.sql:162:drop policy if exists "Admin can write homepage control configs"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:148:supabase/migrations/20260612000100_create_homepage_control_room.sql:165:create policy "Admin can write homepage control configs"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:152:supabase/migrations/20260612000100_create_homepage_control_room.sql:171:drop policy if exists "Admin can read homepage control audit events"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:153:supabase/migrations/20260612000100_create_homepage_control_room.sql:174:create policy "Admin can read homepage control audit events"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:156:supabase/migrations/20260612000100_create_homepage_control_room.sql:179:drop policy if exists "Admin can insert homepage control audit events"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:157:supabase/migrations/20260612000100_create_homepage_control_room.sql:182:create policy "Admin can insert homepage control audit events"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:160:supabase/migrations/20260612000100_create_homepage_control_room.sql:187:drop policy if exists "Admin can read homepage control checklist runs"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:161:supabase/migrations/20260612000100_create_homepage_control_room.sql:190:create policy "Admin can read homepage control checklist runs"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:164:supabase/migrations/20260612000100_create_homepage_control_room.sql:195:drop policy if exists "Admin can write homepage control checklist runs"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:165:supabase/migrations/20260612000100_create_homepage_control_room.sql:198:create policy "Admin can write homepage control checklist runs"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:181:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:190:drop policy if exists "Allow public read access to approved tools"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:183:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:196:create policy "Allow public read access to approved tools"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:191:supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:220:--     drop policy if exists "Allow public read access to approved tools" on public.tools;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:198:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:224:drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:199:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225:create policy "Deny all access to discovery_sources"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:201:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:228:drop policy if exists "Deny all access to discovery_runs" on public.discovery_runs;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:202:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:229:create policy "Deny all access to discovery_runs"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:204:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:232:drop policy if exists "Deny all access to discovered_tools" on public.discovered_tools;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:205:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:233:create policy "Deny all access to discovered_tools"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:207:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:236:drop policy if exists "Deny all access to discovery_evidence" on public.discovery_evidence;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:208:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:237:create policy "Deny all access to discovery_evidence"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:210:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:240:drop policy if exists "Deny all access to discovery_duplicate_candidates" on public.discovery_duplicate_candidates;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:211:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:241:create policy "Deny all access to discovery_duplicate_candidates"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:213:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:244:drop policy if exists "Deny all access to discovery_audit_events" on public.discovery_audit_events;
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:214:supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:245:create policy "Deny all access to discovery_audit_events"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:223:supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:193:drop policy if exists "Deny all access to discovery_candidate_tools"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:224:supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:196:create policy "Deny all access to discovery_candidate_tools"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:228:supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:188:drop policy if exists "Deny all access to discovery_candidate_preview_artifacts"
docs/discovery-phase-26tw-revision-dxcvi-static-rls-policy-source-inventory.md:229:supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:191:create policy "Deny all access to discovery_candidate_preview_artifacts"
docs/discovery-phase-8g-candidate-extraction-schema-migration-implementation-plan.md:289:alter table public.discovery_candidate_tools enable row level security;
docs/discovery-phase-8g-candidate-extraction-schema-migration-implementation-plan.md:291:create policy "Deny all access to discovery_candidate_tools"
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:468:alter table public.discovery_candidate_tools enable row level security;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:472:drop policy if exists "Deny all access to discovery_candidate_tools"
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:475:create policy "Deny all access to discovery_candidate_tools"
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:636:alter table public.discovery_sources enable row level security;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:637:alter table public.discovery_runs enable row level security;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:638:alter table public.discovered_tools enable row level security;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:639:alter table public.discovery_evidence enable row level security;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:640:alter table public.discovery_duplicate_candidates enable row level security;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:641:alter table public.discovery_audit_events enable row level security;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:652:drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:653:create policy "Deny all access to discovery_sources"
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:656:drop policy if exists "Deny all access to discovery_runs" on public.discovery_runs;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:657:create policy "Deny all access to discovery_runs"
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:660:drop policy if exists "Deny all access to discovered_tools" on public.discovered_tools;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:661:create policy "Deny all access to discovered_tools"
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:664:drop policy if exists "Deny all access to discovery_evidence" on public.discovery_evidence;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:665:create policy "Deny all access to discovery_evidence"
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:668:drop policy if exists "Deny all access to discovery_duplicate_candidates" on public.discovery_duplicate_candidates;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:669:create policy "Deny all access to discovery_duplicate_candidates"
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:781:| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 213 | `alter table public.discovery_audit_events enable row level security;` |
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:788:| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 244 | `drop policy if exists "Deny all access to discovery_audit_events" on public.discovery_audit_events;` |
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:789:| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 245 | `create policy "Deny all access to discovery_audit_events"` |
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:433:alter table public.discovery_candidate_tools enable row level security;
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:445:drop policy if exists "Deny all access to discovery_candidate_tools"
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:452:create policy "Deny all access to discovery_candidate_tools"
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:584:alter table public.discovery_audit_events enable row level security;
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:596:drop policy if exists "Deny all access to discovery_audit_events" on public.discovery_audit_events;
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:602:create policy "Deny all access to discovery_audit_events"
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:1093:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 116-116 | `alter table public.homepage_control_checklist_runs enable row level security;` |
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:1101:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 187-187 | `drop policy if exists "Admin can read homepage control checklist runs"` |
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:1103:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 190-190 | `create policy "Admin can read homepage control checklist runs"` |
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:1105:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 195-195 | `drop policy if exists "Admin can write homepage control checklist runs"` |
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:1107:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 198-198 | `create policy "Admin can write homepage control checklist runs"` |
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:1179:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 116-116 | `alter table public.homepage_control_checklist_runs enable row level security;` |
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:1187:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 187-187 | `drop policy if exists "Admin can read homepage control checklist runs"` |
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:1189:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 190-190 | `create policy "Admin can read homepage control checklist runs"` |
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:1191:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 195-195 | `drop policy if exists "Admin can write homepage control checklist runs"` |
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:1193:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 198-198 | `create policy "Admin can write homepage control checklist runs"` |
docs/homepage-control-room-sql-migration-draft.md:154:alter table public.homepage_control_configs enable row level security;
docs/homepage-control-room-sql-migration-draft.md:155:alter table public.homepage_control_audit_events enable row level security;
docs/homepage-control-room-sql-migration-draft.md:156:alter table public.homepage_control_checklist_runs enable row level security;
docs/homepage-control-room-sql-migration-draft.md:196:drop policy if exists "Admin can read homepage control configs"
docs/homepage-control-room-sql-migration-draft.md:199:create policy "Admin can read homepage control configs"
docs/homepage-control-room-sql-migration-draft.md:204:drop policy if exists "Admin can write homepage control configs"
docs/homepage-control-room-sql-migration-draft.md:207:create policy "Admin can write homepage control configs"
docs/homepage-control-room-sql-migration-draft.md:213:drop policy if exists "Admin can read homepage control audit events"
docs/homepage-control-room-sql-migration-draft.md:216:create policy "Admin can read homepage control audit events"
docs/homepage-control-room-sql-migration-draft.md:221:drop policy if exists "Admin can insert homepage control audit events"
docs/homepage-control-room-sql-migration-draft.md:224:create policy "Admin can insert homepage control audit events"
docs/homepage-control-room-sql-migration-draft.md:229:drop policy if exists "Admin can read homepage control checklist runs"
docs/homepage-control-room-sql-migration-draft.md:232:create policy "Admin can read homepage control checklist runs"
docs/homepage-control-room-sql-migration-draft.md:237:drop policy if exists "Admin can write homepage control checklist runs"
docs/homepage-control-room-sql-migration-draft.md:240:create policy "Admin can write homepage control checklist runs"
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:123:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 116 | `alter table public.homepage_control_checklist_runs enable row level security;` |
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:131:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 187 | `drop policy if exists "Admin can read homepage control checklist runs"` |
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:133:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 190 | `create policy "Admin can read homepage control checklist runs"` |
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:135:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 195 | `drop policy if exists "Admin can write homepage control checklist runs"` |
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:137:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 198 | `create policy "Admin can write homepage control checklist runs"` |
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:229:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 116 | `alter table public.homepage_control_checklist_runs enable row level security;` |
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:237:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 187 | `drop policy if exists "Admin can read homepage control checklist runs"` |
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:239:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 190 | `create policy "Admin can read homepage control checklist runs"` |
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:241:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 195 | `drop policy if exists "Admin can write homepage control checklist runs"` |
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:243:| `supabase/migrations/20260612000100_create_homepage_control_room.sql` | 198 | `create policy "Admin can write homepage control checklist runs"` |
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:303:| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 213 | `alter table public.discovery_audit_events enable row level security;` |
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:310:| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 244 | `drop policy if exists "Deny all access to discovery_audit_events" on public.discovery_audit_events;` |
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:311:| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 245 | `create policy "Deny all access to discovery_audit_events"` |
```

## Source access hits

```text
app/api/submit-tool/route.ts:83:    .from("tools")
app/api/admin/audit-logs/route.ts:79:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:96:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:140:    .from("admin_audit_archives")
app/api/admin/audit-logs/route.ts:163:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:174:    .from("admin_audit_logs")
app/api/admin/audit-logs/route.ts:191:    .from("admin_audit_archives")
app/api/admin/tools/route.ts:174:    .from("tools")
app/api/admin/tools/route.ts:198:    .from("tools")
app/api/admin/tools/route.ts:226:      .from("tools")
app/api/admin/tools/route.ts:277:    const { error } = await supabaseAdmin.from("tools").insert([
app/api/admin/tools/route.ts:363:      .from("tools")
app/api/admin/tools/route.ts:426:      .from("tools")
app/api/admin/discovery/intake/route.ts:318:    .from("tools")
app/api/admin/submissions/route.ts:178:    .from("tools")
app/api/admin/submissions/route.ts:252:      .from("tools")
lib/homepage-control-admin.ts:1792:      .from("tools")
lib/admin-audit-log.ts:69:    const { error } = await supabaseAdmin.from("admin_audit_logs").insert([
```

## Trace objective

Determine whether the broad `Public can read tools` policy is:

1. represented in an older committed migration;
2. introduced outside current source control;
3. retained from a superseded schema state;
4. intentionally required by current runtime behavior.

## Current disposition

`STATIC_TRACE_COMPLETED_PENDING_REVIEW_NO_MUTATION_AUTHORIZED`
