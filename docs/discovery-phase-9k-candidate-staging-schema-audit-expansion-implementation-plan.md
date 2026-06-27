# Phase 9K — Candidate Staging Schema & Audit Expansion Implementation Plan

## 1. Phase title and status

Phase 9K is a docs-only implementation planning phase.

This phase creates no migration, performs no database operations, runs no SQL, runs no `supabase db push`, regenerates no Supabase types, and changes no source code, tests, helpers, smoke scripts, package scripts, generated Supabase types, migrations, API routes, UI components, extraction code, crawler code, LLM behavior, audit writes, `public.tools` writes, or `discovered_tools` writes.

## 2. Current state summary

Phase 9G verified anonymous/public RLS denial for `public.discovery_candidate_tools`. Phase 9H documented the RLS result. Phase 9I closed the anonymous/public RLS verification track. Phase 9J planned source-accountability and audit compatibility and was pushed as:

```text
84faa43 Document candidate staging schema audit expansion plan
```

Current implementation state:

- `stageNormalizedDiscoveryCandidate(...)` requires `discoverySourceId` at the input boundary.
- `public.discovery_candidate_tools` does not persist `discovery_source_id`.
- Candidate staging persists `audit_correlation_id`.
- Candidate staging does not write audit events.
- `discovery_audit_events.action` currently supports discovered-tool triage actions only.
- Candidate extraction implementation remains blocked.

## 3. Purpose of Phase 9K

Phase 9K turns the Phase 9J plan into an implementation-ready plan for future phases.

It prepares later phases to:

- draft a migration safely;
- review exact SQL before apply;
- apply the migration only after approval;
- regenerate Supabase types after successful apply;
- update helper mapping and tests after generated types exist;
- recheck RLS after schema changes.

Phase 9K does not authorize implementation.

## 4. Strict non-goals

Phase 9K does not:

- create a migration file;
- execute SQL;
- run `supabase db push`;
- query a remote database;
- regenerate Supabase types;
- modify helper/source/test/smoke files;
- modify package scripts;
- modify generated types;
- add audit event writes;
- add extraction/crawler/LLM integration;
- add API routes;
- add UI changes;
- write to `public.tools`;
- write to `discovered_tools`;
- approve, promote, publish, rank, or recommend candidates.

## 5. Future migration DDL plan

The future migration draft should use this planned SQL shape. This is planning only in Phase 9K and must not be applied here.

```sql
alter table public.discovery_candidate_tools
  add column if not exists discovery_source_id uuid null;

alter table public.discovery_candidate_tools
  add constraint discovery_candidate_tools_discovery_source_id_fkey
  foreign key (discovery_source_id)
  references public.discovery_sources(id)
  on delete restrict;

create index if not exists discovery_candidate_tools_discovery_source_id_idx
  on public.discovery_candidate_tools (discovery_source_id);

create index if not exists discovery_candidate_tools_run_source_idx
  on public.discovery_candidate_tools (discovery_run_id, discovery_source_id);

comment on column public.discovery_candidate_tools.discovery_source_id
  is 'Source row that produced or supplied the candidate evidence for staging.';
```

Naming notes:

- Existing candidate table index names use the `discovery_candidate_tools_*_idx` convention.
- Existing foreign key names are generated as `discovery_candidate_tools_<column>_fkey` in generated Supabase types.
- The planned explicit constraint name `discovery_candidate_tools_discovery_source_id_fkey` matches that convention.

Migration draft caution:

- PostgreSQL does not support `add constraint if not exists` in the same way as `add column if not exists`.
- The migration draft phase should verify whether the constraint already exists locally in migration history before using a plain `add constraint`.
- If idempotency is required, the draft should use a reviewed `do $$ ... $$;` guard rather than ad hoc SQL.

## 6. Audit action constraint expansion plan

Local migration inspection found the current `discovery_audit_events.action` check in:

```text
supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql
```

Current allowed values:

```text
approve
reject
flag
ignore
batch-action
mark-duplicate
```

Future candidate staging values should use the existing lowercase/hyphenated action style:

```text
candidate-staged
candidate-stage-failed
candidate-duplicate-hint-recorded
candidate-cleanup-performed
```

Planned future SQL pattern:

```sql
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
```

Future migration requirements:

- preserve all existing allowed action values;
- add only the candidate staging values;
- avoid weakening unrelated constraints;
- keep audit metadata bounded and safe;
- do not add audit writes in the migration;
- do not add approval, promotion, publishing, ranking, or recommendation semantics.

Constraint-name caution:

- The original migration used an inline unnamed check constraint.
- PostgreSQL commonly names it `discovery_audit_events_action_check`, but the migration draft/apply phase should confirm the actual current constraint name before remote apply.
- If there is any uncertainty, the implementation plan should include a safe read-only constraint inspection step in a separately approved DB inspection/apply phase.

## 7. Pre-migration safety checks for future phase

Before migration draft or apply, a future phase should:

- inspect current migration history locally;
- verify current `public.discovery_candidate_tools` definition locally;
- verify current `public.discovery_audit_events.action` check constraint text from local migrations;
- search for existing `discovery_source_id` references to avoid duplicate planning;
- run `npm run check`;
- confirm clean git status;
- avoid remote SQL unless explicitly approved;
- avoid printing secrets or environment values.

If live DB preflight is needed, it must be a separate approved DB inspection phase and should capture safe summaries only.

## 8. Migration apply / type generation plan

Future apply sequence:

1. Gemini reviews the migration draft.
2. James approves migration apply.
3. Apply the Supabase migration only after approval.
4. Verify migration result safely.
5. Regenerate Supabase types.
6. Confirm generated types include:
   - `discovery_candidate_tools.discovery_source_id` in `Row`;
   - `discovery_candidate_tools.discovery_source_id` in `Insert`;
   - `discovery_candidate_tools.discovery_source_id` in `Update`;
   - a relationship to `discovery_sources`;
   - no unexpected unrelated drift.
7. Confirm audit action constraint expansion was applied.
8. Run `npm run check`.
9. Commit migration/types only after Gemini review and James approval.

No part of this sequence is performed in Phase 9K.

## 9. Future helper mapping plan

After migration and type generation, a later helper mapping phase should update:

- `stageNormalizedDiscoveryCandidate(...)`;
- the insert payload mapping;
- mocked tests;
- functional live smoke readback;
- RLS smoke service-role readback if needed.

Expected future mapping:

```ts
discovery_source_id: input.discoverySourceId
```

`discoverySourceId` should remain required at the method boundary.

The current helper result already returns `discoverySourceId`, so the likely change is insert payload persistence and post-insert/readback verification, not result-shape expansion.

## 10. Future test update plan

Future test updates should include:

- mocked candidate staging admin tests assert `discovery_source_id` is included in the insert payload;
- existing assertion that `discovery_source_id` is absent is removed only after generated types include the column;
- live functional smoke verifies the candidate persisted with the correct source ID;
- RLS smoke continues denying anon exact-ID and list reads;
- post-schema RLS smoke runs after schema/helper updates;
- tests do not print secrets, full candidate payloads, raw Supabase error objects, or raw evidence/source blobs.

## 11. RLS / post-schema verification plan

Post-schema RLS recheck is required because:

- candidate table shape changes affect security review posture;
- the new source ID column must not become publicly readable;
- migration must not add public grants or public-safe views;
- anonymous/public exact-ID denial must remain true;
- anonymous/public list denial must remain true;
- service-role/admin read should remain internal and minimal.

Recommended future phases:

- `Phase 9Q — Post-Schema RLS Smoke Planning / Execution Gate`
- `Phase 9R — Post-Schema RLS Smoke Execution`

If `discovery_source_id` is selected in future smoke readbacks, it should be included only in service-role/admin minimal readback fields.

## 12. Rollback strategy

For migration draft:

- rollback is deleting the draft migration before apply.

For applied migration:

- rollback requires explicit approval;
- dropping `discovery_source_id` could lose lineage;
- audit constraint rollback must preserve existing action values;
- audit constraint rollback must not invalidate existing rows that use newly added action values;
- prefer forward-fix over destructive rollback once data exists.

