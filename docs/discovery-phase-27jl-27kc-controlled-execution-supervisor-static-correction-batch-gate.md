# Phase 27JL–27KC Controlled-Execution Supervisor Static-Correction Batch Gate

## Authority, outcome, and authorization boundary

This record is governed only by the complete Phase 27JL–27KC implementation contract and its binding correction addendum.

```text
APPROVAL_TOKEN=APPROVE_PHASE_27JL_27KC_CONTROLLED_EXECUTION_SUPERVISOR_STATIC_CORRECTION_BATCH_SCOPE
CORRECTION_ADDENDUM_APPROVAL_TOKEN=APPROVE_PHASE_27JL_27KC_BINDING_CORRECTION_ADDENDUM_SHA256_9B4C71804C26F36BF0E16662AB3029F35B7C73719BA1199DFF6F11D080359656
CORRECTION_ADDENDUM_SHA256=9b4c71804c26f36bf0e16662ab3029f35b7c73719ba1199dff6f11d080359656
DETERMINATION=PHASE_27JL_27KC_STATIC_CORRECTION_COMPLETE_EXECUTION_REMAINS_UNAUTHORIZED
RECOMMENDATION=READY_FOR_PHASE_27JL_27KC_FINAL_STATIC_PATCH_REVIEW
NEXT_GATE=PROPOSE_FRESH_NO_EXECUTION_DEEP_AUDIT_AFTER_PHASE_27JL_27KC
IMPLEMENTATION_RESULT=PASSED_PHASE_27JL_27KC_CONTROLLED_EXECUTION_SUPERVISOR_STATIC_CORRECTION_BATCH_IMPLEMENTATION_READY_FOR_GEMINI_FINAL_REVIEW
EXECUTION_AUTHORIZED=false
SOURCE_EXECUTION_OCCURRED=false
SYNTAX_VALIDATION_OCCURRED=false
TEST_EXECUTION_OCCURRED=false
ENVIRONMENT_INSPECTION_OCCURRED=false
SENSITIVE_INSPECTION_OCCURRED=false
STAGING_OCCURRED=false
COMMIT_OCCURRED=false
PUSH_OCCURRED=false
FINAL_STATIC_RECONCILIATION=PASSED
```

Static correction is not runtime proof. The wrapper, supervisor, harness, validator, and tests remain inert in this phase. A later execution remains prohibited unless a distinct future external gate is reviewed and authorized.

## Repository binding

| Field | Required value |
| --- | --- |
| Repository | `/Users/jamescarlodumaua/aifinder` |
| Branch | `main` |
| Origin | `https://github.com/jcdumaua/aifinder.git` |
| Baseline, HEAD, local `main`, local `origin/main` | `31997b7e22fec9d8b6bee55dce7cf1d7974f9576` |
| Baseline parent | `633101229137bdebae0b532833f798c2a5e41ee8` |
| Baseline subject | `Correct Phase 27IB-27IU controlled execution contract` |
| Ahead/behind | `0/0` |
| Index | empty |
| Starting tracked tree | clean |
| Approved untracked count | `5` |

Any mismatch in these values is a stop condition. No network contact is permitted to resolve a mismatch.

## Non-circular resulting-identity binding

The final static reconciliation froze the changed-source bytes, bound their resulting identities below, and fixed the resulting supervisor SHA-256 in the repository wrapper. The supervisor authenticates itself from `AIFINDER_EXPECTED_SUPERVISOR_SHA256`; it does not embed the wrapper hash. The future external gate independently authenticates the repository wrapper.

This record cannot contain its own final SHA-256 without changing that SHA-256. Its resulting identity is therefore deliberately allocated to the external resulting-identity manifest, final static evidence, and Gemini final-review prompt after this file's bytes are frozen. The following field is an external binding instruction, not an in-file self-hash claim and must not be replaced with a purported self-hash inside this record:

```text
SUPERVISOR_RESULTING_SHA256=0d469d85cfcb974b978bd4e1742b1679c5516d14adf0e0b685f06caf1b83b317
WRAPPER_RESULTING_SHA256=f8a24e0b1b3f2c704d012aaa75746f7ace5b3d2caf7231a358b94ed0beb0fdc5
PHASE_27KC_RECORD_RESULTING_SHA256_EXTERNAL_BINDING=SELF_SHA256_RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AND_RESULTING_IDENTITY_MANIFEST
PHASE_27KC_RECORD_SELF_HASH_ALLOCATION=EXTERNAL_MANIFEST_AND_FINAL_EVIDENCE_ONLY
```

This allocation breaks all wrapper/supervisor/document hash cycles while retaining exact identity accountability.

## Exact eight-path scope and identities

Exactly six existing paths are modified and exactly two paths are created. No ninth path is authorized.

| # | Action | Path | Starting SHA-256 | Resulting SHA-256 binding | Resulting mode |
| ---: | --- | --- | --- | --- | --- |
| 1 | Modify | `testing/discovery-read-only-runtime-validation-harness.mjs` | `d08b0eaeeb9621917021f1c6e98eec21f4e7c0357cd2cf70dab34c7da43f5e24` | `3a8150985251345b149531c736dedf07519bbfc5a316f1de601fbc56c4f3a0ef` | `100755` |
| 2 | Modify | `testing/discovery-read-only-runtime-validation-harness-static-contract.test.mjs` | `0404360fa6016daa710941ec479444b59eb4dc15146467c8247644109f565869` | `a1384c664da7fb7174ef16f750f40a17c7c1f0bc2ef8a94dd0054e1898c4878e` | `100644` |
| 3 | Modify | `testing/discovery-read-only-runtime-validation-execution-wrapper-candidate.sh` | `2d149023ad28ce7d1ebcb12eda56ace02bdc5c3a112c49a5ab42f5336d7e9c8c` | `f8a24e0b1b3f2c704d012aaa75746f7ace5b3d2caf7231a358b94ed0beb0fdc5` | `100644` |
| 4 | Modify | `testing/discovery-read-only-runtime-validation-evidence-validator.mjs` | `77ef17723ef5b9848497c303d00d7c5a156ac2ebffce0bf3a2f612bd5dc3bf3a` | `dc24690bad19c09ee2cf74b336d99f3a57204e846d3a4470b8994cb9120287bb` | `100644` |
| 5 | Modify | `testing/discovery-read-only-runtime-validation-execution-contract.test.mjs` | `73465c67994cd132c5affc5a35731c3561daeda03f74d4aa14066d5bab0a0e59` | `9b6fa5e7d0e12a3b38fe5630b37b7128d68314fbafa06d64c4ffa011192a14c7` | `100644` |
| 6 | Modify | `docs/discovery-phase-27ib-27iu-controlled-execution-contract-final-correction-batch-gate.md` | `a9091afddd98371fe8b1e947f3dca8af0f77642954b5c0eab94d5f474208b11f` | `53c75f950458739612c8f8d65dd3c9b875dd6f0c164c10d1024d0599dac88e8f` | `100644` |
| 7 | Create | `testing/discovery-read-only-runtime-validation-execution-supervisor.mjs` | `NOT_APPLICABLE_CREATED_PATH` | `0d469d85cfcb974b978bd4e1742b1679c5516d14adf0e0b685f06caf1b83b317` | `100644` |
| 8 | Create | `docs/discovery-phase-27jl-27kc-controlled-execution-supervisor-static-correction-batch-gate.md` | `NOT_APPLICABLE_CREATED_PATH` | `EXTERNALLY_BOUND_AFTER_FINAL_BYTES_ARE_FROZEN` | `100644` |

