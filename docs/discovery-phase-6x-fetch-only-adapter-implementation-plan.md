# Phase 6X — Fetch-Only Adapter Implementation Plan

## Status

Phase 6X implementation planning draft.

This phase is documentation-only.

No real fetch implementation is approved in this phase.

## Current Approved Foundation

AiFinder Discovery Engine has completed:

- Phase 6T — Real fetch/extract planning and safety design.
- Phase 6U — Fetch-disabled request builder / preflight validator.
- Phase 6V — Authenticated smoke test for fetch-disabled preflight validator.
- Phase 6W — Real fetch design boundary plan.

Phase 6W was Gemini-approved and committed.

Phase 6W requires the first real-fetch implementation to be:

- Single URL only.
- Manual curated source only.
- Metadata-only.
- Admin-only.
- No extraction.
- No LLM analysis.
- No scheduler or worker.
- No insert into discovered_tools.
- No insert into public.tools.

## Phase 6X Goal

Define the exact future implementation shape for a fetch-only adapter before any code is written.

This plan should be reviewed by Gemini before Phase 6Y implementation.

Phase 6X must define:

- Proposed adapter files.
- Proposed adapter API.
- DNS resolution and connection pinning policy.
- SSRF enforcement.
- Timeout behavior.
- Response size behavior.
- Redirect behavior.
- Content-Type behavior.
- Safe metadata output schema.
- Endpoint integration boundary.
- Run stats and audit shape.
- Unit and smoke test requirements.

## Non-Goals

Phase 6X does not approve:

- Real fetch code.
- Network requests.
- HTML parsing.
- Metadata extraction.
- LLM analysis.
- Scheduler, cron, or background worker.
- Browser rendering.
- JavaScript execution.
- Recursive crawling.
- Robots fetching.
- Sitemap crawling.
- Evidence body storage.
- Screenshot capture.
- Insert into discovered_tools.
- Insert into public.tools.
- Automatic candidate approval.
- Public or non-admin crawler access.

## Future Implementation Phase Name

If this plan is approved, the next implementation phase should be:

Phase 6Y — Metadata-Only Fetch Adapter Implementation

Phase 6Y should implement only the approved fetch adapter and unit tests.

Authenticated end-to-end smoke testing should be separate:

Phase 6Z — Authenticated Metadata-Only Fetch Smoke Test

## Proposed Future Files

Phase 6Y may add:

- lib/discovery-fetch-adapter.ts
- testing/discovery-fetch-adapter.test.mjs

Phase 6Y may update:

- lib/discovery-url-safety.ts
- lib/discovery-request-plan.ts
- testing/discovery-url-safety.test.mjs
- testing/discovery-request-plan.test.mjs

Phase 6Y should not modify the executor claim endpoint unless Gemini explicitly approves endpoint integration in the implementation plan.

Recommended approach:

1. Implement the fetch adapter as a standalone library first.
2. Unit test the adapter with local controlled test servers or mocked transport.
3. Keep endpoint integration as a later explicit step unless approved.

## Proposed Adapter API

The future fetch adapter should expose one high-level function:

    export async function executeDiscoveryFetchMetadataOnly(
      plan: DiscoveryFetchPlan
    ): Promise<DiscoveryFetchResult>;

The adapter should not accept raw arbitrary user input.

It should accept only a validated fetch plan derived from the existing request-plan preflight.

## Proposed Fetch Plan Type

    export type DiscoveryFetchPlan = {
      normalizedUrl: string;
      hostname: string;
      protocol: "https:";
      method: "GET";
      timeoutMs: number;
      redirectLimit: 0;
      responseSizeLimitBytes: number;
      userAgent: string;
      acceptedContentTypes: readonly [
        "text/html",
        "text/plain",
        "application/xhtml+xml"
      ];
      createdAt: string;
    };

Important requirements:

- method must always be GET.
- protocol must always be https:.
- redirectLimit must always be 0 in the first fetch phase.
- No caller-provided headers are allowed.
- No cookies are allowed.
- No auth headers are allowed.
- No request body is allowed.
- No credentials are allowed.
- No proxy is allowed unless separately reviewed.

## Proposed Fetch Result Type

    export type DiscoveryFetchResult =
      | {
          ok: true;
          status: "fetch_completed_metadata_only";
          metadata: DiscoveryFetchMetadata;
        }
      | {
          ok: false;
          status:
            | "fetch_failed_dns_resolution"
            | "fetch_failed_blocked_resolved_ip"
            | "fetch_failed_timeout"
            | "fetch_failed_response_too_large"
            | "fetch_failed_network_error"
            | "fetch_failed_unsupported_content_type"
            | "fetch_redirect_not_followed"
            | "fetch_failed_tls_error";
          reason: string;
          metadata: DiscoveryFetchMetadata;
        };

The result must never include:

- Raw HTML.
- Response body text.
- Extracted metadata.
- Parsed title.
- Parsed description.
- Screenshots.
- Cookies.
- Secrets.
- Auth headers.
- Environment variables.

