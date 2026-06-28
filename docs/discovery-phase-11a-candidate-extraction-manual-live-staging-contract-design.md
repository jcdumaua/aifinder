# Discovery Phase 11A — Candidate Extraction Manual Live Staging Contract Design

## 1. Title and Phase Summary

Phase 11A is a docs-only live staging contract design for a possible future manual admin-triggered candidate extraction staging write.

This phase does not enable `dry_run: false`.

This phase does not implement live staging.

This phase does not authorize live database writes.

This phase only defines the future mutation, audit, security, rollback, and verification contract that later phases must follow before any live candidate staging write can ever be considered.

## 2. Current State Recap

Latest pushed commit:

```text
037d925 Document extraction live staging readiness gate
```

Current completed foundation:

- Phase 10V implemented the admin UI dry-run panel.
- Phase 10W live UI dry-run verification passed after exact James approval.
- Phase 10X documented the successful live UI dry-run result.
- Phase 10Y established production readiness boundaries.
- Phase 10Z defined live staging readiness prerequisites.
- The admin UI dry-run path is verified.
- Production extraction is not enabled.
- `dry_run: false` remains blocked.
- No live staging write has been authorized.

Current implementation boundary:

- the internal invocation helper rejects `dry_run: false` with `live_invocation_not_enabled`;
- the admin API route remains dry-run-only;
- the admin UI sends only `dry_run: true`;
- the staging pipeline and staging helper exist separately and are tested;
- no production live staging write path is wired to the admin UI or route.

## 3. Purpose of the Future Live Staging Contract

A future manually approved admin action may stage normalized extraction output into candidate staging only.

It must not:

- publish tools;
- write to public `tools`;
- write to `discovered_tools`;
- auto-approve candidates;
- trigger crawler automation;
- trigger LLM automation;
- run scheduled or background discovery;
- create autonomous discovery execution.

The future action, if ever implemented, must remain a manual admin-only staging operation. It may create or update candidate staging records only inside the approved staging table and must return safe summaries only.

## 4. Current Dry-Run-Only Boundary

Current system behavior:

- `lib/discovery/discovery-candidate-extraction-invocation.ts` fails closed for `dry_run: false` with `live_invocation_not_enabled`;
- `app/api/admin/discovery/candidate-extraction/invoke/route.ts` calls the dry-run invocation helper and does not enable live staging;
- `components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx` and `components/admin/discovery/discovery-candidate-extraction-dry-run-utils.ts` always construct requests with `dry_run: true`;
- route responses currently confirm `no_public_write_confirmed: true` and `no_discovered_write_confirmed: true`;
- `lib/discovery/discovery-candidate-extraction-staging-pipeline.ts` and `lib/discovery/discovery-candidate-staging-admin.ts` provide the mapper-to-staging and staging insert layers separately;
- future live staging must be explicitly added in later phases only.

Phase 11A does not change this behavior.

## 5. Target Table / Mutation Scope

Confirmed target table:

```text
public.discovery_candidate_tools
```

Confirmed source of table definition:

```text
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql
supabase/migrations/20260626171330_candidate_staging_schema_audit_expansion.sql
lib/supabase/database.types.ts
```

Current helper behavior:

- `stageNormalizedDiscoveryCandidateWithClientFactory(...)` inserts into `discovery_candidate_tools`;
- it uses `.insert(insertPayload)`;
- it does not update or upsert;
- it selects `id,candidate_status,discovery_run_id,audit_correlation_id`;
- it treats success as valid only when `candidate_status === "staged"`.

Future initial live staging contract:

- insert-only unless a later Gemini-approved contract explicitly adds update semantics;
- no upsert by default;
- `candidate_status = "staged"`;
- source/run linkage must be preserved through `discovery_run_id` and `discovery_source_id`;
- audit correlation must be preserved through `audit_correlation_id`;
- request schema version remains `schema_version: "candidate_extraction_invocation.v1"`;
- staging-table schema/version storage uses confirmed field `extraction_version`, not a `schema_version` column;
- no confirmed `schema_version` column exists on `public.discovery_candidate_tools`;
- any future need for a separate staging row schema version field is `TBD / requires schema confirmation`.

