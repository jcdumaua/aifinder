# Discovery Engine Phase 25BB — Discovery Sources Status Local Schema History Audit Gate

## Metadata

```text
phase=25BB
title=Discovery Sources Status Local Schema History Audit Gate
phase_type=local_review
baseline_phase=25BA
baseline_commit=efc721b
baseline_subject=Document Phase 25BA contract reconciliation plan
operational_reactivation_status=blocked
local_only=true
```

## Boundary

This is a local-only schema history audit.

This phase does not run live DB reads.

This phase does not run live metadata reads.

This phase does not run the read-only inspection script.

This phase does not run Supabase CLI.

This phase does not run Supabase dashboard SQL.

This phase does not scan `.env` files.

This phase does not access row payload.

This phase does not enumerate rows.

This phase does not count live status values.

This phase does not run grouped counts.

This phase does not mutate database state.

This phase does not change schema.

This phase does not create or apply migrations.

This phase does not generate types.

This phase does not change RLS policies.

This phase does not change grants.

This phase does not modify source code.

This phase does not modify the inspection script.

This phase does not commit or push.

## Reason for audit

Phase 25AZ documented the live metadata finding:

```text
public_discovery_sources_exists=true
public_discovery_sources_status_column_found=false
information_schema_status_visible=false
```

Phase 25BA planned contract reconciliation and recommended this local schema history audit before choosing a remediation path.

The goal of Phase 25BB is to inspect local repository evidence to determine whether `public.discovery_sources.status` is a real repository contract, an outdated inspection-script assumption, or an unresolved migration/schema drift issue.

## Local evidence collection summary

```text
all_discovery_sources_ref_count=639
discovery_sources_status_ref_count=234
migrations_discovery_sources_ref_count=15
migrations_status_ref_count=121
types_discovery_sources_ref_count=704
inspection_status_contract_ref_count=1408
git_log_schema_history_ref_count=66
```

## Evidence: all `discovery_sources` references

