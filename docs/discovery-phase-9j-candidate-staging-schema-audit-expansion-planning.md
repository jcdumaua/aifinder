# Phase 9J — Candidate Staging Schema & Audit Expansion Planning

## 1. Phase title and status

Phase 9J is a docs-only database/schema and audit expansion planning phase.

This phase performs no database operations, creates no migration, runs no SQL, runs no `supabase db push`, regenerates no Supabase types, and changes no source code, tests, helpers, smoke scripts, package scripts, generated Supabase types, migrations, API routes, UI components, extraction code, crawler code, LLM behavior, audit writes, `public.tools` writes, or `discovered_tools` writes.

## 2. Current state summary

Phase 8X implemented:

```ts
stageNormalizedDiscoveryCandidate(...)
```

The staging method currently requires `discoverySourceId` at the method boundary. The current `public.discovery_candidate_tools` table does not persist `discovery_source_id`, so the method validates and returns source context without storing it in the staged candidate row.

Phase 9G verified anonymous/public RLS denial for `public.discovery_candidate_tools`. Phase 9H documented the RLS smoke result. Phase 9I closed anonymous/public RLS verification and identified remaining data-lineage and audit-compatibility gaps.

Extraction pipeline implementation remains blocked until source-accountability and audit-compatibility decisions are resolved or explicitly deferred.

## 3. Purpose of Phase 9J

Phase 9J plans the future database and audit expansion needed before connecting extraction output to candidate staging.

This plan answers:

- whether `discovery_candidate_tools` should persist `discovery_source_id`;
- what the foreign key behavior should be;
- whether the column should be nullable or non-nullable initially;
- what migration sequence is safest;
- how generated types and staging helper mappings should change later;
- what audit actions are needed for candidate staging;
- how future audit writes should avoid violating existing action constraints;
- how RLS policies and smoke tests should be adjusted after schema expansion;
- which later phase should implement the migration.

## 4. Strict non-goals

Phase 9J does not:

- create a migration;
- modify migrations;
- run `supabase db push`;
- execute SQL;
- query the database;
- regenerate Supabase types;
- modify source code;
- modify tests;
- modify smoke scripts;
- modify helpers;
- modify package scripts;
- modify generated Supabase types;
- add audit event writes;
- add extraction/crawler/LLM integration;
- add API routes;
- add UI changes;
- write to `public.tools`;
- write to `discovered_tools`;
- approve, promote, publish, rank, or recommend candidates;
- rerun the live RLS smoke;
- set `AIFINDER_RUN_DISCOVERY_CANDIDATE_STAGING_RLS_SMOKE=1`.

## 5. Source accountability problem

Current state:

- `StageNormalizedDiscoveryCandidateInput` requires `discoverySourceId`.
- `stageNormalizedDiscoveryCandidate(...)` validates and carries this value at the method boundary.
- `public.discovery_candidate_tools` does not contain `discovery_source_id`.
- The current insert cannot persist `discoverySourceId`.

This means staged candidates can be linked to a discovery run through `discovery_run_id`, but cannot be linked directly to the originating source row through the candidate table itself.

Future extraction/crawler pipelines need deterministic source lineage for:

- admin review context;
- cleanup and orphan diagnostics;
- source-specific quality analysis;
- audit correlation;
- incident review;
- future review UI filters;
- future extraction pipeline debugging.

The gap is manageable during controlled smoke testing but should be resolved before automated extraction writes to candidate staging.

## 6. Proposed `discovery_source_id` schema expansion

Future migration should add:

```sql
discovery_source_id uuid
```

to:

```sql
public.discovery_candidate_tools
```

Recommended relationship:

```sql
foreign key (discovery_source_id) references public.discovery_sources(id)
```

### Option A — `on delete set null`

Pros:

- preserves candidate history if a source is removed;
- matches the existing `discovered_tools.source_id` nullable lineage pattern;
- avoids cascading candidate deletion;
- is operationally forgiving if source records are cleaned up.

Cons:

- can leave candidates without direct source lineage after source deletion;
- weakens the value of adding `discovery_source_id` as an accountability field;
- requires review tooling to handle null source IDs.

### Option B — `on delete restrict`

Pros:

