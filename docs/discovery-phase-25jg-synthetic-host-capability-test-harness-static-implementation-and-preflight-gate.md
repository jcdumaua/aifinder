# Phase 25JG — Synthetic Host Capability Test Harness Static Implementation and Preflight Gate

## Phase identity

- Phase: `25JG`
- Batch: `C — Controlled Runtime Validation`
- Phase type: static harness implementation and preflight
- Approved predecessor phase: `25JF`
- Approved predecessor commit: `6125987474066f4df7db6c2ea781bd6e415b59a5`
- Phase 25JF artifact SHA-256: `a2727e327a2772cf15a7351ece899ecfc2b60562f3616960e7b89bb6dbb25925`
- Implementation package form: `NON_EXECUTABLE_TEXT_SNAPSHOTS`
- Capability execution in this phase: `NONE`
- Host inspection in this phase: `NONE`
- Network activity in this phase: `NONE`
- Environment-value access in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JG materializes the proposed synthetic host-capability harness as inert, reviewable source snapshots.

The package contains:

1. a shell-wrapper source snapshot;
2. a Python supervisor source snapshot;
3. a deny-all sandbox profile snapshot;
4. a loopback-only sandbox profile template;
5. an exact-address and exact-port sandbox profile template.

Every source file is stored with a `.txt` suffix and mode `0644`.

The proposed shell and Python entry points contain hardcoded execution blocks:

- shell: `EXECUTION_ENABLED="NO"`
- Python: `EXECUTION_ENABLED = False`

Therefore the Phase 25JG package is non-executable by construction.

No source snapshot is installed into the repository, marked executable, imported, compiled, syntax-checked, or run by this phase.

## Exact package identities

| Static source snapshot | SHA-256 |
|---|---|
| `aifinder-phase-25jg-shell-wrapper.sh.txt` | `17f973c3caec05a046b24aa8f0b079810156da7639139eb823af1d6d375d3b20` |
| `aifinder-phase-25jg-supervisor.py.txt` | `ce737f4c86c511c6d067d8fae54356179a474622b6a13088f6f7ed26100a1ba6` |
| `aifinder-phase-25jg-deny-all.sb.txt` | `5c358b8d847211333e7ba22df82d84f796b5f30a41a2682209a949d783adbd08` |
| `aifinder-phase-25jg-loopback-template.sb.txt` | `3d5e5990235c6abf3bdb4e99c3a8b2ced01516ae75f07718738d7694b0bfda14` |
| `aifinder-phase-25jg-exact-address-template.sb.txt` | `b32ade8296391f1ccbc56f2850960ebdf27613d2ff45d57f49ee77621c3d8939` |

These hashes identify the static review package only. They do not authorize materialization as executable files.

## Static shell-wrapper design

The shell snapshot:

- uses `set -uo pipefail`;
- embeds the exact Phase 25JF baseline and artifact hash;
- identifies the expected repository, origin, and branch;
- has no authorized execution path;
- exits with status `64`;
- creates no temporary directory;
- calls no capability tool;
- performs no host probe;
- runs no Python supervisor;
- prints only a blocked-state message.

A later phase must create a distinct reviewed shell artifact before any execution can occur.

## Static Python-supervisor design

The Python snapshot defines:

- fixed capability order CAP-01 through CAP-13;
- one `CapabilityFailure` class with named failure codes;
- metadata-only result records;
- `/private/tmp` root validation;
- deterministic public synthetic fixture generation;
- content inventories and hashes;
- bounded subprocess output;
- synthetic secret-canary detection;
- controlled loopback listeners;
- sandbox profile rendering;
- canonical synthetic destination-set logic;
- process-group ownership and cleanup;
- repository-preservation checks;
- authorization-file SHA-256 validation.

The supervisor begins with:

`EXECUTION_ENABLED = False`

Its `main` function exits with status `64` before argument parsing, authorization validation, temporary-root creation, listener creation, profile writing, subprocess execution, or capability testing.

## Capability implementation mapping

| Capability | Static implementation function | Execution state |
|---|---|---|
| CAP-01 | `cap_01_filesystem` | blocked |
| CAP-02 | `cap_02_clone_operation` | blocked |
| CAP-03 | `cap_03_destination_independence` | blocked |
| CAP-04 | `cap_04_source_independence` | blocked |
| CAP-05 | `cap_05_deny_all_network` | blocked |
| CAP-06 | `cap_06_loopback_only` | blocked |
| CAP-07 | `cap_07_exact_address_port_protocol` | blocked |
| CAP-08 | `cap_08_resolver_behavior` | blocked |
| CAP-09 | `cap_09_destination_set_logic` | blocked |
| CAP-10 | `cap_10_process_ownership` | blocked |
| CAP-11 | `cap_11_output_limit` | blocked |
| CAP-12 | `cap_12_secret_scan` | blocked |
| CAP-13 | `cap_13_cleanup_preservation` | blocked |

## Sandbox profile snapshots

### Deny-all profile

```scheme
(version 1)
(allow default)
(deny network*)
```

### Loopback-only template

```scheme
(version 1)
(allow default)
(deny network*)
(allow network-outbound (remote ip "127.0.0.1:__ALLOWED_PORT__"))
```

### Exact-address and exact-port template

```scheme
(version 1)
(allow default)
(deny network*)
(allow network-outbound (remote ip "__ALLOWED_ADDRESS__:__ALLOWED_PORT__"))
```

The profile syntax and enforcement behavior remain:

`UNPROVEN`

Phase 25JG does not invoke `sandbox-exec` or claim that these templates parse or enforce the intended restrictions.

## Preflight invariants for a later review phase

Before a future executable artifact may be created, a later static phase must verify:

