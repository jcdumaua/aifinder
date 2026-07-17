# AiFinder Phase 27DZ — Remediation A1 Implementation and Rollback Plan

## Status
`PENDING_GEMINI_REVIEW_AS_BATCH_COMPONENT`

## Proposed Implementation Scope

### Source targets
- `app/api/admin/logout/route.ts`
- `app/api/admin/session/route.ts`
- `lib/admin-auth.ts` only if route-level consistency cannot be achieved without changing the shared primitive.

### Test targets
Use the smallest existing relevant test file set. If no focused file exists, create one dedicated A1 test file under `testing/`.

## Implementation Boundaries
- no changes to database schema, migrations, RLS, service-role client construction, middleware, UI, or unrelated admin routes;
- no new dependencies;
- no environment-value changes;
- no cookie-name changes unless explicitly justified and reviewed;
- no broad refactor.

## Rollback
- restore exact pre-patch source and test blobs;
- remove only newly created A1 test files;
- verify clean type/static state;
- no database rollback required because A1 must not include database changes.

## Commit Discipline
1. test definitions first;
2. narrow implementation second;
3. focused verification evidence;
4. Gemini review;
5. exact-scope commit and push only after approval.
