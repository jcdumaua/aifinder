# Phase 25O — Configurable Verifier Rerun Approval Gate

## Status

Drafted for Gemini review.

Docs-only approval gate.

## Phase purpose

Phase 25O is a documentation-only approval gate for one future clean synced rerun of the repaired Discovery read-only runtime verifier.

This phase does not run the verifier.

This phase exists to define the exact safe execution parameters for a later execution phase, confirm the repaired verifier baseline, and preserve the strict Discovery Engine operational boundary.

## Baseline

Phase 25O starts from the pushed Phase 25N result documentation baseline:

```text
HEAD: c3529fe Document Phase 25N configurable verifier result
HEAD full: c3529feb4842cf5cecd6958274d0c7b7051da6bd
origin/main: c3529fe
Ahead count vs origin/main: 0
Behind count vs origin/main: 0
```

The repaired verifier remains at:

```text
testing/discovery-read-only-runtime-verification.mjs
```

Recorded verifier SHA from Phase 25M-R2 and Phase 25N:

```text
d0a23925a99b8f4405a405c5f0936e6465c7ce5b0bcf0c206847709b6a422f91
```

## Boundary

Allowed in Phase 25O:

- Create this approval gate document.
- Read repository files and git metadata.
- Statically confirm the repaired verifier exists.
- Statically confirm the expected CLI markers exist.
- Statically confirm the old hardcoded Phase 25E expected metadata is absent.
- Define the future verifier rerun command.
- Define the future execution success and failure handling.
- Prepare a Gemini review package.

Forbidden in Phase 25O:

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

## Approval target

Phase 25O is intended to approve exactly one future verifier rerun in a separate execution phase.

Recommended next execution phase:

**Phase 25P — Configurable Verifier Rerun Execution Gate**

The future execution phase may run exactly this command from the clean synced repository root:

```bash
node testing/discovery-read-only-runtime-verification.mjs \
  --expected-head "$(git rev-parse --short HEAD)" \
  --expected-subject "$(git log -1 --pretty=%s)"
```

The command must not be run in Phase 25O.

## Future execution preconditions

Before any Phase 25P execution, the future script must verify:

- repository path is `/Users/jamescarlodumaua/aifinder`;
- origin is `https://github.com/jcdumaua/aifinder.git`;
- branch is `main`;
- working tree is clean;
- local `HEAD` equals `origin/main`;
- ahead count is `0`;
- behind count is `0`;
- current HEAD is the committed and pushed Phase 25O approval gate commit;
- package and lockfile files are unchanged;
- no `AIFINDER_RUN_DISCOVERY_*` environment variable is set;
- verifier SHA matches the expected repaired verifier SHA unless intentionally updated through a separate approved phase;
- no source/API/UI/schema/migration/typegen/package files are changed.

## Future execution allowed behavior

The future Phase 25P execution may:

- run the repaired verifier once;
- pass `--expected-head` from the current short HEAD;
- pass `--expected-subject` from the current commit subject;
- collect terminal output;
- copy the success or failure package to clipboard;
- document the result in a later docs-only phase.

The future Phase 25P execution may not:

- run any DB command;
- run any live Supabase query;
- call any admin API route;
- start a local server;
- run crawler code;
- run extraction code;
- run LLM extraction;
- acquire evidence;
- stage candidates;
- execute candidate decisions;
- call approve_for_draft;
- write public tools;
- write discovered_tools;
- change source files;
- change package or lockfiles;
- create a commit;
- push.

## Expected successful rerun behavior

If the future Phase 25P rerun succeeds, it should confirm the verifier can execute against the current pushed baseline with explicit expected metadata.

Expected success indicators:

```text
expected_head_check=passed
expected_head_subject_check=passed
working_tree_scope=clean
PASSED: Discovery read-only runtime verification completed safely.
```

The result would mean only that repository-local static verification passed.

It would not mean the Discovery Engine is operationally reactivated.

## Expected failure handling

If the future Phase 25P rerun fails, the failure must be treated as a safe stop.

The future execution phase must:

- preserve the raw log;
- copy the raw terminal output to clipboard;
- not retry automatically;
- not patch the verifier;
- not mutate DB state;
- not invoke APIs;
- not proceed to operational reactivation;
- document the failure in a separate result or recovery phase.

