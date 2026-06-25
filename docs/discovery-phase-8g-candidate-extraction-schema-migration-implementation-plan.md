# Phase 8G — Candidate Extraction Schema & Migration Implementation Plan

## Status / Scope

Phase 8G is a docs-only planning phase for the AiFinder Discovery Engine.

This document defines the future schema and migration implementation plan for the dedicated candidate extraction staging table approved as the preferred direction in Phase 8F. It is written for Gemini review before any database, code, API, UI, generated-type, or extraction work begins.

Phase 8G does not create a migration file. It does not modify schema, generated Supabase types, source code, UI, API routes, executor behavior, helpers, normalizers, automation, cron, scheduler, crawler behavior, browser automation, or database data.

Candidate extraction remains **not implementation-ready** after Phase 8G.

## Background

Phase 8E established the candidate extraction readiness gate and staging contract. It confirmed that future extraction output must be staging-only, must not write directly to `public.tools`, must not auto-approve, must not auto-publish, and must not bypass human review.

Phase 8F compared storage options and selected a dedicated candidate staging table as the preferred future direction. It rejected immediate reuse of `discovered_tools` as the first extraction landing zone because that table already carries Discovery Queue, duplicate, approval, and public-tool linkage semantics. It also rejected JSONB staging artifacts on `discovery_runs` because they are weak for indexing, duplicate detection, cleanup, lifecycle management, and raw-payload prevention.

Phase 8G converts the Phase 8F decision into a future migration implementation plan. The output is a reviewable planning document only.

## Non-goals

Phase 8G does not:

- implement candidate extraction;
- add source code;
- add UI behavior;
- add API behavior;
- add schema or migration files;
- modify generated Supabase types;
- create candidates;
- write to `discovered_tools`;
- write to `public.tools`;
- add approval or publish behavior;
- add duplicate detection behavior;
- add ranking or recommendation behavior;
- add LLM/AI interpretation;
- add automation, scheduler, cron, crawler, worker, or browser automation;
- expose or store raw HTML, headers, cookies, secrets, raw metadata, raw stats, raw JSON dumps, snippets, stack traces, transport payloads, raw candidate payloads, discovered/public tool payloads, or LLM prompts/responses.

This phase also does not authorize applying a migration after Gemini review. Actual migration creation and application must be separately approved.

## Phase 8F Decision Carried Forward

Phase 8F preferred a new dedicated candidate staging table for future extraction output.

Carried-forward decision principles:

- Staged candidates are not approved tools.
- Staged candidates are not public tools.
- `public.tools` remains human-approved/public-only.
- Direct `public.tools` writes remain forbidden.
- `discovered_tools` remains a later reviewed Discovery Queue or promotion target, not the first landing zone for raw extraction output.
- Human review remains mandatory.
- Duplicate safety remains mandatory before any promotion path.
- Promotion and publish workflows remain out of scope.
- Gemini must approve the implementation plan before any migration file is created.
- Gemini must review exact migration SQL before any apply step.

## Proposed Future Table Name

Preferred future table name:

```text
public.discovery_candidate_tools
```

Rationale:

- `discovery_` keeps the table inside the Discovery Engine namespace.
- `candidate_tools` communicates that rows are candidate tool records, not approved public tools.
- The name avoids overloading `discovered_tools`, which already represents the Discovery Queue.
- The name supports a future promotion path to `discovered_tools` without confusing staging records with reviewed queue records.

Future migration file name should be selected only in the implementation phase, for example:

```text
supabase/migrations/YYYYMMDDHHMMSS_create_discovery_candidate_tools.sql
```

Phase 8G does not create this file.

## Proposed Table Shape

The future table should be fixed-shape and allowlisted. It should not include a generic raw payload column.

Proposed planning-level shape:

| Field | Direction | Purpose |
| --- | --- | --- |
| `id` | `uuid primary key default gen_random_uuid()` | Stable candidate staging record ID. |
| `source_run_id` | `uuid not null references public.discovery_runs(id)` | Required link to the static evidence run that produced the staging candidate. |
| `source_id` | `uuid null references public.discovery_sources(id)` | Optional denormalized source reference for filtering/review; can be derived from run if omitted. |
| `source_url` | bounded `text not null` | Sanitized reviewed source URL. |
| `source_url_normalized` | bounded `text not null` | Normalized source URL used for comparison and audit. |
| `source_domain` | bounded `text` | Normalized source domain for filtering and duplicate hints. |
| `source_evidence_kind` | bounded enum/check text | Expected first value: `static_html_derived_evidence`. |
| `source_evidence_locator` | bounded `text` | Safe locator such as execution mode and URL index; not raw evidence. |
| `extraction_mode` | bounded enum/check text | Expected first value should identify deterministic static evidence extraction if later approved. |
| `extraction_version` | bounded `text` | Version string for the extraction normalizer/contract. |
| `candidate_name` | bounded `text not null` | Normalized candidate tool name. |
| `candidate_website` | bounded `text not null` | Sanitized candidate website URL. |
| `candidate_website_normalized` | bounded `text not null` | Canonical candidate website URL for comparison. |
| `candidate_domain` | bounded `text not null` | Normalized candidate domain for duplicate checks. |
| `candidate_description` | bounded `text` | Plain-language description, never raw page text. |
| `candidate_category_hint` | bounded enum/check text | Hint from existing AiFinder category taxonomy only. |
| `candidate_pricing_hint` | bounded enum/check text | Hint from existing safe pricing options only. |
| `candidate_platform_hints` | bounded `text[]` | Optional allowlisted platform hints. |
| `candidate_social_links` | bounded `text[]` | Optional sanitized social link hints. |
| `candidate_app_links` | bounded `text[]` | Optional sanitized app-store/app link hints. |
| `evidence_summary` | bounded `text` | Safe summary of why the candidate was staged. |
| `confidence_label` | bounded enum/check text | Advisory only: `low`, `medium`, or `high`. |
| `risk_flags` | bounded `text[]` | Safe bounded flags such as `ambiguous_name` or `duplicate_signal_present`. |
| `duplicate_check_status` | bounded enum/check text | Staging duplicate state, default `not_checked`. |
| `duplicate_signal_types` | bounded `text[]` | Safe duplicate signal categories only. |
| `duplicate_checked_at` | `timestamptz` | Set only by a future approved duplicate phase. |
| `duplicate_blocking` | `boolean not null default false` | Advisory duplicate block flag; never approval/publish. |
| `possible_duplicate_tool_id` | nullable FK to `public.tools(id)` | Optional safe pointer to an existing public tool candidate match if later approved. |
| `possible_duplicate_discovered_tool_id` | nullable FK to `public.discovered_tools(id)` | Optional safe pointer to an existing Discovery Queue match if later approved. |
| `possible_duplicate_candidate_id` | nullable self-FK | Optional pointer to another staging candidate if later approved. |
| `review_status` | bounded enum/check text | Staging-only review status, default `staged`. |
| `reviewed_at` | `timestamptz` | Timestamp for future admin review. |
| `reviewed_by` | nullable `uuid` | Future admin actor ID if approved; not public user data. |
| `review_notes` | bounded `text` | Optional admin notes, bounded and safe. |
| `rejection_reason_code` | bounded enum/check text | Safe reason code for rejected/discarded staging records. |
| `audit_correlation_id` | `uuid` or bounded `text` | Safe correlation value for audit events. |
| `eligible_for_cleanup_at` | `timestamptz` | Optional retention/cleanup eligibility timestamp. |
| `cleanup_status` | bounded enum/check text | Staging cleanup status, default `active`. |
| `discarded_at` | `timestamptz` | Timestamp for safe discard. |
| `created_at` | `timestamptz not null default now()` | Creation timestamp. |
| `updated_at` | `timestamptz not null default now()` | Update timestamp via existing `set_updated_at()` if available. |

Relationship guidance:

- `source_run_id` should be required.
- `source_id` can be nullable or derived; Gemini should decide whether denormalization is worth the extra FK.
- The FK from `discovery_candidate_tools.source_run_id` to `discovery_runs.id` should avoid accidental cascade deletion. Prefer `on delete restrict` or default `no action` unless a retention policy explicitly chooses a different behavior.
- Any FK to `public.tools`, `discovered_tools`, or the same staging table should be nullable and informational only. It must not imply duplicate resolution, approval, publication, or promotion.
- A future promotion link to `discovered_tools` should not be included in the first migration unless a separate promotion workflow is approved.

