# Phase 27IB-27IU Controlled Execution Contract Final Correction Batch Gate

## Determination and recommendation

`PHASE_27IB_27IU_CONTROLLED_EXECUTION_CONTRACT_CORRECTED_EXECUTION_REMAINS_UNAUTHORIZED`

`READY_FOR_PHASE_27IB_27IU_FINAL_STATIC_PATCH_REVIEW`

This record covers the complete twenty-work-item Phase 27IB-27IU static correction batch. It authorizes source correction and static inspection only. It does not authorize execution of the harness, wrapper, validator, tests, Node syntax checks, Bash syntax checks, package scripts, routes, databases, network operations, deployment, or any operational action.

## Repository baseline and exact scope

- Repository: `/Users/jamescarlodumaua/aifinder`
- Branch: `main`
- Origin: `https://github.com/jcdumaua/aifinder.git`
- HEAD, local `main`, and local `origin/main`: `633101229137bdebae0b532833f798c2a5e41ee8`
- Ahead/behind: `0/0`
- Network revalidation: not performed

The exact scope is five modified tracked source files and this one new document:

1. `testing/discovery-read-only-runtime-validation-harness.mjs`
2. `testing/discovery-read-only-runtime-validation-harness-static-contract.test.mjs`
3. `testing/discovery-read-only-runtime-validation-execution-wrapper-candidate.sh`
4. `testing/discovery-read-only-runtime-validation-evidence-validator.mjs`
5. `testing/discovery-read-only-runtime-validation-execution-contract.test.mjs`
6. `docs/discovery-phase-27ib-27iu-controlled-execution-contract-final-correction-batch-gate.md`

No seventh implementation path is authorized.

## Source identities

| Path | Starting SHA-256 | Resulting SHA-256 | Mode |
|---|---|---|---|
| Runtime harness | `6f7247494fc7348aac42006b6dd97228027acfdcb606b7d0316fb638a79a7722` | `d08b0eaeeb9621917021f1c6e98eec21f4e7c0357cd2cf70dab34c7da43f5e24` | `100755` |
| Static harness contract test | `0bc5a0a7e152031ca981feb80c46bb709c0ace797a1a74b37c560780b5a0807c` | `0404360fa6016daa710941ec479444b59eb4dc15146467c8247644109f565869` | `100644` |
| Execution wrapper candidate | `5dc860227738ce78802eb39d39bef4f49f66f4d1549af3c0db4f80fa358be3fd` | `2d149023ad28ce7d1ebcb12eda56ace02bdc5c3a112c49a5ab42f5336d7e9c8c` | `100644` |
| Evidence validator | `a445704b7b682282e16aee44ff52c209dc155dc9056bee36d26d89881f579b62` | `77ef17723ef5b9848497c303d00d7c5a156ac2ebffce0bf3a2f612bd5dc3bf3a` | `100644` |
| Execution-contract test | `e2eaf6c0762ba68036c165b65f34fa5fe2d896f71437b8bb66233dcf8f993750` | `73465c67994cd132c5affc5a35731c3561daeda03f74d4aa14066d5bab0a0e59` | `100644` |

Document identity: `SELF_SHA256_RECORDED_IN_FINAL_IMPLEMENTATION_EVIDENCE`. This document remains mode `100644`; its final SHA-256 is bound externally to avoid circular self-reference.

## Baseline self-reference correction

The confirmed pre-correction defect was a permanent hard-coded expected commit in the harness. That made a later committed harness unable to validate its own execution-gate baseline. The corrected harness reads only `process.env[AIFINDER_EXPECTED_EXECUTION_BASELINE]`, requires the exact format `^[0-9a-f]{40}$`, and fails categorically with `EXPECTED_BASELINE_INVALID` when the value is missing or malformed. There is no fallback to current HEAD, a CLI argument, a file, configuration, database, or network source.

The baseline is used only for the equality comparison with the fixed `rev-parse HEAD` result. It is not printed, logged, added to bounded evidence, included in validator schema, or forwarded to a Git child. `expected_baseline_match` remains the only baseline semantic evidence field.

## Sealed Node execution contract

