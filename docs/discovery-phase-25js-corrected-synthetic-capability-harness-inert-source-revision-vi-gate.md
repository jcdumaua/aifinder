# Phase 25JS — Corrected Synthetic Capability Harness Inert Source Revision VI Gate

## Phase identity

- Phase: `25JS`
- Batch: `C — Controlled Runtime Validation`
- Phase type: corrected inert source revision VI
- Approved predecessor phase: `25JR`
- Approved predecessor commit: `7ec0f7202abc2cb305a67223790641fb6fd047e9`
- Phase 25JR artifact SHA-256: `32fcc9b864a2012397888c7dad6e32112474e1b6089bebf1e26ca1d17e8399bc`
- Phase 25JR review-manifest SHA-256: `343bac24739be516b9edf7bb9c59eca9af1de1054b6cf6c78583d236c0614094`
- Phase 25JS outer package-manifest SHA-256: `e0942081a72b5b537641ce476980120efc3cbfe77f83f714286bac71323042ad`
- Phase 25JS root-trust-manifest SHA-256: `578a22a3b4d9a81b2c8dc8e11a1eaa5aeed5f7b8c70348f69a89270151c04adf`
- Phase 25JS bootstrap-manifest SHA-256: `73e8fc0bf3a5693e5d659a5dca4d6bc501542ea8e630f996268f99d307a12ffd`
- Phase 25JS launcher SHA-256: `67eee15842e5bac66184a9ef0c0903954a24fd14fc1829aaf920ea43264da51c`
- Phase 25JS coordinator SHA-256: `43328b61546dd59ff5d2b78b11befc827cc97c5d804e21098ab7e6ebb632598b`
- Phase 25JS broker SHA-256: `675656fc1be6896deb89f9428681b7cb2008f36217e504a70ef0c09003798593`
- Phase 25JS probe SHA-256: `36b6c2b4de3d57e072983cc75e2cd9f4cd2b1887357d4647cbd48a9b1d57d080`
- Phase 25JS defect-closure matrix SHA-256: `efc98a0fae3c77801ee10263523423ce33ea13dca4f9502f6a99813e18775450`
- Source execution in this phase: `NONE`
- Source parsing in this phase: `NONE`
- Syntax checking in this phase: `NONE`
- Sandbox-profile parsing in this phase: `NONE`
- Materialization in this phase: `NONE`
- Execution-envelope or authorization creation in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JS creates a new mode-`0644`, non-executable Revision VI package addressing `JR-B01` through `JR-B17`.

The Phase 25JQ Revision V package remains unchanged historical review evidence.

## Package identities

| Inert component | SHA-256 |
|---|---|
| `aifinder-phase-25js-authorization-schema-v7.json.txt` | `dcb14637bfa9c392c7b6f9da5fd2b5f2dcec2c253ce49f7d8f4f43b3dacaadf1` |
| `aifinder-phase-25js-bootstrap-manifest-v7.json.txt` | `73e8fc0bf3a5693e5d659a5dca4d6bc501542ea8e630f996268f99d307a12ffd` |
| `aifinder-phase-25js-broker-v7.py.txt` | `675656fc1be6896deb89f9428681b7cb2008f36217e504a70ef0c09003798593` |
| `aifinder-phase-25js-contract-v7.json.txt` | `7eeaa2afd79d5178943929fa2c4d765a1dedab4554749cc872dde7539c837739` |
| `aifinder-phase-25js-coordinator-v7.py.txt` | `43328b61546dd59ff5d2b78b11befc827cc97c5d804e21098ab7e6ebb632598b` |
| `aifinder-phase-25js-defect-closure-matrix.md` | `efc98a0fae3c77801ee10263523423ce33ea13dca4f9502f6a99813e18775450` |
| `aifinder-phase-25js-deny-all-v7.sb.txt` | `fde48c98e3f117c9d38bfabc48f1d6c8d80beef6aaa684267bc7a83a4e04ba5e` |
| `aifinder-phase-25js-exact-endpoint-v7.sb.txt` | `85b2592d81c3eabb4a8971965ba340e20700c44ec3088e3dfbc1b5bd13be6c47` |
| `aifinder-phase-25js-execution-envelope-schema-v7.json.txt` | `b975bf8b29a04139f77dc55929cab1fb500043ffba723adbb1ee32e389425a6a` |
| `aifinder-phase-25js-launcher-v7.py.txt` | `67eee15842e5bac66184a9ef0c0903954a24fd14fc1829aaf920ea43264da51c` |
| `aifinder-phase-25js-ledger-policy-v7.json.txt` | `d7d514caec171f40f275a0ae1222cad7f9882dae958b5784f7075ad07b1523e9` |
| `aifinder-phase-25js-loopback-v7.sb.txt` | `f0aea8411fbfb91eae7304b683a8855eb7527c3b71aad90235bffa1e23ba08c3` |
| `aifinder-phase-25js-probe-v7.py.txt` | `36b6c2b4de3d57e072983cc75e2cd9f4cd2b1887357d4647cbd48a9b1d57d080` |
| `aifinder-phase-25js-resolver-v7.sb.txt` | `0148f5efb92ba70ddd8a46f056e2480d2782850844a329f2133ad3e10c24d4f8` |
| `aifinder-phase-25js-result-schema-v7.json.txt` | `4231ad2cb1b6f4ec47da45d4e5e2519d3dc0560445b12f3c61d70cb1e5703f1d` |
| `aifinder-phase-25js-root-trust-manifest-v7.json.txt` | `578a22a3b4d9a81b2c8dc8e11a1eaa5aeed5f7b8c70348f69a89270151c04adf` |