```text
CHANGED_PATH_COUNT=8
MODIFIED_PATH_COUNT=6
ADDED_PATH_COUNT=2
NINTH_PATH_CHANGED=false
UNRELATED_DIFF=false
INDEX_EMPTY=true
```

## Unchanged active identities

| Path | SHA-256 | Mode | Required state |
| --- | --- | --- | --- |
| `testing/discovery-admin-route-read-only-dependency-inventory-source-harness.mjs` | `1c27b39909d8b50d4aa046abb271592c79fa56688eb704525713e119afe6c17e` | `100755` | unchanged, active dependency |
| `docs/discovery-phase-27gw-runtime-live-readiness-prerequisite-reconciliation-gate.md` | `c3cc24f772c79db7f3d8cb68a588c705c09a2874283e87a084f9603db912dc1e` | `100644` | unchanged, active dependency |

## Excluded governance identities

The following paths remain untracked, unstaged, mode `100644`, and byte-for-byte unchanged. Their contents are not inspected.

| Path | SHA-256 | Mode | Required state |
| --- | --- | --- | --- |
| `docs/discovery-phase-27fl-discovered-tool-duplicate-source-hardening-patch-planning-gate.md` | `6fe6e3d7abb1a5586bc3699ca7bfa6b9712dd355f45e0710bd714b1d94a7ce12` | `100644` | untracked, unstaged, content not inspected |
| `docs/discovery-phase-27fp-global-security-ledger-final-audit-reselection-gate.md` | `704b24609649b43d54a8a1dbfa0449ea346518c00186bb5eba305b7a39641f9a` | `100644` | untracked, unstaged, content not inspected |
| `docs/discovery-phase-27fq-audit-logs-focused-static-inspection-and-test-contract-planning-gate.md` | `2e215686d2efcc7b7b744110af3bc69cb64f46c18512f9797b23c8ba9e7cb723` | `100644` | untracked, unstaged, content not inspected |
| `docs/discovery-phase-27ft-audit-logs-source-hardening-patch-planning-gate.md` | `96bbe26236b7d69a48b46143c5eedd6776edd765f8143eeb43c5e66e187d19ca` | `100644` | untracked, unstaged, content not inspected |
| `docs/discovery-phase-27fx-global-security-ledger-final-closure-audit-gate.md` | `5353221fcd406aae20c992d5cd254b11a09cb37ddcda06468573e4ce03b67e45` | `100644` | untracked, unstaged, content not inspected |

## Eighteen-work-item map

| Work item | Static correction | Primary authorized path or record section | Runtime status |
| --- | --- | --- | --- |
| Phase 27JL | Reconcile the complete F01–F17 deep-audit ledger without dropping a finding. | This record, “F01–F17 reconciliation ledger” | Unproven; execution unauthorized. |
| Phase 27JM | Create the inert ESM Node supervisor with pure exports, a guarded CLI, and the exact future 30-step sequence. | `testing/discovery-read-only-runtime-validation-execution-supervisor.mjs` | Unproven; execution unauthorized. |
| Phase 27JN | Reduce the Bash candidate to an inert, zero-argument, three-binding, sealed single-supervisor launcher. | `testing/discovery-read-only-runtime-validation-execution-wrapper-candidate.sh` | Unproven; execution unauthorized. |
| Phase 27JO | Define and authenticate one strict canonical `/private/tmp` output directory. | Supervisor and this record | Unproven; execution unauthorized. |
| Phase 27JP | Bind all child activity to the exact 14-command registry, fixed executables, arguments, cwd, and sealed environments. | Supervisor and execution-contract test | Unproven; execution unauthorized. |
| Phase 27JQ | Define the bounded detached child runner, one-settlement state machine, and negative-PGID termination. | Supervisor and execution-contract test | Unproven; execution unauthorized. |
| Phase 27JR | Isolate each child's bounded stdout, stderr, and result captures with fixed exclusive files. | Supervisor and execution-contract test | Unproven; execution unauthorized. |
| Phase 27JS | Make harness stdout exactly one JSON object plus newline, send diagnostics to stderr, remove forced exit, and use safe-integer Git parsing. | Harness and static harness test | Unproven; execution unauthorized. |
| Phase 27JT | Change validator input to bounded stdin and require complete operation semantics plus exact authenticated success bytes. | Validator and execution-contract test | Unproven; execution unauthorized. |
| Phase 27JU | Keep independently implemented, statically tested safe-integer Git parsers; do not add a ninth shared module. | Harness, supervisor, both tests | Unproven; execution unauthorized. |
| Phase 27JV | Close active identities with a fixed supervisor table, four checkpoints, self-hash from the wrapper, and wrapper hash at the external gate. | Supervisor, wrapper, this record | Unproven; execution unauthorized. |
| Phase 27JW | Specify complete post-run repository, identity, child, and timer verification without remote contact. | Supervisor, execution-contract test, this record | Unproven; execution unauthorized. |
| Phase 27JX | Require preliminary and final `pbcopy`/`pbpaste` byte-equality passes before final evidence persistence. | Supervisor, execution-contract test, this record | Unproven; execution unauthorized. |
| Phase 27JY | Redesign both inert static tests around executable control-flow and deterministic mocks, including all 38 execution-contract assertions. | Both approved test paths | Not run; execution unauthorized. |
| Phase 27JZ | Add the exact four nonexecution tokens to the prior record while preserving its history and Phase 27GW map. | Prior correction record | Static text only; execution unauthorized. |
| Phase 27KA | Record the complete macOS fail-closed matrix with no row claiming runtime proof. | This record, “Fail-closed matrix” | Unproven; execution unauthorized. |
| Phase 27KB | Document the exact 25-step one-run future external gate without implementing it in the repository. | This record, “Future external gate” | Proposal only; not authorized. |
| Phase 27KC | Consolidate scope, identities, architecture, findings, proof limits, rollback, and future gate in this mode-`100644` record. | This record | Static record only; execution unauthorized. |

## F01–F17 reconciliation ledger

Path aliases used only to keep the ledger readable:

- **H** — `testing/discovery-read-only-runtime-validation-harness.mjs`
- **HT** — `testing/discovery-read-only-runtime-validation-harness-static-contract.test.mjs`
- **W** — `testing/discovery-read-only-runtime-validation-execution-wrapper-candidate.sh`
- **V** — `testing/discovery-read-only-runtime-validation-evidence-validator.mjs`
- **ET** — `testing/discovery-read-only-runtime-validation-execution-contract.test.mjs`
- **PR** — `docs/discovery-phase-27ib-27iu-controlled-execution-contract-final-correction-batch-gate.md`
- **S** — `testing/discovery-read-only-runtime-validation-execution-supervisor.mjs`
- **R** — this Phase 27KC record

Every future-runtime-proof field below is deliberately pending. Every rollback is fail-closed, requires separate authorization, and must not clean, restore, or revert automatically.

