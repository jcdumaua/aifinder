# Phase 26SX — Service-Role and Middleware Risk Disposition

## Governing baseline

`a5051e4bc9a7b4c5888799113d7c098657a791b4`

## Risk SR-MW-001 — Client-reachable privileged import chain

Condition:

A privileged service-role module is directly or transitively importable by a client component.

Disposition:

- `BLOCK_PUBLIC_LAUNCH`
- `BLOCK_OPERATIONAL_REACTIVATION`
- require source correction and independent review.

Current state: `NOT_PROVEN_ABSENT`

## Risk SR-MW-002 — Privileged route without independent authorization

Condition:

A route or server action can invoke a privileged client based only on session presence or without an explicit role/permission check.

Disposition:

- `HIGH_PRIORITY_BLOCKER`
- require route/action authorization mapping.

Current state: `NOT_FULLY_VERIFIED`

## Risk SR-MW-003 — Middleware exclusion or matcher bypass

Condition:

An admin or protected route is excluded from middleware unexpectedly, or pathname logic permits bypass.

Disposition:

- `BLOCK_PUBLIC_LAUNCH`
- require matcher correction or verified route-level defense in depth.

Current state: `NOT_PROVEN_ABSENT`

## Risk SR-MW-004 — Reliance on middleware as sole security boundary

Condition:

Sensitive routes depend only on middleware and lack route-level authentication/authorization.

Disposition:

- `HIGH_PRIORITY_BLOCKER`
- require defense-in-depth review.

Current state: `NOT_FULLY_VERIFIED`

## Risk SR-MW-005 — Secret-safe logging not proven

Condition:

Privileged-client failures may expose credentials, tokens, cookies, row data, or response bodies.

Disposition:

- require targeted error/logging static review;
- prohibit sensitive-value output during later validation.

Current state: `OPEN`

## Closure criteria

The targeted service-role and middleware track may close only after static evidence establishes:

1. no client-reachable privileged import path;
2. server-only privileged module placement;
3. complete privileged call-site inventory;
4. independent authorization on every privileged call path;
5. explicit matcher inclusion/exclusion map;
6. route-level defense in depth for protected operations;
7. no obvious bypass path;
8. secret-safe logging and errors;
9. Gemini approval.

Runtime and bundle verification remain separate later gates.

## GAP-001 boundary

No result in this batch classifies or clears GAP-001.

- GAP-001 classification: `NOT_ESTABLISHED`
- GAP-001 quarantine: `ACTIVE`
- GAP-001 launch impact: `UNKNOWN`
- Public launch: `BLOCKED`

## Aggregate result

`SERVICE_ROLE_AND_MIDDLEWARE_SECURITY_RISK_REMAINS_OPEN`
