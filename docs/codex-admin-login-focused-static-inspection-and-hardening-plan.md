# AiFinder Admin Login Focused Static Inspection and Hardening Plan

> **For agentic workers:** This document is an inspection and implementation plan, not implementation authorization. A later worker must use the approved successor gate and keep changes limited to the proposed static test and login route.

**Goal:** Record a high-confidence static security assessment of the administrative login route and define the smallest reviewable test-first, route-local hardening batch.

**Architecture:** Keep authentication local to the existing shared-password and HMAC-signed-cookie design. Remove the login route's audit-database dependency, replace reachable diagnostic logging with fixed categorical events, normalize fixed public errors, preserve rate-limit-before-authentication ordering, and retain the existing bounded four-hour secure cookie behavior.

**Tech Stack:** Next.js route handler, TypeScript, Node.js `crypto`, Web `Request`, `NextResponse`, and a proposed non-executing-at-this-gate Node.js static assertion file.

## Global Constraints

- Repository: `/Users/jamescarlodumaua/aifinder`
- Branch: `main`
- Required `HEAD`: `9aa271889471ba435738ad44bcca5a767b57a588`
- Required local `origin/main`: `9aa271889471ba435738ad44bcca5a767b57a588`
- Current authorization is inspection and planning only.
- Source modification, test creation or modification, test execution, application runtime, database access, environment-value access, network access, deployment, commit, push, and operational reactivation remain prohibited.
- The later implementation must not modify `.env.local`, schema, migrations, API routes other than `app/api/admin/login/route.ts`, `proxy.ts`, authentication dependencies, or security dependencies.
- The five protected untracked governance files must remain byte-for-byte unchanged and untracked.

---

## 1. Gemini Authorization and Prohibitions

The controlling authorization is:

```text
Approved phase:
APPROVE_PHASE_27FX_GLOBAL_SECURITY_LEDGER_FINAL_CLOSURE_AUDIT

Authorized workstream:
AUTHORIZE_SELECTED_FINAL_SECURITY_CANDIDATE_FOCUSED_STATIC_INSPECTION

Authorized target:
app/api/admin/login/route.ts

Source inspection: AUTHORIZED
Immediate dependency inspection: AUTHORIZED
Source modification: PROHIBITED
Test creation or modification: PROHIBITED
Test execution: PROHIBITED
Application runtime: PROHIBITED
Database and environment access: PROHIBITED
Operational reactivation: BLOCKED
```

This batch did not reinterpret Gemini approval, activate a later gate, or execute any proposed command that invokes application or test code.

## 2. Repository Baseline and Fail-Closed Preflight

The preflight passed before source contents were inspected:

| Check | Observed value | Result |
|---|---|---|
| Physical repository path | `/Users/jamescarlodumaua/aifinder` | Pass |
| Current branch | `main` | Pass |
| `HEAD` | `9aa271889471ba435738ad44bcca5a767b57a588` | Pass |
| Local `origin/main` | `9aa271889471ba435738ad44bcca5a767b57a588` | Pass |
| Staged tracked changes | None | Pass |
| Unstaged tracked changes | None | Pass |
| Untracked files | Exactly the five protected governance files | Pass |
| Required artifact pre-existence | Absent before this batch | Pass |

No fetch was needed. No reset, clean, discard, stage, commit, or push operation occurred.

## 3. Exact Target and Dependency Scope

### Primary target inspected in full

- `app/api/admin/login/route.ts` (all 218 lines)

### Direct local imports inspected in full

- `lib/admin-audit-log.ts` (required to trace logging, request metadata, database mutation, and caught-error behavior)
- `lib/admin-auth.ts` (required to identify the cookie name and understand the shared session and CSRF primitives)

### Strictly required transitive dependency inspected in full

- `lib/supabase-admin.ts` (imported by `lib/admin-audit-log.ts`; required to establish service-role reachability and its server-only boundary)

### Verified protected security-style references inspected in full

- `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts`
- `app/api/admin/audit-logs/route.ts`

The references were used only for their established route-local `server-only`, fixed categorical logging, fixed operational response, and security-header style. Their authentication, CSRF, database, storage, and mutation flows were not treated as requirements for a public login endpoint.

No unrelated route, UI component, middleware, schema, migration, deployment file, environment file, or test file was inspected.

## 4. SHA-256 and File-Mode Identities

| Role | File | SHA-256 | Mode |
|---|---|---|---|
| Target | `app/api/admin/login/route.ts` | `4d0d2ce96cbd96f31667111bf2c3bc7d1c508d28e961f06a256df50d236a4cdd` | `-rw-r--r--` (`0644`) |
| Direct dependency | `lib/admin-audit-log.ts` | `784205b5c724f5d6fbc626ed91052ce50c99342750d3abaf2baf9b990bd08c8c` | `-rw-r--r--` (`0644`) |
| Direct dependency | `lib/admin-auth.ts` | `b00a3c0f3b4728647e3fea202c2e3b57663a4e567888b828a765df4ba83181dc` | `-rw-r--r--` (`0644`) |
| Strict transitive dependency | `lib/supabase-admin.ts` | `fea8f1b29460bdf245321e6dec80091dc63dd119fa17bface6f6d4980749dbae` | `-rw-r--r--` (`0644`) |
| Protected reference | `app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts` | `b14d5915778be4449eccea9b2269ab02c5158fd8ea9b553fe78a7717ab0029e0` | Tracked regular file |
| Protected reference | `app/api/admin/audit-logs/route.ts` | `7b53e0ddccbd0cad69ed28fd39cb206b547df775696f78522d5cd885adef9295` | Tracked regular file |

Both protected reference identities exactly matched the expected values before they were used.

## 5. Static Validation Method and Threat Boundary

Each candidate was required to establish all of the following before promotion:

- an exact public entry point or module-evaluation path;
- a sensitive or attacker-controlled source;
- the closest present or missing control;
- a reachable logging, comparison, session, cookie, response, database, or privileged-client sink;
- a plausible security impact after applying the strongest nearby counterevidence.

The product surface is the public `POST /api/admin/login` route. The unauthenticated request body and request headers are cross-boundary input. The shared password and session secret are server configuration references. The HMAC cookie is privileged session state. The console and the service-role-backed `admin_audit_logs` insert are logging sinks. Public deployment and proxy behavior were not inspected, so claims requiring ingress behavior are marked `requires runtime evidence` rather than inferred.

## 6. Current Route Control Flow

The current `POST` handler performs this sequence:

1. Derive a client key from the first `x-forwarded-for` value, then `x-real-ip`, then `unknown`.
2. Increment or reject the module-local rate-limit entry.
3. On rate-limit rejection, invoke the database-backed audit helper and return a fixed 429 response.
4. Read `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` references.
5. If configuration is unavailable, log a fixed descriptive sentence, invoke the audit helper, and return a fixed 500 response.
6. Check whether the content-type string contains `application/json`.
7. Trust and compare a numeric `Content-Length` value against 5 KiB.
8. Parse the request with `request.json()` and require a non-array object.
9. Coerce a non-string or empty `password` field to authentication failure.
10. Compare the submitted password with the configured password.
11. Construct `admin:<absolute-expiry-ms>`, HMAC-sign it, and form `<payload>.<signature>`.
12. Record login success through the audit helper before constructing the response or setting the cookie.
13. Return `{ success: true, message: "Admin login successful." }`, set the session cookie, and return.
14. On an unexpected throw, log the raw caught object, invoke the audit helper, and return a fixed 500 response.

Only `POST` is exported as an HTTP method. The route exports `runtime = "nodejs"` and `dynamic = "force-dynamic"`.

## 7. Authentication and Rate-Limit Ordering

The rate-limit check at target lines 77-92 executes before configuration lookup, body parsing, password extraction, and credential comparison. Credential authentication therefore does not occur before the required route-local rate limit.

Request parsing and object validation at lines 116-164 execute before `safeCompare(password, expectedPassword)` at line 166. This ordering is correct. Configuration availability is checked before request-envelope validation; the proposed patch moves that check after safe request parsing so malformed input is categorized before server configuration is consulted, while authentication remains after both controls.

Current limiter properties:

- 10 attempts per 15-minute module-local window;
- every request reaching the handler consumes an attempt, including malformed requests;
- the map is process-local, is reset by process lifecycle, and has no global pruning pass;
- client identity is derived directly from forwarding headers without route-local trusted-proxy validation.

The first three control-flow facts are statically proven. Whether forwarding headers are attacker-spoofable and whether multiple instances weaken the practical limit require deployment evidence outside this batch.

## 8. Credential, Session, and Cookie Behavior

Credential authentication is a single shared-password comparison. The current `safeCompare` exits before `timingSafeEqual` when byte lengths differ; equal-length values use `timingSafeEqual`. This avoids unequal-buffer exceptions but exposes a length-dependent branch before the credential decision.

On successful authentication:

- `expiresAt = Date.now() + 14,400,000` milliseconds;
- payload is `admin:<expiresAt>`;
- signature is HMAC-SHA-256 over the payload using `ADMIN_SESSION_SECRET`;
- cookie value is `<payload>.<hex-signature>`;
- cookie name is the imported `ADMIN_SESSION_COOKIE_NAME`;
- `httpOnly: true`;
- `secure: process.env.NODE_ENV === "production"`;
- `sameSite: "strict"`;
- `maxAge: 14,400` seconds (four hours);
- `path: "/"`;
- no session value, signature, expiry, secret, or cookie value is returned in JSON.

The cookie is server-created only after credential success, so no session-fixation path is supported by the inspected control flow. A stolen cookie remains replayable until expiry because the session is stateless; revocation, rotation, multi-factor authentication, and session inventory are outside the route-local patch.

The login route does not create or validate a CSRF token. Login CSRF is not an applicable finding here because creating the privileged cookie requires knowledge of the shared admin password and the resulting cookie is `SameSite=Strict`. State-changing authenticated routes have separate CSRF primitives in `lib/admin-auth.ts`, but their use is outside this inspection.

## 9. Inspected Logging Sites

### Target console sites

| Location | Current behavior | Sensitive/dynamic content |
|---|---|---|
| `app/api/admin/login/route.ts:98-100` | Logs a descriptive configuration-missing sentence | Fixed literal; does not contain a value |
| `app/api/admin/login/route.ts:205-206` | `console.error("Admin login error:", error)` | Raw caught object can carry message, stack, cause, code, details, or other diagnostics |

### Target audit-helper call sites

| Location | Event details supplied by route | Additional data added by helper |
|---|---|---|
| `route.ts:80-86` | `admin_login_failed`, reason `rate_limited` | IP and user-agent |
| `route.ts:102-108` | `admin_login_failed`, reason `missing_server_environment` | IP and user-agent |
| `route.ts:119-125` | `admin_login_failed`, reason `invalid_content_type` | IP and user-agent |
| `route.ts:134-140` | `admin_login_failed`, reason `request_too_large` | IP and user-agent |
| `route.ts:148-154` | `admin_login_failed`, reason `invalid_body` | IP and user-agent |
| `route.ts:167-173` | `admin_login_failed`, reason `wrong_password` | IP and user-agent |
| `route.ts:183-189` | `admin_login_success`, four-hour maximum age | IP and user-agent |
| `route.ts:208-214` | `admin_login_failed`, reason `server_error` | IP and user-agent |

The route does not pass the password, body, cookie, session value, token, secret, user, email, or identifier to `details`. The helper nevertheless derives and persists `ip_address` and `user_agent` from the request on every call.

