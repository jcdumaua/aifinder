# Phase 25L — Configurable Verifier Expected HEAD/Subject Implementation Planning Gate

## Status

Drafted for Gemini review.

## Phase purpose

Phase 25L defines the implementation plan for repairing the Phase 25F repository-local verifier so it can accept explicit expected HEAD and expected subject inputs while preserving strict fail-closed behavior.

This phase is documentation-only. It does not modify the verifier and does not rerun the verifier.

## Why this phase exists

Phase 25J attempted to rerun the committed verifier from clean synced `main` and failed safely because the verifier still expected the original Phase 25E baseline:

- expected HEAD: `c7e89af`
- expected subject: `Document Phase 25E runtime verifier planning`

The actual clean synced rerun state was:

- current HEAD: `8cd75f3`
- current subject: `Document Phase 25I verifier rerun approval gate`

Phase 25K recorded that failure as an audit result and carried forward **Option B — Add explicit configurable expected HEAD / subject inputs** as the preferred repair direction.

Phase 25L plans that repair before any verifier code change.

## Boundary

Allowed in Phase 25L:

- Create this documentation file.
- Read repository files and git metadata.
- Statically confirm the Phase 25F verifier exists and remains unchanged.
- Define the future verifier repair design.
- Define accepted expected HEAD and subject input method.
- Define fail-closed validation rules.
- Define future tests and review requirements.
- Prepare a Gemini review package.

Forbidden in Phase 25L:

- No verifier changes.
- No verifier execution.
- No retry.
- No source changes.
- No API changes.
- No UI changes.
- No package or lockfile changes.
- No package script changes.
- No schema, migration, or type generation changes.
- No direct database access.
- No live database reads.
- No DB mutation.
- No admin API invocation.
- No local server startup.
- No candidate decision execution.
- No approve_for_draft.
- No candidate UUID targeting.
- No extraction execution.
- No crawler execution.
- No LLM extraction execution.
- No evidence acquisition.
- No candidate staging.
- No public tools writes.
- No discovered_tools writes.
- No commit until Gemini review and explicit James approval.
- No push until a committed phase receives explicit James approval.

## Baseline terminal context

- Repository: `/Users/jamescarlodumaua/aifinder`
- Branch: `main`
- Phase 25L baseline HEAD at doc creation: `7febc18`
- Phase 25L baseline subject: `Document Phase 25K verifier rerun failure result`
- Synchronized with `origin/main`: yes
- Discovery Engine status: repository-local verifier exists; Discovery Engine is not operationally reactivated

## File targeted by future implementation

The future implementation phase should modify only:

`testing/discovery-read-only-runtime-verification.mjs`

No other verifier, helper, app, API, UI, schema, migration, package, or lockfile file should be changed.

## Recommended input method

Use CLI flags, not environment variables, for the expected HEAD and subject.

Recommended future command shape:

```bash
node testing/discovery-read-only-runtime-verification.mjs \
  --expected-head <expected-head> \
  --expected-subject "<expected subject>"
```

Reason:

- CLI flags are explicit at the call site.
- CLI flags avoid lingering shell environment state.
- CLI flags avoid confusion with `AIFINDER_RUN_DISCOVERY_*` opt-in execution markers.
- CLI flags can be validated strictly and rejected if missing, duplicated, empty, or unknown.

## Required future CLI flags

The future verifier should require exactly these flags:

```text
--expected-head
--expected-subject
```

The verifier should fail closed if either flag is missing.

The verifier should fail closed if either flag is supplied more than once.

The verifier should fail closed if an unknown argument is supplied.

The verifier should fail closed if either supplied value is empty or whitespace-only.

## Expected HEAD validation

The verifier should support either:

- the exact short HEAD returned by `git rev-parse --short HEAD`; or
- the exact full HEAD returned by `git rev-parse HEAD`.

The verifier should print both actual values:

```text
expected_head=<provided value>
actual_head_short=<git rev-parse --short HEAD>
actual_head_full=<git rev-parse HEAD>
```

