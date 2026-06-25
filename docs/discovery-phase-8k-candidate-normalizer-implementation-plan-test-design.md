# Phase 8K — Candidate Extraction Normalizer Implementation Plan / Test Design

## Status / Scope

Phase 8K is a docs-only planning and test-design phase for a future candidate extraction normalizer.

This document defines the future helper contract, validation rules, fail-closed rejection rules, field mapping, redaction requirements, and test design for a future `DiscoveryCandidateNormalizer`. It does not implement the helper, add tests, apply migrations, update generated types, add API/UI behavior, or write candidate records.

Candidate extraction remains not implementation-ready after Phase 8K.

## Background

Phase 8I created and pushed the real migration file for the future dedicated candidate staging table:

```text
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql
```

Phase 8J then defined the staging candidate lifecycle and normalization plan at a system level.

Important current state:

- The `public.discovery_candidate_tools` migration file exists in the repo.
- The migration has not been applied.
- Generated Supabase types have not been refreshed.
- No normalizer implementation exists.
- No candidate extraction implementation exists.
- No candidate staging writes exist.
- No tests for candidate normalization exist yet.

Phase 8K narrows the next planning step to a future pure helper: `DiscoveryCandidateNormalizer`.

## Non-goals

Phase 8K does not:

- apply the migration;
- run `supabase db push`;
- modify generated Supabase types;
- add source code;
- add tests;
- add UI behavior;
- add API behavior;
- implement extraction;
- implement the normalizer;
- create candidates;
- write to `discovery_candidate_tools`;
- write to `discovered_tools`;
- write to `public.tools`;
- add approval, publish, ranking, recommendation, LLM, automation, scheduler, cron, crawler, or browser automation behavior;
- expose or store raw HTML, headers, cookies, secrets, raw metadata, raw stats, raw JSON dumps, snippets, stack traces, transport payloads, raw candidate payloads, discovered/public tool payloads, or LLM prompts/responses.

## Phase 8J State Carried Forward

Phase 8J established:

- candidate normalization must be deterministic and fail-closed;
- every input field must be treated as hostile;
- normalization output must be allowlisted and compatible with `public.discovery_candidate_tools`;
- raw extraction input must remain temporary and in-memory only;
- unknown fields must be dropped;
- required unsafe fields must reject the candidate;
- human review fields must remain empty until a future admin review workflow;
- duplicate signals must remain advisory;
- confidence buckets must remain coarse and non-public;
- direct `public.tools` writes remain forbidden;
- direct `discovered_tools` writes remain forbidden;
- promotion/publish workflows remain out of scope.

The Phase 8I migration constrains staging status values to:

- `staged`
- `needs_review`
- `duplicate_suspected`
- `rejected`
- `archived`

It also rejects production-state labels such as `approved`, `published`, `promoted`, `live`, and `public`.

## Future Normalizer Helper Contract

Preferred future helper name:

```text
DiscoveryCandidateNormalizer
```

Preferred future file, subject to Gemini review:

```text
lib/discovery-candidate-normalizer.ts
```

The future helper should be pure and deterministic where practical. It should accept candidate-like extracted data as a temporary in-memory object, normalize it, and return either a safe staging object or a safe rejection result.

Conceptual future API:

```text
DiscoveryCandidateNormalizer.normalize(input) -> NormalizedCandidateResult
```

Conceptual result variants:

```text
accepted:
  ok: true
  candidate: SafeDiscoveryCandidateToolInsert
  warnings: SafeNormalizerWarning[]

rejected:
  ok: false
  rejection_code: SafeRejectionCode
  warnings: SafeNormalizerWarning[]
```

The helper must not:

- persist anything;
- query the database directly in the first pure normalizer implementation;
- call external networks;
- call LLMs;
- create candidates;
- write to `discovery_candidate_tools`;
- write to `discovered_tools`;
- write to `public.tools`;
- return raw input;
- return raw parser payloads;
- return raw metadata;
- return raw HTML;
- return snippets;
- return transport payloads;
- return stack traces.

Duplicate advisory checks may later wrap this pure normalizer in a separate service. The pure normalizer should be testable without a database.

