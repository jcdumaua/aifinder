# Phase 22AC — Candidate Staging Availability Read-Only Status Count Approval Gate

## Phase purpose

Phase 22AC is a documentation-only approval gate for a future live read-only aggregate status-count diagnostic.

This phase follows Phase 22AB, which concluded that Phase 22Z returned zero staged candidates and that the next safe path should be diagnostic/read-only before any fixture creation, extraction run, staging mutation, or candidate decision.

## Current baseline

Phase 22AC starts from the pushed Phase 22AB commit:

- `1b842e2 Document candidate staging availability planning gate`

## Boundary

Allowed in Phase 22AC:

- Verify repo state.
- Verify latest commit.
- Syntax-check the existing read-only listing script without execution.
- Run static inspection for candidate status references.
- Run existing project checks.
- Document the future live read-only aggregate status-count diagnostic.
- Prepare a Gemini review package.

Forbidden in Phase 22AC:

- No live DB read.
- No DB mutation.
- No candidate decision execution.
- No `approve_for_draft`.
- No public publishing.
- No cleanup mutation.
- No API/UI/Supabase/schema/migration/typegen changes.
- No additional implementation changes.
- No commit until after Gemini approval.
- No push.

## Why this gate exists

Phase 22Z returned:

```text
LIVE_CANDIDATE_LISTING_READ_ONLY_NO_RESULTS
phase=22Z
commit=e5b001a
status_filter=staged
limit=5
count=0
NO_CANDIDATE_SELECTED_BY_LISTING
```

That result proves only that the bounded listing returned zero rows for `candidate_status = "staged"`.

It does not answer:

- Whether the candidate table has zero rows total.
- Whether candidate rows exist under non-staged statuses.
- Whether prior fixture rows were archived or cleaned up.
- Whether future extraction/staging paths are producing candidates.

A read-only aggregate status-count diagnostic is the safest next step because it answers availability without selecting a candidate UUID or mutating data.

## Future execution phase

The future live read-only diagnostic should be a separate phase:

- **Phase 22AD — Candidate Staging Availability Read-Only Status Count Live Execution**

Phase 22AD should be execution-only and should run the approved status-count diagnostic at most once after James explicitly approves the exact phrase.

## Required future approval phrase

James must provide this exact phrase before Phase 22AD may run:

```text
Approve Phase 22AD read-only candidate staging availability status count
```

## Future diagnostic scope

The future Phase 22AD execution may only:

- Perform one live read-only query against `public.discovery_candidate_tools`.
- Retrieve only `candidate_status` values needed for aggregate counts.
- Print aggregate counts by status.
- Print the total row count observed.
- Confirm that no candidate UUID is selected.
- Confirm that no candidate decision is attempted.

The future Phase 22AD execution must not:

- Print candidate UUIDs.
- Select a candidate target.
- Run any candidate decision route.
- Call `approve_for_draft`.
- Insert into `public.tools`.
- Publish anything publicly.
- Mutate candidate rows.
- Run cleanup.
- Run migrations.
- Regenerate Supabase types.
- Change source/API/UI behavior.
- Commit or push.

## Required future environment values

The future command must use these safety values:

```text
AIFINDER_RUN_CANDIDATE_STAGING_STATUS_COUNT=1
AIFINDER_CANDIDATE_STAGING_STATUS_COUNT_PHASE=22AD
AIFINDER_CANDIDATE_STAGING_STATUS_COUNT_EXPECTED_COMMIT=<PHASE_22AC_PUSHED_COMMIT>
AIFINDER_CANDIDATE_STAGING_STATUS_COUNT_APPROVAL_PHRASE=Approve Phase 22AD read-only candidate staging availability status count
AIFINDER_CANDIDATE_DECISION_EXECUTION_ALLOWED=false
AIFINDER_CANDIDATE_DECISION_APPROVE_FOR_DRAFT_ALLOWED=false
AIFINDER_CANDIDATE_DECISION_PUBLIC_PUBLISHING_ALLOWED=false
AIFINDER_CANDIDATE_DECISION_CLEANUP_ALLOWED=false
```

The expected commit placeholder must be replaced only after Phase 22AC has been committed and pushed. It should equal the pushed Phase 22AC commit SHA.

## Future command template

This is a template only. Do not run it during Phase 22AC.

