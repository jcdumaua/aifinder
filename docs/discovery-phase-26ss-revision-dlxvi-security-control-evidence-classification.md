# Phase 26SS — Security Control Evidence Classification

## Evidence classes

### Class A — Authentication and session control candidates

Includes code paths that appear to:

- read or verify sessions;
- retrieve authenticated users;
- redirect unauthenticated requests;
- bind cookies or server clients.

Classification: `STATIC_CONTROL_CANDIDATE_NOT_RUNTIME_VERIFIED`

### Class B — Admin and authorization control candidates

Includes code paths that appear to:

- check roles or admin status;
- gate administrative routes or actions;
- enforce permission-dependent behavior.

Classification: `STATIC_CONTROL_CANDIDATE_NOT_COVERAGE_VERIFIED`

### Class C — Service-role and privileged-client candidates

Includes source references to privileged Supabase clients or service-role configuration.

Required later proof:

- server-only usage;
- no client bundle exposure;
- narrow call sites;
- authenticated and authorized callers;
- safe logging and error handling.

Classification: `HIGH_RISK_STATIC_BOUNDARY_REQUIRES_TARGETED_REVIEW`

### Class D — RLS and policy candidates

Includes migrations, SQL, configuration, or documentation referring to row-level security or policies.

Required later proof:

- policies exist for all public tables;
- deny-by-default behavior;
- correct role targeting;
- no unintended bypass paths;
- migration state matches intended production state.

Classification: `DATABASE_SECURITY_EVIDENCE_REQUIRES_SEPARATE_REVIEW`

### Class E — Input validation and schema candidates

Includes Zod, parsing, sanitization, validation, and typed schema paths.

Required later proof:

- all untrusted inputs are covered;
- parse failures are handled safely;
- no unsafe coercion or bypass;
- API, form, and admin inputs use consistent validation.

Classification: `STATIC_VALIDATION_CANDIDATE_NOT_COVERAGE_VERIFIED`

### Class F — Middleware and request-boundary candidates

Includes middleware or proxy paths that may enforce routing, authentication, headers, or redirects.

Required later proof:

- matcher coverage;
- excluded paths;
- ordering;
- interaction with route-level checks;
- fail-closed behavior.

Classification: `STATIC_REQUEST_BOUNDARY_CANDIDATE_NOT_RUNTIME_VERIFIED`

## Security readiness conclusion

The repository contains multiple static security-control candidates, but readiness cannot be established from identifier presence alone.

Current result:

`SECURITY_CONTROLS_IDENTIFIED_VERIFICATION_INCOMPLETE`
