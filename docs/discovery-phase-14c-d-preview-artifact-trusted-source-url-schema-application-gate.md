# Phase 14C-D — Preview Artifact Trusted Source URL Schema Application Gate

## 1. Status

Phase 14C-D is an application-gate phase.

This document does not apply the migration.

This document does not regenerate generated types.

This document does not modify UI components, API routes, providers, helpers, tests, package files, generated types, environment configuration, or deployment configuration.

This document does not run database commands, remote SQL, Supabase commands, type generation, live staging, live smoke, POST requests, CSRF fetches, crawler execution, or LLM execution.

This document does not create, update, or delete discovery sources, discovery runs, preview artifacts, candidate rows, audit rows, public tools, or discovered tools.

## 2. Current Confirmed State

Latest pushed commit before Phase 14C-D:

- `62482ff Draft trusted source URL migration`

Phase 14C-C drafted and pushed:

- `supabase/migrations/20260628164230_add_preview_artifact_source_url_snapshot.sql`
- `docs/discovery-phase-14c-c-preview-artifact-trusted-source-url-migration-draft.md`

The migration draft has been Gemini-approved.

The migration draft has not been applied.

Generated Supabase types have not been updated for `source_url_snapshot`.

Backend live staging remains blocked.

## 3. Purpose

The purpose of Phase 14C-D is to define the exact gate for applying the trusted source URL schema and regenerating generated types.

This gate must preserve the safety boundary between:

- schema application/type generation;
- provider implementation;
- backend live gate resolver implementation;
- admin UI activation;
- live staging smoke.

Phase 14C-D does not authorize provider implementation or backend activation.

## 4. Exact Approval Required

The migration application and type generation must not run unless James gives the exact phrase:

```text
Approve run Phase 14C-D trusted source URL schema application and type generation
```

Any vague approval such as:

- approved;
- proceed;
- continue;
- looks good;
- go ahead;

does not authorize migration application or type generation.

## 5. Authorized Actions After Exact Approval Only

After the exact approval phrase is given, the authorized commands are limited to:

1. Confirm repo status and latest commit.
2. Run local pre-apply verification:
   - `git status --short --branch`
   - `git log --oneline -1`
   - `git diff --check`
   - `npm run check`
3. Apply pending Supabase migration:
   - `supabase db push --yes`
4. Regenerate generated types:
   - `npm run generate:types`
5. Verify generated types include:
   - `source_url_snapshot`;
   - accepted insert/update typing for the new column;
   - `preview_schema_version` remains typed as `string`;
   - existing table relationships remain present.
6. Run post-typegen verification:
   - `git diff --check`
   - `npm run check`
   - relevant candidate preview provider/route/invocation tests if still present.
7. Confirm changed files are limited to generated type output if type generation changed files.

## 6. Explicit Non-Authorization

Even after the exact Phase 14C-D approval phrase, this phase does not authorize:

- provider implementation;
- preview route changes;
- invocation route changes;
- mapper changes;
- admin UI changes;
- POST wiring;
- CSRF fetches;
- backend live staging activation;
- live staging smoke;
- candidate staging;
- public.tools writes;
- discovered_tools writes;
- crawler execution;
- LLM execution;
- inserting preview artifacts;
- editing discovery sources or runs;
- validating the `not valid` constraint manually unless separately approved.

## 7. Apply Command Shape

The future apply command should be run from the repository root:

```bash
cd /Users/jamescarlodumaua/aifinder

supabase db push --yes
npm run generate:types
```

The exact executable command should include logging to `/tmp` and clipboard capture before execution.

## 8. Stop Conditions

The apply/typegen process must stop immediately if:

- repo is not clean before apply;
- latest commit is not the expected Phase 14C-C commit or later approved gate commit;
- `git diff --check` fails;
- `npm run check` fails before apply;
- Supabase CLI reports migration conflicts;
- Supabase CLI reports remote migration drift;
- Supabase CLI prompts for destructive changes;
- generated types fail;
- generated types do not include `source_url_snapshot`;
- generated types change unexpected files;
- post-typegen `npm run check` fails;
- provider/backend/UI files changed unexpectedly.

## 9. Expected Post-Apply File Changes

Expected changed files after successful apply/typegen:

- `lib/supabase/database.types.ts`

Possible no-op case:

- If type generation produces identical output for some reason, the working tree may remain clean.

Unexpected changed files:

- UI component files;
- API route files;
- provider files;
- helper files;
- test files;
- package files;
- additional migrations;
- environment files;
- lockfiles.

Any unexpected changed files must stop the phase.

## 10. Expected Type Changes

The generated type output should show `source_url_snapshot` on:

- `Database["public"]["Tables"]["discovery_candidate_preview_artifacts"]["Row"]`;
- `Insert`;
- `Update`.

Expected type shape:

```ts
source_url_snapshot: string | null
source_url_snapshot?: string | null
```

The generated types should continue to include:

- `candidate_website_url`;
- `source_evidence_locator`;
- `preview_schema_version`;
- `preview_status`;
- `safety_flags`;
- source/run relationships.

## 11. Post-Apply Validation Boundaries

Post-apply validation should prove only schema/type readiness.

It must not attempt to create preview artifacts.

It must not attempt live staging.

It must not call admin preview routes with POST.

It must not fetch CSRF tokens.

It must not mutate source/run/candidate/audit rows.

## 12. Future Phase After Successful Apply/Typegen

After a successful Phase 14C-D apply/typegen, the next recommended phase is:

- Phase 14C-E — Trusted Source URL Provider Implementation Plan

That future phase should remain separate from backend activation.

Provider implementation must be planned and reviewed before code changes.

## 13. Phase 14C-D Verification Plan For This Gate Document

Before committing this document, run:

- `git diff --check`;
- `npm run check`;
- `git diff --stat`;
- `git diff --name-only`;
- `git status --short --branch`.

Expected changed file:

- `docs/discovery-phase-14c-d-preview-artifact-trusted-source-url-schema-application-gate.md`

Expected forbidden changes:

- no UI component files;
- no API route files;
- no provider files;
- no helper files;
- no test files;
- no package files;
- no migration files;
- no generated type files.

## 14. Commit Readiness Criteria

Phase 14C-D gate document is safe to commit only if:

- Gemini approves the gate document;
- verification passes;
- only this Phase 14C-D docs file is staged;
- no migration is applied;
- no generated types are changed;
- no UI is changed;
- no route is changed;
- no provider/helper is changed;
- no tests are changed;
- no package files are changed;
- no live commands are run;
- no DB commands are run;
- no Supabase commands are run;
- no POST requests are sent;
- no CSRF fetch occurs;
- no live staging occurs.
