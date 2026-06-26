# Phase 9C — Candidate Staging Smoke Hardening / RLS Security Planning

## 1. Phase title and status

Phase 9C is a docs-only planning phase.

This phase performs no database operations, runs no live smoke, runs no RLS smoke, and changes no source code, tests, helpers, generated Supabase types, migrations, API routes, UI components, extraction code, crawler code, LLM behavior, audit writes, `public.tools` writes, or `discovered_tools` writes.

## 2. Current state summary

Phase 8X implemented the bounded staging method:

```ts
stageNormalizedDiscoveryCandidate(...)
```

Phase 8Z added an opt-in live smoke harness:

```text
testing/discovery-candidate-staging-live-smoke.mjs
```

Phase 9A executed that live smoke successfully. The smoke created one dedicated discovery source fixture, one dedicated discovery run fixture, and one staged candidate fixture. Minimal readback passed, and exact-ID cleanup was verified for all three records.

Phase 9B documented the successful Phase 9A result. No persistent smoke candidate, discovery run, or discovery source remained after cleanup.

API/UI/extraction/crawler/LLM integration remains deferred. Candidate staging remains a server/admin-only staging capability and is not a public tool creation, approval, promotion, publishing, ranking, recommendation, or extraction system.

## 3. Purpose of Phase 9C

Phase 9C defines hardening work before any additional live database or security checks.

The plan covers:

- read-denial checks for anon/public access;
- authenticated non-admin read-denial checks, if a safe client path exists;
- orphan smoke diagnostic design;
- whether to add non-mutating verification helpers;
- how future checks should stay bounded and reversible;
- how to avoid broad cleanup or production data exposure.

Phase 9C does not implement or run these checks.

## 4. Strict non-goals

Phase 9C does not:

- perform database operations;
- rerun the live smoke;
- execute RLS tests;
- execute SQL;
- run migrations;
- regenerate Supabase types;
- modify generated Supabase types;
- add source code;
- add tests;
- modify smoke scripts;
- modify helpers;
- add API routes;
- add UI integration;
- add extraction integration;
- add crawler automation;
- add LLM behavior;
- write to `public.tools`;
- write to `discovered_tools`;
- write audit events;
- approve, promote, publish, rank, or recommend candidates.

## 5. RLS / security planning

The existing schema posture is strict:

- `public.discovery_candidate_tools` has RLS enabled.
- Direct privileges are revoked from `anon` and `authenticated`.
- The table has a deny-all policy:

  ```text
  Deny all access to discovery_candidate_tools
  ```

- Existing Discovery Engine base tables such as `discovery_sources` and `discovery_runs` also follow deny-by-default policies in the Discovery schema migration.

Future security verification should prove the following without exposing row payloads:

- service-role/admin path can insert and clean up controlled test fixtures through an approved smoke harness;
- anon/public client cannot read `discovery_candidate_tools`;
- anon/public client cannot read a smoke candidate by exact ID;
- anon/public client cannot list candidate rows;
- authenticated non-admin client cannot read candidate rows, if such a role/client path exists safely;
- errors/results are minimal and do not leak row payloads;
- no secrets are printed;
- no full candidate payload is printed.

Phase 9C only plans these checks. It does not implement them and does not run them.

## 6. RLS check design options

### Option A: Extend the existing live smoke harness later

This option would add anon/public read-denial checks to the existing live smoke while the staged candidate exists and before exact-ID cleanup.

Benefits:

- one fixture lifecycle;
- read-denial checks can use the exact created candidate ID;
- cleanup remains close to the fixture creation code.

Risks:

- increases the complexity of the already successful candidate staging smoke;
- mixes insertion, readback, cleanup, and RLS denial behavior in one script;
- makes future failures harder to classify.

Recommendation: not the first choice. Keep the successful staging smoke stable unless a later review decides consolidation is worth the complexity.

### Option B: Create a separate dedicated RLS smoke script

This option would create a separate opt-in RLS smoke that creates a controlled fixture, checks read-denial behavior, and cleans up exact IDs.

Benefits:

- isolates security-check behavior from the existing staging smoke;
- makes failure classification clearer;
- allows a narrower CCR focused on RLS denial behavior;
- avoids destabilizing the passing Phase 9A smoke path.

Risks:

- creates a second live DB smoke path that needs the same cleanup discipline;
- repeats fixture setup unless a future shared fixture helper is approved;
- still requires explicit user approval before any live DB operation.

Recommendation: safest path for the next live security check, after a focused planning and implementation phase.

### Option C: Non-mutating read-denial checks against known nonexistent IDs

This option would use anon/public clients to query nonexistent candidate IDs.

Benefits:

- no fixture creation;
- no cleanup required;
- lower operational risk.

Limitations:

- a nonexistent-ID denial check cannot prove that existing candidate rows are protected;
- a "not found" result can be ambiguous unless the client, role, and policy behavior are carefully interpreted;
- it is useful as a supplemental readiness check, not as the main proof.

Recommendation: useful only as an additional non-mutating check. It should not replace a bounded fixture-based RLS smoke if the goal is to prove protection around real candidate rows.

### Option D: Defer RLS checks until a later security-specific phase

This option would defer read-denial verification until after more staging, audit, or schema planning.

Benefits:

- avoids more live DB work immediately;
- gives time to design a broader security test matrix.

Risks:

- delays verification of the table's direct-client denial posture;
- leaves a known hardening item untested after successful candidate staging.

Recommendation: acceptable only if there is no immediate need to continue candidate staging security validation. Otherwise, proceed to a focused RLS smoke planning phase.

## 7. Recommended RLS hardening direction

The safest next direction is a separate, focused RLS smoke track:

```text
Phase 9D — Candidate Staging RLS Smoke Planning
```

Phase 9D should define exact clients, fixture strategy, denial expectations, safe output, cleanup rules, and command boundaries before implementation.

This avoids adding more behavior directly to the existing passing staging smoke script and keeps the next live security check reviewable.

## 8. Orphan smoke diagnostic planning

Future live smoke failures should have a safe way to identify possible leftover smoke rows without broad cleanup.

The first diagnostic should be read-only unless separately approved.

Safe marker inputs may include:

- `source_evidence_locator` containing the known smoke marker pattern;
- smoke-specific candidate name/title;
- smoke-specific source slug;
- smoke-specific source config marker;
- smoke-specific run/source linkage;
- exact candidate/run/source IDs reported by a failed smoke;
- exact `audit_correlation_id` reported by a failed smoke.

Future orphan diagnostics may identify:

- smoke candidate rows in `discovery_candidate_tools`;
- smoke discovery run rows in `discovery_runs`;
- smoke discovery source rows in `discovery_sources`.

The diagnostic must not rely on broad date-only, status-only, name-only, or domain-only cleanup criteria.

## 9. Orphan cleanup policy

Future orphan cleanup policy should be:

1. Run read-only diagnostics first.
2. Report exact candidate/run/source IDs and safe marker values.
3. Require explicit James approval before cleanup.
4. Cleanup by exact IDs only.
5. Do not cleanup by date, status, name, or domain alone.
6. Do not cleanup from `public.tools`.
7. Do not cleanup from `discovered_tools`.
8. If cleanup fails, report exact IDs and marker for manual cleanup.

Automatic broad deletion should remain forbidden unless a separate Gemini-approved cleanup phase designs and verifies stricter safeguards.

## 10. Non-mutating verification helper options

A future helper may be useful if it remains non-mutating.

Potential safe checks:

- verify environment variable presence without printing values;
- verify the live smoke opt-in guard behavior;
- verify import/type readiness;
- run a script dry-run mode that stops before client creation;
- assert generated type shape locally without querying the database;
- report planned command boundaries without executing live DB operations.

Important limitation:

Schema/table existence verification usually requires DB access. If a helper queries a remote database, it is no longer purely non-mutating local verification and should be reviewed as a live DB check even if it performs no writes.

## 11. Audit readiness planning

Phase 9C does not add audit event writes.