| ID | Original classification | Confirmed or refined | Affected path | Static correction | Static evidence | Future runtime proof | Rollback condition | Execution remains unauthorized |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| F01 | Deterministic test/document mismatch | **Confirmed** | PR, HT, ET, R | Add the four exact nonexecution tokens to PR and assert them in inert tests and this record. | Exact tokens are statically searchable in PR, tests, and R. | A later authorized test invocation must authenticate all four tokens; not performed. | If any token is absent, duplicated, or changes historical meaning, reject the batch and restore only PR under separate approval. | **Yes.** |
| F02 | `/tmp` versus `/private/tmp` contradiction | **Confirmed** | W, S, ET, R | Canonicalize all future output to the strict `/private/tmp/aifinder-runtime-validation-…-output` contract and reject lexical `/tmp`. | W declarations/guards, S path helper, ET negative cases, and this contract use `/private/tmp`. | A later gate must authenticate owner, mode, realpath, emptiness, and rejection cases; not performed. | On any broadened path or acceptance mismatch, reject W/S/ET and do not create or use an output directory. | **Yes.** |
| F03 | Ineffective argument rejection | **Confirmed** | W, S, ET | W requires zero arguments before use and ends with `main "$@"`; S CLI also rejects all arguments. | Static control-flow and ET assertions cover both boundaries. | A later authorized deterministic test must prove nonzero arguments exit categorically; not performed. | On bypass or use of caller arguments, reject W/S/ET and prohibit the future gate. | **Yes.** |
| F04 | Unbounded direct Git pre/postflight | **Confirmed** | W, S, ET | Remove Git from W; route only four fixed Git IDs through `runBoundedChild` with fixed executable, bounds, and environments. | Static registry inventory, no-Git wrapper search, and ET registry/environment assertions. | A later authorized mock and one-run gate must prove timeout/overflow/state behavior; not performed. | On direct or unbounded Git, reject S/W/ET and keep execution prohibited. | **Yes.** |
| F05 | Shared capture contamination | **Confirmed** | S, ET, R | Allocate fixed per-child stdout, stderr, and result captures; HARNESS bytes alone feed V. | Static filename builders, exclusive-write contract, no shared append path, and ET isolation assertions. | A later authorized mocked child sequence must prove captures cannot cross-contaminate; not performed. | On shared capture, append, or final-line extraction, reject S/ET and discard only future external output under separate authority. | **Yes.** |
| F06 | Watchdog and PID races | **Confirmed** | W, S, ET | Remove Bash watchdogs; S owns one timer, detached groups, negative-PGID termination, close/reap, cleanup, and one settlement. | Static no-watchdog W check plus S state machine and ET mock assertions. | A later authorized mock must exercise timeout/already-exited/kill/reap races; not performed. | On positive-PID polling, duplicate settlement, or incomplete cleanup, reject S/W/ET. | **Yes.** |
| F07 | Pathname-racy temporary I/O | **Confirmed; residual refined** | S, ET, R | Authenticate one canonical directory, retain its descriptor and identity, revalidate around every fixed exclusive mode-`600` create, and reject symlinks. Node exposes no general `openat` create, so same-UID swap-and-restore between checks remains explicit and unproven. | Static fd/dev/ino/mode/uid/realpath, lstat, exclusive-open, and anchor checks plus ET adversarial cases. | A later gate must prove observable filesystem authentication and assess the documented platform residual; not performed. | On pathname re-resolution, symlink acceptance, nonexclusive create, or unacceptable residual risk, reject S/ET and prohibit output use. | **Yes.** |
| F08 | Forced exit and final-line extraction risk | **Confirmed** | H, HT, S, ET | H writes one JSON record synchronously and uses `process.exitCode`; S authenticates the whole bounded buffer, never a final line. | Static absence of `process.exit(` and exact-buffer parser assertions in HT/ET. | A later authorized test must prove exact framing and flushed terminal output; not performed. | On forced exit, extra stdout, or line slicing, reject H/HT/S/ET. | **Yes.** |
| F09 | Git parser unsafe-integer divergence | **Confirmed** | H, HT, S, ET | Use independent equivalent parsers with exact format, `Number.isSafeInteger`, nonnegative components, and `2.35.2` minimum. | Static parser bodies and oversized/malformed/unsupported assertions in both tests. | A later authorized test must execute boundary vectors against both parsers; not performed. | On parser divergence or unsafe acceptance, reject H/S and their tests. | **Yes.** |
| F10 | Optional or inconsistent operation metadata | **Confirmed** | H, V, HT, ET | Require the ten named metadata fields for version, branch, head, and status; enforce presence/length and success consistency. | Static evidence shape and validator required-field/semantic tables plus tests. | A later authorized test must reject every missing or inconsistent field; not performed. | On optional metadata or inconsistent success semantics, reject H/V/tests. | **Yes.** |
| F11 | Exit-only validator acceptance | **Confirmed** | S, V, ET | V accepts bounded stdin only and emits exact success bytes; S authenticates both exit success and exact bytes. | Static CLI shape, exact literal bytes, and near-match assertions. | A later authorized test must reject byte-near matches despite exit zero; not performed. | On exit-only acceptance or filesystem input, reject S/V/ET. | **Yes.** |
| F12 | Incomplete active identity binding | **Confirmed** | W, S, ET, R | Allocate self-hash to W→S, seven active-table identities to S, wrapper identity to external gate, and this record hash externally. | Static identity table/checkpoints, wrapper environment key, ET coverage, and non-circular declaration here. | A later gate must independently authenticate every committed and ephemeral identity; not performed. | On omission, circularity, symlink, mode, or hash mismatch, reject the batch and stop before children. | **Yes.** |
| F13 | Command lookup under sealed launch | **Confirmed** | W, S, ET | Use absolute executables and fixed sealed environment maps without `PATH`, `HOME`, parent spread, or approval guard. | Static wrapper `env -i`, exact registry executable paths, environment builders, and ET assertions. | A later authorized gate must authenticate system executables and selected Node; not performed. | On lookup dependence or inherited environment, reject W/S/ET. | **Yes.** |
| F14 | Incomplete post-run verification | **Confirmed** | S, ET, R | Verify cwd, main-worktree, refs, origin, tree/index/untracked state, all identities, self-hash, active children, and timers. | Static post-run evidence builder and ET field-coverage assertions. | A later one-run gate and external verifier must independently confirm all values; not performed. | On any missing or mismatched field, classify fail-closed and reject final evidence. | **Yes.** |
| F15 | Unauthenticated output directory | **Confirmed** | W, S, ET, R | Bind the canonical path in W and independently authenticate path, lstat, symlink, mode `700`, owner, realpath, emptiness, and repo exclusion in S. | Static helper/CLI checks and ET acceptance/rejection cases. | A later authorized gate must create and S must reauthenticate the directory; not performed. | On any authentication failure, stop before file creation or child launch. | **Yes.** |
| F16 | Unverified clipboard delivery | **Confirmed** | S, ET, R | Perform preliminary and final bounded `PBCOPY`/`PBPASTE` exact-byte round trips; persist final evidence only after final equality. | Static two-pass sequence, fixed command IDs, result fields, and ET assertions. | A later authorized run must prove both byte comparisons and final persistence ordering; not performed. | On copy/readback/mismatch, classify failure, do not persist success evidence, and never retry. | **Yes.** |
| F17 | Token-focused tests | **Confirmed** | HT, ET, S | Redesign inert tests around pure helpers, executable control flow, deterministic lifecycle mocks, exact output, and negative behavior. | Static test inventory maps all required behavior and imports S without CLI activation. | A later separately authorized test run must execute the assertions; not performed. | If tests inspect comments alone or gain mutation capability, reject HT/ET and the dependent patch. | **Yes.** |

## Controlled-execution architecture

The future topology is strictly:

```text
separately authorized external gate
  -> one ephemeral mode-700 Bash wrapper
  -> one ESM Node supervisor
  -> fixed, bounded, isolated, non-shell child operations
```

