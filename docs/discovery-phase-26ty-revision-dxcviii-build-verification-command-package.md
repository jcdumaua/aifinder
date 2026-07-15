# Phase 26TY — Build Verification Command Package

## Bound baseline

`c5ba2e534f81b64743f4d66e66daab5b57f1979b`

## Discovered package scripts

```text
build: next build
check: npm run lint -- --quiet && npm run build
lint: eslint
```

## Proposed immutable execution sequence

This package is a draft for review only. It does not authorize execution.

### Step 1 — Repository and baseline checks

```bash
git fetch origin main
test "$(git branch --show-current)" = "main"
test "$(git rev-parse HEAD)" = "c5ba2e534f81b64743f4d66e66daab5b57f1979b"
test -z "$(git status --porcelain)"
test "$(git rev-list --count origin/main..HEAD)" = "0"
test "$(git rev-list --count HEAD..origin/main)" = "0"
```

### Step 2 — Environment presence checks without values

Only approved variable names may be checked. Output must be boolean presence markers such as:

```text
NEXT_PUBLIC_SUPABASE_URL_PRESENT=YES
NEXT_PUBLIC_SUPABASE_ANON_KEY_PRESENT=YES
SUPABASE_SERVICE_ROLE_KEY_PRESENT=YES
```

No value, prefix, suffix, length, checksum, or encoded form may be printed.

### Step 3 — Static checks before build

```bash
npm run check
```

### Step 4 — Production build

Candidate command:

```bash
npm run build
```

The exact command must match the reviewed package script.

### Step 5 — Client/server output separation

Inspect generated output paths only after a successful build:

- 
- 
- 
- build manifests and route manifests.

### Step 6 — Client-chunk privileged identifier search

Search client output only for identifier names and module-path fragments:

```text
SUPABASE_SERVICE_ROLE_KEY
supabaseAdmin
discoverySupabaseAdmin
createAdminClient
lib/supabase-admin
discovery-supabase-admin
```

Do not search for or print any environment value.

### Step 7 — Server-output confirmation

Confirm privileged identifiers occur only in server output where expected.

### Step 8 — Secret-like output scan

Fail closed if logs or preserved evidence contain:

- private-key blocks;
- bearer tokens;
- service-role values;
- JWT-like values;
- connection strings;
- cookies;
- database rows or response bodies.

### Step 9 — Cleanup and state verification

- remove temporary analysis files;
- preserve sanitized logs only;
- confirm repository source remains unchanged;
- do not stage, commit, or push build output.

## Proposed pass condition

`BUILD_SUCCEEDED_PRIVILEGED_IDENTIFIERS_ABSENT_FROM_CLIENT_OUTPUT_PRESENT_ONLY_IN_SERVER_OUTPUT`

## Proposed fail conditions

- build failure;
- client output match;
- unknown output layout;
- secret-like output;
- source change;
- dirty repository;
- incomplete evidence.

## Current state

`BUILD_VERIFICATION_COMMAND_PACKAGE_DRAFTED_NOT_EXECUTED`