## Proposed Fetch Metadata Type

    export type DiscoveryFetchMetadata = {
      requestedUrl: string;
      normalizedUrl: string;
      hostname: string;
      resolvedIp: string | null;
      resolvedIpFamily: 4 | 6 | null;
      dnsResolutionChecked: boolean;
      dnsRebindingProtectionApplied: boolean;
      connectionPinnedToResolvedIp: boolean;
      method: "GET";
      userAgent: string;
      timeoutMs: number;
      redirectLimit: 0;
      responseSizeLimitBytes: number;
      fetchStartedAt: string;
      fetchFinishedAt: string;
      durationMs: number;
      httpStatus: number | null;
      contentType: string | null;
      contentLengthHeader: string | null;
      bytesRead: number;
      responseTruncated: boolean;
      redirectLocation: string | null;
      errorCode: string | null;
    };

Metadata must be safe to store in discovery_runs.stats and audit metadata.

## DNS Resolution and Pinning Policy

The adapter must implement DNS protection before any network request.

Required behavior:

1. Parse and validate the URL using existing URL safety logic.
2. Resolve the hostname before connecting.
3. Validate every resolved IP against the private/reserved/link-local/internal blocklist.
4. Reject the fetch if any resolved IP is blocked.
5. Pick one validated resolved IP.
6. Pin the outbound connection to that validated IP.
7. Preserve the original hostname for TLS SNI and Host header handling.
8. Avoid a second trusted DNS lookup between validation and connection.
9. Treat DNS rebinding protection as mandatory.

The adapter must not rely only on hostname string validation.

The adapter must not trust DNS after the preflight check without resolved-IP validation.

## IP Blocklist Requirements

Resolved IP validation must reject:

- 0.0.0.0/8
- 10.0.0.0/8
- 100.64.0.0/10
- 127.0.0.0/8
- 169.254.0.0/16
- 172.16.0.0/12
- 192.0.0.0/24
- 192.0.2.0/24
- 192.88.99.0/24
- 192.168.0.0/16
- 198.18.0.0/15
- 198.51.100.0/24
- 203.0.113.0/24
- 224.0.0.0/4 and above
- IPv6 unspecified / loopback
- IPv6 unique local
- IPv6 link-local
- IPv6 site-local
- IPv6 multicast
- IPv6 documentation range
- IPv4-compatible IPv6
- IPv4-mapped IPv6 if the embedded IPv4 is blocked

This should reuse or extract the existing Phase 6U IP safety logic where possible.

## Fetch Transport Recommendation

Before implementation, Gemini should decide whether Node built-in fetch is acceptable.

Because DNS pinning and original-hostname TLS SNI may be difficult with plain fetch, the implementation may need a lower-level Node HTTPS transport such as https.request.

A future implementation must prove:

- Connection is made to the validated IP.
- TLS SNI uses the original hostname.
- Host header uses the original hostname.
- The request does not use environment proxy settings.
- Redirects are not followed.
- Timeout is enforced.
- Response size limit is enforced.

If these cannot be proven with the selected transport, implementation must stop.

## Redirect Policy

Redirect limit must be 0.

If the response is a redirect status:

- Do not follow it.
- Record status code.
- Record safe Location header if present.
- Do not fetch the redirected URL.
- Return fetch_redirect_not_followed.
- Do not extract.
- Do not insert candidates.
- Do not insert public tools.

## Content-Type Policy

The adapter must enforce this strict allowlist:

- text/html
- text/plain
- application/xhtml+xml

Content-Type comparison should:

- Ignore parameters like charset=utf-8.
- Normalize case.
- Reject missing Content-Type unless Gemini explicitly approves allowing it.
- Reject JSON.
- Reject images.
- Reject PDFs.
- Reject ZIP, archive, and binary files.
- Reject scripts, stylesheets, and media.

Unsupported content type should return:

- fetch_failed_unsupported_content_type

The response body must not be stored or parsed.

## Response Size Policy

The adapter must enforce a maximum of 1 MB.

Required behavior:

- Stop reading once the limit is exceeded.
- Return fetch_failed_response_too_large.
- Record bytesRead.
- Record responseTruncated: true.
- Do not store response body.
- Do not extract.
- Do not insert.

If Content-Length is present and already exceeds the limit, the adapter should reject before reading the body.

## Timeout Policy

The adapter must enforce a 10 second maximum timeout.

Required behavior:

- Timeout must cover DNS, connect, TLS, response headers, and body read.
- Timeout should abort the request.
- Return fetch_failed_timeout.
- Record safe timing metadata.
- Do not store response body.
- Do not extract.
- Do not insert.

## Status Code Policy

The adapter may record any HTTP status code.

For the first fetch-only phase:

- 2xx response may return fetch_completed_metadata_only if content type and size pass.
- 3xx response must return fetch_redirect_not_followed.
- 4xx or 5xx response should record status and complete metadata-only without extraction.

