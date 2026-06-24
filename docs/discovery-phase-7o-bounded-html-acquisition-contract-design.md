# Phase 7O — Bounded In-Memory HTML Acquisition Contract Design

## 1. Purpose

Phase 7O defines the design contract for a future bounded in-memory HTML acquisition adapter. This contract is required before any future executor wiring can integrate the existing isolated static HTML evidence helper (`deriveStaticHtmlEvidence`) into the manual discovery executor.

The existing metadata-only fetch adapter (`executeDiscoveryFetchMetadataOnly`) cannot supply HTML to the helper because it deliberately discards response body chunks. A separately reviewed, bounded, in-memory HTML acquisition adapter is needed — and its design must be reviewed and approved before any implementation begins.

This phase is **documentation only**. It does not implement an adapter, executor mode, API route, parser, or any application code.

## 2. Background / Gap Analysis

The current metadata-only fetch adapter was designed for safe, minimal network interaction:

- It validates DNS answers and pins connections to resolved safe IPs.
- It uses HTTPS with certificate verification.
- It enforces timeout and response-size controls.
- It rejects oversized Content-Length headers and stops oversized streamed responses.
- It accepts `text/html`, `text/plain`, and `application/xhtml+xml`.
- It **reads chunks only to count bytes** and deliberately does **not** return body or HTML data.

This design is correct for metadata-only mode, where the goal is to verify reachability, content-type, and size without consuming response bodies. However, the isolated `deriveStaticHtmlEvidence` helper (Phase 7M) expects an in-memory `html: string` argument. The current adapter cannot provide it.

A new adapter (or adapter mode) is needed that:

- Preserves all existing SSRF/DNS/IP/TLS/redirect/size/timeout protections.
- Accumulates response chunks into an in-memory string buffer instead of discarding them.
- Returns that bounded HTML string to the caller for immediate use by the helper.
- Discards the HTML string after the helper consumes it.

The Phase 7N readiness gate (see `docs/discovery-phase-7n-static-html-evidence-executor-wiring-readiness-gate.md`) identified this gap as the primary condition before any executor wiring can proceed.

## 3. Relationship to Prior Phases

| Phase | Document | Relationship |
|---|---|---|
| **Phase 7L** | `docs/discovery-phase-7l-static-html-derived-evidence-implementation-plan.md` | Defined the future implementation plan for static HTML evidence, including the proposed executor mode boundary and input requirements (HTTPS only, request-plan safety, byte cap, etc.). |
| **Phase 7M** | Implementation of `lib/discovery-static-html-evidence.ts` | Added the isolated, dependency-free `deriveStaticHtmlEvidence` helper that accepts `{ html: string, ... }` and returns derived evidence. This helper exists and is tested but cannot receive HTML from the current adapter. |
| **Phase 7N** | `docs/discovery-phase-7n-static-html-evidence-executor-wiring-readiness-gate.md` | Readiness gate that found the metadata-only fetch adapter discards body chunks, making it unable to supply HTML. Recommended a separately reviewed body-acquisition contract — this phase fulfills that recommendation. |

Phase 7O is the contract design layer. A future Phase 7P (or later) would implement the adapter, and a subsequent phase would wire it into the executor.

## 4. Non-Goals

Phase 7O explicitly does **not** authorize or include:

| Item | Status |
|---|---|
| Executor mode (`manual_static_html_derived_evidence` or any other) | Not implemented |
| API route changes | Not touched |
| Supabase schema, migrations, RLS, or storage changes | Not touched |
| Parser or extraction code beyond the existing helper | Not created |
| UI or read-model changes | Not created |
| AI/LLM analysis or enrichment | Not implemented |
| Candidate, discovered_tools, or public.tools writes | Not implemented |
| Duplicate detection, ranking, recommendation, approval, or publishing | Not implemented |
| Browser rendering or screenshots | Not implemented |
| Scheduler, worker, or cron behavior | Not implemented |
| Dependency, package, or lockfile changes | Not changed |
| `.env.local` access | Not accessed |
| Commit or push | Not performed |

This is a **design document only**. No behavior changes, no code, no database writes, no network changes.

## 5. Proposed Contract Shape