Every future Node child is launched through `/usr/bin/env -i`:

- Syntax checks: exactly `LANG=C LC_ALL=C`.
- Static tests: exactly `LANG=C LC_ALL=C`.
- Harness: exactly `LANG=C LC_ALL=C AIFINDER_EXPECTED_EXECUTION_BASELINE="$EXPECTED_EXECUTION_BASELINE"`.
- Validator: exactly `LANG=C LC_ALL=C`.

No `PATH`, `HOME`, approval guard, credential, ambient environment spread, caller-supplied environment, dynamic executable, dynamic profile, or caller argument is forwarded. The wrapper does not read, supply, synthesize, persist, or log the harness approval guard. The repository wrapper remains inert and non-executable.

## Default-guard semantic profile

The only accepted validator profile is the literal `DEFAULT_GUARD_SKIPPED`. The harness must exit zero. Its exact common semantic profile is:

| Field | Required value |
|---|---|
| `schema_version` | `1` |
| `harness_status` | `SKIPPED_BY_DEFAULT` |
| `approval_guard_matched` | `false` |
| `runtime_validation` | `false` |
| `route_invocation` | `false` |
| `network_call` | `false` |
| `live_db_read` | `false` |
| `db_mutation` | `false` |
| `operational_reactivation_status` | `BLOCKED` |
| `branch_match` | `true` |
| `expected_baseline_match` | `true` |
| `repository_state_class` | `EXPECTED_EXCLUDED_ONLY` |
| `tracked_tree_clean` | `true` |
| `index_empty` | `true` |
| `untracked_count` | `5` |
| `expected_excluded_set_match` | `true` |
| `expected_excluded_hash_match` | `true` |
| `git_version_supported` | `true` |
| `git_version_class` | `SUPPORTED` |

For each of `version`, `branch`, `head`, and `status`, the semantic profile requires `success=true`, `result_class=SUCCESS`, `status=0`, `timed_out=false`, `output_limit_exceeded=false`, and `signal_present=false`. Output-presence and output-length metadata remain schema-validated but are not fixed profile constants. Missing or unknown profiles fail with a bounded categorical result; semantic mismatch and schema rejection also fail closed. The fixed future validator form is `node validator.mjs DEFAULT_GUARD_SKIPPED /tmp/.../harness-candidate.json`.

## Git version and operation contract

The JavaScript parser accepts only `^git version ([0-9]+)\.([0-9]+)\.([0-9]+)(?: \(Apple Git-([0-9]+)\))?$`. The Bash 3.2 parser implements the same language: bare three-component Git versions or that exact numeric Apple suffix, with no alphabetic, extra, partial, or malformed suffix. Both enforce minimum version `2.35.2`; disagreement fails closed.

The fixed executable remains `/usr/bin/git`, with the six approved configuration overrides, exact eight-field sealed Git environment, and exactly four local operations: version, current branch, `rev-parse HEAD`, and porcelain status. There is no retry, network, database, route, mutation, repository output, or cleanup capability.

## Capture limits, child isolation, and watchdog

- Per-file capture bound: `MAX_CAPTURE_FILE_BYTES=1048576` bytes, one mebibyte each for stdout and stderr.
- Combined capture bound: `MAX_COMBINED_LOG_BYTES=2097152` bytes, two mebibytes.
- Child file limit: `MAX_CAPTURE_FILE_BLOCKS_1024=1024`, using the macOS/Bash 3.2 `ulimit -f` 1024-byte block policy.
- `MAX_CAPTURE_FILE_BLOCKS_512` is absent.

Each of the four Node syntax checks, the single two-test invocation, harness invocation, and validator invocation uses the shared fixed child runner. The runner establishes `ulimit -f "$MAX_CAPTURE_FILE_BLOCKS_1024"` inside a dedicated child subshell, then uses `exec /usr/bin/env -i` so the tracked child PID becomes the intended environment/Node process. Failure to establish the limit fails closed. A ten-second watchdog covers every source-executing child, kills and reaps a timed-out child, and is itself stopped and reaped. Per-file and combined post-checks remain mandatory.