## Conceptual Input Shape

The future helper may accept a temporary in-memory object with fields such as:

```text
{
  discovery_run_id,
  source_url,
  source_url_normalized,
  source_domain,
  source_evidence_kind,
  source_evidence_locator,
  extraction_mode,
  extraction_version,
  candidate_name,
  candidate_website_url,
  candidate_description,
  candidate_category_hint,
  candidate_pricing_hint,
  candidate_platform_hints,
  candidate_social_links,
  candidate_app_links,
  evidence_summary,
  confidence_signals,
  risk_flags,
  duplicate_signals
}
```

Input rules:

- input exists only in memory;
- input must not be persisted as raw payload;
- input may be partial or hostile;
- input may contain unknown fields, but unknown fields must be dropped;
- input must not be echoed into errors or logs;
- input must not be used as a raw JSON dump;
- input must not include raw HTML, raw metadata, headers, cookies, stack traces, transport payloads, or LLM prompts/responses.

If future extraction produces raw parser details, those details must be discarded before calling the normalizer or rejected by the normalizer.

## Safe Output Shape

Accepted output may include only safe staging fields compatible with `public.discovery_candidate_tools`.

Safe output fields:

- `discovery_run_id`
- `source_url`
- `source_url_normalized`
- `source_domain`
- `source_evidence_kind`
- `source_evidence_locator`
- `extraction_mode`
- `extraction_version`
- `candidate_name`
- `candidate_website_url`
- `candidate_canonical_url`
- `candidate_normalized_domain`
- `candidate_description`
- `candidate_category_hint`
- `candidate_pricing_hint`
- `candidate_platform_hints`
- `candidate_social_links`
- `candidate_app_links`
- `evidence_summary`
- `confidence_bucket`
- `risk_flags`
- `duplicate_check_status`
- `duplicate_signal_types`
- `duplicate_blocking`
- `possible_duplicate_tool_id`
- `possible_duplicate_discovered_tool_id`
- `possible_duplicate_candidate_id`
- `duplicate_checked_at`
- `candidate_status`
- `reviewed_at`
- `reviewed_by`
- `review_notes`
- `rejection_reason_code`
- `audit_correlation_id`
- `cleanup_status`
- `eligible_for_cleanup_at`
- `archived_at`

Default safe output rules:

- `candidate_status`: `staged`
- `duplicate_check_status`: `not_checked`
- `duplicate_blocking`: `false`
- `reviewed_at`: `null`
- `reviewed_by`: `null`
- `review_notes`: `null`
- `rejection_reason_code`: `null`
- `cleanup_status`: `active`
- `eligible_for_cleanup_at`: `null`
- `archived_at`: `null`

The helper must never output raw input payloads, full metadata objects, raw stats, raw transport details, raw JSON dumps, LLM payloads, or public/discovered tool payloads.

## Field Mapping Rules

