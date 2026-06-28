# Discovery Phase 10T — Candidate Extraction Invocation Route Result Review / Admin UI Wiring Readiness Gate

## 1. Title and Phase Summary

Phase 10T is a docs-only readiness gate after the successful live dry-run verification of the Candidate Extraction Invocation admin API route.

This phase reviews the Phase 10R/10S result and defines what must be true before any admin UI wiring is planned.

This phase does not implement UI, modify source code, modify tests, change API routes, change packages, run database commands, rerun live verification, run live smoke, or add production wiring.

## 2. Current State Recap

Current completed foundation:

- Phase 10O implemented the dry-run-only internal invocation helper.
- Phase 10P designed the secure admin API route boundary.
- Phase 10Q implemented the admin API route.
- Phase 10R planned the live verification gate.
- Phase 10R live dry-run verification was explicitly approved by James with:

```text
Approve run Phase 10R live dry-run route verification
```

- Phase 10S documented the successful live dry-run route result.
- Latest pushed commit is:

```text
faa1eb5 Document extraction invocation route live verification result
```

Current system boundary:

- The invocation helper is dry-run-only.
- The admin API route is admin-only.
- The route requires admin session verification, CSRF verification, and rate limiting.
- The route rejects client-supplied `invoked_by_admin_user_id`.
- The route derives admin identity server-side.
- `dry_run: false` remains blocked.
- No admin UI wiring exists yet.
- No crawler, LLM, live executor, background job, or scheduled job wiring exists yet.
- No production staging writes are enabled.

## 3. Verified Route Result Summary

The verified route was:

```text
POST /api/admin/discovery/candidate-extraction/invoke
```

Phase 10R/10S result summary:

- Result: passed.
- One authenticated dry-run request reached the route.
- CSRF verification worked.
- Admin session boundary worked.
- Rate limiting did not block the single approved request.
- Route returned `accepted: true`.
- Route returned `rejected: false`.
- Route confirmed `noPublicWriteConfirmed: true`.
- Route confirmed `noDiscoveredWriteConfirmed: true`.
- Route returned `candidatesStagedCount: 0`.
- No client-supplied admin identity was included or returned.
- No raw payload leaked.
- No raw HTML leaked.
- No secret leaked.
- No stack trace leaked.
- No service-role detail leaked.
- No environment value leaked.
- No DB credential leaked.
- No DB writes occurred.

## 4. Readiness Decision

The system is ready to begin planning admin UI wiring for a dry-run-only manual invocation control.

The system is not ready for:

- live production staging writes;
- automatic approval;
- public publishing;
- crawler automation;
- LLM automation;
- scheduled execution;
- background execution;
- autonomous discovery execution.

Any future UI work must preserve the dry-run-only, admin-only, manual-trigger boundary until a later approved phase explicitly changes scope.

## 5. Recommended Admin UI Wiring Scope

Future UI planning should be limited to:

- admin-only surface;
- manual trigger only;
- dry-run-only request mode;
- single-run or single-source scope;
- admin confirmation before request;
- safe response summary display only;
- clear “dry run only / no production writes” messaging;
- no raw extracted payload display;
- no raw HTML display;
- no secrets or service-role detail display;
- no candidate approval flow;
- no publishing flow;
- no crawler automation trigger;
- no LLM automation trigger.

The UI should make it difficult to confuse this dry-run invocation with a production staging or publishing action.

## 6. Suggested UI Placement Options

### Option A — Existing Discovery Runs admin detail/review area

Add a small action panel near a future or existing Discovery Runs detail/review context.

Safety:

- Strong source/run context if the page already has exact run/source IDs.
- Lower risk of broad or ambiguous invocation scope.
- Easier to disable the action when required IDs are missing.

Usability:

- Admins can dry-run invocation while reviewing a specific run.
- Less navigation overhead.

Complexity:

- Requires existing page context to expose run/source identifiers safely.
- Requires careful copy to avoid implying production writes.

Risk:

- If placed near future approval/publishing controls, admins may confuse dry-run with publish. Strong UI labeling is required.

### Option B — Separate “Candidate Extraction Invocation” admin utility panel

Create a dedicated admin utility panel for the dry-run invocation.

Safety:

- Keeps the action isolated from review/publishing flows.
- Can make dry-run-only boundaries explicit.

Usability:

- More deliberate workflow.
- Admins may need to copy/select source and run IDs.

Complexity:

- Requires a new utility surface and validation UI.
- May duplicate context that already exists in Discovery Runs views.

Risk:

- Manual ID entry can increase input errors unless IDs are selected from trusted admin data.

### Option C — Defer UI entirely

Keep the route developer/operator-only for now.

Safety:

- Lowest UI risk.
- Avoids accidental admin misuse before a clear workflow exists.

Usability:

- No admin-facing control.
- Route remains harder to use operationally.

Complexity:

- No UI implementation complexity.

Risk:

- Useful dry-run capability stays inaccessible to non-developer admins.