```text
app/api/admin/discovery/discovered-tools/[id]/route.ts:116:          .from("discovery_sources")
app/api/admin/discovery/discovered-tools/route.ts:172:        .from("discovery_sources")
app/api/admin/discovery/intake/route.ts:392:        .from("discovery_sources")
app/api/admin/discovery/intake/route.ts:616:      .from("discovery_sources")
app/api/admin/discovery/runs/manual/claim/route.ts:1811:    .from("discovery_sources")
app/api/admin/discovery/runs/manual/route.ts:108:    .from("discovery_sources")
app/api/admin/discovery/sources/[id]/route.ts:316:        .from("discovery_sources")
app/api/admin/discovery/sources/[id]/route.ts:342:    .from("discovery_sources")
app/api/admin/discovery/sources/[id]/route.ts:360:    .from("discovery_sources")
app/api/admin/discovery/sources/route.ts:158:    .from("discovery_sources")
app/api/admin/discovery/sources/route.ts:281:    .from("discovery_sources")
app/api/admin/discovery/sources/route.ts:305:    .from("discovery_sources")
docs/discovery-manual-crawler-pre-implementation-decisions.md:17:- Use existing `discovery_sources.source_type = 'manual'`.
docs/discovery-manual-crawler-pre-implementation-decisions.md:28:- Mapping `manual_curated_urls` into `discovery_sources.config.kind` preserves the first prototype source decision without changing the `source_type` constraint.
docs/discovery-manual-crawler-pre-implementation-decisions.md:104:- Store source-level policy defaults in `discovery_sources.config`.
docs/discovery-manual-crawler-prototype-implementation-scope.md:85:- Current `discovery_sources.source_type` allows `manual` but not `manual_curated_urls`.
docs/discovery-manual-crawler-prototype-implementation-scope.md:188:- `discovery_sources` can represent the first source as `source_type = 'manual'` with `config` metadata indicating `manual_curated_urls`.
docs/discovery-manual-crawler-prototype-implementation-scope.md:197:- Add `manual_curated_urls` to the `discovery_sources.source_type` constraint if the exact source type must be stored as a first-class value.
docs/discovery-manual-crawler-prototype-implementation-scope.md:199:- Add source approval/risk/policy-review fields to `discovery_sources` if `config` is not sufficient for reviewed MVP policy metadata.
docs/discovery-phase-10a-candidate-extraction-staging-pipeline-planning.md:17:- `public.discovery_candidate_tools.discovery_source_id` now exists as a nullable UUID column with a foreign key to `public.discovery_sources(id)`.
docs/discovery-phase-10a-candidate-extraction-staging-pipeline-planning.md:91:The pipeline should start with an approved `discovery_sources` row and an approved `discovery_runs` row.
docs/discovery-phase-10h-candidate-extraction-staging-pipeline-smoke-gate-plan.md:124:2. Create one controlled `discovery_sources` fixture.
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:42:- public.discovery_sources;
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:147:- references public.discovery_sources(id);
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:263:- foreign key discovery_source_id to public.discovery_sources(id);
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md:48:The current `discovery_sources` table includes:
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md:73:2. Derive source URL server-side from `public.discovery_sources.url` and run lineage.
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md:88:The provider must not rely solely on a live join to `discovery_sources.url` at staging time.
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md:102:- `discovery_sources.url` may be nullable;
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md:235:If `discovery_sources.url` exists and differs from `source_url_snapshot`, the provider should not silently replace the snapshot.
docs/discovery-phase-14c-c-preview-artifact-trusted-source-url-migration-draft.md:30:- do not rely solely on mutable nullable `discovery_sources.url`;
docs/discovery-phase-14k-a-controlled-reviewable-preview-artifact-preparation-gate.md:164:- optionally one controlled `discovery_sources` row if no safe existing source is available;
docs/discovery-phase-17b-admin-shell-browser-supabase-read-hardening-implementation-plan.md:120:L172: .from("discovery_sources")
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:195:| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 226 | `on public.discovery_sources for all using (false) with check (false);` |
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:305:| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 226 | `on public.discovery_sources for all using (false) with check (false);` |
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:534:  references public.discovery_sources(id)
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:730:create table if not exists public.discovery_sources (
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:752:  source_id uuid references public.discovery_sources(id) on delete cascade,
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:775:  source_id uuid references public.discovery_sources(id) on delete set null,
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:977:    references public.discovery_sources(id)
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:516:create table if not exists public.discovery_sources (
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:534:  source_id uuid references public.discovery_sources(id) on delete cascade,
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:612:create index if not exists discovery_sources_active_idx on public.discovery_sources (is_active);
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:636:alter table public.discovery_sources enable row level security;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:644:revoke all on public.discovery_sources from anon, authenticated;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:652:drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:653:create policy "Deny all access to discovery_sources"
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:654:on public.discovery_sources for all using (false) with check (false);
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:678:comment on table public.discovery_sources is 'Registry of sources for automated tool discovery.';
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:783:| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 226 | `on public.discovery_sources for all using (false) with check (false);` |
docs/discovery-phase-19t-candidate-decision-mutation-api-live-smoke-gate.md:76:discovery_sources
docs/discovery-phase-19v-candidate-decision-mutation-api-live-smoke-result.md:73:discovery_sources: 2cbc5296-d466-4f6d-957b-92e229cc8ea3
docs/discovery-phase-22ai-candidate-extraction-live-staging-target-context-read-only-discovery-approval-gate.md:142:### `discovery_sources`
docs/discovery-phase-22ao-f-admin-queue-ux-fail-closed-status-presentation-qa-accessibility-review.md:62:discovery_sources
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:37:The script exited non-zero because four `public.discovery_sources` status-count probes returned errors.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:116:ALLOWED_TABLES contains exactly public.discovery_sources and public.discovery_runs
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:157:public.discovery_sources
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:180:public.discovery_sources total_count ok=true count=1
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:181:public.discovery_sources latest_created_at ok=true value_present=true
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:182:public.discovery_sources latest_updated_at ok=true value_present=true
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:196:public.discovery_sources status_count:status:active ok=false error_class=""
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:197:public.discovery_sources status_count:status:inactive ok=false error_class=""
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:198:public.discovery_sources status_count:status:paused ok=false error_class=""
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:199:public.discovery_sources status_count:status:blocked ok=false error_class=""
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:209:- `public.discovery_sources` was reachable.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:217:- Four `public.discovery_sources` status-count checks returned errors.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:218:- The errors appear tied specifically to the selected `public.discovery_sources.status` values.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:219:- The failure was not a table reachability failure because `public.discovery_sources` count and timestamp checks succeeded.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:225:discovery_sources status-value contract mismatch or status-column query contract mismatch
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:262:Controlled live-readiness probe reached execution and failed closed on discovery_sources status-count contract.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:281:- Decide whether `public.discovery_sources.status` should be probed at all.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:283:- Decide whether `discovery_sources` status counts should be removed from the first infrastructure probe.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:293:1. Remove `discovery_sources` status-count checks from the first live probe and keep only count/timestamp checks for `public.discovery_sources`.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:294:2. Replace hardcoded `discovery_sources` status values with known-valid values from existing schema documentation if available.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:305:The failure is useful: it identified a narrow status-contract mismatch in `public.discovery_sources`.
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:49:public.discovery_sources total_count ok=true count=1
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:50:public.discovery_sources latest_created_at ok=true value_present=true
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:51:public.discovery_sources latest_updated_at ok=true value_present=true
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:65:public.discovery_sources status_count:status:active ok=false error_class=""
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:66:public.discovery_sources status_count:status:inactive ok=false error_class=""
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:67:public.discovery_sources status_count:status:paused ok=false error_class=""
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:68:public.discovery_sources status_count:status:blocked ok=false error_class=""
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:122:4. `public.discovery_sources` was reachable.
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:126:8. `public.discovery_sources.status` did not match the hardcoded status-count query contract or returned errors for the attempted values.
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:132:The script currently reports the failed `public.discovery_sources` status-count checks with empty `error_class` values:
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:281:public.discovery_sources
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:289:1. Keep the current `public.discovery_sources.status` attempted values and produce better serialized errors, or
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:290:2. Temporarily disable `public.discovery_sources.status` count checks only after Gemini approves that the first infrastructure probe should be count/timestamp-only for discovery sources.
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:330:- `ALLOWED_TABLES` remains exactly `public.discovery_sources` and `public.discovery_runs`.
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:386:2. Is the conclusion correct that the immediate problem is insufficient error serialization for `public.discovery_sources.status` failures?
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:390:6. Should the next phase improve error serialization before modifying the `discovery_sources.status` contract?
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:39:public.discovery_sources status_count:status:active ok=false error_class=""
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:40:public.discovery_sources status_count:status:inactive ok=false error_class=""
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:41:public.discovery_sources status_count:status:paused ok=false error_class=""
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:42:public.discovery_sources status_count:status:blocked ok=false error_class=""
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:133:{"table":"public.discovery_sources","check":"status_count:status:active","ok":false,"error_class":""}
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:222:  "table": "public.discovery_sources",
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:319:  "table": "public.discovery_sources",
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:367:public.discovery_sources
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:406:- `public.discovery_sources` remains allowlisted.
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:438:9. Whether a future retry should keep or remove `discovery_sources.status` counts.
docs/discovery-phase-25ae-read-only-live-inspection-retry-approval-preflight-gate.md:36:The failure was limited to `public.discovery_sources.status` aggregate status-count probes.
docs/discovery-phase-25ae-read-only-live-inspection-retry-approval-preflight-gate.md:156:  - `public.discovery_sources`
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:37:The retry exited non-zero because four `public.discovery_sources.status` aggregate status-count checks still failed.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:113:public.discovery_sources
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:137:public.discovery_sources total_count ok=true actual_count_if_succeeded=1
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:138:public.discovery_sources latest_created_at ok=true value_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:139:public.discovery_sources latest_updated_at ok=true value_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:154:public.discovery_sources status_count active ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:155:public.discovery_sources status_count inactive ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:156:public.discovery_sources status_count paused ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:157:public.discovery_sources status_count blocked ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:160:The structured serialized fields for each failed `public.discovery_sources.status` check were:
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:174:- `public.discovery_sources` is reachable.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:175:- `public.discovery_sources` count succeeds.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:176:- `public.discovery_sources` timestamp probes succeed.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:179:- Only `public.discovery_sources.status` aggregate status-count probes fail.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:188:Controlled failed-closed retry with structured but still unavailable Supabase error details for discovery_sources.status checks.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:234:- Review why `public.discovery_sources.status` aggregate checks fail while count/timestamps succeed.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:247:3. Modify the probe to omit `discovery_sources.status` checks if Gemini approves infrastructure readiness as count/timestamp-only for sources.
... truncated: 639 total lines, showing first 120 ...
\`\`\`

## Evidence: direct \`discovery_sources.status\` contract references

\`\`\`text
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:37:The script exited non-zero because four `public.discovery_sources` status-count probes returned errors.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:196:public.discovery_sources status_count:status:active ok=false error_class=""
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:197:public.discovery_sources status_count:status:inactive ok=false error_class=""
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:198:public.discovery_sources status_count:status:paused ok=false error_class=""
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:199:public.discovery_sources status_count:status:blocked ok=false error_class=""
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:217:- Four `public.discovery_sources` status-count checks returned errors.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:218:- The errors appear tied specifically to the selected `public.discovery_sources.status` values.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:225:discovery_sources status-value contract mismatch or status-column query contract mismatch
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:262:Controlled live-readiness probe reached execution and failed closed on discovery_sources status-count contract.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:281:- Decide whether `public.discovery_sources.status` should be probed at all.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:283:- Decide whether `discovery_sources` status counts should be removed from the first infrastructure probe.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:293:1. Remove `discovery_sources` status-count checks from the first live probe and keep only count/timestamp checks for `public.discovery_sources`.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:294:2. Replace hardcoded `discovery_sources` status values with known-valid values from existing schema documentation if available.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:305:The failure is useful: it identified a narrow status-contract mismatch in `public.discovery_sources`.
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:65:public.discovery_sources status_count:status:active ok=false error_class=""
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:66:public.discovery_sources status_count:status:inactive ok=false error_class=""
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:67:public.discovery_sources status_count:status:paused ok=false error_class=""
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:68:public.discovery_sources status_count:status:blocked ok=false error_class=""
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:126:8. `public.discovery_sources.status` did not match the hardcoded status-count query contract or returned errors for the attempted values.
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:132:The script currently reports the failed `public.discovery_sources` status-count checks with empty `error_class` values:
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:289:1. Keep the current `public.discovery_sources.status` attempted values and produce better serialized errors, or
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:290:2. Temporarily disable `public.discovery_sources.status` count checks only after Gemini approves that the first infrastructure probe should be count/timestamp-only for discovery sources.
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:386:2. Is the conclusion correct that the immediate problem is insufficient error serialization for `public.discovery_sources.status` failures?
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:390:6. Should the next phase improve error serialization before modifying the `discovery_sources.status` contract?
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:39:public.discovery_sources status_count:status:active ok=false error_class=""
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:40:public.discovery_sources status_count:status:inactive ok=false error_class=""
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:41:public.discovery_sources status_count:status:paused ok=false error_class=""
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:42:public.discovery_sources status_count:status:blocked ok=false error_class=""
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:133:{"table":"public.discovery_sources","check":"status_count:status:active","ok":false,"error_class":""}
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:438:9. Whether a future retry should keep or remove `discovery_sources.status` counts.
docs/discovery-phase-25ae-read-only-live-inspection-retry-approval-preflight-gate.md:36:The failure was limited to `public.discovery_sources.status` aggregate status-count probes.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:37:The retry exited non-zero because four `public.discovery_sources.status` aggregate status-count checks still failed.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:154:public.discovery_sources status_count active ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:155:public.discovery_sources status_count inactive ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:156:public.discovery_sources status_count paused ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:157:public.discovery_sources status_count blocked ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:160:The structured serialized fields for each failed `public.discovery_sources.status` check were:
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:179:- Only `public.discovery_sources.status` aggregate status-count probes fail.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:188:Controlled failed-closed retry with structured but still unavailable Supabase error details for discovery_sources.status checks.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:234:- Review why `public.discovery_sources.status` aggregate checks fail while count/timestamps succeed.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:247:3. Modify the probe to omit `discovery_sources.status` checks if Gemini approves infrastructure readiness as count/timestamp-only for sources.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:255:3. Is the repeated failure isolated to `public.discovery_sources.status` aggregate status-count checks?
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:11:This phase analyzes the repeated `public.discovery_sources.status` aggregate status-count failure and plans the next safe diagnostic direction.
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:40:actual_query_succeeded=false means the public.discovery_sources.status aggregate queries did not succeed.
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:68:public.discovery_sources status_count active ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:69:public.discovery_sources status_count inactive ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:70:public.discovery_sources status_count paused ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:71:public.discovery_sources status_count blocked ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:89:- Analyze possible causes of the `public.discovery_sources.status` aggregate query failure.
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:134:The repeated failure is narrow. Count and timestamp probes on `public.discovery_sources` succeed, but status-value-filtered count probes fail.
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:138:1. `public.discovery_sources.status` column does not exist.
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:178:- Review migrations, type files, and source references for `discovery_sources.status`.
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:183:- Determine whether the local repo expects a `status` column on `public.discovery_sources`.
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:253:### Option E — Remove `discovery_sources.status` from readiness contract
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:257:This would preserve count/timestamp readiness for `discovery_sources` and keep `discovery_runs.status` checks.
docs/discovery-phase-25ai-discovery-sources-status-contract-local-schema-review-planning-gate.md:11:This phase plans a local repository schema review for the repeated `public.discovery_sources.status` aggregate status-count failure.
docs/discovery-phase-25ai-discovery-sources-status-contract-local-schema-review-planning-gate.md:40:public.discovery_sources.status
docs/discovery-phase-25ai-discovery-sources-status-contract-local-schema-review-planning-gate.md:54:1. Does the repository define a `status` column on `public.discovery_sources`?
docs/discovery-phase-25ai-discovery-sources-status-contract-local-schema-review-planning-gate.md:204:interpretation=<what this implies for discovery_sources.status contract>
docs/discovery-phase-25ai-discovery-sources-status-contract-local-schema-review-planning-gate.md:240:public.discovery_sources.status
docs/discovery-phase-25ai-discovery-sources-status-contract-local-schema-review-planning-gate.md:270:Use if local schema does not define `public.discovery_sources.status`.
docs/discovery-phase-25ai-discovery-sources-status-contract-local-schema-review-planning-gate.md:274:- The inspection script should likely remove or replace `discovery_sources.status` checks.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:612:docs/discovery-phase-22ao-f-admin-queue-ux-fail-closed-status-presentation-qa-accessibility-review.md:62:discovery_sources
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:613:docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:37:The script exited non-zero because four `public.discovery_sources` status-count probes returned errors.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:619:docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:196:public.discovery_sources status_count:status:active ok=false error_class=""
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:620:docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:197:public.discovery_sources status_count:status:inactive ok=false error_class=""
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:621:docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:198:public.discovery_sources status_count:status:paused ok=false error_class=""
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:622:docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:199:public.discovery_sources status_count:status:blocked ok=false error_class=""
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:624:docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:217:- Four `public.discovery_sources` status-count checks returned errors.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:625:docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:218:- The errors appear tied specifically to the selected `public.discovery_sources.status` values.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:627:docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:225:discovery_sources status-value contract mismatch or status-column query contract mismatch
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:628:docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:262:Controlled live-readiness probe reached execution and failed closed on discovery_sources status-count contract.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:629:docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:281:- Decide whether `public.discovery_sources.status` should be probed at all.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:630:docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:283:- Decide whether `discovery_sources` status counts should be removed from the first infrastructure probe.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:631:docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:293:1. Remove `discovery_sources` status-count checks from the first live probe and keep only count/timestamp checks for `public.discovery_sources`.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:632:docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:294:2. Replace hardcoded `discovery_sources` status values with known-valid values from existing schema documentation if available.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:633:docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:305:The failure is useful: it identified a narrow status-contract mismatch in `public.discovery_sources`.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:637:docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:65:public.discovery_sources status_count:status:active ok=false error_class=""
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:638:docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:66:public.discovery_sources status_count:status:inactive ok=false error_class=""
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:639:docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:67:public.discovery_sources status_count:status:paused ok=false error_class=""
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:640:docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:68:public.discovery_sources status_count:status:blocked ok=false error_class=""
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:642:docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:126:8. `public.discovery_sources.status` did not match the hardcoded status-count query contract or returned errors for the attempted values.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:643:docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:132:The script currently reports the failed `public.discovery_sources` status-count checks with empty `error_class` values:
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:645:docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:289:1. Keep the current `public.discovery_sources.status` attempted values and produce better serialized errors, or
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:646:docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:290:2. Temporarily disable `public.discovery_sources.status` count checks only after Gemini approves that the first infrastructure probe should be count/timestamp-only for discovery sources.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:648:docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:386:2. Is the conclusion correct that the immediate problem is insufficient error serialization for `public.discovery_sources.status` failures?
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:649:docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:390:6. Should the next phase improve error serialization before modifying the `discovery_sources.status` contract?
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:650:docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:39:public.discovery_sources status_count:status:active ok=false error_class=""
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:651:docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:40:public.discovery_sources status_count:status:inactive ok=false error_class=""
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:652:docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:41:public.discovery_sources status_count:status:paused ok=false error_class=""
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:653:docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:42:public.discovery_sources status_count:status:blocked ok=false error_class=""
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:654:docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:133:{"table":"public.discovery_sources","check":"status_count:status:active","ok":false,"error_class":""}
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:659:docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:438:9. Whether a future retry should keep or remove `discovery_sources.status` counts.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:660:docs/discovery-phase-25ae-read-only-live-inspection-retry-approval-preflight-gate.md:36:The failure was limited to `public.discovery_sources.status` aggregate status-count probes.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:662:docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:37:The retry exited non-zero because four `public.discovery_sources.status` aggregate status-count checks still failed.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:667:docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:154:public.discovery_sources status_count active ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:668:docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:155:public.discovery_sources status_count inactive ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:669:docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:156:public.discovery_sources status_count paused ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:670:docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:157:public.discovery_sources status_count blocked ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:671:docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:160:The structured serialized fields for each failed `public.discovery_sources.status` check were:
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:675:docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:179:- Only `public.discovery_sources.status` aggregate status-count probes fail.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:676:docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:188:Controlled failed-closed retry with structured but still unavailable Supabase error details for discovery_sources.status checks.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:677:docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:234:- Review why `public.discovery_sources.status` aggregate checks fail while count/timestamps succeed.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:678:docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:247:3. Modify the probe to omit `discovery_sources.status` checks if Gemini approves infrastructure readiness as count/timestamp-only for sources.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:679:docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:255:3. Is the repeated failure isolated to `public.discovery_sources.status` aggregate status-count checks?
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:680:docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:11:This phase analyzes the repeated `public.discovery_sources.status` aggregate status-count failure and plans the next safe diagnostic direction.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:681:docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:40:actual_query_succeeded=false means the public.discovery_sources.status aggregate queries did not succeed.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:682:docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:49:public.discovery_sources total_count ok=true actual_count_if_succeeded=1
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:683:docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:50:public.discovery_sources latest_created_at ok=true value_present=true
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:684:docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:51:public.discovery_sources latest_updated_at ok=true value_present=true
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:685:docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:68:public.discovery_sources status_count active ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:686:docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:69:public.discovery_sources status_count inactive ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:687:docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:70:public.discovery_sources status_count paused ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:688:docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:71:public.discovery_sources status_count blocked ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:689:docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:89:- Analyze possible causes of the `public.discovery_sources.status` aggregate query failure.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:690:docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:109:- No broadening beyond `public.discovery_sources` and `public.discovery_runs`.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:691:docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:134:The repeated failure is narrow. Count and timestamp probes on `public.discovery_sources` succeed, but status-value-filtered count probes fail.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:692:docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:138:1. `public.discovery_sources.status` column does not exist.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:693:docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:178:- Review migrations, type files, and source references for `discovery_sources.status`.
docs/discovery-phase-25aj-discovery-sources-status-contract-local-schema-review-execution-result.md:694:docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:183:- Determine whether the local repo expects a `status` column on `public.discovery_sources`.
... truncated: 234 total lines, showing first 120 ...
\`\`\`

## Evidence: migration references to `discovery_sources`

\`\`\`text
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:35:create table if not exists public.discovery_sources (
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:53:  source_id uuid references public.discovery_sources(id) on delete cascade,
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:72:  source_id uuid references public.discovery_sources(id) on delete set null,
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:160:create index if not exists discovery_sources_active_idx on public.discovery_sources (is_active);
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:186:drop trigger if exists set_discovery_sources_updated_at on public.discovery_sources;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:187:create trigger set_discovery_sources_updated_at
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:188:before update on public.discovery_sources
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:208:alter table public.discovery_sources enable row level security;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:216:revoke all on public.discovery_sources from anon, authenticated;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:224:drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:225:create policy "Deny all access to discovery_sources"
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:226:on public.discovery_sources for all using (false) with check (false);
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:249:comment on table public.discovery_sources is 'Registry of sources for automated tool discovery.';
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql:23:  references public.discovery_sources(id)
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:15:    references public.discovery_sources(id)
\`\`\`

## Evidence: migration references to `status`

\`\`\`text
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:61:    where status = 'pending'
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:90:    where submitted_tools.status = 'pending'
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:115:  and status = 'pending';
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:139:        and submitted_tools.status = 'pending'
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:154:  if new.status = 'pending'
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:205:    where submitted_tools.status = 'pending'
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:220:before insert or update of website, status
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:248:    and status = 'pending'
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:300:  set status = 'approved'
supabase/migrations/20260602000100_add_normalized_domain_duplicate_protection.sql:302:    and status = 'pending';
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:22:  status text not null default 'pending',
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:31:  constraint discovered_tools_status_check
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:33:      status in (
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:53:create index if not exists discovered_tools_status_idx
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:54:on public.discovered_tools (status);
supabase/migrations/20260602000200_create_discovered_tools_queue.sql:65:  and status in ('pending', 'needs_review');
supabase/migrations/20260612000100_create_homepage_control_room.sql:11:  status text not null check (status in ('draft', 'preview', 'published', 'archived')),
supabase/migrations/20260612000100_create_homepage_control_room.sql:30:  where is_active = true and status = 'published';
supabase/migrations/20260612000100_create_homepage_control_room.sql:32:create index if not exists homepage_control_configs_status_idx
supabase/migrations/20260612000100_create_homepage_control_room.sql:33:  on public.homepage_control_configs (status);
supabase/migrations/20260612000100_create_homepage_control_room.sql:110:where status = 'published'
supabase/migrations/20260612000300_publish_homepage_control_config.sql:7:-- - Require preview status, completed required checklist items, and a preview audit event.
supabase/migrations/20260612000300_publish_homepage_control_config.sql:49:  if v_target.status <> 'preview' then
supabase/migrations/20260612000300_publish_homepage_control_config.sql:50:    raise exception 'Homepage Control Room config % must be in preview status before publish. Current status: %.',
supabase/migrations/20260612000300_publish_homepage_control_config.sql:52:      v_target.status;
supabase/migrations/20260612000300_publish_homepage_control_config.sql:106:    status = 'published',
supabase/migrations/20260612000300_publish_homepage_control_config.sql:138:    'status', 'published',
supabase/migrations/20260615001110_updated-preview-checklist.sql:73:  if v_target.status <> 'preview' then
supabase/migrations/20260615001110_updated-preview-checklist.sql:74:    raise exception 'Homepage Control Room config % must be in preview status before publish. Current status: %.',
supabase/migrations/20260615001110_updated-preview-checklist.sql:76:      v_target.status;
supabase/migrations/20260615001110_updated-preview-checklist.sql:147:    status = 'published',
supabase/migrations/20260615001110_updated-preview-checklist.sql:180:    'status', 'published',
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:78:  add column if not exists status text;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:92:set status = 'approved'
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:93:where status is null
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:94:   or btrim(status) = '';
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:106:  alter column status set default 'approved';
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:109:  alter column status set not null;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:125:  drop constraint if exists tools_status_check;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:128:  add constraint tools_status_check
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:129:  check (status in ('approved', 'draft', 'archived'));
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:135:create index if not exists tools_status_idx
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:136:  on public.tools (status);
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:141:create index if not exists tools_status_deleted_at_slug_idx
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:142:  on public.tools (status, deleted_at, slug);
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:185:where status = 'approved'
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:200:  using (status = 'approved' and deleted_at is null);
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:223:--     drop index if exists public.tools_status_deleted_at_slug_idx;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:225:--     drop index if exists public.tools_status_idx;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:227:--     alter table public.tools drop constraint if exists tools_status_check;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:230:--     alter table public.tools drop column if exists status;
supabase/migrations/20260615002000_draft_public_safe_tools_schema.sql:235:--   has started depending on canonical slugs/status/deleted_at.
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:2:-- Ensures approved submissions create tools with explicit canonical slug/status
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:20:    and status = 'pending'
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:64:    status,
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:94:  set status = 'approved'
supabase/migrations/20260616003000_patch_approve_submitted_tool_slug_status.sql:96:    and status = 'pending';
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:54:  status text not null check (status in ('pending', 'running', 'completed', 'failed')),
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:80:  status text not null default 'new' check (status in ('new', 'pending_review', 'approved', 'rejected', 'ignored', 'duplicate')),
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:161:create index if not exists discovery_runs_status_idx on public.discovery_runs (status);
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql:168:create index if not exists discovered_tools_status_idx on public.discovered_tools (status);
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:38:  if candidate.status = 'approved' and candidate.approved_tool_id is not null then
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:42:  if candidate.status = 'approved' and candidate.approved_tool_id is null then
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:47:  if candidate.status not in ('new', 'pending_review') then
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:48:    raise exception 'Discovered tool must be new or pending_review before approval. Current status: %',
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:49:      candidate.status;
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:105:    where submitted_tools.status = 'pending'
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:115:    status,
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:146:    status = 'approved',
supabase/migrations/20260617004000_create_approve_discovered_tool_rpc.sql:170:      'previous_status', candidate.status,
supabase/migrations/20260617004500_seed_discovery_queue_smoke_test.sql:8:  status,
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:36:  duplicate_check_status text not null default 'not_checked',
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:44:  candidate_status text not null default 'staged',
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:52:  cleanup_status text not null default 'active',
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:133:  constraint discovery_candidate_tools_duplicate_check_status_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:134:    check (duplicate_check_status in ('not_checked', 'pending', 'suspected', 'blocked', 'cleared')),
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:138:  constraint discovery_candidate_tools_candidate_status_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:139:    check (candidate_status in ('staged', 'needs_review', 'duplicate_suspected', 'rejected', 'archived')),
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:140:  constraint discovery_candidate_tools_no_approval_status_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:141:    check (lower(candidate_status) not in ('approved', 'published', 'promoted', 'live', 'public')),
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:147:  constraint discovery_candidate_tools_cleanup_status_check
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:148:    check (cleanup_status in ('active', 'cleanup_eligible', 'archived'))
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:154:create index if not exists discovery_candidate_tools_candidate_status_idx
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:155:  on public.discovery_candidate_tools (candidate_status);
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:161:  on public.discovery_candidate_tools (candidate_status, created_at desc);
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:172:create index if not exists discovery_candidate_tools_duplicate_check_status_idx
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:173:  on public.discovery_candidate_tools (duplicate_check_status);
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:176:  on public.discovery_candidate_tools (cleanup_status, eligible_for_cleanup_at);
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:180:  where candidate_status in ('staged', 'needs_review', 'duplicate_suspected');
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:217:comment on column public.discovery_candidate_tools.candidate_status is
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql:218:  'Staging-only lifecycle status; production-state statuses are forbidden.';
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:25:  preview_status text not null default 'pending_review',
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:48:  constraint discovery_candidate_preview_artifacts_status_check
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:50:      preview_status in (
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:136:      preview_status <> 'reviewable'
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:158:create index if not exists discovery_candidate_preview_artifacts_status_idx
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:159:  on public.discovery_candidate_preview_artifacts (preview_status);
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:175:  where preview_status = 'reviewable';
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:212:comment on column public.discovery_candidate_preview_artifacts.preview_status is
supabase/migrations/20260628150430_create_discovery_candidate_preview_artifacts.sql:213:  'Preview lifecycle status; only reviewable artifacts may be displayed as actionable previews by future provider logic.';
supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql:68:    preview_status <> 'reviewable'
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:15:-- - Add a new named candidate_status CHECK constraint.
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:16:-- - Do not drop guessed candidate_status constraints.
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:48:-- Phase 19K-R2 recovery patch: explicitly replace the existing candidate status CHECK.
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:52:    DROP CONSTRAINT IF EXISTS discovery_candidate_tools_candidate_status_check;
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:55:    ADD CONSTRAINT discovery_candidate_tools_candidate_status_check
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:57:      candidate_status IN (
supabase/migrations/20260701190000_candidate_staging_queue_decision_schema_expansion.sql:71:  VALIDATE CONSTRAINT discovery_candidate_tools_candidate_status_check;
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:30:  candidate_status text,
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:47:  v_next_status text;
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:95:      v_next_status := 'approved_for_draft';
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:98:      v_next_status := 'rejected';
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:101:      v_next_status := 'duplicate';
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:104:      v_next_status := 'needs_more_evidence';
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:107:      v_next_status := 'archived';
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:125:  if v_candidate.candidate_status not in (
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:162:    candidate_status = v_next_status,
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:175:    and candidate.candidate_status in (
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:201:      'previous_candidate_status', v_candidate.candidate_status,
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:202:      'next_candidate_status', v_updated.candidate_status,
supabase/migrations/20260702190000_candidate_decision_mutation_rpc.sql:214:    v_updated.candidate_status,
\`\`\`

## Evidence: type/schema references to discovery sources

\`\`\`text
app/api/admin/discovery/discovered-tools/[id]/route.ts:116:          .from("discovery_sources")
app/api/admin/discovery/discovered-tools/route.ts:172:        .from("discovery_sources")
app/api/admin/discovery/discovered-tools/route.ts:182:    return jsonResponse({ error: "Failed to fetch discovery sources." }, 500);
app/api/admin/discovery/intake/route.ts:392:        .from("discovery_sources")
app/api/admin/discovery/intake/route.ts:616:      .from("discovery_sources")
app/api/admin/discovery/runs/manual/claim/route.ts:1811:    .from("discovery_sources")
app/api/admin/discovery/runs/manual/route.ts:108:    .from("discovery_sources")
app/api/admin/discovery/sources/[id]/route.ts:316:        .from("discovery_sources")
app/api/admin/discovery/sources/[id]/route.ts:327:      return jsonResponse({ error: "Failed to check discovery sources." }, 500);
app/api/admin/discovery/sources/[id]/route.ts:342:    .from("discovery_sources")
app/api/admin/discovery/sources/[id]/route.ts:360:    .from("discovery_sources")
app/api/admin/discovery/sources/route.ts:158:    .from("discovery_sources")
app/api/admin/discovery/sources/route.ts:193:    return jsonResponse({ error: "Failed to fetch discovery sources." }, 500);
app/api/admin/discovery/sources/route.ts:281:    .from("discovery_sources")
app/api/admin/discovery/sources/route.ts:291:    return jsonResponse({ error: "Failed to check discovery sources." }, 500);
app/api/admin/discovery/sources/route.ts:305:    .from("discovery_sources")
components/admin/admin-dashboard-client.tsx:14:import { DiscoverySourcesPanel } from "./discovery/discovery-sources-panel";
components/admin/admin-dashboard-client.tsx:1314:        throw new Error(payload.error || "Failed to load discovery sources.");
components/admin/admin-dashboard-client.tsx:4354:          {view === "discovery" && <DiscoverySourcesPanel />}
components/admin/discovery/discovery-queue-table.tsx:284:        throw new Error("Failed to load discovery sources.");
components/admin/discovery/discovery-sources-panel.tsx:89:export function DiscoverySourcesPanel() {
components/admin/discovery/discovery-sources-panel.tsx:154:        throw new Error(payload.error || "Failed to load discovery sources.");
components/admin/discovery/discovery-sources-panel.tsx:171:          : "Failed to load discovery sources."
components/admin/discovery/discovery-sources-panel.tsx:475:            Loading discovery sources...
components/admin/discovery/discovery-sources-panel.tsx:479:            No discovery sources found for this filter.
docs/discovery-manual-crawler-pre-implementation-decisions.md:17:- Use existing `discovery_sources.source_type = 'manual'`.
docs/discovery-manual-crawler-pre-implementation-decisions.md:28:- Mapping `manual_curated_urls` into `discovery_sources.config.kind` preserves the first prototype source decision without changing the `source_type` constraint.
docs/discovery-manual-crawler-pre-implementation-decisions.md:104:- Store source-level policy defaults in `discovery_sources.config`.
docs/discovery-manual-crawler-prototype-implementation-scope.md:85:- Current `discovery_sources.source_type` allows `manual` but not `manual_curated_urls`.
docs/discovery-manual-crawler-prototype-implementation-scope.md:140:- Prefer integrating into the existing Discovery admin surface beside `DiscoveryRunsTable` and `DiscoverySourcesPanel`.
docs/discovery-manual-crawler-prototype-implementation-scope.md:188:- `discovery_sources` can represent the first source as `source_type = 'manual'` with `config` metadata indicating `manual_curated_urls`.
docs/discovery-manual-crawler-prototype-implementation-scope.md:197:- Add `manual_curated_urls` to the `discovery_sources.source_type` constraint if the exact source type must be stored as a first-class value.
docs/discovery-manual-crawler-prototype-implementation-scope.md:199:- Add source approval/risk/policy-review fields to `discovery_sources` if `config` is not sufficient for reviewed MVP policy metadata.
docs/discovery-phase-10a-candidate-extraction-staging-pipeline-planning.md:17:- `public.discovery_candidate_tools.discovery_source_id` now exists as a nullable UUID column with a foreign key to `public.discovery_sources(id)`.
docs/discovery-phase-10a-candidate-extraction-staging-pipeline-planning.md:91:The pipeline should start with an approved `discovery_sources` row and an approved `discovery_runs` row.
docs/discovery-phase-10h-candidate-extraction-staging-pipeline-smoke-gate-plan.md:124:2. Create one controlled `discovery_sources` fixture.
docs/discovery-phase-13a-candidate-extraction-admin-ui-source-provider-design.md:17:This phase does not create, update, or delete discovery sources, discovery runs, candidate rows, audit rows, public tools, or discovered tools.
docs/discovery-phase-13b-candidate-preview-provider-implementation-plan.md:17:This phase does not create, update, or delete discovery sources, discovery runs, candidate rows, preview rows, audit rows, public tools, or discovered tools.
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:19:This phase does not create, update, or delete discovery sources, discovery runs, candidate rows, preview rows, audit rows, public tools, or discovered tools.
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:42:- public.discovery_sources;
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:147:- references public.discovery_sources(id);
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:263:- foreign key discovery_source_id to public.discovery_sources(id);
docs/discovery-phase-13i-admin-ui-read-only-preview-wiring-plan.md:11:This phase does not create, update, or delete discovery sources, discovery runs, preview artifacts, candidate rows, audit rows, public tools, or discovered tools.
docs/discovery-phase-14a-candidate-extraction-live-staging-activation-design-gate.md:13:This phase does not create, update, or delete discovery sources, discovery runs, preview artifacts, candidate rows, audit rows, public tools, or discovered tools.
docs/discovery-phase-14a-candidate-extraction-live-staging-activation-design-gate.md:87:It must not mutate discovery sources or discovery runs except for separately approved audit behavior.
docs/discovery-phase-14b-candidate-extraction-live-staging-backend-activation-implementation-plan.md:13:This phase does not create, update, or delete discovery sources, discovery runs, preview artifacts, candidate rows, audit rows, public tools, or discovered tools.
docs/discovery-phase-14b-candidate-extraction-live-staging-backend-activation-implementation-plan.md:427:- mutating discovery sources;
docs/discovery-phase-14c-a-preview-to-staging-mapper-source-url-decision-patch.md:13:This phase does not create, update, or delete discovery sources, discovery runs, preview artifacts, candidate rows, audit rows, public tools, or discovered tools.
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md:17:This phase does not create, update, or delete discovery sources, discovery runs, preview artifacts, candidate rows, audit rows, public tools, or discovered tools.
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md:48:The current `discovery_sources` table includes:
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md:73:2. Derive source URL server-side from `public.discovery_sources.url` and run lineage.
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md:88:The provider must not rely solely on a live join to `discovery_sources.url` at staging time.
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md:102:- `discovery_sources.url` may be nullable;
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md:235:If `discovery_sources.url` exists and differs from `source_url_snapshot`, the provider should not silently replace the snapshot.
docs/discovery-phase-14c-c-preview-artifact-trusted-source-url-migration-draft.md:17:This phase does not create, update, or delete discovery sources, discovery runs, preview artifacts, candidate rows, audit rows, public tools, or discovered tools.
docs/discovery-phase-14c-c-preview-artifact-trusted-source-url-migration-draft.md:30:- do not rely solely on mutable nullable `discovery_sources.url`;
docs/discovery-phase-14c-d-preview-artifact-trusted-source-url-schema-application-gate.md:15:This document does not create, update, or delete discovery sources, discovery runs, preview artifacts, candidate rows, audit rows, public tools, or discovered tools.
docs/discovery-phase-14c-d-preview-artifact-trusted-source-url-schema-application-gate.md:112:- editing discovery sources or runs;
docs/discovery-phase-14k-a-controlled-reviewable-preview-artifact-preparation-gate.md:164:- optionally one controlled `discovery_sources` row if no safe existing source is available;
docs/discovery-phase-17b-admin-shell-browser-supabase-read-hardening-implementation-plan.md:120:L172: .from("discovery_sources")
docs/discovery-phase-19d-candidate-staging-queue-decision-schema-expansion-migration-design.md:748:L327: return jsonResponse({ error: "Failed to check discovery sources." }, 500);
docs/discovery-phase-19d-candidate-staging-queue-decision-schema-expansion-migration-design.md:763:L291: return jsonResponse({ error: "Failed to check discovery sources." }, 500);
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:195:| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 226 | `on public.discovery_sources for all using (false) with check (false);` |
docs/discovery-phase-19e-candidate-staging-queue-decision-schema-constraint-name-inspection.md:305:| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 226 | `on public.discovery_sources for all using (false) with check (false);` |
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:534:  references public.discovery_sources(id)
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:730:create table if not exists public.discovery_sources (
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:752:  source_id uuid references public.discovery_sources(id) on delete cascade,
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:775:  source_id uuid references public.discovery_sources(id) on delete set null,
docs/discovery-phase-19f-candidate-staging-queue-decision-schema-manual-constraint-confirmation.md:977:    references public.discovery_sources(id)
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:516:create table if not exists public.discovery_sources (
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:534:  source_id uuid references public.discovery_sources(id) on delete cascade,
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:612:create index if not exists discovery_sources_active_idx on public.discovery_sources (is_active);
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:636:alter table public.discovery_sources enable row level security;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:644:revoke all on public.discovery_sources from anon, authenticated;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:652:drop policy if exists "Deny all access to discovery_sources" on public.discovery_sources;
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:653:create policy "Deny all access to discovery_sources"
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:654:on public.discovery_sources for all using (false) with check (false);
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:678:comment on table public.discovery_sources is 'Registry of sources for automated tool discovery.';
docs/discovery-phase-19g-candidate-staging-queue-decision-schema-reality-reconciliation-strategy.md:783:| `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql` | 226 | `on public.discovery_sources for all using (false) with check (false);` |
docs/discovery-phase-19t-candidate-decision-mutation-api-live-smoke-gate.md:76:discovery_sources
docs/discovery-phase-19v-candidate-decision-mutation-api-live-smoke-result.md:73:discovery_sources: 2cbc5296-d466-4f6d-957b-92e229cc8ea3
docs/discovery-phase-22ai-candidate-extraction-live-staging-target-context-read-only-discovery-approval-gate.md:142:### `discovery_sources`
docs/discovery-phase-22ao-f-admin-queue-ux-fail-closed-status-presentation-qa-accessibility-review.md:62:discovery_sources
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:37:The script exited non-zero because four `public.discovery_sources` status-count probes returned errors.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:116:ALLOWED_TABLES contains exactly public.discovery_sources and public.discovery_runs
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:157:public.discovery_sources
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:180:public.discovery_sources total_count ok=true count=1
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:181:public.discovery_sources latest_created_at ok=true value_present=true
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:182:public.discovery_sources latest_updated_at ok=true value_present=true
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:196:public.discovery_sources status_count:status:active ok=false error_class=""
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:197:public.discovery_sources status_count:status:inactive ok=false error_class=""
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:198:public.discovery_sources status_count:status:paused ok=false error_class=""
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:199:public.discovery_sources status_count:status:blocked ok=false error_class=""
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:209:- `public.discovery_sources` was reachable.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:217:- Four `public.discovery_sources` status-count checks returned errors.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:218:- The errors appear tied specifically to the selected `public.discovery_sources.status` values.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:219:- The failure was not a table reachability failure because `public.discovery_sources` count and timestamp checks succeeded.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:225:discovery_sources status-value contract mismatch or status-column query contract mismatch
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:262:Controlled live-readiness probe reached execution and failed closed on discovery_sources status-count contract.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:281:- Decide whether `public.discovery_sources.status` should be probed at all.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:283:- Decide whether `discovery_sources` status counts should be removed from the first infrastructure probe.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:293:1. Remove `discovery_sources` status-count checks from the first live probe and keep only count/timestamp checks for `public.discovery_sources`.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:294:2. Replace hardcoded `discovery_sources` status values with known-valid values from existing schema documentation if available.
docs/discovery-phase-25aa-read-only-live-infrastructure-inspection-result-documentation.md:305:The failure is useful: it identified a narrow status-contract mismatch in `public.discovery_sources`.
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:49:public.discovery_sources total_count ok=true count=1
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:50:public.discovery_sources latest_created_at ok=true value_present=true
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:51:public.discovery_sources latest_updated_at ok=true value_present=true
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:65:public.discovery_sources status_count:status:active ok=false error_class=""
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:66:public.discovery_sources status_count:status:inactive ok=false error_class=""
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:67:public.discovery_sources status_count:status:paused ok=false error_class=""
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:68:public.discovery_sources status_count:status:blocked ok=false error_class=""
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:122:4. `public.discovery_sources` was reachable.
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:126:8. `public.discovery_sources.status` did not match the hardcoded status-count query contract or returned errors for the attempted values.
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:132:The script currently reports the failed `public.discovery_sources` status-count checks with empty `error_class` values:
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:281:public.discovery_sources
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:289:1. Keep the current `public.discovery_sources.status` attempted values and produce better serialized errors, or
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:290:2. Temporarily disable `public.discovery_sources.status` count checks only after Gemini approves that the first infrastructure probe should be count/timestamp-only for discovery sources.
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:330:- `ALLOWED_TABLES` remains exactly `public.discovery_sources` and `public.discovery_runs`.
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:386:2. Is the conclusion correct that the immediate problem is insufficient error serialization for `public.discovery_sources.status` failures?
docs/discovery-phase-25ab-read-only-live-infrastructure-inspection-failure-review-error-serialization-planning-gate.md:390:6. Should the next phase improve error serialization before modifying the `discovery_sources.status` contract?
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:39:public.discovery_sources status_count:status:active ok=false error_class=""
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:40:public.discovery_sources status_count:status:inactive ok=false error_class=""
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:41:public.discovery_sources status_count:status:paused ok=false error_class=""
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:42:public.discovery_sources status_count:status:blocked ok=false error_class=""
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:133:{"table":"public.discovery_sources","check":"status_count:status:active","ok":false,"error_class":""}
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:222:  "table": "public.discovery_sources",
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:319:  "table": "public.discovery_sources",
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:367:public.discovery_sources
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:406:- `public.discovery_sources` remains allowlisted.
docs/discovery-phase-25ac-read-only-live-inspection-error-serialization-script-update-planning-gate.md:438:9. Whether a future retry should keep or remove `discovery_sources.status` counts.
docs/discovery-phase-25ae-read-only-live-inspection-retry-approval-preflight-gate.md:36:The failure was limited to `public.discovery_sources.status` aggregate status-count probes.
docs/discovery-phase-25ae-read-only-live-inspection-retry-approval-preflight-gate.md:156:  - `public.discovery_sources`
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:37:The retry exited non-zero because four `public.discovery_sources.status` aggregate status-count checks still failed.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:113:public.discovery_sources
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:137:public.discovery_sources total_count ok=true actual_count_if_succeeded=1
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:138:public.discovery_sources latest_created_at ok=true value_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:139:public.discovery_sources latest_updated_at ok=true value_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:154:public.discovery_sources status_count active ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:155:public.discovery_sources status_count inactive ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:156:public.discovery_sources status_count paused ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:157:public.discovery_sources status_count blocked ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:160:The structured serialized fields for each failed `public.discovery_sources.status` check were:
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:174:- `public.discovery_sources` is reachable.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:175:- `public.discovery_sources` count succeeds.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:176:- `public.discovery_sources` timestamp probes succeed.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:179:- Only `public.discovery_sources.status` aggregate status-count probes fail.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:188:Controlled failed-closed retry with structured but still unavailable Supabase error details for discovery_sources.status checks.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:234:- Review why `public.discovery_sources.status` aggregate checks fail while count/timestamps succeed.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:247:3. Modify the probe to omit `discovery_sources.status` checks if Gemini approves infrastructure readiness as count/timestamp-only for sources.
docs/discovery-phase-25ag-read-only-live-infrastructure-inspection-retry-result-documentation.md:255:3. Is the repeated failure isolated to `public.discovery_sources.status` aggregate status-count checks?
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:11:This phase analyzes the repeated `public.discovery_sources.status` aggregate status-count failure and plans the next safe diagnostic direction.
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:40:actual_query_succeeded=false means the public.discovery_sources.status aggregate queries did not succeed.
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:49:public.discovery_sources total_count ok=true actual_count_if_succeeded=1
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:50:public.discovery_sources latest_created_at ok=true value_present=true
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:51:public.discovery_sources latest_updated_at ok=true value_present=true
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:68:public.discovery_sources status_count active ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:69:public.discovery_sources status_count inactive ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:70:public.discovery_sources status_count paused ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:71:public.discovery_sources status_count blocked ok=false actual_query_succeeded=false actual_count_if_succeeded=unavailable error_present=true
docs/discovery-phase-25ah-discovery-sources-status-contract-failure-analysis-planning-gate.md:89:- Analyze possible causes of the `public.discovery_sources.status` aggregate query failure.
... truncated: 704 total lines, showing first 160 ...
\`\`\`

## Evidence: inspection-script and docs status contract references

\`\`\`text
docs/discovery-manual-crawler-async-executor-design.md:183:- No unexpected duplicate active run state exists for the same source when applicable.
docs/discovery-manual-crawler-async-executor-design.md:189:- The source is missing, inactive, or no longer eligible.
docs/discovery-manual-crawler-async-executor-design.md:345:- Non-stale active run for same source prevents unsafe claim.
docs/discovery-manual-crawler-implementation-plan.md:96:- Source must be active.
docs/discovery-manual-crawler-implementation-plan.md:114:6. Confirm source is active and approved.
docs/discovery-manual-crawler-pre-implementation-decisions.md:108:- Unknown or unclear policy means blocked until reviewed.
docs/discovery-manual-crawler-pre-implementation-decisions.md:118:    "unknown_policy_behavior": "blocked",
docs/discovery-manual-crawler-pre-implementation-decisions.md:143:- `blocked`
docs/discovery-manual-crawler-pre-implementation-decisions.md:150:- `blocked`: URL must not be fetched.
docs/discovery-manual-crawler-prototype-design.md:39:- Source must be active.
docs/discovery-manual-crawler-prototype-design.md:55:- Respect disallowed/blocked sources.
docs/discovery-manual-crawler-prototype-implementation-scope.md:121:- Reject malformed, unsafe, duplicate, non-HTTPS, credentialed, private-network, or policy-blocked URLs.
docs/discovery-manual-crawler-prototype-implementation-scope.md:128:- Insert blocking duplicate candidates when needed and keep approval blocked by review rules.
docs/discovery-manual-crawler-prototype-implementation-scope.md:164:- Confirm source is active and approved for the first manual prototype.
docs/discovery-manual-crawler-prototype-implementation-scope.md:168:- Prevent concurrent active runs for the same source.
docs/discovery-manual-crawler-prototype-implementation-scope.md:180:- Fetch disallowed, private-network, non-HTTPS, or policy-blocked URLs.
docs/discovery-manual-crawler-prototype-implementation-scope.md:247:- If access rules are unclear, treat the URL as blocked until reviewed.
docs/discovery-phase-10a-candidate-extraction-staging-pipeline-planning.md:284:- `cleanup_status: "active"`;
docs/discovery-phase-10a-candidate-extraction-staging-pipeline-planning.md:347:- mark duplicate status as `not_checked`, `pending`, `suspected`, `blocked`, or `cleared` only when supported by the existing normalizer contract;
docs/discovery-phase-10b-candidate-extraction-input-contract-mapper-design.md:59:  duplicateCheckStatus?: "not_checked" | "pending" | "suspected" | "blocked" | "cleared";
docs/discovery-phase-10c-candidate-extraction-mapper-implementation-plan.md:99:  duplicateCheckStatus?: "not_checked" | "pending" | "suspected" | "blocked" | "cleared";
docs/discovery-phase-10c-candidate-extraction-mapper-implementation-plan.md:291:- reject blocked hostnames/IPs;
docs/discovery-phase-10n-candidate-extraction-production-invocation-contract-implementation-plan.md:175:| `safety_flags` | Safe flags for blocked modes or unsafe inputs. |
docs/discovery-phase-10p-candidate-extraction-production-invocation-api-route-action-design.md:320:- live invocation blocked;
docs/discovery-phase-10r-candidate-extraction-invocation-api-route-live-verification-gate.md:38:- `dry_run: false` remains blocked with `live_invocation_not_enabled`.
docs/discovery-phase-10r-candidate-extraction-invocation-api-route-live-verification-gate.md:54:- The admin rate-limit boundary is active.
docs/discovery-phase-10r-candidate-extraction-invocation-api-route-live-verification-gate.md:59:- `dry_run: false` remains blocked.
docs/discovery-phase-10r-candidate-extraction-invocation-api-route-live-verification-gate.md:121:- No public publishing workflow should be active.
docs/discovery-phase-10r-candidate-extraction-invocation-api-route-live-verification-gate.md:122:- No crawler, LLM, scheduled job, background job, or live executor path should be active.
docs/discovery-phase-10t-candidate-extraction-invocation-route-result-review-admin-ui-wiring-readiness-gate.md:39:- `dry_run: false` remains blocked.
docs/discovery-phase-10u-candidate-extraction-admin-ui-dry-run-invocation-wiring-plan.md:34:- `dry_run: false` remains blocked.
docs/discovery-phase-10x-candidate-extraction-admin-ui-live-dry-run-verification-result.md:236:Phase 10Y should be a docs-only review of what the live UI dry-run means and what remains blocked before production extraction can ever be considered.
docs/discovery-phase-10y-candidate-extraction-admin-ui-live-dry-run-result-review-production-readiness-boundary.md:11:`dry_run: false` remains blocked.
docs/discovery-phase-10y-candidate-extraction-admin-ui-live-dry-run-result-review-production-readiness-boundary.md:186:This phrase is not active yet.
docs/discovery-phase-10y-candidate-extraction-admin-ui-live-dry-run-result-review-production-readiness-boundary.md:206:These hard stops remain active even after the successful admin UI live dry-run.
docs/discovery-phase-10z-candidate-extraction-manual-live-staging-readiness-design-gate.md:31:- `dry_run: false` remains blocked.
docs/discovery-phase-10z-candidate-extraction-manual-live-staging-readiness-design-gate.md:284:This phrase is not active in Phase 10Z.
docs/discovery-phase-10z-candidate-extraction-manual-live-staging-readiness-design-gate.md:288:It can only become active after a future Gemini-approved live staging gate explicitly defines the exact scope, command or UI action, row limits, cleanup, and verification plan.
docs/discovery-phase-10z-candidate-extraction-manual-live-staging-readiness-design-gate.md:324:- no live staging approval phrase active yet.
docs/discovery-phase-10z-candidate-extraction-manual-live-staging-readiness-design-gate.md:326:These hard stops remain active after Phase 10Z.
docs/discovery-phase-11a-candidate-extraction-manual-live-staging-contract-design.md:32:- `dry_run: false` remains blocked.
docs/discovery-phase-11a-candidate-extraction-manual-live-staging-contract-design.md:250:- it is not active now;
docs/discovery-phase-11a-candidate-extraction-manual-live-staging-contract-design.md:347:- `cleanup_status` must be `active`;
docs/discovery-phase-11a-candidate-extraction-manual-live-staging-contract-design.md:377:- migration `20260625171333_create_discovery_candidate_tools.sql` defines `discovery_candidate_tools_run_canonical_active_uidx` on `(discovery_run_id, candidate_canonical_url)` where `candidate_status in ('staged', 'needs_review', 'duplicate_suspected')`.
docs/discovery-phase-11a-candidate-extraction-manual-live-staging-contract-design.md:561:This phrase is not active in Phase 11A.
docs/discovery-phase-11a-candidate-extraction-manual-live-staging-contract-design.md:565:It can only become active after a future Gemini-approved live staging verification gate defines exact scope, row limits, cleanup, and verification steps.
docs/discovery-phase-11a-candidate-extraction-manual-live-staging-contract-design.md:604:- no live staging approval phrase active yet.
docs/discovery-phase-11a-candidate-extraction-manual-live-staging-contract-design.md:606:These hard stops remain active after Phase 11A.
docs/discovery-phase-11b-candidate-extraction-manual-live-staging-implementation-plan.md:17:All live staging approval phrases remain inactive.
docs/discovery-phase-11b-candidate-extraction-manual-live-staging-implementation-plan.md:47:- `dry_run: false` remains blocked;
docs/discovery-phase-11b-candidate-extraction-manual-live-staging-implementation-plan.md:52:- current admin UI live dry-run verification passed, but production writes remain blocked.
docs/discovery-phase-11b-candidate-extraction-manual-live-staging-implementation-plan.md:54:Placeholder approval phrase remains inactive:
docs/discovery-phase-11b-candidate-extraction-manual-live-staging-implementation-plan.md:142:- the placeholder phrase remains inactive in Phase 11B;
docs/discovery-phase-11b-candidate-extraction-manual-live-staging-implementation-plan.md:297:- route keeps `dry_run: false` blocked unless a server-side gate permits it;
docs/discovery-phase-11b-candidate-extraction-manual-live-staging-implementation-plan.md:551:- staging table has unique index `discovery_candidate_tools_run_canonical_active_uidx` on `(discovery_run_id, candidate_canonical_url)` for active statuses.
docs/discovery-phase-11b-candidate-extraction-manual-live-staging-implementation-plan.md:734:The phrase remains inactive now:
docs/discovery-phase-11b-candidate-extraction-manual-live-staging-implementation-plan.md:767:- no `dry_run: false` active path today;
docs/discovery-phase-11b-candidate-extraction-manual-live-staging-implementation-plan.md:779:- no active live staging approval phrase.
docs/discovery-phase-11d-candidate-extraction-manual-live-staging-verification-gate.md:9:`dry_run: false` remains blocked until a later explicitly approved live verification execution phase. The placeholder phrase:
docs/discovery-phase-11d-candidate-extraction-manual-live-staging-verification-gate.md:15:remains inactive during Phase 11D document creation. Any future activation must be limited to the exact scope defined by an approved gate, must receive Gemini review, and must require exact James approval.
docs/discovery-phase-11d-candidate-extraction-manual-live-staging-verification-gate.md:39:Phase 11C added a guarded backend implementation path while keeping production live staging blocked by default.
docs/discovery-phase-11d-candidate-extraction-manual-live-staging-verification-gate.md:54:- Existing tests prove the placeholder phrase remains inactive at helper and route boundaries.
docs/discovery-phase-11d-candidate-extraction-manual-live-staging-verification-gate.md:99:The existing placeholder phrase remains inactive:
docs/discovery-phase-11d-candidate-extraction-manual-live-staging-verification-gate.md:111:No live verification phrase is active during Phase 11D document creation.
docs/discovery-phase-12b-candidate-extraction-api-live-staging-implementation-plan.md:227:Future Phase 12C may wire this dependency from trusted server code only if the route remains inactive by default.
docs/discovery-phase-12b-candidate-extraction-api-live-staging-implementation-plan.md:232:- server-created stageCandidate dependency behind an inactive gate;
docs/discovery-phase-12b-candidate-extraction-api-live-staging-implementation-plan.md:363:- placeholder approval phrases remain inactive;
docs/discovery-phase-12b-candidate-extraction-api-live-staging-implementation-plan.md:482:- tests prove dry_run false is still blocked unless server-created test gate is injected;
docs/discovery-phase-12d-candidate-extraction-admin-ui-live-staging-design-gate.md:134:- admin session is active;
docs/discovery-phase-12e-candidate-extraction-admin-ui-live-staging-implementation-plan.md:411:The existing dry-run panel should remain the primary active control.
docs/discovery-phase-13a-candidate-extraction-admin-ui-source-provider-design.md:29:- the dry-run panel remains active and dry-run-only;
docs/discovery-phase-13a-candidate-extraction-admin-ui-source-provider-design.md:164:- blocked;
docs/discovery-phase-13a-candidate-extraction-admin-ui-source-provider-design.md:447:- select none and return blocked;
docs/discovery-phase-13b-candidate-preview-provider-implementation-plan.md:27:- dry-run panel remains active and dry-run-only;
docs/discovery-phase-13b-candidate-preview-provider-implementation-plan.md:62:The provider must return unavailable or blocked unless a trusted preview artifact exists.
docs/discovery-phase-13b-candidate-preview-provider-implementation-plan.md:143:- blocked;
docs/discovery-phase-13b-candidate-preview-provider-implementation-plan.md:151:- blocked means artifact exists but has blocking safety issues;
docs/discovery-phase-13b-candidate-preview-provider-implementation-plan.md:168:- preview_artifact_blocked;
docs/discovery-phase-13b-candidate-preview-provider-implementation-plan.md:310:- previewStatus blocked;
docs/discovery-phase-13b-candidate-preview-provider-implementation-plan.md:351:- display loading, unavailable, blocked, and stale states;
docs/discovery-phase-13b-candidate-preview-provider-implementation-plan.md:377:- multiple artifacts return ambiguous or blocked;
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:128:- blocked_reason_code;
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:180:  - blocked;
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:219:  - blocked.
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:288:- unique active reviewable artifact per discovery_run_id and discovery_source_id.
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:379:- keep reviewable/blocked/stale artifacts for 30 to 90 days;
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:399:- preview_status is stale or blocked.
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:428:- unsafe_url_blocked;
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:429:- stale_schema_blocked;
docs/discovery-phase-13c-candidate-preview-artifact-schema-design-gate.md:430:- ambiguous_preview_blocked.
docs/discovery-phase-13g-read-only-candidate-preview-api-route-implementation-plan.md:167:- 200 for safe unavailable, pending, blocked, stale, unsafe, or ambiguous provider result
docs/discovery-phase-13g-read-only-candidate-preview-api-route-implementation-plan.md:186:- preview_artifact_blocked
docs/discovery-phase-13g-read-only-candidate-preview-api-route-implementation-plan.md:205:- blocked provider result returns 200
docs/discovery-phase-13i-admin-ui-read-only-preview-wiring-plan.md:162:- show safe unavailable, pending, blocked, stale, or ambiguous copy
docs/discovery-phase-13i-admin-ui-read-only-preview-wiring-plan.md:190:- unavailable or blocked status
docs/discovery-phase-13i-admin-ui-read-only-preview-wiring-plan.md:243:- role=status for loading/unavailable/blocked/stale copy
docs/discovery-phase-13i-admin-ui-read-only-preview-wiring-plan.md:260:- blocked preview keeps staging disabled
docs/discovery-phase-14a-candidate-extraction-live-staging-activation-design-gate.md:125:13. The preview is not blocked.
docs/discovery-phase-14a-candidate-extraction-live-staging-activation-design-gate.md:240:- blocked;
docs/discovery-phase-14a-candidate-extraction-live-staging-activation-design-gate.md:342:- button cannot enable for blocked preview;
docs/discovery-phase-14a-candidate-extraction-live-staging-activation-design-gate.md:425:- accepting blocked preview;
docs/discovery-phase-14b-candidate-extraction-live-staging-backend-activation-implementation-plan.md:57:The current preview provider already returns a safe accepted preview only when the artifact is reviewable, fresh, source/run matched, schema-supported, non-ambiguous, non-blocked, and sanitized.
docs/discovery-phase-14b-candidate-extraction-live-staging-backend-activation-implementation-plan.md:176:20. Preview safety flags do not indicate stale, blocked, ambiguous, unsafe, raw HTML, or LLM output exposure.
docs/discovery-phase-14b-candidate-extraction-live-staging-backend-activation-implementation-plan.md:315:- `dry_run: false` with resolver but blocked preview remains rejected;
docs/discovery-phase-14c-a-preview-to-staging-mapper-source-url-decision-patch.md:55:- Current state: backend activation remains blocked while the preview lacks trusted source URL data.
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md:27:Phase 14C-A also blocked backend activation until trusted server-derived source URL data is available to the accepted candidate preview.
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md:62:Therefore, the backend live gate resolver must remain blocked.
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md:239:- reject the preview as stale or blocked;
docs/discovery-phase-14c-b-preview-artifact-trusted-source-url-design-gate.md:311:Backend activation remains blocked until all of the following are complete:
docs/discovery-phase-14c-c-preview-artifact-trusted-source-url-migration-draft.md:37:Backend live staging remains blocked.
docs/discovery-phase-14c-c-preview-artifact-trusted-source-url-migration-draft.md:105:- `source_url_snapshot_missing_blocked`;
docs/discovery-phase-14c-c-preview-artifact-trusted-source-url-migration-draft.md:106:- `source_url_snapshot_unsafe_blocked`;
docs/discovery-phase-14c-c-preview-artifact-trusted-source-url-migration-draft.md:107:- `source_url_drift_blocked`.
docs/discovery-phase-14c-c-preview-artifact-trusted-source-url-migration-draft.md:162:Backend live gate resolver implementation remains blocked until:
docs/discovery-phase-14c-d-preview-artifact-trusted-source-url-schema-application-gate.md:34:Backend live staging remains blocked.
docs/discovery-phase-14e-admin-ui-live-staging-activation-implementation-plan.md:23:- Live staging is still inactive by default.
docs/discovery-phase-14h-admin-ui-staged-action-design.md:13:The backend is now capable of server-side preview revalidation after Phase 14G, but the UI must remain inactive until a separately approved implementation phase.
docs/discovery-phase-14h-admin-ui-staged-action-design.md:103:10. No stale, ambiguous, unavailable, or blocked preview state is present.
docs/discovery-phase-14h-admin-ui-staged-action-design.md:106:If any requirement is missing, the UI should show read-only status text instead of an active staging action.
docs/discovery-phase-14h-admin-ui-staged-action-design.md:130:- `Preview blocked`
docs/discovery-phase-14h-admin-ui-staged-action-design.md:273:| `unsupported_request_field` | `The staging request included unsupported fields and was blocked.` |
docs/discovery-phase-14h-admin-ui-staged-action-design.md:274:| `client_admin_identity_not_allowed` | `The staging request attempted to send client identity and was blocked.` |
docs/discovery-phase-14l-controlled-staged-candidate-review-cleanup-gate.md:185:candidate_id=eafa4925-4cd9-4361-a8d0-37c8c6bdf65f no longer appears as an active staged candidate.
docs/discovery-phase-14o-controlled-staged-candidate-cleanup-method-decision-gate.md:83:removing the smoke candidate from the active staging queue.
docs/discovery-phase-14r-controlled-exact-id-archive-cleanup-result.md:207:The controlled staged smoke candidate has been safely retired from active staged
docs/discovery-phase-14r-controlled-exact-id-archive-cleanup-result.md:235:Confirm the smoke artifact is archived and no longer active.
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:36:future active staging queue workflows.
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:57:Future active candidate staging queue workflows must exclude archived rows by default.
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:59:Default active queue statuses:
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:67:Default inactive / terminal queue statuses:
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:74:The active candidate staging queue must not include:
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:92:exclude the Phase 14 smoke artifact from the default active queue.
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:94:At minimum, future active queue reads must satisfy:
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:103:The exact smoke artifact must not be special-cased as an active row.
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:108:separate from the active staging queue.
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:129:Which statuses are shown in the active queue.
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:145:Before any active queue API route is implemented, the design must define:
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:168:A future active queue read model should expose only safe fields such as:
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:226:A future Phase 14T or later active queue readiness inspection should confirm:
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:230:Archived smoke artifact is not returned by active queue filters.
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:231:Active queue filter uses only active statuses.
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:271:Define the read model and safe field projection for active candidate staging rows.
docs/discovery-phase-14s-post-cleanup-candidate-staging-queue-readiness-gate.md:272:Default filter to active statuses only.
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md:24:Archived smoke artifacts are excluded from active queue workflows by default.
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md:26:Inactive statuses: archived, rejected.
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md:37:Create a future admin-only read model for active candidate staging rows that:
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md:41:Defaults to active statuses only.
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md:54:The default active queue filter must be:
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md:73:the staging safety model and must not become active queue states.
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md:77:The archived Phase 14 smoke artifact must not appear in the default active
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md:88:because `candidate_status='archived'` is outside the active status allowlist.
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md:143:statuses must be a subset of the active status allowlist.
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md:144:archived and rejected must be rejected as active queue status inputs.
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md:194:Do not return archived rows in default active queue output.
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md:195:Do not return rejected rows in default active queue output.
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md:368:Hide archived and rejected rows from the active queue by default.
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md:409:Archived Phase 14 smoke artifact is not returned by default active queue filter.
docs/discovery-phase-14t-candidate-staging-queue-read-model-design.md:459:Preserve active status allowlist.
docs/discovery-phase-14u-candidate-staging-queue-read-model-implementation-plan.md:50:Default to active statuses only.
docs/discovery-phase-14u-candidate-staging-queue-read-model-implementation-plan.md:52:Reject inactive statuses when passed as active queue filters.
... truncated: 1408 total lines, showing first 160 ...
\`\`\`

## Evidence: git schema-history signals

\`\`\`text
71c7476 2026-07-05 Update read-only inspection status count projection
803b94e 2026-07-04 Document Phase 25AJ local schema review result
aae4df7 2026-07-04 Document Phase 25AI local schema review plan
e28bf0a 2026-07-04 Document Phase 25AH status contract analysis
70acfa5 2026-07-04 Document Discovery Engine current-state map risk register
cb09144 2026-07-04 Document Discovery Engine current-state inventory
c725e79 2026-07-04 Document Discovery Engine re-entry readiness gate
acf3c81 2026-07-04 Close Discovery Engine controlled sequence
ddb3b2d 2026-07-04 Document Discovery Engine final stabilization gate
dda5820 2026-07-03 Wire admin queue fail-closed status presentation
aa4dbb5 2026-07-03 Close Discovery Engine stabilization sequence
c1622ea 2026-07-03 Document Discovery Engine stabilization handoff
015358a 2026-07-03 Document target context read-only discovery approval gate
523b074 2026-07-03 Document candidate staging status count result
28c82b7 2026-07-03 Document candidate staging status count approval gate
d23b6fd 2026-07-03 Document Phase 22T candidate decision live target source design
f0d7f27 2026-07-01 Generate candidate decision schema types
93474c0 2026-07-01 Document candidate decision schema retry apply result
8ed487a 2026-07-01 Patch candidate decision constraint recovery migration
80aa0d6 2026-07-01 Patch candidate decision migration after failed apply
981769b 2026-07-01 Document candidate decision schema apply gate
d820401 2026-07-01 Document candidate decision migration readiness gate
2fc5492 2026-07-01 Draft candidate decision schema expansion migration
eb5362e 2026-07-01 Document candidate decision schema reconciliation strategy
e3340ff 2026-07-01 Document candidate decision schema expansion design
d641ecd 2026-07-01 Document candidate decision schema readiness inspection
c9bd116 2026-06-28 Document trusted source URL schema application gate
62482ff 2026-06-28 Draft trusted source URL migration
88393f6 2026-06-28 Document trusted source URL design
2998380 2026-06-28 Document preview source URL decision
3131c8d 2026-06-28 Draft candidate preview artifact schema
f91e75a 2026-06-28 Document candidate preview artifact schema design
63cdb12 2026-06-28 Document candidate preview source provider design
d19a935 2026-06-26 Document post-schema RLS smoke result
5a01f46 2026-06-26 Document post-schema RLS smoke gate
f62089a 2026-06-26 Apply candidate staging schema audit expansion
f759443 2026-06-26 Document candidate staging schema apply gate
7192ed6 2026-06-26 Draft candidate staging schema audit migration
5f19fef 2026-06-26 Document candidate staging schema audit implementation plan
84faa43 2026-06-26 Document candidate staging schema audit expansion plan
694fd03 2026-06-26 Document Discovery admin interface design
3eebfe6 2026-06-25 Document typed Discovery client no-op smoke test plan
e80212c 2026-06-25 Document dedicated typed Discovery admin helper plan
447225f 2026-06-25 Document migration apply type target discovery
c30bfb7 2026-06-25 Document candidate staging migration apply plan
090c34b 2026-06-25 Add discovery candidate tools migration
17efb12 2026-06-25 Document candidate extraction schema migration plan
53d0cba 2026-06-25 Document candidate extraction schema decision plan
0f59fff 2026-06-18 Document first manual crawler sources
c0e41a5 2026-06-18 Document manual discovery crawler implementation plan
8196421 2026-06-18 Document discovery source policy review requirements
87a6ce4 2026-06-18 Document manual discovery crawler prototype design
41d6b49 2026-06-18 Document discovery retention cleanup design
2c6dbad 2026-06-18 Document discovery source allowlist
6aa2e99 2026-06-18 Document discovery crawler plan
6a26e0d 2026-06-18 Document discovery retention policy
90db361 2026-06-17 Validate discovery queue status workflow
43b803e 2026-06-17 Add discovery engine schema phase 3B
583a8a4 2026-06-16 fix(admin): harden tool status lifecycle
8a206c9 2026-06-15 chore(db): patch public-safe tools schema
5327589 2026-06-15 Draft public safe tools schema migration
09bfb61 2026-06-12 Sync homepage control migration draft with planning doc
3841a7a 2026-06-12 Draft homepage control room migration
d0a2b79 2026-06-12 Add homepage control SQL migration draft
90bea1b 2026-06-12 Add homepage control SQL migration proposal
c11c488 2026-06-02 Discovery Engine Phase 1: add discovered tools queue schema
\`\`\`

## Audit interpretation

This audit is intentionally local-only.

It does not prove live database state beyond what Phase 25AY already proved.

It provides repository-history evidence for the next decision gate.

The next decision must compare:

\`\`\`text
local_repository_contract_evidence=true
live_metadata_status_column_found=false
contract_reconciliation_required=true
\`\`\`

## Preliminary decision framing

The Phase 25BB result should be reviewed before remediation is selected.

Possible future outcomes remain separated:

\`\`\`text
possible_outcome_script_contract_update=true
possible_outcome_migration_draft=true
possible_outcome_additional_local_review=true
possible_outcome_metadata_access_limitation_review=true
\`\`\`

No outcome is selected by this phase.

## Explicitly blocked from Phase 25BB

\`\`\`text
run_live_retry=false
run_live_metadata_inspection=false
run_live_db_read=false
run_supabase_cli=false
run_dashboard_sql=false
scan_env_files=false
row_payload_access=false
row_enumeration=false
status_value_count=false
grouped_count=false
modify_inspection_script=false
modify_source_code=false
modify_schema=false
create_migration=false
apply_migration=false
run_type_generation=false
change_rls=false
change_grants=false
refresh_schema_cache=false
reactivate_operational_flow=false
\`\`\`

## Recommended next phase

Recommended next phase:

\`\`\`text
next_phase=25BC
next_phase_title=Discovery Sources Status Contract Reconciliation Decision Gate
next_phase_type=decision_planning
\`\`\`

Phase 25BC should decide, based on the Phase 25BB local evidence, whether the next safe path is:

1. script contract correction planning;
2. migration draft planning;
3. additional local audit;
4. metadata-access limitation planning.

It must remain planning-only unless a separate reviewed implementation or migration-draft phase is approved.

## Success criteria

\`\`\`text
local_schema_history_audit_complete=true
repository_evidence_collected=true
live_db_reads=false
live_metadata_reads=false
env_scanning=false
db_mutation=false
schema_change=false
migration_apply=false
type_generation=false
source_change=false
inspection_script_change=false
operational_reactivation_status=blocked
next_phase_25bc_recommended=true
\`\`\`

## Gemini review request

Gemini should review this Phase 25BB local schema history audit gate for evidence quality, boundary safety, and decision readiness.

Specific review questions:

1. Does this audit preserve the Phase 25AY/25AZ live metadata finding without adding new live claims?
2. Does this audit collect enough local repository evidence to support a reconciliation decision gate?
3. Does this audit avoid prematurely selecting script change versus migration draft?
4. Are the evidence sections safe, bounded, and free of row payload or secret exposure?
5. Does the audit correctly keep operational reactivation blocked?
6. Is Phase 25BC contract reconciliation decision gate the correct next phase?
