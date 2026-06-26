# Phase 8V — Discovery Engine Admin Interface Design

## Status / Scope

Phase 8V is a docs-only planning/design phase for a future Discovery Engine server/admin method layer.

This phase defines the future module boundary, function signatures, inputs, outputs, safety rules, verification strategy, and Gemini review gates for staging normalized candidate records with the dedicated typed Supabase admin helper.

Phase 8V authorizes no source-code changes, no tests, no database operations, no candidate writes, no API/UI/extraction integration, no Supabase migration work, and no generated type changes.

Candidate extraction remains not implementation-ready after Phase 8V.

## Background

The Discovery Engine now has the infrastructure needed to design a narrow server/admin method layer, but not enough authorization to implement candidate staging behavior.

Completed foundations carried into this phase:

- `public.discovery_candidate_tools` migration has been applied.
- Generated Supabase types are committed at `lib/supabase/database.types.ts`.
- A pure candidate normalizer exists at `lib/discovery-candidate-normalizer.ts`.
- A dedicated typed Discovery admin helper exists at `lib/discovery/discovery-supabase-admin.ts`.
- The typed helper imports `server-only`, uses `import type { Database }`, validates required Supabase environment variables, and exports `createDiscoverySupabaseAdminClient()`.
- The no-op helper smoke test exists at `testing/discovery-supabase-admin-noop-smoke.test.mjs` and verifies import/factory construction without Supabase query/network operations.
- Candidate staging methods are not implemented.
- Candidate extraction remains not implementation-ready.

The next implementation must not jump directly from the typed client factory to route-level candidate writes. A reviewed interface/method layer is needed first.

## Current State Carried Forward

Current code boundaries:

- `lib/discovery/discovery-supabase-admin.ts` is a low-level typed service-role client factory.
- `lib/discovery-candidate-normalizer.ts` returns a safe `SafeDiscoveryCandidateToolInsert` object or a safe rejection code.
- `SafeDiscoveryCandidateToolInsert` already contains `discovery_run_id`, source URL fields, candidate fields, duplicate advisory fields, review-null fields, cleanup fields, and `candidate_status: "staged"`.
- `SafeDiscoveryCandidateToolInsert` does not include raw extraction payloads, raw HTML, raw metadata, raw stats, snippets, transport payloads, or LLM payloads.
- The staging table has no `discovery_source_id` column. Source identity is represented by safe source URL fields and source evidence locator fields. If future implementation requires durable source ID storage, that must be a separate schema-review phase.
- The typed helper is not imported by application code.
- No `.from(...)` usage exists in the typed helper.

Current safety boundaries:

- No candidates are created.
- No `public.tools` writes are performed.
- No `discovered_tools` writes are performed.
- No approval/publish/promotion workflow exists for staged candidates.
- No ranking/recommendation behavior exists.
- No LLM behavior exists.
- No automation/scheduler/cron/crawler behavior is added by this track.

## Why an Admin Interface Layer Is Needed

A dedicated method layer is needed because the typed Supabase client is intentionally broad and powerful. Exposing that raw client directly to future Discovery code would make it too easy to add unsafe operations in the wrong place.

The method layer should:

- accept only normalized candidate data, not raw extraction payloads;
- enforce staging-only semantics before any database call;
- keep all future writes scoped to reviewed Discovery tables;
- separate candidate staging from API routes and UI concerns;
- make duplicate handling explicit and advisory;
- make audit behavior explicit;
- keep service-role usage server-only;
- make future tests and safety scans targeted.

The method layer should be the future boundary between pure normalization and any database-backed staging operation.

## Non-goals

Phase 8V does not:

- add source code;
- add tests;
- modify `lib/discovery/discovery-supabase-admin.ts`;
- modify generated Supabase types;
- modify migrations;
- run migrations;
- regenerate Supabase types;
- run remote SQL;
- perform database operations;
- create candidates;
- insert/update/delete/upsert/select/rpc anything;
- call `.from(...)`;
- add candidate staging implementation;
- add extraction logic;
- add API routes;
- modify UI/components/app files;
- add approval, publish, promote, ranking, recommendation, LLM, automation, scheduler, cron, crawler, or browser automation behavior;
- expose or log environment values, service role keys, access tokens, JWTs, connection strings, database URLs, raw credentials, or secrets.

## Future Module Boundary Options

### Option A: Add Methods to Typed Client Factory

