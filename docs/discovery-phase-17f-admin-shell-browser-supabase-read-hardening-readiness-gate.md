# Discovery Phase 17F — Admin Shell Browser Supabase Read Hardening Readiness Gate

## Status

Phase 17F is a docs-only readiness gate.

Current pushed baseline:

```text
270280c Document admin shell Supabase read hardening browser QA
```

Phase 17F reviews the Phase 17A through Phase 17E admin-shell browser Supabase read hardening milestone and records the readiness decision.

Phase 17F does not implement code.

Phase 17F does not change tests, API routes, backend helpers, UI components, migrations, package files, or source code.

Phase 17F does not rerun browser QA.

Phase 17F does not run live database queries.

Phase 17F does not run database mutations.

## Milestone Purpose

The milestone began after Phase 16D browser QA observed an unrelated admin-shell browser Supabase read attempt for the `tools` table.

The purpose of the Phase 17 milestone was to harden that admin-shell boundary by ensuring that the admin browser no longer reads `public.tools` directly through Supabase REST and instead uses a project-owned admin API route.

Target hardening objective:

```text
Admin browser UI -> admin API route -> server admin/session validation -> server-side Supabase read -> safe projection -> JSON response
```

Primary security goal:

```text
No direct browser Supabase /rest/v1/tools read for the admin tools shell.
```

Secondary security goals:

```text
Use existing admin security boundary.
Use a read-only server route.
Use explicit safe projection.
Avoid service-role exposure to the browser.
Avoid accidental future sensitive-column leakage.
Preserve existing admin dashboard behavior.
Preserve Candidate Staging Queue boundaries.
```

## Phase Chain Reviewed

Phase 17F reviews the following completed phases:

```text
Phase 17A — Admin Shell Browser Supabase Read Hardening Design
Phase 17B — Admin Shell Browser Supabase Read Hardening Implementation Plan
Phase 17C — Admin Shell Browser Supabase Read Hardening Implementation
Phase 17D — Admin Shell Browser Supabase Read Hardening Browser QA
Phase 17E — Admin Shell Browser Supabase Read Hardening Browser QA Result Documentation
```

## Phase 17A Review

Phase 17A documented the design for moving the admin-shell browser Supabase tools read behind an admin API boundary.

Phase 17A completed as docs-only.

Pushed commit:

```text
70b3962 Document admin shell Supabase read hardening design
```

Phase 17A established:

```text
The browser should not directly read tools through Supabase.
The admin shell should use a same-origin admin API route.
The server route should enforce existing admin security.
The server route should use Supabase admin/server-side access only.
The response should use a safe projection.
No service-role secret should be exposed to the browser.
```

Phase 17A did not implement code.

Phase 17A did not run DB operations.

Phase 17A did not touch Candidate Staging Queue implementation files.

## Phase 17B Review

Phase 17B documented the implementation plan.

Phase 17B completed as docs-only.

Pushed commit:

```text
59bb63b Document admin shell Supabase read hardening implementation plan
```

Phase 17B identified the exact implementation target:

```text
components/admin/admin-dashboard-client.tsx
```

Phase 17B identified the preferred API route reuse target:

```text
app/api/admin/tools/route.ts
```

Phase 17B identified the static regression test target:

```text
testing/admin-shell-supabase-read-hardening.test.mjs
```

Phase 17B confirmed that the browser Supabase `tools` read was constructed at runtime by the Supabase client and therefore did not appear as a literal `/rest/v1/tools` string in the codebase.

Phase 17B did not implement code.

Phase 17B did not run DB operations.

Phase 17B did not touch Candidate Staging Queue implementation files.

## Phase 17C Review

Phase 17C implemented the hardening.

Pushed commit:

```text
8e9914d Harden admin shell tools read boundary
```

Phase 17C changed exactly:

```text
app/api/admin/tools/route.ts
components/admin/admin-dashboard-client.tsx
testing/admin-shell-supabase-read-hardening.test.mjs
```

Phase 17C removed the browser Supabase tools read from:

```text
components/admin/admin-dashboard-client.tsx
```

The admin dashboard client now uses:

```text
fetch("/api/admin/tools", {
  method: "GET",
  credentials: "same-origin",
  cache: "no-store"
})
```

Phase 17C added a read-only `GET /api/admin/tools` handler in:

```text
app/api/admin/tools/route.ts
```

The route uses the existing admin security helper:

```text
requireAdminSecurity(request)
```

The route uses explicit safe projection instead of `select("*")`:

```text
id, name, category, description, website, pricing, logo_url, status, deleted_at
```