### Immediate dependency console and database sites

| Location | Current behavior | Disposition-relevant fact |
|---|---|---|
| `lib/admin-audit-log.ts:69-82` | Service-role insert into `admin_audit_logs` | Persists action, sanitized details, IP, and user-agent |
| `lib/admin-audit-log.ts:84-85` | Logs `error.message` from a Supabase insert failure | Raw provider message, not a fixed category |
| `lib/admin-audit-log.ts:87-88` | Logs raw caught object | May include stack, cause, code, hint, details, or other diagnostics |
| `lib/supabase-admin.ts:8-10` | Throws a fixed configuration error during module evaluation | Occurs before the route handler's `try` if service-role configuration is unavailable |

No inspected site logs a password, request body, session value, cookie value, authentication token, user record, email, or account identifier. No such leakage is claimed.

## 10. Client-Facing Paths

All current responses are constructed through `jsonResponse`, which sets `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.

| Path | Current body | Status | Static assessment |
|---|---|---:|---|
| Rate limited | `{ error: "Too many login attempts. Please wait and try again." }` | 429 | Fixed and safe |
| Admin/session configuration unavailable | `{ error: "Admin login is temporarily unavailable." }` | 500 | Fixed and operationally generic |
| Unsupported content type | `{ error: "Invalid login format." }` | 415 | Fixed; can be normalized |
| Declared request too large | `{ error: "Login request is too large." }` | 413 | Fixed; can be normalized |
| Invalid JSON/body shape | `{ error: "Invalid login request." }` | 400 | Fixed and safe |
| Missing/invalid/wrong password | `{ error: "Wrong password. Please try again." }` | 401 | Fixed and non-enumerating in the current single-account design, but field-specific |
| Success | `{ success: true, message: "Admin login successful." }` | 200 | No session diagnostics |
| Unexpected failure | `{ error: "Admin login failed." }` | 500 | Fixed; no raw diagnostic returned |

No response uses `error.message`, optional `error?.message`, a raw error object, a serialized error, a stack, cause, code, hint, or details. Public diagnostic leakage is therefore rejected as a false positive. The hardening plan reduces the number of distinct public error literals without changing the meaningful status categories.

## 11. Privileged Client and Service-Role Reachability

The target import graph is:

```text
app/api/admin/login/route.ts
  -> lib/admin-audit-log.ts
       -> lib/supabase-admin.ts
            -> @supabase/supabase-js createClient(service-role key reference)