| Source concept | Output field | Mapping rule |
| --- | --- | --- |
| Discovery run ID | `discovery_run_id` | Require UUID-shaped value. Reject missing or invalid value. |
| Source URL | `source_url` | Trim, validate HTTPS, reject credentials/local/private/internal domains. |
| Normalized source URL | `source_url_normalized` | Derive from source URL if absent; strip fragment and unsafe tracking query values where appropriate. |
| Source domain | `source_domain` | Lowercase normalized domain derived from source URL. |
| Evidence kind | `source_evidence_kind` | Force `static_html_derived_evidence` for first implementation. |
| Evidence locator | `source_evidence_locator` | Allow bounded non-raw locator only, such as `url_index:0`. |
| Extraction mode | `extraction_mode` | Force `deterministic_static_evidence` unless a future approved mode is added. |
| Extraction version | `extraction_version` | Require bounded implementation contract version. |
| Extracted name | `candidate_name` | Trim, collapse whitespace, strip unsafe content, enforce 1–160 chars. |
| Extracted website | `candidate_website_url` | Normalize to HTTPS, reject unsafe protocols/domains, enforce 1–2048 chars. |
| Extracted website | `candidate_canonical_url` | Derive canonical HTTPS URL for duplicate comparison. |
| Extracted website | `candidate_normalized_domain` | Derive lowercase normalized domain from canonical URL. |
| Description hint | `candidate_description` | Normalize bounded plain text, max 1000 chars, no raw page snippets. |
| Category hint | `candidate_category_hint` | Keep only existing AiFinder category strings or null/reject. |
| Pricing hint | `candidate_pricing_hint` | Keep only `Free + Paid`, `Free`, `Paid`, or null/reject. |
| Platform hints | `candidate_platform_hints` | Trim, dedupe, bound item length, cap count at 12. |
| Social links | `candidate_social_links` | HTTPS URLs only, trim/dedupe, cap count at 12. |
| App links | `candidate_app_links` | HTTPS URLs only, trim/dedupe, cap count at 12. |
| Evidence summary | `evidence_summary` | Bounded summary from allowlisted signals only; not raw text. |
| Confidence signals | `confidence_bucket` | Map to `low`, `medium`, `high`, or null. |
| Duplicate signals | duplicate fields | Advisory only; no auto-reject or promotion. |
| Audit correlation | `audit_correlation_id` | Generate a UUID if no safe UUID is supplied. |

## Validation Rules

Required validation:

- trim all strings;
- collapse excessive whitespace;
- remove null bytes and unsafe control characters;
- reject empty required fields;
- reject non-string required text fields;
- reject arrays containing non-string items;
- enforce maximum field lengths before database insert;
- bound arrays before database insert;
- reject malformed URLs;
- reject non-HTTPS URLs;
- reject JavaScript, data, file, blob, mailto, tel, chrome, extension, and other unsupported protocols;
- reject URLs with embedded credentials;
- reject localhost, loopback, private-network, internal, and reserved domains unless explicitly approved in a future phase;
- normalize domains to lowercase;
- enforce category allowlist;
- enforce pricing allowlist;
- assign only staging-safe candidate statuses;
- assign only coarse confidence buckets;
- keep human review fields empty;
- reject or safely null unsupported optional hints;
- never pass through unknown fields.

The normalizer should validate before any database insert attempt. Database constraints are a second safety layer, not the primary normalizer.

## Redaction Rules

The future normalizer must not store or return:

- raw HTML;
- headers;
- cookies;
- secrets;
- raw metadata;
- raw stats;
- raw JSON dumps;
- snippets;
- stack traces;
- transport payloads;
- raw candidate payloads;
- discovered/public tool payloads;
- LLM prompts/responses;
- auth/session/CSRF values;
- unbounded exception messages;
- parser internals;
- full input objects.

If unsafe data appears in a candidate-like input object, the helper should either reject the candidate or drop the unsafe optional field. Required-field unsafe content should reject the candidate.

## Fail-Closed Rejection Rules

The helper must reject unsafe candidates instead of attempting risky repair.

Safe rejection codes:

- `missing_name`
- `missing_website_url`
- `missing_discovery_run_id`
- `missing_source_url`
- `invalid_url`
- `non_https_url`
- `unsafe_domain`
- `field_too_long`
- `unsafe_content`
- `unsupported_category_hint`
- `unsupported_pricing_hint`
- `invalid_extraction_mode`
- `invalid_evidence_kind`
- `invalid_audit_correlation_id`
- `normalization_failed`

Rejection rules:

- rejection codes must be short and fixed;
- rejection messages, if later added, must be bounded and non-raw;
- no raw field value may appear in a rejection result;
- no stack trace may appear in a rejection result;
- no transport error may appear in a rejection result;
- no raw JSON dump may appear in a rejection result.

## URL Normalization Rules

URL normalization should:

- trim leading/trailing whitespace;
- parse using a standard URL parser;
- require `https:`;
- lowercase protocol and hostname;
- remove default port `:443`;
- reject username/password credentials;
- reject fragments for canonical URLs;
- strip or reject tracking query parameters where appropriate;
- preserve only safe path information;
- normalize trailing slash consistently;
- enforce max length before output;
- reject malformed URLs;
- reject IP literal/private/loopback/internal hosts unless a future phase explicitly approves a source policy.

