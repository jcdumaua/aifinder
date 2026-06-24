# Phase 7P — Bounded HTML Acquisition Adapter Implementation Plan

## 1. Purpose

Phase 7P is a docs-only implementation plan for a future bounded in-memory HTML acquisition adapter.

It does not implement the adapter, modify the executor, or wire anything into the manual metadata-fetch path. It defines the smallest future implementation required to provide an immediately consumable, bounded HTML string to the existing static HTML evidence helper without persisting raw content.

## 2. Relationship to Phase 7M / 7N / 7O

- Phase 7M added the isolated static HTML evidence helper and helper-level tests. The helper accepts HTML as a string and has no network, database, executor, or UI behavior.
- Phase 7N found that the current metadata-only fetch adapter deliberately discards response chunks, so it cannot supply HTML to the helper. Its readiness decision was Ready with conditions.
- Phase 7O defined the bounded in-memory acquisition contract and recommended a new standalone adapter instead of changing the metadata-only adapter.

Phase 7P translates that design into a future implementation slice. It does not authorize implementation.

## 3. Future Implementation Objective

A future approved implementation should add a standalone bounded HTML acquisition adapter that:

- Reuses existing URL, DNS, IP, TLS, timeout, redirect, and response-size safety principles.
- Fetches static HTML only into bounded process memory.
- Returns HTML only to the immediate caller on success.
- Returns no HTML on failure.
- Does not modify the existing metadata-only adapter.
- Does not persist, log, print, audit, or otherwise store raw HTML.
- Is suitable for later use immediately before deriveStaticHtmlEvidence.
- Does not create candidates, write discovery/public tools, rank, recommend, approve, or publish anything.

## 4. Proposed Future Files

Possible future new files:

- lib/discovery-fetch-html-adapter.ts
- testing/discovery-fetch-html-adapter.test.mjs

Possible future modified files only after a separate approved wiring phase:

- app/api/admin/discovery/runs/manual/claim/route.ts
- a dedicated future static-evidence result normalizer or review model, if separately approved

The first adapter implementation should not modify lib/discovery-fetch-adapter.ts. Keeping the metadata-only adapter unchanged reduces regression risk and preserves its no-body contract.

## 5. Proposed Bounded HTML Acquisition Helper/Function

The future standalone function may be named executeDiscoveryFetchHtml.

It should accept a validated HTML fetch plan and return an asynchronous result. On success, it returns:

- A bounded HTML string held only in memory.
- Safe fetch metadata.
- A distinct success status such as fetch_completed_html_acquired.

On failure, it returns:

- A fixed safe failure status and reason.
- Safe metadata only.
- No HTML property and no partial body content.

The helper should accept dependency injection for DNS resolution, HTTPS request handling, and clock values so unit tests can use local fake transports without external network calls.

## 6. Input Plan Shape

The future input plan should be explicit and validated before DNS or transport work. It should include:

- normalizedUrl
- hostname
- protocol fixed to HTTPS
- method fixed to GET
- timeoutMs
- redirectLimit fixed to 0
- responseSizeLimitBytes
- userAgent
- acceptedContentTypes
- createdAt

The plan must reject:

- Non-HTTPS protocols.
- Userinfo or credentials in URLs.
- Unsafe or mismatched normalized URLs and hostnames.
- Non-GET methods.
- Redirect limits above zero.
- Invalid timeout or byte caps.
- Unexpected user-agent values.
- Missing or unsafe content-type allowlists.

The adapter must revalidate URL safety rather than trusting a caller-provided plan.

## 7. Result Shape

The future result shape should separate success from failure.

Success result requirements:

- ok is true.
- status is fetch_completed_html_acquired.
- html is a bounded string available only to the immediate caller.
- metadata has allowlisted operational fields only.

Failure result requirements:

- ok is false.
- status is from the fixed failure taxonomy.
- reason is a fixed safe reason.
- metadata has allowlisted operational fields only.
- No html, body, partial body, header dump, cookie, token, or stack trace is returned.

Safe metadata may include normalized URL, hostname, resolved-IP family, DNS/rebinding flags, method, timeout, response size cap, timestamps, duration, HTTP status, content type, content-length header, bytes read, truncation flag, sanitized redirect location, and sanitized error code.

## 8. Safety Requirements

The future adapter must:

- Reuse validateDiscoveryUrlSafety and existing blocked-IP logic.
- Resolve DNS before connecting and reject blocked answers.
- Pin the connection to the chosen validated resolved IP.
- Use HTTPS and certificate verification.
- Send no cookies, authorization, admin, or session headers.
- Use agent false or equivalent connection isolation.
- Send only the approved user-agent and accept headers.
- Never execute JavaScript, load subresources, follow links, submit forms, or use browser rendering.
- Treat response data as hostile and non-authoritative.
- Keep extraction outside the adapter; acquisition must not infer category, legitimacy, quality, candidate status, or ranking.

## 9. Memory and Byte-Cap Behavior

The adapter must accumulate chunks in a local in-memory buffer only.

- Reject an oversized Content-Length before reading the body.
- Count streamed bytes before retaining beyond the cap.
- When the cap would be exceeded, destroy the response, discard all buffered chunks, return a safe response-too-large failure, and return no HTML.
- Do not expose truncated partial HTML as a success or failure payload.
- Process one URL at a time in any future executor wiring to bound peak memory.
- Immediately release the HTML reference after the immediate caller has derived allowlisted evidence.
- Never retain an adapter-level cache or module-level HTML reference.

