# Phase 8T — Typed Discovery Client No-Op Smoke Test Plan

## Status / Scope

Phase 8T is a docs-only planning phase for a future controlled no-op smoke test of the dedicated typed Discovery admin Supabase helper.

This phase authorizes no source-code changes, no test implementation, no helper changes, no helper import or instantiation, no database operations, no candidate writes, and no API/UI/extraction integration.

## Background

Phase 8S added the dedicated typed Discovery admin helper:

```text
lib/discovery/discovery-supabase-admin.ts
```

The helper was added after Phase 8Q showed that typing the shared `lib/supabase-admin.ts` client creates broad downstream TypeScript failures across mature untyped admin/server call sites.

Phase 8S kept the blast radius narrow by creating a clean-room Discovery-specific helper that is not imported by application code yet.

## Current State Carried Forward

Current Discovery Engine state:

- The candidate staging table migration has been applied.
- Generated Supabase types are committed at `lib/supabase/database.types.ts`.
- The dedicated typed Discovery admin helper exists at `lib/discovery/discovery-supabase-admin.ts`.
- The helper imports `server-only`.
- The helper uses `import type { Database }`.
- The helper uses `createClient<Database>(...)`.
- The helper validates `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- The helper exports `createDiscoverySupabaseAdminClient()`.
- The helper exports `DiscoverySupabaseAdminClient`.
- The helper performs no database operations.
- The helper is not imported by application code yet.
- Candidate staging methods are not implemented.
- Candidate extraction remains not implementation-ready.

## Helper Under Future Test

Future smoke testing should target only:

```text
lib/discovery/discovery-supabase-admin.ts
```

The future smoke should verify only that the helper can be imported in a server-only local test context and that the factory can be instantiated safely without any Supabase query, storage, auth, realtime, or network/database operation.

The helper must remain a typed factory only until a later Gemini-approved phase authorizes method-level candidate staging behavior.

## Why No-Op Validation Is Needed

No-op validation is useful before candidate staging methods because it verifies the typed helper’s plumbing without crossing into database behavior.

The future no-op smoke can confirm:

- The TypeScript helper can be imported through the repo’s existing Node test loader.
- `server-only` import behavior does not break server-side tests.
- Environment validation fails loudly when required variables are missing.
- Factory construction works when required variables exist.
- Generated `Database` typing remains available.
- No candidate staging method is needed to prove basic helper viability.

This is intentionally weaker than a database smoke test. That is the point: validate safe construction before any DB access is introduced.

## Non-goals

Phase 8T and the future no-op smoke test must not:

- Add API routes.
- Add UI/components.
- Add candidate staging methods.
- Implement extraction.
- Create candidates.
- Insert/update/delete/upsert anything.
- Query Supabase.
- Call `.from(...)`.
- Call `.select(...)`.
- Call `.rpc(...)`.
- Access `.auth`.
- Access `.storage`.
- Access `.functions`.
- Access `.channel`.
- Write to `discovery_candidate_tools`.
- Write to `discovered_tools`.
- Write to `public.tools`.
- Add approval, publish, promote, ranking, recommendation, LLM, automation, scheduler, cron, crawler, or browser automation behavior.
- Log environment variable values.
- Log service-role keys, tokens, URLs with credentials, connection strings, or client internals.

## Smoke Test Options

### Option A: Compile-Only Type Assertion

Future idea:

- Add a lightweight test that imports only the `DiscoverySupabaseAdminClient` type.
- Assert type compatibility at compile time.
- Do not import or instantiate the runtime factory.

Benefits:

- Lowest runtime risk.
- No env variable dependency.
- No chance of accidental network/database operations.
- Useful for confirming generated type availability.

Risks:

- Does not verify `server-only` runtime import behavior.
- Does not verify runtime environment validation.
- Does not verify factory construction.

Runtime env impact:

- None.

DB-operation risk:

- None if it imports types only.

Client-bundle leakage risk:

- Very low if kept in `testing/` and type-only.

Recommendation:

- Useful as a supplemental check, but not enough for Phase 8U by itself.

### Option B: Server-Only Runtime Factory Instantiation

Future idea:

- Add a Node test under `testing/`.
- Import `createDiscoverySupabaseAdminClient()` from the TypeScript helper using the existing TypeScript test loader.
- Instantiate the client.
- Do not call `.from(...)`, `.rpc(...)`, `.auth`, `.storage`, `.functions`, `.channel`, or any other Supabase operation.
- Do not log env values or client internals.
- Verify only that factory construction does not throw when env vars exist.
- Verify missing env vars fail loudly in an isolated subprocess or controlled module-import scenario, if safe.

Benefits:

- Validates runtime import and factory construction.
- Exercises the `server-only` helper in a server-side test context.
- Validates env guard behavior without database calls.
- Keeps test surface local and outside app/API/UI code.

Risks:

- Runtime import requires env variables to exist or a controlled subprocess setup.
- A poorly written smoke could accidentally call DB methods.
- Importing the helper can construct module-level validated constants, so missing-env tests must isolate module evaluation.

Runtime env impact:

- Yes. The smoke depends on env variable presence for the positive path.
- Env variable names may appear in test code, but values must never be printed.

DB-operation risk:

- Low if the test is explicitly scanned for forbidden methods and never calls Supabase operations.

Client-bundle leakage risk:

- Low if the test lives under `testing/` and is never imported by app/components.

Recommendation:

- Recommended for Phase 8U.

### Option C: Server-Only Import Boundary Test

Future idea:

- Verify the helper cannot be imported into client components because of `server-only`.
- Use a Next.js or build-level harness to simulate client import failure.

Benefits:

- Stronger client-bundle leakage assurance.
- Validates the `server-only` guard at framework boundary level.

Risks:

- Heavier than needed for the next phase.
- May require a framework-specific fixture or test harness.
- Could create noisy build behavior or temporary client component files.
- Not necessary before a no-op factory smoke.

Runtime env impact:

- Potentially yes, depending on how the helper is imported.

DB-operation risk:

- Low if implemented carefully, but the test harness may be heavier than justified.

Client-bundle leakage risk:

- Intended to reduce this risk, but implementation can be invasive.

Recommendation:

- Defer. Keep as a later hardening test if the helper gains application imports.

### Option D: Diagnostic Admin Route

Future idea:

- Add an admin API route that imports or instantiates the helper for diagnostics.

Benefits:

- Could provide runtime visibility from the admin app.

Risks:

- Adds API surface.
- Risks exposing service-role behavior.
- Risks becoming a diagnostic endpoint that leaks operational state.
- Creates auth/CSRF/security review scope.
- Not needed to validate no-op construction.

Runtime env impact:

- Yes.

DB-operation risk:

- Higher than local tests because API route code can drift into actual operations.

Client-bundle leakage risk:

- Lower than client imports, but still creates server/API attack surface.

Recommendation:

- Reject for Phase 8U.

## Recommended Future Implementation Path

Recommended next phase:

```text
Phase 8U — Typed Discovery Client No-Op Smoke Test Implementation
```

Recommended option:

```text
Option B: Server-Only Runtime Factory Instantiation
```

Recommended constraints:

- Add a local Node smoke test under `testing/`.
- Use the existing TypeScript test loader pattern.
- Import and instantiate `createDiscoverySupabaseAdminClient()`.
- Do not call any Supabase query, auth, storage, realtime, function, channel, or network/database method.
- Do not log env values.
- Do not log Supabase client internals.
- Keep app/API/UI code untouched.
- Keep candidate staging methods out of scope.

## Future Test File Plan

Recommended future file:

```text
testing/discovery-supabase-admin-noop-smoke.test.mjs
```

The repo already contains:

```text
testing/register-typescript-test-loader.mjs
testing/typescript-extension-loader.mjs
```

Several existing plans and tests use direct Node `.mjs` test files with `node:test`. For a future test that imports a `.ts` helper file, the recommended command should use the existing loader:

```bash
node --import ./testing/register-typescript-test-loader.mjs testing/discovery-supabase-admin-noop-smoke.test.mjs
```

If the loader cannot handle `server-only` in a plain Node test context, Phase 8U should stop and report the blocker instead of removing `server-only` or weakening the helper.

## Server-Only Safety Rules

Future smoke implementation must preserve:

- The helper remains under `lib/discovery/`.
- The helper keeps `import "server-only"`.
- No `"use client"` appears in `lib/discovery`.
- No client component imports the helper.
- No app/API/UI file imports the helper in Phase 8U.
- Service-role env usage stays inside server-only modules.
- Test code stays under `testing/` and is not bundled into public client code.

## Environment Validation Expectations

Future smoke should validate environment behavior without exposing values.

Positive path:

- Required env variable names are present in the local test environment.
- `createDiscoverySupabaseAdminClient()` can be called without throwing.
- The smoke reports only a safe pass/fail summary.

Negative path, if safe:

- Use an isolated subprocess or controlled test process so module evaluation can happen with missing env variables.
- Confirm the helper throws the fixed safe message:

```text
Missing Discovery Engine Supabase environment variables
```

Rules:

- Do not print env values.
- Do not print service-role keys.
- Do not print Supabase URLs if they might include sensitive project identifiers in logs.
- Do not serialize or log the client object.

## Forbidden Runtime Operations

Future smoke test must not use:

- `.from(...)`
- `.insert(...)`
- `.update(...)`
- `.delete(...)`
- `.upsert(...)`
- `.select(...)`
- `.rpc(...)`
- `.auth`
- `.storage`
- `.functions`
- `.channel`
- Supabase realtime calls
- any network/database operation
- API route creation
- UI/component imports
- candidate staging
- extraction

The smoke should instantiate the client and stop.

## Client Bundle Leakage Prevention

Future implementation should verify:

- The helper is imported only by the smoke test.
- No `app/` file imports `discovery-supabase-admin`.
- No `components/` file imports `discovery-supabase-admin`.
- No client-marked file imports the helper.
- No public/anon client uses generated `Database` typing as part of this smoke.

The future smoke must remain local/server-only and must not create an admin route.

## Future Verification Plan

Future implementation should run:

```bash
./node_modules/.bin/tsc --noEmit
node testing/discovery-candidate-normalizer.test.mjs
node --import ./testing/register-typescript-test-loader.mjs testing/discovery-supabase-admin-noop-smoke.test.mjs
npm run lint
npm run check
git diff --check
git status --short --branch
```

If the future smoke does not require the TypeScript loader after implementation details are confirmed, document the simpler exact command in the Phase 8U CCR. The initial recommendation is to use the loader because the helper is a `.ts` file.

## Future Safety Inspection Plan

Future implementation should run:

```bash
rg -n "createDiscoverySupabaseAdminClient|DiscoverySupabaseAdminClient|discovery-supabase-admin" testing lib app components --glob '!node_modules' --glob '!*.map'
rg -n "from\\(|insert\\(|update\\(|delete\\(|upsert\\(|select\\(|rpc\\(|\\.auth|\\.storage|\\.functions|\\.channel" testing/discovery-supabase-admin-noop-smoke.test.mjs lib/discovery/discovery-supabase-admin.ts
rg -n "NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY" testing/discovery-supabase-admin-noop-smoke.test.mjs lib/discovery/discovery-supabase-admin.ts
rg -n "\"use client\"|use client" lib/discovery testing --glob '!node_modules' --glob '!*.map'
```

Expected interpretation:

- The first scan should show the helper and the future smoke test only.
- The second scan should return no matches.
- The third scan may show environment variable names, but values must never be printed.
- The fourth scan should show no client directive in `lib/discovery`; unrelated test fixtures should be reviewed if any appear.

## Rollback Plan

If the future smoke implementation causes TypeScript, lint, build, loader, or safety-scan failures:

1. Remove `testing/discovery-supabase-admin-noop-smoke.test.mjs`.
2. Do not modify `lib/discovery/discovery-supabase-admin.ts`.
3. Do not remove `server-only`.
4. Do not modify Supabase clients.
5. Do not modify generated types.
6. Do not add app/API/UI fallback diagnostics.
7. Re-run verification.
8. Report the blocker for Gemini review.

Rollback for Phase 8T itself is deletion of this documentation file only.

## Risks / Follow-ups

Risks:

- Plain Node runtime may not handle Next.js `server-only` exactly like the Next build environment.
- Missing-env testing can be unsafe if it mutates process env in the main test process after module import.
- The smoke can become risky if anyone adds `.from(...)` or client logging.
- Factory construction does not prove database connectivity; it only proves safe helper construction.

Follow-ups:

- Gemini review of this Phase 8T plan.
- Phase 8U implementation approval before adding the smoke test.
- Later method-level plan before any candidate staging operation.
- Later DB-operation smoke only after candidate staging methods are approved.

## Required Gemini Gates

Gemini must review and approve:

- This Phase 8T no-op smoke plan.
- The exact Phase 8U smoke test file path.
- Whether the future smoke may instantiate the helper.
- Whether missing-env negative testing is safe.
- The exact future command using the TypeScript loader.
- Any future helper import outside `testing/`.
- Any future candidate staging method.
- Any future database operation.
- Any future API/UI/extraction integration.

## Final Phase 8T Recommendation

Phase 8T recommends implementing a local server-only no-op smoke test in the next phase:

```text
Phase 8U — Typed Discovery Client No-Op Smoke Test Implementation
```

Recommended future file:

```text
testing/discovery-supabase-admin-noop-smoke.test.mjs
```

Recommended future command:

```bash
node --import ./testing/register-typescript-test-loader.mjs testing/discovery-supabase-admin-noop-smoke.test.mjs
```

The future smoke should instantiate the typed Discovery admin client and stop. It must not call Supabase database/network APIs, must not log secrets, must not add API/UI routes, and must not introduce candidate staging behavior.

Candidate extraction remains not implementation-ready after Phase 8T. Phase 8U must receive Gemini approval before implementation.