1. all five package hashes exactly;
2. the shell execution sentinel remains `NO`;
3. the Python execution sentinel remains `False`;
4. no source snapshot has executable permission;
5. no source snapshot is inside the AiFinder repository;
6. no source snapshot imports or reads application configuration at module import time;
7. all network fixtures use synthetic loopback endpoints only;
8. CAP-08 uses static `localhost` only;
9. CAP-09 uses documentation-only addresses and no socket;
10. the secret canary is constructed from public fragments and is not a credential;
11. output limits are enforced before metadata retention;
12. cleanup is unconditional;
13. repository preservation is checked;
14. zero retries remain fixed;
15. authorization validation occurs before temporary fixture creation in any later executable version;
16. a later executable version has a new identity and new hashes.

## Static implementation cautions

The source snapshots are review candidates, not approved executable code.

The following issues must remain open until senior review:

- `sandbox-exec` profile grammar is unverified;
- the use of `(allow default)` may be too broad for final execution;
- process-tree inheritance behavior is unverified;
- loopback address and port matching behavior is unverified;
- CAP-08 resolver behavior may be too permissive and may require redesign;
- output-limit handling currently detects an oversized completed file rather than streaming termination in every path;
- listener acceptance timing requires process-state review;
- CAP-10 descendant verification requires stronger positive process-tree evidence;
- APFS clone semantics remain unproven;
- cleanup must be validated against every early-failure path;
- static code must undergo security review before any syntax check or run.

Any unresolved issue blocks executable materialization.

## Authorization template for a later phase

A future authorization package may propose text with this structure:

> Operator authorizes exactly one synthetic Phase 25J* host-capability attempt using the reviewed source and profile hashes listed in the immediately preceding approved preflight. The attempt may use deterministic public fixtures under `/private/tmp`, APFS clone testing, controlled loopback listeners, and reviewed sandbox profiles. It may not inspect environment values, resolve a private destination, use AiFinder source or dependencies as fixtures, build or start AiFinder, invoke C01 or C02, access a database or external service, install packages, commit, push, begin Batch D, reactivate operations, or launch publicly. Zero retries. Authorization is consumed on the first capability action.

Phase 25JG does not create or hash an authorization statement.

## Failure and cleanup policy

Any future executable version must:

- stop on the first capability failure;
- retain the exact named failure code;
- perform cleanup in a `finally` path;
- terminate controlled process groups;
- close controlled listeners;
- delete profiles, probes, outputs, fixtures, and metadata;
- verify repository preservation;
- perform no retry;
- perform no fallback;
- retain metadata only.

## Phase 25JG decision

Static harness package:

`IMPLEMENTED_AS_INERT_TEXT_SNAPSHOTS`

Shell execution:

`HARD_BLOCKED`

Python execution:

`HARD_BLOCKED`

Sandbox profile execution:

`NOT_AUTHORIZED`

Syntax checking:

`NOT_PERFORMED`

Capability execution:

`NOT_AUTHORIZED`

Host capability status:

`UNPROVEN`

Environment-value access:

`NOT_AUTHORIZED`

Application build:

`NOT_AUTHORIZED`

Production startup:

`NOT_AUTHORIZED`

C01:

`NOT_AUTHORIZED`

C02:

`NOT_AUTHORIZED`

Successful runtime validation:

`NOT_ACHIEVED`

Batch D:

`NOT_AUTHORIZED`

Operational reactivation:

`BLOCKED`

## Safe successor

The safe successor is:

**Phase 25JH — Synthetic Capability Harness Static Source Review and Authorization-Readiness Planning Gate**

Phase 25JH may:

- review the exact static source snapshots and hashes;
- identify implementation defects;
- require source revisions;
- define static syntax-validation commands for a later authorized phase;
- define the exact execution preflight and authorization package.

Phase 25JH must not:

- remove either execution sentinel;
- rename snapshots into executable source files;
- mark a file executable;
- run `bash -n`;
- compile or import the Python source;
- invoke `cp -cR`;
- invoke `sandbox-exec`;
- open listeners or sockets;
- perform DNS resolution;
- inspect environment values;
- build or start AiFinder;
- invoke C01 or C02;
- access a database or external service;
- install packages;
- authorize operational reactivation;
- begin Batch D;
- authorize public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JG only if all answers are affirmative:

1. Is Phase 25JG anchored to exact Phase 25JF commit `6125987474066f4df7db6c2ea781bd6e415b59a5`?
2. Is the Phase 25JF artifact identity preserved?
3. Are all harness components delivered only as `.txt` snapshots with mode `0644`?
4. Are both proposed entry points hard-blocked?
5. Does the Python supervisor exit before parsing authorization or creating temporary state?
6. Are CAP-01 through CAP-13 represented in fixed order?
7. Are fixtures deterministic, public, synthetic, and confined to `/private/tmp`?
8. Are AiFinder source, dependencies, environment values, databases, and external services excluded?
9. Are sandbox profiles explicitly unproven and unexecuted?
10. Are zero retries, stop-on-first-failure, unconditional cleanup, and metadata-only evidence preserved?
11. Are known implementation cautions recorded rather than hidden?
12. Is a distinct later executable artifact with new hashes required?
13. Is no authorization created by Phase 25JG?
14. Is Phase 25JH limited to static source review and authorization-readiness planning?
15. Are syntax checks, capability execution, value access, build, startup, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
16. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C prior runtime cycle: closed as fail-closed incomplete
- Phase 25JC architecture: 100%
- Phase 25JD implementation plan: 100%
- Phase 25JE network and environment design: 100%
- Phase 25JF static capability plan: 100%
- Phase 25JG inert static harness package: 100%
- Phase 25JG Gemini review: pending
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
