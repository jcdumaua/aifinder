# Discovery Phase 10N — Candidate Extraction Production Invocation Contract / Implementation Plan

## 1. Title and Phase Summary

Phase 10N defines the future controlled production invocation contract for the Candidate Extraction Staging Pipeline.

This phase is documentation-only. It does not implement production invocation, does not add source code, does not modify tests, does not create API routes, does not add UI, crawler, LLM, live executor, or background job integration, and does not touch database schema or data.

The purpose of this plan is to define the safest contract and implementation boundaries before any future production invocation work begins.

## 2. Current State Recap

The current foundation is validated but not production-wired:

- Phase 10K live smoke passed exactly once after explicit James approval.
- Phase 10L documented the Phase 10K live smoke result.
- Phase 10M documented and approved production integration readiness planning.
- The candidate extraction mapper is implemented and tested.
- The mapper-to-staging integration bridge is implemented and tested.
- The smoke harness is implemented with safe opt-out behavior.
- The pipeline remains staging-only.
- Candidates created by this path are staged into `discovery_candidate_tools`.
- No public publishing path exists for this pipeline.
- No direct `public.tools` writes exist for this pipeline.
- No direct `discovered_tools` writes exist for this pipeline.
- No autonomous crawler production execution exists for this pipeline.
- No autonomous LLM production execution exists for this pipeline.
- No production API, UI, live executor, background job, or scheduled job wiring exists for this pipeline.

Phase 10M concluded that the Candidate Extraction Staging Pipeline is technically ready for a future controlled production integration planning phase, but not ready for immediate production wiring without a dedicated invocation contract and implementation plan.

## 3. Purpose of the Production Invocation Contract

The future production invocation path must be explicit, bounded, auditable, admin-controlled, and staging-only.

The contract should define:

- who may invoke the pipeline;
- what source/run scope is allowed;
- how inputs are validated;
- how many candidates may be processed;
- whether the invocation is dry-run or staging mode;
- how audit correlation is preserved;
- how partial success and failure are reported;
- how logs remain safe;
- how public table isolation is enforced;
- how future tests and live smokes are gated.

The production invocation contract must prevent the staging pipeline from becoming an implicit publishing path, crawler automation path, LLM execution path, or public ingestion surface.

## 4. Non-Goals

Phase 10N does not authorize or perform:

- production implementation;
- public tool publishing;
- direct writes to `public.tools`;
- direct writes to `discovered_tools`;
- autonomous crawler execution;
- autonomous LLM extraction;
- live executor wiring;
- background jobs;
- scheduled jobs;
- external scraping;
- new database migrations;
- Supabase type regeneration;
- API changes;
- UI changes;
- source code changes;
- test changes;
- package script changes;
- live smoke execution;
- database mutations;
- remote SQL;
- `supabase db push`;
- candidate row creation;
- discovery run row creation;
- discovery source row creation;
- audit event writes.

## 5. Recommended First Production Invocation Path

The safest first production invocation path should be:

- admin-only;
- manual;
- single-run or single-source scoped;
- staging-only;
- explicit human-triggered;
- bounded by a small candidate cap;
- dry-run capable;
- safe-summary only;
- no automatic approval;
- no public publishing;
- no crawler automation;
- no autonomous LLM execution beyond an already-approved bounded extraction contract.

The first implementation should prefer a narrow internal/admin-only server path over broad automation.

Recommended first shape:

```text
admin-approved source/run scope
  -> validate invocation contract
  -> map bounded extraction input
  -> stage mapped candidates only
  -> return safe invocation summary
```

This path should not expose the pipeline to public users and should not be wired into automated crawler or LLM execution until separate phases explicitly approve those boundaries.

## 6. Future Invocation Contract Shape

The future invocation contract should be defined at a planning level before implementation.

Possible contract name:

```ts
CandidateExtractionProductionInvocationInput
```

Possible fields:

| Field | Required | Planning Rule |
| --- | --- | --- |
| `discovery_source_id` | Yes | Must identify the approved discovery source scope. |
| `discovery_run_id` | Yes | Must identify the approved discovery run scope. |
| `audit_correlation_id` | Yes | Must correlate invocation, staged candidates, failures, and future audit records. |
| `invocation_reason` | Yes | Must describe why the admin is invoking staging. |
| `invoked_by_admin_user_id` | Yes | Must identify the authenticated admin or trusted system actor. |
| `dry_run` | Yes | Must allow validation without staging writes. |
| `max_candidates` | Yes | Must cap candidate processing. |
| `source_scope` | Yes | Must define exact scope, such as one source, one run, or one approved bounded input set. |
| `schema_version` | Yes | Must enforce the expected invocation contract version. |
| `candidate_inputs` | Future-dependent | May contain already bounded candidate extraction inputs, or may reference a trusted bounded input source. |
| `request_id` | Optional | May provide request-level traceability if safe. |
| `notes` | Optional | May provide safe admin notes without raw payloads or secrets. |

Do not implement these fields in Phase 10N.

### Required contract principles

- `discovery_source_id` and `discovery_run_id` must be exact and unambiguous.
- `audit_correlation_id` must be present before staging.
- `invoked_by_admin_user_id` must come from an authenticated admin context.
- `dry_run` must be explicit; no implicit default should create production staging rows.
- `max_candidates` must be bounded by a server-defined hard cap.
- `source_scope` must reject broad or ambiguous scopes.
- `schema_version` must reject unsupported invocation shapes.
- Candidate payloads must already be bounded and must pass mapper validation.

## 7. Future Output / Result Shape

Possible contract name:

```ts
CandidateExtractionProductionInvocationResult
```

Expected result categories:

| Result Field | Purpose |
| --- | --- |
| `accepted` | Whether the invocation request was accepted for processing. |
| `rejected_reason` | Safe reason if the invocation was rejected before processing. |
| `dry_run` | Confirms whether staging writes were disabled. |
| `audit_correlation_id` | Correlates invocation-level events and staged candidate results. |
| `discovery_source_id` | Confirms exact source scope. |
| `discovery_run_id` | Confirms exact run scope. |
| `candidates_considered_count` | Count of candidate inputs considered. |
| `candidates_staged_count` | Count of candidates staged into `discovery_candidate_tools`. |
| `candidates_skipped_count` | Count of candidates skipped before staging. |
| `validation_failures` | Safe summaries of validation failures. |
| `duplicate_or_eligibility_rejections` | Safe summaries of duplicate/advisory/eligibility outcomes. |
| `safety_flags` | Safe flags for blocked modes or unsafe inputs. |
| `no_public_write_confirmed` | Confirms no `public.tools` write occurred. |
| `no_discovered_write_confirmed` | Confirms no `discovered_tools` write occurred. |
| `error_summary` | Safe aggregate error summary without raw payloads. |
| `item_results` | Safe per-item summaries only. |

The output must not include raw extraction payloads, raw HTML, prompt/model output, secrets, service-role errors, full candidate rows, or stack traces.

## 8. Access-Control Requirements

Future production invocation must require:

- admin-only access;
- authenticated admin identity;
- explicit server-side authorization checks;
- no anonymous access;
- no public read/write surface;
- no client-side service-role use;
- no public API path unless protected by admin session checks;
- CSRF protection if exposed through an API;
- rate limiting if exposed through an API or executor trigger;
- request size limits;
- batch size limits;
- service-role isolation only where already required by the staging helper boundary;
- safe response summaries only.

If an API route is later introduced, it must be reviewed as a security-sensitive admin route and must not expose raw staging inputs or database errors.

## 9. Audit Requirements

Future audit behavior should be planned before implementation.

Expected future audit event categories:

- invocation started;
- invocation completed;
- invocation rejected;
- validation failed;
- candidate staged;
- candidate skipped;
- duplicate or eligibility rejection;
- staging failure;
- cleanup condition for tests or smoke paths;
- unexpected error condition.