```

`lib/supabase-admin.ts` has its own `import "server-only";`, but the target route lacks a route-local boundary. The route is a Next.js server route with `runtime = "nodejs"`, which is strong counterevidence against current client execution. The missing route-local import is still a defense-in-depth hardening gap and is inconsistent with both protected hardened references.

No Supabase Auth operation occurs. No user lookup, password RPC, session API, storage operation, or route business-data mutation occurs. The only Supabase operation reachable from the login route is the service-role audit insert.

Ordinary paths make one audit-helper call. An exceptional throw after an earlier audit call but before the response is returned can enter the outer catch and make a second audit-helper call. The proposed route-only ceiling is zero privileged-client, database, RPC, storage, Supabase Auth, or audit-database calls.

## 12. Candidate Ledger

The ledger uses only the authorized dispositions.

| ID | Candidate and entry point | Control or missing control | Source | Sink | Reachability | Potential impact | Existing mitigation/counterevidence | Final disposition |
|---|---|---|---|---|---|---|---|---|
| AL-01 | Public login route module lacks route-local server isolation | Missing first-statement `import "server-only";` | Server configuration and transitive privileged import graph | Route module/bundle boundary | Module evaluation precedes every request | Accidental unsafe reuse or weakened defense-in-depth around server code | Next route handlers are server-side; Node runtime is declared; transitive `supabase-admin` is server-only | hardening gap |
| AL-02 | Unexpected `POST` failure reaches target catch | Catch binds and logs the raw object | Any thrown object from parsing helpers, crypto, response, or cookie construction | `console.error` at target line 206 | Reachable whenever an unexpected throw escapes | Internal diagnostics may enter operational logs | Client receives a fixed 500; no proof that a current throw contains credentials | validated finding |
| AL-03 | Any audit insert/catch failure in the direct helper | No categorical-only error boundary in helper | Supabase error message or caught object | `console.error` at dependency lines 85 and 88 | Every target audit call can reach the insert-failure branch; thrown helper faults can reach catch | Provider diagnostics, stack, cause, code, hint, or details may enter logs | Logs are server-side; helper sanitizes event details but not error diagnostics | validated finding |
| AL-04 | Every current audit-helper path from public login | Helper always derives request metadata | Forwarding IP headers and `user-agent` | Service-role insert fields `ip_address` and `user_agent` | All eight target audit call sites | Attacker-controlled and potentially personal metadata is persisted; spoofed values can reduce audit integrity | Control characters are stripped from details and values are length-bounded; audit storage is intentional | validated finding |
| AL-05 | Public route import and every audit event | Privileged service-role client is used for non-authentication telemetry | Fixed event data plus request metadata | `supabaseAdmin.from("admin_audit_logs").insert` | Module import is unconditional; normal path makes one insert attempt, rare exceptional path can make two | Expands secret-bearing dependency reach, adds an import-time configuration failure, and permits database mutation from an unauthenticated route | Insert target and record shape are fixed; service client is transitively server-only | hardening gap |
| AL-06 | Valid credential path | Success audit occurs before response and cookie creation | Successful password decision | Database success record | Target lines 183-189 precede lines 191-202 | A later response/cookie failure can leave a success record and then a failure record | Outer catch records failure, but that can create contradictory telemetry | hardening gap |
| AL-07 | Public JSON request parsing | Content type uses substring matching; byte cap trusts `Content-Length`; absent, invalid, negative, or understated lengths are not an actual-body control | Request headers and body | `request.json()` | Reached after the rate limit and before authentication | Oversized input can be parsed despite the declared 5 KiB cap; malformed media types can pass the substring check | Rate limit is first; JSON parsing is caught; object shape is checked | hardening gap |
| AL-08 | Password comparison | Unequal byte lengths return before `timingSafeEqual` | Submitted password length | Authentication decision timing | Every non-empty string password on a valid request | Repeated timing measurements could reveal configured-password length and narrow brute-force search | Equal-length values use `timingSafeEqual`; rate limiting and network noise reduce exploitability | hardening gap |
| AL-09 | Malformed, credential, configuration, and unexpected response branches | Fixed strings exist but are not reduced to a minimum categorical taxonomy; credential error says `Wrong password` | Failure category | Public JSON error field | Directly reachable | Field-specific wording is unnecessary and is less future-proof if account identifiers are later introduced | All strings are fixed; current route has no username/email/account lookup, so no current enumeration is proven | hardening gap |
| AL-10 | Rate-limit key derivation | Route trusts first `x-forwarded-for`, then `x-real-ip`, without a route-local trusted-proxy control | Request headers | `loginRateLimitMap` key and subsequent credential comparison | Statically connected; attacker control depends on ingress behavior | Spoofing could bypass limits or exhaust another client's quota | Managed proxies may overwrite/sanitize these headers; deployment configuration was intentionally out of scope | requires runtime evidence |
| AL-11 | Module-local limiter across lifecycle and scale | Process-local map is not shared and has no global pruning pass | Repeated requests and distinct client keys | Map growth and credential comparison access | Static implementation is proven; deployment multiplicity and traffic model are not | Cold starts/multiple instances can weaken brute-force limits; high-cardinality keys can grow memory | Per-key 10-attempt/15-minute control is correctly ordered | deferred with exact reason: resolving this requires deployment evidence and a shared limiter or broader dependency, which are prohibited by the route-only no-database/no-runtime gate |
| AL-12 | Error paths returning raw internal diagnostics | Central response helper and fixed literal bodies block the claimed sink | Internal errors | Public JSON | No dynamic source-to-response path exists | None supported | All eight response categories are fixed; outer catch does not return its object | false positive |
| AL-13 | Success response exposing session state | Response object contains only success and message | Session value, signature, expiry | Public JSON | No source-to-response assignment exists | None supported | Session is delivered only as an HttpOnly cookie | false positive |
| AL-14 | Credential authentication before rate limiting | Rate-limit guard is first security decision | Password | `safeCompare` | Authentication is reachable only after allowed rate limit | None supported | Exact control-flow ordering disproves the candidate | false positive |
| AL-15 | Request parsing/validation after authentication | Content type, declared size, JSON parse, body shape, and password type conversion precede comparison | Request body | Credential comparison | Authentication is downstream | None supported | Exact control-flow ordering disproves the candidate; AL-07 separately records envelope completeness | false positive |
| AL-16 | Dynamic rate-limit, authentication, or unexpected errors | Fixed literals are used on all three paths | Internal/credential state | Public error bodies | No dynamic value reaches the bodies | None supported | Wording normalization in AL-09 is defense-in-depth, not evidence of raw leakage | false positive |
| AL-17 | Cookie flag failure or session fixation | Server constructs a signed value after successful authentication and sets bounded secure attributes | Submitted request and server secret | Session cookie | Attacker cannot choose a valid payload/signature without the secret | None supported | HttpOnly, production Secure, SameSite Strict, path `/`, four-hour max age, signed absolute expiry | false positive |
| AL-18 | Authentication bypass or account enumeration | A non-empty configured password must pass comparison; there is no account identifier lookup | Password | Session creation | Session code is downstream of successful comparison | None supported | Rate limit, HMAC cookie, fixed current credential error, and absence of username/email branches defeat the claim | false positive |
| AL-19 | Missing anti-cache or MIME-sniff protections | Central helper applies both headers | Every response payload | HTTP response | All return paths use `jsonResponse` | None supported | `no-store` and `nosniff` are present | false positive |
| AL-20 | CSRF missing from credential-establishing login | No pre-existing privileged state is mutated without the shared secret | Cross-site request | Session cookie creation | A valid password is still required | No independent CSRF impact supported | SameSite Strict cookie; authenticated mutation routes use separate CSRF primitives | not applicable |
| AL-21 | Excessive credential, session, cookie, Auth, RPC, or storage calls | One compare, one signing operation, and one cookie set on success; no Supabase Auth/RPC/storage path | Valid request | Authentication/session sinks | Exact call sites are bounded | None supported apart from the separate audit-database reach in AL-05 | Minimal core authentication flow | false positive |

## 13. Validated Findings and Hardening Gaps

### Validated findings (3)

1. Raw caught-error logging in the target route (`AL-02`).
2. Raw Supabase message and caught-error logging in the reachable audit dependency (`AL-03`).
3. Automatic persistence of request IP and user-agent through every target audit path (`AL-04`).

These are concrete logging flows, not pattern-only matches. No password, cookie value, token, session value, body, user, email, or account identifier leakage was found.

### Hardening gaps (6)

1. Missing route-local `server-only` import (`AL-01`).
2. Unnecessary service-role/audit-database reachability from the login route (`AL-05`).
3. Login-success telemetry occurs before cookie completion (`AL-06`).
4. Request media-type and actual-byte-size controls are incomplete (`AL-07`).
5. Password comparison has a length-dependent early return (`AL-08`).
6. Public errors are fixed but not reduced to the minimum generic taxonomy (`AL-09`).

The process-local rate-limit architecture is explicitly deferred rather than hidden inside the route patch.

## 14. Rejected False Positives

- No internal, provider, validation, or caught-error message is returned dynamically.
- No raw or serialized error object is returned.
- No session value, signature, expiry, secret, or cookie value is returned in JSON.
- Authentication does not precede rate limiting.
- Request parsing and body validation do not occur after credential comparison.
- The route does not call Supabase Auth, an authentication RPC, storage, or a user database.
- No authentication bypass, account enumeration, or session-fixation path is supported.
- All responses receive `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
- Core authentication/session calls are already minimal; the audit insert is the distinct privileged-call gap.