Outer package-manifest SHA-256:

`e0942081a72b5b537641ce476980120efc3cbfe77f83f714286bac71323042ad`

## Hard execution blocks

- Launcher: `EXECUTION_ENABLED = False`
- Coordinator: `EXECUTION_ENABLED = False`
- Broker: `EXECUTION_ENABLED = False`
- Probe: `EXECUTION_ENABLED = False`
- Execution envelope: `NOT_CREATED`
- Authorization: `NOT_CREATED`

## Revision VI architecture

Revision VI introduces a trusted inert broker snapshot as the session anchor and process-tree constructor without creating a circular trust relationship. Launcher, coordinator, broker, and probe hashes remain one-way component records. The root manifest contains component hashes but no self-hash. The envelope binds fixed component hashes, and authorization identity remains the SHA-256 of the complete authorization bytes.

## Revision VI corrections

### Descriptor-unsealing before cleanup

Bootstrap and control roots are identity-verified, restored to mode `0700` through retained descriptors, verified, emptied descriptor-relatively, removed through parent descriptors, and required to have zero remaining links.

### Complete outer finalizers

Launcher and coordinator initialize every resource to an inert sentinel and perform all opens, decoding, and directory construction inside one outer try/finally.

### Non-reentrant supported-signal handling

The first `SIGINT`, `SIGTERM`, or `SIGHUP` switches all supported signals to ignore before raising a shutdown failure. Finalization is idempotent. `SIGKILL` remains outside the guarantee.

### Startup-gated ownership registration

Every broker starts in a new session and blocks on a startup gate. The owner captures PID, PPID, PGID, SID, and start identity before release. Registration failure terminates the still-gated session before descendants can be created.

### Broker-anchored process groups

The broker remains the session leader while coordinator or probe descendants exist. Owners verify SID continuity, terminate the complete group even after a child exits, reap the broker, and require zero remaining PGID members.

### Role-exclusive result descriptors

The trusted broker constructs the parent-child-grandchild tree before exec. Each execed role receives exactly one result descriptor, one release descriptor, and one unique nonce. Unrelated descriptors are closed before exec.

### Exact framing and deadlines

Every length prefix and payload uses exact-read logic with one absolute deadline. Probe release waits are nonblocking and selector-driven.

### Durable authorization disposition

After every broker or coordinator outcome, the launcher checks the exact durable ledger entry by directory descriptor. The authoritative result cannot report `NOT_CONSUMED` after a valid consumption entry exists.

### Exact authorization semantics

Before consumption, the coordinator validates exact schema version, authorization state, consumption rule, repository identity, component hashes, capabilities, limits, allowed/prohibited actions, and ledger-policy binding.

### Exact PASS metadata semantics

The launcher validates exact per-capability key sets, claims, booleans, enums, digest formats, numeric ranges, release evidence, and maximum encoded size.

### Independent secret scans

Broker capture maintains independent rolling state for stdout and stderr.

### Listener limits and release proof

Active listener count is enforced before creation. Release verification uses a fresh socket with no reuse flag, followed by bind and listen on the exact address and port.

### Exact predecessor and source-mode binding

