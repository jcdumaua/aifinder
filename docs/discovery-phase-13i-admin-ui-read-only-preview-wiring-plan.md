# Phase 13I — Admin UI Scaffold Read-Only Preview Wiring Plan

## 1. Status

Phase 13I is docs-only.

This phase does not modify UI components, API routes, providers, tests, package files, migrations, generated types, Supabase schema, or environment configuration.

This phase does not run DB commands, Supabase commands, type generation, live staging, live smoke, POST requests, CSRF fetches, crawler execution, or LLM execution.

This phase does not create, update, or delete discovery sources, discovery runs, preview artifacts, candidate rows, audit rows, public tools, or discovered tools.

## 2. Current Confirmed State

Latest pushed commit before Phase 13I:

- d893e59 Add candidate preview API route

Current read-only route:

- GET /api/admin/discovery/runs/[id]/candidate-preview?source_id=:sourceId

Current route is admin-only, server-derived identity only, GET-only, no POST, no CSRF, no mutation, no live staging, no crawler, no LLM, no public tools write, and no discovered tools write.

Current disabled scaffold exists in:

- components/admin/discovery/discovery-candidate-extraction-live-staging-panel.tsx
- components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts
- testing/discovery-candidate-extraction-live-staging-panel.test.mjs

Current runs table passes:

- candidatePreview={null}
- isLiveStagingAvailable={false}

## 3. Goal

Plan a future UI-only wiring phase that lets the Admin Discovery Runs table fetch and display sanitized candidate preview data from the Phase 13H GET route when a run review panel is expanded.

The preview is informational only.

Displaying a preview must not mean a candidate is staged, approved, published, or written anywhere.

## 4. Future Files

Expected future implementation files:

- components/admin/discovery/discovery-runs-table.tsx
- components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts
- testing/discovery-candidate-extraction-live-staging-panel.test.mjs

Optional only if needed:

- components/admin/discovery/discovery-candidate-extraction-live-staging-panel.tsx

Forbidden unless separately approved:

- API routes
- provider files
- migrations
- generated types
- package files
- Supabase configuration
- staging helpers
- crawler helpers
- LLM helpers

## 5. Future Fetch Contract

The future UI fetch must use GET only.

Target route:

- /api/admin/discovery/runs/${run.id}/candidate-preview?source_id=${run.source_id}

Required fetch options:

- method: GET
- credentials: same-origin
- cache: no-store

The UI must not:

- fetch /api/admin/csrf
- send POST
- send a request body
- send admin identity
- send candidate payload
- send confirmation phrase
- call the candidate extraction invoke endpoint

## 6. Fetch Eligibility

Fetch preview only when:

- a run row is expanded
- run.id is present
- run.source_id is present
- the run review panel already renders the scaffold
- the request is for the exact expanded run

If run.source_id is missing, do not fetch the preview route.

## 7. State Model

Preview state should be keyed by run ID.

Recommended shape:

- isLoading
- errorMessage
- result

Reason:

- prevents stale preview from showing on the wrong run
- supports future multi-expanded rows
- keeps the preview scoped to trusted run/source context

## 8. Response Normalization

The UI must not trust raw route JSON.

The utils file should add safe normalizers for the Phase 13H response.

Allowed route response fields:

- data.accepted
- data.rejected
- data.rejectionCode
- data.previewStatus
- data.preview
- data.safetyFlags
- data.auditCorrelationId
- data.noPublicWriteConfirmed
- data.noDiscoveredWriteConfirmed

Unsafe values must be omitted, including:

- raw HTML
- script-like content
- payload markers
- service-role strings
- secrets
- cookies
- CSRF tokens
- stack traces
- SQL errors
- Supabase internal errors

## 9. Mapping To Scaffold

If route result is accepted and previewStatus is reviewable:

- normalize data.preview
- pass normalized preview to DiscoveryCandidateExtractionLiveStagingPanel

If route result is rejected:

- pass candidatePreview={null}
- keep isLiveStagingAvailable={false}
- show safe unavailable, pending, blocked, stale, or ambiguous copy

The scaffold button must remain disabled in every state.

## 10. Live Staging Availability Contract

The future implementation must keep:

- isLiveStagingAvailable={false}

No UI condition may set it to true.

No preview state may set it to true.

No accepted preview may set it to true.

No typed phrase may set it to true.

No feature flag may set it to true in this phase.

## 11. Display Contract

The UI may display safe preview information:

- candidate name
- website
- category
- confidence
- unavailable or blocked status
- stale or pending status

The UI must not display:

- raw database rows
- artifact IDs
- created_at
- updated_at
- Supabase errors
- SQL errors
- stack traces
- raw HTML
- raw LLM output
- cookies
- CSRF tokens
- service-role details

## 12. Error Handling

If preview fetch fails:

- keep candidatePreview={null}
- keep isLiveStagingAvailable={false}
- show a generic safe unavailable message
- do not expose route internals
- do not retry aggressively
- do not block existing run review panels

If admin session expires:

- show safe unavailable message
- do not fetch CSRF
- do not attempt POST fallback

## 13. Race Condition Contract

When expanding run A and then run B quickly:

- run A preview must not overwrite run B display
- preview state should remain keyed by run ID

When collapsing a row:

- no mutation should occur
- retained preview state must remain keyed by run ID

## 14. Accessibility Contract

Preview loading and unavailable messages should use safe accessible status text.

Recommended:

- role=status for loading/unavailable/blocked/stale copy
- keep disabled button aria-describedby
- ensure disabled reason still explains live staging is unavailable

## 15. Future Tests

Future tests should prove:

- UI fetches the candidate preview GET route only
- fetch uses method GET
- fetch uses cache no-store
- fetch uses credentials same-origin
- UI never fetches /api/admin/csrf
- UI never fetches candidate extraction invoke endpoint
- UI never sends POST
- accepted preview is normalized and passed to scaffold
- rejected preview keeps candidatePreview null
- blocked preview keeps staging disabled
- stale preview keeps staging disabled
- missing source ID does not fetch preview
- isLiveStagingAvailable={false} remains present
- no insert, upsert, update, or delete appears in UI files
- unsafe preview strings are omitted by utils

## 16. Stop Conditions

Future UI wiring must stop if it requires:

- POST
- CSRF fetch
- request body
- candidate staging
- live staging activation
- setting isLiveStagingAvailable to true
- changing the Phase 13H route
- changing the Phase 13F provider
- DB commands
- Supabase commands
- type generation
- migrations
- public tools writes
- discovered tools writes
- discovery candidate writes
- audit writes
- crawler execution
- LLM execution
- raw preview artifact exposure
- raw route error exposure

## 17. Recommended Next Phase

Recommended next phase:

Phase 13J — Admin UI Scaffold Read-Only Preview Wiring

Boundaries for Phase 13J:

- UI fetch only
- GET-only
- no CSRF
- no POST
- no live staging
- keep isLiveStagingAvailable={false}
- update UI tests

Do not start live staging activation yet.

## 18. Verification Plan

Run:

- git diff --check
- npm run check
- git diff --stat
- git diff --name-only
- git status --short --branch

Expected changed file:

- docs/discovery-phase-13i-admin-ui-read-only-preview-wiring-plan.md

Expected forbidden changes:

- no UI component files
- no API route files
- no provider files
- no test files
- no package files
- no migration files
- no generated type files

## 19. Commit Readiness Criteria

Phase 13I is safe to commit only if:

- Gemini approves the document
- verification passes
- only this Phase 13I docs file is staged
- no UI is changed
- no route is changed
- no provider is changed
- no tests are changed
- no migration is changed
- no generated types are changed
- no live commands are run
- no DB commands are run
- no POST requests are sent
- no CSRF fetch occurs
- no live staging occurs