## Candidate Status Lifecycle

Candidate statuses must be staging-only and must avoid approval/publish semantics.

Recommended first lifecycle values:

- `staged`
- `needs_review`
- `rejected_by_normalizer`
- `duplicate_suspected`
- `discarded`
- `retained_for_review`

Optional later value only if a future promotion workflow is approved:

- `promoted_to_discovery_queue`

Explicitly forbidden status values:

- `approved`
- `published`
- `live`
- `public`
- `ready_to_publish`
- `auto_approved`
- `recommended`
- `ranked`

Lifecycle rules:

- Default should be `staged`.
- `rejected_by_normalizer` should be allowed for safe rejected artifacts if retention is approved.
- `duplicate_suspected` must not mean duplicate confirmed.
- `discarded` must not delete or affect `public.tools`.
- No status should trigger insertion into `public.tools`.
- No status should trigger insertion into `discovered_tools` unless a future reviewed promotion workflow explicitly implements that.

## Safe Field Policy

Future table fields must store only safe, bounded, normalized candidate staging data.

Allowed safe fields:

- bounded candidate name;
- sanitized HTTPS candidate website;
- normalized candidate website;
- normalized candidate domain;
- bounded source URL and normalized source URL;
- source run ID;
- source ID if approved;
- extraction mode and version;
- bounded plain-language description;
- category hint from the existing AiFinder category taxonomy only:
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
- pricing hint from existing safe pricing options only:
  - `Free + Paid`
  - `Free`
  - `Paid`
- bounded platform hints;
- bounded social/app link hints after URL safety checks;
- bounded evidence summary;
- advisory confidence label;
- bounded risk flags;
- bounded duplicate signal categories;
- staging-only review status;
- bounded review notes;
- safe timestamps and audit correlation IDs.

Normalization expectations before any future insert:

- trim and bound all strings;
- reject empty required fields;
- reject unsafe URLs;
- strip query/fragment where appropriate;
- normalize domains;
- force HTTPS where appropriate;
- reject non-HTTP(S), JavaScript, data, blob, file, localhost, private-network, and credential-bearing URLs;
- enforce category and pricing allowlists;
- strip HTML/script-like content;
- cap arrays and array item lengths;
- drop unknown fields;
- no raw fallback;
- no `JSON.stringify` fallback;
- no exception message passthrough.

## Forbidden Raw Data Policy

The future table must explicitly forbid storing:

- raw HTML;
- HTML snippets;
- raw visible text;
- title/headline/body snippets;
- meta-description snippets;
- headers;
- cookies;
- authentication/session/CSRF values;
- secrets;
- raw metadata;
- raw stats;
- raw audit rows;
- raw JSON dumps;
- stack traces;
- exception messages if unbounded;
- transport payloads;
- raw candidate payloads;
- discovered/public tool payload dumps;
- LLM prompts or responses;
- user/session/admin private data;
- executable/script content.

Schema design should support this policy by avoiding columns named `raw_payload`, `raw_metadata`, `raw_stats`, `raw_json`, `html`, `headers`, `cookies`, `transport_payload`, `prompt`, or `response`.

If a future implementation proposes an artifact or metadata column, Gemini must review the exact shape and constraints before implementation. The default Phase 8G recommendation is no generic JSONB payload column in the first staging table migration.

## RLS Policy Direction

Future RLS posture should match the existing Discovery Engine hardening model.

Required direction:

- enable RLS on `public.discovery_candidate_tools`;
- revoke all access from `anon`;
- revoke all access from `authenticated`;
- deny-by-default policy for all operations;
- no public read access;
- no public write access;
- no direct browser/client Supabase writes;
- no public-safe view;
- no exposure through `public_safe_tools`;
- admin reads only through server-side protected admin routes;
- writes only through server-side service-role code paths if a later phase approves extraction/staging writes.

Recommended first policy posture:

```text
alter table public.discovery_candidate_tools enable row level security;
revoke all on public.discovery_candidate_tools from anon, authenticated;
create policy "Deny all access to discovery_candidate_tools"
on public.discovery_candidate_tools for all using (false) with check (false);
```