- prevents deleting source rows that staged candidates depend on;
- gives stronger source lineage;
- makes source deletion an explicit reviewed operation;
- is compatible with existing smoke cleanup order because smoke scripts already delete candidate, then run, then source.

Cons:

- may complicate source cleanup if old staged candidates exist;
- may require explicit archive/delete procedures for source lifecycle work;
- can block deletion of source fixtures if cleanup order is wrong.

### Option C — `on delete cascade`

Pros:

- simple ownership model;
- makes fixture cleanup easy if deleting a source.

Cons:

- risky for audit/history;
- can accidentally delete candidate staging records if a source is removed;
- conflicts with staging/history preservation;
- not appropriate for production lineage.

Recommendation:

Use `on delete restrict` for `discovery_candidate_tools.discovery_source_id` in the first source-accountability expansion.

Rationale:

- the point of the new column is source accountability, so accidental source deletion should be blocked while staged candidates reference that source;
- the existing candidate `discovery_run_id` already uses `on delete restrict`, so a direct source restriction is consistent with a review-preserving staging model;
- smoke fixture cleanup already deletes in dependency order, so `restrict` does not block the approved smoke cleanup pattern;
- if source lifecycle management later requires softer behavior, a separate source-archival policy should be designed instead of silently nulling lineage.

Do not use `on delete cascade` for staged candidates.

## 7. Nullable vs non-nullable planning

### Option A — Add nullable `discovery_source_id`

Pros:

- safest migration path;
- avoids failures if existing candidate rows exist;
- supports staged rollout;
- allows helper/test/smoke updates after type generation;
- allows later backfill validation if needed.

Cons:

- source lineage is not guaranteed at the database level immediately;
- requires future checks to identify null rows if a later `not null` constraint is desired.

### Option B — Add non-null `discovery_source_id`

Pros:

- enforces source accountability immediately;
- matches the future desired write-path contract.

Cons:

- may fail if existing rows exist;
- needs a backfill/default strategy;
- can make migration apply riskier;
- harder to roll out without first verifying all write paths are updated.

Recommendation:

Add nullable `discovery_source_id` first. Then update generated types, staging helper mapping, mocked tests, and smoke readbacks to always write and verify it. Consider a later `not null` constraint only after:

- existing candidate rows are verified/backfilled or confirmed absent;
- all candidate staging write paths include `discovery_source_id`;
- post-schema smoke testing passes;
- Gemini approves the constraint hardening.

## 8. Future migration planning

Future migration should likely include:

```sql
alter table public.discovery_candidate_tools
  add column discovery_source_id uuid null;

alter table public.discovery_candidate_tools
  add constraint discovery_candidate_tools_discovery_source_id_fkey
  foreign key (discovery_source_id)
  references public.discovery_sources(id)
  on delete restrict;

create index if not exists discovery_candidate_tools_source_id_idx
  on public.discovery_candidate_tools (discovery_source_id);

create index if not exists discovery_candidate_tools_run_source_idx
  on public.discovery_candidate_tools (discovery_run_id, discovery_source_id);
```

Future migration should also consider:

- adding a column comment for source traceability;
- leaving RLS deny-all posture unchanged unless a specific reviewed change is needed;
- adding no anon/authenticated grants;
- adding no public-safe view;
- adding no extraction/API/UI behavior;
- adding no candidate rows;
- avoiding audit writes in the migration.

Warnings:

- migration SQL must be Gemini-reviewed before apply;
- `supabase db push` requires explicit James approval;
- Supabase type generation must happen after successful migration apply;
- migration creation, migration apply, type generation, helper mapping, and smoke rerun should be separated into reviewable phases unless Gemini explicitly approves a narrower combined implementation.

## 9. Future code impact

After migration and type generation, future source/test impacts should include:

- update generated Supabase types;
- update `stageNormalizedDiscoveryCandidate(...)` mapping to persist `input.discoverySourceId` as `discovery_source_id`;
- update `StageNormalizedDiscoveryCandidateResult` only if needed, although it already returns `discoverySourceId`;
- update mocked tests to assert `discovery_source_id` is included in the insert payload;
- update functional live smoke to verify persisted source ID;
- update RLS smoke service-role read minimal fields if source ID verification is included;
- update result documentation expectations;
- keep `discovery_source_id` out of anon/public outputs;
- add no UI/API integration unless separately planned and approved.

