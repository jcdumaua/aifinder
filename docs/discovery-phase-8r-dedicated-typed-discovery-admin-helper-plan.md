# Phase 8R — Dedicated Typed Discovery Admin Helper Plan

## Status / Scope

Phase 8R is a docs-only planning phase for a future dedicated typed Discovery Engine server/admin Supabase helper.

This phase authorizes no source-code changes, no helper creation, no Supabase client modification, no generated type edits, no database writes, no candidate writes, and no API/UI/extraction integration.

## Background

Phase 8P recommended typing the existing service-role/admin Supabase client first. Phase 8Q attempted that narrow implementation by adding generated `Database` typing to `lib/supabase-admin.ts`.

The attempted Phase 8Q change was intentionally minimal:

```ts
import type { Database } from "@/lib/supabase/database.types";

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey
);
```

That global shared-client typing exposed broad downstream TypeScript incompatibilities across existing admin/server Supabase call sites. Codex correctly reverted the change under the Phase 8Q fallback rule.

Gemini accepted the blocker report and recommended a dedicated typed Discovery admin helper plan instead of forcing generated types through the mature shared admin client.

## Phase 8Q Blocker Summary

Typing the global `lib/supabase-admin.ts` client caused `./node_modules/.bin/tsc --noEmit` to fail in unrelated existing server/admin code.

Observed failure categories included:

- Nullable value mismatches.
- Typed RPC/update payload mismatches.
- `Record<string, unknown>` not assignable to generated `Json`.
- Dynamic update payloads rejected by generated Supabase types.

These issues are legitimate type-safety findings, but fixing them would require broad cleanup outside the approved Discovery Engine candidate-staging track.

Phase 8Q final status:

```text
attempted / reverted / no commit
```

## Non-goals

Phase 8R does not:

- Add source code.
- Create `lib/discovery/discovery-supabase-admin.ts`.
- Modify `lib/supabase-admin.ts`.
- Modify `lib/supabase.ts`.
- Modify `lib/supabase/database.types.ts`.
- Add tests.
- Modify API routes.
- Modify UI/components.
- Run Supabase migrations.
- Regenerate Supabase types.
- Run remote SQL.
- Perform database writes.
- Create candidates.
- Insert/update/delete rows in `discovery_candidate_tools`.
- Write to `discovered_tools`.
- Write to `public.tools`.
- Add candidate insert paths.
- Add extraction logic.
- Add approval, publish, promote, ranking, recommendation, LLM, automation, scheduler, cron, crawler, or browser automation behavior.

## Current State Carried Forward

Current relevant files:

- `lib/supabase-admin.ts` remains the existing untyped shared service-role client.
- `lib/supabase.ts` remains the existing untyped public/anon client.
- `lib/supabase/database.types.ts` contains committed generated Supabase `Database` types.
- `public.discovery_candidate_tools` exists in the database from Phase 8O, but no application code writes to it.
- `discovery_candidate_tools` remains empty unless separately changed outside this phase.

Current repository structure uses flat Discovery helper files under `lib/`, such as:

- `lib/discovery-candidate-normalizer.ts`
- `lib/discovery-static-html-evidence-audit-review.ts`
- `lib/discovery-static-html-evidence-executor.ts`
- `lib/discovery-url-safety.ts`

Despite that existing flat pattern, this phase evaluates a new `lib/discovery/` subdirectory for a tightly bounded typed Discovery admin surface.

## Why Shared Admin Client Typing Is Deferred

Global typing of `lib/supabase-admin.ts` is deferred because it creates an all-or-nothing migration of every existing admin/server Supabase call site.

Reasons to defer:

- The shared admin client touches unrelated systems, including submissions, homepage control, admin audit logs, public-safe reads, discovery intake, and legacy discovered-tool workflows.
- Generated Supabase types correctly reject several existing dynamic payload patterns.
- Fixing those call sites would be a broad refactor, not a narrow Discovery Engine candidate-staging step.
- The shared client carries service-role authority across many tables, including tables outside the candidate-staging scope.
- A global migration would expand review scope and regression risk.