Future path:

```text
lib/discovery/discovery-supabase-admin.ts
```

This option would add staging methods directly beside `createDiscoverySupabaseAdminClient()`.

Benefits:

- Smallest file count.
- Keeps all Discovery Supabase behavior in one file.
- Can reuse the existing typed factory directly.

Risks:

- Mixes low-level client construction with business operations.
- Makes the factory file more likely to grow into a broad service-role utility.
- Increases the chance that unrelated Discovery operations accumulate beside the raw client factory.
- Makes rollback less clean if a staging method has to be removed.

Recommendation:

- Do not use this option for the next implementation.
- Keep `lib/discovery/discovery-supabase-admin.ts` as a low-level typed client factory only.

### Option B: Separate Candidate Staging Admin Module

Future path:

```text
lib/discovery/discovery-candidate-staging-admin.ts
```

This option creates a separate server/admin module for candidate staging methods. It would import the typed client factory and safe normalizer output types.

Likely future imports:

```ts
import "server-only";

import { createDiscoverySupabaseAdminClient } from "@/lib/discovery/discovery-supabase-admin";
import type {
  DiscoveryCandidateDuplicateCheckStatus,
  SafeDiscoveryCandidateToolInsert,
} from "@/lib/discovery-candidate-normalizer";
```

Benefits:

- Preserves `discovery-supabase-admin.ts` as a clean-room typed factory.
- Gives staging logic a narrow named boundary.
- Keeps candidate staging behavior separate from API/UI code.
- Makes tests and safety scans specific.
- Allows future implementation to expose only reviewed methods instead of a broad raw client.
- Makes rollback simple: remove the staging module without touching the typed helper.

Risks:

- Adds one more module.
- Requires disciplined imports so API routes do not bypass it.
- Future method implementation must still be reviewed for safe DB operation shape.

Recommendation:

- Recommended future boundary.

### Option C: Class-Style Service Wrapper

Future path:

```text
lib/discovery/discovery-candidate-staging-service.ts
```

This option would create a class or object wrapper around a typed Discovery Supabase client.

Benefits:

- Can support dependency injection in tests.
- Can group related methods under a single service object.
- May be useful if staging behavior expands substantially.

Risks:

- More abstraction than needed for the first staging operation.
- Can obscure which database operations are actually performed.
- May make simple function tests more verbose.

Recommendation:

- Defer. A function-based module is simpler and safer for the first candidate-staging implementation.

### Option D: API Route Integration

Future path:

```text
app/api/admin/discovery/...
```

This option would add API route behavior now or combine route integration with staging method implementation.

Benefits:

- Moves closer to admin workflows.

Risks:

- Expands scope into auth, CSRF, route validation, response shape, UI behavior, and operational safety.
- Creates externally reachable behavior before the internal method boundary is reviewed.
- Increases risk of accidental candidate writes, public-tool writes, or service-role exposure.

Recommendation:

- Reject for now. API route integration must remain a later, separately reviewed phase.

## Recommended Future Boundary

Recommended next implementation boundary:

```text
lib/discovery/discovery-candidate-staging-admin.ts
```

Recommended design:

- server-only function module;
- import the typed client factory from `lib/discovery/discovery-supabase-admin.ts`;
- import only safe normalizer output types from `lib/discovery-candidate-normalizer.ts`;
- do not accept raw crawler/extraction payloads;
- do not expose a raw Supabase client;
- expose narrow typed functions only;
- keep API/UI/extraction integration out of the first implementation.

Recommended first implementation phase after Gemini approval:

```text
Phase 8W — Discovery Candidate Staging Admin Method Implementation
```

Phase 8W should implement only the reviewed method module and unit tests. It should not wire the method into API routes, UI, crawler/executor code, or extraction behavior.

## Proposed Future File Plan

Future implementation may add:

```text
lib/discovery/discovery-candidate-staging-admin.ts
testing/discovery-candidate-staging-admin.test.mjs
```

Future implementation should not modify unless separately approved:

```text
lib/discovery/discovery-supabase-admin.ts
lib/supabase-admin.ts
lib/supabase.ts
lib/supabase/database.types.ts
app/api/admin/discovery/**
components/**
app/**
supabase/migrations/**
```

The first staging method implementation should avoid route/UI wiring. A later API/UI phase can consume the method after method-level behavior is reviewed and tested.

## Proposed Future Types and Function Signatures

