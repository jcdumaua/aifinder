# Phase 11D — Candidate Extraction Manual Live Staging Verification Gate

## 1. Status

Phase 11D is a docs-only verification gate for a future manual live candidate staging verification.

This phase does not authorize or run a live staging write. It does not execute a live verification, does not run live smoke, does not perform database commands, and does not send any request to `POST /api/admin/discovery/candidate-extraction/invoke`.

`dry_run: false` remains blocked until a later explicitly approved live verification execution phase. The placeholder phrase:

```text
Approve run candidate extraction live staging write
```

remains inactive during Phase 11D document creation. Any future activation must be limited to the exact scope defined by an approved gate, must receive Gemini review, and must require exact James approval.

## 2. Sources Reviewed

Phase 11D reviewed the following local project sources only:

- `docs/discovery-phase-11a-candidate-extraction-manual-live-staging-contract-design.md`
- `docs/discovery-phase-11b-candidate-extraction-manual-live-staging-implementation-plan.md`
- `lib/discovery/discovery-candidate-extraction-invocation.ts`
- `app/api/admin/discovery/candidate-extraction/invoke/route.ts`
- `testing/discovery-candidate-extraction-invocation.test.mjs`
- `testing/discovery-candidate-extraction-invocation-route.test.mjs`
- `lib/discovery/discovery-candidate-staging-admin.ts`
- `lib/discovery-candidate-normalizer.ts`
- `supabase/migrations/20260617003000_create_discovery_engine_schema_phase_3b.sql`
- `supabase/migrations/20260617004500_seed_discovery_queue_smoke_test.sql`
- `supabase/migrations/20260617005500_cleanup_discovery_queue_smoke_test.sql`
- `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql`
- `supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql`

No live Supabase commands, remote SQL, database mutations, route requests, live UI dry-runs, live smoke commands, migrations, or type generation were run for this review.

## 3. Current Phase 11C Implementation Summary

Phase 11C added a guarded backend implementation path while keeping production live staging blocked by default.

Confirmed implementation details:

- `CandidateExtractionInvocationOptions` is server-created only.
- `CandidateExtractionLiveStagingGate` exists and currently supports only `mode: "test_only_mocked_staging"`.
- Default `dry_run: false` requests are rejected with `live_invocation_not_enabled`.
- The admin route passes no live staging gate to the helper.
- The route validates the request body, rejects unsupported fields, and rejects client-supplied `invoked_by_admin_user_id`.
- The route continues deriving admin identity server-side from the verified admin session.
- The route still requires admin session verification, CSRF verification, and admin rate limiting.
- The helper exports `CANDIDATE_EXTRACTION_LIVE_STAGING_MAX_CANDIDATES = 1`.
- The guarded live branch requires `source_scope: "single_run"`.
- The guarded live branch requires server-created `getLiveStagingCandidate` and `stageCandidate` dependencies.
- The test-only mocked staging path overrides/forces trusted source, run, and audit context before staging.
- Existing tests prove the placeholder phrase remains inactive at helper and route boundaries.
- Existing tests prove a client request body cannot activate `liveStagingGate`.
- Existing tests prove no direct `public.tools`, `discovered_tools`, or audit write path was introduced in the route/helper.
- No production live write execution exists.

## 4. Verification Gate Purpose

This gate defines what must be true before any future real manual live staging verification is considered.

The gate exists to ensure:

- exactly one bounded candidate is considered;
- the verification is scoped to one exact source/run context;
- the inserted row can be identified exactly;
- read-after-write verification is defined before execution;
- exact-ID cleanup is defined before execution;
- read-after-cleanup verification is defined before execution;
- no public catalog publishing occurs;
- no `public.tools` writes occur;
- no `discovered_tools` writes occur;
- no broad deletes are allowed;
- no uncontrolled route invocation is allowed;
- no UI live-write control is introduced.

## 5. Future Live Verification Execution Phase

The recommended future execution phase is:

```text
Phase 11E — Candidate Extraction Manual Live Staging Verification Execution
```

Phase 11E is the earliest possible phase where a real live candidate staging write could be considered. It must not begin unless:

- this Phase 11D document is reviewed by Gemini;
- James approves the Phase 11D commit and push;
- Phase 11D is pushed to `main`;
- a separate Phase 11E prompt is created;
- James gives the exact live verification approval phrase defined by the approved Phase 11D gate;
- Codex follows only the exact scoped commands/actions approved for Phase 11E.

## 6. Approval Phrase Control

Phase 11D chooses the safer approval policy: Option A.

The existing placeholder phrase remains inactive:

```text
Approve run candidate extraction live staging write
```

The narrower Phase 11E approval phrase should be:

```text
Approve run Phase 11E candidate extraction live staging verification
```

No live verification phrase is active during Phase 11D document creation.