The following types are a **design proposal only**. They are not implemented, imported, or compiled. They describe the future adapter's contract for review and approval.

### Proposed DiscoveryFetchHtmlPlan

A dedicated plan type specific to bounded HTML acquisition. It reuses shared constants from `lib/discovery-request-plan.ts`:

```typescript
// PROPOSED DESIGN — NOT IMPLEMENTED
export type DiscoveryFetchHtmlPlan = {
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
    "application/xhtml+xml",
  ];
  createdAt: string;
};
```

Key design decisions:
- `responseSizeLimitBytes` defaults to `1_000_000` (1 MB), matching the existing limit. This is the memory bound.
- `redirectLimit` stays at `0`. Redirects are not followed.
- `acceptedContentTypes` matches the existing whitelist. Content-type filtering prevents unexpected response types.
- No new constants or configuration values are needed beyond what already exists.

### Proposed DiscoveryFetchHtmlStatus

Parallel to the existing `DiscoveryFetchStatus` but with distinct values for the HTML-acquired path:

```typescript
// PROPOSED DESIGN — NOT IMPLEMENTED
export type DiscoveryFetchHtmlStatus =
  | "fetch_completed_html_acquired"
  | "fetch_failed_invalid_plan"
  | "fetch_failed_dns_resolution"
  | "fetch_failed_blocked_resolved_ip"
  | "fetch_failed_timeout"
  | "fetch_failed_response_too_large"
  | "fetch_failed_network_error"
  | "fetch_failed_unsupported_content_type"
  | "fetch_redirect_not_followed"
  | "fetch_failed_tls_error"
  | "fetch_failed_empty_body";
```

The new "fetch_completed_html_acquired" status distinguishes HTML mode from "fetch_completed_metadata_only". A new "fetch_failed_empty_body" status handles the case where the response completed with zero bytes.

### Proposed DiscoveryFetchHtmlResult

```typescript
// PROPOSED DESIGN — NOT IMPLEMENTED
export type DiscoveryFetchHtmlMetadata = {
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

export type DiscoveryFetchHtmlResult =
  | {
      ok: true;
      status: "fetch_completed_html_acquired";
      html: string;          // bounded to responseSizeLimitBytes
      metadata: DiscoveryFetchHtmlMetadata;
    }
  | {
      ok: false;
      status: Exclude<
        DiscoveryFetchHtmlStatus,
        "fetch_completed_html_acquired"
      >;
      reason: string;
      metadata: DiscoveryFetchHtmlMetadata;
    };
```

Key design decisions:
- On success, `html` is a bounded string (max 1 MB), held in memory only for the caller to pass to `deriveStaticHtmlEvidence`.
- On failure, no `html` field exists — the adapter never returns partial HTML.
- `metadata` is always present and mirrors the existing `DiscoveryFetchMetadata` shape, containing only safe, non-sensitive information.

### Proposed Function Signature

```typescript
// PROPOSED DESIGN — NOT IMPLEMENTED
export function executeDiscoveryFetchHtml(
  plan: DiscoveryFetchHtmlPlan
): Promise<DiscoveryFetchHtmlResult>;
```

The function is async and returns a Promise. If not needed, the adapter could also accept a 
`dependencies` object for testability, following the existing pattern.

## 6. Recommended Adapter Strategy

**Option A (Recommended): New standalone bounded HTML acquisition function**

Create a new `executeDiscoveryFetchHtml` function in a new file (e.g., `lib/discovery-fetch-html-adapter.ts`) or alongside the existing adapter. This function:

- Reuses shared DNS/IP/safety validation helpers (`validateDiscoveryUrlSafety`, `getDiscoveryIpAddressFamily`, `isBlockedDiscoveryIpAddress`).
- Reuses shared constants (`DISCOVERY_REQUEST_PLAN_TIMEOUT_MS`, `DISCOVERY_REQUEST_PLAN_RESPONSE_SIZE_LIMIT_BYTES`, `DISCOVERY_REQUEST_PLAN_USER_AGENT`).
- Has its own plan and result types (as proposed above).
- Accumulates chunks into a bounded in-memory string buffer.
- Returns the HTML string to the caller.

**Rationale for Option A:**