A verifier failure is not a partial success.

## Current verifier status

The verifier is repaired and pushed on `main`.

The verifier uses explicit CLI metadata inputs:

```text
--expected-head
--expected-subject
```

The verifier fails closed for:

- missing expected head;
- missing expected subject;
- duplicate flags;
- unknown flags;
- missing values;
- empty values;
- wrong expected HEAD;
- wrong expected subject;
- wrong repository path;
- wrong origin;
- wrong branch;
- branch out of sync;
- unexpected working tree scope;
- `AIFINDER_RUN_DISCOVERY_*` environment pollution;
- missing required docs;
- missing boundary markers.

The verifier does not:

- query the database;
- prove live DB state;
- prove Supabase permissions;
- prove RLS behavior;
- run crawler code;
- run extraction code;
- run LLM extraction;
- acquire evidence;
- stage candidates;
- execute candidate decisions;
- publish public tools.

## Operational reactivation status

Operational reactivation remains blocked.

Phase 25O does not authorize:

- live DB reads;
- DB mutation;
- admin API invocation;
- crawler execution;
- extraction execution;
- LLM extraction execution;
- evidence acquisition;
- candidate staging;
- candidate decision execution;
- approve_for_draft;
- public tools writes;
- discovered_tools writes.

A successful future Phase 25P verifier rerun would still not authorize operational reactivation.

Operational reactivation would require a separate reviewed and approved phase after the verifier rerun result is documented.

## Approval phrase for the future execution gate

If Gemini approves this Phase 25O document and James later wants to run the execution gate, the explicit approval phrase should be:

```text
Approve run Phase 25P configurable verifier rerun.
```

This approval phrase authorizes only one repository-local verifier rerun using the exact command in this document.

It does not authorize DB/API/crawler/extraction/candidate/public-tools work.

## Risk controls

| Risk control | Phase 25O handling |
|---|---|
| Avoid stale hardcoded baseline | Uses explicit CLI expected metadata |
| Avoid accidental execution | Documents command but does not run it |
| Preserve branch sync safety | Future execution requires ahead 0 and behind 0 |
| Preserve no-DB boundary | Explicitly forbids direct DB access, live reads, and mutation |
| Preserve no-admin-API boundary | Explicitly forbids admin API invocation and local server startup |
| Preserve crawler/extraction boundary | Explicitly forbids crawler, extraction, LLM, and evidence acquisition |
| Preserve candidate decision boundary | Explicitly forbids candidate decision execution and approve_for_draft |
| Preserve public publishing boundary | Explicitly forbids public tools and discovered_tools writes |
| Preserve package safety | Explicitly forbids package, lockfile, and package script changes |
| Preserve commit/push gates | Keeps execution, result documentation, commit, and push separate |

## Discovery Engine progress estimate

Discovery Engine progress remains **99%** after Phase 25O drafting.

Reason:

Phase 25O is only an approval gate. It does not run the verifier, perform live checks, mutate data, or publish public tools.

## Recommended sequence after Phase 25O

If Phase 25O is approved, committed, and pushed, the next safe sequence is:

1. Phase 25P — Configurable Verifier Rerun Execution Gate.
2. Phase 25Q — Configurable Verifier Rerun Result Documentation.
3. Future separately approved operational reactivation planning gate, only if Phase 25P result is clean.

## Review questions for Gemini

Gemini should review whether:

1. Phase 25O accurately defines a safe rerun approval gate.
2. The proposed Phase 25P command is correct.
3. The execution preconditions are sufficient.
4. The success and failure handling are safe.
5. The DB/API/crawler/extraction/candidate/public-tools boundaries are preserved.
6. Operational reactivation remains correctly blocked.
7. This Phase 25O document is safe to commit as documentation-only after James approval.

## Review checklist

Before commit, verify:

- [ ] Gemini approves the Phase 25O configurable verifier rerun approval gate.
- [ ] Only this file is changed.
- [ ] `git diff --check` passes.
- [ ] `npm run check` passes if allowed by the local environment.
- [ ] No package or lockfile changed.
- [ ] No verifier/source/API/UI/schema/migration/typegen file changed.
- [ ] James explicitly approves commit.
- [ ] James separately approves push after commit.