Audit correlation should connect:

- invocation ID or request ID;
- `audit_correlation_id`;
- `discovery_source_id`;
- `discovery_run_id`;
- staged candidate IDs;
- validation failures;
- skipped candidates;
- admin actor identity.

Phase 10N does not add audit writes. Audit writes must remain deferred until a separate audit implementation plan is reviewed and approved.

## 10. Safety and Validation Requirements

Future implementation must enforce:

- strict input validation;
- exact source/run scoping;
- bounded candidate count;
- schema version enforcement;
- staging-only status enforcement;
- duplicate gate preservation;
- no automatic approval;
- no public publishing;
- no payload leakage;
- no raw HTML exposure;
- no prompt/model output exposure;
- no secrets in logs;
- no public table writes;
- no `discovered_tools` writes;
- no audit writes until separately approved;
- exact cleanup expectations for future live tests;
- safe structured summaries for all failures.

Validation must fail before staging when:

- source/run scope is missing;
- source/run scope is ambiguous;
- admin identity is missing;
- audit correlation ID is missing;
- `schema_version` is unsupported;
- `max_candidates` exceeds the hard cap;
- invocation mode is unsafe;
- candidate input fails mapper validation;
- input appears to contain raw HTML, secrets, prompt output, or unbounded payloads.

## 11. Error Handling Requirements

Future implementation must fail closed.

It must reject:

- ambiguous source/run scopes;
- missing admin identity;
- missing audit correlation ID;
- invalid schema versions;
- unsafe invocation modes;
- unbounded candidate counts;
- anonymous or public callers;
- dry-run ambiguity;
- unsupported source scopes;
- unsafe payload shapes.

Error handling must:

- preserve partial failure auditability;
- distinguish invocation rejection, validation failure, mapper failure, and staging failure;
- avoid leaking sensitive payloads;
- avoid raw database error output;
- avoid stack traces in log-safe summaries;
- include safe error codes;
- include safe field names when useful;
- keep candidate payloads out of public or admin-facing error summaries unless separately reviewed.

## 12. Testing Plan for Future Implementation Phase

Future implementation should include mocked/local tests before any live smoke or production wiring:

- safe opt-out smoke remains safe;
- dry-run invocation does not stage candidates;
- admin-only invocation succeeds with mocked dependencies;
- non-admin invocation is rejected;
- anonymous invocation is rejected;
- missing admin identity is rejected;
- invalid source scope is rejected;
- invalid run scope is rejected;
- ambiguous source/run scope is rejected;
- missing audit correlation ID is rejected;
- invalid schema version is rejected;
- max candidate bound is enforced;
- mapper validation failures skip staging;
- staging-only assertion confirms `candidate_status = "staged"`;
- no `public.tools` write path exists;
- no `discovered_tools` write path exists;
- audit correlation is preserved in successful staging results;
- partial success/failure summaries are safe;
- no raw payloads appear in errors or logs;
- exact-ID cleanup verification exists for any future live smoke.

Future live smoke must be separately approved by James and must remain one-command opt-in only.

## 13. Rollout Gates

Required gates before future implementation:

1. Phase 10N document review.
2. Gemini review.
3. James approval.
4. Dedicated implementation plan approval.
5. Implementation in a separate phase.
6. Mocked/local test pass.
7. `npm run check` pass.
8. Safe opt-out smoke verification.
9. No live smoke without explicit James approval.
10. No production wiring without a separate phase.
11. No public publishing without a separate phase.
12. No crawler automation without a separate phase.
13. No LLM production execution without a separate phase.
14. No audit writes without a separate audit implementation plan.

## 14. Recommended Next Phase

Recommended next phase:

```text
Phase 10O — Candidate Extraction Production Invocation Contract Review / Approval Gate
```

Phase 10O should review this contract with Gemini and James before any production invocation implementation work begins.