Phase 9K rollback:

- remove `docs/discovery-phase-9k-candidate-staging-schema-audit-expansion-implementation-plan.md`;
- no DB rollback is needed because Phase 9K performs no DB operations.

## 13. Risk register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Incorrect audit action list drops existing allowed actions. | Existing audit writes can fail. | Preserve exact current list from local/current schema before migration. |
| Non-null source ID too early breaks existing rows. | Migration apply can fail or future writes can fail. | Use nullable-first rollout. |
| FK `restrict` blocks source cleanup. | Smoke or admin cleanup can fail if order is wrong. | Keep exact cleanup order: candidate → run → source. |
| Missing source indexes slows admin review/filtering. | Poor review/diagnostic performance. | Add source and run/source indexes. |
| RLS posture changes after schema expansion. | Candidate rows could become exposed if grants/policies drift. | Add no grants/views and rerun post-schema RLS smoke. |
| Helper mapping drifts from generated types. | Type/runtime mismatch. | Update helper only after generated types are refreshed and reviewed. |
| Audit writes are added before transaction semantics are designed. | Ambiguous staging/audit state. | Keep audit writes out of this migration and plan separately. |

## 14. Proposed future phase sequence

Recommended next sequence:

1. `Phase 9L — Candidate Staging Schema & Audit Expansion Migration Draft`
2. `Phase 9M — Candidate Staging Schema & Audit Expansion Migration Review / Apply Gate`
3. `Phase 9N — Candidate Staging Schema & Audit Expansion Migration Apply / Type Generation`
4. `Phase 9O — Candidate Staging Helper Mapping Update Plan`
5. `Phase 9P — Candidate Staging Helper Mapping Implementation`
6. `Phase 9Q — Post-Schema RLS Smoke Planning / Execution Gate`
7. `Phase 9R — Post-Schema RLS Smoke Execution`
8. `Phase 10A — Candidate Extraction Staging Pipeline Planning`

Phase 9K recommends migration draft next, not migration apply.

## 15. Extraction readiness gate

Candidate extraction staging pipeline implementation remains blocked until:

- schema expansion is drafted, reviewed, applied, and typed, or explicitly deferred;
- helper mapping reflects the schema decision;
- audit compatibility is resolved or explicitly deferred;
- post-schema RLS posture is verified or risk-accepted;
- no public publishing, approval, promotion, ranking, or recommendation behavior is introduced;
- no `public.tools` or `discovered_tools` write path is added;
- API/UI/extraction/crawler/LLM integration receives separate approval.

## 16. Safety boundaries preserved

Phase 9K preserves these boundaries:

- no database operations occurred;
- no migration was created;
- no SQL was run;
- no Supabase types were generated;
- no source, test, helper, package, migration, or generated type files changed;
- no API/UI/extraction/crawler/LLM integration was added;
- no `public.tools` writes occurred;
- no `discovered_tools` writes occurred;
- no audit event writes occurred;
- no live RLS smoke was rerun;
- `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1` was not set.

## 17. CCR expectations

The Phase 9K CCR must confirm:

- only docs changed;
- no migration was created;
- no SQL or database operations occurred;
- no Supabase type generation ran;
- no source, test, helper, package, migration, or generated type files changed;
- no API/UI/extraction/crawler/LLM integration was added;
- no `public.tools` or `discovered_tools` writes occurred;
- no audit event writes occurred;
- no live RLS smoke was rerun;
- the RLS opt-in environment variable was not set;
- the safe RLS opt-out guard still works;
- final `git status --short --branch`;
- recommended next phase.

## 18. Final Phase 9K decision summary

Phase 9K translates the Phase 9J schema/audit expansion plan into a migration-ready implementation plan without creating the migration.

Recommended next action:

```text
Phase 9L — Candidate Staging Schema & Audit Expansion Migration Draft
```

Phase 9L should create a migration draft only. It should not apply the migration, regenerate types, update helper mappings, run live smoke, or connect extraction.