This is a planning sketch only. Phase 8G does not create the migration.

If future direct admin JWT policies are considered, they must be separately designed and reviewed. The safer first implementation should keep access behind protected server-side admin routes that already validate admin session and CSRF for mutations.

## Index and Constraint Plan

Future migration should define indexes and constraints deliberately.

Recommended B-tree indexes:

- `discovery_candidate_tools_source_run_id_idx` on `source_run_id`;
- `discovery_candidate_tools_status_created_idx` on `(review_status, created_at desc)`;
- `discovery_candidate_tools_cleanup_idx` on `(cleanup_status, eligible_for_cleanup_at)`;
- `discovery_candidate_tools_candidate_domain_idx` on `candidate_domain`;
- `discovery_candidate_tools_candidate_website_normalized_idx` on `candidate_website_normalized`;
- `discovery_candidate_tools_source_url_normalized_idx` on `source_url_normalized`;
- `discovery_candidate_tools_duplicate_check_status_idx` on `duplicate_check_status`;
- `discovery_candidate_tools_created_at_idx` on `created_at desc`.

Optional later indexes after Gemini review:

- lower/name expression index for normalized candidate name lookups;
- trigram index for fuzzy name matching if the duplicate phase explicitly needs it;
- partial index on active review statuses;
- partial duplicate indexes for `possible_duplicate_tool_id`, `possible_duplicate_discovered_tool_id`, and `possible_duplicate_candidate_id`.

Uniqueness considerations:

- Consider a partial unique index on `(source_run_id, candidate_website_normalized)` for active rows to prevent duplicate candidates within a single run.
- Do not create global uniqueness on `candidate_domain` or `candidate_website_normalized` as a substitute for duplicate detection.
- Global duplicates should be surfaced as review signals, not silently rejected, until duplicate workflow is approved.
- Any uniqueness rule must exclude discarded/rejected records only if retention and audit rules allow it.

Recommended constraints:

- check `review_status` against staging-only statuses;
- check `duplicate_check_status` against staging-only duplicate states such as `not_checked`, `pending`, `suspected`, `blocked`, `cleared`;
- check `confidence_label` against `low`, `medium`, `high`, or null;
- check category hints against existing AiFinder categories;
- check pricing hints against `Free + Paid`, `Free`, `Paid`, or null;
- check source evidence kind against approved source evidence kinds;
- check extraction mode against approved extraction modes;
- check string lengths for candidate name, URLs, domain, description, evidence summary, notes, and codes;
- check array lengths for hints, links, flags, and duplicate signal arrays;
- check candidate/source URLs are normalized HTTPS values if SQL-level validation is practical.

Constraints must prevent direct approval/publish semantics. Do not include columns such as `approved_tool_id`, `published_tool_id`, `is_published`, `approved_at`, or `published_at` in the first staging migration.

## Admin Review Implications

The future admin UI must present `discovery_candidate_tools` records as unverified staging records.

Future admin review expectations:

- staged candidates are not approved tools;
- staged candidates are not public tools;
- review UI must not render raw HTML, raw JSON, raw metadata, raw stats, headers, cookies, secrets, stack traces, snippets, transport payloads, raw candidate payloads, public-tool payloads, or LLM payloads;
- review UI must display safe candidate fields only;
- review UI may show safe evidence summary, confidence label, risk flags, duplicate status, and audit timeline;
- review UI must not include publish controls in the staging table phase;
- review UI must not include direct `public.tools` insertion behavior;
- review UI must not include duplicate resolution controls until a duplicate phase approves them;
- human review remains mandatory.

Any future admin UI implementation requires a separate Gemini-reviewed API/UI implementation plan.

## Audit Requirements

Future candidate staging should use safe audit events with fixed-shape metadata.

Proposed safe event names:

- `candidate_extraction_started`
- `candidate_extraction_source_normalized`
- `candidate_tool_staged`
- `candidate_tool_rejected_by_normalizer`
- `candidate_tool_duplicate_suspected`
- `candidate_tool_review_status_changed`
- `candidate_tool_discarded`
- `candidate_tool_cleanup_eligible`
- `candidate_tool_cleaned_up`
- `candidate_extraction_completed`
- `candidate_extraction_failed_safely`

