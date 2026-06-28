# Phase 14A — Candidate Extraction Live Staging Activation Design Gate

## 1. Status

Phase 14A is docs-only.

This phase does not activate live staging.

This phase does not modify UI components, API routes, providers, helpers, tests, package files, migrations, generated types, Supabase schema, or environment configuration.

This phase does not run database commands, remote SQL, Supabase commands, type generation, live staging, live smoke, POST requests, CSRF fetches, crawler execution, or LLM execution.

This phase does not create, update, or delete discovery sources, discovery runs, preview artifacts, candidate rows, audit rows, public tools, or discovered tools.

## 2. Current Confirmed State

Latest pushed commit before Phase 14A:

- `493371e Wire read-only candidate preview UI`

The current admin UI can fetch and display read-only candidate previews from:

- `GET /api/admin/discovery/runs/[id]/candidate-preview?source_id=:sourceId`

The current live staging scaffold remains disabled with:

- `isLiveStagingAvailable={false}`

The current live staging scaffold displays trusted candidate preview data only as read-only information.

The current candidate extraction invoke route exists at:

- `POST /api/admin/discovery/candidate-extraction/invoke`

That route already requires:

- authenticated admin session;
- valid admin CSRF;
- admin rate limit;
- bounded JSON body;
- server-derived admin identity;
- body allowlist;
- rejection of client-supplied admin identity.

The current route still delegates live capability to server-created invocation options.

The current UI does not call the invoke route from the live staging scaffold.

## 3. Purpose Of This Gate

This design gate defines the minimum requirements that must be satisfied before AiFinder may consider a later phase that activates manual live staging from the admin UI.

This phase intentionally does not choose to activate live staging yet.

The purpose is to define:

- eligibility requirements;
- UI friction requirements;
- server gate requirements;
- preview consistency requirements;
- audit requirements;
- verification requirements;
- rollback requirements;
- exact approval phrase requirements;
- stop conditions.

## 4. Activation Definition

For this roadmap, live staging activation means allowing an authenticated admin to trigger one candidate staging write through the admin UI.

The intended write target remains the candidate staging table, not the public catalog.

Live staging activation must only create a staged candidate row.

It must not publish a public tool.

It must not write `public.tools`.

It must not write `discovered_tools`.

It must not run crawler code.

It must not run LLM code.

It must not create or modify preview artifacts.

It must not mutate discovery sources or discovery runs except for separately approved audit behavior.

## 5. Non-Goals

Phase 14A does not authorize:

- changing `isLiveStagingAvailable` to true;
- adding POST behavior to the UI;
- fetching CSRF from the live staging scaffold;
- calling the invoke endpoint from the scaffold;
- sending `dry_run: false`;
- creating a server live gate resolver;
- creating staged candidate rows;
- creating audit rows;
- changing the candidate preview route;
- changing the candidate preview provider;
- changing the candidate staging helper;
- applying database migrations;
- generating types;
- running live smoke;
- running production staging.

## 6. Required Future Activation Preconditions

A future activation implementation must prove all of the following before any live path is enabled:

1. The selected discovery run ID is present.
2. The selected discovery source ID is present.
3. The selected run/source pair matches the read-only preview route result.
4. The preview result is accepted.
5. The preview status is `reviewable`.
6. The preview route result confirms no public write.
7. The preview route result confirms no discovered-tools write.
8. The preview includes a safe candidate name.
9. The preview includes a safe HTTPS candidate website URL.
10. The preview includes safe source evidence locator.
11. The preview is not stale.
12. The preview is not ambiguous.
13. The preview is not blocked.
14. The candidate count is exactly one.
15. The source scope is exactly `single_run`.
16. The candidate status after live staging remains `staged`.
17. The write target is candidate staging only.
18. The server derives admin identity.
19. The client cannot provide admin identity.
20. The route requires CSRF for POST.
21. The route requires rate limiting.
22. The route body stays allowlisted.
23. The live gate is server-created only.
24. The UI cannot create or alter live gate metadata.
25. The UI cannot override safety flags.
26. The UI cannot provide normalized candidate payload directly.
27. The UI cannot publish to public catalog.

## 7. Required Future UI Friction

A future activation UI must include high-friction controls before the button can become enabled.