The future method should accept normalized candidate data only. It should not accept raw extraction output.

Conceptual type design:

```ts
export type StageNormalizedDiscoveryCandidateInput = {
  normalizedCandidate: SafeDiscoveryCandidateToolInsert;
  discoveryRunId: string;
  discoverySourceId: string;
  actorId?: string | null;
};

export type StageNormalizedDiscoveryCandidateSuccess = {
  ok: true;
  candidateId: string;
  status: "staged";
  duplicateCheckStatus: DiscoveryCandidateDuplicateCheckStatus;
  auditCorrelationId: string;
};

export type StageNormalizedDiscoveryCandidateFailure = {
  ok: false;
  reason:
    | "invalid_normalized_candidate"
    | "missing_run"
    | "missing_source"
    | "duplicate_existing_candidate"
    | "database_error";
};

export type StageNormalizedDiscoveryCandidateResult =
  | StageNormalizedDiscoveryCandidateSuccess
  | StageNormalizedDiscoveryCandidateFailure;

export async function stageNormalizedDiscoveryCandidate(
  input: StageNormalizedDiscoveryCandidateInput,
): Promise<StageNormalizedDiscoveryCandidateResult>;
```

Adjustment required by current schema:

- `discoveryRunId` must match `normalizedCandidate.discovery_run_id`.
- `discoverySourceId` should be required at the interface boundary for caller accountability and future audit correlation, but it cannot be inserted into `public.discovery_candidate_tools` unless a future schema phase adds a `discovery_source_id` column.
- If `discoverySourceId` is needed in persistent audit metadata, a future audit event design must define a safe allowlisted metadata field.
- The insert payload should come from `normalizedCandidate` with no raw payload merge step.

Additional future helper names may be planned but should not be implemented in the first staging method phase unless explicitly approved:

```ts
getDiscoveryRunForCandidateStaging(...)
recordDiscoveryCandidateStagingAuditEvent(...)
listStagedDiscoveryCandidatesForReview(...)
markCandidateNeedsReview(...)
```

Forbidden future names in this module:

```text
approveCandidate
publishCandidate
promoteCandidate
createTool
insertPublicTool
syncToTools
autoApprove
rankCandidate
recommendTool
```

## Input Contract

The future staging method should accept:

- one `SafeDiscoveryCandidateToolInsert` produced by `normalizeDiscoveryCandidate`;
- `discoveryRunId` as an explicit boundary check;
- `discoverySourceId` as an explicit call-site/source-context check;
- optional `actorId` only if the future call site has a safe admin actor identifier;
- no raw crawler payload;
- no raw extraction payload;
- no raw metadata;
- no raw HTML;
- no snippets;
- no headers;
- no cookies;
- no secrets;
- no stack traces;
- no transport payloads;
- no LLM prompts or responses.

The method should fail closed if:

- `normalizedCandidate.candidate_status` is not `"staged"`;
- `normalizedCandidate.discovery_run_id` does not match `discoveryRunId`;
- source context is missing;
- any reviewed staging-only invariant is violated;
- the database insert returns an error;
- a duplicate-prevention conflict is returned by the database.

The method should not try to repair unsafe input. Repair and normalization belong to the pure normalizer.

## Output Contract

Success output should be bounded and safe:

- `candidateId`;
- `status: "staged"`;
- `duplicateCheckStatus`;
- `auditCorrelationId`.

Failure output should use short safe reason codes only:

- `invalid_normalized_candidate`;
- `missing_run`;
- `missing_source`;
- `duplicate_existing_candidate`;
- `database_error`.

Failure output must not include:

- raw Supabase error objects;
- raw SQL details;
- raw input values;
- environment values;
- service-role details;
- stack traces;
- raw candidate payloads;
- raw extraction payloads.

## Allowed Future DB Operation Shape

A later Gemini-approved implementation may eventually allow:

- creating a typed Discovery admin client through `createDiscoverySupabaseAdminClient()`;
- a single insert into `public.discovery_candidate_tools`;
- insert payload derived only from `SafeDiscoveryCandidateToolInsert`;
- only `candidate_status = "staged"` on first insert;
- database-level conflict handling limited to safe duplicate-prevention behavior;
- optional safe audit event write only if a later audit event plan approves exact action names and metadata;
- no public route or UI usage in the first method implementation.

Allowed table scope for the first staging method implementation should be limited to:

- `public.discovery_candidate_tools` for the staging insert;
- `public.discovery_runs` only if a reviewed existence/status check is needed;
- `public.discovery_audit_events` only if exact safe audit behavior is separately approved.

No future implementation should use the method layer as permission to add extraction, API routing, UI review, duplicate resolution, approval, publish, ranking, recommendation, or automation behavior.

## Forbidden Future Behavior

Future implementation must not:

- accept raw crawler/extraction payloads;
- insert raw payloads;
- insert raw HTML;
- store screenshots;
- store raw metadata;
- store raw stats;
- store raw JSON dumps;
- store snippets, body text, title/headline text, or meta-description text as raw evidence;
- store headers, cookies, tokens, secrets, or stack traces;
- store LLM prompts or responses;
- insert/update/delete/upsert `public.tools`;
- insert/update/delete/upsert `discovered_tools`;
- automatically approve candidates;
- automatically publish candidates;
- automatically promote candidates;
- run duplicate resolution;
- run ranking or recommendation behavior;
- run extraction;
- trigger crawler automation;
- create a public endpoint;
- add UI routes;
- add bulk staging;
- add background jobs;
- call LLMs;
- swallow database errors silently;
- log environment values;
- leak service-role behavior to client bundles.

## Duplicate / Idempotency Expectations

The first staging method should be designed for duplicate-safe behavior even if duplicate detection remains advisory.

Expected future checks:

- require canonical URL from the normalizer;
- rely on the database partial unique index for active same-run canonical URL conflicts;
- map unique-conflict errors to `duplicate_existing_candidate`;
- do not auto-reject duplicates unless separately approved;
- do not auto-promote non-duplicates;
- preserve `duplicate_check_status` and duplicate pointer fields as advisory only;
- avoid bulk staging until single-row behavior is proven.

Future idempotency should be explicit:

- same run + same canonical URL should not create multiple active rows;
- repeated staging attempts should return a safe duplicate result or a future reviewed idempotent success shape;
- archived rows must not be reactivated without a separate reviewed lifecycle method.

## Auditability Expectations

Future staging behavior should be audit-ready, but exact audit writes require separate approval if `discovery_audit_events.action` must expand.

Possible future safe audit actions:

- `candidate_staging_started`;
- `candidate_staged`;
- `candidate_staging_rejected`;
- `candidate_staging_duplicate_conflict`;
- `candidate_staging_failed`.

Audit metadata must be allowlisted and bounded. It may include:

- candidate ID;
- discovery run ID;
- source context ID if approved;
- candidate status;
- duplicate check status;
- failure reason code;
- audit correlation ID.

Audit metadata must not include:

- raw candidate payloads;
- raw extraction payloads;
- raw HTML;
- raw metadata;
- raw stats;
- snippets;
- headers;
- cookies;
- secrets;
- stack traces;
- transport payloads;
- LLM prompts/responses;
- raw Supabase error objects.

## Security Requirements

Future implementation must preserve:

- server-only import boundary;
- service-role usage only in server/admin modules;
- no client component imports;
- no public/browser client access;
- no direct public table access;
- no public-safe view exposure for staged candidates;
- no service-role values in logs;
- no `.env.local` output;
- no raw Supabase client export from the staging method module;
- no API route integration until separately reviewed;
- no direct `public.tools` writes.

The typed client factory should remain the only place that constructs the Discovery service-role client.

## Testing Strategy

Future implementation should include tests before any API/UI/extraction wiring.

Recommended tests:

- mapping from `SafeDiscoveryCandidateToolInsert` to insert payload does not add raw fields;
- invalid `candidate_status` fails closed;
- mismatched `discoveryRunId` fails closed;
- missing `discoverySourceId` fails closed;
- database duplicate conflict maps to `duplicate_existing_candidate` using a mocked client;
- database error maps to `database_error` without raw error passthrough;
- success result returns only candidate ID, `"staged"`, duplicate check status, and audit correlation ID;
- no `public.tools` write method is called in mocks;
- no `discovered_tools` write method is called in mocks;
- no approval/publish/promotion method name exists.

Recommended test style:

- prefer mocked typed client behavior for the first method implementation;
- keep database integration smoke tests for a later Gemini-approved phase;
- keep the no-op typed helper smoke test separate.

## Verification Plan

Future implementation verification should run:

```bash
./node_modules/.bin/tsc --noEmit
node --import ./testing/register-typescript-test-loader.mjs testing/discovery-supabase-admin-noop-smoke.test.mjs
node testing/discovery-candidate-normalizer.test.mjs
npm run lint
npm run check
git diff --check
git status --short --branch
```

If a future staging-admin test is added, also run its exact command, likely:

```bash
node --import ./testing/register-typescript-test-loader.mjs testing/discovery-candidate-staging-admin.test.mjs
```

## Safety Inspection Plan

Future implementation safety scans should include:

```bash
rg -n "public\\.tools|\\.from\\(\"tools\"|\\.from\\('tools'|from\\(\"tools\"|from\\('tools'" lib/discovery testing docs --glob '!node_modules' --glob '!*.map'

rg -n "discovery_candidate_tools|stageNormalizedDiscoveryCandidate|createDiscoverySupabaseAdminClient|DiscoverySupabaseAdminClient" lib/discovery testing docs --glob '!node_modules' --glob '!*.map'

rg -n "insert\\(|update\\(|delete\\(|upsert\\(|rpc\\(|\\.auth|\\.storage|\\.functions|\\.channel" lib/discovery testing docs --glob '!node_modules' --glob '!*.map'

rg -n "approve|approved|publish|promote|rank|recommend|automation|scheduler|cron|crawler|LLM|llm" lib/discovery testing docs --glob '!node_modules' --glob '!*.map'

rg -n "SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_SUPABASE_URL|service_role|jwt|secret|token" lib/discovery testing docs --glob '!node_modules' --glob '!*.map'
```

Expected interpretation:

- Documentation may include forbidden terms while defining boundaries.
- Tests may include forbidden terms as negative assertions.
- Implementation files must not introduce public-tool writes, approval/publish semantics, client bundle imports, raw payload fields, or service-role leakage.

## Rollback Plan

For a future implementation:

- If the method module causes TypeScript or build failures, revert only the new staging method module and tests.
- Do not modify the typed client factory as a workaround unless Gemini approves.
- Do not modify generated types as a workaround.
- Do not modify migrations as a workaround.
- Do not add API/UI wiring to test the method.
- Do not run database cleanup because the first implementation should not perform live DB writes unless a later phase explicitly authorizes a controlled smoke.

For Phase 8V itself:

- Rollback is deletion of this documentation file only.

## Risks / Follow-ups

Risks:

- The current staging table does not store `discovery_source_id`; requiring `discoverySourceId` at the interface boundary can improve caller accountability, but durable source ID storage would require a separate schema decision.
- Generated Supabase table types expose constrained text columns as `string`; application-level constants and tests must continue enforcing staging-only values.
- Adding real database insert behavior will need careful mocked tests first, then a separately approved DB smoke.
- Future audit action names may require a `discovery_audit_events.action` constraint change or a different safe audit strategy.

Follow-ups:

- Gemini review of this interface design.
- Phase 8W method implementation plan or implementation, depending on Gemini direction.
- Separate audit action compatibility plan before audit writes.
- Separate API route plan before admin route integration.
- Separate UI plan before displaying staged candidates.
- Separate duplicate detection plan before duplicate review behavior.

## Required Gemini Gates

Gemini must review and approve before any future implementation:

- the proposed module boundary;
- the proposed function signatures;
- whether `discoverySourceId` should be required at the interface boundary despite not being stored in the current table;
- whether initial method implementation may write to `discovery_candidate_tools`;
- whether initial method implementation may perform a `discovery_runs` existence/status check;
- whether initial method implementation may emit audit events;
- exact tests and mocked DB behavior;
- any future API route integration;
- any future UI integration;
- any future duplicate detection;
- any future promotion/publish workflow.

## Final Phase 8V Recommendation

Phase 8V recommends a conservative future method boundary:

```text
lib/discovery/discovery-candidate-staging-admin.ts
```

The future module should expose narrow server-only functions, beginning with:

```text
stageNormalizedDiscoveryCandidate(...)
```

The method should accept normalized candidate output only, require explicit run/source context, perform staging-only validation, and eventually perform at most one reviewed insert into `public.discovery_candidate_tools`. It must not accept raw extraction payloads, touch `public.tools`, touch `discovered_tools`, approve, publish, promote, rank, recommend, run LLMs, automate crawling, or expose API/UI behavior.

Candidate extraction remains not implementation-ready after Phase 8V. Future implementation requires Gemini approval.