The `GET` handler remains read-only.

The static hardening test confirms:

```text
No browser Supabase import remains in the admin dashboard client.
No browser .from("tools") read remains in the admin dashboard client.
The client uses /api/admin/tools.
The route has GET before POST.
The route GET uses existing admin security.
The route GET uses explicit safe projection.
The route GET avoids mutation methods.
```

Phase 17C verification passed before commit:

```text
node testing/admin-shell-supabase-read-hardening.test.mjs
npm run check
git diff --check
```

Phase 17C did not modify Candidate Staging Queue implementation files.

Phase 17C did not run live DB queries.

Phase 17C did not run DB mutations.

## Phase 17D Review

Phase 17D performed browser/network QA only.

Phase 17D did not commit or push.

Final Phase 17D result:

```text
Passed
```

Passing evidence directory:

```text
/tmp/aifinder-phase-17d-admin-shell-supabase-read-hardening-browser-qa/2026-06-30T16-41-12-576267Z
```

Captured evidence files:

```text
desktop-admin-tools.png
desktop-network-log.json
tablet-admin-tools.png
tablet-network-log.json
mobile-admin-tools.png
mobile-network-log.json
phase17d-browser-qa-result.json
next-dev-server.log
```

Phase 17D confirmed across Desktop, Tablet/iPad, and Mobile:

```text
The admin tools page reached /admin/tools.
No /admin-login redirect occurred in the passing v3 run.
GET /api/admin/tools was used.
No direct /rest/v1/tools browser request occurred.
No direct /rest/v1/* Supabase browser request occurred.
No admin mutation request occurred.
No service-role marker appeared in browser QA evidence.
```

Desktop result:

```text
Viewport: 1440x1000
apiToolsRequests: 1
loginRedirectRequests: 0
directToolsRestRequests: 0
directSupabaseRestRequests: 0
adminMutationRequests: 0
```

Tablet / iPad result:

```text
Viewport: 820x1180
apiToolsRequests: 1
loginRedirectRequests: 0
directToolsRestRequests: 0
directSupabaseRestRequests: 0
adminMutationRequests: 0
```

Mobile result:

```text
Viewport: 390x844
apiToolsRequests: 1
loginRedirectRequests: 0
directToolsRestRequests: 0
directSupabaseRestRequests: 0
adminMutationRequests: 0
```

Phase 17D had two non-product QA harness failures before the passing v3 run:

```text
v1 failed before assertions because the temporary Playwright runner under /tmp could not resolve @playwright/test from the repo node_modules.
v2 reached the browser but redirected to /admin-login because the server-side admin guard had no valid admin session cookie.
v3 passed using a temporary valid admin session cookie generated from ADMIN_SESSION_SECRET without printing the secret.
```

Phase 17D did not modify the repo.

Final Phase 17D repo status:

```text
## main...origin/main
Working tree clean
```

## Phase 17E Review

Phase 17E documented the Phase 17D browser QA result.

Phase 17E completed as docs-only.

Pushed commit:

```text
270280c Document admin shell Supabase read hardening browser QA
```

Phase 17E added:

```text
docs/discovery-phase-17e-admin-shell-browser-supabase-read-hardening-browser-qa-result.md
```

Phase 17E documented:

```text
The Phase 17D passing evidence directory.
The Desktop / Tablet-iPad / Mobile results.
The GET /api/admin/tools browser usage.
The zero /rest/v1/tools browser requests.
The zero direct /rest/v1/* browser requests.
The zero admin mutation requests.
The absence of service-role markers in evidence.
The v1/v2 failed QA harness attempts and the passing v3 attempt.
The clean final repo status.
```

Phase 17E verification passed before commit:

```text
npm run check
git diff --check
```

Phase 17E did not implement code.

Phase 17E did not rerun browser QA.

Phase 17E did not run DB operations.

Phase 17E did not touch Candidate Staging Queue implementation files.

## Readiness Criteria

Phase 17F readiness criteria:

```text
Phase 17A design is complete.
Phase 17B implementation plan is complete.
Phase 17C implementation is complete.
Phase 17C implementation is pushed to main.
Phase 17D browser/network QA passed.
Phase 17E browser QA result documentation is complete.
The admin browser uses /api/admin/tools for the tested admin tools shell.
The admin browser does not directly request /rest/v1/tools for the tested admin tools shell.
The admin browser does not directly request /rest/v1/* for the tested admin tools shell.
The route uses existing admin security.
The route uses safe projection.
The route is read-only.
No service-role marker appeared in browser evidence.
No admin mutation request occurred during browser QA.
No Candidate Staging Queue files were modified.
The repo is clean and synced before Phase 17F starts.
```

