# Discovery Phase 14E — Admin UI Live Staging Activation Implementation Plan

## Status

Draft implementation plan only.

This phase does not implement UI activation, does not wire the live staging resolver into the default route, does not run a live smoke test, and does not perform any database mutation.

## Purpose

Phase 14E defines the safe implementation plan for a future admin-only UI flow that can request candidate staging from a trusted candidate preview.

The goal is to design how the existing read-only candidate preview UI can later offer a tightly gated staging action without weakening the boundaries established in previous phases.

## Current completed prerequisites

The following prerequisite phases are already complete:

- Phase 14C-E added trusted `source_url_snapshot` support to the preview provider.
- Phase 14D added the backend preview-revalidated live gate resolver.
- The default candidate extraction invoke route remains unwired to the Phase 14D resolver.
- The admin UI remains read-only for candidate preview.
- Live staging is still inactive by default.

## Required future behavior

A future implementation may add an admin UI staging action only when all of the following are true:

1. The admin is authenticated.
2. The request includes a valid CSRF token.
3. The target preview is currently accepted and reviewable.
4. The preview provider revalidates the run/source relationship server-side.
5. The trusted `sourceUrlSnapshot` is present, HTTPS, safe, and not equal to the candidate website URL.
6. The candidate website URL remains separate from the source URL.
7. The backend resolver creates the live staging options server-side.
8. The request is bounded to one candidate.
9. The source scope is `single_run`.
10. The backend stages only into the candidate staging table.
11. The resulting candidate status is `staged`.
12. The response confirms no public `tools` write and no `discovered_tools` write.

## Non-goals

Phase 14E does not authorize or implement any of the following:

- No live UI button wiring.
- No route default resolver activation.
- No production live staging execution.
- No live smoke test.
- No Supabase CLI command.
- No database schema change.
- No candidate row insertion.
- No public `tools` write.
- No `discovered_tools` write.
- No public publishing.
- No crawler execution.
- No LLM extraction execution.
- No bulk staging.
- No automatic approval.
- No background job or scheduler.

## Proposed future UI flow

The future admin UI should follow a staged confirmation pattern.

### Step 1 — Read-only preview state

The admin opens a discovery run and reviews the candidate preview.

The preview UI should display:

- Candidate name.
- Candidate website URL.
- Category hint.
- Pricing hint.
- Confidence bucket.
- Evidence summary.
- Source evidence locator.
- Trusted source URL snapshot.
- Preview status.
- Safety flags.
- Audit correlation ID.

The UI must clearly distinguish:

- `sourceUrlSnapshot` as the source/provenance URL.
- `candidateWebsiteUrl` as the candidate destination URL.

The two values must never be visually collapsed into a single field.

### Step 2 — Eligibility display

The UI may show staging eligibility only when the preview result is accepted and reviewable.

Eligible state should require:

- `accepted: true`
- `rejected: false`
- `previewStatus: "reviewable"`
- `preview.sourceUrlSnapshot` present
- `preview.candidateWebsiteUrl` present
- `preview.sourceUrlSnapshot !== preview.candidateWebsiteUrl`
- `noPublicWriteConfirmed: true`
- `noDiscoveredWriteConfirmed: true`

Ineligible states should remain read-only and should show the safe preview rejection reason.

### Step 3 — Deliberate admin confirmation

Before any future staging request, the UI should require a deliberate confirmation.

Recommended confirmation copy:

> Stage this candidate for admin review only. This will not publish the tool and will not write to public tools.

The confirmation dialog should display:

- Candidate name.
- Candidate website URL.
- Source URL snapshot.
- Discovery run ID.
- Discovery source ID.
- Audit correlation ID.
- A warning that staging is not publishing.

The confirm action should be disabled unless the preview is currently eligible.

### Step 4 — POST request contract

The future client request should call the existing candidate extraction invocation route with a bounded payload.

Payload shape:

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

The client must not send:

- `invoked_by_admin_user_id`
- `liveStagingGate`
- `getLiveStagingCandidate`
- `stageCandidate`
- raw preview payload
- raw HTML
- raw LLM output
- source URL override
- candidate website override
- public tool payload
- discovered tool payload

The route must continue deriving admin identity server-side.

### Step 5 — Backend resolver wiring requirement

A later implementation phase may wire the route dependency:

```ts
resolveLiveStagingOptions({ invocationInput, invokedByAdminUserId }) {
  return resolveCandidatePreviewLiveStagingOptions({
    invocationInput,
    invokedByAdminUserId,
  });
}
```