## 15. Proposed Fixed Categorical Event Contract

Malformed requests should not create log events; their fixed public responses are sufficient and avoiding them limits attacker-controlled log volume. Exactly five fixed events are required:

| Event literal | Failure/success path | Returns or throws | Public response | Status | Sensitive values explicitly excluded |
|---|---|---|---|---:|---|
| `admin_login_rate_limited` | Rate-limit rejection | Logs once, then returns | `{ error: "Too many login attempts. Please wait and try again." }` | 429 | Request, body, password, token, cookie, session, user, email, identifier, IP, user-agent, error, status details |
| `admin_login_configuration_unavailable` | Required password/session configuration reference is absent | Logs once, then returns | `{ error: "Admin login is temporarily unavailable." }` | 500 | Environment names beyond the event category, values, secret, password, session, error object |
| `admin_login_invalid_credentials` | Missing, non-string, empty, or non-matching password | Logs once, then returns | `{ error: "Invalid credentials." }` | 401 | Password, length, body, IP, user-agent, account or identifier data |
| `admin_login_success` | Cookie has been constructed and set successfully | Logs once after cookie set, then returns | Existing success body | 200 | Password, secret, payload, signature, session value, cookie, expiry, IP, user-agent |
| `admin_login_unexpected_failure` | Any unexpected throw, including session/response/cookie construction failure | Catch has no binding; logs once, then returns | `{ error: "Admin login is temporarily unavailable." }` | 500 | Error object, message, stack, cause, code, hint, details, request or authentication data |

Every console call must have exactly one string-literal argument from this allowlist. No value or object may be appended.

## 16. Proposed Fixed Public-Error Contract

Use four error literals and preserve meaningful status categories:

| Category | Fixed response | Status behavior |
|---|---|---|
| Malformed request | `{ error: "Invalid login request." }` | 415 for unsupported media type, 413 for excessive declared/actual bytes, 400 for invalid length syntax, JSON, or body shape |
| Rate-limit rejection | `{ error: "Too many login attempts. Please wait and try again." }` | 429 |
| Invalid credentials | `{ error: "Invalid credentials." }` | 401 |
| Configuration, session creation, or unexpected operational failure | `{ error: "Admin login is temporarily unavailable." }` | 500 |
| Successful authentication | `{ success: true, message: "Admin login successful." }` | 200 |

There is no username, email, or user identifier in the request contract. The same credential error covers missing, malformed, empty, and incorrect password values, so no account-existence distinction is created.

## 17. Proposed Focused Static Test Contract

Proposed file, not created by this batch:

```text
testing/admin-login-route-security-static-assertions.mjs
```

The test must read source as text and parse it with the installed TypeScript compiler API. It must not import the route or any application module. Function-scoped checks should use AST node boundaries for `POST`, `jsonResponse`, request parsing, comparison, and session construction. Hash checks should use `node:crypto`. Assertions should execute in the order below and stop on the first failure.

Proposed assertion count: **36**.

Expected first failing assertion on the current baseline: **A01 — route-local `server-only` isolation**.

