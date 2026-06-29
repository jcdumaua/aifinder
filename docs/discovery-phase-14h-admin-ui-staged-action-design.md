# Discovery Phase 14H — Admin UI Staged Action Design

## Status

Draft UI design only.

This phase does not implement UI controls, does not add a staging button, does not call the invocation route from the browser, does not run a live smoke test, and does not perform any database command.

## Purpose

Phase 14H designs the future admin UI action that will let an authenticated admin deliberately stage exactly one reviewable candidate from a trusted preview.

The backend is now capable of server-side preview revalidation after Phase 14G, but the UI must remain inactive until a separately approved implementation phase.

This design keeps the human-in-the-loop staging workflow explicit, staged-only, and non-publishing.

## Current completed prerequisites

The following phases are complete:

- Phase 14C-E — trusted preview source URL snapshot validation.
- Phase 14D — backend preview-revalidated live gate resolver.
- Phase 14E — admin UI live staging activation implementation plan.
- Phase 14F — backend route resolver wiring plan.
- Phase 14G — backend preview-revalidated route resolver wiring implementation.

Current state after Phase 14G:

- The backend invocation route can call `resolveCandidatePreviewLiveStagingOptions`.
- The backend still requires admin session, CSRF, rate limit, server-derived actor identity, accepted preview, trusted `sourceUrlSnapshot`, matching source/run/audit lineage, `dry_run: false`, `max_candidates: 1`, and `source_scope: "single_run"`.
- The admin UI still has no staging action.
- No live smoke has been run.
- No UI activation has been performed.

## Non-goals

Phase 14H does not authorize:

- UI implementation.
- Staging button implementation.
- Confirmation dialog implementation.
- Browser POST to the candidate extraction invocation route.
- Live staging execution.
- Live smoke.
- Database command.
- Candidate row insertion.
- Public `tools` write.
- `discovered_tools` write.
- Publishing.
- Background job.
- Crawler execution.
- LLM extraction execution.

## Target admin surface

The future staged action belongs on the existing admin discovery run review surface where the accepted candidate preview is shown.

Likely surface:

`/admin/discovery`

or the existing run review area that reads:

- `GET /api/admin/discovery/runs`
- `GET /api/admin/discovery/runs/[id]/candidate-preview`

The action should appear only near a single accepted, reviewable preview for a single run.

## Action label

Recommended button label:

`Stage candidate`

Alternative acceptable labels:

- `Stage for review`
- `Stage candidate for admin review`

Forbidden labels:

- `Publish`
- `Approve`
- `Go live`
- `Add to public tools`
- `Add to discovered tools`

The UI must clearly communicate that staging is not publishing.

## Initial UI availability rules

The future UI should render the staged action only when all of the following are true:

1. Admin is authenticated.
2. A single discovery run is selected.
3. Candidate preview request has completed.
4. Preview result is accepted.
5. Preview status is `reviewable`.
6. Candidate name is present.
7. Candidate website URL is present.
8. Trusted source URL snapshot is present in the preview response if exposed safely.
9. Source/run/audit lineage is available from the preview and run state.
10. No stale, ambiguous, unavailable, or blocked preview state is present.
11. The current row/run is not already staged by this admin action in the current browser state.

If any requirement is missing, the UI should show read-only status text instead of an active staging action.

## Disabled states

The future button should be disabled when:

- Preview is loading.
- Preview is rejected.
- Preview is stale.
- Preview is ambiguous.
- Preview is unavailable.
- Source URL snapshot is missing.
- Candidate website URL is missing.
- Run ID is missing.
- Source ID is missing.
- Audit correlation ID is missing.
- Admin session is unavailable.
- CSRF token is unavailable.
- A staging request is already in progress.
- A staging request has just succeeded and the result is not yet refreshed.

Disabled text examples:

- `Preview unavailable`
- `Preview blocked`
- `Preview stale`
- `Missing trusted source`
- `Already staged in this session`
- `Refresh before staging`

## Confirmation dialog requirement

The future UI must show a confirmation dialog before sending the POST request.

The dialog must include:

- Candidate name.
- Candidate website URL.
- Trusted source URL snapshot or a safe source label.
- Discovery run ID or shortened run ID.
- Clear staged-only language.
- A warning that this does not publish the tool.
- A final deliberate confirmation button.

Recommended title:

`Stage this candidate?`

Recommended body:

`This will stage one candidate for admin review using the server-revalidated preview. It will not publish the tool and will not write to public tools.`

Recommended confirmation button:

`Stage candidate`

Recommended cancel button:

`Cancel`

## Confirmation dialog safety checklist

The dialog should include a compact checklist:

- `One candidate only`
- `Server revalidates preview before staging`
- `Trusted source snapshot is used as source URL`
- `Candidate website remains separate`
- `No public tools write`
- `No discovered tools write`
- `Staged status only`

The checklist should not expose raw database payloads, service role details, raw HTML, raw LLM output, stack traces, or secrets.

## Future client request contract

The future browser request should POST to:

`/api/admin/discovery/candidate-extraction/invoke`

with CSRF protection and JSON body:

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
- `sourceUrl`
- `source_url`
- `sourceUrlSnapshot`
- `candidateWebsiteUrl`
- `candidate_website_url`
- `preview`
- `raw_payload`
- `public_tool_payload`
- `discovered_tool_payload`

The server remains responsible for preview revalidation and staging options.

## Request lifecycle

Future UI flow:

1. Admin opens candidate preview review state.
2. UI fetches preview with existing read-only preview endpoint.
3. UI determines whether preview is eligible for a staged action.
4. Admin clicks `Stage candidate`.
5. UI opens confirmation dialog.
6. Admin reviews staged-only warning.
7. Admin confirms.
8. UI obtains or uses current CSRF token according to existing admin patterns.
9. UI sends bounded POST request to the invocation route.
10. UI displays success or failure state.
11. UI refreshes run/preview data.
12. UI keeps public publishing controls separate.