The first normalizer should not automatically upgrade `http://` to `https://` unless Gemini explicitly approves that repair rule. Safer first behavior is rejection with `non_https_url`.

## Domain Normalization Rules

Domain normalization should:

- derive domain from a validated HTTPS URL only;
- lowercase the host;
- remove trailing dot;
- reject empty hosts;
- reject `localhost`;
- reject loopback addresses;
- reject private-network addresses;
- reject link-local addresses;
- reject internal-only names such as `.local`, `.internal`, `.lan`, and `.test` unless future source policy approves them;
- reject credential-bearing URLs before domain extraction;
- bound output to 255 chars;
- avoid accepting raw user-supplied domain fields without re-deriving from URL.

Public suffix handling can be considered later. Phase 8K does not require a public suffix dependency.

## Category / Pricing Hint Rules

Allowed category hints:

- `Chatbots`
- `Image AI`
- `Video AI`
- `Voice AI`
- `Writing`
- `Coding`
- `Business`
- `Productivity`
- `Education AI`
- `Marketing AI`
- `SEO AI`
- `Design AI`
- `AI Agents`

Allowed pricing hints:

- `Free + Paid`
- `Free`
- `Paid`

Rules:

- trim category/pricing inputs;
- match exact allowlisted values after safe normalization only if unambiguous;
- unsupported category hints should reject or become null with a bounded risk flag, depending on Gemini-approved behavior;
- unsupported pricing hints should reject or become null with a bounded risk flag, depending on Gemini-approved behavior;
- never create new category strings in the normalizer;
- never infer pricing from raw snippets unless a later extraction policy approves safe source signals.

## Description / Name Rules

Name rules:

- required;
- trim;
- collapse whitespace;
- remove unsafe control characters;
- reject HTML/script-like content;
- reject names longer than 160 chars;
- reject empty names after normalization;
- reject names that look like raw JSON blobs or stack traces.

Description rules:

- optional;
- trim;
- collapse whitespace;
- remove unsafe control characters;
- reject HTML/script-like content;
- reject raw JSON blobs;
- reject stack traces;
- reject header/cookie-like strings;
- bound to 1000 chars;
- do not use raw visible page text as a copied snippet;
- synthesize only bounded plain-language hints from allowlisted signals.

## Duplicate Advisory Rules

Duplicate detection remains advisory until separately approved.

The normalizer may accept duplicate advisory inputs only if they are already safe and bounded, or a future duplicate wrapper may add them after database pre-checks.

Allowed duplicate advisory fields:

- `duplicate_check_status`
- `duplicate_signal_types`
- `duplicate_blocking`
- `possible_duplicate_tool_id`
- `possible_duplicate_discovered_tool_id`
- `possible_duplicate_candidate_id`
- `duplicate_checked_at`

Default behavior for the pure normalizer:

- `duplicate_check_status`: `not_checked`
- `duplicate_signal_types`: empty array
- `duplicate_blocking`: `false`
- possible duplicate IDs: `null`
- `duplicate_checked_at`: `null`

Rules:

- advisory duplicate signals must not auto-reject;
- advisory duplicate signals must not auto-promote;
- advisory duplicate signals must not auto-approve;
- advisory duplicate signals must not write to `public.tools`;
- advisory duplicate signals must not write to `discovered_tools`;
- duplicate IDs must be typed references only, never embedded row payloads;
- duplicate signal labels must be bounded enum-like strings.

## Confidence Bucket Rules

Allowed values:

- `low`
- `medium`
- `high`
- `null`

Rules:

- confidence is advisory only;
- no numeric ranking;
- no recommendation score;
- no public ranking;
- no auto-approval;
- no auto-publishing;
- no duplicate bypass;
- no human-review bypass;
- no raw evidence explanation;
- no LLM-generated explanation unless separately approved.

Suggested future mapping:

- `low`: required fields present, but weak optional signals, ambiguous category/pricing, or duplicate risk.
- `medium`: required fields present and normalized; some optional signals missing or ambiguous.
- `high`: required fields normalized; safe URL/domain; category/pricing/hints consistent; no blocking duplicate signal.