The repository wrapper remains inert at mode `100644` and performs no orchestration. The external gate is responsible for reviewed-commit and manifest verification, absolute executable authentication, three-line ephemeral binding, reverse normalization, a separate global timeout, and independent final-state verification. The supervisor authenticates itself and the canonical output directory; verifies repository and active identities; runs all future syntax, test, harness, validator, and clipboard children through one runner; authenticates outputs; verifies post-run state; constructs bounded evidence; completes two clipboard round trips; and finishes with no active child or timer.

The implementation uses Node.js ECMAScript modules and only `node:child_process`, `node:crypto`, `node:fs`, `node:path`, `node:url`, `node:test`, and `node:assert/strict`, plus the fixed macOS executables `/usr/bin/git`, `/usr/bin/env`, `/usr/bin/pbcopy`, and `/usr/bin/pbpaste`. No package dependency or package file change is authorized.

### Supervisor inertness and pure interface

Importing the supervisor must not enter CLI behavior. CLI entry is allowed only when `import.meta.url` resolves to `process.argv[1]`; the CLI rejects all arguments, reads only the six approved environment keys, emits only bounded categorical failure evidence, uses `process.exitCode`, and never calls `process.exit()`.

The minimum pure export inventory is:

```js
export function parseGitVersion(value)
export function isGitVersionSupported(version)
export function validateCanonicalOutputDirectoryPath(value)
export function buildChildEnvironment(commandId, context)
export function getFixedCommandSpec(commandId, context)
export function classifyCaptureMetadata(stdoutBytes, stderrBytes)
export function validateHarnessStdout(bytes)
export function validateExactValidatorSuccess(bytes)
export function buildPreliminaryEvidence(context)
export function buildFinalEvidence(context)
export function reverseNormalizeEphemeralWrapper(ephemeralText, bindings)
export async function runBoundedChild(commandId, context, dependencies = {})
```

The optional test dependencies are limited to deterministic doubles for spawn, timers, process-group termination, and required filesystem writes. Production CLI calls cannot accept caller-provided dependencies.

The exact future supervisor CLI sequence is:

1. Verify no caller arguments.
2. Read and validate exact approved environment fields.
3. Verify `process.execPath`.
4. Verify supervisor self-identity.
5. Authenticate the output directory.
6. Verify repository path and `.git` main-worktree contract.
7. Run bounded `GIT_VERSION`.
8. Parse and validate Git version.
9. Run bounded `GIT_BRANCH`.
10. Run bounded `GIT_HEAD`.
11. Compare the dynamic expected baseline.
12. Run bounded `GIT_STATUS`.
13. Verify exact repository state.
14. Verify active source and dependency identities.
15. Run five isolated syntax checks.
16. Run one isolated two-test invocation.
17. Reverify active identities.
18. Run the default-guard harness.
19. Authenticate exact harness stdout.
20. Run the validator with harness JSON through stdin.
21. Authenticate exact validator success bytes.
22. Reverify complete local state and identities.
23. Construct preliminary bounded evidence.
24. Perform the first clipboard copy/readback/compare.
25. Construct final evidence.
26. Perform the second clipboard copy/readback/compare.
27. Persist bounded final evidence.
28. Verify the active-child set is empty.
29. Verify all timers are cleared.
30. Set exit code zero only after every requirement succeeds.

There is no retry.

### Child result, result classes, and capture classes

Every child result is a frozen plain object containing only these bounded categorical fields:

```text
command_id
success
result_class
exit_status
signal_present
timed_out
stdout_limit_exceeded
stderr_limit_exceeded
combined_limit_exceeded
stdout_bytes
stderr_bytes
stdout_present
stderr_present
stdout_length_class
stderr_length_class
process_group_termination_attempted
process_group_termination_succeeded
child_reaped
timer_cleared
settlement_count
```

Raw stdout and stderr remain internal to the runner envelope and never enter the child result or final evidence.

Required result classes are `SUCCESS`, `NONZERO_EXIT`, `NO_EXIT_STATUS`, `SIGNAL_TERMINATION`, `TIMEOUT`, `STDOUT_LIMIT_EXCEEDED`, `STDERR_LIMIT_EXCEEDED`, `COMBINED_LIMIT_EXCEEDED`, `SPAWN_ERROR`, `PROCESS_GROUP_TERMINATION_FAILED`, `CHILD_REAP_FAILED`, `OUTPUT_MALFORMED`, `OUTPUT_MULTIPLE_RECORDS`, `OUTPUT_MISSING`, `IDENTITY_MISMATCH`, `REPOSITORY_STATE_MISMATCH`, `VERSION_UNSUPPORTED`, `VERSION_MALFORMED`, `VALIDATION_REJECTED`, `CLIPBOARD_MISMATCH`, and `UNKNOWN_COMMAND`. No arbitrary exception message enters evidence.

Required successful capture classes are `EMPTY`, `UP_TO_64_BYTES`, `UP_TO_1_KIB`, `UP_TO_64_KIB`, and `UP_TO_1_MIB`. Crossing one MiB is a failure, not an `OVER_1_MIB` success category.

## Thin wrapper contract and binding verification

The repository wrapper contains exactly one full-line occurrence of each declaration and exactly three total occurrences of the full sentinel:

```bash
EXPECTED_EXECUTION_BASELINE="__BIND_AT_EXECUTION_GATE__"
NODE_EXECUTABLE="__BIND_AT_EXECUTION_GATE__"
OUTPUT_DIRECTORY="__BIND_AT_EXECUTION_GATE__"
```

```text
WRAPPER_SENTINEL=__BIND_AT_EXECUTION_GATE__
WRAPPER_SENTINEL_COUNT=3
WRAPPER_DECLARATION_COUNT=3
MALFORMED_OR_SHORTENED_SENTINEL_COUNT=0
```

Before the one `exec`, Bash built-ins enforce zero arguments, no remaining sentinel through the exact binding-specific format checks, a forty-character lowercase hexadecimal baseline, an absolute Node executable, an absolute canonical `/private/tmp` output path that is not lexical `/tmp`, and a sixty-four-character lowercase hexadecimal supervisor SHA-256. The fixed supervisor SHA field is bound to `0d469d85cfcb974b978bd4e1742b1679c5516d14adf0e0b685f06caf1b83b317`.

The wrapper ends with `main "$@"` and replaces itself through `/usr/bin/env -i` with exactly:

```text
LANG=C
LC_ALL=C
AIFINDER_EXPECTED_EXECUTION_BASELINE=<bound forty-character lowercase SHA>
AIFINDER_EXPECTED_NODE_EXECUTABLE=<bound absolute Node executable>
AIFINDER_OUTPUT_DIRECTORY=<bound canonical /private/tmp path>
AIFINDER_EXPECTED_SUPERVISOR_SHA256=<fixed resulting supervisor SHA-256>
```

It does not invoke Git, `shasum`, `stat`, `realpath`, `chmod`, validator, clipboard tools, or file/directory creation; manage a watchdog; capture output; use `PATH` or `HOME`; forward the approval guard; or use arguments after the zero-count check.

## Canonical output-directory contract

The pure path validator accepts only an absolute path matching exactly:

```js
/^\/private\/tmp\/aifinder-runtime-validation-[0-9]{8}T[0-9]{6}Z-[A-Za-z0-9_-]{6,64}-output$/
```

It rejects non-string, empty, relative, lexical `/tmp`, outside-`/private/tmp`, traversal, trailing-slash, malformed-run-identifier, and overlong values. The future CLI independently verifies a real directory by `lstatSync`, not a symlink, exact mode `0700`, owner `process.getuid()`, exact canonical realpath, empty before output creation, and outside the repository. The supervisor does not create this directory.