## Success state

On successful staging, the UI should show:

Title:

`Candidate staged`

Body:

`The candidate was staged for admin review. It was not published and no public tools write was performed.`

The success state may include:

- Candidate ID if returned safely.
- Candidate status: `staged`.
- Run ID.
- Source ID.
- Audit correlation ID.
- `No public tools write confirmed`.
- `No discovered tools write confirmed`.

The success state must not imply publication.

## Failure states

The UI should map backend failure states into safe admin-readable messages.

Examples:

| Backend condition | UI message |
| --- | --- |
| `live_invocation_not_enabled` | `The backend did not enable staging for this preview. Refresh and try again after review.` |
| `preview_artifact_unavailable` | `No reviewable preview is available for this run.` |
| `preview_source_url_missing` | `The trusted source URL snapshot is missing. This candidate cannot be staged.` |
| `preview_source_url_unsafe` | `The trusted source URL snapshot failed safety checks.` |
| `preview_source_url_drift` | `The preview is stale because the source URL changed. Refresh or rerun the preview.` |
| `unsupported_request_field` | `The staging request included unsupported fields and was blocked.` |
| `client_admin_identity_not_allowed` | `The staging request attempted to send client identity and was blocked.` |
| 401 | `Admin session expired. Please log in again.` |
| 403 | `Security token missing or expired. Please refresh and try again.` |
| 429 | `Too many admin requests. Please wait and try again.` |
| 500 | `Candidate staging failed safely. No public write was performed.` |

The UI must not show raw server errors, stack traces, service role information, raw payloads, or secret values.

## Loading and concurrency behavior

The UI should:

- Disable the staging button while request is in progress.
- Show `Staging...` or `Staging candidate...`.
- Prevent double submit.
- Keep the confirmation dialog open or show an in-dialog loading state until completion.
- After success, disable the button until data refresh completes.
- On failure, allow retry only after the admin reviews the safe failure message.
- Avoid optimistic staged status until the server returns success.

## Accessibility requirements

The future confirmation dialog must:

- Use a semantic dialog component.
- Have a clear accessible title.
- Focus the dialog title or first actionable element on open.
- Return focus to the trigger after close.
- Support keyboard escape/cancel.
- Support visible focus states.
- Announce loading and error states.
- Avoid color-only safety indicators.

## Responsive requirements

Desktop:

- Show full preview summary, source/destination distinction, and checklist.
- Confirmation dialog may use a comfortable max width.

Tablet:

- Keep dialog width constrained.
- Avoid horizontal scrolling.
- Keep primary and cancel actions visible.

Mobile:

- Use stacked buttons.
- Keep the staged-only warning visible without requiring deep scrolling.
- Keep source and destination URLs wrapped safely.
- Avoid exposing long raw IDs unless shortened.

## Audit wording

Future invocation reason should be stable and explicit:

`Admin requested staged candidate from reviewable preview.`

The UI should not generate arbitrary free-form invocation reasons in the first implementation.

## Safety copy

Recommended helper copy near the button:

`Stages one candidate for admin review. This does not publish the tool.`

Recommended source/destination copy:

`Trusted source snapshot is used for provenance. Candidate website remains separate.`

Recommended post-success copy:

`Candidate staged. No public tools write was performed.`

## Data display requirements

The UI should display:

- Candidate name.
- Candidate website URL.
- Category hint.
- Pricing hint.
- Evidence summary.
- Trusted source URL snapshot or safe source label.
- Preview status.
- Safety flags summary.
- Last updated or stale indicator when available.

The UI should not display:

- Raw HTML.
- Raw LLM output.
- Raw JSON payloads.
- Service role details.
- Stack traces.
- Secrets.

## Future implementation acceptance criteria

A future implementation phase must pass:

- UI renders action only for accepted reviewable preview.
- Confirmation dialog appears before POST.
- POST body contains only allowed fields.
- CSRF is included using existing admin pattern.
- Button disables while request is pending.
- Success state says staged, not published.
- Failure states are safe and non-leaky.
- No public `tools` write is triggered by the client.
- No `discovered_tools` write is triggered by the client.
- Desktop/tablet/mobile smoke checks are reported.
- `npm run check` passes.
- Relevant route and UI tests pass.

## Future implementation boundaries

The future UI implementation must not:

- Add public publishing.
- Add approval flow.
- Add discovered tools mutation.
- Add bulk staging.
- Add background automation.
- Add crawler execution.
- Add LLM extraction execution.
- Add live smoke unless separately approved.
- Add database commands.
- Add schema migration.
- Change route security rules.

## Recommended future sequence

Recommended next phases:

1. Phase 14I — Admin UI Staged Action Implementation.
   - Implement the UI action and confirmation dialog.
   - Keep live smoke separate.
   - Use mocked/local route tests and UI checks.
   - No live database smoke unless separately approved.

2. Phase 14J — Controlled Live Staging Smoke Gate.
   - Design and request exact approval for one controlled live staging smoke.
   - Use one known safe source/run/audit set.
   - Verify cleanup or staged record outcome.
   - Keep public publishing separate.

3. Phase 14K — Live Smoke Result Documentation.
   - Document the controlled live staging smoke result.

## Phase 14H acceptance criteria

Phase 14H is complete when:

- This document is committed.
- No source code is changed.
- No UI behavior is changed.
- No route behavior is changed.
- No live smoke is run.
- No database command is run.
- `npm run check` passes.
- Gemini approves this UI staged action design.
