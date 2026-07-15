# Phase 26TP — Consolidated Security Remediation Plan

## Bound baseline

`e68136c91dfd015d33126381e872536dffeafe2a`

## Exact findings aggregate

- Confirmed static defects: `0`
- Potential source findings: `52`
- Verification-debt items: `18`
- Favorable static-evidence items: `40`

## Decision rule

The automated exact tables are evidence indexes, not final vulnerability judgments.

Before source changes are authorized, Gemini must distinguish:

1. confirmed source defects;
2. false positives or non-sensitive surfaces;
3. acceptable static controls awaiting build/runtime proof;
4. verification debt that requires no source change;
5. launch-blocking findings requiring remediation.

## Consolidated remediation groups

### Group R1 — Privileged client isolation

Applicable when confirmed:

- client component imports a privileged module;
- re-export chain exposes privileged symbols;
- privileged helper lacks a server-only boundary;
- privileged call occurs before authorization or validation.

Proposed correction types:

- add or strengthen server-only boundaries;
- move privileged clients into dedicated server modules;
- remove unsafe re-exports;
- move authorization before privileged access;
- narrow privileged operations.

### Group R2 — Admin route defense in depth

Applicable when confirmed:

- mutation lacks explicit local admin authorization;
- mutation lacks CSRF protection;
- sensitive route relies only on middleware;
- verified identity is present but admin permission is unclear;
- abuse-sensitive route lacks suitable throttling.

Proposed correction types:

- standardize local admin-session checks;
- standardize CSRF validation for mutations;
- deny before all sensitive operations;
- add rate limiting where risk justifies it;
- normalize unauthorized and forbidden responses.

### Group R3 — Secret-safe logging

Applicable when confirmed:

- full error objects are logged;
- requests, headers, cookies, tokens, sessions, payloads, rows, or complete responses are logged;
- development diagnostics can reach production;
- public error responses expose internal exception text.

Proposed correction types:

- replace raw-object logging with allowlisted fields;
- use stable error codes and generic operation labels;
- redact identifiers;
- remove development-only diagnostics;
- return generic public messages.

### Group R4 — Verification-only evidence

No source change should occur for:

- client-bundle exclusion proof;
- transitive import proof when no unsafe chain is identified;
- deployed RLS/policy proof;
- runtime authorization and CSRF tests;
- production logging configuration review.

These require later approved build, configuration-shape, database, or runtime validation gates.

## Accelerated implementation strategy

After Gemini reviews the exact tables:

- group all confirmed R1–R3 corrections into one coherent implementation batch;
- avoid one phase per file;
- exclude verification-only R4 items from source edits;
- define exact changed-file allowlist;
- require `npm run check` and targeted static tests;
- preserve database, runtime, deployment, and publishing blocks;
- obtain a separate reviewed implementation authorization.

## Current authorization state

- Exact findings tables: `COMPLETE_PENDING_GEMINI_REVIEW`
- Confirmed source changes: `NOT_YET_AUTHORIZED`
- Consolidated remediation implementation: `NOT_AUTHORIZED`
- Build/runtime verification: `NOT_AUTHORIZED`
- Security readiness: `NOT_ESTABLISHED`
- GAP-001: `ACTIVE_QUARANTINE`
- Public launch: `BLOCKED`
- Operational reactivation: `BLOCKED`