1. **Single responsibility preserved.** The existing `executeDiscoveryFetchMetadataOnly` remains untouched. It stays focused on metadata-only behavior.
2. **Reduced regression risk.** Existing metadata-only fetch behavior, tests, and smoke tests are unaffected.
3. **Clearer audit trail.** A new function with new status values makes it obvious which code path was used.
4. **Easier review.** The new adapter can be reviewed independently without analyzing changes to the existing adapter.

**Option B (Not recommended): Add `acquireBody: boolean` to existing adapter**

Modifying the existing adapter introduces branching inside a single function, increases complexity, risks breaking the metadata-only path, and dilutes the adapter's single responsibility.

**Recommendation: Option A — a new standalone function.**

## 7. Input Requirements

The future adapter must enforce these input requirements, using existing infrastructure where possible:

| Requirement | Implementation |
|---|---|
| **Request-plan safety** | Reuse `validateDiscoveryUrlSafety` to reject unsafe URLs (private IPs, loopback, userinfo, non-HTTPS, blocked hostnames, DNS rebinding risks). |
| **HTTPS only** | Enforce `protocol === "https:"`. Reject `http:` or other schemes. |
| **Hostname/IP safety** | Resolve DNS, validate `isBlockedDiscoveryIpAddress`, pin connection to resolved IP. |
| **Redirect limit** | `redirectLimit: 0`. Do not follow redirects. Log redirect as a failure. |
| **Timeout** | Enforce `DISCOVERY_REQUEST_PLAN_TIMEOUT_MS` (10,000 ms). |
| **Content-type eligibility** | Accept only `text/html`, `text/plain`, `application/xhtml+xml`. Reject other types. |
| **Response-size cap** | Enforce `responseSizeLimitBytes` (default 1,000,000). Reject oversized responses by Content-Length header or streaming byte count. |
| **No cookies/auth** | Do not forward cookies, admin session headers, authorization headers, or secrets. |

The adapter should **not** create its own request plan. It should accept a validated `DiscoveryFetchHtmlPlan` from the caller (generated by the existing `buildDiscoveryRequestPlan` infrastructure or a future plan-builder).

## 8. Output Requirements

| Requirement | Detail |
|---|---|
| **Bounded HTML string** | On success, return `html: string` bounded to `responseSizeLimitBytes`. |
| **No partial HTML on failure** | If the response is too large, times out, or fails for any reason, return no `html` field. |
| **Safe metadata** | Return safe metadata: status, normalized URL, hostname, HTTP status, content type, bytes read, truncation flag, error code, timing info. |
| **No secrets in metadata** | Metadata must not include request or response headers (except content-type and content-length), cookies, admin tokens, stack traces, or raw error messages. |
| **Consistent error shape** | On failure, return a machine-readable `status`, human-readable `reason`, and full `metadata`. |

## 9. Memory and Bounding Strategy

| Rule | Detail |
|---|---|
| **Chunk accumulation** | Accumulate response chunks into an in-memory `string[]` buffer (or `string` via concatenation). Use a buffer array to avoid repeated string reallocation for large responses. |
| **Byte cap** | Stop accumulating once total bytes exceed `responseSizeLimitBytes`. Destroy the response stream and signal failure. |
| **Sequential processing** | Process URLs one at a time (matching the existing sequential pattern in `manual_metadata_fetch`). This keeps peak memory at or below `responseSizeLimitBytes` per request. |
| **Immediate discard** | The caller (future executor or test) must pass the `html` string to `deriveStaticHtmlEvidence` and then **discard the string** (allow GC). The adapter itself must not retain a reference to the HTML after returning. |
| **No raw HTML in logs** | Never log, print, or store the raw HTML string in any stat, audit event, error message, or console output. |
| **Truncation flag** | If the response completed but was truncated by the byte cap, set `responseTruncated: true` in metadata. |

## 10. Safety Boundaries

The future adapter must preserve all existing safety boundaries from the current fetch adapter. These are non-negotiable:

| Boundary | Detail |
|---|---|
| **SSRF protection** | Validate URL safety before DNS resolution. Reject private, loopback, link-local, multi-cast, and blocked IPs. |
| **DNS rebinding protection** | Resolve DNS before connecting. Pin connection to the resolved IP. Reject mismatched IP families. |
| **TLS verification** | Require HTTPS with certificate verification. Reject TLS errors. |
| **Redirect safety** | `redirectLimit: 0`. Never follow redirects. |
| **Content-type allowlist** | Accept only `text/html`, `text/plain`, `application/xhtml+xml`. |
| **Timeout** | Hard timeout at `DISCOVERY_REQUEST_PLAN_TIMEOUT_MS`. |
| **Response-size limit** | Cap at `responseSizeLimitBytes`. |
| **No cookies or auth** | Never send cookies, admin session headers, or authentication headers. |
| **No subresource loading** | Do not load images, scripts, stylesheets, iframes, or any embedded resources. |
| **No JS execution** | The adapter performs no JavaScript execution or browser rendering. It is a plain HTTP(S) request. |
| **No raw storage** | The HTML string exists only in memory and is discarded after the helper consumes it. |

## 11. Failure Taxonomy

The future adapter should distinguish these safe failure reasons:

| Status | Condition |
|---|---|
| `fetch_failed_invalid_plan` | Plan failed initial validation (missing fields, invalid URL). |
| `fetch_failed_dns_resolution` | DNS lookup failed (NXDOMAIN, no records, network error). |
| `fetch_failed_blocked_resolved_ip` | Resolved IP is on the blocklist (private, loopback, etc.). |
| `fetch_failed_timeout` | No response within timeout window. |
| `fetch_failed_response_too_large` | Response exceeds `responseSizeLimitBytes` (Content-Length header check or streaming count). |
| `fetch_failed_network_error` | Generic network error (connection refused, reset, etc.). |
| `fetch_failed_unsupported_content_type` | Response Content-Type is not in the allowed set. |
| `fetch_redirect_not_followed` | Server responded with a redirect status; not followed. |
| `fetch_failed_tls_error` | TLS handshake or certificate verification failure. |
| `fetch_failed_empty_body` | Response completed with zero bytes and no acceptable content. |

All failure statuses must:
- Return `ok: false` with no `html` field.
- Include a human-readable `reason` string.
- Include full `metadata` with timing, HTTP status, content-type (if available), and bytes read.
- Exclude raw HTML, full response body, secrets, cookies, or stack traces.

## 12. Stats and Audit Rules

When the HTML acquisition adapter is used by a future executor mode, stats and audit events must follow these rules:

| Rule | Detail |
|---|---|
| **Safe metadata only** | Stats may record: number of URLs attempted, succeeded, failed; bytes read; truncated flags; content types; HTTP statuses; durations. |
| **No raw HTML** | Never include raw HTML, full body text, or substantial excerpts in `discovery_runs.stats` or `discovery_audit_events.metadata`. |
| **No secrets** | Never include request headers, response headers (beyond content-type/content-length), cookies, admin tokens, or stack traces. |
| **No error details in stats** | Generic error codes and reasons are acceptable; full error messages with path/SQL/IP/internal details are not. |
| **Zero candidate/tool counts** | Future executor mode stats must report `candidateCreated: 0` with zero `discovered_tools` and `public.tools` inserts. |
| **Audit event naming** | Audit events should use safe, distinct names (e.g., `html_acquisition_started`, `html_acquisition_completed`, `html_acquisition_failed`). |
| **Audit allowlist** | Future audit metadata must be explicitly allowlisted field by field, matching the pattern of the existing metadata-fetch audit helpers. |

## 13. Future Test Requirements

Before any implementation of this adapter can be approved, the following tests must be created (all must focus on the adapter or a future executor mode — no test changes to existing code):