This wiring must be reviewed separately before commit because it changes the default route behavior for `dry_run: false`.

The resolver must remain server-only and dependency-injected for tests.

### Step 6 — Success response handling

A successful future response should show:

- Candidate staged successfully.
- Candidate status: `staged`.
- Candidate ID, if returned.
- No public write confirmed.
- No discovered write confirmed.
- Audit correlation ID.
- Reminder that this is not published.

The UI must not describe the candidate as “approved,” “published,” or “live.”

### Step 7 — Failure response handling

The UI should show safe failure messages for:

- Preview unavailable.
- Preview stale.
- Preview ambiguous.
- Source URL missing.
- Source URL unsafe.
- Source URL drift.
- Candidate website copied as source URL.
- Audit correlation mismatch.
- Live staging not configured.
- Rate limit.
- CSRF/session failure.

The UI must not expose:

- service role details
- stack traces
- raw payloads
- raw HTML
- raw LLM output
- internal Supabase errors
- secrets/tokens

## Future implementation sequence

The activation should be split into small phases.

### Phase 14F — Backend route resolver wiring plan or implementation

Possible scope:

- Wire the existing invoke route to `resolveCandidatePreviewLiveStagingOptions`.
- Keep the request payload bounded.
- Keep CSRF/session/rate-limit protections.
- Add route tests proving `dry_run: false` can stage through mocked dependencies only when preview is accepted.
- Add route tests proving rejected/stale/mismatched preview fails closed.
- No UI wiring.
- No live smoke.

### Phase 14G — Admin UI staged action design

Possible scope:

- Design exact UI state and confirmation copy.
- Define disabled/ineligible states.
- Define responsive behavior for desktop, tablet, and mobile.
- No implementation.

### Phase 14H — Admin UI staged action implementation

Possible scope:

- Add the gated UI action behind accepted preview state.
- Add confirmation dialog.
- Add CSRF fetch/use existing admin CSRF helper if already approved.
- Show safe success/failure states.
- No live smoke unless separately approved.

### Phase 14I — Manual live staging smoke gate

Possible scope:

- One exact admin-approved live staging smoke.
- One controlled source/run/preview only.
- Exact cleanup/verification plan if required.
- Explicit approval phrase required before any live mutation.

## Required tests for future implementation

A future implementation must include tests for:

- Accepted preview enables staging request construction.
- Rejected preview disables staging.
- Stale preview disables staging.
- Ambiguous preview disables staging.
- Missing `sourceUrlSnapshot` disables staging.
- Unsafe `sourceUrlSnapshot` disables staging.
- `sourceUrlSnapshot === candidateWebsiteUrl` disables staging.
- Client cannot submit admin identity.
- Client cannot submit live gate options.
- CSRF missing is rejected.
- Anonymous request is rejected.
- Rate-limited request is rejected safely.
- Success state says staged, not published.
- Failure states do not leak raw payloads.
- Desktop, tablet, and mobile rendering are acceptable.

## Security requirements

The implementation must preserve these boundaries:

- Server derives admin actor.
- Server validates CSRF.
- Server rate-limits the action.
- Server revalidates preview state.
- Server owns live gate creation.
- Client cannot create or influence live gate options.
- Client cannot override source URL.
- Client cannot override candidate website URL.
- Client cannot bypass preview validation.
- Candidate staging remains insert-only unless separately approved.
- Public tool publishing remains separate.
- `discovered_tools` remains untouched.
- Raw HTML and LLM output remain unavailable to the UI.

## Audit requirements

The future implementation should preserve and display the existing audit correlation ID.

Any future audit write must be designed separately and reviewed before implementation.

Phase 14E does not add audit writes.

## Rollback requirements

A future implementation should be easy to disable by:

- Removing UI action rendering.
- Returning no live staging options from the route resolver.
- Keeping `dry_run: false` fail-closed by default.
- Preserving read-only preview UI.

## Acceptance criteria for this documentation phase

Phase 14E is complete when:

- This implementation plan is committed.
- No source code is changed.
- No route is activated.
- No UI staging button is added.
- No live smoke is run.
- No database command is run.
- Project checks pass.
- Gemini approves the plan.

## Recommended next phase

Recommended next phase after Gemini approval and commit:

Phase 14F — Backend Preview-Revalidated Route Resolver Wiring Plan.

That phase should decide whether to wire the route directly or add another explicit backend activation gate first. It should still avoid UI activation and live smoke unless separately approved.