The verifier should pass the HEAD check only if:

```text
expected_head == actual_head_short
```

or:

```text
expected_head == actual_head_full
```

Otherwise, it should print a clear error and exit non-zero.

## Expected subject validation

The verifier should compare the provided expected subject to:

```bash
git log -1 --pretty=%s
```

The match must be exact.

The verifier should print:

```text
expected_head_subject=<provided value>
actual_head_subject=<git log -1 --pretty=%s>
```

The verifier should fail closed if the values do not match exactly.

## Required safety behavior preserved

The future implementation must preserve all existing safety behavior:

- repository path check;
- origin URL check;
- branch must be `main`;
- branch sync check;
- working tree scope check;
- required documentation file checks;
- Phase 25C through Phase 25E boundary marker checks;
- Discovery documentation inventory;
- Discovery testing script inventory;
- `lib/discovery` inventory;
- admin discovery API route inventory;
- opt-in marker inventory;
- package script static inventory;
- static risk warnings;
- overall Discovery Engine progress report;
- no `AIFINDER_RUN_DISCOVERY_*` environment variables may be set;
- no DB/API/crawler/extraction/candidate/public publishing operation is executed.

## Required output changes

The future verifier output should replace the old fixed-baseline lines with configurable input lines.

Remove or stop using these hardcoded constants for current-state rerun behavior:

```text
EXPECTED_HEAD_SHORT="c7e89af"
EXPECTED_HEAD_SUBJECT="Document Phase 25E runtime verifier planning"
```

The future output should include:

```text
expected_head_input_source=cli_flag
expected_head=<provided value>
expected_head_subject=<provided value>
actual_head_short=<actual short hash>
actual_head_full=<actual full hash>
actual_head_subject=<actual subject>
expected_head_check=passed
expected_head_subject_check=passed
```

On failure, it should include one of:

```text
ERROR: Missing required --expected-head.
ERROR: Missing required --expected-subject.
ERROR: Duplicate --expected-head.
ERROR: Duplicate --expected-subject.
ERROR: Unknown argument.
ERROR: Expected HEAD did not match current HEAD.
ERROR: Expected HEAD subject did not match current HEAD subject.
```

## Fail-closed design

The repaired verifier must fail closed when:

- `--expected-head` is missing;
- `--expected-subject` is missing;
- either flag is duplicated;
- any unknown argument is supplied;
- either value is empty or whitespace-only;
- expected HEAD does not match actual short or full HEAD;
- expected subject does not match actual subject;
- current repo path is not `/Users/jamescarlodumaua/aifinder`;
- origin is not `https://github.com/jcdumaua/aifinder.git`;
- current branch is not `main`;
- branch is not synced with `origin/main`;
- working tree state is outside approved mode;
- any `AIFINDER_RUN_DISCOVERY_*` environment variable is set;
- any required documentation file or marker is missing;
- any internal command fails.

## Compatibility note

The Phase 25F baseline documentation remains valid as historical evidence.

The repair does not rewrite the historical baseline. It only makes the verifier reusable for future approved current-state checks.

## Future implementation phase

The next implementation phase should be:

**Phase 25M — Configurable Verifier Expected HEAD/Subject Implementation**

Phase 25M should modify only:

`testing/discovery-read-only-runtime-verification.mjs`

Phase 25M should not touch:

- source app files;
- API routes;
- UI files;
- `lib/discovery` runtime helpers;
- schema files;
- migration files;
- generated types;
- package files;
- lockfiles.

## Future Phase 25M verification requirements

Phase 25M should verify:

1. `node --check testing/discovery-read-only-runtime-verification.mjs` passes.
2. Running without flags fails closed.
3. Running with only `--expected-head` fails closed.
4. Running with only `--expected-subject` fails closed.
5. Running with duplicate `--expected-head` fails closed.
6. Running with duplicate `--expected-subject` fails closed.
7. Running with an unknown flag fails closed.
8. Running with wrong expected HEAD fails closed.
9. Running with wrong expected subject fails closed.
10. Running with correct current short HEAD and exact current subject passes.
11. Running with correct current full HEAD and exact current subject passes.
12. Running with any `AIFINDER_RUN_DISCOVERY_*` environment variable set fails closed.
13. `git diff --check` passes.
14. `npm run check` passes if allowed by the local environment.
15. Only the verifier file is changed.

