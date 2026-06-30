# Discovery Phase 17E — Admin Shell Browser Supabase Read Hardening Browser QA Result Documentation

## Status

Phase 17E is a docs-only browser QA result documentation phase.

Current pushed baseline:

```text
8e9914d Harden admin shell tools read boundary
```

Phase 17E documents the completed Phase 17D browser/network QA for the admin-shell browser Supabase read hardening implementation.

Phase 17E does not implement code.

Phase 17E does not run browser QA.

Phase 17E does not change source code, tests, API routes, backend helpers, UI components, migrations, or package files.

## Phase 17D Result

Final Phase 17D result:

```text
Passed
```

Final repository status after Phase 17D browser QA:

```text
## main...origin/main
Working tree clean
```

No commit or push was performed during Phase 17D.

## Evidence Directory

Phase 17D passing evidence directory:

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

## QA Environment

Phase 17D used a temporary local Next dev server.

Server command shape:

```text
./node_modules/.bin/next dev -H 127.0.0.1 -p <ephemeral-port>
```

Passing run base URL:

```text
http://127.0.0.1:56127
```

The QA runner used a temporary valid admin session cookie generated from local `ADMIN_SESSION_SECRET`.

The secret value was not printed.

The browser QA mocked safe admin API responses and blocked direct browser Supabase REST reads.

## Browser QA Target

Target page:

```text
/admin/tools
```

Expected network hardening behavior:

```text
Browser uses GET /api/admin/tools.
Browser does not directly request /rest/v1/tools.
Browser does not directly request any /rest/v1/* Supabase path.
Browser sends no admin mutation requests.
Browser evidence contains no service-role marker.
```

## Desktop Result

Viewport:

```text
1440x1000
```

Final URL:

```text
http://127.0.0.1:56127/admin/tools
```

Assertions:

```text
adminToolsPageReached: true
noAdminLoginRedirect: true
adminToolsApiUsed: true
adminToolsApiGetOnly: true
noDirectToolsRestRequest: true
noDirectSupabaseRestRequest: true
noAdminMutationRequests: true
noServiceRoleLeakInEvidence: true
```

Request counts:

```text
totalRequests: 30
apiToolsRequests: 1
loginRedirectRequests: 0
directToolsRestRequests: 0
directSupabaseRestRequests: 0
adminMutationRequests: 0
consoleMessages: 2
```

Screenshot:

```text
desktop-admin-tools.png
```

Network log:

```text
desktop-network-log.json
```

## Tablet / iPad Result

Viewport:

```text
820x1180
```

Final URL:

```text
http://127.0.0.1:56127/admin/tools
```

Assertions:

```text
adminToolsPageReached: true
noAdminLoginRedirect: true
adminToolsApiUsed: true
adminToolsApiGetOnly: true
noDirectToolsRestRequest: true
noDirectSupabaseRestRequest: true
noAdminMutationRequests: true
noServiceRoleLeakInEvidence: true
```

Request counts:

```text
totalRequests: 30
apiToolsRequests: 1
loginRedirectRequests: 0
directToolsRestRequests: 0
directSupabaseRestRequests: 0
adminMutationRequests: 0
consoleMessages: 2
```

Screenshot:

```text
tablet-admin-tools.png
```

Network log:

```text
tablet-network-log.json
```

## Mobile Result

Viewport:

```text
390x844
```

Final URL:

```text
http://127.0.0.1:56127/admin/tools
```

Assertions:

```text
adminToolsPageReached: true
noAdminLoginRedirect: true
adminToolsApiUsed: true
adminToolsApiGetOnly: true
noDirectToolsRestRequest: true
noDirectSupabaseRestRequest: true
noAdminMutationRequests: true
noServiceRoleLeakInEvidence: true
```

Request counts:

```text
totalRequests: 30
apiToolsRequests: 1
loginRedirectRequests: 0
directToolsRestRequests: 0
directSupabaseRestRequests: 0
adminMutationRequests: 0
consoleMessages: 2
```

Screenshot:

```text
mobile-admin-tools.png
```

Network log:

```text
mobile-network-log.json
```

## Network Hardening Confirmation

Phase 17D confirmed:

```text
GET /api/admin/tools was used by the admin shell.
```

Phase 17D confirmed:

```text
/rest/v1/tools was not requested directly by the browser.
```

Phase 17D confirmed:

```text
No direct /rest/v1/* Supabase browser request occurred.
```

Phase 17D confirmed:

```text
No admin mutation request occurred.
```

Phase 17D confirmed:

```text
No service-role marker appeared in browser QA evidence.
```

## Admin Login / Session Confirmation

Phase 17D v3 reached the admin tools page without redirecting to `/admin-login`.

All three viewports reported:

```text
noAdminLoginRedirect: true
```

The temporary session cookie was created only for local QA.

The session secret was loaded from local environment configuration and was not printed.

## Failed Attempt Notes

Phase 17D had two non-product failures before the passing v3 run.

### v1 Attempt

The first QA attempt failed before browser assertions.

Failure reason:

```text
The temporary Playwright runner was written under /tmp, so Node could not resolve @playwright/test from the project node_modules.
```

Resolution:

```text
The v2 runner placed the temporary Playwright file under node_modules/.cache/aifinder-phase-17d.
```

### v2 Attempt

The second QA attempt reached the browser but redirected to `/admin-login`.

Failure reason:

```text
The server-side admin guard did not receive a valid admin session cookie.
```

Resolution:

```text
The v3 runner generated a temporary valid admin session cookie from ADMIN_SESSION_SECRET without printing the secret.
```

### v3 Attempt

The third QA attempt passed.

Passing evidence directory:

```text
/tmp/aifinder-phase-17d-admin-shell-supabase-read-hardening-browser-qa/2026-06-30T16-41-12-576267Z
```

## Candidate Staging Queue Boundary

Phase 17D did not modify or exercise Candidate Staging Queue implementation files.

Candidate Staging Queue cursor pagination remains closed from the approved forward-only `created_at` / `updated_at` milestone.

Files intentionally out of scope:

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

## Phase 17D Scope Confirmation

Phase 17D was browser/network QA only.

Phase 17D did not:

- change source code
- change tests
- change API routes
- change backend helpers
- change UI components
- change Supabase migrations
- change package files
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
- commit
- push

## Phase 17E Boundary Confirmation

Phase 17E is documentation-only.

Phase 17E does not:

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

## Readiness Decision

Phase 17D browser/network QA passed.

Readiness decision:

```text
Admin Shell Browser Supabase Read Hardening passed browser/network QA.
```

The Phase 17C hardening implementation is verified at the browser layer:

```text
Browser no longer directly requests Supabase /rest/v1/tools.
Browser now uses /api/admin/tools.
```

## Recommended Next Phase

Recommended next phase:

```text
Phase 17F — Admin Shell Browser Supabase Read Hardening Readiness Gate
```

Phase 17F should review Phase 17A through Phase 17E and determine whether the admin-shell browser Supabase read hardening milestone is complete.

## Conclusion

Phase 17E documents the successful Phase 17D browser QA result.

The browser QA confirms that the admin shell now uses the project-owned `/api/admin/tools` API boundary and no longer directly requests Supabase `/rest/v1/tools` or any `/rest/v1/*` browser path for the tested admin tools page.

The repo remained clean, and no mutation or service-role exposure was observed.