The blocker is not a reason to abandon generated types. It is a reason to introduce them through an isolated Discovery-specific boundary first.

## Why Dedicated Discovery Helper Is Safer

A dedicated typed Discovery helper is safer because it creates a clean-room server/admin surface with a limited table and method scope.

Benefits:

- Limits generated-type blast radius to future Discovery Engine code.
- Avoids forcing unrelated admin routes into strict database typing.
- Prevents candidate-staging work from depending on legacy discovered-tool or public-tool workflows.
- Allows future helper methods to be named around staging and review, not approval or publishing.
- Allows service-role usage to stay hidden behind a server-only Discovery boundary.
- Makes safety scans easier because all future typed Discovery DB access should live in one small surface.

## Proposed Helper Path

Preferred future helper path:

```text
lib/discovery/discovery-supabase-admin.ts
```

This path differs from the current flat `lib/discovery-*.ts` helper pattern, but that is acceptable because this helper has a different responsibility: it is not a pure normalizer or review utility. It is a server/admin database access boundary.

Reasons this path fits:

- The `lib/discovery/` directory creates a clear namespace for future database-facing Discovery infrastructure.
- It separates typed server/admin plumbing from pure helper modules.
- It makes client-bundle leakage scans more precise.
- It allows future Discovery database helpers to live together without expanding the generic `lib/supabase-admin.ts` surface.

Fallback path if Gemini prefers matching the current flat structure:

```text
lib/discovery-supabase-admin.ts
```

The preferred path remains `lib/discovery/discovery-supabase-admin.ts` because the clean-room boundary is more important than matching the older flat helper naming convention.

## Helper Design Options

### Option A: Export Typed Raw Discovery Client

Conceptual future shape:

```ts
export const discoverySupabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey
);
```

Benefits:

- Smallest implementation.
- Easiest to verify with TypeScript.
- Keeps generated typing isolated from `lib/supabase-admin.ts`.
- Enables future Discovery code to use typed table names and payloads.

Risks:

- Exposes the full typed Supabase client to any server file that imports it.
- Does not prevent future accidental access to out-of-scope tables.
- Naming alone must enforce the Discovery-only boundary.
- More likely to drift toward broad service-role usage over time.

Blast radius:

- Lower than global `supabaseAdmin` typing.
- Higher than narrow-method exports because the full client remains available.

Service-role leakage risk:

- Moderate. The helper would still expose a service-role client object.
- Must be protected by server-only import rules and safety scans.

Testability:

- Easy to smoke-test with TypeScript.
- Harder to unit-test table-scope restrictions because raw client access remains open.

Suitability for future candidate staging:

- Acceptable as a short bridge only if Phase 8S strictly creates the helper without importing or using it elsewhere.
- Not ideal for long-term safety.

Recommendation:

Not the preferred long-term design. Acceptable only as a minimal transitional helper if Gemini wants the smallest possible Phase 8S implementation.

### Option B: Export Typed Discovery Client Factory

Conceptual future shape:

```ts
export function createDiscoverySupabaseAdminClient() {
  return createClient<Database>(
    supabaseUrl,
    supabaseServiceRoleKey
  );
}
```

Benefits:

- Keeps the typed client isolated from the global shared admin client.
- Avoids a module-level exported raw client singleton.
- Improves testability because future methods can accept a caller-provided typed client or factory output.
- Keeps Phase 8S minimal without adding candidate staging behavior.
- Allows later phases to decide whether narrow methods should wrap the factory.

Risks:

- Still exposes a full typed Supabase client to callers.
- Could be imported by too many files if not controlled.
- Requires strict naming and server-only documentation.

Blast radius:

- Narrow. Only future files that intentionally import the factory are affected.

Service-role leakage risk:

- Moderate-low if the helper lives under `lib/discovery/`, has server-only documentation, and is never imported by client components.

Testability:

- Good. Future tests can validate factory construction through type-level or module-boundary checks without touching the database.

Suitability for future candidate staging:

- Strong as a Phase 8S bridge.
- Enables typed Discovery code without prematurely designing staging insert methods.

Recommendation:

Recommended for Phase 8S as the minimal dedicated helper implementation, with no call-site usage and no candidate methods yet.

### Option C: Export Narrow Typed Methods Only

Conceptual future shape:

```ts
export async function stageNormalizedDiscoveryCandidate(
  input: SafeDiscoveryCandidateToolInsert
) {
  // future only, not Phase 8R
}
```

Benefits:

- Strongest safety boundary.
- Prevents callers from receiving a broad service-role client.
- Allows table and method scope to be explicitly allowlisted.
- Method names can avoid public-tool approval/publish semantics.
- Best long-term interface for candidate staging and admin review.

Risks:

- Requires more design before implementation.
- Candidate staging methods are not yet authorized.
- Prematurely adding methods could accidentally implement write behavior before the project is ready.
- Tests would need to cover method behavior and table restrictions.

Blast radius:

- Lowest once implemented correctly.

Service-role leakage risk:

- Lowest because the raw client can remain internal to the module.

Testability:

- Best for behavior tests once candidate staging methods are approved.
- Not appropriate for Phase 8S if the goal is only typed plumbing.

Suitability for future candidate staging:

- Best long-term destination.
- Should follow after the typed helper exists and Gemini approves a method-level staging plan.

Recommendation:

Recommended as the future target design, but not as the immediate Phase 8S implementation. Candidate staging methods should be a later separately approved phase.

## Recommended Future Implementation Path

Recommended next phase:

```text
Phase 8S — Dedicated Typed Discovery Admin Helper Implementation
```

Recommended Phase 8S scope:

1. Create `lib/discovery/discovery-supabase-admin.ts`.
2. Use `import type { Database } from "@/lib/supabase/database.types"`.
3. Create a minimal `createDiscoverySupabaseAdminClient()` factory using `createClient<Database>`.
4. Preserve the same environment variable names as `lib/supabase-admin.ts`.
5. Do not import the helper anywhere else yet.
6. Do not export candidate staging methods yet.
7. Do not add `.from("discovery_candidate_tools")`.
8. Do not add API/UI/extraction integration.
9. Verify TypeScript, lint, build, normalizer tests, and safety scans.

This chooses Option B as the short-term implementation and keeps Option C as the long-term safer interface once candidate staging methods are separately approved.

## Server/Admin Security Boundary

The future helper must be server/admin-only.

Rules:

- It must not be imported by client components.
- It must not contain `"use client"`.
- It must not expose secrets or environment values.
- It must not move service-role keys into public/browser code.
- It must not modify `lib/supabase.ts`.
- It must not modify `lib/supabase-admin.ts`.
- It must not replace the existing shared admin client.
- It must not be used from public pages unless a later phase explicitly approves a safe server-only usage.

The helper should carry clear comments stating that it is for server-side Discovery Engine infrastructure only.

## Type-Only Import Strategy

Future implementation should import generated types only as types:

```ts
import type { Database } from "@/lib/supabase/database.types";
```

Rules:

- Do not hand-edit `lib/supabase/database.types.ts`.
- Do not import generated types as runtime values.
- Do not re-export generated generated-table types to client modules.
- Do not use generated types as a substitute for runtime validation.
- Do not use generated types to justify new candidate write behavior.

The expected runtime import should remain only:

```ts
import { createClient } from "@supabase/supabase-js";
```

## Candidate Staging Access Rules

Candidate staging remains constrained:

- `discovery_candidate_tools` remains staging-only.
- Direct `public.tools` writes remain forbidden.
- `discovered_tools` writes remain forbidden unless separately approved.
- Staged candidates are not approved tools.
- Human review remains mandatory.
- Duplicate detection remains advisory.
- Promotion/publish workflows are out of scope.
- No public read path is allowed.
- No public insert/update/delete path is allowed.
- No client-side direct access is allowed.
- The server/admin helper must not expose approval/publish semantics.
- No candidate insert method is allowed unless a later Gemini-approved phase explicitly authorizes it.

## Allowed Future Table Scope

Future typed Discovery helper access may be planned for these tables only:

- `discovery_candidate_tools`: future staging-only access, not Phase 8S writes.
- `discovery_runs`: future read/correlation access if needed.
- `discovery_audit_events`: future safe audit correlation if needed.

Any table access should be introduced one method at a time in later reviewed phases.

## Forbidden Table Scope

The dedicated Discovery helper must not access these tables unless separately approved:

- `public.tools`
- public-safe views
- homepage-control tables
- submissions tables
- admin audit archive tables
- unrelated admin tables
- storage buckets
- legacy discovered-tool queues, unless a later bridge phase explicitly approves read-only duplicate checks

The helper must not become a general replacement for `lib/supabase-admin.ts`.

## Allowed Future Method Semantics

Allowed planning names for later phases may include:

- `createDiscoverySupabaseAdminClient`
- `getDiscoveryRunForCandidateStaging`
- `stageNormalizedDiscoveryCandidate`
- `listStagedDiscoveryCandidatesForReview`
- `markCandidateNeedsReview`
- `recordDiscoveryCandidateAuditEvent`

Important: these are planning names only. Actual methods require separate Gemini approval and implementation authorization.

Allowed future method semantics:

- Read a Discovery run for staging correlation.
- Stage a normalized candidate only after the candidate-staging write phase is approved.
- List staged candidates for admin review only after admin review planning is approved.
- Mark candidates with staging-only review states.
- Record safe operational audit events without raw payloads.

## Forbidden Method Semantics

Forbidden method names or semantics:

- `approveCandidate`
- `publishCandidate`
- `promoteCandidate`
- `createTool`
- `insertPublicTool`
- `syncToTools`
- `autoApprove`
- `rankCandidate`
- `recommendTool`

The helper must not implement:

- Public-tool creation.
- Public-tool publication.
- Auto-approval.
- Candidate promotion.
- Ranking/recommendation.
- LLM interpretation.
- Duplicate auto-resolution.
- Browser/client-side direct database access.

## Client Bundle Leakage Prevention

Future implementation must prevent the helper from entering the client bundle.

Required controls:

- Place the helper under `lib/discovery/` and document server-only usage at the top of the file.
- Do not add `"use client"` to the helper.
- Do not import it from React client components.
- Do not import it from files that already contain `"use client"`.
- Do not export the service-role client from barrel files that client code may import.
- Run explicit scans for helper imports in `components` and client-marked files.
- Keep service-role env access inside server-only modules.

Future safety scan:

```bash
rg -n "\"use client\"|use client" lib/discovery --glob '!node_modules' --glob '!*.map'
rg -n "discovery-supabase-admin" app components lib testing --glob '!node_modules' --glob '!*.map'
```

## Future Implementation Steps

Phase 8S should be small and stop before behavior integration:

1. Confirm clean repo state.
2. Run `npm run check`.
3. Inspect `lib/supabase-admin.ts`, `lib/supabase.ts`, and `lib/supabase/database.types.ts`.
4. Create `lib/discovery/discovery-supabase-admin.ts`.
5. Add a type-only `Database` import.
6. Add a `createDiscoverySupabaseAdminClient()` factory.
7. Preserve existing env variable names.
8. Do not import the helper anywhere else.
9. Run TypeScript, normalizer tests, lint, build, and diff checks.
10. Run safety scans for client leakage and forbidden table/method semantics.
11. Stop for Gemini review.

Phase 8S should not add candidate staging methods.

## Future Verification Plan