## Future successful command example

After implementation, the intended successful command from clean synced `main` should look like:

```bash
node testing/discovery-read-only-runtime-verification.mjs \
  --expected-head "$(git rev-parse --short HEAD)" \
  --expected-subject "$(git log -1 --pretty=%s)"
```

This command is still repository-local and read-only.

It still must not prove live DB state, Supabase permissions, RLS behavior, crawler behavior, extraction behavior, candidate decision correctness, or public publishing readiness.

## Future result documentation

After Phase 25M implementation, a separate result documentation phase should record:

- what changed;
- which negative tests failed closed;
- which positive tests passed;
- that no operational reactivation occurred;
- whether Gemini approved the implementation result.

## Crawler status clarification

Crawler-related infrastructure exists in the repository, but Phase 25L does not activate, test, or validate crawler behavior.

For this gate:

- crawler execution remains blocked;
- evidence acquisition remains blocked;
- extraction remains blocked;
- no crawler command is run;
- no crawler readiness claim is made.

## Operational reactivation status

Operational reactivation remains blocked.

No Phase 25L or planned Phase 25M step authorizes:

- direct DB access;
- live DB reads;
- DB mutation;
- admin API invocation;
- local server startup;
- crawler execution;
- extraction execution;
- LLM extraction execution;
- evidence acquisition;
- candidate staging;
- candidate decisions;
- approve_for_draft;
- public tools writes;
- discovered_tools writes.

## Risk controls carried forward

| Risk control | Phase 25L handling |
|---|---|
| Preserve docs-first repair sequencing | Plans the verifier repair before changing code |
| Avoid unreviewed patch | No verifier change occurs |
| Avoid automatic retry | No verifier execution or retry occurs |
| Preserve strict HEAD verification | Expected HEAD remains mandatory and exact |
| Avoid stale hardcoding | Expected HEAD and subject become explicit inputs |
| Avoid lingering env state | CLI flags are preferred over environment variables |
| Preserve DB safety | No direct DB access, no live DB reads, no DB mutation |
| Preserve admin API safety | No admin API invocation and no local server startup |
| Preserve candidate decision sensitivity | No candidate UUID, no decision command, no approve_for_draft |
| Preserve crawler/extraction boundary | No crawler, extraction, LLM, or evidence acquisition |
| Preserve public publishing boundary | No public tools or discovered_tools writes |
| Preserve package safety | No package, lockfile, or package script changes |
| Preserve commit/push gates | Commit and push remain separate explicit gates |

## Discovery Engine progress estimate

Discovery Engine progress remains **99%** after Phase 25L drafting.

Reason:

Phase 25L plans a repair to the repository-local verifier, but it does not implement the repair, execute a successful verifier rerun, perform live checks, mutate data, or publish public tools.

## Review questions for Gemini

Gemini should review whether:

1. Phase 25L correctly remains docs-only and does not modify or execute the verifier.
2. CLI flags are the safest input method compared with environment variables.
3. The expected HEAD and subject validation rules are strict enough.
4. The fail-closed cases are complete.
5. The future Phase 25M verification requirements are sufficient.
6. Operational reactivation remains blocked.
7. This Phase 25L document is safe to commit as documentation-only after James approval.

## Review checklist

Before commit, verify:

- [ ] Gemini approves the Phase 25L configurable verifier implementation planning gate.
- [ ] Only this file is changed.
- [ ] `git diff --check` passes.
- [ ] `npm run check` passes if allowed by the local environment.
- [ ] No package or lockfile changed.
- [ ] No verifier/source/API/UI/schema/migration/typegen file changed.
- [ ] James explicitly approves commit.
- [ ] James separately approves push after commit.