The root manifest predecessor must equal `7ec0f7202abc2cb305a67223790641fb6fd047e9`. Every opened source file must have actual mode `0644`, matching its manifest record.

### No undrained diagnostics

Broker-managed probe diagnostics use `DEVNULL`. Coordinator stdout and stderr are independently bounded, continuously drained, and represented by hashes and counts only.

## Defect-closure matrix

The package includes `aifinder-phase-25js-defect-closure-matrix.md`.

Matrix SHA-256:

`efc98a0fae3c77801ee10263523423ce33ea13dca4f9502f6a99813e18775450`

All findings `JR-B01` through `JR-B17` have Revision VI static dispositions.

## Phase decision

- Revision VI inert package: `READY_FOR_STATIC_REVIEW`
- Revision V package: `PRESERVED_UNCHANGED`
- Execution sentinels: `HARD_BLOCKED`
- Execution envelope: `NOT_CREATED`
- Authorization: `NOT_CREATED`
- Source parsing: `NOT_PERFORMED`
- Syntax validation: `NOT_PERFORMED`
- Sandbox-profile parsing: `NOT_PERFORMED`
- Materialization: `NOT_AUTHORIZED`
- Synthetic capability execution: `NOT_AUTHORIZED`
- Host capabilities: `UNPROVEN`
- Application lint/build/startup: `NOT_AUTHORIZED`
- C01: `NOT_AUTHORIZED`
- C02: `NOT_AUTHORIZED`
- Successful runtime validation: `NOT_ACHIEVED`
- Batch D: `NOT_AUTHORIZED`
- Operational reactivation: `BLOCKED`

## Safe successor

The safe successor is:

**Phase 25JT — Revision VI Inert Harness Static Source Review Gate**

Phase 25JT may review only the exact Revision VI launcher, coordinator, broker, probe, manifests, contract, schemas, policy, profiles, and defect-closure matrix.

Phase 25JT must not modify a snapshot, remove an execution sentinel, parse or execute Python, run syntax checks, parse or launch sandbox profiles, materialize files, create or consume authorization, create fixtures, invoke clone or sandbox operations, open listeners or sockets, resolve DNS, inspect environment values, lint, build, start AiFinder, invoke C01 or C02, access a database or external service, install packages, begin Batch D, or authorize operational reactivation or public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JS only if all answers are affirmative:

1. Is Phase 25JS anchored to exact Phase 25JR commit `7ec0f7202abc2cb305a67223790641fb6fd047e9`?
2. Are the Phase 25JR artifact and review-manifest identities preserved?
3. Are all Revision VI components new mode-`0644` inert snapshots?
4. Are launcher, coordinator, broker, and probe hard-blocked?
5. Are sealed roots descriptor-unsealed and verified before entry removal?
6. Do launcher and coordinator protect every acquisition with one outer finalizer?
7. Are repeated supported signals prevented from interrupting cleanup?
8. Is every broker startup gated until ownership registration succeeds?
9. Does registration failure terminate the still-gated new session?
10. Does the broker remain the session anchor while descendants exist?
11. Can verified surviving descendants be released after a child exits?
12. Must owners prove zero remaining PGID members?
13. Does each execed role receive only its own result descriptor and nonce?
14. Are all framed reads exact and deadline-bound?
15. Are release waits nonblocking and deadline-bound?
16. Does the launcher recover authorization disposition from the exact durable ledger entry?
17. Are exact authorization semantic values checked before consumption?
18. Are exact PASS metadata values, types, ranges, digests, and enums validated?
19. Are stdout and stderr secret scans independent?
20. Is the active listener limit enforced?
21. Is listener release verified without reuse semantics?
22. Is the root predecessor bound to `7ec0f7202abc2cb305a67223790641fb6fd047e9`?
23. Must actual source modes equal manifest mode `0644`?
24. Are probe diagnostics nonblocking and coordinator diagnostics continuously bounded?
25. Does the closure matrix cover `JR-B01` through `JR-B17`?
26. Is Phase 25JT limited to static review?
27. Are parsing, syntax validation, profile parsing, materialization, envelope creation, authorization, capability execution, application runtime, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
28. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C prior runtime cycle: closed as fail-closed incomplete
- Phase 25JQ corrected inert revision V: 100%
- Phase 25JR Revision V source review: 100%
- Phase 25JS corrected inert revision VI: 100%
- Phase 25JS Gemini review: pending
- Syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
