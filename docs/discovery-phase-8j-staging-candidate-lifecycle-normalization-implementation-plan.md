# Phase 8J — Staging Candidate Lifecycle & Normalization Implementation Plan

## Status / Scope

Phase 8J is a docs-only planning phase for future candidate normalization and staging lifecycle rules.

This document defines how a future implementation should normalize extraction output into safe `public.discovery_candidate_tools` fields and how staged candidates should move through staging-only lifecycle states. It does not implement normalization, extraction, duplicate detection, API behavior, UI behavior, migration application, generated type updates, or data writes.

Candidate extraction remains not implementation-ready after Phase 8J.

## Background

Phases 8E through 8H established the candidate extraction readiness gate, selected a dedicated staging table as the safest storage direction, planned the table, and drafted the exact migration SQL for review.

Phase 8I created and pushed the real migration file:

```text
supabase/migrations/20260625171333_create_discovery_candidate_tools.sql
```

Commit:

```text
090c34b Add discovery candidate tools migration
```

Important current state:

- The migration file exists in the repo.
- The migration has not been applied.
- Generated Supabase types have not been refreshed.
- No extraction code exists.
- No candidate staging writes exist.
- No admin candidate review UI/API exists.

Phase 8J plans the future normalizer and lifecycle rules that must be reviewed before any implementation touches the staging table.

## Non-goals

Phase 8J does not:

- apply the migration;
- run `supabase db push`;
- modify generated Supabase types;
- add source code;
- add UI behavior;
- add API behavior;
- implement extraction;
- create candidates;
- write to `discovery_candidate_tools`;
- write to `discovered_tools`;
- write to `public.tools`;
- add approval, publish, ranking, recommendation, LLM, automation, scheduler, cron, crawler, or browser automation behavior;
- expose or store raw HTML, headers, cookies, secrets, raw metadata, raw stats, raw JSON dumps, snippets, stack traces, transport payloads, raw candidate payloads, discovered/public tool payloads, or LLM prompts/responses.

## Phase 8I State Carried Forward

The committed Phase 8I migration defines the future table `public.discovery_candidate_tools` with:

- UUID primary key;
- required `discovery_run_id` reference to `public.discovery_runs(id)`;
- safe source URL and evidence locator fields;
- safe candidate name, website, canonical URL, normalized domain, category, pricing, description, platform, social, and app link hint fields;
- advisory confidence bucket;
- advisory duplicate fields;
- staging-only `candidate_status`;
- bounded human-review fields;
- `audit_correlation_id`;
- cleanup/retention fields;
- strict check constraints;
- B-tree indexes and a partial unique active-run/canonical-URL index;
- `public.set_updated_at()` trigger;
- deny-by-default RLS with direct `anon` and `authenticated` access revoked.

Phase 8I did not apply this migration and did not update generated types.

## Candidate Normalization Contract

A future candidate normalizer should be a small, deterministic, fail-closed boundary between static-derived evidence and `public.discovery_candidate_tools`.

The normalizer should:

- accept only reviewed static-derived evidence inputs;
- treat every input field as hostile;
- require a valid `discovery_run_id`;
- require a safe source URL;
- require a bounded candidate name;
- require a safe HTTPS candidate website URL;
- derive a canonical candidate URL and normalized domain;
- map only allowlisted fields into the staging table;
- drop unknown fields;
- reject unsafe required fields;
- cap optional strings and arrays;
- assign staging-only status values;
- produce advisory duplicate fields only after approved duplicate pre-checks;
- preserve human-review fields as empty until admin action;
- assign or accept a safe audit correlation ID;
- never fall back to raw payload storage;
- never use `JSON.stringify` as a display or persistence fallback;
- never pass through unbounded exception messages.

The first implementation should prefer a dedicated normalizer helper with unit tests before any route or executor calls it. A likely future helper name could be `lib/discovery-candidate-tool-normalizer.ts`, but Phase 8J does not create that file.

## Safe Field Mapping

Future extraction output should map into `discovery_candidate_tools` only through explicit fields.