### Recommendation

The safest first UI planning direction is Option A if there is or will be a Discovery Runs admin detail/review area with trusted exact source/run context.

Rationale:

- The route requires exact `discovery_source_id` and `discovery_run_id`.
- A run-scoped admin page can supply those IDs without client-side manual entry.
- The dry-run action can be disabled until exact context exists.
- The action can remain small, explicit, and non-publishing.

If exact run/source context is not available in the current admin UI, defer implementation and plan Option B as a dedicated admin utility panel with trusted selectors rather than free-form ID entry.

## 7. Future UI Request Contract

The future UI would collect or supply:

- `discovery_source_id`;
- `discovery_run_id`;
- `audit_correlation_id`;
- `invocation_reason`;
- `dry_run: true`;
- `max_candidates`;
- `source_scope`;
- `schema_version`.

Strict UI request rules:

- UI must not collect `invoked_by_admin_user_id`.
- UI must not send `invoked_by_admin_user_id`.
- Server derives admin identity.
- UI must not allow `dry_run: false`.
- UI must not allow unbounded `max_candidates`.
- UI should avoid free-form source/run IDs when trusted contextual IDs or selectors are available.
- UI must not send raw payloads, raw HTML, prompt/model output, secrets, service-role details, or DB credentials.

## 8. Future UI Response Display Requirements

The UI may display only safe summary fields:

- accepted/rejected;
- candidates staged count;
- candidates skipped count;
- validation failures;
- duplicate/eligibility rejections;
- audit correlation ID;
- safety flags;
- no public write confirmation;
- no discovered write confirmation;
- error summary.

The UI must not display:

- raw payloads;
- raw HTML;
- secrets;
- service-role details;
- stack traces;
- environment values;
- DB credentials;
- raw unexpected server errors;
- full request headers;
- cookies;
- CSRF tokens;
- session values.

## 9. User Experience Requirements

Future UI planning should include:

- clear dry-run badge;
- explicit confirmation dialog before trigger;
- loading state;
- success state;
- rejected/failed state;
- copy-safe summary;
- warning that no production writes occurred;
- warning that `dry_run: false` is not available;
- clear max-candidate bound display;
- desktop, tablet, and mobile responsive consideration;
- accessible button labels;
- accessible status messages;
- accessible error announcements.

The dry-run control should communicate that it validates the invocation boundary and returns a safe summary, not that it stages or publishes tools.

## 10. Security Requirements for Future UI Implementation

Future UI implementation must require:

- admin-only page or section;
- existing admin session protections;
- existing CSRF pattern;
- existing rate-limited API route;
- no client-supplied admin identity;
- no secrets in client bundle;
- no service-role data in client bundle;
- no raw payload logs;
- safe error handling;
- no automatic retries that could spam the endpoint;
- no hidden path to `dry_run: false`;
- no browser-side generation of privileged credentials.

Any future audit writes must be designed and reviewed separately before implementation.

## 11. Testing Plan for Future UI Implementation

Future UI implementation should include tests for:

- admin-only access;
- button disabled without required source/run IDs;
- confirmation required before trigger;
- CSRF included correctly;
- dry-run request accepted;
- `dry_run: false` impossible from UI;
- client admin identity never sent;
- safe success summary rendered;
- safe error summary rendered;
- raw payload not rendered;
- raw HTML not rendered;
- secrets not rendered;
- route rate-limit response displayed safely;
- desktop/tablet/mobile smoke;
- accessibility smoke for controls, status messages, and errors.

Additional implementation checks should confirm that the UI does not import service-role clients, does not expose environment values, and does not add crawler or LLM triggers.

## 12. Rollout Gates Before Any UI Implementation

Before any UI implementation:

- Gemini must review this Phase 10T readiness gate.
- James must approve the next phase.
- Codex must produce a UI wiring implementation plan.
- Gemini must review the UI wiring plan.
- No implementation may occur without a separate approval.
- No live smoke may run without explicit approval.
- No production staging writes may be enabled.
- No public publishing may be added.
- No crawler automation may be added.
- No LLM automation may be added.
- No background or scheduled jobs may be added.

## 13. Non-Goals

Phase 10T explicitly forbids:

- UI implementation;
- admin dashboard changes;
- source code changes;
- test changes;
- API route changes;
- package changes;
- migrations;
- Supabase type regeneration;
- live verification rerun;
- live smoke;
- database commands;
- remote SQL;
- `supabase db push`;
- candidate row creation;
- discovery source row creation;
- discovery run row creation;
- `public.tools` writes;
- `discovered_tools` writes;
- audit event writes;
- production wiring;
- crawler automation;
- LLM automation;
- background jobs;
- scheduled jobs;
- enabling `dry_run: false`.

## 14. Recommended Next Phase

Recommended next phase:

```text
Phase 10U — Candidate Extraction Admin UI Dry-Run Invocation Wiring Plan
```

Phase 10U should be docs-only implementation planning before any UI code changes.