### Confirmed staging table fields

Primary key:

- `id`

Source/run linkage:

- `discovery_run_id`
- `discovery_source_id`

Source and evidence fields:

- `source_url`
- `source_url_normalized`
- `source_domain`
- `source_evidence_kind`
- `source_evidence_locator`
- `evidence_summary`

Extraction fields:

- `extraction_mode`
- `extraction_version`

Candidate normalized data fields:

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

Confidence, risk, and eligibility fields:

- `confidence_bucket`
- `risk_flags`

Duplicate/provenance fields:

- `duplicate_check_status`
- `duplicate_signal_types`
- `duplicate_blocking`
- `possible_duplicate_tool_id`
- `possible_duplicate_discovered_tool_id`
- `possible_duplicate_candidate_id`
- `duplicate_checked_at`

Lifecycle and review fields:

- `candidate_status`
- `reviewed_at`
- `reviewed_by`
- `review_notes`
- `rejection_reason_code`

Audit/correlation field:

- `audit_correlation_id`

Cleanup/archive fields:

- `cleanup_status`
- `eligible_for_cleanup_at`
- `archived_at`

Timestamps:

- `created_at`
- `updated_at`

### Nullable fields confirmed by generated types/schema

- `source_domain`
- `source_evidence_locator`
- `candidate_description`
- `candidate_category_hint`
- `candidate_pricing_hint`
- `evidence_summary`
- `confidence_bucket`
- `possible_duplicate_tool_id`
- `possible_duplicate_discovered_tool_id`
- `possible_duplicate_candidate_id`
- `duplicate_checked_at`
- `reviewed_at`
- `reviewed_by`
- `review_notes`
- `rejection_reason_code`
- `eligible_for_cleanup_at`
- `archived_at`
- `discovery_source_id` is nullable in schema, but future live staging must require and write it.

### Fields that must never be set by the client

The client must never set:

- `id`;
- `created_at`;
- `updated_at`;
- `reviewed_at`;
- `reviewed_by`;
- `review_notes`;
- `rejection_reason_code`;
- `cleanup_status`;
- `eligible_for_cleanup_at`;
- `archived_at`;
- `candidate_status`;
- `duplicate_check_status`;
- `duplicate_checked_at`;
- `possible_duplicate_tool_id`;
- `possible_duplicate_discovered_tool_id`;
- `possible_duplicate_candidate_id`;
- any admin identity field.

Admin identity storage on `public.discovery_candidate_tools` is not confirmed. Current confirmed admin identity fields exist on `public.discovery_audit_events` as `actor_id` and `actor_label`. Any future candidate-row admin identity field is `TBD / requires schema confirmation`.

## 6. Request Contract for Future Live Staging

Future server-side request contract, if a later phase enables live staging:

```ts
{
  discovery_source_id: string;
  discovery_run_id: string;
  audit_correlation_id: string;
  invocation_reason: string;
  dry_run: false;
  max_candidates: number;
  source_scope: "single_run";
  schema_version: "candidate_extraction_invocation.v1";
}
```

Contract boundaries:

- this is a future contract only;
- it is not active now;
- current UI must still send `dry_run: true`;
- current route must still reject `dry_run: false`;
- future `dry_run: false` must be accepted only after a separate server-controlled gate exists;
- client must never send `invoked_by_admin_user_id`;
- server must derive admin identity from verified admin session;
- `max_candidates` must remain capped, initially `1`;
- `source_scope` must remain `single_run` for the first live staging design.

Any future live request must fail closed if source/run scope is ambiguous, admin identity is missing, CSRF is invalid, rate limit is exceeded, schema version is invalid, or candidate count exceeds the approved cap.

## 7. Row Mutation Contract

Required future row mutation behavior:

- one approved live staging invocation is scoped to exactly one trusted source/run context;
- initial live staging remains capped to `max_candidates: 1`;
- insert/update only candidate staging rows;
- initial contract is insert-only unless a later phase explicitly approves updates;
- candidate status must remain `staged`;
- public publishing must remain impossible;
- public `tools` writes must remain impossible;
- `discovered_tools` writes must remain impossible;
- no approval status transitions are allowed;
- no background continuation after request completes;
- no automatic retry loop;
- no repeated writes from polling;
- no batch widening without future approval.

The future mutation path should reuse the existing mapper-to-staging and staging helper where possible:

- `mapExtractionToStagingCandidate(...)`;
- `stageMappedExtractionCandidate(...)`;
- `stageNormalizedDiscoveryCandidate(...)`.

If any future implementation bypasses these helpers, it must justify the bypass in a separately reviewed plan.

## 8. Normalized Candidate Mapping Contract

Future live staging must map normalized extraction output into confirmed staging fields.

Confirmed candidate identity fields:

- candidate name maps to `candidate_name`;
- website URL maps to `candidate_website_url`;
- canonical URL maps to `candidate_canonical_url`;
- normalized domain maps to `candidate_normalized_domain`.

Confirmed description and taxonomy fields:

- description/summary maps to `candidate_description`;
- category hint maps to `candidate_category_hint`;
- pricing hint maps to `candidate_pricing_hint`;
- platform hints map to `candidate_platform_hints`;
- social links map to `candidate_social_links`;
- app links map to `candidate_app_links`.

Confirmed source/evidence fields:

- source URL maps to `source_url`;
- normalized source URL maps to `source_url_normalized`;
- source domain maps to `source_domain`;
- source evidence kind maps to `source_evidence_kind`;
- source evidence locator maps to `source_evidence_locator`;
- evidence summary maps to `evidence_summary`.

Confirmed extraction/version fields:

- extraction mode maps to `extraction_mode`;
- extraction version maps to `extraction_version`;
- request schema version remains `schema_version` in the invocation request only;
- no staging-table `schema_version` column is confirmed.

Confirmed confidence/risk fields:

- confidence maps to `confidence_bucket`;
- risk flags map to `risk_flags`.

Confirmed duplicate fields:

- duplicate check status maps to `duplicate_check_status`;
- duplicate signal types map to `duplicate_signal_types`;
- duplicate blocking flag maps to `duplicate_blocking`;
- possible duplicate public tool maps to `possible_duplicate_tool_id`;
- possible duplicate discovered tool maps to `possible_duplicate_discovered_tool_id`;
- possible duplicate staged candidate maps to `possible_duplicate_candidate_id`;
- duplicate checked timestamp maps to `duplicate_checked_at`.

Confirmed source/run/audit fields:

- discovery run ID maps to `discovery_run_id`;
- discovery source ID maps to `discovery_source_id`;
- audit correlation ID maps to `audit_correlation_id`.

Confirmed lifecycle defaults for future live staging:

- `candidate_status` must be `staged`;
- `cleanup_status` must be `active`;
- `reviewed_at` must be `null`;
- `reviewed_by` must be `null`;
- `review_notes` must be `null`;
- `rejection_reason_code` must be `null`;
- `eligible_for_cleanup_at` must be `null`;
- `archived_at` must be `null`.

Skipped/rejected candidates must not create partial staging rows unless a later contract explicitly defines a safe partial-write model.

## 9. Duplicate and Quality Guard Contract

Future live staging must run duplicate and quality guards before mutation.

Required guard categories:

- canonical URL duplicate check;
- normalized domain duplicate check;
- normalized name duplicate check;
- existing staging duplicate check against `public.discovery_candidate_tools`;
- existing public `tools` duplicate check;
- existing `discovered_tools` duplicate check;
- minimum required fields;
- minimum quality threshold;
- provenance/evidence requirement;
- clear safe rejection reason;
- safe skipped candidate reporting.

Confirmed existing staging uniqueness signal:

- migration `20260625171333_create_discovery_candidate_tools.sql` defines `discovery_candidate_tools_run_canonical_active_uidx` on `(discovery_run_id, candidate_canonical_url)` where `candidate_status in ('staged', 'needs_review', 'duplicate_suspected')`.

