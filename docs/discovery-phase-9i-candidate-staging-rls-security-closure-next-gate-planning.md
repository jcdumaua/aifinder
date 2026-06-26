# Phase 9I — Candidate Staging RLS Security Closure / Next-Gate Planning

## 1. Phase title and status

Phase 9I is a docs-only security closure and next-gate planning phase.

This phase performs no database operations, does not rerun the live RLS smoke, does not set the RLS smoke opt-in environment variable, and changes no source code, tests, helpers, generated Supabase types, package scripts, migrations, API routes, UI components, extraction code, crawler code, LLM behavior, audit writes, `public.tools` writes, or `discovered_tools` writes.

## 2. Current state summary

Phase 8X implemented:

```ts
stageNormalizedDiscoveryCandidate(...)
```

Phase 8Z added the functional candidate staging live smoke harness. Phase 9A executed that functional staging smoke successfully. Phase 9B documented the functional smoke result.

Phase 9C planned RLS/security hardening. Phase 9D planned a dedicated RLS smoke. Phase 9E implemented the guarded RLS smoke harness. Phase 9F created the execution approval gate. Phase 9G executed the approved live RLS smoke once. Phase 9H documented the successful RLS smoke result.

Final known repository status after the Phase 9H push:

```text
## main...origin/main
```

Candidate extraction remains separate from candidate staging verification. API/UI/extraction/crawler/LLM integration remains deferred.

## 3. Verified security result

The anonymous/public RLS verification track is now closed for the current candidate staging table behavior.

Verified Phase 9G result:

```text
Service-role control read: pass
Anonymous exact-ID read denial: pass (permission_denied)
Anonymous list denial: pass (permission_denied)
Guessed exact candidate ID denial: pass (permission_denied)
Authenticated non-admin denial: skipped (no approved non-admin test identity strategy)
No payload leakage: pass
Exact-ID cleanup: verified
```

Security interpretation:

- `discovery_candidate_tools` was not readable by anonymous/public clients through exact-ID reads.
- `discovery_candidate_tools` was not listable by anonymous/public clients.
- Even a known or guessed candidate ID did not expose the staged candidate row.
- Service-role/admin server-side access remains available for controlled internal staging verification.
- No payload leakage or secret leakage was observed.
- Exact smoke fixtures were cleaned up.

## 4. What is formally closed

The following tracks are complete for the current stage:

- functional candidate staging method implementation;
- mocked candidate staging tests;
- functional live staging smoke;
- functional live staging smoke result documentation;
- RLS/security hardening planning;
- dedicated RLS smoke planning;
- guarded RLS smoke harness implementation;
- RLS smoke execution approval gate;
- approved live anonymous/public RLS smoke execution;
- RLS smoke result documentation.

This closure applies to the current `public.discovery_candidate_tools` staging boundary and current RLS expectations.

## 5. Remaining gaps

### Authenticated non-admin RLS coverage

Authenticated non-admin RLS coverage was skipped because no approved safe non-admin test identity strategy exists.

Gemini confirmed this does not block candidate extraction planning. It should remain deferred unless a real non-admin Discovery Engine role/client path becomes relevant or James/Gemini explicitly require this coverage before broader staging integration.

### Audit compatibility

Candidate staging currently persists `audit_correlation_id`.

No audit events are written by candidate staging yet. Future audit integration must respect the existing `discovery_audit_events.action` constraints and avoid raw payloads, secrets, public-tool promotion semantics, and unreviewed action names.

Audit event writes require a separate Gemini-approved compatibility phase.

### Source accountability

`discoverySourceId` is required at the `stageNormalizedDiscoveryCandidate(...)` method boundary.

The current candidate staging table does not persist `discovery_source_id`. This creates a traceability gap for future extraction pipeline integration because a staged candidate can be tied to a discovery run and audit correlation ID, but not directly to the source ID supplied at the method boundary.

A separate schema planning phase is likely needed before extraction integration.

### Extraction pipeline integration

Candidate extraction remains not implementation-ready until separately planned.

No crawler/extraction/LLM integration exists yet. The future pipeline should remain:

```text
Crawler → Normalizer → Staging
```

It must not include automatic approval, promotion, public publishing, ranking, recommendation, `public.tools` writes, or `discovered_tools` writes.

## 6. Candidate next-gate options

### Option A — Authenticated Non-Admin RLS Test Identity Planning

Purpose:

Plan safe authenticated non-admin RLS coverage.

Pros:

- improves coverage beyond anonymous/public clients;
- prepares future role-based admin/non-admin distinctions;
- may become useful if Discovery Engine access expands beyond service-role/admin workflows.

Cons:

- requires a safe test identity strategy;
- may require user/session handling that is not yet part of the Discovery Engine track;
- may be premature if non-admin Discovery Engine access does not exist;
- Gemini already confirmed the skipped non-admin check does not block candidate extraction planning.

Recommendation: defer unless a real non-admin Discovery Engine access path becomes relevant or a reviewer requires this before later integration.

### Option B — Candidate Staging Audit Compatibility Planning

Purpose:

Plan how candidate staging could write audit events later without violating existing action constraints.

Pros:

- improves observability;
- aligns with persisted `audit_correlation_id`;
- prepares production-grade traceability;
- supports future admin review and cleanup diagnostics.

Cons:

- audit action constraints need careful review;
- may require action taxonomy, constraint, or schema decisions;
- should not be mixed into extraction implementation;
- audit writes must remain safe and metadata-bounded.

Recommendation: needed before audit writes, but not necessarily before source-accountability schema planning.

### Option C — Candidate Staging Source Accountability Schema Planning

Purpose:

Plan whether and how to persist `discoverySourceId` in `discovery_candidate_tools`.

Pros:

- closes the current source traceability gap;
- important before automated extraction pipeline writes candidates;
- improves cleanup, diagnostics, review UI context, audit trails, and future orphan analysis;
- aligns the database schema with the staging method boundary.

Cons:

- likely requires a migration and generated type refresh later;
- needs RLS, nullability, backfill, and index planning;
- must avoid broad schema changes or automatic public-tool behavior.

Recommendation: highest-priority next planning gate before extraction pipeline integration.

### Option D — Candidate Extraction Staging Pipeline Planning

Purpose:

Plan the future Crawler → Normalizer → Staging pipeline.

Pros:

- moves the Discovery Engine toward actual candidate extraction;
- connects existing crawler/fetch, normalizer, staging, and RLS work;
- can define exact handoff boundaries before implementation.

Cons:

- may be premature before source-accountability and audit compatibility decisions;
- must preserve strict no-approval/no-promotion/no-public-tools boundaries;
- needs strong safety, observability, and rollback rules.

Recommendation: proceed only after source-accountability and audit-compatibility decisions are made or explicitly deferred.

## 7. Recommended next gate

Recommended next phase:

```text
Phase 9J — Candidate Staging Source Accountability Schema Planning
```

Justification:

- anonymous/public RLS is now verified;
- authenticated non-admin RLS can remain deferred;
- `discoverySourceId` is already required at the method boundary but is not persisted;
- source traceability should be decided before extraction pipeline integration;
- a source-accountability plan can determine whether a migration is needed, how nullability/backfill should work, and how generated types should be refreshed later;
- this keeps the workflow from connecting extraction to staging before traceability is mature.

Audit compatibility should follow as a separate phase rather than being combined with source-accountability schema planning. Splitting them keeps schema accountability and audit action taxonomy review focused and easier to validate.

## 8. Future phase sequencing recommendation

Recommended bounded sequence:

1. `Phase 9J — Candidate Staging Source Accountability Schema Planning`
2. `Phase 9K — Candidate Staging Audit Compatibility Planning`
3. `Phase 10A — Candidate Extraction Staging Pipeline Planning`
4. `Phase 10B — Candidate Extraction Staging Pipeline Implementation Plan`

This sequence authorizes no implementation by itself. Each phase should keep its own Gemini gate, boundaries, verification plan, and explicit James approval requirements.

## 9. Security closure statement

The candidate staging table has passed the required anonymous/public RLS verification for the current Discovery Engine staging boundary.

Future extraction integration may proceed to planning only after source-accountability and audit-compatibility decisions are made or explicitly deferred. Implementation of extraction, crawler integration, API/UI integration, audit writes, schema changes, candidate writes, or public-tool promotion remains unauthorized until separate phases approve them.

## 10. Safety boundaries preserved

Phase 9I preserved these boundaries:

- no live RLS smoke was rerun;
- no RLS smoke opt-in environment variable was set;
- no database operations occurred;
- no candidates, discovery runs, or discovery sources were created;
- no migrations, Supabase type generation, or remote SQL ran;
- no source, test, helper, package, or generated type files changed;
- no API/UI/extraction/crawler/LLM integration was added;
- no `public.tools` writes occurred;
- no `discovered_tools` writes occurred;
- no audit event writes occurred.

## 11. Rollback plan

Phase 9I rollback is docs-only:

- remove `docs/discovery-phase-9i-candidate-staging-rls-security-closure-next-gate-planning.md`;
- no database rollback is needed because Phase 9I performs no database operations.

## 12. CCR expectations

The Phase 9I CCR must confirm:

- only docs changed;
- no live RLS smoke was rerun;
- the opt-in environment variable was not set;
- no database operations occurred;
- no candidates, discovery runs, or discovery sources were created;
- no migrations, Supabase type generation, or remote SQL ran;
- no source, test, helper, package, or generated type files changed;
- no API/UI/extraction/crawler/LLM integration was added;
- no `public.tools` or `discovered_tools` writes occurred;
- no audit event writes occurred;
- the safe opt-out guard still works;
- final `git status --short --branch`;
- recommended next phase and sequence.

## 13. Final Phase 9I decision summary

Phase 9I closes the anonymous/public candidate staging RLS verification track for the current staging boundary.

The safest next gate is source-accountability schema planning, followed by audit compatibility planning, then extraction staging pipeline planning. This keeps traceability and observability decisions ahead of any future automated extraction-to-staging integration.
