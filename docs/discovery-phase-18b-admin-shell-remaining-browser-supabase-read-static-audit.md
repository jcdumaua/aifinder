# Discovery Phase 18B — Admin Shell Remaining Browser Supabase Read Static Audit

## Status

Phase 18B is a docs-only static audit and classification phase.

Current pushed baseline:

```text
7299c80 Document remaining admin shell Supabase read audit design
```

Phase 18B follows the Phase 18A audit design.

Phase 18B does not implement code.

Phase 18B does not modify tests, API routes, backend helpers, UI components, migrations, package files, or source files.

Phase 18B does not run browser QA.

Phase 18B does not run live database queries.

Phase 18B does not run database mutations.

## Discovery Engine Progress Snapshot

Progress after Phase 18B static audit:

```text
Discovery Engine overall: ~81%
Phase 18B progress: 100%
Current milestone: Phase 18B static audit complete
```

Current major milestone status:

```text
Candidate Staging Queue read-only API/UI/detail/cursor milestone: closed for created_at and updated_at.
Admin shell /admin/tools Supabase read hardening: complete and closed.
Remaining admin shell browser Supabase read audit: Passed.
```

## Phase 18B Objective

Phase 18B classifies the admin-shell browser Supabase signals identified by Phase 18A.

Primary audit question:

```text
Do any remaining admin browser surfaces directly import the browser Supabase client, call supabase.from(...), request /rest/v1/* directly, or expose service-role markers?
```

Secondary audit question:

```text
Are the Phase 18A candidates true browser risks, or are they safe/server/test/text false positives?
```

## Static Audit Method

The Phase 18B static audit scanned local source files only.

It inspected:

```text
app/admin
components/admin
app/api/admin
```

It classified:

```text
browser Supabase imports from lib/supabase
direct supabase.from(...) calls
generic .from(...) calls
/rest/v1 literals
service-role markers
admin API/server route Supabase usage
Phase 17 completed hardened baseline files
```

The static audit did not execute app code.

The static audit did not query Supabase.

The static audit did not mutate data.

The static audit did not change source files.

## Static Audit Summary

Source scan summary:

```text
Total Supabase/admin candidates: 87
Admin browser surfaces scanned: 36
Admin browser candidates classified: 5
Admin API/server route candidates observed: 27
Confirmed admin browser Supabase risks: 0
Cleared admin browser candidates: 5
Phase 17 hardened baseline candidates: 1
Text-only Supabase references cleared: 2
Generic .from(...) false positives cleared: 2
```

Audit result:

```text
Passed
```

## Admin Browser Classification Result

| Path | Classification | Risk | Browser Supabase import | supabase.from(...) | Any .from(...) | /rest/v1 literal | Service-role marker | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `components/admin/admin-dashboard-client.tsx` | `CLEARED_PHASE17_HARDENED_BASELINE` | none | no | no | yes | no | no | Phase 17 hardened this browser surface; it uses /api/admin/tools and no longer imports the browser Supabase client or calls supabase.from(...). |
| `components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx` | `CLEARED_GENERIC_DOT_FROM_FALSE_POSITIVE` | none | no | no | yes | no | no | Admin browser surface has a generic .from(...) call but no Supabase identifier/import/direct REST signal. |
| `components/admin/discovery/discovery-candidate-extraction-dry-run-utils.ts` | `CLEARED_TEXT_ONLY_SUPABASE_REFERENCE` | none | no | no | no | no | no | Admin browser surface mentions Supabase textually but has no browser Supabase import, no supabase.from(...), no /rest/v1 literal, and no service-role marker. |
| `components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts` | `CLEARED_TEXT_ONLY_SUPABASE_REFERENCE` | none | no | no | no | no | no | Admin browser surface mentions Supabase textually but has no browser Supabase import, no supabase.from(...), no /rest/v1 literal, and no service-role marker. |
| `components/admin/homepage-control-publish-button.tsx` | `CLEARED_GENERIC_DOT_FROM_FALSE_POSITIVE` | none | no | no | yes | no | no | Admin browser surface has a generic .from(...) call but no Supabase identifier/import/direct REST signal. |

