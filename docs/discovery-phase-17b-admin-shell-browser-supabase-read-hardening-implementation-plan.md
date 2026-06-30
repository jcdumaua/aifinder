# Discovery Phase 17B — Admin Shell Browser Supabase Read Hardening Implementation Plan

## Status

Phase 17B is a docs-only implementation plan with source inspection.

Current pushed baseline:

```text
70b3962 Document admin shell Supabase read hardening design
```

Phase 17B follows Phase 17A and plans future hardening for the unrelated admin-shell browser Supabase `GET /rest/v1/tools` behavior observed during Phase 16D browser QA.

Phase 17B does not implement hardening.

Phase 17B does not change source code, tests, API routes, backend helpers, UI components, migrations, or package files.

## Objective

Plan a future implementation that removes direct browser Supabase tools reads from the admin shell and routes those reads through a project-owned admin API boundary.

The target behavior is:

```text
Admin browser UI -> Admin API route -> server-side admin/session validation -> safe server-side read -> safe projection -> safe JSON response
```

## Source Inspection Summary

Source inspection timestamp:

```text
2026-06-30T15:51:58.004077+00:00
```

Source files scanned:

```text
204
```

Inspection looked for:

- admin client components
- Supabase usage in admin browser paths
- direct `.from("tools")` browser reads
- literal `/rest/v1/tools` source strings
- reusable admin API route candidates

## Exact Source Target Decision

Primary source target identified for future hardening:

```text
components/admin/admin-dashboard-client.tsx
```

Readiness note:

```text
Phase 17C can be planned against the identified primary target after Gemini review.
```

## Browser Supabase Tools Read Findings

### `components/admin/admin-dashboard-client.tsx`

- client component: `True`

```text
L11: import { supabase } from "../../lib/supabase";
L1586: const { data, error } = await supabase
L1587: .from("tools")
L2334: Download or delete archived logs. Files are stored privately in Supabase Storage.
```

## Admin Client Supabase Usage Findings

### `components/admin/admin-dashboard-client.tsx`

- client component: `True`

```text
L11: import { supabase } from "../../lib/supabase";
L833: return Array.from(
L839: return Array.from(
L1586: const { data, error } = await supabase
L1587: .from("tools")
L2334: Download or delete archived logs. Files are stored privately in Supabase Storage.
```

## Literal `/rest/v1/tools` Findings

```text
No literal `/rest/v1/tools` string was found in source. This is expected when Supabase client code constructs the REST request at runtime.
```

Interpretation:

```text
A literal /rest/v1/tools string may not appear in source because the Supabase browser client can construct the REST request at runtime.
```

## Admin API Route Candidates Inspected

### `app/api/admin/discovery/discovered-tools/route.ts`

- has GET handler: `True`
- has POST handler: `False`
- references Supabase: `True`

```text
L3: import { supabaseAdmin } from "../../../../../lib/supabase-admin";
L81: export async function GET(request: Request) {
L108: let query = supabaseAdmin
L109: .from("discovered_tools")
L110: .select(
L171: ? await supabaseAdmin
L172: .from("discovery_sources")
L173: .select("id, name, slug, source_type, is_active, last_run_at")
L186: ? await supabaseAdmin
L187: .from("discovery_runs")
L188: .select("id, source_id, status, stats, started_at, finished_at, created_at")
L201: ? await supabaseAdmin
L202: .from("discovery_duplicate_candidates")
L203: .select("discovered_tool_id, is_blocking")
```

### `app/api/admin/tools/route.ts`

- has GET handler: `False`
- has POST handler: `True`
- references Supabase: `True`

```text
L7: import { supabaseAdmin } from "../../../../lib/supabase-admin";
L49: function checkAdminRateLimit(request: Request) {
L73: function requireAdminSecurity(request: Request) {
L74: if (!checkAdminRateLimit(request)) {
L173: let query = supabaseAdmin
L174: .from("tools")
L175: .select("id, website")
L197: let query = supabaseAdmin
L198: .from("tools")
L199: .select("id, slug")
L217: export async function POST(request: Request) {
L219: const securityError = requireAdminSecurity(request);
L248: const { error } = await supabaseAdmin.from("tools").insert([
L300: const securityError = requireAdminSecurity(request);
L333: const { data, error } = await supabaseAdmin
L334: .from("tools")
L345: .select("id")
L387: const securityError = requireAdminSecurity(request);
L396: const { data, error } = await supabaseAdmin
L397: .from("tools")
L404: .select("id, name, website")
```

Route reuse recommendation:

```text
Prefer reusing `app/api/admin/tools/route.ts` if source inspection confirms it already provides the safe admin tools read shape needed by the admin shell.
```

## Future Implementation Scope

Future Phase 17C should modify only the minimum files needed to move the identified admin-shell tools read behind an admin API boundary.

Expected future file categories:

- the identified admin client component that currently reads tools through browser Supabase
- an existing admin API route if it can be safely reused
- a server-side helper only if route reuse needs a safe projection helper
- targeted static tests
- targeted route tests if a route is changed
- targeted browser QA script in a later phase, not Phase 17C

Candidate Staging Queue files must remain out of scope.

## Files That Must Remain Out of Scope

Future implementation should not modify:

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

Reason:

```text
Candidate Staging Queue cursor pagination is complete for the approved forward-only created_at / updated_at milestone.
```

## Preferred Admin API Boundary

Future implementation should use a project-owned admin API route.

Preferred route strategy:

1. Inspect whether `app/api/admin/tools/route.ts` already supports a safe `GET` response for the admin shell.
2. If it does, reuse it.
3. If it does not, update it minimally only if that is safer than adding a new route.
4. Add a new route only if reuse would create broader risk.

The route must:

- require admin authentication
- remain read-only for this hardening phase
- return a safe projection
- map failures to safe errors
- avoid raw database errors
- avoid stack traces
- avoid service-role exposure in browser code

## Browser-Side Implementation Plan

Future browser-side implementation should:

- remove direct admin-shell Supabase reads for tools data
- remove browser `.from("tools")` use from the identified admin-shell path
- call the selected admin API route with `fetch`
- preserve `cache: "no-store"` for admin data
- preserve loading states
- preserve empty states
- preserve safe error states
- preserve existing admin shell UX where possible
- avoid rendering raw database errors
- avoid rendering secrets
- avoid introducing mutation controls
- avoid modifying Candidate Staging Queue components

## Server-Side Implementation Plan

Future server-side implementation should:

- reuse existing admin authentication/session validation
- use a safe projection for tools data
- return only fields the admin shell needs
- avoid broad sensitive-field exposure
- avoid unsafe raw SQL interpolation
- map Supabase failures to safe API errors
- keep mutation methods out of scope
- avoid changing public routes

## Safe Projection Plan

Phase 17C should inspect the identified UI and document the exact fields needed before implementation.

Initial safe projection requirements:

- include only fields rendered by the admin shell
- exclude secrets
- exclude service-role configuration
- exclude unrelated internal-only metadata unless clearly required
- keep response field names stable for the client
- do not return raw Supabase client config

## Static Test Plan

Future Phase 17C should add or update static tests to assert:

- the identified admin-shell path no longer uses browser Supabase for tools reads
- no `.from("tools")` browser read remains in that path
- no direct `/rest/v1/tools` browser dependency remains
- no service-role marker appears in client components
- no mutation method is introduced
- Candidate Staging Queue files are not modified
- the selected admin API route path is used by the admin shell

Recommended test file:

```text
testing/admin-shell-supabase-read-hardening.test.mjs
```

## Route Test Plan

If an admin API route is modified or reused for this hardening work, tests should verify:

- unauthenticated request is rejected
- authenticated admin request succeeds
- safe projection is returned
- raw database errors are mapped safely
- unsupported methods are rejected or absent
- no mutation behavior is introduced
- response shape supports the admin shell

Potential test files to inspect/reuse:

```text
testing/admin-tools*.test.mjs
testing/discovery-admin-tools*.test.mjs
testing/admin-shell*.test.mjs
```

If no matching route test exists, Phase 17C may add a focused route test.

## UI Test Plan

Future UI/static tests should verify:

- admin shell uses admin API route instead of Supabase REST
- loading state still exists
- empty state still exists
- safe error state still exists
- no raw database error is rendered
- no service-role marker appears
- no mutation labels appear
- no Candidate Staging Queue regressions are introduced

## Browser QA Plan

Browser QA must remain a separate later phase.

Recommended future Phase 17D checks:

- admin shell loads successfully
- browser no longer directly requests `/rest/v1/tools`
- browser requests the selected admin API route instead
- no service-role exposure in network logs
- no mutation requests are made
- no Candidate Staging Queue regression
- Desktop smoke check
- Tablet/iPad smoke check if applicable
- Mobile smoke check if applicable
- final git status remains clean after QA

## Implementation Sequence for Future Phase 17C

Recommended order:

1. Reconfirm clean `main` branch and expected HEAD.
2. Inspect the identified source target again.
3. Inspect reusable admin API route behavior.
4. Decide route reuse versus minimal route update.
5. Add or update route/helper tests first if route behavior changes.
6. Replace browser Supabase tools read with admin API `fetch`.
7. Preserve loading/empty/error UI behavior.
8. Add static test proving direct browser Supabase tools read is removed.
9. Run targeted route/UI/static tests.
10. Run `npm run check`.
11. Run `git diff --check`.
12. Stop for Gemini review before commit.

## Expected Verification Commands for Future Phase 17C

Future implementation should run:

```text
node testing/admin-shell-supabase-read-hardening.test.mjs
npm run check
git diff --check
git status --short
git status --branch --short
```

Also run any route/admin tests that are added or modified.

## Safety Boundary for Future Implementation

Future implementation must not add:

- candidate approval
- candidate publishing
- candidate promotion
- candidate rejection
- candidate archiving
- candidate deletion
- writes to `public.tools`
- writes to `discovered_tools`
- crawler execution
- candidate extraction execution
- live database mutations
- direct browser Supabase tools reads
- service-role exposure in browser code
- raw database error rendering

## Phase 17B Boundary Confirmation

Phase 17B is documentation-only and planning-only.

Phase 17B performed source inspection but does not modify implementation files.

Phase 17B does not:

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

Phase 17B approves a future implementation plan only after source inspection.

Current decision:

```text
Proceed to Phase 17C only after Gemini confirms the identified target and route strategy are safe.
```

## Recommended Next Phase

Recommended next phase:

```text
Phase 17C — Admin Shell Browser Supabase Read Hardening Implementation
```

Phase 17C should implement the minimum safe route/API-boundary migration identified by Phase 17B and must stop before commit for Gemini review.

## Conclusion

Phase 17B plans a bounded hardening implementation for the unrelated admin-shell browser Supabase tools read behavior.

The plan keeps Candidate Staging Queue files out of scope, prefers an admin API boundary, requires static proof that direct browser Supabase tools reads are removed, and requires future browser QA to verify that `/rest/v1/tools` is no longer directly requested by the browser.
