# Phase 26TK — Security Remediation Priority and Eligibility Map

## Governing baseline

`0836a17ebf4fc27627d9e99fdbbd29a8b8971a2e`

## Priority 0 — Immediate launch blockers

Eligible only when a confirmed finding exists:

- privileged call without local authorization;
- admin route relying only on middleware;
- sensitive request, token, cookie, row, or payload logging;
- client-reachable service-role import chain;
- route that performs privileged work before validation or authorization.

Action:

- create a separate source-correction plan;
- obtain Gemini approval;
- implement in a narrowly scoped code phase;
- run static checks;
- later obtain controlled runtime proof.

## Priority 1 — High-priority hardening

- session present but role check unclear;
- full error-object logging;
- caller-chain ambiguity;
- missing CSRF on mutations;
- missing rate-limit coverage on abuse-sensitive routes;
- inconsistent unauthorized/forbidden handling.

## Priority 2 — Verification debt

- build-time client-bundle proof;
- matcher coverage confirmation;
- deployed RLS/policy proof;
- runtime authorization tests;
- production logging configuration review.

## Source-change eligibility rule

A source change is eligible only when:

1. a specific file and line-level condition is identified;
2. risk and acceptance criteria are explicit;
3. correction scope is minimal;
4. rollback is defined;
5. Gemini approves the plan;
6. the user explicitly authorizes implementation where required.

## Accelerated next sequence

To reduce unnecessary documentation-only cycles, the next reviewed batch should:

1. produce the exact per-file findings table;
2. separate confirmed findings from verification debt;
3. group all safe source corrections into one coherent implementation plan;
4. avoid one-phase-per-file fragmentation;
5. preserve runtime and DB gates.

## Current aggregate state

- Confirmed launch-blocking source findings: `NOT_YET_ESTABLISHED`
- High-priority hardening candidates: `PRESENT`
- Verification debt: `PRESENT`
- Source remediation eligibility: `PENDING_EXACT_FINDINGS_TABLE`
- Security readiness: `NOT_ESTABLISHED`
- GAP-001: `ACTIVE_QUARANTINE`
- Public launch: `BLOCKED`
- Operational reactivation: `BLOCKED`