## Admin Browser Evidence Snippets

### `components/admin/admin-dashboard-client.tsx`

Classification:

```text
CLEARED_PHASE17_HARDENED_BASELINE
```

Risk:

```text
none
```

Evidence snippets:

```text
L832: return Array.from(
L838: return Array.from(
L1585: const response = await fetch("/api/admin/tools", {
L1967: const response = await fetch("/api/admin/tools", {
L2047: const response = await fetch("/api/admin/tools", {
L2098: const response = await fetch("/api/admin/tools", {
L2345: Download or delete archived logs. Files are stored privately in Supabase Storage.
```

### `components/admin/discovery/discovery-candidate-extraction-dry-run-panel.tsx`

Classification:

```text
CLEARED_GENERIC_DOT_FROM_FALSE_POSITIVE
```

Risk:

```text
none
```

Evidence snippets:

```text
L49: const hex = Array.from(bytes, (byte) =>
```

### `components/admin/discovery/discovery-candidate-extraction-dry-run-utils.ts`

Classification:

```text
CLEARED_TEXT_ONLY_SUPABASE_REFERENCE
```

Risk:

```text
none
```

Evidence snippets:

```text
L46: /<|>|raw[_-]?payload|html|script|secret|token|password|service[_-]?role|stack|credential|cookie|csrf|supabase/i;
```

### `components/admin/discovery/discovery-candidate-extraction-live-staging-utils.ts`

Classification:

```text
CLEARED_TEXT_ONLY_SUPABASE_REFERENCE
```

Risk:

```text
none
```

Evidence snippets:

```text
L97: /<|>|raw[_-]?payload|html|script|secret|token|password|service[_-]?role|stack|credential|cookie|csrf|supabase/i;
```

### `components/admin/homepage-control-publish-button.tsx`

Classification:

```text
CLEARED_GENERIC_DOT_FROM_FALSE_POSITIVE
```

Risk:

```text
none
```

Evidence snippets:

```text
L75: return [...errors, ...Array.from(guidance)];
```


## Admin API / Server Route Observations

Server-side admin API route Supabase usage is not automatically a risk.

The desired hardened architecture is:

```text
Admin browser UI -> project-owned admin API route -> requireAdminSecurity(request) -> server-side Supabase query -> explicit safe projection -> JSON response
```

Observed admin API/server route candidates:

| Path | Supabase identifier | supabase.from(...) | Any .from(...) | /rest/v1 literal | Service-role marker | Static classification |
| --- | --- | --- | --- | --- | --- | --- |
| `app/api/admin/audit-logs/route.ts` | yes | no | yes | no | no | server-side route candidate; valid only if behind admin security |
| `app/api/admin/csrf/route.ts` | no | no | no | no | no | server route, no direct Supabase DB signal |
| `app/api/admin/discovery/candidate-extraction/invoke/route.ts` | no | no | no | no | no | server route, no direct Supabase DB signal |
| `app/api/admin/discovery/candidate-staging-queue/route.ts` | yes | no | no | no | no | server route, no direct Supabase DB signal |
| `app/api/admin/discovery/discovered-tools/[id]/approve/route.ts` | yes | no | no | no | no | server route, no direct Supabase DB signal |
| `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts` | yes | no | yes | no | no | server-side route candidate; valid only if behind admin security |
| `app/api/admin/discovery/discovered-tools/[id]/route.ts` | yes | no | yes | no | no | server-side route candidate; valid only if behind admin security |
| `app/api/admin/discovery/discovered-tools/bulk-status/route.ts` | yes | no | yes | no | no | server-side route candidate; valid only if behind admin security |
| `app/api/admin/discovery/discovered-tools/route.ts` | yes | no | yes | no | no | server-side route candidate; valid only if behind admin security |
| `app/api/admin/discovery/intake/route.ts` | yes | no | yes | no | no | server-side route candidate; valid only if behind admin security |
| `app/api/admin/discovery/runs/[id]/candidate-preview/route.ts` | no | no | no | no | no | server route, no direct Supabase DB signal |
| `app/api/admin/discovery/runs/manual/claim/route.ts` | yes | no | yes | no | no | server-side route candidate; valid only if behind admin security |
| `app/api/admin/discovery/runs/manual/route.ts` | yes | no | yes | no | no | server-side route candidate; valid only if behind admin security |
| `app/api/admin/discovery/runs/route.ts` | yes | no | yes | no | no | server-side route candidate; valid only if behind admin security |
| `app/api/admin/discovery/sources/[id]/route.ts` | yes | no | yes | no | no | server-side route candidate; valid only if behind admin security |
| `app/api/admin/discovery/sources/route.ts` | yes | no | yes | no | no | server-side route candidate; valid only if behind admin security |
| `app/api/admin/homepage-control/drafts/[id]/mark-preview/route.ts` | no | no | no | no | no | server route, no direct Supabase DB signal |
| `app/api/admin/homepage-control/drafts/[id]/preview-checklist/route.ts` | no | no | no | no | no | server route, no direct Supabase DB signal |
| `app/api/admin/homepage-control/drafts/[id]/publish/route.ts` | no | no | no | no | no | server route, no direct Supabase DB signal |
| `app/api/admin/homepage-control/drafts/[id]/route.ts` | no | no | no | no | no | server route, no direct Supabase DB signal |
| `app/api/admin/homepage-control/drafts/route.ts` | no | no | no | no | no | server route, no direct Supabase DB signal |
| `app/api/admin/login/route.ts` | no | no | yes | no | no | server-side route candidate; valid only if behind admin security |
| `app/api/admin/logout/route.ts` | no | no | no | no | no | server route, no direct Supabase DB signal |
| `app/api/admin/session/route.ts` | no | no | no | no | no | server route, no direct Supabase DB signal |
| `app/api/admin/submissions/route.ts` | yes | no | yes | no | no | server-side route candidate; valid only if behind admin security |
| `app/api/admin/tools/route.ts` | yes | no | yes | no | no | server-side route candidate; valid only if behind admin security |
| `app/api/admin/upload-logo/route.ts` | yes | no | yes | no | no | server-side route candidate; valid only if behind admin security |

Server route follow-up should only be required if a route lacks required admin security, performs unsafe projection, or leaks server-only markers into browser payloads.

Phase 18B did not perform route-level security review for every server route.

Phase 18B only separates browser-risk candidates from server-route candidates.

## Confirmed Browser Risk Decision

Confirmed admin browser Supabase risk count:

```text
0
```

Confirmed risk candidates:

```text
None
```

Readiness decision:

```text
No remaining admin browser Supabase read risk was confirmed by static audit.
```

## Phase 17 Baseline Preservation

Phase 17 remains closed.

The completed `/admin/tools` hardening baseline remains:

```text
No direct browser Supabase /rest/v1/tools read for the admin tools shell.
Browser uses GET /api/admin/tools.
```

Phase 18B did not reopen or modify that path.

## Candidate Staging Queue Boundary

Phase 18B does not change Candidate Staging Queue work.

Candidate Staging Queue milestone status remains:

```text
Read-only API/UI/detail/cursor pagination milestone closed for created_at and updated_at.
confidence_bucket cursor continuation remains deferred unless separately approved.
```

Files intentionally out of implementation scope:

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

## Phase 18B Boundary Confirmation

Phase 18B is documentation/static-audit only.

Phase 18B does not:

- implement code
- modify tests
- modify API routes
- modify backend helpers
- modify UI components
- modify Supabase migrations
- modify package files
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

## Recommended Next Phase

Recommended next phase:

```text
Phase 18C — Admin Shell Remaining Browser Supabase Read Audit Readiness Gate
```

Recommended scope:

```text
Docs-only readiness gate to close Phase 18 if Gemini agrees no implementation is required.
```

## Conclusion

Phase 18B completed the static audit classification requested by Phase 18A.

Audit result:

```text
Passed
```

Confirmed admin browser Supabase risks:

```text
0
```

The completed Phase 17 `/admin/tools` hardening remains closed.

The repo is ready for Gemini review before commit.