Current candidate staging persists `audit_correlation_id`, which is sufficient for the current staging smoke and cleanup traceability.

Future audit compatibility must account for the existing `discovery_audit_events.action` constraints. The earlier Discovery audit table was created for discovered-tool lifecycle actions such as approve/reject/flag/ignore/batch action/duplicate marking. Candidate staging lifecycle events may require a separate compatibility design before any audit write is added.

Required future audit gate:

- separate Gemini-approved audit compatibility phase before staging writes to `discovery_audit_events`;
- no raw payloads in audit metadata;
- no secrets or environment values in audit metadata;
- no candidate approval/promotion/publish semantics in staging audit events.

Audit planning should not block RLS/orphan diagnostic planning, but audit integration remains deferred.

## 12. Discovery source accountability

`discoverySourceId` remains required at the staging method boundary.

Current table state:

- the staging method accepts and returns `discoverySourceId`;
- `public.discovery_candidate_tools` does not persist a `discovery_source_id` column;
- the live smoke creates a dedicated `discovery_sources` fixture and a dedicated `discovery_runs` fixture linked to that source;
- candidate rows persist `discovery_run_id`, not `discovery_source_id`.

Phase 9C does not change schema.

A future schema phase may add direct `discovery_source_id` persistence if Gemini approves the storage and migration plan. Until then, RLS/orphan diagnostics should account for source fixture IDs through the run/source linkage created by the smoke harness.

## 13. Future safety gates

Before any future RLS/orphan live check:

1. Gemini must approve this Phase 9C plan before commit.
2. Gemini must separately approve any RLS smoke script implementation.
3. James must explicitly approve any live DB check before execution.
4. Repo status must be clean before a live run.
5. The exact command boundary must be documented.
6. Environment values must be checked but not printed.
7. Fixture and cleanup plans must be exact and reviewed.
8. Cleanup must remain exact-ID only unless separately approved.
9. Final repo status must be verified.
10. Results must be documented after any live run.

## 14. Suggested next phases

Recommended sequence:

1. `Phase 9D — Candidate Staging RLS Smoke Planning`
2. `Phase 9E — Candidate Staging RLS Smoke Harness Implementation`
3. `Phase 9F — Candidate Staging RLS Smoke Execution`
4. `Phase 9G — Candidate Staging RLS Smoke Result Documentation`

This sequence is safest because it separates planning, implementation, execution, and result recording. It also keeps the existing successful candidate staging smoke harness stable and avoids mixing additional security behavior into the already validated script.

Orphan diagnostics should be included in Phase 9D planning as a required consideration. If the RLS plan becomes too broad, split orphan diagnostics into a separate follow-up:

```text
Phase 9D-alt — Candidate Staging Orphan Diagnostic Planning
```

The primary recommendation remains Phase 9D RLS smoke planning first, with orphan diagnostics scoped explicitly inside that plan.

## 15. Rollback plan

Phase 9C rollback is docs-only:

- remove `docs/discovery-phase-9c-candidate-staging-smoke-hardening-rls-security-planning.md`;
- no database rollback is needed because Phase 9C performs no database operation.

## 16. CCR expectations for future live security phase

Any future live RLS/orphan check CCR must include:

- exact command used;
- exact fixture IDs, if any;
- exact smoke marker used;
- exact `audit_correlation_id`, if applicable;
- read-denial results;
- cleanup results;
- confirmation no payloads were printed;
- confirmation no secrets were printed;
- confirmation no `public.tools` rows were touched;
- confirmation no `discovered_tools` rows were touched;
- confirmation no API/UI/extraction/crawler/LLM integration ran;
- final `git status --short --branch`.

## 17. Final Phase 9C recommendation

Phase 9C recommends a dedicated RLS smoke planning phase before any new live DB/security checks.

Do not add RLS checks directly to production app routes or UI. Do not add extraction, crawler, audit-write, approval, promotion, publish, ranking, recommendation, or LLM behavior. Keep the next step focused on proving direct-client read denial for staged candidates through a separately reviewed, opt-in, exact-cleanup smoke path.