| # | Test | Category |
|---|---|---|
| 1 | **Byte cap enforced** — Response exceeding `responseSizeLimitBytes` is rejected with `fetch_failed_response_too_large`. | Adapter safety |
| 2 | **Content-type reject** — Non-allowlisted Content-Type is rejected with `fetch_failed_unsupported_content_type`. | Adapter safety |
| 3 | **Timeout enforced** — Unresponsive server triggers `fetch_failed_timeout`. | Adapter safety |
| 4 | **Redirect rejected** — Server redirect triggers `fetch_redirect_not_followed`. | Adapter safety |
| 5 | **Unsafe URL rejected** — Private IP, loopback, non-HTTPS, or blocked hostname triggers plan-level failure. | Input safety |
| 6 | **Empty body rejected** — Zero-byte response triggers `fetch_failed_empty_body`. | Adapter safety |
| 7 | **Success returns HTML** — Valid HTML response returns `ok: true` with `html: string` containing the body. | Adapter correctness |
| 8 | **HTML truncated flag** — If HTML is truncated by the byte cap, `responseTruncated: true` is set. | Adapter correctness |
| 9 | **No raw HTML in metadata** — Verify `metadata` contains no body content. | Safety invariant |
| 10 | **No raw HTML in stats/audit** — Future executor mode tests must verify stats and audit metadata contain no raw HTML. | Safety invariant |
| 11 | **No candidate/tool writes** — Future executor mode tests must verify `candidateCreated: 0` and zero `discovered_tools`/`public.tools` inserts. | Safety invariant |
| 12 | **Existing metadata mode unchanged** — Verify `executeDiscoveryFetchMetadataOnly` still works correctly after the new adapter is added. | Regression |
| 13 | **Helper integration** — Bounded HTML string from adapter can be passed to `deriveStaticHtmlEvidence` and produces correct derived evidence. | Integration |

Helper-level unit tests for `deriveStaticHtmlEvidence` already exist in `testing/discovery-static-html-evidence.test.mjs`. Those do not need to change.

## 14. Gemini Review Gate

**Implementation of this contract cannot proceed without Gemini review and approval.**

Specifically, Gemini must review and approve:

1. This design contract document.
2. The final types and function signatures before they are implemented.
3. The adapter implementation before it is merged.
4. Any executor mode that uses the adapter.
5. Any stats shape, audit event names, or audit allowlist changes.
6. Any changes to rate-limit actions or executor mode strings.

This gate reflects the governance rules in `.cline/rules/aifinder-governance.md` (Section 5: Discovery Engine Safety) and the Phase 7L and Phase 7N requirements.

## 15. Rollback Strategy

The rollback strategy for any future implementation based on this contract:

| Scenario | Rollback Action |
|---|---|
| New adapter introduced but not wired into executor | Delete or disable the new adapter file. No data cleanup needed. |
| Executor mode introduced | Remove the mode string from the executor, revert the mode handling branch. Existing metadata-fetch modes remain untouched. |
| Stats shape introduced | Remove or ignore the new stats fields in the run output. No schema change = no data migration. |
| Audit events introduced | Remove the new audit event writes. Existing audit events remain. |
| Any scenario with raw data | By design, no raw HTML is stored. No raw-asset cleanup is required. |
| Any scenario with schema changes | The contract defers schema changes to a later gate. No migration rollback needed. |

This phase (7O) is documentation only — it has no code to roll back.

## 16. Safety Boundaries for This Phase

Phase 7O makes no implementation change:

| Activity | Status |
|---|---|
| File editing (app code, API, UI) | None |
| Executor mode creation | None |
| Fetch adapter implementation | None |
| Parser or helper changes | None |
| Schema, migration, RLS, Supabase Storage changes | None |
| Raw HTML storage | None |
| AI/LLM analysis or enrichment | None |
| Candidate creation | None |
| `discovered_tools` or `public.tools` inserts | None |
| Duplicate detection, ranking, recommendation, approval, publishing | None |
| Browser rendering or screenshots | None |
| Scheduler, worker, or cron behavior | None |
| Dependency, package, or lockfile changes | None |
| `.env.local` access | None |
| External network access | None |
| Commit or push | None |

This phase changes **only** this document: `docs/discovery-phase-7o-bounded-html-acquisition-contract-design.md`.

## 17. Verification

After creating this document, the following commands were run:

```bash
cd /Users/jamescarlodumaua/aifinder
npm run lint -- --quiet
npm run check
git diff --check
git status --short
```

If `npm run check` fails only because the environment blocks Turbopack local port binding, that fact is reported. Build configuration is not changed to work around it.

No migration, API, UI, test, or application-code verification is required because Phase 7O changes only documentation.
