# Phase 8P — Typed Supabase Client Integration Plan

## Status / Scope

Phase 8P is a docs-only planning phase for safely integrating the generated Supabase `Database` type into future Supabase client usage.

This phase authorizes no source-code changes, no Supabase client modifications, no generated type edits, no API/UI/extraction integration, and no database writes.

## Background

Phase 8O completed the controlled migration apply and generated Supabase types work for the dedicated candidate staging table.

Completed state carried forward:

- The approved migration `supabase/migrations/20260625171333_create_discovery_candidate_tools.sql` has been applied.
- Generated Supabase types have been committed at `lib/supabase/database.types.ts`.
- `public.discovery_candidate_tools` exists.
- RLS is enabled.
- A deny-all policy exists.
- The candidate staging table row count was verified as `0`.
- No public-safe candidate view exists.
- No candidates were created.
- No `public.tools` writes occurred.
- No `discovered_tools` writes occurred.
- No API, UI, or extraction integration was added.
- Existing Supabase clients were not modified.

The next safe step is to plan how generated types should be introduced into Supabase client construction without broadening runtime access or creating candidate write paths.

## Non-goals

Phase 8P does not:

- Modify `lib/supabase.ts`.
- Modify `lib/supabase-admin.ts`.
- Modify `lib/supabase/database.types.ts`.
- Add source code.
- Add tests.
- Add API behavior.
- Add UI behavior.
- Implement candidate inserts.
- Implement extraction.
- Create candidates.
- Write to `discovery_candidate_tools`.
- Write to `discovered_tools`.
- Write to `public.tools`.
- Run remote SQL.
- Run Supabase migrations.
- Regenerate Supabase types.
- Add approval, publish, promote, ranking, recommendation, LLM, automation, scheduler, cron, crawler, or browser automation behavior.

## Current State Carried Forward

The generated `Database` type now exists but is not yet integrated into the project’s Supabase client constructors.

The candidate staging table remains inaccessible to public/client-side paths. Future access must stay server/admin-only, service-role-backed, and separately reviewed before any candidate staging insert path is introduced.

Candidate extraction remains not implementation-ready after Phase 8P.

## Generated Types Availability

Generated Supabase types are available at:

```text
lib/supabase/database.types.ts
```

This file is generated output and must not be hand-edited. Future implementation phases should import from it using type-only imports so the generated type does not create runtime bundle behavior.

Recommended import style for future code:

```ts
import type { Database } from "./supabase/database.types";
```

The relative path may differ depending on the importing file, but the import must remain type-only.

## Existing Supabase Client Inventory

The current committed Supabase client files are:

- `lib/supabase.ts`
- `lib/supabase-admin.ts`

Observed posture:

- `lib/supabase.ts` creates the public/anon Supabase client with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `lib/supabase-admin.ts` creates the service-role/admin Supabase client with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Both current clients call `createClient(...)` without the generated `Database` type.
- `app/api/submit-tool/route.ts` imports `createClient` and `type SupabaseClient` directly for its own server-side workflow.
- Many admin and server routes/helpers import `supabaseAdmin`.
- Public and client-side code uses the anon/public `supabase` client in limited places, including public data reads and admin dashboard client behavior.

Important boundary: service-role usage must remain server-side only.

## Current Untyped Client Posture

Current Supabase usage is functionally working but largely untyped against the generated database schema.

This means future database query changes can compile without table/column type assistance. Introducing `Database` typing can improve compile-time safety, but it can also expose existing type gaps across all downstream callers of a shared client.

Because `supabaseAdmin` is widely used across server/admin code, typing it may create TypeScript follow-up work. That is acceptable only in a future approved implementation phase with a narrow verification plan.

## Integration Options

### Option A: Type Existing Admin Client

Future implementation would update only `lib/supabase-admin.ts` to type the service-role client with `Database`.

Conceptual future shape:

```ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey
);
```

Benefits:

- Minimal file-surface change.
- Keeps a single existing service-role client.
- Improves type safety for admin/server database calls.
- Avoids adding another service-role helper.
- Avoids public/browser client changes.
- Should not create runtime bundle changes if `Database` is imported with `import type`.

Risks:

- `supabaseAdmin` is widely used, so TypeScript may surface existing query typing issues.
- Some server/admin call sites may require follow-up type adjustments.
- If not carefully kept server-side, existing service-role boundaries must be re-verified.

Recommendation:

Recommended as the first implementation path for Phase 8Q, provided the implementation is limited to admin/server typing and verification. If the TypeScript blast radius is larger than expected, the implementation should stop and return to a narrower helper strategy.

### Option B: Type Public + Admin Clients

Future implementation would type both `lib/supabase.ts` and `lib/supabase-admin.ts` with `Database`.

Benefits:

- Broadest type coverage.
- Public and admin query paths would both receive generated schema typing.
- Could improve consistency across the application over time.

Risks:

- Broadest blast radius.
- Public/browser client imports must be checked carefully to avoid unintended runtime or bundle effects.
- Client component behavior could surface unrelated type issues.
- Public read-path assumptions need separate review.
- This does not directly advance safe candidate staging because candidate staging must not be accessible from public/client-side paths.

Recommendation:

Not recommended for the first typed-client phase. Public/browser client typing should remain separate unless a later phase specifically reviews public client query typing and bundle safety.

### Option C: Dedicated Discovery Typed Admin Helper

Future implementation would create a dedicated Discovery Engine helper, such as:

```text
lib/discovery/discovery-supabase-admin.ts
```

This helper would use `Database` while leaving generic Supabase clients untouched.

Benefits:

- Narrowest Discovery-specific type surface.
- Could limit future candidate-staging access to a bounded helper.
- Avoids introducing generated database typing into every existing `supabaseAdmin` call at once.
- Useful if the generic admin client type migration proves too broad.

Risks:

- Adds a second service-role helper surface.
- Increases risk of duplicated environment handling.
- Could create confusion between generic admin access and Discovery-specific admin access.
- Requires strict server-only usage review.
- May be unnecessary if Option A remains small.

Recommendation:

Not recommended as the first step unless Option A produces too much unrelated TypeScript churn. Keep this as the fallback strategy for a future narrow Discovery-only integration.

## Recommended Future Implementation Path

Recommended next phase:

```text
Phase 8Q — Typed Supabase Admin Client Integration
```

Recommended implementation direction:

1. Type only `lib/supabase-admin.ts` with `Database`.
2. Use a type-only import from `lib/supabase/database.types.ts`.
3. Do not modify `lib/supabase.ts` in the same phase.
4. Do not wire `discovery_candidate_tools` into any API route.
5. Do not add candidate insert/update/delete/select behavior.
6. Do not add extraction behavior.
7. Run full TypeScript, lint, build, and normalizer verification.
8. If typing the shared admin client creates broad unrelated TypeScript churn, stop and propose Option C as a separate follow-up.

This path gives server/admin database access compile-time schema awareness while preserving candidate staging boundaries.

## Server/Admin Security Boundaries

Future typed-client work must preserve these boundaries:

- Service-role access remains server-side only.
- No service-role imports from client components.
- No service-role imports from public browser code.
- No candidate staging access from client-side Supabase clients.
- No public read path for `discovery_candidate_tools`.
- No public insert/update/delete path for `discovery_candidate_tools`.
- No candidate staging helper should expose raw database rows directly to UI.
- Generated types must not be treated as authorization.
- RLS, route authorization, CSRF, and admin-session checks remain separate security controls.

Typing improves compile-time correctness only. It does not replace runtime authorization or database access control.

## Candidate Staging Access Rules

The candidate staging table remains staging-only.

Required rules:

- Direct `public.tools` writes remain forbidden.
- Staged candidates are not approved tools.
- Human review remains mandatory.
- Duplicate detection remains advisory until separately approved.
- Promotion/publish workflows are out of scope.
- No public read path is allowed.
- No public insert/update/delete path is allowed.
- No client-side direct access is allowed.
- Server/admin access must remain service-role-only and separately reviewed.
- Future candidate insert paths require a separate implementation phase and Gemini review.

## Type-Only Import Rules

Future typed-client implementation must use type-only imports for generated database types.

Rules:

- Use `import type { Database } ...`.
- Do not hand-edit `lib/supabase/database.types.ts`.
- Do not import generated types as runtime values.
- Do not re-export generated types from client-facing modules unless separately reviewed.
- Do not use generated types to bypass runtime validation.
- Do not use generated types to introduce candidate insert paths.

Verification should confirm generated type imports are erased from runtime output where applicable.

## Files Allowed in Later Implementation

For the recommended Phase 8Q implementation, the expected allowed source file is:

```text
lib/supabase-admin.ts
```

Potential additional files only if necessary and separately justified:

- Focused type-only test or compile verification files, if the project later adds a typed helper test.
- A new dedicated Discovery helper only if Option C is explicitly selected in a later phase.

The implementation should not require schema, migration, generated type, API route, UI, extraction, or candidate insert changes.

## Files Forbidden in Phase 8P

Phase 8P forbids editing:

- `lib/supabase.ts`
- `lib/supabase-admin.ts`
- `lib/supabase/database.types.ts`
- API routes
- UI components
- extraction helpers
- executor code
- normalizer code
- tests
- Supabase migrations
- Supabase generated type output
- database/schema/RLS/policy/index files

Phase 8P is this plan only.

## Future Verification Plan

Future Phase 8Q implementation should run:

```bash
./node_modules/.bin/tsc --noEmit
node testing/discovery-candidate-normalizer.test.mjs
npm run lint
npm run check
git diff --check
git status --short --branch
```

Future verification should also inspect:

- Generated type import is type-only.
- No runtime import of generated types is introduced when type-only import is intended.
- No client bundle imports the service-role admin helper.
- No candidate insert/update/delete paths are added.
- No `public.tools` writes are added.
- No `discovered_tools` writes are added.
- `lib/supabase/database.types.ts` remains unchanged.
- Supabase clients still protect secret environment usage server-side only.
- The public/anon client remains unchanged unless a later phase explicitly approves public client typing.

## Rollback Plan

If a future typed-client implementation causes unexpected TypeScript or runtime risk:

1. Revert the type-only import and generic `createClient<Database>` change from the affected client file.
2. Do not modify generated types.
3. Do not modify schema or migrations.
4. Do not apply database changes.
5. Do not introduce candidate insert paths as part of rollback.
6. Re-run TypeScript, lint, build, and normalizer tests.
7. If the shared admin client proves too broad, return to Option C as a narrower follow-up plan.

Rollback for Phase 8P itself is removal of this documentation file only.

## Risks / Follow-ups

Risks:

- Typing the shared admin client may reveal existing loosely typed query patterns.
- A careless non-type import of generated types could create unwanted runtime or bundle effects.
- Public/browser typing may create unrelated churn if attempted too early.
- A dedicated Discovery helper could duplicate service-role handling if introduced without a strict boundary.

Follow-ups:

- Gemini review of this Phase 8P plan.
- Phase 8Q implementation approval before any source-code change.
- Decide whether Phase 8Q uses Option A directly or keeps Option C as an immediate fallback.
- Keep candidate staging insert/API/UI/extraction integration in separate reviewed phases.

## Required Gemini Gates

Gemini must review and approve:

- This Phase 8P typed-client strategy before implementation.
- The exact Phase 8Q file scope.
- Whether Option A is acceptable as the first implementation path.
- Any fallback to Option C if shared admin typing creates broad churn.
- Any future public/browser client typing.
- Any future candidate staging insert path.
- Any future API/UI/extraction integration.
- Any future promotion/publish workflow.

## Final Phase 8P Recommendation

Phase 8P recommends a conservative server/admin-first typed-client strategy.

The next implementation phase should be:

```text
Phase 8Q — Typed Supabase Admin Client Integration
```

Recommended Phase 8Q scope:

- Type `lib/supabase-admin.ts` with `Database`.
- Use `import type`.
- Leave `lib/supabase.ts` unchanged.
- Leave generated types unchanged.
- Add no candidate staging writes.
- Add no API/UI/extraction behavior.
- Verify with TypeScript, lint, build, normalizer tests, and focused import/boundary inspection.

Candidate extraction remains not implementation-ready after Phase 8P. The candidate staging table remains staging-only, non-public, unapproved, and inaccessible except through future separately reviewed server/admin paths.
