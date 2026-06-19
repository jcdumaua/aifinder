# Phase 6T — Real Fetch/Extract Planning + Safety Design

## Status

Phase 6T planning draft.

This phase is documentation-only.

No real fetch/extract implementation is approved in this phase.

## Current Approved Foundation

Phase 6R added the dry manual crawler executor claim endpoint:

- POST /api/admin/discovery/runs/manual/claim
- discoveryManualCrawlerExecutorRun rate-limit action
- Dry executor claim behavior only

Phase 6S confirmed Gemini / Antigravity approval:

- Phase 6R is safe.
- AiFinder may proceed to Phase 6T planning only.

## Phase 6T Goal

Design the safest path from dry manual crawler execution toward a future real fetch/extract pipeline.

This phase must answer:

- What is the smallest safe next crawler capability?
- What must remain locked?
- What data can be touched?
- What data must not be touched?
- What security gates are required before any real network request?
- What review gates are required before extraction or inserts?

## Non-Goals

Phase 6T does not approve:

- Real HTTP fetch implementation
- HTML parsing / extraction implementation
- LLM extraction or analysis
- Scheduler / cron / background worker
- Any insert into discovered_tools
- Any insert into public.tools
- Automatic approval of discovered tools
- Public user access to crawler execution

## Safety Locks That Remain Active

The following remain locked until a later explicit approval:

- External HTTP requests such as fetch or axios
- LLM calls for extraction or classification
- Candidate insertion into discovered_tools
- Approved tool insertion into public.tools
- Scheduler / cron execution
- Background worker execution
- Multi-source crawling
- Public or non-admin trigger access

## Recommended Next Capability After Planning

The next implementation phase should not be full crawling.

Recommended next step:

Phase 6U — Fetch-Disabled Request Builder / Preflight Validator

This would validate that the executor can prepare a safe request plan without performing the network request.

It may check:

- Source type is manual_curated_urls
- Source is enabled
- Run is pending
- URL is present
- URL is HTTPS only
- URL has a valid hostname
- URL is not localhost
- URL is not a private IP
- URL is not an internal metadata address
- URL is not a file/data/javascript/mailto URL
- URL passes allow/deny policy
- Request plan is written only to dry-run stats or audit metadata

It must still perform no network request.

## Future Fetch Design Principles

Before real fetch is allowed, the design should require:

1. Admin-only execution
2. CSRF verification
3. Dedicated executor rate limit
4. Source-level throttling
5. Domain-level throttling
6. Short request timeout
7. Small response size limit
8. Redirect limit
9. HTTPS-only default
10. SSRF protection
11. No cookies forwarded
12. No user credentials forwarded
13. Safe user-agent
14. Audit events for every state transition
15. Clear failure states
16. No discovered_tools insert during first fetch phase
17. No public.tools insert during first fetch phase

## Future Extraction Design Principles

Extraction must be a separate phase after fetch safety is approved.

Extraction should not begin until:

- Fetch preflight is approved
- Real fetch smoke test is approved
- Response storage rules are approved
- Evidence retention rules are approved
- Gemini reviews and approves the fetch-only phase

Extraction should initially be deterministic and minimal.

LLM analysis must remain locked until deterministic extraction is reviewed.

## Future Data Flow

Planned long-term flow:

1. Admin creates or enables a manual curated URL source.
2. Admin creates a manual discovery run.
3. Executor claims one pending run.
4. Executor validates source and URL safety.
5. Executor prepares a request plan.
6. Later phase: executor performs a constrained fetch.
7. Later phase: executor stores safe evidence.
8. Later phase: executor extracts candidate metadata.
9. Later phase: executor inserts into discovered_tools only after review.
10. Admin reviews discovered candidate.
11. Admin may approve into public.tools through existing moderation flow.

## Required Review Gate Before Any Real Fetch

Before any real fetch code is written, Gemini must review and approve:

- URL safety policy
- SSRF protection policy
- Redirect policy
- Timeout and response size limits
- Rate-limit design
- Audit event design
- Failure state design
- Evidence storage design
- No-insert guarantee for discovered_tools and public.tools

## Required Review Gate Before Any Extraction

Before any extraction code is written, Gemini must review and approve:

- Fetch-only smoke results
- Stored evidence format
- Parser boundaries
- Allowed metadata fields
- Failure handling
- No public publishing path
- No automatic approval path

## Phase 6T Decision

Phase 6T is a planning and safety-design phase only.

Allowed next step after this doc:

- Ask Gemini to review Phase 6T planning.

Not allowed yet:

- Real fetch implementation
- Extraction implementation
- LLM analysis
- Scheduler / worker
- Inserts into discovered_tools
- Inserts into public.tools
