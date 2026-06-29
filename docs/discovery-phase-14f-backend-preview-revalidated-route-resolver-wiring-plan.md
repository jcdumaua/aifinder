# Discovery Phase 14F — Backend Preview-Revalidated Route Resolver Wiring Plan

## Status

Draft wiring plan only.

This phase does not wire the route, does not activate live staging, does not add UI staging controls, does not run a live smoke test, and does not perform any database mutation.

## Purpose

Phase 14F defines the exact future backend route wiring needed to connect the existing candidate extraction invocation route to the Phase 14D preview-revalidated live gate resolver.

The goal is to plan the safest possible backend-only activation path before any implementation changes are made.

## Current completed prerequisites

The following phases are complete:

- Phase 14C-E validated trusted preview `source_url_snapshot` handling.
- Phase 14D added `resolveCandidatePreviewLiveStagingOptions`.
- Phase 14E documented the future admin UI staging activation flow.
- The default candidate extraction invoke route remains fail-closed for `dry_run: false` unless server-created live staging options are provided.
- The admin UI remains read-only for candidate preview.
- No live staging UI exists.

## Current route state

The current route:

`app/api/admin/discovery/candidate-extraction/invoke/route.ts`

already has a dependency-injection extension point:

```ts
resolveLiveStagingOptions?: (
  input: CandidateExtractionRouteLiveStagingResolverInput,
) =>
  | CandidateExtractionInvocationOptions
  | Promise<CandidateExtractionInvocationOptions>;
```

The route currently calls the dependency only when provided. Without dependency wiring, the default route passes `{}` to the invocation helper and `dry_run: false` remains fail-closed.

This behavior must remain true until a separately approved implementation phase changes it.

## Future wiring target

A future backend implementation may import:

```ts
import { resolveCandidatePreviewLiveStagingOptions } from "../../../../../../lib/discovery/discovery-candidate-preview-live-staging-resolver";
```

and use it as the default server-created route resolver:

```ts
const liveStagingOptions = dependencies.resolveLiveStagingOptions
  ? await dependencies.resolveLiveStagingOptions({
      request,
      body,
      invocationInput,
      invokedByAdminUserId,
    })
  : await resolveCandidatePreviewLiveStagingOptions({
      invocationInput,
      invokedByAdminUserId,
    });
```

This would change default `dry_run: false` behavior from "always fail-closed" to "allow staging only if the server revalidates an accepted preview and creates scoped live gate options."

Because this changes production route behavior, it must be implemented only in a separately approved phase.

## Required future backend behavior

The future route wiring must preserve these rules:

1. Admin session is verified before body parsing proceeds.
2. CSRF verification remains required.
3. Admin rate limiting remains required.
4. Client-supplied admin identity remains rejected.
5. Unsupported client body fields remain rejected.
6. The server derives `invokedByAdminUserId`.
7. The client cannot send `liveStagingGate`.
8. The client cannot send `getLiveStagingCandidate`.
9. The client cannot send `stageCandidate`.
10. The client cannot send a raw preview payload.
11. The client cannot send a source URL override.
12. The client cannot send a candidate website override.
13. The route uses `resolveCandidatePreviewLiveStagingOptions` server-side.
14. The resolver revalidates the preview provider state server-side.
15. The resolver creates live staging options only for accepted, reviewable, trusted previews.
16. The resolver must keep `sourceUrlSnapshot` distinct from `candidateWebsiteUrl`.
17. The request must remain bounded to one candidate.
18. The source scope must remain `single_run`.
19. Public `tools` writes remain forbidden.
20. `discovered_tools` writes remain forbidden.
21. The result must describe the candidate as `staged`, not published.

## Request contract

The future route should continue accepting only the existing bounded request shape:

```json
{
  "discovery_source_id": "<source uuid>",
  "discovery_run_id": "<run uuid>",
  "audit_correlation_id": "<audit correlation uuid>",
  "invocation_reason": "Admin requested staged candidate from reviewable preview.",
  "dry_run": false,
  "max_candidates": 1,
  "source_scope": "single_run",
  "schema_version": "candidate_extraction_invocation.v1"
}
```

The route must continue rejecting:

- `invoked_by_admin_user_id`
- `liveStagingGate`
- `getLiveStagingCandidate`
- `stageCandidate`
- `raw_payload`
- `preview`
- `sourceUrl`
- `source_url`
- `sourceUrlSnapshot`
- `candidateWebsiteUrl`
- `public_tool_payload`
- `discovered_tool_payload`

## Required route tests for future implementation

A future implementation must add or update route tests for the default route, not just isolated dependency-injected tests.

Required passing cases:

1. `dry_run: true` remains accepted as dry-run only and does not call staging.
2. `dry_run: false`, accepted preview, valid CSRF/session, `max_candidates: 1`, and `source_scope: "single_run"` stages exactly one candidate through mocked staging dependencies.
3. The staged response confirms:
   - `accepted: true`
   - `dry_run: false`
   - `candidates_considered_count: 1`
   - `candidates_staged_count: 1`
   - `no_public_write_confirmed: true`
   - `no_discovered_write_confirmed: true`
   - `candidate_status_staged` safety flag.
4. The normalized staged candidate uses trusted `sourceUrlSnapshot` as `source_url`.
5. The normalized staged candidate uses `candidateWebsiteUrl` only as `candidate_website_url`.
6. The route derives admin actor server-side.