Future duplicate handling must fail closed or stage with explicit duplicate advisory fields only if the future contract approves that behavior.

Duplicate and quality failures must not leak raw HTML, raw payloads, prompt/model output, secrets, stack traces, tokens, cookies, CSRF values, credentials, or environment values.

## 10. Audit Contract

Future audit requirements:

- one audit correlation ID per live staging invocation;
- server-derived admin identity;
- source/run IDs;
- `dry_run` value;
- max candidate cap;
- action name;
- candidate count attempted;
- candidate count staged;
- candidate count skipped;
- duplicate rejection count;
- validation rejection count;
- safety flags;
- failure/rejection details;
- cleanup/rollback details if applicable.

Confirmed audit table fields:

- `public.discovery_audit_events.id`;
- `public.discovery_audit_events.discovered_tool_id`;
- `public.discovery_audit_events.action`;
- `public.discovery_audit_events.actor_id`;
- `public.discovery_audit_events.actor_label`;
- `public.discovery_audit_events.message`;
- `public.discovery_audit_events.metadata`;
- `public.discovery_audit_events.created_at`.

Confirmed candidate-staging action values added by migration:

- `candidate-staged`;
- `candidate-stage-failed`;
- `candidate-duplicate-hint-recorded`;
- `candidate-cleanup-performed`.

Audit design gaps to resolve later:

- no confirmed `discovery_candidate_tool_id` column exists on `public.discovery_audit_events`;
- candidate row references may need to live in `metadata`, or a future schema change must be separately designed;
- whether audit events are preserved forever or cleaned for smoke fixtures is `TBD / requires policy decision`.

Audit must never include:

- raw HTML;
- raw extracted payloads;
- secrets;
- service-role details;
- credentials;
- cookies, tokens, or CSRF values;
- environment values;
- stack traces;
- unredacted unexpected errors.

## 11. Security / Authorization Contract

Future live staging must require:

- admin-only access;
- verified admin session;
- CSRF validation;
- rate limiting;
- no client-supplied admin identity;
- server-side live-staging gate;
- service-role usage isolated to server-only helper code;
- no service-role values in the client bundle;
- RLS assumptions reviewed before live write;
- no public route;
- no public UI;
- no unauthenticated access;
- safe error responses only.

The future live mode must not be activated by client-supplied `dry_run: false` alone. It must require a server-controlled gate that cannot be toggled from the client.

Any service-role client use must be limited to the existing server-only staging helper boundary or a narrowly reviewed replacement.

## 12. Rollback and Cleanup Contract

Before any live staging smoke or live write, the future plan must define:

- exact-ID cleanup plan for test-created staging rows;
- cleanup query or helper design;
- audit preservation vs cleanup policy;
- partial failure behavior;
- duplicate conflict behavior;
- validation failure behavior;
- orphan-row detection;
- cleanup verification;
- result documentation requirement.

Likely audit policy:

- preserve audit events for traceability by default;
- only clean audit events if a future gate explicitly approves audit cleanup for test fixtures.

If cleanup is part of an approved live test, cleanup must verify:

- candidate staging row removed or moved to an approved cleanup state;
- no orphaned duplicate references remain;
- no source/run rows were modified unless explicitly approved;
- no public `tools` or `discovered_tools` rows were touched.

If cleanup cannot be verified, the future run must stop and report exact IDs for separate James-approved remediation.

## 13. Read-After-Write Verification Contract

Future live staging verification must confirm:

- exact inserted/updated staging row count;
- correct `discovery_source_id`;
- correct `discovery_run_id`;
- correct `audit_correlation_id`;
- `candidate_status = "staged"`;
- correct `extraction_version`;
- request `schema_version = "candidate_extraction_invocation.v1"` was enforced;
- no public `tools` rows;
- no `discovered_tools` rows;
- no unexpected row count changes;
- safe UI summary matches staging state, if UI is used;
- no raw payload leakage;
- cleanup verified if test row cleanup is part of the approved run.