No status code may trigger extraction or candidate insertion.

## Endpoint Integration Boundary

Phase 6Y should prefer standalone adapter implementation only.

Endpoint integration should require a separate explicit approval unless Gemini approves including it in Phase 6Y.

If endpoint integration is later approved, it should:

- Occur only after existing request-plan preflight passes.
- Preserve admin-only access.
- Preserve CSRF.
- Preserve dedicated rate limit.
- Preserve stale-run recovery.
- Preserve active-run conflict checks.
- Preserve source validation.
- Preserve manual curated source-only scope.
- Preserve no extraction.
- Preserve no LLM analysis.
- Preserve no candidate insertion.
- Preserve no public tool insertion.

## Run Stats Schema

If endpoint integration is later approved, stats may include:

    {
      "execution_status": "fetch_completed_metadata_only",
      "fetch_metadata": {
        "requestedUrl": "https://example.com/",
        "hostname": "example.com",
        "resolvedIp": "93.184.216.34",
        "dnsResolutionChecked": true,
        "dnsRebindingProtectionApplied": true,
        "connectionPinnedToResolvedIp": true,
        "httpStatus": 200,
        "contentType": "text/html; charset=UTF-8",
        "contentLengthHeader": "1234",
        "bytesRead": 1234,
        "responseTruncated": false,
        "redirectLocation": null,
        "errorCode": null
      },
      "no_extraction_performed": true,
      "no_llm_analysis_performed": true,
      "no_candidates_inserted": true,
      "no_public_tools_inserted": true
    }

no_fetch_performed may become false only in the specific approved real-fetch phase.

## Audit Event Schema

If endpoint integration is later approved, audit events may include:

- fetch_preflight_started
- fetch_preflight_passed
- fetch_attempt_started
- fetch_attempt_completed
- fetch_attempt_failed
- fetch_response_metadata_recorded

Audit metadata must not include:

- Raw HTML.
- Response body.
- Cookies.
- Credentials.
- Admin session cookie.
- CSRF token.
- Environment variables.
- Secrets.
- Extracted candidate data.

## Unit Test Requirements

Future Phase 6Y must include unit tests for:

URL and plan validation:

- Allows valid public HTTPS URL.
- Rejects non-HTTPS.
- Rejects credentials.
- Rejects localhost.
- Rejects private IPv4.
- Rejects private IPv6.
- Rejects reserved IP ranges.
- Rejects obfuscated loopback/private forms.

DNS validation:

- Rejects hostname resolving to private IPv4.
- Rejects hostname resolving to private IPv6.
- Rejects mixed DNS result set if any IP is blocked.
- Accepts hostname resolving only to public IPs.
- Records resolved IP metadata.

Fetch behavior using local controlled test server or mocked transport:

- GET only.
- No redirects followed.
- Redirect returns fetch_redirect_not_followed.
- Unsupported content type returns fetch_failed_unsupported_content_type.
- Missing Content-Type is rejected unless later approved.
- Oversized Content-Length rejected before body read.
- Oversized streamed response aborted.
- Timeout returns fetch_failed_timeout.
- Network error returns fetch_failed_network_error.
- TLS error returns fetch_failed_tls_error.
- No response body appears in returned metadata.

Data safety tests:

- No discovered_tools insert.
- No public.tools insert.
- No extraction fields.
- No LLM calls.
- No scheduler logic.

## Smoke Test Requirements

Future Phase 6Z should verify through authenticated admin flow:

Valid case:

- One approved manual curated URL can be fetched.
- Safe metadata is recorded.
- Run completes.
- no_extraction_performed = true.
- no_llm_analysis_performed = true.
- no_candidates_inserted = true.
- no_public_tools_inserted = true.
- discovered_tools count unchanged.
- public.tools count unchanged.

Rejected cases:

- Private/reserved IP URL rejected before fetch.
- Custom hostname resolving to private/reserved IP rejected.
- Redirect response not followed.
- Unsupported content type rejected.
- Oversized response rejected or aborted.
- Timeout handled safely.

Cleanup:

- Smoke data is deleted.
- Audit events are cleaned up.
- No public data remains.

## Required Gemini Gate

Before Phase 6Y implementation begins, Gemini must approve:

- Adapter API.
- DNS resolution and connection pinning approach.
- Selected fetch transport.
- IP blocklist reuse/extraction plan.
- Content-Type allowlist behavior.
- Timeout behavior.
- Response size behavior.
- Redirect behavior.
- Unit test plan.
- Whether endpoint integration is allowed in Phase 6Y or must wait.

## Phase 6X Decision

Phase 6X is planning only.

Allowed after this document:

- Ask Gemini to review Phase 6X planning.

Still not allowed:

- Real fetch implementation.
- Network requests.
- Extraction.
- LLM analysis.
- Scheduler or worker.
- Insert into discovered_tools.
- Insert into public.tools.