Vague approval such as “approved, proceed” is not valid for Phase 11E live verification. Exact phrase approval is required.

The Phase 11E phrase, if later activated by a Gemini-approved execution gate, may authorize only the exact documented row limit, source/run scope, cleanup, and verification steps. It must not authorize:

- public publishing;
- `public.tools` writes;
- `discovered_tools` writes;
- admin UI live-write controls;
- migrations;
- generated type regeneration;
- package/dependency changes;
- repeated live runs;
- batch operations;
- crawler automation;
- LLM automation.

## 7. Required Future Preconditions Before Phase 11E

Before any Phase 11E live verification can run, all of the following must be true:

- repo status is clean;
- latest pushed commit is confirmed;
- Gemini has approved Phase 11D;
- Phase 11D has been committed and pushed to `main`;
- safe local checks pass;
- no pending migrations are part of the execution scope;
- no package or generated type changes are pending;
- target table is confirmed as `public.discovery_candidate_tools`;
- existing schema fields are confirmed from repository migrations/types;
- exact candidate input source is confirmed;
- exact `discovery_source_id` is confirmed;
- exact `discovery_run_id` is confirmed;
- exact `audit_correlation_id` is planned;
- exact cleanup identifiers are planned;
- exact read-after-write checks are planned;
- exact read-after-cleanup checks are planned;
- exact audit expectations are planned;
- exact failure stop conditions are planned.

Open items must be resolved or explicitly carried as:

```text
TBD / requires schema confirmation
```

## 8. Future Phase 11E Row Limit

The maximum allowed live verification write is:

```text
max_candidates: 1
```

Only one candidate row may be inserted.

Phase 11E must not perform:

- batch insert;
- repeated live write loop;
- automated crawl;
- LLM batch extraction;
- public publishing;
- follow-up mutation except exact-ID cleanup explicitly included in the approved procedure.

## 9. Future Phase 11E Source And Run Scope

The required source scope is:

```text
source_scope: "single_run"
```

Phase 11E must define:

- exact `discovery_source_id`;
- exact `discovery_run_id`;
- exact candidate input source;
- exact `audit_correlation_id`;
- no client-provided override of trusted context;
- no route body activation of the live gate;
- no broad source/run scan.

Confirmed target linkage fields:

- `public.discovery_candidate_tools.discovery_run_id`
- `public.discovery_candidate_tools.discovery_source_id` from the Phase 9L source-accountability migration draft

If the target environment schema cannot confirm `discovery_source_id`, Phase 11E must stop and mark:

```text
TBD / requires schema confirmation
```

## 10. Candidate Input Requirements

Future live verification candidate input must include the minimum safe normalized candidate data required by the existing normalizer/staging contract.

Confirmed candidate/staging fields include:

- `discovery_run_id`
- `source_url`
- `source_url_normalized`
- `source_domain`
- `source_evidence_kind`
- `source_evidence_locator`
- `extraction_mode`
- `extraction_version`
- `candidate_name`
- `candidate_website_url`
- `candidate_canonical_url`
- `candidate_normalized_domain`
- `candidate_description`
- `candidate_category_hint`
- `candidate_pricing_hint`
- `candidate_platform_hints`
- `candidate_social_links`
- `candidate_app_links`
- `evidence_summary`
- `confidence_bucket`
- `risk_flags`
- `duplicate_check_status`
- `duplicate_signal_types`
- `duplicate_blocking`
- `possible_duplicate_tool_id`
- `possible_duplicate_discovered_tool_id`
- `possible_duplicate_candidate_id`
- `duplicate_checked_at`
- `candidate_status`
- `reviewed_at`
- `reviewed_by`
- `review_notes`
- `rejection_reason_code`
- `audit_correlation_id`
- `cleanup_status`
- `eligible_for_cleanup_at`
- `archived_at`

The candidate status must be forced to:

```text
candidate_status = "staged"
```

Separate persisted row field for the invocation schema version is not confirmed. The existing candidate staging table uses `extraction_version`.

```text
TBD / requires schema confirmation
```

## 11. Future Live Invocation Mechanism

Future live verification should prefer a controlled server-side execution path over a UI/manual route body path.

Required mechanism constraints:

- the live gate must be created server-side only;
- the client body must not activate live mode;
- `dry_run: false` must not be accepted solely from a route payload;
- the live gate must include exact phase/scope metadata;
- execution must be single-use for the approved phase;
- no public UI control may exist.

If the existing admin route is used in a future execution phase, it must still require:

- admin authentication;
- CSRF verification;
- exact approved phrase;
- exact source/run/candidate scope;
- server-side live gate activation;
- sanitized responses only.

## 12. Read-After-Write Verification Plan

Phase 11E must define read-after-write verification before any insert is attempted.

The verification must confirm:

- exactly one row was inserted;
- inserted row ID was captured;
- `candidate_status = "staged"`;
- expected source/run/audit correlation fields match;
- no `public.tools` row was created;
- no `discovered_tools` row was created;
- no unexpected candidate rows were created;
- no raw HTML, raw payloads, secrets, tokens, CSRF values, environment values, DB credentials, service-role details, or stack traces leaked;
- audit events are verified only if audit writes are implemented and explicitly approved.

Exact read-after-write query shape is not activated in Phase 11D and must be defined in Phase 11E.

```text
TBD / requires schema confirmation
```

## 13. Cleanup / Rollback Plan

Phase 11E must define cleanup before any live insert is attempted.

Cleanup requirements:

- cleanup must be exact-ID based;
- cleanup must target only the row created by Phase 11E;
- no broad delete is allowed;
- no delete by vague name/domain alone is allowed;
- read-after-cleanup must prove the row is gone;
- cleanup failure must stop the workflow and require manual review;
- cleanup commands must not be run in Phase 11D.

The expected cleanup target is `public.discovery_candidate_tools.id` for the single inserted Phase 11E row.

Exact cleanup query shape is not activated in Phase 11D and must be defined in Phase 11E.

```text
TBD / requires schema confirmation
```

## 14. Audit Expectations

Future live write attempts should have an audit correlation ID.

Expected future audit behavior:

- accepted insert should be auditable if an approved audit write path exists;
- rejected live attempts should be auditable if an approved audit write path exists;
- cleanup should be auditable if an approved audit write path exists;
- no audit writes occur in Phase 11D.

Confirmed audit table from migration:

- `public.discovery_audit_events`

Confirmed audit fields from migration:

- `id`
- `discovered_tool_id`
- `action`
- `actor_id`
- `actor_label`
- `message`
- `metadata`
- `created_at`

The Phase 9L migration draft expands candidate-staging audit action compatibility with:

- `candidate-staged`
- `candidate-stage-failed`
- `candidate-duplicate-hint-recorded`
- `candidate-cleanup-performed`

A direct `discovery_candidate_tool_id` audit column is not confirmed. Candidate staging audit linkage may require `metadata` or a later schema change.

```text
TBD / requires schema confirmation
```

Audit payloads must never include:

- raw HTML;
- raw extracted payloads;
- secrets;
- service-role details;
- credentials;
- cookies;
- tokens;
- CSRF values;
- environment values;
- stack traces;
- unredacted unexpected errors.

## 15. Failure Handling And Stop Conditions

Phase 11E must stop immediately if any of the following occur:

- repo is dirty unexpectedly;
- latest commit is not the approved commit;
- environment variables are missing or unexpected;
- target table schema cannot be confirmed;
- source/run scope cannot be confirmed;
- more than one candidate would be inserted;
- inserted row cannot be identified exactly;
- read-after-write does not match expected values;
- `public.tools` changes are detected;
- `discovered_tools` changes are detected;
- cleanup fails;
- any unsafe error or leak is observed;
- live smoke env vars are required;
- migrations or type regeneration are suggested;
- a broad delete is required;
- the route/helper/UI requires modification during execution.

## 16. Commands That Remain Forbidden In Phase 11D

The following commands/actions remain forbidden in Phase 11D:

- live staging execution;
- live smoke execution;
- `dry_run: false` execution;
- POST to `/api/admin/discovery/candidate-extraction/invoke`;
- DB commands;
- remote SQL;
- `supabase db push`;
- migrations;
- type regeneration;
- package/dependency changes;
- public UI changes;
- admin UI live-write controls;
- public publishing;
- broad deletes.

## 17. Proposed Phase 11E Scope

Proposed next live execution scope:

```text
Phase 11E — Candidate Extraction Manual Live Staging Verification Execution
```

The Phase 11E scope must be limited to:

- one exact candidate;
- one exact source/run scope;
- one exact approval phrase;
- one exact insert;
- read-after-write verification;
- exact-ID cleanup;
- read-after-cleanup verification;
- no public publishing;
- no UI changes;
- no repeated runs;
- no batch operations.

## 18. Phase 11D Non-Goals

Phase 11D explicitly does not include:

- implementation;
- test modification;
- route/helper/UI changes;
- DB writes;
- live verification;
- smoke testing;
- public publishing;
- approval phrase execution;
- commit;
- push.

## 19. Verification Performed

Phase 11D verification must remain local and non-live.

Local post-document verification performed:

- `git diff --check`: passed.
- `npm run check`: passed.
- `git status --short --branch`: confirmed `main` with only this Phase 11D docs file uncommitted.
- `git diff --stat`: no tracked-file diff because the Phase 11D docs file remains untracked before commit.
- `git diff --name-only`: no tracked-file diff because the Phase 11D docs file remains untracked before commit.

Phase 11D did not run live or DB-related commands.
