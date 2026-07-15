# Phase 26TR — Build Bundle Verification Plan

## Bound baseline

`b95d74f3e5596ed5efb1522d5563e07d98fdb089`

## Objective

Prove that privileged Supabase service-role modules and references do not enter client bundles.

## Target privileged modules

- `app/api/submit-tool/route.ts`
- `lib/discovery/discovery-supabase-admin.ts`
- `lib/supabase-admin.ts`

## Required evidence

1. Successful production build under approved configuration-presence checks.
2. Generated client-chunk inventory.
3. Search of client chunks for:
   - privileged module paths;
   - `SUPABASE_SERVICE_ROLE_KEY` identifier names;
   - privileged helper names;
   - server-only admin client exports.
4. Server-chunk confirmation for privileged modules.
5. No secret or environment value printed.
6. Build log free of unexpected warnings that undermine isolation.
7. Exact output hashes or manifest references sufficient for repeatability.
8. Independent Gemini review.

## Pass criteria

- privileged references appear only in server-side build outputs;
- no privileged module identifier appears in client chunks;
- no environment value is printed;
- build completes successfully;
- generated evidence is complete and reproducible.

## Fail criteria

- privileged identifier appears in any client chunk;
- build fails;
- evidence is incomplete;
- output contains secret-like values;
- build configuration assumptions are unresolved.

## Current state

`BUILD_BUNDLE_VERIFICATION_PLANNED_NOT_EXECUTED`