The existing test currently asserts that `discovery_source_id` is not inserted because the column does not exist. That assertion should be deliberately changed only after generated types include the new column.

## 10. RLS impact

Existing anonymous/public RLS denial was verified before adding `discovery_source_id`.

Adding a foreign key column should not make candidate rows public. Future migration must not add anon grants, authenticated grants, permissive policies, or public-safe views.

RLS considerations:

- keep `public.discovery_candidate_tools` RLS enabled;
- keep deny-all direct policies unless separately reviewed;
- service-role/admin access remains internal only;
- if `discovery_source_id` is selected in future service-role smoke readback, keep the field set minimal and safe;
- rerun a post-schema RLS smoke after schema expansion if candidate table shape changes;
- do not run extraction pipeline implementation until RLS posture remains verified after schema change or the risk is explicitly accepted.

## 11. Audit compatibility problem

Candidate staging currently persists `audit_correlation_id`.

Candidate staging does not write to `discovery_audit_events`. The existing `discovery_audit_events.action` constraint currently allows only:

```text
approve
reject
flag
ignore
batch-action
mark-duplicate
```

Those values were designed around discovered-tool triage, not staged candidate creation. Writing candidate-staging audit events without first checking or expanding the constraint can cause runtime failures.

Audit compatibility needs planning before audit writes are added.

## 12. Future candidate staging audit action taxonomy

Existing project convention:

- `discovery_audit_events.action` uses constrained text values;
- current Discovery action values are short lowercase words or hyphenated phrases;
- homepage-control audit migrations also use additive check-constraint changes for new action values.

Recommended candidate-staging action names should follow the existing lowercase/hyphenated style:

```text
candidate-staged
candidate-stage-failed
candidate-duplicate-hint-recorded
candidate-cleanup-performed
```

Optional future values, only if needed:

```text
candidate-stage-attempted
candidate-review-status-changed
candidate-archived
```

Rules:

- action values must be allowed by DB constraints before use;
- metadata must be bounded;
- metadata must not include raw payloads, raw HTML, screenshots, source blobs, transport payloads, LLM prompts/responses, secrets, tokens, service-role values, or full candidate rows;
- audit events should include `audit_correlation_id` where possible;
- audit metadata should include safe IDs only when needed, such as `candidate_tool_id`, `discovery_run_id`, and `discovery_source_id`;
- audit writes must not imply approval, promotion, publishing, ranking, recommendation, or `public.tools` writes.

## 13. Future audit schema / constraint planning

### Option A — Extend existing check constraint with new action values

Pros:

- matches current project pattern;
- simple to review;
- avoids new tables;
- low operational complexity.

Cons:

- check-constraint migrations must be written carefully;
- action taxonomy can grow unwieldy over time.

### Option B — Replace check constraint with a lookup table or enum-style table

Pros:

- more scalable action management;
- easier future extension if audit action vocabulary grows;
- can support metadata/documentation around actions.

Cons:

- more invasive;
- requires more code and migration work;
- likely overkill for near-term candidate staging.

### Option C — Use existing generic action if one exists

Pros:

- avoids constraint migration.

Cons:

- no existing generic action clearly represents candidate staging;
- weak semantic audit trail;
- risks confusing discovered-tool triage with candidate staging.

Recommendation:

Use Option A for the near term: an additive check-constraint expansion on `discovery_audit_events.action`, only after a migration draft is reviewed.

Defer lookup-table redesign unless the Discovery audit taxonomy becomes too large or multiple future systems need flexible action registration.

Do not reuse existing discovered-tool triage actions for candidate staging.

## 14. Future audit write design

Open design questions for a later implementation plan:

- Should `stageNormalizedDiscoveryCandidate(...)` write audit events directly?
- Should an outer orchestration layer write audit events around staging?
- Should audit writes happen in the same database transaction as candidate insert?
- How should failure be handled if candidate insert succeeds but audit insert fails?
- How should `audit_correlation_id` pass through to audit metadata?
- Which actor identity should be used for automated extraction?
- Should audit events reference `discovery_run_id`?
- Should audit events reference `discovery_source_id`?
- Should audit events reference `candidate_tool_id` if `discovery_audit_events` currently only has `discovered_tool_id`?