Future implementation should run:

```bash
./node_modules/.bin/tsc --noEmit
node testing/discovery-candidate-normalizer.test.mjs
npm run lint
npm run check
git diff --check
git status --short --branch
```

Expected future Phase 8S result:

- TypeScript passes.
- Normalizer tests pass.
- Lint passes.
- Production build passes.
- Only the dedicated helper file changes.
- No existing shared Supabase clients change.
- No API/UI/extraction integration appears.

## Future Safety Inspection Plan

Future implementation should run:

```bash
rg -n "discovery-supabase-admin|createClient<Database>|import type .*Database" lib app components testing --glob '!node_modules' --glob '!*.map'
rg -n "from\\(\"public\\.tools\"|from\\('public\\.tools'|from\\(\"tools\"|from\\('tools'" lib/discovery app/api/admin/discovery --glob '!node_modules' --glob '!*.map'
rg -n "approve|publish|promote|autoApprove|rank|recommend|insertPublicTool|syncToTools" lib/discovery app/api/admin/discovery --glob '!node_modules' --glob '!*.map'
rg -n "\"use client\"|use client" lib/discovery --glob '!node_modules' --glob '!*.map'
```

Expected interpretation:

- `createClient<Database>` and `import type { Database }` should appear only in the dedicated helper.
- No `public.tools` or `tools` access should appear in `lib/discovery`.
- Existing legacy Discovery routes may still contain discovered-tool approval or duplicate semantics; Phase 8S must not add new ones.
- `lib/discovery` should not contain `"use client"`.

## Rollback Plan

If future Phase 8S implementation creates unexpected TypeScript, lint, build, or safety-scan failures:

1. Remove the newly created `lib/discovery/discovery-supabase-admin.ts` file.
2. Do not modify `lib/supabase-admin.ts`.
3. Do not modify `lib/supabase.ts`.
4. Do not modify generated types.
5. Do not run migrations.
6. Do not add fallback API/UI/extraction behavior.
7. Re-run verification.
8. Report the blocker to Gemini.

Rollback for Phase 8R itself is removal of this documentation file only.

## Risks / Follow-ups

Risks:

- A raw typed factory can still expose broad service-role database access if imported carelessly.
- Creating `lib/discovery/` introduces a new directory pattern next to existing flat Discovery helpers.
- Future candidate staging methods could accidentally drift toward approval/publish semantics if not tightly reviewed.
- Existing legacy Discovery routes still contain discovered-tool workflows; the new helper must not inherit those semantics by default.

Follow-ups:

- Gemini review of this Phase 8R plan.
- Phase 8S implementation approval before creating the helper.
- A later method-level plan before adding candidate staging writes.
- A later admin review plan before reading staged candidates into UI.
- A later promotion/publish plan only if explicitly approved; it remains out of scope.

## Required Gemini Gates

Gemini must review and approve:

- This Phase 8R helper strategy before implementation.
- The exact Phase 8S helper file path.
- The choice of Option B factory as the initial implementation.
- Any future shift to Option C narrow methods.
- Any future access to `discovery_candidate_tools`.
- Any future candidate insert/update/delete behavior.
- Any future API/UI/extraction integration.
- Any future duplicate detection workflow.
- Any future approval/publish/promotion workflow.

## Final Phase 8R Recommendation

Phase 8R recommends:

- Do not type the shared `lib/supabase-admin.ts` client.
- Do not modify `lib/supabase.ts`.
- Keep generated types unchanged.
- Create a dedicated future typed Discovery helper at:

```text
lib/discovery/discovery-supabase-admin.ts
```

- Use Option B first: export a `createDiscoverySupabaseAdminClient()` factory.
- Do not add candidate staging methods in Phase 8S.
- Keep Option C as the long-term target once method-level candidate staging behavior is separately approved.

Candidate extraction remains not implementation-ready after Phase 8R. Phase 8S must receive Gemini approval before any helper implementation begins.