```bash
cd /Users/jamescarlodumaua/aifinder

AIFINDER_RUN_CANDIDATE_STAGING_STATUS_COUNT=1 \
AIFINDER_CANDIDATE_STAGING_STATUS_COUNT_PHASE=22AD \
AIFINDER_CANDIDATE_STAGING_STATUS_COUNT_EXPECTED_COMMIT=<PHASE_22AC_PUSHED_COMMIT> \
AIFINDER_CANDIDATE_STAGING_STATUS_COUNT_APPROVAL_PHRASE="Approve Phase 22AD read-only candidate staging availability status count" \
AIFINDER_CANDIDATE_DECISION_EXECUTION_ALLOWED=false \
AIFINDER_CANDIDATE_DECISION_APPROVE_FOR_DRAFT_ALLOWED=false \
AIFINDER_CANDIDATE_DECISION_PUBLIC_PUBLISHING_ALLOWED=false \
AIFINDER_CANDIDATE_DECISION_CLEANUP_ALLOWED=false \
node <<'NODE'
import { execFileSync } from "node:child_process";

const ENV = process.env;

function safeValue(value) {
  return String(value ?? "")
    .replace(/[\r\n\t]/g, " ")
    .replace(/[^\x20-\x7E]/g, "?")
    .slice(0, 300);
}

function failLocked(reason) {
  console.log("CANDIDATE_STAGING_STATUS_COUNT_READ_ONLY_FAIL_LOCKED");
  console.log(`reason=${safeValue(reason)}`);
  process.exit(1);
}

function requireEnv(name) {
  const value = ENV[name];
  if (!value) {
    failLocked(`missing ${name}`);
  }
  return value;
}

function requireFalse(name) {
  const value = requireEnv(name);
  if (value !== "false") {
    failLocked(`${name} must remain false`);
  }
}

const phase = requireEnv("AIFINDER_CANDIDATE_STAGING_STATUS_COUNT_PHASE");
if (phase !== "22AD") {
  failLocked("invalid phase");
}

const expectedCommit = requireEnv("AIFINDER_CANDIDATE_STAGING_STATUS_COUNT_EXPECTED_COMMIT");
if (!/^[a-f0-9]{7,40}$/.test(expectedCommit)) {
  failLocked("invalid expected commit");
}

const expectedPhrase = "Approve Phase 22AD read-only candidate staging availability status count";
if (requireEnv("AIFINDER_CANDIDATE_STAGING_STATUS_COUNT_APPROVAL_PHRASE") !== expectedPhrase) {
  failLocked("approval phrase mismatch");
}

if (ENV.AIFINDER_RUN_CANDIDATE_STAGING_STATUS_COUNT !== "1") {
  failLocked("missing opt-in");
}

requireFalse("AIFINDER_CANDIDATE_DECISION_EXECUTION_ALLOWED");
requireFalse("AIFINDER_CANDIDATE_DECISION_APPROVE_FOR_DRAFT_ALLOWED");
requireFalse("AIFINDER_CANDIDATE_DECISION_PUBLIC_PUBLISHING_ALLOWED");
requireFalse("AIFINDER_CANDIDATE_DECISION_CLEANUP_ALLOWED");

const status = execFileSync("git", ["status", "--short", "--branch"], { encoding: "utf8" }).trim();
if (status !== "## main...origin/main") {
  failLocked("repository must be clean and synced with origin/main");
}

const shortCommit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();
const fullCommit = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (shortCommit !== expectedCommit && fullCommit !== expectedCommit) {
  failLocked("current commit does not match expected commit");
}

const url = ENV.NEXT_PUBLIC_SUPABASE_URL || ENV.SUPABASE_URL;
const key = ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_SERVICE_ROLE || ENV.SUPABASE_SERVICE_KEY;
if (!url || !key) {
  failLocked("missing Supabase configuration");
}

const parsedUrl = new URL(url);
const queryUrl = `${parsedUrl.origin}/rest/v1/discovery_candidate_tools?select=candidate_status`;

const response = await fetch(queryUrl, {
  method: "GET",
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  },
});

if (!response.ok) {
  failLocked(`read-only status-count query failed with status ${response.status}`);
}

const rows = await response.json();
if (!Array.isArray(rows)) {
  failLocked("unexpected query response shape");
}

const counts = new Map();
for (const row of rows) {
  const value = safeValue(row?.candidate_status || "unknown");
  counts.set(value, (counts.get(value) || 0) + 1);
}

console.log("CANDIDATE_STAGING_STATUS_COUNT_READ_ONLY_PASS");
console.log(`phase=${phase}`);
console.log(`commit=${shortCommit}`);
console.log(`total_count=${rows.length}`);

for (const [statusValue, count] of [...counts.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`status_count.${statusValue}=${count}`);
}

console.log("NO_CANDIDATE_UUID_SELECTED");
console.log("NO_CANDIDATE_DECISION_EXECUTED");
NODE
```

## Expected safe output

The future execution should produce one of these markers:

- `CANDIDATE_STAGING_STATUS_COUNT_READ_ONLY_PASS`
- `CANDIDATE_STAGING_STATUS_COUNT_READ_ONLY_FAIL_LOCKED`

For a successful read, it must also print:

- `NO_CANDIDATE_UUID_SELECTED`
- `NO_CANDIDATE_DECISION_EXECUTED`

## Review conclusion

Gemini approved Phase 22AC for docs-only commit.

Gemini review summary:

- Documentation-only boundary confirmed: no source code, executable scripts, or database configurations are modified.
- No live DB reads, DB mutations, or candidate decision executions are authorized in Phase 22AC.
- No candidate is selected or recorded by this phase.
- The future diagnostic is bounded, read-only, aggregate-only, and designed to avoid candidate UUID exposure.
- The future diagnostic cannot auto-select a target.
- Public publishing, `approve_for_draft`, cleanup mutation, and candidate decision execution remain locked.
- The future execution template includes fail-closed safeguards including repository state verification, commit hash checking, explicit opt-in, and mutation flags set to `false`.

Commit approval is limited to this documentation update. The live read-only status-count diagnostic still remains forbidden until James separately approves Phase 22AD with the exact approval phrase.

## Next recommended phase after approval, commit, and push

Phase 22AD — Candidate Staging Availability Read-Only Status Count Live Execution.

Phase 22AD should run the approved aggregate status-count diagnostic once, capture all output with `tee`, copy raw terminal output to clipboard, preserve the original exit code, and document whether the script succeeded or failed.