Minimum UI friction:

- visible warning that the action writes a staged candidate row;
- visible warning that the action does not publish to public catalog;
- visible run ID;
- visible source ID;
- visible candidate name;
- visible candidate website;
- visible preview status;
- visible audit correlation ID when present;
- explicit checkbox confirming staged-only write;
- explicit checkbox confirming no public catalog write;
- explicit checkbox confirming no discovered-tools write;
- exact typed phrase.

The existing phrase may remain:

- `Stage one candidate`

The phrase must remain UI friction only.

It must not become a backend authorization secret.

## 8. Required Future Server Gate

A future activation phase must define a server-created live staging gate.

The client must not send a `liveStagingGate` object.

The client must not decide the gate mode.

The server gate must be derived from verified server-side state only.

Minimum server gate inputs:

- authenticated admin actor;
- CSRF-valid POST request;
- rate-limit result;
- discovery run ID;
- discovery source ID;
- accepted preview result;
- preview audit correlation ID;
- max candidates;
- source scope;
- requested dry-run mode.

The server gate must fail closed unless every required condition is satisfied.

## 9. Required Future Request Body

A future UI POST body may include only allowlisted fields.

Expected future live request body should be limited to:

- `discovery_source_id`;
- `discovery_run_id`;
- `audit_correlation_id`;
- `invocation_reason`;
- `dry_run`;
- `max_candidates`;
- `source_scope`;
- `schema_version`.

Required values:

- `dry_run: false`;
- `max_candidates: 1`;
- `source_scope: "single_run"`.

The UI must not send:

- admin identity;
- candidate payload;
- normalized candidate object;
- live gate object;
- service-role data;
- raw preview artifact row;
- raw HTML;
- raw LLM output;
- public tool payload;
- discovered tool payload.

## 10. Required Future Preview Revalidation

A future activation must revalidate the preview on the server immediately before staging.

The server must not trust the client-displayed preview.

The server should reload or rederive the accepted preview using the run/source context.

The server must reject live staging if the preview is:

- missing;
- unavailable;
- pending;
- blocked;
- stale;
- ambiguous;
- unsafe;
- unsupported schema;
- source mismatched;
- run mismatched;
- missing required candidate fields.

## 11. Required Future Write Contract

If live staging is eventually activated, the write contract must remain narrow.

Allowed future write:

- insert exactly one candidate into candidate staging.

Required candidate status:

- `staged`

Forbidden writes:

- `public.tools`;
- `discovered_tools`;
- candidate publishing;
- discovery source mutation;
- discovery run mutation;
- preview artifact mutation;
- crawler-generated data mutation;
- LLM-generated data mutation outside the already approved candidate extraction path.

## 12. Required Future Audit Contract

Before live activation, a dedicated audit design or implementation must define whether audit rows are written.

If audit writes are introduced, they must be separately reviewed.

Minimum future audit fields should include:

- admin actor;
- discovery source ID;
- discovery run ID;
- audit correlation ID;
- candidate staging result;
- dry_run value;
- max candidates;
- source scope;
- live gate mode;
- no public write confirmation;
- no discovered-tools write confirmation;
- timestamp.

Audit must not store:

- raw HTML;
- raw LLM output;
- cookies;
- CSRF tokens;
- service-role details;
- stack traces;
- secrets.

## 13. Required Future Response Contract

A future live staging response must be safe for the UI.

Allowed response fields:

- accepted;
- rejected;
- rejection code;
- dry run value;
- discovery source ID;
- discovery run ID;
- candidate counts;
- staged candidate ID if safe and required;
- audit correlation ID;
- safety flags;
- no public write confirmation;
- no discovered-tools write confirmation;
- safe error summary.

Forbidden response fields:

- raw database rows;
- raw inserted payload;
- service-role details;
- SQL errors;
- stack traces;
- raw HTML;
- raw LLM output;
- cookies;
- CSRF token values.

## 14. Required Future Tests

A future activation implementation must add tests proving:

- default UI keeps staging unavailable;
- button cannot enable without trusted source;
- button cannot enable without accepted preview;
- button cannot enable for blocked preview;
- button cannot enable for stale preview;
- button cannot enable for ambiguous preview;
- button cannot enable without all friction controls;
- UI fetches CSRF only for the POST activation path;
- UI sends POST only after all friction controls are satisfied;
- UI sends `dry_run: false` only in the approved activation path;
- UI sends `max_candidates: 1`;
- UI sends `source_scope: "single_run"`;
- UI never sends admin identity;
- UI never sends candidate payload;
- UI never sends live gate object;
- route rejects missing CSRF;
- route rejects client-supplied admin identity;
- route rejects unsupported body fields;
- route rejects live staging without server gate;
- route rejects live staging when preview revalidation fails;
- helper stages at most one candidate;
- candidate status is `staged`;
- no public tools write occurs;
- no discovered tools write occurs;
- response is sanitized.

## 15. Required Future Live Smoke Gate

A future live smoke must be separately approved with an exact phrase.

A future live smoke must use fixture rows or a clearly bounded approved real context.

A future live smoke must include exact-ID cleanup for every created row.

A future live smoke must verify:

- staged candidate row was created;
- candidate status is `staged`;
- run/source lineage is correct;
- audit correlation ID is correct;
- public tools table is unchanged;
- discovered tools table is unchanged;
- anonymous access is denied;
- no payload leakage occurs;
- exact created row cleanup succeeds;
- read-after-cleanup proves cleanup.

## 16. Proposed Future Exact Approval Phrases

Future implementation approval phrase:

- `Approve proceed Phase 14B live staging activation implementation plan`

Future code implementation approval phrase:

- `Approve proceed Phase 14C guarded live staging activation implementation`

Future live smoke approval phrase:

- `Approve run Phase 14D live staging activation smoke`

Future push phrases must remain phase-specific, for example:

- `Approve push Phase 14A`
- `Approve push Phase 14B`
- `Approve push Phase 14C`
- `Approve push Phase 14D`

Any vague approval must not authorize live writes.

## 17. Stop Conditions

Any future activation work must stop if it requires:

- public tool publishing;
- `public.tools` write;
- `discovered_tools` write;
- multiple candidates;
- source scope broader than `single_run`;
- client-supplied admin identity;
- client-supplied live gate;
- client-supplied normalized candidate payload;
- bypassing CSRF;
- bypassing rate limit;
- disabling preview revalidation;
- accepting stale preview;
- accepting blocked preview;
- accepting ambiguous preview;
- displaying raw DB rows;
- exposing SQL errors;
- exposing stack traces;
- running crawler code;
- running LLM code;
- applying migrations without separate approval;
- generating types without separate approval;
- running live smoke without exact approval phrase.

## 18. Recommended Future Phase Sequence

Recommended next phases:

1. Phase 14B — Live Staging Activation Implementation Plan
   - docs-only;
   - decide exact UI, route, resolver, tests, and audit behavior;
   - no activation.

2. Phase 14C — Guarded Live Staging Activation Implementation
   - code implementation only if Phase 14B is approved;
   - must remain guarded and test-covered;
   - no live smoke unless separately approved.

3. Phase 14D — Live Staging Activation Smoke Plan / Execution Gate
   - define exact smoke context and cleanup;
   - requires exact live smoke phrase before execution.

4. Phase 14E — Live Staging Activation Smoke Result Documentation
   - docs-only result summary after any approved live smoke.

## 19. Phase 14A Verification Plan

Run:

- `git diff --check`;
- `npm run check`;
- `git diff --stat`;
- `git diff --name-only`;
- `git status --short --branch`.

Expected changed file:

- `docs/discovery-phase-14a-candidate-extraction-live-staging-activation-design-gate.md`

Expected forbidden changes:

- no UI component files;
- no API route files;
- no provider files;
- no helper files;
- no test files;
- no package files;
- no migration files;
- no generated type files.

## 20. Commit Readiness Criteria

Phase 14A is safe to commit only if:

- Gemini approves the document;
- verification passes;
- only this Phase 14A docs file is staged;
- no UI is changed;
- no route is changed;
- no provider/helper is changed;
- no tests are changed;
- no migration is changed;
- no generated types are changed;
- no live commands are run;
- no DB commands are run;
- no POST requests are sent;
- no CSRF fetch occurs;
- no live staging occurs.