The exact future outer invocation is `/usr/bin/env -i /bin/bash /tmp/<exact-bound-wrapper-path>`. Before that future invocation, an execution gate may replace exactly these two complete declaration lines, exactly once each, in an ephemeral mode-`700` copy:

```text
EXPECTED_EXECUTION_BASELINE="__BIND_AT_EXECUTION_GATE__"
NODE_EXECUTABLE="__BIND_AT_EXECUTION_GATE__"
```

No broad substitution, placeholder residue, shebang trust, or caller argument is allowed; the repository candidate stays byte-preserved outside those two lines and remains mode `100644`.

## Static-test and validator corrections

The static harness contract now covers dynamic baseline binding, exact validation and categorical failure, non-disclosure, Git-child separation, exact Apple Git parsing, minimum version, sealed Git environment, four-operation allowlist, and bounded default-guard evidence. The execution-contract test covers all four sealed Node launch forms, absent approval guard, exact profile semantics, parser parity, resource constants, child subshell, `ulimit`, `exec`, watchdog coverage, post-capture bounds, absolute future invocation, and exact two-line binding. These source-only tests were edited but not run.

The validator preserves its schema, negative-field rules, input bounds, and capability restrictions while adding exactly one fixed semantic profile. It does not add a baseline field or accept caller-defined profiles.

## macOS fail-closed correction matrix

The following are specified to fail closed and are not claimed as tested: missing or malformed expected baseline; unbound baseline or Node placeholder; sealed-environment setup failure; unavailable `/usr/bin/env` or `/bin/bash`; malformed Apple Git suffix; unsupported Git version; Bash/JavaScript parser disagreement; `ulimit -f` unit-assumption mismatch; inability to establish `ulimit -f 1024`; file-size enforcement termination; watchdog setup failure or PID mismatch; failure to `exec` the intended child; stdout or stderr over one mebibyte; combined captures over two mebibytes; nonzero harness exit; harness status other than `SKIPPED_BY_DEFAULT`; unexpectedly matched approval guard; unexpectedly true runtime, route, network, DB-read, or DB-mutation field; false expected-baseline match; repository-state mismatch; unsuccessful Git operation; missing or unknown validator profile; semantic-profile mismatch; validator schema rejection; post-run repository-state mismatch; or unavailable clipboard.

## Runtime-unproven properties

The harness, wrapper, validator, static harness test, and execution-contract test were not executed. Node syntax and Bash syntax were not validated. `/usr/bin/git`, its version, the Node executable, `/usr/bin/env`, and `/bin/bash` were not inspected. Dynamic baseline binding, sealed Node environments, Apple Git parsing, parser parity, `ulimit -f 1024`, the 1024-byte unit assumption on the user system, file-size signal behavior, watchdog behavior, `exec` PID behavior, validator semantics, evidence secrecy, repository-state behavior, and clipboard delivery were not runtime-proven. Execution eligibility is not granted.

## Phase 27GW and excluded-file preservation

- `CURRENT_STATIC_EVIDENCE_SUFFICIENT_FOR_PLANNING=1`
- `UNRESOLVED_REQUIRES_TARGETED_INSPECTION=5`
- `BLOCKED_PENDING_SEPARATE_AUTHORIZATION=2`
- `DOWNSTREAM_NOT_YET_ELIGIBLE=1`
- Total domains: `9`
- Primary conflicts: `0`
- `PHASE_27GW_RECLASSIFICATION_OCCURRED=false`

The runtime-harness domain remains unresolved. The five excluded governance files remain outside implementation scope and retain their exact identities. No environment or sensitive value was inspected. No source or syntax validation was executed. Nothing was staged, committed, pushed, fetched, pulled, deployed, or network-revalidated.

## Future gate and final result

`PROPOSE_SINGLE_SEPARATELY_REVIEWED_LOCAL_ONLY_STATIC_TEST_PLUS_HARNESS_EXECUTION_GATE`

`PASSED_PHASE_27IB_27IU_CONTROLLED_EXECUTION_CONTRACT_FINAL_CORRECTION_BATCH_IMPLEMENTATION_READY_FOR_GEMINI_FINAL_REVIEW`