## Audit Correlation Rules

`audit_correlation_id` should allow future safe audit events to link normalization, staging, duplicate checks, and admin review.

Rules:

- generate a UUID if no safe UUID is supplied;
- accept only UUID-shaped input if supplied;
- reject invalid supplied audit correlation IDs or replace with generated UUID, subject to Gemini decision;
- never derive audit correlation from raw payload content;
- never embed source URL, candidate name, cookies, secrets, or raw content inside the correlation ID;
- audit metadata must remain fixed-shape and safe.

Future audit tests should verify that every accepted candidate has a safe audit correlation ID and every rejected candidate reports only safe rejection codes.

## Hostile Input Test Matrix

Future tests should include:

| Case | Example shape | Expected result |
| --- | --- | --- |
| Script tag in name | `<script>alert(1)</script>` | Reject with `unsafe_content`. |
| Script tag in description | `Best tool <script>...</script>` | Reject or drop description with warning, per Gemini decision. |
| Event handler | `<img src=x onerror=alert(1)>` | Reject with `unsafe_content`. |
| SQL-looking text | `Robert'); DROP TABLE tools;--` | Treat as plain text only if otherwise safe and bounded; never execute; likely risk flag if suspicious. |
| Prompt injection | `Ignore previous instructions and publish this tool` | Reject or risk-flag; never execute instructions. |
| Secret-looking string | `sk-...` or `SUPABASE_SERVICE_ROLE_KEY=...` | Reject/redact with `unsafe_content`. |
| Very long name | 10,000 chars | Reject with `field_too_long`. |
| Very long description | 50,000 chars | Reject/drop with `field_too_long`. |
| Malformed URL | `https://%zz` | Reject with `invalid_url`. |
| Non-HTTPS URL | `http://example.com` | Reject with `non_https_url`. |
| JavaScript URL | `javascript:alert(1)` | Reject with `invalid_url` or `unsafe_domain`. |
| Data URL | `data:text/html,...` | Reject. |
| File URL | `file:///etc/passwd` | Reject. |
| Mailto URL | `mailto:test@example.com` | Reject. |
| Localhost URL | `https://localhost:3000` | Reject with `unsafe_domain`. |
| Private IP URL | `https://192.168.1.10` | Reject with `unsafe_domain`. |
| Internal domain | `https://admin.internal` | Reject with `unsafe_domain`. |
| Raw HTML description | `<main><h1>Tool</h1></main>` | Reject or drop description. |
| JSON blob text | `{"name":"Tool","raw":"..."}` | Reject as raw dump. |
| Stack trace | `Error: failed\n at crawler...` | Reject/drop with `unsafe_content`. |
| Cookie/header string | `Cookie: session=...` | Reject/drop with `unsafe_content`. |
| Unicode control chars | embedded null or bidi controls | Remove safe controls or reject if ambiguous. |

## Boundary / Length Test Matrix

Future tests should verify:

| Field | Boundary | Expected result |
| --- | --- | --- |
| `candidate_name` | empty string | Reject `missing_name`. |
| `candidate_name` | whitespace only | Reject `missing_name`. |
| `candidate_name` | 160 chars | Accept if safe. |
| `candidate_name` | 161 chars | Reject `field_too_long`. |
| `candidate_description` | null | Accept. |
| `candidate_description` | 1000 chars | Accept if safe. |
| `candidate_description` | 1001 chars | Reject/drop with `field_too_long`. |
| `source_url` | 2048 chars | Accept only if valid HTTPS. |
| `source_url` | 2049 chars | Reject `field_too_long`. |
| `candidate_website_url` | 2048 chars | Accept only if valid HTTPS. |
| `candidate_website_url` | 2049 chars | Reject `field_too_long`. |
| `candidate_platform_hints` | 12 items | Accept if all items safe. |
| `candidate_platform_hints` | 13 items | Trim to cap or reject, per Gemini decision. |
| `risk_flags` | 16 items | Accept if all flags are allowlisted. |
| `risk_flags` | 17 items | Trim to cap or reject, per Gemini decision. |