Any read-after-write verification must use approved read paths. Remote SQL, direct DB commands, or Supabase CLI queries must only be used if a separate phase explicitly authorizes them.

## 14. UI Contract for Future Live Staging Mode

Before `dry_run: false` can be exposed, UI must include:

- separate live-staging mode, not hidden inside dry-run UI;
- explicit “Live staging write” warning;
- clear “does not publish publicly” warning;
- exact source/run context visible;
- candidate count cap visible;
- prepare step;
- final confirmation step;
- double-submit prevention;
- disabled state after submit;
- no automatic retry;
- no polling-triggered repeated writes;
- safe success/rejection summary only;
- no raw payload, raw HTML, or secrets rendering;
- no public publishing wording.

The existing dry-run panel must remain dry-run-only unless a later Gemini-reviewed implementation intentionally changes it with explicit James approval.

## 15. Testing Contract

Required future tests:

- helper still rejects `dry_run: false` unless server-side gate enabled;
- route rejects `dry_run: false` unless server-side gate enabled;
- UI cannot send `dry_run: false` until future live mode exists;
- client never sends `invoked_by_admin_user_id`;
- server derives admin identity;
- staging insert uses exact source/run IDs;
- candidate status remains `staged`;
- no public `tools` writes;
- no `discovered_tools` writes;
- duplicate conflict is safe;
- validation rejection is safe;
- rollback/cleanup is tested;
- read-after-write verification is tested;
- rate limiting works;
- double-submit prevention works;
- safe rendering works;
- failure states are sanitized.

Future tests must clearly separate mocked/unit tests, safe opt-out smoke tests, and explicit live tests.

## 16. Live Staging Approval Boundary

Placeholder approval phrase:

```text
Approve run candidate extraction live staging write
```

This phrase is not active in Phase 11A.

It must not be accepted yet.

It can only become active after a future Gemini-approved live staging verification gate defines exact scope, row limits, cleanup, and verification steps.

Until then, no live staging write is authorized.

## 17. Future Implementation Phases

Recommended next sequence:

```text
Phase 11B — Candidate Extraction Manual Live Staging Implementation Plan
Phase 11C — Candidate Extraction Manual Live Staging Implementation
Phase 11D — Candidate Extraction Manual Live Staging Verification Gate
Phase 11E — Candidate Extraction Manual Live Staging Result Documentation
```

Each phase requires Gemini review.

Each commit requires James approval before push.

Any live write requires an exact approval phrase.

No public publishing may be implemented until a much later separate gate.

## 18. Current Hard Stops

Current hard stops:

- no `dry_run: false`;
- no live candidate staging write;
- no public `tools` write;
- no `discovered_tools` write;
- no public publishing;
- no automatic candidate approval;
- no crawler automation;
- no LLM automation;
- no scheduled or background discovery;
- no autonomous discovery;
- no repeated UI live invocation;
- no batch widening;
- no live staging approval phrase active yet.

These hard stops remain active after Phase 11A.

## 19. Non-Goals

Phase 11A explicitly forbids:

- source code changes;
- test changes;
- API route changes;
- helper changes;
- UI changes;
- package changes;
- migrations;
- generated type changes;
- dependency changes;
- rerunning the live UI dry-run;
- clicking the UI;
- sending another POST to `/api/admin/discovery/candidate-extraction/invoke`;
- live smoke;
- opt-in smoke environment variables;
- database commands;
- remote SQL;
- `supabase db push`;
- candidate row creation;
- discovery source row creation;
- discovery run row creation;
- `public.tools` writes;
- `discovered_tools` writes;
- audit event writes;
- crawler automation;
- LLM automation;
- live executor wiring;
- production write wiring;
- public UI changes;
- homepage changes;
- public submit flow changes;
- enabling `dry_run: false`;
- commits;
- pushes.

## 20. Recommended Next Step

Recommended next step: Gemini review of Phase 11A.

If Phase 11A is approved and committed/pushed, recommended next phase:

```text
Phase 11B — Candidate Extraction Manual Live Staging Implementation Plan
```

Phase 11B should still be docs-only planning before implementation.