Required fail-closed cases:

1. Anonymous request returns 401.
2. Missing CSRF returns 403.
3. Invalid CSRF returns 403.
4. Client-supplied admin identity returns 400.
5. Client-supplied live gate options return 400.
6. Client-supplied source URL override returns 400.
7. Rejected preview fails closed.
8. Stale preview fails closed.
9. Ambiguous preview fails closed.
10. Missing source URL snapshot fails closed.
11. Unsafe source URL snapshot fails closed.
12. Candidate website copied as source URL snapshot fails closed.
13. Audit correlation mismatch fails closed.
14. `max_candidates > 1` fails closed.
15. `source_scope !== "single_run"` fails closed.
16. Invalid schema version fails closed.
17. Rate-limited request returns a safe 429.
18. Provider exception returns a generic safe error.
19. Raw payloads, stack traces, Supabase details, service role strings, and secrets are not leaked.

## Implementation option A — Direct default resolver wiring

In this option, the default route imports the Phase 14D resolver and calls it when no test dependency override is provided.

Pros:

- Simple and direct.
- Reuses existing route structure.
- Keeps tests dependency-injected.
- Minimal code change.

Cons:

- Changes production route behavior for `dry_run: false`.
- Requires careful route test expansion before commit.
- Must not be paired with UI activation in the same phase.

Recommended only if the implementation phase is backend-only and fully tested.

## Implementation option B — Environment-disabled server gate

In this option, the route imports the resolver but only calls it when a server-side feature flag is enabled.

Example:

```ts
const enablePreviewLiveStaging =
  process.env.AIFINDER_ENABLE_PREVIEW_LIVE_STAGING === "1";
```

Pros:

- Adds an emergency off switch.
- Allows backend code to ship while staying disabled in production.
- Safer if deployment risk is high.

Cons:

- Introduces environment-dependent behavior.
- Requires additional tests for enabled and disabled states.
- Can create confusion if the UI expects staging but the backend flag is off.

This should be considered if implementation risk is judged higher than expected.

## Implementation option C — Dedicated internal route

In this option, the existing invoke route remains unchanged and a new internal admin route is created specifically for preview-staged candidates.

Pros:

- Keeps existing invocation route stable.
- Cleanly separates preview staging from general extraction invocation.
- Easier to reason about UI endpoint contract.

Cons:

- More code and tests.
- Potential duplication of CSRF/session/rate-limit/body validation.
- Requires stronger route governance to avoid parallel drift.

This is not recommended unless the existing route becomes too broad.

## Recommended implementation path

Recommended future path:

Phase 14G should implement option A or a slight variant of option A as a backend-only implementation.

The phase should:

- Wire `resolveCandidatePreviewLiveStagingOptions` into the default invoke route.
- Keep dependency injection for tests.
- Add mocked route tests for accepted and rejected preview states.
- Keep UI unchanged.
- Avoid live smoke.
- Avoid direct DB/Supabase command.
- Avoid public `tools` and `discovered_tools` writes.

If Gemini or manual review finds production-route behavior change too risky, switch to option B before implementation.

## Required code boundaries for future implementation

The route file may import the resolver.

The route file must not directly import:

- Supabase clients.
- Service role clients.
- `stageNormalizedDiscoveryCandidate`.
- `stageMappedExtractionCandidate`.
- Public tools helpers.
- Discovered tools helpers.
- Crawler helpers.
- LLM extraction helpers.

The route should remain a transport and security boundary only.

The resolver should remain responsible for preview revalidation and live staging option creation.

## Required safety messages

Future route and UI responses must continue using staging-only language:

Allowed:

- “Candidate staged.”
- “Staged for admin review.”
- “This did not publish the tool.”
- “No public tools write confirmed.”

Forbidden:

- “Published.”
- “Approved.”
- “Live.”
- “Added to public tools.”
- “Added to discovered tools.”

## Rollback plan

If the future backend wiring causes issues, rollback should be simple:

1. Remove the default call to `resolveCandidatePreviewLiveStagingOptions`.
2. Keep dependency-injected test behavior intact.
3. Restore default `dry_run: false` behavior to fail-closed.
4. Keep the read-only preview UI unchanged.
5. Do not modify database schema.

## Verification required for future implementation

The future implementation phase must pass:

- `git diff --check`
- route tests
- resolver tests
- preview provider tests
- preview route tests
- extraction invocation tests
- extraction invocation route tests
- `npm run check`

Optional after explicit approval only:

- one controlled live staging smoke
- one exact candidate/source/run
- cleanup or verification plan

## Non-goals for this phase

Phase 14F does not authorize:

- route resolver wiring
- UI staging button
- confirmation dialog implementation
- live staging execution
- live smoke
- database command
- schema migration
- type generation
- candidate row insertion
- public `tools` writes
- `discovered_tools` writes
- crawler execution
- LLM extraction execution
- publishing

## Acceptance criteria for this documentation phase

Phase 14F is complete when:

- This plan is committed.
- No source code is changed.
- No route behavior is changed.
- No UI behavior is changed.
- No live smoke is run.
- No database command is run.
- `npm run check` passes.
- Gemini approves the plan.

## Recommended next phase

Recommended next phase after commit:

Phase 14G — Backend Preview-Revalidated Route Resolver Wiring Implementation.

That future phase should be backend-only and should not include UI activation or live smoke unless separately approved.