Existing `discovery_audit_events.action` constraints may need review before these names can be stored in the `action` column. A future migration plan must decide whether to:

- extend the existing `action` check constraint;
- use a bounded generic action such as `flag` with safe metadata event type;
- add a candidate-specific audit table;
- add a nullable `candidate_tool_id` FK to `discovery_audit_events`.

That decision is out of scope for Phase 8G and must be reviewed by Gemini.

Audit metadata should correlate:

- `run_id`;
- `candidate_tool_id`;
- `source_id` if safe and available;
- `source_url_normalized`;
- `event_type`;
- `review_status`;
- `duplicate_check_status`;
- `actor_id` or `actor_label` for admin actions;
- safe failure category/code;
- safety flags.

Audit metadata must not include raw payloads, raw extraction output, raw metadata, raw stats, headers, cookies, secrets, stack traces, snippets, transport messages, discovered/public tool payloads, or LLM prompts/responses.

## Duplicate Detection Requirements

Duplicate detection remains mandatory before any promotion path.

Future duplicate detection should compare staged candidates against:

- the staging table itself;
- existing `public.tools`;
- existing `discovered_tools`;
- normalized candidate website;
- normalized candidate domain;
- normalized candidate name;
- app/social links if later approved;
- source URL when relevant.

Duplicate fields in `discovery_candidate_tools` should remain advisory:

- `duplicate_check_status`;
- `duplicate_signal_types`;
- `duplicate_checked_at`;
- `duplicate_blocking`;
- optional nullable possible-duplicate FK fields if approved.

Duplicate detection must not:

- auto-approve;
- auto-publish;
- auto-promote to `discovered_tools`;
- merge records automatically;
- rank or recommend tools;
- write to `public.tools`.

Any future integration with `discovery_duplicate_candidates` requires separate design because that table currently references `discovered_tools`, not the proposed staging table.

## Generated Type Update Requirements

Phase 8G makes no generated type changes.

Future implementation requirements:

- Create the migration only after Gemini approval.
- Apply or test the migration in the approved local/review environment.
- Refresh Supabase generated types only in the future implementation phase.
- Include the generated type diff in Gemini review before commit if generated types are committed in the repo.
- Verify the generated type update does not introduce unrelated schema changes.

Future verification expectations after generated type update:

- generated types include `discovery_candidate_tools`;
- generated types include only approved columns;
- generated types do not include unexpected raw payload columns;
- TypeScript compile passes;
- lint passes;
- schema diff is reviewed;
- no UI/API/extraction behavior is added unless separately approved.

## Rollback and Cleanup Plan

Future migration planning must include rollback SQL.

Rollback SQL expectations:

- drop indexes for `discovery_candidate_tools`;
- drop triggers for `discovery_candidate_tools`;
- drop RLS policies for `discovery_candidate_tools`;
- drop `public.discovery_candidate_tools`;
- do not drop or mutate `public.tools`;
- do not drop or mutate `public.discovered_tools`;
- do not drop or mutate unrelated `discovery_runs`;
- do not drop or mutate unrelated `discovery_audit_events`;
- preserve rollback ordering so dependent objects are removed safely.

Safe deletion/cascade rules:

- Do not cascade delete public tools through staging cleanup.
- Do not cascade delete discovered tools through staging cleanup.
- Prefer explicit staging cleanup over broad cascade behavior.
- Prefer `on delete restrict` or default `no action` for `source_run_id` unless a retention policy explicitly approves a different behavior.
- Nullable duplicate pointer FKs, if added later, may use `on delete set null` because they are advisory references.

Retention strategy:

- First implementation should support `eligible_for_cleanup_at` and `cleanup_status`.
- Cleanup should be dry-run/report-first.
- Cleanup should target exact staging IDs, source run IDs, or retention windows.
- Cleanup should audit discarded/cleaned records with safe metadata.
- Cleanup must not delete approved/public tools.
- Cleanup must not delete unrelated Discovery Queue records.

Stale candidate cleanup rules:

- stale `staged` records may become `retained_for_review`, `discarded`, or cleanup-eligible only through a separately approved retention policy;
- cleanup must not run automatically until scheduler/worker/cron behavior is separately approved;
- manual cleanup tooling requires a separate plan and Gemini review.

## Migration Risks

Primary migration risks:

- RLS grants accidentally expose staging records.
- A raw/generic payload column reintroduces unsafe data retention.
- Status names imply approval or publishing.
- Cascading deletes remove audit or review history unexpectedly.
- Generated types drift includes unrelated schema changes.
- Indexes are insufficient for review queues or duplicate checks.
- Constraints are too weak and allow unsafe fields.
- Constraints are too strict and block legitimate safe candidates.
- Future API/UI mistakenly treats staged records as approved tools.
- Future duplicate fields are misread as duplicate resolution.

Mitigations:

- deny-by-default RLS;
- no public-safe view;
- no direct browser/client writes;
- no raw payload columns;
- staging-only status names;
- exact migration review by Gemini;
- generated type review by Gemini;
- smoke tests for RLS and forbidden writes;
- separate API/UI implementation plan;
- separate duplicate implementation plan;
- separate promotion/publish plan if ever approved.

## Future Smoke-Test Plan

The future migration implementation phase must include a smoke-test plan before execution.

Minimum future smoke-test requirements:

- migration applies cleanly in the approved environment;
- migration rollback SQL is reviewed;
- table exists with the exact approved columns;
- table does not contain raw payload columns;
- RLS is enabled;
- anon access is denied;
- public access is denied;
- direct authenticated client access is denied unless a separately reviewed admin JWT policy exists;
- protected server/service role behavior is bounded;
- no public-safe view exposes the table;
- no candidate insert path is implemented unless separately approved;
- no `public.tools` rows are inserted;
- no `discovered_tools` rows are inserted;
- no `discovery_duplicate_candidates` rows are inserted unless separately approved;
- no raw data appears in admin-visible fields;
- no raw data appears in audit metadata;
- generated types update cleanly if included;
- `git diff --check`, lint, typecheck/build pass;
- final `git status --short --branch` is reported.

Manual QA is not required for the schema-only migration unless a future implementation phase adds UI/API behavior. If UI/API behavior is added later, desktop/tablet/mobile admin QA must be separately planned.

## Required Gemini Gates

Gemini must approve this Phase 8G implementation plan before any migration file is created.

Future Gemini gates:

- exact migration SQL before apply;
- exact table name and columns;
- exact FK actions;
- exact status lifecycle;
- exact constraints;
- exact indexes;
- exact RLS policies;
- exact grants/revokes;
- exact rollback SQL;
- generated type changes;
- audit event shape and action constraint strategy;
- duplicate detection integration plan;
- retention/cleanup policy;
- future API plan;
- future UI plan;
- future extraction implementation plan;
- future smoke-test execution plan.

Gemini must separately review any future API/UI/extraction implementation. Approval of this schema plan must not be treated as approval to implement extraction, duplicate detection, promotion, approval, publishing, ranking, recommendation, LLM analysis, automation, scheduler, cron, crawler, or browser automation.

## Final Phase 8G Decision Summary

Phase 8G defines the future implementation plan for a dedicated candidate extraction staging table named:

```text
public.discovery_candidate_tools
```

The proposed table should be fixed-shape, admin-only, deny-by-default, and staging-only. It should link to `discovery_runs`, store only safe normalized candidate fields, support future duplicate review and human review, preserve audit correlation, and include retention/cleanup fields. It should not contain raw payload columns or approval/publish semantics.

Candidate extraction remains **not implementation-ready** after Phase 8G.

Phase 8G authorizes no code, schema, migration, API, UI, automation, extraction implementation, candidate creation, `discovered_tools` write, `public.tools` write, approval behavior, publish behavior, duplicate behavior, ranking/recommendation behavior, LLM behavior, scheduler, cron, crawler, or browser automation.

Direct `public.tools` writes remain forbidden. Staged candidates are not approved tools. Human review remains mandatory. Duplicate detection remains mandatory before any promotion path. Promotion and publish workflows remain out of scope.

The next safe step is Gemini review of this plan. Only after Gemini and James approve should a future phase draft the exact migration SQL for `public.discovery_candidate_tools`.