| Table field | Normalization rule | Notes |
| --- | --- | --- |
| `discovery_run_id` | Require UUID for the source Discovery run. | Must reference the run that produced the evidence. |
| `source_url` | Require HTTPS URL, trimmed and bounded to 2048 chars. | No credentials, localhost, private network, data/blob/file/javascript URLs. |
| `source_url_normalized` | Canonicalize source URL consistently. | Strip query/fragment unless a later source policy explicitly keeps them. |
| `source_domain` | Derive normalized host/domain from source URL. | Bounded to 255 chars. |
| `source_evidence_kind` | Force `static_html_derived_evidence`. | First implementation should not accept arbitrary evidence kinds. |
| `source_evidence_locator` | Bounded locator such as `url_index:0` or `static_evidence:v1`. | Must not include raw evidence or snippets. |
| `extraction_mode` | Force approved mode such as `deterministic_static_evidence`. | No LLM mode unless separately approved. |
| `extraction_version` | Bounded contract version string. | Example: `candidate_normalizer_v1`. |
| `candidate_name` | Trim, collapse whitespace, strip HTML/script-like content, require 1–160 chars. | Reject empty names. |
| `candidate_website_url` | Normalize to HTTPS URL, bounded to 2048 chars. | Reject unsafe protocols and credential-bearing URLs. |
| `candidate_canonical_url` | Derive canonical HTTPS URL for duplicate comparison. | Strip tracking query/fragment where appropriate. |
| `candidate_normalized_domain` | Derive normalized domain from canonical URL. | Bounded to 255 chars. |
| `candidate_description` | Bounded plain-language hint, max 1000 chars. | Must not be raw page text or snippet storage. |
| `candidate_category_hint` | Allow only existing AiFinder categories or null. | Unknown categories become null or reject based on policy. |
| `candidate_pricing_hint` | Allow only `Free + Paid`, `Free`, `Paid`, or null. | Unknown pricing becomes null or a risk flag. |
| `candidate_platform_hints` | Trim, dedupe, bound items, cap count at 12. | No arbitrary text blobs. |
| `candidate_social_links` | Safe HTTPS URLs only, trimmed, deduped, capped at 12. | Strip query/fragment where appropriate. |
| `candidate_app_links` | Safe HTTPS app/store URLs only, trimmed, deduped, capped at 12. | No executable or deep-link protocols in first version. |
| `evidence_summary` | Bounded safe summary, max 1000 chars. | Must be synthesized from allowlisted signals, not copied raw text. |
| `confidence_bucket` | One of `low`, `medium`, `high`, or null. | Advisory only. |
| `risk_flags` | Bounded enum-like flags, capped at 16. | Examples: `missing_description`, `duplicate_signal_present`, `ambiguous_category`. |
| `duplicate_check_status` | Start as `not_checked`; update to `pending`, `suspected`, `blocked`, or `cleared` only through future duplicate checks. | Advisory only. |
| `duplicate_signal_types` | Bounded enum-like signal names, capped at 16. | No raw matched payloads. |
| `duplicate_blocking` | Boolean advisory flag. | Must not publish, promote, or reject automatically. |
| `possible_duplicate_tool_id` | Nullable pointer to `public.tools(id)`. | Advisory only; no public-tool mutation. |
| `possible_duplicate_discovered_tool_id` | Nullable pointer to `public.discovered_tools(id)`. | Advisory only; no Discovery Queue mutation. |
| `possible_duplicate_candidate_id` | Nullable pointer to another staging candidate. | Advisory only. |
| `duplicate_checked_at` | Set when duplicate pre-checks run. | No duplicate resolver is implemented in Phase 8J. |
| `candidate_status` | Default `staged`. | Staging-only values only. |
| `reviewed_at` | Null until admin review. | No automatic review timestamps. |
| `reviewed_by` | Null until admin review. | Must not store session/cookie/token data. |
| `review_notes` | Null until admin review; bounded to 1000 chars. | Admin-provided only in a future UI/API phase. |
| `rejection_reason_code` | Bounded safe code. | No raw exception messages. |
| `audit_correlation_id` | Generate UUID per staging candidate or normalize an existing safe UUID. | Used for safe audit correlation only. |
| `cleanup_status` | Default `active`. | Cleanup implementation remains out of scope. |
| `eligible_for_cleanup_at` | Null unless retention policy is approved. | Recommendation-only in this plan. |
| `archived_at` | Null until archived. | Archive is staging-only. |

## Forbidden Raw Data Policy

Future normalization and lifecycle implementation must explicitly forbid:

- storing raw extraction payloads;
- storing raw HTML;
- storing raw visible text;
- storing raw metadata;
- storing raw stats;
- storing raw audit rows;
- storing raw JSON dumps;
- storing snippets;
- storing headers;
- storing cookies;
- storing auth/session/CSRF values;
- storing secrets;
- storing stack traces;
- storing transport payloads;
- storing LLM prompts or responses;
- storing discovered/public tool payloads;
- deriving approved/public tool records automatically;
- bypassing human review;
- writing directly to `public.tools`;
- writing directly to `discovered_tools` unless a separate future promotion phase approves that behavior.

Unsafe data must be rejected or reduced into safe bounded labels before storage. UI hiding is not a substitute for storage safety.

## Staging Lifecycle State Machine

The lifecycle uses the `candidate_status` values committed in the Phase 8I migration:

- `staged`
- `needs_review`
- `duplicate_suspected`
- `rejected`
- `archived`

Lifecycle meaning:

- `staged`: candidate was normalized into a safe staging row but has not completed all review preparation.
- `needs_review`: candidate is ready for human admin review, subject to duplicate/risk context.
- `duplicate_suspected`: candidate has advisory duplicate signals and needs human review before any further handling.
- `rejected`: candidate has been rejected by normalizer or future admin review.
- `archived`: candidate is retained as inactive staging history or cleanup result.

No lifecycle state means approved, published, promoted, live, public, recommended, ranked, or duplicate-resolved.

## Allowed State Transitions

Allowed future transitions:

| From | To | Allowed reason |
| --- | --- | --- |
| create | `staged` | Normalizer created a safe staging candidate. |
| `staged` | `needs_review` | Required fields are normalized and duplicate pre-checks are clear or non-blocking. |
| `staged` | `duplicate_suspected` | Duplicate pre-checks found advisory matches. |
| `staged` | `rejected` | Normalizer or validation rejected the candidate safely. |
| `needs_review` | `duplicate_suspected` | Later duplicate pre-check found advisory matches. |
| `needs_review` | `rejected` | Admin rejects candidate in a future review workflow. |
| `needs_review` | `archived` | Retention or admin archive action is approved later. |
| `duplicate_suspected` | `needs_review` | Admin or approved duplicate review clears the duplicate concern without promotion. |
| `duplicate_suspected` | `rejected` | Admin rejects duplicate or unsafe candidate. |
| `duplicate_suspected` | `archived` | Retention or admin archive action is approved later. |
| `rejected` | `archived` | Retention policy archives rejected staging history. |

All future transitions should:

- validate the current state;
- validate the target state;
- record safe audit metadata;
- keep `public.tools` untouched;
- keep `discovered_tools` untouched unless a separate promotion phase approves it;
- avoid raw exception message passthrough.

## Forbidden State Transitions

Forbidden future transitions:

- any state to `approved`;
- any state to `published`;
- any state to `promoted`;
- any state to `live`;
- any state to `public`;
- any state to direct `public.tools` insertion;
- any state to direct public visibility;
- any state to automatic Discovery Queue insertion;
- `archived` back to an active state without separate review;
- `rejected` to `needs_review` without explicit admin action and audit;
- duplicate detection directly to approval/publish/promotion;
- confidence bucket directly to approval/publish/promotion;
- cleanup directly deleting approved/public tools.

The migration-level check constraint rejects production-state status labels. Future application code must enforce the same boundary before attempting writes.

## Duplicate Detection Pre-Checks

Future duplicate pre-checks must run before a staged candidate becomes reviewable or promotable in any later workflow.

Required pre-checks:

- canonical URL check against existing `public.tools`;
- normalized domain check against existing `public.tools`;
- canonical URL check against existing `discovered_tools`;
- normalized domain check against existing `discovered_tools`;
- canonical URL check against active `discovery_candidate_tools`;
- normalized domain check against active `discovery_candidate_tools`;
- normalized name check against `public.tools`;
- normalized name check against `discovered_tools`;
- normalized name check against active staging candidates.

Optional later pre-checks:

- fuzzy name similarity;
- app-store link overlap;
- social-profile overlap;
- redirect-aware canonical URL comparison;
- brand alias comparison.

Duplicate outputs must remain advisory:

- set `duplicate_check_status`;
- set bounded `duplicate_signal_types`;
- set `duplicate_blocking` if the signal should block review/promotion;
- set nullable possible-duplicate IDs only when a safe exact record reference exists;
- record safe audit metadata.

