# AiFinder Phase 27DU — Critical Security Batch A Verification Criteria Map

## Status
`PENDING_GEMINI_REVIEW_AS_BATCH_COMPONENT`

## Verification Requirements by Remediation Class

### Session Guard Patches
- unauthenticated requests fail closed;
- invalid or expired sessions fail closed;
- admin-role verification occurs before protected response generation;
- logout clears only approved session state;
- no token, cookie, or session value is logged;
- static tests cover 401/403 and successful admin flow.

### Server-Only Privileged Client Patch
- explicit server-only boundary;
- no client-component import chain;
- service-role environment reference remains server-side;
- no environment value is emitted;
- construction failure is fail closed;
- static import-boundary test required.

### Authorization and Input Validation Patches
- approved admin verification occurs before any mutation;
- input schema or equivalent bounded validator is present;
- invalid identifiers and malformed payloads fail closed;
- no mutation occurs on authorization or validation failure;
- audit event contains only safe metadata;
- negative tests required.

### Corrective Migration Plans
- historical migrations remain unchanged;
- each fix is a new migration;
- security-definer functions constrain `search_path`;
- grants/revokes are explicit;
- authorization and role checks are enforced in SQL;
- idempotence and rollback implications documented;
- database execution remains separately authorized.

## Test-First Contract
No implementation phase may begin without:
1. exact target file list;
2. exact expected test additions or updates;
3. rollback plan;
4. Gemini approval;
5. separate authorization for any database execution.