The initial cap should match the existing request-plan cap of 1 MB unless a later Gemini-reviewed plan changes it.

## 10. Content-Type, Redirect, and Timeout Behavior

Future implementation must define and test these fixed behaviors:

- Content type: use an explicit allowlist. For the first static HTML slice, text/html should be the default; any broader acceptance of text/plain or application/xhtml+xml requires review.
- Redirects: redirectLimit is zero. Do not follow redirects. Return a safe redirect-not-followed failure and sanitized location metadata only.
- Timeout: use the validated plan timeout and terminate the request on expiry.
- Content length: reject invalid or oversized values safely.
- Decompression: do not allow decompression to bypass the byte cap; exact decompression handling must be reviewed before code.
- Transport errors and TLS errors: map them to fixed safe failure statuses and error codes.

## 11. Failure Taxonomy

The future adapter should use a small fixed taxonomy aligned with current metadata-fetch safety patterns:

- fetch_failed_invalid_plan
- fetch_failed_dns_resolution
- fetch_failed_blocked_resolved_ip
- fetch_failed_timeout
- fetch_failed_response_too_large
- fetch_failed_network_error
- fetch_failed_unsupported_content_type
- fetch_redirect_not_followed
- fetch_failed_tls_error
- fetch_failed_empty_body

A successful body acquisition must use a distinct status such as fetch_completed_html_acquired. Failure reasons and error codes must be allowlisted, bounded, and free of upstream messages, body text, headers, cookies, secrets, and stack traces.

## 12. Stats, Audit, and Log Restrictions

Raw HTML is prohibited from all persistent and observable output surfaces.

It must never appear in:

- discovery_runs.stats
- discovery_audit_events metadata or messages
- application logs
- console output
- terminal output
- error messages
- database rows
- stored files
- Supabase Storage
- test fixtures committed as captured production content
- API responses
- UI props or public pages

The future adapter result may contain HTML only in local memory on a success path. A future immediate caller may pass it to deriveStaticHtmlEvidence and must then discard it. Only bounded, allowlisted derived evidence may later be considered for stats or audit design, under separate approval.

## 13. Tests Required

The future adapter implementation must include focused tests with injected local DNS and HTTPS transport dependencies. Tests must not make external network calls.

Required coverage:

- Valid safe plan reaches the fake transport.
- Invalid/non-HTTPS/userinfo/mismatched plans fail before DNS/transport.
- Private, blocked, mixed, and invalid DNS answers fail before transport.
- Safe resolved IP pinning and TLS hostname behavior are preserved.
- Redirects are not followed and locations are sanitized.
- Unsupported/missing content types fail without HTML.
- Oversized Content-Length fails before reading body.
- Oversized streamed response destroys the stream, discards the buffer, and returns no HTML.
- Timeout, network, and TLS failures contain no body or raw upstream message.
- Empty body produces fetch_failed_empty_body with no HTML.
- Successful bounded HTML returns the expected local string and safe metadata only.
- The result has no cookies, headers, secrets, stack traces, candidate fields, discovered-tool fields, or public-tool fields.
- Source scans confirm no database writes, audit writes, executor wiring, LLM calls, browser rendering, screenshot, scheduler, worker, or crawler behavior.
- Existing metadata-only adapter tests continue to pass unchanged.

## 14. Rollback Plan

The future adapter should be additive and not wired initially.

Rollback is therefore:

- Remove the new standalone adapter file and its focused tests if the future implementation is rejected before wiring.
- Keep the existing metadata-only adapter unchanged.
- Keep all executor modes and API behavior unchanged.
- Require no schema rollback, database cleanup, raw asset cleanup, candidate cleanup, or public-data cleanup because the adapter stores nothing and performs no writes.

If later wired in a separate phase, rollback must disable the new mode branch without changing existing metadata-fetch modes.

## 15. Gemini Review Gates

Gemini approval is required:

- Before adapter implementation starts.
- Before accepting a final input and result type shape.
- Before choosing accepted content types beyond the initial strict policy.
- Before any decompression strategy is implemented.
- Before the adapter is wired into an executor.
- Before any stats, audit, API, UI, schema, storage, candidate, duplicate, ranking, approval, or publish design is implemented.
- Before any change involving discovered_tools or public.tools.

## 16. Safety Boundaries

Phase 7P makes no code or behavior change.

- No adapter implementation.
- No executor or API route modification.
- No Supabase code, migration, schema, RLS, index, policy, or Storage change.
- No dependency change.
- No external network call.
- No raw HTML storage.
- No manual executor wiring.
- No candidate creation or discovered_tools/public.tools write.
- No duplicate detection, ranking, recommendation, approval, or publish workflow change.
- No commit or push.

## 17. Verification Commands

After creating this document, run:

    git diff --check
    npm run lint
    npm run check
    git status --short --branch

If npm run check encounters the known sandbox-only Turbopack port binding restriction, rerun it in an approved elevated environment and report both results.

## 18. CCR Report Requirements

The implementation report for this docs-only phase must include:

- Summary.
- Files changed.
- Boundary confirmation.
- Verification results.
- Risks and follow-ups.
- Exact final git status --short --branch output.
- Confirmation that no commit or push was performed.