| ID / assertion purpose | Required source marker or structural condition | Forbidden marker or condition | Current baseline expectation |
|---|---|---|---|
| A01 Route-local isolation | First executable statement is side-effect import `"server-only"` | Missing, indirect, or later-only server boundary | **FAIL — expected first failure** |
| A02 HTTP method surface | Exported route method set is exactly `{ POST }` | `GET`, `PUT`, `PATCH`, `DELETE`, `HEAD`, or `OPTIONS` exports | Pass |
| A03 Runtime surface | Exact `runtime = "nodejs"` and `dynamic = "force-dynamic"` exports | Edge runtime or missing dynamic marker | Pass |
| A04 Rate-limit ceiling/order | Exactly one `checkRateLimit` call in `POST`, before body consumption and credential comparison | Any comparison/authentication call before it or a second limiter call | Pass |
| A05 Parse/validation before authentication | Content type, size, body parse, object check, and password extraction precede the credential comparison | Credential comparison in any earlier branch | Pass |
| A06 Strict media type | Normalized media type equals `application/json` | Substring-only `includes("application/json")` acceptance | Fail after A01 |
| A07 Declared-length validation | Present header must be finite non-negative integer and must not exceed 5 KiB | `Number(...)` comparison without validity checks | Fail after A01 |
| A08 Actual-byte limit | Parsed raw text byte length is checked against 5 KiB before `JSON.parse` and authentication | Reliance on `Content-Length` alone or direct `request.json()` | Fail after A01 |
| A09 Body-shape validation | Parsed value must be non-null object and not array | Blind property access before shape check | Pass |
| A10 Configuration ordering | Body envelope and shape validation precede configuration check; configuration check precedes credential comparison | Server configuration branch before parsing or comparison before config check | Fail after A01 |
| A11 Fixed-length credential comparison | `safeCompare` hashes both strings to SHA-256 buffers and calls `timingSafeEqual` once | Early return based on original string/buffer length | Fail after A01 |
| A12 Credential-authentication ceiling | Exactly one call comparing submitted password with configured password | Additional compare, user lookup, Auth call, or credential RPC | Pass |
| A13 Session/cookie ceilings | At most one `signSession` call and exactly one success-path `cookies.set` | Multiple session creation or cookie writes | Pass |
| A14 Rate-limit public response | Fixed approved literal and status 429 in the denied branch | Dynamic value, error object, or alternate status | Pass |
| A15 Malformed public responses | Only the approved malformed literal, with 400/413/415 as structurally appropriate | Detailed parser/field/size literals or dynamic validation messages | Fail after A01 |
| A16 Authentication public response | Fixed `Invalid credentials.` and status 401 | `Wrong password`, account-specific, email-specific, or dynamic text | Fail after A01 |
| A17 Operational public response | One fixed operational literal shared by configuration, session creation, and unexpected failures, status 500 | Multiple operational literals or diagnostic values | Fail after A01 |
| A18 Success response preservation | Exact fields `success: true` and `message: "Admin login successful."` only | Removal/renaming or extra auth/session fields | Pass |
| A19 Session diagnostics exclusion | No response property for token, cookie, session, signature, payload, expiry, secret, user, or identifier | Any such response field | Pass |
| A20 Dynamic-error response rejection | Every `error` response value resolves to an approved string literal/constant | `.message`, optional `.message`, template interpolation, caught object, or non-approved identifier | Pass |
| A21 Serialized-error rejection | No response serializes, spreads, stringifies, or directly includes an error | `JSON.stringify(error)`, `String(error)`, `{...error}`, or `{ error }` | Pass |
| A22 Fixed categorical logging | Every console call has exactly one string-literal argument | Appended values, objects, templates, multiple args, or nonliteral args | Fail after A01 |
| A23 Exact event allowlist | The five approved event literals occur exactly once in their structural paths | Missing event, extra event, descriptive prose, or duplicate event | Fail after A01 |
| A24 Raw message rejection | No reachable console argument uses `.message` or `?.message` | Direct or optional raw message access in target graph | Fail after A01 because the audit helper is reachable |
| A25 Raw caught-object rejection | Outer `POST` uses `catch {}` and no catch binding is logged | `catch (error)` plus any use, especially a console argument | Fail after A01 |
| A26 Diagnostic-field rejection | No logging/audit call reads stack, cause, details, hint, or code from an error | Any of those property reads in the reachable target graph | Fail after A01 because raw helper errors/details are reachable |
| A27 Sensitive-log rejection | Console calls are literal-only and no audit/logger call receives request, body, password, token, cookie, session, user, email, identifier, IP, or user-agent data | Any sensitive/dynamic logging argument or implicit request-metadata logger | Fail after A01 |
| A28 Audit-helper removal | No import, reference, or call to `createAdminAuditLog` | Audit helper import/call | Fail after A01 |
| A29 Privileged-client ceiling | No direct or transitive route import of `supabaseAdmin`, `supabase-admin`, or Supabase client creation | Any privileged-client reachability | Fail after A01 |
| A30 No new operational calls | Zero database `.from`, `.insert`, `.update`, `.delete`, `.rpc`, storage, Supabase Auth, `signIn`, `setSession`, or analogous calls; allow only local HMAC plus one cookie set | Any new database, RPC, storage, authentication-provider, session API, or mutation call | Fail after A01 through current audit insert reachability |
| A31 Session ordering | Successful credential decision precedes expiry, payload, signature, response, and cookie creation; success event follows cookie set | Session construction before auth or success event before cookie set | Fail after A01 because current success audit precedes cookie set |
| A32 Cookie/security preservation | Cookie name constant, `httpOnly: true`, production-conditional `secure`, `sameSite: "strict"`, four-hour `maxAge`, `path: "/"` | Weaker/missing attribute, broader domain, or unbounded lifetime | Pass |
| A33 Response-header preservation | Only `jsonResponse` calls `NextResponse.json`; it sets exact `no-store` and `nosniff`; all return bodies use it or a fixed wrapper around it | Direct unprotected JSON response path | Pass |
| A34 Immediate-dependency identities | SHA-256 equals `784205...8c8c`, `b00a3c...81dc`, and `fea8f1...bae` for the three inspected local dependencies | Missing or changed dependency | Pass |
| A35 Protected-reference identities | SHA-256 equals the two authorized protected hashes | Missing or changed reference | Pass |
| A36 Fail-closed unexpected path | Binding-free catch logs only `admin_login_unexpected_failure` and returns the fixed operational 500 through protected helper | Rethrow, raw log, dynamic response, missing headers, or success fallthrough | Fail after A01 |

The test's exact final success marker should be:

```text
PASS: admin login route security static assertions (36 assertions)
```

## 18. Implementation-Ready Route-Only Patch Plan

This plan is for the recommended successor phase only.

### Task 1: Create the approved failing static contract

**Files:**

- Create: `testing/admin-login-route-security-static-assertions.mjs`
- Read only and hash: the target, three inspected local dependencies, and two protected references

**Required steps:**

1. Implement AST-bounded helpers for imports, exported HTTP methods, named-function bodies, call counts, branch-local response checks, console arguments, catch bindings, response object fields, and cookie options.
2. Implement the 36 assertions in exact A01-A36 order.
3. Print only the exact success marker after all assertions pass.
4. Run the test only in the later approved batch. The baseline must stop at A01 with the missing route-local `server-only` assertion.

### Task 2: Apply the smallest route-local source hardening

**Files:**

- Modify only: `app/api/admin/login/route.ts`
- Leave unchanged: `lib/admin-audit-log.ts`, `lib/admin-auth.ts`, `lib/supabase-admin.ts`, both protected references, all other source, all existing tests, schema, migrations, configuration, and governance files

#### Exact import changes

1. Add `import "server-only";` as the first executable statement.
2. Change the crypto import to `createHash`, `createHmac`, and `timingSafeEqual`.
3. Remove the `createAdminAuditLog` import completely.
4. Preserve `NextResponse` and `ADMIN_SESSION_COOKIE_NAME` imports.
5. Add no package, Supabase, database, rate-limit, Auth, RPC, storage, or session-library import.