## Readiness Criteria Result

Readiness criteria result:

```text
Passed
```

Detailed result:

```text
Phase 17A design: Passed
Phase 17B implementation plan: Passed
Phase 17C implementation: Passed
Phase 17C pushed to main: Passed
Phase 17D browser/network QA: Passed
Phase 17E browser QA result documentation: Passed
Admin browser uses /api/admin/tools: Passed
No direct /rest/v1/tools browser request: Passed
No direct /rest/v1/* browser request: Passed
Existing admin security boundary used: Passed
Safe projection used: Passed
GET handler read-only: Passed
No service-role marker in browser evidence: Passed
No admin mutation request during QA: Passed
Candidate Staging Queue boundary preserved: Passed
Repo clean and synced before Phase 17F: Passed
```

## Readiness Decision

Readiness decision:

```text
Admin Shell Browser Supabase Read Hardening milestone is complete.
```

The Phase 17 hardening milestone may be considered closed.

The browser/network evidence confirms the intended architectural boundary:

```text
Browser -> /api/admin/tools -> server-side admin security -> server-side Supabase read -> safe projected JSON
```

The previously observed direct browser Supabase tools read is no longer present for the tested admin tools shell path.

## Security Decision

Security decision:

```text
Approved as hardened for the tested admin tools browser read path.
```

This readiness gate does not claim that every future admin page has been audited.

This readiness gate confirms only the Phase 17 milestone scope:

```text
The admin-shell browser tools read for /admin/tools no longer directly uses Supabase REST and now goes through /api/admin/tools.
```

Any future admin page found to perform browser Supabase reads should be handled in a separate phase.

## Candidate Staging Queue Boundary

Candidate Staging Queue work remains separate from this milestone.

Phase 17 did not modify:

```text
app/api/admin/discovery/candidate-staging-queue/route.ts
components/admin/discovery/candidate-staging-queue-panel.tsx
components/admin/discovery/candidate-staging-queue-detail-drawer.tsx
lib/discovery/discovery-candidate-staging-queue-cursor.ts
lib/discovery/discovery-candidate-staging-queue-read-model.ts
testing/discovery-candidate-staging-queue-cursor.test.mjs
testing/discovery-candidate-staging-queue-read-model.test.mjs
testing/discovery-candidate-staging-queue-api-read-route.test.mjs
testing/discovery-candidate-staging-queue-admin-ui.test.mjs
testing/discovery-candidate-staging-queue-detail-drawer-ui.test.mjs
```

Candidate Staging Queue cursor pagination remains closed from the approved forward-only `created_at` / `updated_at` milestone.

confidence_bucket cursor continuation remains deferred unless separately approved.

## Phase 17F Boundary Confirmation

Phase 17F is documentation-only.

Phase 17F does not:

- implement code
- modify tests
- modify API routes
- modify backend helpers
- modify UI components
- modify Supabase migrations
- modify package files
- rerun browser QA
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

## Residual Notes

The browser QA used mocked admin API responses and a temporary local admin session cookie.

This was appropriate for the Phase 17D goal because the target was browser/network boundary behavior, not live database data validation.

No live database query was required to prove that the browser stopped using direct Supabase REST for the tested path.

No live database mutation was in scope.

The service-role boundary remains protected because the browser evidence contained no service-role marker and because server-side Supabase reads are isolated behind the admin API route.

## Recommended Next Phase

Recommended next phase:

```text
Phase 18A — Admin Shell Remaining Browser Supabase Read Audit Design
```

Suggested Phase 18A scope:

```text
Docs-only audit design for scanning the remaining admin shell for any other browser-side Supabase reads outside the completed /admin/tools hardening path.
```

Phase 18A should not assume issues exist.

Phase 18A should define a safe inspection process for identifying any remaining browser Supabase usage, prioritizing documentation and static checks before implementation.

Alternative next phase:

```text
Return to Candidate Staging Queue roadmap after the Phase 17 milestone closure.
```

## Conclusion

Phase 17F formally closes the Admin Shell Browser Supabase Read Hardening milestone.

The milestone achieved its intended goal:

```text
The tested admin tools browser shell no longer directly requests Supabase /rest/v1/tools and now uses /api/admin/tools.
```

The implementation is verified by static hardening tests, full project checks, browser/network QA across Desktop, Tablet/iPad, and Mobile, and result documentation.

The repo is ready to proceed to the next approved milestone.