Every supervisor-created output uses a fixed filename, exclusive-create semantics, mode `0600`, the authenticated parent, no symlink following, and an already-open descriptor or bounded in-memory buffer when available.

Node does not expose a general `openat`-style directory-relative create. The supervisor therefore retains an authenticated directory descriptor, records dev/inode/mode/uid/realpath, and revalidates that authority plus each created file or lease anchor before and after pathname-based creation. Observable replacement fails closed. A same-UID swap-and-restore entirely between checks remains a documented platform residual; this static batch does not claim runtime elimination or authorize execution.

## Fixed command registry and environments

The registry contains exactly these 14 IDs and rejects every other ID as `UNKNOWN_COMMAND`:

1. `GIT_VERSION`
2. `GIT_BRANCH`
3. `GIT_HEAD`
4. `GIT_STATUS`
5. `HARNESS_SYNTAX`
6. `STATIC_TEST_SYNTAX`
7. `VALIDATOR_SYNTAX`
8. `EXECUTION_TEST_SYNTAX`
9. `SUPERVISOR_SYNTAX`
10. `STATIC_TESTS`
11. `HARNESS`
12. `VALIDATOR`
13. `PBCOPY`
14. `PBPASTE`

Each entry fixes its absolute executable, validated-context-only argument builder, cwd, environment builder, stdin policy, successful exit, timeout, stdout/stderr/combined maxima, exact-output authentication requirement, and persistence permission. No caller command, executable, shell string, `eval`, dynamic executable, or `shell: true` is accepted.

Git is fixed to `/usr/bin/git`. Branch, HEAD, and status use the exact config overrides `core.fsmonitor=false`, `core.untrackedCache=false`, `core.hooksPath=/dev/null`, empty `credential.helper`, `credential.interactive=false`, and empty `diff.external`. Git receives only `LANG=C`, `LC_ALL=C`, `GIT_CONFIG_NOSYSTEM=1`, `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_OPTIONAL_LOCKS=0`, `GIT_TERMINAL_PROMPT=0`, `GIT_PAGER=cat`, and `PAGER=cat`. Node uses the already authenticated `process.execPath`. No child environment uses a parent spread, `PATH`, `HOME`, or the approval guard.

## Bounded child runner and process-group policy

Every child uses `shell: false`, `detached: true`, piped stdout/stderr, and pipe-or-ignore stdin. The fixed per-child limits are:

```text
CHILD_TIMEOUT_MS=10000
STDOUT_MAX_BYTES=1048576
STDERR_MAX_BYTES=1048576
COMBINED_MAX_BYTES=2097152
RETRY_COUNT=0
```

The runner counts each stream and their sum before retaining a chunk, never retains bytes beyond a limit, and performs one terminal transition on timeout or overflow. It terminates the detached group once with `process.kill(-child.pid, "SIGKILL")`, categorically handles absent groups, permission failures, invalid PIDs, and kill-call failures, then awaits close/reap. It removes listeners, clears the one timer, and requires `settlement_count=1`. There is no positive-PID polling loop, shell watchdog, timeout marker, shared capture, Bash `ulimit`, `spawnSync`, shell command string, inherited stdio, or inherited environment.

## Per-child capture and provenance

When persistence is permitted, each fixed child ID receives only:

```text
<sequence>-<command-id>.stdout.capture
<sequence>-<command-id>.stderr.capture
<sequence>-<command-id>.result.json
```

The fixed registry produces safe lowercase names. Files are opened exclusively at mode `0600` beneath the authenticated directory without symlink following. Only the `HARNESS` child's exact bounded stdout buffer becomes the candidate JSON and the validator's stdin. There is no final-line extraction, mixed capture, shared append file, or child output in final evidence.

## Harness stdout and metadata contract

Successful harness stdout is exactly one JSON object followed by one newline, with no preceding or following stdout line, written synchronously. Bounded categorical diagnostics go only to stderr and expose no raw Git output, baseline, path, environment value, stack, or arbitrary error text. Terminal paths use `process.exitCode`; `process.exit(...)` is absent and no asynchronous output follows final evidence.

For each `version`, `branch`, `head`, and `status` operation, the evidence supplies all of:

```text
success
result_class
status
timed_out
output_limit_exceeded
signal_present
primary_output_present
diagnostic_output_present
primary_output_length
diagnostic_output_length
```

The harness uses the exact fixed Git operations and sealed Git environment, does not disclose the baseline, preserves the exact Phase 27GW map, and records unchanged active dependencies.

## Validator stdin, semantics, and exact-output contract

The validator's only CLI form is `node validator.mjs DEFAULT_GUARD_SKIPPED`, with `process.argv.length === 3`. It reads bounded synchronous bytes from file descriptor `0`; filesystem input-path validation is absent. It rejects empty or over-one-MiB input, NUL, invalid UTF-8, forbidden controls, duplicate keys, trailing JSON, arrays, non-plain roots, unknown fields, nested values, forbidden field names, and unsafe strings.

Every successful Git operation requires `success=true`, `result_class=SUCCESS`, `status=0`, `timed_out=false`, `output_limit_exceeded=false`, `signal_present=false`, `diagnostic_output_present=false`, and `diagnostic_output_length=EMPTY`. Successful version, branch, and HEAD require present nonempty primary output. Successful status permits empty or present primary output only when the presence and length class agree. Generally, present false means `EMPTY`, and present true means not `EMPTY`.

Successful stdout is byte-for-byte the following object plus exactly one newline, written synchronously with `process.exitCode` and no other stdout:

```json
{"valid":true,"result_class":"VALID"}
```

Failure remains one bounded categorical JSON object plus newline. The supervisor requires both child success and exact success bytes; an exit-only or near-match result is rejected.

## Safe-integer parser parity

The harness and supervisor retain independent implementations to avoid a ninth shared module. Both accept only:

```js
/^git version ([0-9]+)\.([0-9]+)\.([0-9]+)(?: \(Apple Git-([0-9]+)\))?$/
```

Every captured numeric string must convert to a nonnegative `Number.isSafeInteger`. The Apple suffix is syntax-only; comparison uses major/minor/patch and requires at least `2.35.2`. Inert tests cover bare `2.35.2`, a numeric Apple suffix, alpha/partial/extra suffixes, oversized major/minor/patch, below-minimum, exact-minimum, and above-minimum values. No parser test is executed in this phase.

## Identity allocation and checkpoints

The supervisor's fixed active table records exact path, regular-file/non-symlink status, SHA-256, and mode for:

1. harness;
2. static harness test;
3. validator;
4. execution-contract test;
5. prior Phase 27IB–27IU record;
6. dependency-inventory source harness;
7. Phase 27GW record.

It verifies this table (1) before any syntax/test/harness child, (2) after static tests, (3) after harness and validator, and (4) during final post-run verification. Its self-identity is supplied and authenticated separately through the wrapper environment. The external gate authenticates the repository wrapper and this record's externally allocated self-identity. No source identity is printed.

## Post-run verification contract

The future supervisor must establish all of the following without contacting the remote:

- cwd equals the fixed repository path and `.git` is the expected main worktree;
- branch is `main`;
- HEAD, local `main`, and local `origin/main` equal the bound baseline;
- origin URL equals the approved origin;
- tracked tree is clean and index empty;
- exactly five approved untracked paths remain;
- all five excluded hashes and modes match;
- every active source and unchanged dependency hash and mode matches;
- supervisor self-identity still matches;
- the tracked active-child set and tracked timer set are empty.