#### Exact comparison change

Replace the unequal-length early return with a fixed-length digest comparison:

```ts
function safeCompare(first: string, second: string) {
  const firstDigest = createHash("sha256").update(first, "utf8").digest();
  const secondDigest = createHash("sha256").update(second, "utf8").digest();

  return timingSafeEqual(firstDigest, secondDigest);
}
```

This preserves one credential decision while removing original-length-dependent control flow.

#### Exact request-parsing change

1. Normalize the media type by splitting at `;`, trimming, and lowercasing; require exact `application/json`.
2. If `Content-Length` is present, require decimal digits representing a finite non-negative integer; return the generic malformed response if invalid and 413 if greater than 5 KiB.
3. Read request text with a caught failure, calculate actual UTF-8 bytes with `Buffer.byteLength(rawBody, "utf8")`, and return 413 when actual bytes exceed 5 KiB.
4. Parse with `JSON.parse` inside a local catch; return 400 on parse failure.
5. Preserve the non-null object/non-array requirement.
6. Derive a string password only after those checks. Missing, non-string, empty, and wrong values share the generic 401 credential response.

The actual-byte check bounds what proceeds to JSON parsing and authentication. Transport-level buffering before the handler remains a platform concern and must not be overclaimed.

#### Exact logging replacements

1. Replace the rate-limit audit call with `console.warn("admin_login_rate_limited")`.
2. Replace the verbose configuration console call and its audit call with `console.error("admin_login_configuration_unavailable")`.
3. Remove audit calls for content type, excessive size, and invalid body; add no console event for malformed requests.
4. Replace the wrong-password audit call with `console.warn("admin_login_invalid_credentials")`.
5. Remove the database success audit. After `response.cookies.set(...)` succeeds, add `console.info("admin_login_success")` immediately before returning.
6. Change `catch (error)` to `catch {}`. Replace the raw console call and failure audit call with `console.error("admin_login_unexpected_failure")`.
7. Every console call must have one argument and that argument must be the exact fixed event literal.

#### Exact public-response changes

1. Define or otherwise structurally centralize these four fixed literals:
   - `Invalid login request.`
   - `Too many login attempts. Please wait and try again.`
   - `Invalid credentials.`
   - `Admin login is temporarily unavailable.`
2. Use the malformed literal for 400, 413, and 415.
3. Preserve the rate-limit literal and 429.
4. Replace `Wrong password. Please try again.` with `Invalid credentials.` at 401.
5. Use the one operational literal for missing configuration, session/response/cookie construction failure, and all unexpected failures at 500.
6. Preserve the exact success fields and 200 status.
7. Preserve centralized `no-store` and `nosniff` headers on every response.

#### Exact ordering to preserve

```text
derive limiter key
-> check rate limit exactly once
-> reject safely if denied
-> validate content type, declared length, actual bytes, JSON, and object shape
-> read/check required server configuration references
-> derive password string
-> compare credentials exactly once
-> reject invalid credentials safely
-> create absolute expiry, payload, HMAC signature, and session value
-> construct protected JSON response
-> set secure bounded cookie exactly once
-> log fixed success event
-> return
```

The outer binding-free catch remains the final fail-closed path.

#### Cookie/session behavior that must remain exact

- Payload role remains `admin`.
- Absolute signed expiry remains four hours from creation.
- HMAC-SHA-256 remains the session-signing primitive.
- Cookie name remains `ADMIN_SESSION_COOKIE_NAME`.
- `httpOnly`, production `secure`, `sameSite: "strict"`, four-hour `maxAge`, and root path remain unchanged.
- No token/session details are added to JSON.

#### Authentication and privileged-call ceilings

- `checkRateLimit`: exactly 1 per handler invocation.
- Credential comparison: at most 1, only after parsing/configuration controls.
- `signSession`: at most 1, only after successful comparison.
- `response.cookies.set`: at most 1.
- Supabase Auth/user lookup/password RPC: 0.
- `createAdminAuditLog`: 0.
- Privileged client, database, RPC, storage, or business mutation calls: 0.
- New network/external-service calls: 0.

### Task 3: Verify the later patch without broadening scope

Expected failing baseline:

```text
A01 fails because app/api/admin/login/route.ts does not have a route-local first-statement import "server-only".
```

Expected final success marker:

```text
PASS: admin login route security static assertions (36 assertions)
```

The implementation worker must stop if the first baseline failure differs, because that indicates a changed baseline or an invalid test contract.

## 19. Exact Later Verification Commands

These commands are proposed only for the later authorized implementation phase; none was executed in this batch:

```bash
pwd -P
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git status --short --branch --untracked-files=all
shasum -a 256 lib/admin-audit-log.ts lib/admin-auth.ts lib/supabase-admin.ts
shasum -a 256 'app/api/admin/discovery/discovered-tools/[id]/duplicate/route.ts' app/api/admin/audit-logs/route.ts
node testing/admin-login-route-security-static-assertions.mjs
./node_modules/.bin/tsc --noEmit
npm run check
npm run build
rg -n 'createAdminAuditLog|supabaseAdmin|error\?*\.message|\.stack|\.cause|\.hint|\.code|console\.(log|info|warn|error)\([^)]*,' app/api/admin/login/route.ts
rg -n 'password|token|cookie|session|user|email|identifier|clientIp|userAgent|x-forwarded-for|x-real-ip' app/api/admin/login/route.ts
git diff --check
git status --short --branch --untracked-files=all
git diff --stat
git diff -- app/api/admin/login/route.ts testing/admin-login-route-security-static-assertions.mjs
```

Interpretation requirements:

- The first static-test run on the required baseline must fail at A01.
- After the route-only patch, the static test must print the exact 36-assertion success marker.
- The first leakage scan must return no matches; exit status 1 is the expected clean result.
- The second scan is an inventory, not a finding. The worker must inspect context and confirm sensitive names appear only in authentication/session logic, never in console or audit/logger arguments.
- `npm run check` and `npm run build` are later implementation gates, not evidence from this batch.

## 20. Negative Leakage Scans for the Later Phase

In addition to the AST assertions, the later reviewer must inspect:

- every console call and confirm exactly one approved literal argument;
- absence of `.message`, `?.message`, stack, cause, hint, code, details, raw catch objects, and serialized errors in logging/response contexts;
- absence of the audit helper and all Supabase/privileged-client imports or calls;
- absence of request, body, password, token, cookie, session, user, email, identifier, IP, and user-agent values in any log call;
- absence of dynamic error response values;
- exact preservation of the response header helper and success JSON;
- exact cookie attributes and four-hour lifetime;
- exact call ceilings.

Pattern matches are inventory only. A failure requires function-scoped or AST-bounded evidence.

## 21. Rollback Procedure for a Failed Later Implementation

1. Stop immediately; do not continue patching after a changed first failure, dependency hash mismatch, or protected-file mismatch.
2. Record `git status --short --branch`, `git diff --stat`, and the focused diff for the two authorized later files.
3. Do not use `git reset`, `git clean`, `git checkout`, broad restore commands, or destructive deletion.
4. Prepare a targeted inverse `apply_patch` limited to `app/api/admin/login/route.ts`; have James approve removal of the newly created test file if rollback requires deleting it.
5. Recompute the target/dependency/reference/governance hashes and confirm no unrelated file changed.
6. Report the exact failing assertion and retain operational reactivation as blocked.

## 22. Unresolved Risks Outside the Route-Local Patch

- Forwarding-header trust cannot be resolved without approved ingress/deployment evidence.
- A process-local map is not a distributed, restart-stable limiter and has no global high-cardinality pruning. Replacing it needs a separately approved architecture and potentially an external/shared store.
- Reading request text permits an actual-byte check before JSON parsing but does not prevent platform/runtime buffering before handler code.
- Stateless signed cookies cannot be individually revoked and remain replayable if stolen until their four-hour expiry.
- A single shared admin password provides no named admin identity, MFA, per-user lockout, or credential-specific audit attribution.
- Removing the database audit helper eliminates login events from `admin_audit_logs`; the proposed fixed platform events require appropriate log retention/access controls. Whether a separate safe audit sink is required is a governance decision.
- Environment-secret rotation and dual-key session rollover are not addressed.
- CSRF behavior of authenticated mutation routes is not assessed here.

None of these risks authorizes broader work in the successor route-only batch.

## 23. Protected Governance Files

The following identities were recorded before artifact creation and must match the final verification:

| File | SHA-256 before | Required final state |
|---|---|---|
| `docs/discovery-phase-27fl-discovered-tool-duplicate-source-hardening-patch-planning-gate.md` | `6fe6e3d7abb1a5586bc3699ca7bfa6b9712dd355f45e0710bd714b1d94a7ce12` | Same hash; untracked |
| `docs/discovery-phase-27fp-global-security-ledger-final-audit-reselection-gate.md` | `704b24609649b43d54a8a1dbfa0449ea346518c00186bb5eba305b7a39641f9a` | Same hash; untracked |
| `docs/discovery-phase-27fq-audit-logs-focused-static-inspection-and-test-contract-planning-gate.md` | `2e215686d2efcc7b7b744110af3bc69cb64f46c18512f9797b23c8ba9e7cb723` | Same hash; untracked |
| `docs/discovery-phase-27ft-audit-logs-source-hardening-patch-planning-gate.md` | `96bbe26236b7d69a48b46143c5eedd6776edd765f8143eeb43c5e66e187d19ca` | Same hash; untracked |
| `docs/discovery-phase-27fx-global-security-ledger-final-closure-audit-gate.md` | `5353221fcd406aae20c992d5cd254b11a09cb37ddcda06468573e4ce03b67e45` | Same hash; untracked |

Post-artifact verification confirmed that all five after-batch hashes equal the recorded before-batch hashes and that every protected governance file remains untracked.

## 24. Batch Boundary Confirmation

- No source file was modified.
- No test file was created or modified.
- No test was executed.
- No application module was imported or executed.
- No Next.js or other application runtime was started.
- No route was invoked.
- No browser was executed.
- No database, Supabase CLI, environment file, environment value, external service, or network was accessed.
- No package, lockfile, schema, migration, generated type, deployment, publication, commit, or push action occurred.
- Exactly one documentation file was created: this review artifact.
- Operational reactivation remains blocked.

## 25. Recommended Successor

Unless Gemini identifies a governance blocker, recommend exactly:

```text
AUTHORIZE_ADMIN_LOGIN_FOCUSED_SECURITY_TEST_AND_SOURCE_HARDENING_BATCH
```

That later gate may authorize the following single review cycle:

```text
test creation
-> expected failing baseline at A01
-> route-only implementation
-> focused debugging
-> passing static proof
```

It does not imply database, dependency, schema, deployment, commit, push, or operational authorization.

## 26. Concise Gemini Review Request

Gemini: please verify the three validated logging findings, six route-hardening gaps, nine rejected false positives, one runtime-evidence item, one exact deferral, and one not-applicable CSRF candidate. Confirm whether the 36-assertion static contract, five fixed categorical events, four fixed public errors, zero privileged-call ceiling, preserved cookie/session behavior, and route-only patch plan are approved. If approved, authorize only `AUTHORIZE_ADMIN_LOGIN_FOCUSED_SECURITY_TEST_AND_SOURCE_HARDENING_BATCH`; operational reactivation must remain blocked.
