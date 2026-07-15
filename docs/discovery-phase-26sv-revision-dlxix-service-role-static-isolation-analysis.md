# Phase 26SV — Service-Role Static Isolation Analysis

## Bound baseline

`a5051e4bc9a7b4c5888799113d7c098657a791b4`

## Inspection boundary

Committed JavaScript and TypeScript source files were inspected statically for privileged Supabase client and service-role references.

No environment file or environment value was opened. No credential was printed. No source was executed. No server, route, database, network service, build, or client bundle was invoked.

## Inventory result

- Files containing service-role or privileged-client references: `3`
- Service-role files also carrying a top-level client directive: `0`
- Service-role files containing a server-only marker/reference: `1`

## Service-role reference files

```text
app/api/submit-tool/route.ts
lib/discovery/discovery-supabase-admin.ts
lib/supabase-admin.ts
```

## Representative reference evidence

```text
app/api/submit-tool/route.ts:32:const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
lib/discovery/discovery-supabase-admin.ts:7:const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
lib/supabase-admin.ts:4:const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
```

## Service-role/client-directive overlap

```text

```

Interpretation:

- Empty output is favorable static evidence but does not prove bundle exclusion.
- Any overlap is a high-risk finding requiring immediate containment review.

## Service-role/server-only overlap

```text
lib/discovery/discovery-supabase-admin.ts
```

Interpretation:

- A server-only marker strengthens static isolation evidence.
- Its absence does not prove exposure, because route handlers, server actions, and server components may still be server-only by framework semantics.
- Framework semantics still require call-site and import-chain verification.

## Static isolation questions

The following must be answered before the service-role risk can close:

1. Are all privileged-client definitions located in server-only modules?
2. Can any client component import those modules directly or transitively?
3. Are all call sites authenticated and separately authorized?
4. Are privileged operations narrowly scoped?
5. Are errors and logs free of secret or sensitive row data?
6. Are public route handlers prevented from invoking privileged clients without authorization?
7. Is the service-role reference excluded from client bundles by construction and later build evidence?

## Current determination

`SERVICE_ROLE_STATIC_ISOLATION_PARTIALLY_ESTABLISHED_RUNTIME_AND_BUNDLE_PROOF_MISSING`