The external gate independently verifies repository-wrapper identity, ephemeral-wrapper hash, reverse normalization of exactly the three binding lines, repository-wrapper immutability, final local refs and state, and that no known run child survives.

## Two-pass clipboard and evidence-delivery contract

The preliminary pass builds bounded evidence with:

```text
CLIPBOARD_COPY=PENDING
CLIPBOARD_VERIFY=PENDING
CLIPBOARD_ROUND_TRIP=false
```

It serializes exactly one terminating newline, enforces the fixed evidence maximum, runs bounded `PBCOPY` with those bytes on stdin, runs bounded `PBPASTE`, and compares exact bytes. Any difference is `CLIPBOARD_MISMATCH`.

Only after that equality does the final pass build:

```text
CLIPBOARD_COPY=SUCCESS
CLIPBOARD_VERIFY=SUCCESS
CLIPBOARD_ROUND_TRIP=true
```

It repeats bounded copy/readback/exact comparison. Final evidence is persisted and overall success reported only after final equality. No raw capture, arbitrary error, or secret-like string enters clipboard evidence. Neither future supervisor runtime pass occurred in this static phase; the distinct implementation-evidence delivery round trip is recorded only in the external final evidence package.

## Static-test redesign — inert and not executed

The harness static test asserts exact one-line JSON stdout architecture, stderr-only diagnostics, no stdout `console.log`, no `process.exit(`, use of `process.exitCode`, safe-integer Git parsing and oversized rejection, exact Git operations and sealed environment, no baseline disclosure, the exact Phase 27GW map, and unchanged active dependencies.

The execution-contract test imports only pure supervisor helpers without activating the CLI and covers all 38 required cases:

1. unknown command rejection;
2. exact fixed registry IDs;
3. the exact three wrapper declarations;
4. exactly three sentinel occurrences;
5. absence of malformed sentinel forms;
6. wrapper `main "$@"`;
7. no wrapper Git/watchdog/capture/clipboard commands;
8. canonical `/private/tmp` acceptance;
9. lexical `/tmp` rejection;
10. traversal rejection;
11. fixed environment maps;
12. no `PATH` or `HOME`;
13. no approval guard;
14. one-MiB per-stream constants;
15. two-MiB combined constant;
16. ten-second timeout constant;
17. mocked timeout classification;
18. mocked stdout overflow;
19. mocked stderr overflow;
20. mocked combined overflow;
21. one settlement;
22. negative-PID process-group termination;
23. timer cleanup;
24. stream-listener cleanup contract;
25. exact harness stdout parser;
26. missing-newline rejection;
27. multiple-JSON-line rejection;
28. malformed-JSON rejection;
29. exact validator success bytes;
30. validator near-match rejection;
31. duplicate-key rejection;
32. missing-operation-field rejection;
33. presence/length inconsistency rejection;
34. profile mismatch rejection;
35. active-identity-table coverage;
36. post-run-verification-field coverage;
37. two-pass clipboard sequence;
38. prior-record exact four tokens.

These tests target executable code paths and pure helpers, use deterministic mocks by default, and receive no repository-mutation capability. They are source text only in this phase.

## Prior-record correction

The prior Phase 27IB–27IU record receives exactly:

```text
HARNESS_EXECUTED=false
STATIC_TESTS_EXECUTED=false
WRAPPER_EXECUTED=false
VALIDATOR_EXECUTED=false
```

These exact tokens repair the deterministic source-test/document mismatch while preserving the historical determination, historical recommendation, source identities, Phase 27GW map, and no-execution meaning. Unrelated prior-record sections are not rewritten.

## macOS fail-closed matrix

No row below claims runtime proof. “Pending” means a distinct future gate would have to demonstrate the behavior; that gate is not authorized by this record.