Duplicate pre-checks must not:

- auto-reject unless separately approved later;
- auto-promote;
- auto-approve;
- auto-publish;
- merge candidates automatically;
- write raw matched payloads;
- write to `public.tools`;
- write to `discovered_tools`.

## Confidence Bucket Rules

`confidence_bucket` is advisory and review-only.

Allowed values:

- `low`
- `medium`
- `high`
- `null`

Suggested assignment rules:

- `low`: required fields are present but quality is weak, ambiguous, or duplicate risk is high.
- `medium`: required fields are present and core signals are consistent, but one or more optional signals are missing or ambiguous.
- `high`: required fields are present, URL/domain normalization succeeds, and allowlisted signals are consistent.

Confidence must not:

- become ranking;
- become recommendation;
- auto-approve;
- auto-publish;
- bypass duplicate review;
- bypass human review;
- use raw evidence snippets as explanation;
- use LLM output unless a later LLM design is separately approved.

## Human Review Rules

Human review fields must stay empty until an admin review workflow exists and is separately approved.

Rules:

- `reviewed_at` remains null until admin action.
- `reviewed_by` remains null until admin action.
- `review_notes` remains null until admin action.
- `rejection_reason_code` is set only through a safe bounded code.
- Admin notes must be bounded and sanitized.
- Admin review must not expose raw HTML, raw metadata, snippets, transport payloads, headers, cookies, secrets, stacks, LLM payloads, or public/discovered tool payload dumps.
- Admin review must not include publish controls in the staging lifecycle implementation.
- Admin review must not write directly to `public.tools`.

Future review UI/API work requires separate Gemini review.

## Stale Candidate Cleanup / Retention Plan

Cleanup and retention are recommendations only in Phase 8J. No cleanup implementation is authorized.

Recommended retention principles:

- cleanup applies only to staging candidates;
- cleanup never deletes approved/public tools;
- cleanup never deletes `discovered_tools`;
- cleanup never deletes unrelated `discovery_runs`;
- cleanup should be report-first before destructive behavior;
- cleanup should be auditable;
- archived/rejected candidates may be retained for audit traceability;
- retention windows should be configurable only after a separate operations review.

Possible future retention windows for review, not implementation:

- retain `staged` candidates for 30–90 days before cleanup eligibility;
- retain `needs_review` and `duplicate_suspected` candidates until explicit admin action or longer retention policy;
- retain `rejected` candidates for 90–180 days for audit traceability;
- retain `archived` candidates according to a separately approved operational policy.

Cleanup status rules:

- default `cleanup_status`: `active`;
- `cleanup_eligible`: candidate may be listed in a future cleanup report;
- `archived`: candidate is inactive staging history.

Cleanup actions require safe audit events and must not expose raw payloads.

## Audit Event Expectations

Future lifecycle and normalization behavior should emit safe audit events.

Proposed safe event names for later review:

- `candidate_extraction_started`
- `candidate_source_evidence_normalized`
- `candidate_normalization_failed`
- `candidate_tool_staged`
- `candidate_tool_marked_needs_review`
- `candidate_tool_duplicate_suspected`
- `candidate_tool_review_status_changed`
- `candidate_tool_rejected`
- `candidate_tool_archived`
- `candidate_tool_cleanup_eligible`
- `candidate_tool_cleanup_completed`
- `candidate_extraction_completed`
- `candidate_extraction_failed_safely`

Audit metadata should be fixed-shape and may include:

- `run_id`;
- `candidate_tool_id`;
- `audit_correlation_id`;
- `event_type`;
- `candidate_status`;
- `duplicate_check_status`;
- `source_url_normalized`;
- `safe_failure_code`;
- `actor_id` or `actor_label` for admin actions.

Audit metadata must not include:

- raw HTML;
- raw visible text;
- snippets;
- raw metadata;
- raw stats;
- raw JSON dumps;
- headers;
- cookies;
- secrets;
- stack traces;
- transport payloads;
- raw candidate payloads;
- discovered/public tool payloads;
- LLM prompts or responses.

Existing `discovery_audit_events.action` compatibility remains a separate schema decision because the current action check constraint is limited to existing Discovery Queue actions.

## Failure Handling

Future normalization must fail closed.

Failure handling rules:

- reject missing required candidate name;
- reject missing or unsafe candidate website URL;
- reject unsafe source URL;
- reject unsafe or unsupported extraction mode;
- reject invalid category/pricing hints or reduce them to null with a risk flag;
- reject unbounded fields;
- reject script-like or HTML-like content in candidate fields;
- drop unknown fields;
- never persist raw parser errors;
- never persist stack traces;
- never persist transport errors;
- record only bounded safe failure codes.

Suggested safe failure codes:

- `missing_candidate_name`
- `missing_candidate_website`
- `unsafe_candidate_url`
- `unsafe_source_url`
- `unsupported_extraction_mode`
- `invalid_category_hint`
- `invalid_pricing_hint`
- `field_length_exceeded`
- `unsafe_content_detected`
- `duplicate_precheck_failed_safely`
- `normalizer_internal_failure`

Failure codes are not user-facing evidence and must not contain raw exception text.

## Admin Review Implications

Future admin review should clearly separate staged candidates from:

- static evidence results;
- operational audit timeline entries;
- `discovered_tools`;
- `public.tools`;
- approval/publish workflows.

Admin review UI should show only safe fields:

- candidate name;
- candidate website/canonical URL/domain;
- source URL/domain;
- category/pricing hints;
- bounded description;
- evidence summary;
- confidence bucket;
- risk flags;
- duplicate advisory status;
- lifecycle status;
- safe audit timeline.

Admin review UI must not show:

- raw HTML;
- raw metadata;
- raw stats;
- raw JSON dumps;
- snippets;
- headers;
- cookies;
- secrets;
- stack traces;
- transport payloads;
- LLM payloads;
- raw candidate payloads;
- discovered/public tool payloads;
- publish controls;
- approval controls;
- ranking/recommendation controls.

Promotion from staging to any other table remains out of scope until separately designed.

## Future Smoke-Test Plan

A future smoke-test plan must verify:

- no migration apply occurs during Phase 8J;
- no generated type update occurs during Phase 8J;
- no staging insert implementation occurs during Phase 8J;
- no `public.tools` writes occur;
- no `discovered_tools` writes occur;
- candidate normalizer rejects raw/unsafe fields;
- candidate normalizer maps only allowlisted fields;
- candidate status cannot become `approved`, `published`, `promoted`, `live`, or `public`;
- duplicate pre-checks write advisory fields only;
- human review fields remain empty until admin action;
- audit metadata contains no raw unsafe payloads;
- cleanup behavior is not implemented unless separately approved;
- `npm run lint` passes;
- `npm run check` passes or reports the known Turbopack sandbox port-binding issue with an elevated/local rerun.

Future implementation smoke tests should include hostile payload fixtures containing raw HTML, headers, cookies, secrets, snippets, stack traces, raw JSON-like dumps, transport payloads, discovered/public tool payloads, and LLM prompts/responses.

## Required Gemini Gates

Required review gates:

- Gemini must approve this lifecycle/normalization plan before implementation.
- Gemini must separately review any future migration apply step.
- Gemini must separately review generated Supabase type updates.
- Gemini must separately review any API/helper/extraction code.
- Gemini must separately review any admin review UI changes.
- Gemini must separately review any duplicate detection implementation.
- Gemini must separately review any cleanup/retention tooling.
- Gemini must separately review any promotion/publish workflow.
- Gemini must separately review any LLM-assisted extraction design.

No single approval for Phase 8J authorizes implementation beyond this document.

## Final Phase 8J Decision Summary

Phase 8J defines the future candidate normalization and staging lifecycle contract for `public.discovery_candidate_tools`.

Decision state after Phase 8J:

- Candidate extraction remains not implementation-ready.
- The Phase 8I migration remains unapplied.
- Generated Supabase types remain unchanged.
- No candidate normalizer exists yet.
- No candidate writes exist yet.
- No API/UI/extraction behavior is authorized.
- Direct `public.tools` writes remain forbidden.
- Direct `discovered_tools` writes remain forbidden.
- Staged candidates remain unapproved and non-public.
- Human review remains mandatory.
- Duplicate checks remain mandatory before any promotion path.
- Approval, publish, ranking, recommendation, LLM, automation, scheduler, cron, crawler, and browser automation remain out of scope.

Recommended next action: send this Phase 8J plan to Gemini for lifecycle and normalization review before any implementation phase.