Near-term recommendation:

Do not add audit writes inside `stageNormalizedDiscoveryCandidate(...)` until audit action compatibility, candidate ID references, metadata shape, transaction behavior, and failure behavior are designed.

An outer orchestration layer may be safer than writing audit events directly inside the low-level staging method, but this should be decided in a separate implementation plan.

## 15. Combined vs split implementation recommendation

Gemini recommended combining source accountability and audit compatibility into one comprehensive planning phase. Phase 9J does that planning.

### Option A — Combined migration implementation phase

One future migration does both:

- add `discovery_source_id`;
- expand audit action compatibility.

Pros:

- one DB migration lifecycle;
- one type generation;
- less operational overhead;
- keeps schema/audit compatibility in sync.

Cons:

- larger migration;
- more review burden;
- rollback reasoning is more complex.

### Option B — Split implementation phases

Separate:

- source-accountability migration;
- audit-compatibility migration.

Pros:

- smaller changes;
- easier review and rollback;
- source-accountability can proceed even if audit taxonomy needs more review.

Cons:

- more migration cycles;
- slower;
- multiple type-generation/review passes.

Recommendation:

Plan source accountability and audit compatibility together in Phase 9J, but use a staged follow-up sequence:

1. create a detailed implementation plan;
2. create a migration draft;
3. review the exact migration before apply;
4. apply and generate types only after approval;
5. update helper mapping after types are available.

If the migration draft remains simple and Gemini approves, `discovery_source_id` and additive audit action constraint expansion can be implemented in one migration. If audit action references require deeper table design, split the implementation and land source accountability first.

## 16. Proposed future phase sequence

Recommended bounded sequence:

1. `Phase 9K — Candidate Staging Schema & Audit Expansion Implementation Plan`
2. `Phase 9L — Candidate Staging Schema & Audit Expansion Migration Draft`
3. `Phase 9M — Candidate Staging Schema & Audit Expansion Migration Apply / Type Generation`
4. `Phase 9N — Candidate Staging Helper Mapping Update Plan`
5. `Phase 9O — Candidate Staging Helper Mapping Implementation`
6. `Phase 9P — Post-Schema RLS Smoke Planning / Execution Gate`
7. `Phase 9Q — Post-Schema RLS Smoke Execution`
8. `Phase 10A — Candidate Extraction Staging Pipeline Planning`

This sequence authorizes no implementation in Phase 9J. Every migration, type generation, helper update, smoke run, and pipeline plan requires its own explicit approval.

## 17. Extraction pipeline readiness gate

Candidate extraction staging pipeline implementation remains blocked until:

- `discovery_source_id` persistence is implemented or explicitly deferred;
- audit compatibility is implemented or explicitly deferred;
- generated Supabase types reflect schema decisions;
- staging helper mapping reflects schema decisions;
- post-schema RLS posture is rechecked or risk-accepted after schema expansion;
- no API/UI/extraction/crawler/LLM integration is added without a separate approved plan;
- no `public.tools` or `discovered_tools` writes are added.

## 18. Safety boundaries preserved

Phase 9J preserved these boundaries:

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

## 19. Rollback plan

Phase 9J rollback is docs-only:

- remove `docs/discovery-phase-9j-candidate-staging-schema-audit-expansion-planning.md`;
- no database rollback is needed because Phase 9J performs no database operations.

## 20. CCR expectations

The Phase 9J CCR must confirm:

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

## 21. Final Phase 9J decision summary

Phase 9J plans a conservative schema and audit expansion path before candidate extraction pipeline integration.

Recommended decisions:

- add nullable `discovery_source_id` first;
- use `on delete restrict` for source-accountability preservation;
- add indexes for source and run/source lookup;
- expand Discovery audit action constraints additively only after review;
- keep audit writes out of the staging method until transaction/failure semantics are designed;
- update generated types, staging helper mapping, tests, live smoke, and RLS smoke in later approved phases;
- block extraction pipeline implementation until source accountability, audit compatibility, helper mapping, and post-schema RLS posture are handled or explicitly deferred.