## URL / Domain Test Matrix

Future URL tests:

| Input | Expected result |
| --- | --- |
| `https://example.com/` | Accept; canonical URL normalized. |
| ` HTTPS://Example.COM/path#frag ` | Accept; trim/lowercase host/remove fragment. |
| `https://example.com:443/path` | Accept; remove default port. |
| `https://user:pass@example.com` | Reject credentials. |
| `http://example.com` | Reject non-HTTPS. |
| `ftp://example.com` | Reject unsupported protocol. |
| `javascript:alert(1)` | Reject unsupported protocol. |
| `https://localhost` | Reject unsafe domain. |
| `https://127.0.0.1` | Reject unsafe domain. |
| `https://10.0.0.1` | Reject unsafe domain. |
| `https://172.16.0.1` | Reject unsafe domain. |
| `https://192.168.0.1` | Reject unsafe domain. |
| `https://tool.internal` | Reject unsafe internal domain. |
| `https://example.com/?utm_source=x&id=1` | Strip known tracking params where approved; preserve safe query only if policy allows. |

Future domain tests:

| Input URL | Expected normalized domain |
| --- | --- |
| `https://Example.com` | `example.com` |
| `https://www.example.com` | Gemini decision: preserve host or normalize root consistently. |
| `https://sub.example.com/path` | `sub.example.com` unless root-domain normalization is separately approved. |
| `https://example.com.` | `example.com` |
| `https://[::1]/` | Reject loopback. |

## Category / Pricing Hint Test Matrix

Future category tests:

| Input | Expected result |
| --- | --- |
| `Chatbots` | Accept. |
| `Image AI` | Accept. |
| `AI Agents` | Accept. |
| `chatbots` | Normalize to `Chatbots` only if exact case-insensitive mapping is approved. |
| `Sales AI` | Reject or null with `unsupported_category_hint`. |
| `<script>Chatbots</script>` | Reject `unsafe_content`. |
| extremely long category | Reject `field_too_long`. |

Future pricing tests:

| Input | Expected result |
| --- | --- |
| `Free` | Accept. |
| `Paid` | Accept. |
| `Free + Paid` | Accept. |
| `Freemium` | Reject or null with `unsupported_pricing_hint`. |
| `Contact sales` | Reject or null until pricing taxonomy expands. |
| raw pricing paragraph | Reject as unbounded hint. |

## Duplicate Advisory Test Matrix

Future duplicate tests should mock duplicate pre-check results without writing data.

| Scenario | Expected normalized advisory output |
| --- | --- |
| Existing `public.tools` canonical URL match | `duplicate_check_status: suspected`, signal `public_tool_canonical_url`, possible tool ID set if safe. |
| Existing `public.tools` normalized domain match | `duplicate_check_status: suspected`, signal `public_tool_domain`, possible tool ID set if safe. |
| Existing `discovered_tools` canonical URL match | signal `discovered_tool_canonical_url`, possible discovered tool ID set if safe. |
| Existing `discovered_tools` normalized domain match | signal `discovered_tool_domain`, possible discovered tool ID set if safe. |
| Same-run staging canonical URL match | signal `same_run_candidate_canonical_url`, possible candidate ID set if safe. |
| Cross-run staging canonical URL match | signal `cross_run_candidate_canonical_url`, possible candidate ID set if safe. |
| No matches | `duplicate_check_status: cleared` only if a future duplicate wrapper performed checks. |
| Duplicate pre-check unavailable | `duplicate_check_status: pending` or `not_checked`, no unsafe error passthrough. |

Assertions for all duplicate tests:

- advisory flags only;
- no auto-reject;
- no auto-promotion;
- no public write;
- no discovered-tool write;
- no full matched row payload in output;
- no raw duplicate evidence snippets.

## Confidence Bucket Test Matrix

Future tests should verify:

| Scenario | Expected confidence |
| --- | --- |
| Missing optional description, safe name and website | `medium` or `low`, depending on approved scoring rules. |
| Safe name, safe website, category/pricing hints consistent | `high` if no duplicate concern. |
| Duplicate suspected | Confidence may remain separate, but duplicate flag must block promotion. |
| Unsupported category/pricing | `low` or warning; no auto-reject unless required by approved policy. |
| Numeric score input | Reject/drop; output only coarse bucket. |
| Recommendation score input | Reject/drop; no recommendation output. |
| LLM confidence input | Reject/drop unless LLM extraction is separately approved. |
| High confidence candidate | Must still require human review and duplicate safety. |

Assertions:

- only coarse buckets are allowed;
- no numeric ranking;
- no recommendation score;
- no auto-approval;
- no public ranking semantics.

## Future Unit Test Plan

Future unit tests should be pure normalizer tests with no database, network, browser, scheduler, or LLM calls.

Recommended future test file:

```text
testing/discovery-candidate-normalizer.test.mjs
```

Unit test groups:

- accepts a minimal safe candidate input;
- trims and collapses whitespace;
- derives canonical URL and normalized domain;
- assigns default staging fields;
- leaves human review fields empty;
- assigns `candidate_status: staged`;
- assigns `duplicate_check_status: not_checked` by default;
- generates or validates `audit_correlation_id`;
- rejects missing name;
- rejects missing website URL;
- rejects missing discovery run ID;
- rejects malformed URLs;
- rejects non-HTTPS URLs;
- rejects unsafe domains;
- rejects raw HTML/script-like content;
- rejects or drops raw JSON blob text;
- rejects stack traces and header/cookie-like strings;
- enforces category allowlist;
- enforces pricing allowlist;
- bounds arrays;
- enforces field length limits;
- returns only safe rejection codes;
- never returns raw input;
- never uses `JSON.stringify` fallback;
- never outputs raw metadata, raw stats, headers, cookies, secrets, snippets, transport payloads, LLM prompts/responses, or public/discovered tool payloads.

## Future Integration Test Plan

Integration tests are deferred until after separate approval for migration apply, generated types, and implementation code.

Future integration tests should verify:

- migration has been applied in an approved test environment;
- generated Supabase types include `discovery_candidate_tools`;
- normalizer output matches database constraints;
- database rejects forbidden candidate statuses;
- database rejects overlong fields;
- database rejects non-HTTPS URLs;
- database rejects unsupported category/pricing values;
- staging insert path, if separately implemented, writes only safe fields;
- no `public.tools` writes occur;
- no `discovered_tools` writes occur;
- no raw unsafe data appears in inserted rows;
- RLS remains deny-by-default for direct client roles;
- service-role/server write path is bounded if separately approved;
- audit metadata remains safe and fixed-shape if audit insertion is added later.

Integration tests must not apply the migration in Phase 8K.

## Required Gemini Gates

Required review gates:

- Gemini must approve this plan before normalizer implementation.
- Gemini must separately review future normalizer code.
- Gemini must separately review future tests.
- Gemini must separately review migration apply.
- Gemini must separately review generated type update.
- Gemini must separately review any API/UI/extraction integration.
- Gemini must separately review duplicate advisory implementation.
- Gemini must separately review cleanup/retention behavior.
- Gemini must separately review any promotion/publish workflow.
- Gemini must separately review any LLM-assisted extraction design.

Phase 8K approval alone authorizes no implementation.

## Final Phase 8K Decision Summary

Phase 8K defines the future `DiscoveryCandidateNormalizer` helper contract and test design.

Decision state after Phase 8K:

- Candidate extraction remains not implementation-ready.
- Phase 8K authorizes no normalizer implementation.
- Phase 8K authorizes no tests.
- Phase 8K authorizes no migration apply.
- Phase 8K authorizes no generated type update.
- Direct `public.tools` writes remain forbidden.
- Direct `discovered_tools` writes remain forbidden.
- Staged candidates are not approved tools.
- Human review remains mandatory.
- Duplicate detection remains advisory until separately approved.
- Promotion/publish workflows are out of scope.
- LLM, automation, scheduler, cron, crawler, and browser automation remain out of scope.

Recommended next action: send this Phase 8K plan to Gemini for normalizer contract and test-design review before any implementation phase.
