# Discovery Phase 17A — Admin Shell Browser Supabase Read Hardening Design

## Status

Phase 17A is a docs-only hardening design phase.

Current pushed baseline:

```text
776a92a Document cursor pagination readiness gate
```

Phase 17A follows the completed Candidate Staging Queue cursor pagination milestone.

Phase 17A does not implement admin-shell hardening.

Phase 17A does not change source code, tests, API routes, backend helpers, UI components, migrations, or package files.

## Background

During Phase 16D browser QA for Candidate Staging Queue cursor pagination, the QA runner observed an unrelated admin-shell behavior:

```text
Existing unrelated admin dashboard shell attempted browser Supabase GET /rest/v1/tools reads after admin unlock.
```

The Phase 16D QA runner intercepted and fulfilled those requests before live network or database access.

Important distinction:

```text
No Candidate Staging Queue browser Supabase access was observed.
```

Phase 16F formally closed the Candidate Staging Queue cursor pagination milestone and recommended this separate hardening phase.

## Problem Statement

The admin-shell browser Supabase `GET /rest/v1/tools` read behavior is unrelated to Candidate Staging Queue cursor pagination, but it deserves a separate hardening design.

The concern is not that a mutation occurred.

The concern is that an admin browser surface may still directly read Supabase REST resources instead of consistently using admin API boundaries.

Direct browser Supabase reads can make it harder to enforce:

- centralized admin authentication
- centralized safe projections
- centralized error mapping
- centralized audit boundaries
- consistent rate limiting
- consistent no-service-role exposure guarantees
- consistent browser network review

## Design Decision

Design decision:

```text
Admin-shell browser Supabase reads should be migrated behind an admin API boundary if current inspection confirms that the browser shell directly calls Supabase REST for tools data.
```

This is a design decision only.

Implementation must not start from Phase 17A alone.

## Candidate Staging Queue Milestone Independence

This hardening design is independent from Candidate Staging Queue cursor pagination.

The Candidate Staging Queue milestone remains closed.

Phase 17A must not reopen or modify:

- Candidate Staging Queue cursor helper
- Candidate Staging Queue read model
- Candidate Staging Queue API route
- Candidate Staging Queue UI pagination controls
- Candidate Staging Queue detail drawer

The Phase 16 cursor pagination result remains:

```text
Candidate Staging Queue cursor pagination is complete for the approved forward-only created_at / updated_at milestone.
```

## Scope

Phase 17A designs a future hardening approach for unrelated admin-shell browser Supabase reads.

The future implementation should inspect and harden only the specific admin-shell tools read behavior observed during Phase 16D.

Likely future targets may include:

- admin dashboard shell data loading
- admin tools list loading
- any browser-side Supabase client read used by the admin shell for tools data

The exact implementation targets must be confirmed by source inspection in a future implementation plan.

## Non-Goals

Phase 17A does not approve:

- implementation
- browser QA
- live database queries
- live database mutations
- Supabase migration changes
- package dependency changes
- candidate staging queue changes
- public tools data model changes
- approval workflows
- publishing workflows
- candidate promotion workflows
- candidate rejection workflows
- archive/delete workflows
- crawler execution
- candidate extraction execution

## Desired Future Architecture

Preferred future architecture:

```text
Admin browser UI
  -> Admin API route
    -> server-side admin/session validation
    -> server-side Supabase read using safe helper
    -> safe projection
    -> safe JSON response
```

The browser should not directly query Supabase REST for admin-shell tools data.

The browser should call a project-owned admin API route instead.

## Admin API Boundary Requirements

Any future admin API boundary should:

- require a valid admin session
- reuse existing admin authentication helpers
- apply safe projection
- apply safe error mapping
- avoid raw database errors
- avoid raw stack traces
- avoid service-role exposure in browser code
- avoid direct browser Supabase access
- return JSON only
- remain read-only unless a separate mutation phase is approved
- preserve existing rate-limit or abuse-protection patterns where available

## Existing Route Reuse Preference

Future implementation should inspect whether an appropriate admin read route already exists.

Possible existing route candidates to inspect:

```text
app/api/admin/tools/route.ts
app/api/admin/discovery/tools/route.ts
app/api/admin/discovery/discovered-tools/route.ts
```

If an existing admin route already provides the needed safe read behavior, prefer reuse over adding a new route.

If no appropriate route exists, design a minimal read-only route in the implementation plan before coding.

Phase 17A does not choose the final route until source inspection confirms current behavior.

## Browser-Side Requirements

Future browser-side code should:

- remove direct admin-shell Supabase REST reads for tools data
- use `fetch` to a project-owned admin API route
- preserve `cache: "no-store"` for admin data
- preserve safe loading states
- preserve safe empty states
- preserve safe error states
- not render raw database errors
- not render service-role values
- not render secrets
- not expose Supabase service-role keys
- not introduce mutation controls

## Server-Side Requirements

Future server-side code should:

- validate admin session before reading data
- use a safe server-side data helper
- use a safe field projection
- avoid broad `select("*")` unless already safely constrained and justified
- avoid returning sensitive columns
- avoid raw SQL interpolation
- map database failures to safe error codes
- keep the route read-only
- keep mutation methods out of scope

## Data Projection Design

Future safe projection should include only fields needed by the admin shell.

Recommended projection design:

- identify the exact UI fields currently used
- map database row fields to a safe response shape
- exclude secrets, internal-only columns, and unrelated metadata
- document any intentionally included admin-only fields
- keep response shape stable for the UI

No projection should expose service-role credentials or raw Supabase client configuration.

## Security Requirements

Future hardening must preserve:

- no service-role exposure in browser code
- no direct browser Supabase access for admin-shell tools data
- no raw database errors
- no raw stack traces
- no browser-rendered secrets
- no mutation workflows
- no public-facing admin read route
- admin-only access
- centralized error mapping

## Testing Plan

A future implementation plan should require targeted tests for:

### Static Source Tests

- admin shell no longer imports browser Supabase client for tools reads
- no `supabase.from("tools")` browser read remains in the admin shell path
- no `/rest/v1/tools` direct browser dependency remains in the admin shell path
- no service-role markers appear in client components
- no mutation method is introduced
- no candidate staging queue files are modified unless explicitly approved

### Route Tests

If a route is added or reused, test:

- unauthenticated request is rejected
- authenticated admin request succeeds
- safe projection is returned
- raw database errors are mapped safely
- unsupported methods are rejected or absent
- no mutation behavior exists

### UI Tests

- UI calls admin API instead of Supabase REST
- loading state works
- empty state works
- safe error state works
- no raw database error is rendered
- no service-role marker appears
- no mutation labels appear

### Browser QA

Future browser QA should verify:

- admin shell loads without direct `/rest/v1/tools` browser request
- admin shell uses the intended admin API route
- no Candidate Staging Queue regression
- no service-role exposure in browser network logs
- no mutation requests
- Desktop, Tablet/iPad, and Mobile smoke checks if the admin shell UI is visible across viewports

## Browser QA Evidence Requirement

Future browser QA should capture:

- network log
- console log
- screenshot of relevant admin shell page
- proof that `/rest/v1/tools` is no longer called directly by the browser
- proof that the chosen admin API route is used instead
- final git status

## Implementation Sequencing

Recommended future sequence:

1. Phase 17B — Admin Shell Browser Supabase Read Hardening Implementation Plan
2. Phase 17C — Admin Shell Browser Supabase Read Hardening Implementation
3. Phase 17D — Admin Shell Browser Supabase Read Hardening Browser QA
4. Phase 17E — Admin Shell Browser Supabase Read Hardening QA Result Documentation
5. Phase 17F — Admin Shell Browser Supabase Read Hardening Readiness Gate

## Phase 17B Planning Requirements

Phase 17B should inspect current source and document:

- exact file(s) creating browser `/rest/v1/tools` reads
- exact UI behavior relying on those reads
- whether an existing admin API route can be reused
- exact future modified files
- exact tests to add or update
- exact browser QA network assertions
- rollback plan
- no-mutation boundary

Phase 17B should remain planning-only.

## Risk Assessment

Primary risks:

1. accidentally changing unrelated admin tools behavior
2. accidentally weakening admin authentication
3. accidentally exposing broader tool fields than the UI needs
4. accidentally introducing duplicate API paths
5. accidentally modifying Candidate Staging Queue files after that milestone is closed

Mitigations:

- inspect before implementing
- prefer existing admin API route reuse
- keep safe projection minimal
- add static tests against direct browser Supabase reads
- add route tests for admin-only behavior
- perform browser network QA
- keep Candidate Staging Queue files out of scope

## Boundary Confirmation

Phase 17A is documentation-only and design-only.

Phase 17A does not:

- change application source code
- change tests
- change API routes
- change backend helpers
- change UI components
- change Supabase migrations
- change package dependencies
- run browser QA
- run live database queries
- run database mutations
- create candidate rows
- create source rows
- create run rows
- write to `public.tools`
- write to `discovered_tools`
- approve candidates
- publish candidates
- promote candidates
- reject candidates
- archive candidates
- delete candidates
- trigger crawler execution
- trigger candidate extraction execution

## Readiness Decision

Phase 17A approves only the hardening design direction.

Final decision:

```text
Proceed to a planning-only Phase 17B before any admin-shell Supabase read hardening implementation.
```

## Recommended Next Phase

Recommended next phase:

```text
Phase 17B — Admin Shell Browser Supabase Read Hardening Implementation Plan
```

Phase 17B should inspect the current admin-shell source, identify the exact direct browser Supabase read path, choose route reuse or minimal route design, define tests, and preserve all no-mutation boundaries.

## Conclusion

Phase 17A designs a safe hardening path for the unrelated admin-shell browser Supabase `GET /rest/v1/tools` read behavior observed during Phase 16D.

The design keeps this work separate from the completed Candidate Staging Queue cursor pagination milestone, recommends moving admin-shell tools reads behind an admin API boundary, and requires a planning-only Phase 17B before any implementation.