| # | Condition | Required fail-closed disposition | Static evidence disposition | Future runtime proof |
| ---: | --- | --- | --- | --- |
| 1 | Caller argument | Wrapper and supervisor reject before any child or output creation; categorical usage failure. | Zero-argument guards and inert negative assertion are statically reviewable. | Pending; unauthorized. |
| 2 | Unbound baseline | Wrapper rejects the exact sentinel before `exec`. | Full-line declaration and built-in guard are statically reviewable. | Pending; unauthorized. |
| 3 | Malformed baseline | Wrapper rejects anything other than forty lowercase hexadecimal characters. | Built-in pattern/length logic is statically reviewable. | Pending; unauthorized. |
| 4 | Unbound Node | Wrapper rejects the exact sentinel before `exec`. | Declaration and guard are statically reviewable. | Pending; unauthorized. |
| 5 | Relative Node | Wrapper rejects a nonabsolute executable. | Built-in absolute-path guard is statically reviewable. | Pending; unauthorized. |
| 6 | Wrong `process.execPath` | Supervisor reports bounded identity mismatch before child launch. | Exact environment comparison is statically reviewable. | Pending; unauthorized. |
| 7 | Unbound output directory | Wrapper rejects the exact sentinel before `exec`. | Declaration and guard are statically reviewable. | Pending; unauthorized. |
| 8 | Lexical `/tmp` | Wrapper and supervisor reject; only strict `/private/tmp` is accepted. | Exact path checks and negative test source are statically reviewable. | Pending; unauthorized. |
| 9 | Wrong output owner | Supervisor rejects before creating files or spawning children. | `process.getuid()` owner comparison is statically reviewable. | Pending; unauthorized. |
| 10 | Wrong output mode | Supervisor rejects any mode other than `0700`. | Mode authentication is statically reviewable. | Pending; unauthorized. |
| 11 | Output symlink | Supervisor rejects `lstatSync` symlinks and realpath mismatch. | Symlink and canonicalization checks are statically reviewable. | Pending; unauthorized. |
| 12 | Nonempty output directory | Supervisor rejects before output creation or child launch. | Entry-count check ordering is statically reviewable. | Pending; unauthorized. |
| 13 | Supervisor self-hash mismatch | Supervisor returns `IDENTITY_MISMATCH` before any child. | Hash comparison to the wrapper-supplied fixed value is statically reviewable. | Pending; unauthorized. |
| 14 | Active source mismatch | Supervisor returns `IDENTITY_MISMATCH` at any of four checkpoints. | Fixed identity table/checkpoint calls are statically reviewable. | Pending; unauthorized. |
| 15 | Dependency mismatch | Supervisor returns `IDENTITY_MISMATCH` before protected activity. | Both unchanged identities are statically listed and checked. | Pending; unauthorized. |
| 16 | Git missing | Fixed spawn failure becomes bounded `SPAWN_ERROR`. | Absolute executable registry and categorical mapping are statically reviewable. | Pending; unauthorized. |
| 17 | Git malformed version | Parser returns `VERSION_MALFORMED`, distinct from unsupported. | Exact regex and malformed cases are statically reviewable. | Pending; unauthorized. |
| 18 | Git unsafe integer | Parser returns `VERSION_MALFORMED`. | `Number.isSafeInteger` guards and oversized vectors are statically reviewable. | Pending; unauthorized. |
| 19 | Git unsupported | Parser returns `VERSION_UNSUPPORTED`. | Minimum `2.35.2` comparison is statically reviewable. | Pending; unauthorized. |
| 20 | Git timeout | Runner terminates the group once and returns `TIMEOUT` only after close/reap/cleanup. | State-machine branches and deterministic mock assertions are statically reviewable. | Pending; unauthorized. |
| 21 | Git stdout overflow | Runner retains no excess and returns `STDOUT_LIMIT_EXCEEDED`. | Pre-retention counting and limit constant are statically reviewable. | Pending; unauthorized. |
| 22 | Git stderr overflow | Runner retains no excess and returns `STDERR_LIMIT_EXCEEDED`. | Pre-retention counting and limit constant are statically reviewable. | Pending; unauthorized. |
| 23 | Syntax failure | Future sequence stops categorically; no test or harness follows. | Registry ordering and stop branch are statically reviewable. | Pending; unauthorized. |
| 24 | Test failure | Future sequence stops categorically; harness is not launched. | Sequence and categorical child handling are statically reviewable. | Pending; unauthorized. |
| 25 | Harness timeout | Runner terminates the group and reports `TIMEOUT`; validator is not launched. | Runner/sequence branches are statically reviewable. | Pending; unauthorized. |
| 26 | Harness overflow | Exact stream/combined overflow class stops before validator. | Bounded runner and harness output path are statically reviewable. | Pending; unauthorized. |
| 27 | Harness malformed stdout | Whole-buffer parser returns `OUTPUT_MALFORMED`. | Exact JSON/framing helper and negative source cases are statically reviewable. | Pending; unauthorized. |
| 28 | Harness multiple lines | Whole-buffer parser returns `OUTPUT_MULTIPLE_RECORDS`. | Multiple-record rejection is statically reviewable. | Pending; unauthorized. |
| 29 | Harness missing newline | Whole-buffer parser rejects the record. | Missing-newline assertion is statically reviewable. | Pending; unauthorized. |
| 30 | Harness nonzero | Child result stops the sequence before validation. | Exit/status authentication order is statically reviewable. | Pending; unauthorized. |
| 31 | Validator timeout | Runner terminates the group and reports `TIMEOUT`. | Registry limit and sequence branch are statically reviewable. | Pending; unauthorized. |
| 32 | Validator overflow | Exact stream/combined overflow class rejects validation. | Bounded runner and validator output limit are statically reviewable. | Pending; unauthorized. |
| 33 | Validator malformed output | Exact-output helper returns `VALIDATION_REJECTED`. | Whole-byte helper and malformed case are statically reviewable. | Pending; unauthorized. |
| 34 | Validator near-match output | Exit zero is insufficient; any byte difference is rejected. | Exact success literal and near-match assertions are statically reviewable. | Pending; unauthorized. |
| 35 | Validator semantic mismatch | Validator emits bounded categorical rejection. | Required fields and consistency checks are statically reviewable. | Pending; unauthorized. |
| 36 | Process-group termination failure | Runner returns `PROCESS_GROUP_TERMINATION_FAILED`; success evidence is impossible. | Negative-PGID call and categorical branches are statically reviewable. | Pending; unauthorized. |
| 37 | Child reap failure | Runner returns `CHILD_REAP_FAILED`; active-child closure fails. | Close/reap and active-set conditions are statically reviewable. | Pending; unauthorized. |
| 38 | Post-run mismatch | Supervisor returns `REPOSITORY_STATE_MISMATCH`; clipboard success is not finalized. | Complete post-run field inventory and ordering are statically reviewable. | Pending; unauthorized. |
| 39 | Clipboard copy failure | Bounded child failure stops the applicable pass; no retry. | Two-pass sequence and child checks are statically reviewable. | Pending; unauthorized. |
| 40 | Clipboard readback failure | Bounded child failure stops the applicable pass; no retry. | Two-pass sequence and child checks are statically reviewable. | Pending; unauthorized. |
| 41 | Clipboard byte mismatch | Return `CLIPBOARD_MISMATCH`; do not persist final success evidence. | Exact byte comparison and persistence ordering are statically reviewable. | Pending; unauthorized. |
| 42 | Signal interruption | Signal result is categorical, child group is closed, and success is impossible. | Signal fields, cleanup, and no-retry branches are statically reviewable. | Pending; unauthorized. |
| 43 | Outer-gate timeout | External gate terminates the one run, preserves status, verifies no known child survives, and never retries. | Future-gate contract is documented only. | Pending; unauthorized. |

## Future external gate — documented only, not implemented or authorized

A later external gate must perform exactly these 25 steps:

1. Verify the reviewed commit.
2. Verify a complete committed manifest.
3. Verify all eight changed-file identities.
4. Verify unchanged active dependencies.
5. Verify excluded identities.
6. Verify absolute system executables.
7. Verify the selected Node executable.
8. Create the canonical `/private/tmp` output directory.
9. Create one ephemeral wrapper.
10. Replace exactly three declaration lines.
11. Verify no sentinel residue.
12. Reverse-normalize exactly those lines.
13. Byte-compare every other byte.
14. Record the ephemeral SHA-256.
15. Set ephemeral mode `700`.
16. Invoke once through `/usr/bin/env -i /bin/bash`.
17. Apply one independent global timeout.
18. Never supply the approval guard.
19. Preserve exit status.
20. Inspect only bounded final evidence.
21. Independently verify post-run state.
22. Verify no known run process survives.
23. Never retry.
24. Never clean repository paths.
25. Stop after one run.

This is a future contract, not repository implementation and not authorization to execute. Its required successor remains:

`PROPOSE_FRESH_NO_EXECUTION_DEEP_AUDIT_AFTER_PHASE_27JL_27KC`

Direct execution is not the next gate.

## Runtime-unproven ledger

The following remain explicitly unproven at runtime:

- supervisor import inertness and guarded CLI behavior;
- wrapper argument/binding validation and sealed replacement;
- output-directory owner, mode, symlink, realpath, emptiness, and repository-exclusion checks;
- absolute executable availability and selected Node identity;
- Git availability, version parsing, fixed operations, timeout, and overflow behavior;
- child spawn, byte counting, negative-PGID termination, close/reap, listener/timer cleanup, and one settlement;
- exclusive per-child capture and provenance isolation;
- harness exact stdout framing, stderr diagnostics, metadata, and `process.exitCode` behavior;
- validator bounded stdin parsing, duplicate-key rejection, semantic closure, and exact success bytes;
- safe-integer parser parity under executed test vectors;
- all four active-identity checkpoints and supervisor self-hash authentication;
- complete post-run repository, identity, child, and timer verification;
- preliminary and final clipboard round trips and final-evidence persistence ordering;
- every deterministic mock and all static-test assertions;
- external manifest authentication, ephemeral wrapper reverse normalization, global timeout, and no-survivor check.

No runtime, syntax, test, synthetic-child, module-import, or clipboard proof was produced in this implementation phase.

## Phase 27GW preservation

The Phase 27GW classification map remains exactly:

```text
CURRENT_STATIC_EVIDENCE_SUFFICIENT_FOR_PLANNING=1
UNRESOLVED_REQUIRES_TARGETED_INSPECTION=5
BLOCKED_PENDING_SEPARATE_AUTHORIZATION=2
DOWNSTREAM_NOT_YET_ELIGIBLE=1
TOTAL_PREREQUISITE_DOMAINS=9
PRIMARY_CLASSIFICATION_CONFLICTS=0
PHASE_27GW_RECLASSIFICATION_OCCURRED=false
RUNTIME_HARNESS_DOMAIN=UNRESOLVED_REQUIRES_TARGETED_INSPECTION
```

No Phase 27GW reclassification occurs and the runtime-harness domain remains unresolved.

## Static implementation chronology

The implementation package follows the required dependency order:

1. Static baseline and exact-scope verification.
2. Inert tests first as source text; no tests run.
3. Supervisor constants, parsers, path validator, registry, environments, child state machine, capture metadata, exact-output helpers, identity helpers, evidence builders, and guarded CLI.
4. Validator and harness cross-file interface correction.
5. Thin-wrapper correction after inert supervisor hashing, with exact three sentinel declarations and mode `100644`.
6. Prior-record correction and this consolidated record.
7. Static-only imports/exports/IDs/constants/regexes/environments/no-execution/path/scope/whitespace reconciliation.
8. Final bounded evidence and Gemini review package; no stage, commit, or push.

This chronology does not imply source execution. Any final status, hash, mode, count, or artifact identity is bound only by the lead's final static reconciliation.

## Prohibited-activity confirmation

All of the following remain false:

```text
SOURCE_EXECUTION=false
SYNTAX_VALIDATION=false
TEST_EXECUTION=false
SYNTHETIC_CHILD_EXECUTION=false
MODULE_IMPORT=false
PACKAGE_SCRIPT_EXECUTION=false
LINT_EXECUTION=false
TYPECHECK_EXECUTION=false
BUILD_EXECUTION=false
APPLICATION_START=false
ROUTE_INVOCATION=false
ENV_FILE_INSPECTION=false
ENVIRONMENT_INSPECTION=false
SENSITIVE_INSPECTION=false
NODE_VERSION_INSPECTION=false
GIT_VERSION_INSPECTION=false
BASH_VERSION_INSPECTION=false
SYSTEM_EXECUTABLE_VERSION_INSPECTION=false
NETWORK=false
DATABASE=false
SUPABASE=false
ROUTE=false
MIGRATION=false
TYPE_GENERATION=false
DEPLOYMENT=false
PUBLISHING=false
OPERATIONAL_ACTION=false
STAGING=false
COMMIT=false
PUSH=false
FETCH=false
PULL=false
RESET=false
RESTORE=false
CLEANUP=false
CHECKOUT=false
SWITCH=false
STASH=false
AMEND=false
REBASE=false
DELETION=false
GIT_CONFIGURATION_CHANGE=false
```

Static source and diff inspection, exact text searches, hashing, mode inspection, line/byte counts, and correctly interpreted whitespace checks are not execution proof.

## Required final evidence and Gemini package bindings

The final lead package binds configuration, determination, complete repository state, the `8/6/2` scope, all changed/unchanged/excluded identities, the complete eighteen-item and F01–F17 maps, all architecture and interface results, prohibited-activity flags, and these five required `/tmp` artifacts:

| Artifact | SHA-256 | Mode | Line count | Byte count | Marker |
| --- | --- | --- | --- | --- | --- |
| `/tmp/aifinder-phase-27jl-27kc-static-correction-implementation-evidence.txt` | `RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AFTER_BYTES_FREEZE` | `600` | `RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AFTER_BYTES_FREEZE` | `RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AFTER_BYTES_FREEZE` | not applicable |
| `/tmp/aifinder-phase-27jl-27kc-static-correction-implementation-evidence.json` | `RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AFTER_BYTES_FREEZE` | `600` | `RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AFTER_BYTES_FREEZE` | `RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AFTER_BYTES_FREEZE` | not applicable |
| `/tmp/aifinder-phase-27jl-27kc-gemini-final-review-prompt.md` | `RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AFTER_BYTES_FREEZE` | `600` | `RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AFTER_BYTES_FREEZE` | `RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AFTER_BYTES_FREEZE` | `<!-- COMPLETE_PHASE_27JL_27KC_GEMINI_FINAL_REVIEW_PROMPT_END -->` |
| `/tmp/aifinder-phase-27jl-27kc-resulting-identity-manifest.json` | `RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AFTER_BYTES_FREEZE` | `600` | `RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AFTER_BYTES_FREEZE` | `RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AFTER_BYTES_FREEZE` | not applicable |
| `/tmp/aifinder-phase-27jl-27kc-static-interface-audit.md` | `RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AFTER_BYTES_FREEZE` | `600` | `RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AFTER_BYTES_FREEZE` | `RECORDED_IN_EXTERNAL_FINAL_EVIDENCE_AFTER_BYTES_FREEZE` | not applicable |

The governing scope-review prompt marker is `<!-- COMPLETE_PHASE_27JL_27KC_GEMINI_SCOPE_REVIEW_PROMPT_END -->`. The Gemini final-review prompt's final line must be exactly `<!-- COMPLETE_PHASE_27JL_27KC_GEMINI_FINAL_REVIEW_PROMPT_END -->`.

Gemini receives these exact choices:

```text
APPROVE_PHASE_27JL_27KC_CONTROLLED_EXECUTION_SUPERVISOR_STATIC_CORRECTION_PATCH_AND_AUTHORIZE_EXACT_SCOPE_COMMIT_PUSH
REQUEST_CHANGES_PHASE_27JL_27KC_CONTROLLED_EXECUTION_SUPERVISOR_STATIC_CORRECTION_PATCH
REJECT_PHASE_27JL_27KC_CONTROLLED_EXECUTION_SUPERVISOR_STATIC_CORRECTION_PATCH
```

If separately approved, the proposed commit subject is `Harden controlled execution with Node supervisor`. This static batch performs no commit or push.

Success may be finalized only after exactly eight approved paths, all resulting identities and modes, empty index, excluded-file preservation, required artifacts and markers, and evidence clipboard round trip are independently verified. Otherwise the categorical result is:

`FAILED_PHASE_27JL_27KC_CONTROLLED_EXECUTION_SUPERVISOR_STATIC_CORRECTION_BATCH_IMPLEMENTATION`

## Rollback and stop contract

Any baseline, branch, origin, starting state, starting hash/mode, unchanged dependency, excluded identity, exact-scope, interface, identity-allocation, static-evidence, or final-package mismatch stops the batch. Accidental execution, environment or sensitive exposure, a ninth path, circular identity, shell child, inherited environment, shared parser proposal, or direct-execution verification proposal also stops the batch categorically.

No automatic clean, restore, revert, reset, deletion, or retry is allowed. Preserve bounded evidence and report the categorical failure. Only after separate James approval may a rollback restore the six modified paths to the reviewed baseline and remove the two newly added paths, using exact path scope and leaving unchanged dependencies and all five excluded files untouched. A future external run failure likewise preserves its exit status and bounded evidence, performs no repository cleanup, and never retries.

## Final gate declaration

```text
DETERMINATION=PHASE_27JL_27KC_STATIC_CORRECTION_COMPLETE_EXECUTION_REMAINS_UNAUTHORIZED
RECOMMENDATION=READY_FOR_PHASE_27JL_27KC_FINAL_STATIC_PATCH_REVIEW
EXECUTION_AUTHORIZED=false
STATIC_CORRECTION_COMPLETE=true
IMPLEMENTATION_RESULT=PASSED_PHASE_27JL_27KC_CONTROLLED_EXECUTION_SUPERVISOR_STATIC_CORRECTION_BATCH_IMPLEMENTATION_READY_FOR_GEMINI_FINAL_REVIEW
NEXT_GATE=PROPOSE_FRESH_NO_EXECUTION_DEEP_AUDIT_AFTER_PHASE_27JL_27KC
EXACT_NEXT_ACTION=SUBMIT_PHASE_27JL_27KC_IMPLEMENTATION_PACKAGE_TO_GEMINI_FINAL_REVIEW
```

`SUBMIT_PHASE_27JL_27KC_IMPLEMENTATION_PACKAGE_TO_GEMINI_FINAL_REVIEW`
