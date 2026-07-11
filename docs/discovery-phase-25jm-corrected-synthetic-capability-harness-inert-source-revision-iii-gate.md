# Phase 25JM — Corrected Synthetic Capability Harness Inert Source Revision III Gate

## Phase identity

- Phase: `25JM`
- Batch: `C — Controlled Runtime Validation`
- Phase type: corrected inert source revision III
- Approved predecessor phase: `25JL`
- Approved predecessor commit: `0add3d35965bf1cd86fb529e13f978c8b708597c`
- Phase 25JL artifact SHA-256: `8117facb0c6a62f86b23009e47cb6ff3d110076a4e2c8fda6baa96215ffae29c`
- Phase 25JM outer package-manifest SHA-256: `bca83ccce09c6d36dfb66cca513b5afeba1e8e70485c969fbdaf9324c6ca7686`
- Phase 25JM root-trust-manifest SHA-256: `ef4cd3296fda350bdc244f4fe78c7646bbfa125cecbc00444669ee781bb42f68`
- Phase 25JM bootstrap-manifest SHA-256: `4f752fb79bfdd71176344efafd82c8837a652ede62c1ed01583737525a65a5d1`
- Phase 25JM launcher SHA-256: `d52de7e488468b7afc61ff4a7fa1169467f81a7430c4d14b5cf610523efb0c5d`
- Phase 25JM materializer SHA-256: `459acbe43819cc0602d8d7a3f42d8d718c89a3f074579a91ef2d5af194121ec3`
- Phase 25JM defect-closure matrix SHA-256: `7dd75499dad76e52c12a4d75abeaa052a1be10a24ffce804ad6dd6829c757d02`
- Source execution in this phase: `NONE`
- Syntax checking in this phase: `NONE`
- Sandbox-profile parsing in this phase: `NONE`
- Materialization in this phase: `NONE`
- Execution-envelope or authorization creation in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JM creates a new static non-executable Revision III package addressing findings `JL-B01` through `JL-B17`.

Every component remains a mode-`0644` text snapshot. The Phase 25JK Revision II package remains unchanged historical evidence.

## Revision III components

| Inert component | SHA-256 |
|---|---|
| `aifinder-phase-25jm-authorization-schema-v4.json.txt` | `bedf5efa442399db081176fd3bce0099229fae09b0d7fa8d9795c6816a91879c` |
| `aifinder-phase-25jm-bootstrap-manifest-v4.json.txt` | `4f752fb79bfdd71176344efafd82c8837a652ede62c1ed01583737525a65a5d1` |
| `aifinder-phase-25jm-contract-v4.json.txt` | `24c5e43c25c3954882422685d41f9e8a5518d6e5237345c6e95db5a014191914` |
| `aifinder-phase-25jm-defect-closure-matrix.md` | `7dd75499dad76e52c12a4d75abeaa052a1be10a24ffce804ad6dd6829c757d02` |
| `aifinder-phase-25jm-deny-all-v4.sb.txt` | `66da92e8cc5e38320d8bb467cf83728c5db96f1f5dc33be38e5e24e72c1880b9` |
| `aifinder-phase-25jm-exact-endpoint-v4.sb.txt` | `c728f29c5e9acc4a15b7eec4152266db8ea99d9573edbe9f5552da4712f1be53` |
| `aifinder-phase-25jm-execution-envelope-schema-v4.json.txt` | `5038152124267110b956c2c089a4113473a112cc977cf8efcfdd51b9fcec66fd` |
| `aifinder-phase-25jm-launcher-v4.sh.txt` | `d52de7e488468b7afc61ff4a7fa1169467f81a7430c4d14b5cf610523efb0c5d` |
| `aifinder-phase-25jm-ledger-policy-v4.json.txt` | `3ae4192170481c742aa8fde75009ae06c0f68573c4103f1e9026d078b75d5236` |
| `aifinder-phase-25jm-loopback-v4.sb.txt` | `030c2d7ea90ad028cd37820f6246cb20876d052ff886da010a80c3f87d820085` |
| `aifinder-phase-25jm-materializer-v4.py.txt` | `459acbe43819cc0602d8d7a3f42d8d718c89a3f074579a91ef2d5af194121ec3` |
| `aifinder-phase-25jm-resolver-v4.sb.txt` | `6e153225903d0c48b0d5fa43d2f163a12cdedb884a5eb819ebba3f47b7e98cc3` |
| `aifinder-phase-25jm-result-schema-v4.json.txt` | `ec843938c7e87240d57f271c1a8143c31c9fffa4c24dd9a9fdada2f66582f2c8` |
| `aifinder-phase-25jm-root-trust-manifest-v4.json.txt` | `ef4cd3296fda350bdc244f4fe78c7646bbfa125cecbc00444669ee781bb42f68` |
| `aifinder-phase-25jm-supervisor-v4.py.txt` | `fdd31432c10b677c337a6c32e115fd7c89b897cbd8b0392e00006e4bce7c4754` |
| `aifinder-phase-25jm-wrapper-v4.sh.txt` | `3c5519cf367ac148718a862b57eee71ca4f3608f6779af90032675a87e0b2489` |

Outer package-manifest SHA-256:

`bca83ccce09c6d36dfb66cca513b5afeba1e8e70485c969fbdaf9324c6ca7686`

## Hard execution blocks

Launcher:

`EXECUTION_ENABLED="NO"`

Materializer:

`EXECUTION_ENABLED = False`

Wrapper:

`EXECUTION_ENABLED="NO"`

Supervisor:

`EXECUTION_ENABLED = False`

Execution-envelope SHA-256:

`UNSET_NOT_AUTHORIZED`

No component can materialize or execute in the current package.

## Non-circular root trust

Revision III uses two manifests:

1. The bootstrap manifest binds the materializer, wrapper, supervisor, contract, schemas, policies and profiles.
2. The root-trust manifest binds the launcher, bootstrap manifest and every package component.

The launcher embeds only the bootstrap-manifest and materializer hashes. It does not embed the root-manifest hash, avoiding a circular launcher/root-manifest dependency.

A future separately approved operator gate must authenticate:

- the launcher hash;
- the root-trust-manifest hash;
- the execution-envelope hash.

The envelope then binds the launcher, root manifest, bootstrap manifest, authorization and execution baseline.

## Separate materializer

The launcher contains no embedded Python materialization program.

Materialization and finalization are implemented in:

`aifinder-phase-25jm-materializer-v4.py.txt`

The materializer:

- uses explicit failures rather than assertions;
- opens source directories and files with descriptors and `O_NOFOLLOW`;
- validates the opened object with `fstat`;
- rejects non-regular, foreign-owned and group/world-writable files;
- performs complete read and write loops;
- verifies exact hashes;
- reopens and verifies destination bytes;
- fsyncs files and directories;
- copies all runtime inputs into one private run root;
- consumes authorization before synthetic capability state;
- performs final run-root deletion;
- appends CAP-13 only after deletion;
- emits the authoritative result only after cleanup.

## One execution authority

Source ancestry remains recorded in the root manifest as historical provenance only.

Runtime repository authority comes exclusively from the reviewed execution envelope:

- repository path;
- execution baseline;
- branch;
- origin.

The materializer copies these values into one immutable trusted-identity record. The supervisor consumes only that record.

No runtime component derives its execution baseline from the source-package predecessor commit.

## Exact authorization semantics

The authorization must exactly match the envelope and canonical contract for:

- repository path and execution baseline;
- branch and origin;
- root manifest;
- bootstrap manifest;
- launcher;
- all component hashes;
- CAP-01 through CAP-13 order;
- resource limits;
- allowed actions;
- prohibited actions;
- durable ledger root and policy;
- one attempt;
- zero retries;
- consumption-before-state rule.

`authorization_id` must equal the launcher-verified authorization SHA-256.

## Durable descriptor-relative ledger

The ledger root is derived from the canonical contract:

`~/Library/Application Support/AiFinder/authorization-ledger`

The materializer requires the envelope and authorization to name that exact path.

The ledger is:

- repository-external;
- outside `/private/tmp`;
- precreated by a separate gate;
- current-user owned;
- mode `0700`;
- opened with a directory descriptor;
- used through descriptor-relative entry creation;
- protected by `O_EXCL|O_NOFOLLOW`;
- written with a complete-write loop;
- fsynced at the entry and directory levels;
- never removed by runtime cleanup.

The entry key is the verified authorization SHA-256.

## Capability evidence and result ordering

The supervisor writes a private inner result containing ordered CAP-01 through CAP-12 evidence.

The supervisor never emits an authoritative PASS result.

The materializer:

1. reads and validates the inner result;
2. deletes and verifies the private run root;
3. appends CAP-13 cleanup evidence;
4. returns a complete authoritative result to the launcher.

The launcher buffers that result, deletes and verifies the bootstrap root, and only then prints the result.

No PASS can be emitted before outer cleanup completes.

## Defect-closure matrix

The package includes:

`aifinder-phase-25jm-defect-closure-matrix.md`

Matrix SHA-256:

`7dd75499dad76e52c12a4d75abeaa052a1be10a24ffce804ad6dd6829c757d02`

All findings `JL-B01` through `JL-B17` have a Revision III static disposition.

## Phase decision

Revision III inert package:

`READY_FOR_STATIC_REVIEW`

Revision II package:

`PRESERVED_UNCHANGED`

Root trust chain:

`DEFINED_BUT_UNEXECUTED`

Execution sentinels:

`HARD_BLOCKED`

Execution envelope:

`UNSET_NOT_AUTHORIZED`

Authorization:

`NOT_CREATED`

Syntax validation:

`NOT_PERFORMED`

Sandbox-profile parsing:

`NOT_PERFORMED`

Executable materialization:

`NOT_AUTHORIZED`

Synthetic capability execution:

`NOT_AUTHORIZED`

Host capabilities:

`UNPROVEN`

Application lint or build:

`NOT_AUTHORIZED`

Application startup:

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

**Phase 25JN — Revision III Inert Harness Static Source Review Gate**

Phase 25JN may review only the exact Revision III launcher, materializer, wrapper, supervisor, manifests, contract, schemas, policies, profiles and defect-closure matrix.

Phase 25JN must not:

- modify a snapshot;
- remove an execution sentinel;
- create an execution envelope or authorization;
- create executable files;
- run shell or Python syntax checks;
- parse or launch sandbox profiles;
- materialize runtime files;
- consume authorization;
- create synthetic fixtures;
- invoke `cp -cR` or `sandbox-exec`;
- open listeners or sockets;
- perform DNS resolution;
- inspect environment values;
- lint, build or start AiFinder;
- invoke C01 or C02;
- access a database or external service;
- install packages;
- begin Batch D;
- authorize operational reactivation or public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JM only if all answers are affirmative:

1. Is Phase 25JM anchored to exact Phase 25JL commit `0add3d35965bf1cd86fb529e13f978c8b708597c`?
2. Is the Phase 25JL artifact identity preserved?
3. Are all Revision III components new mode-`0644` text snapshots?
4. Are launcher, materializer, wrapper and supervisor hard-blocked?
5. Is materialization implemented in a separate hashed Python snapshot?
6. Is the launcher/root-manifest dependency non-circular?
7. Does the root manifest include the launcher?
8. Is runtime baseline authority envelope-only?
9. Are launcher, root, bootstrap, authorization and all component identities mutually bound?
10. Are allowed and prohibited authorization actions checked exactly?
11. Are schema constraints explicitly enforced without external dependencies?
12. Is one repository authority used by every runtime layer?
13. Is the ledger root canonical, durable, descriptor-relative and authorization-hash keyed?
14. Are assertions absent from security checks?
15. Are complete-write loops, descriptor validation, destination verification and fsync present?
16. Does the final result contain ordered CAP-01 through CAP-13 evidence?
17. Is CAP-13 added only after run-root deletion?
18. Is authoritative output emitted only after launcher bootstrap cleanup?
19. Does the defect matrix cover `JL-B01` through `JL-B17`?
20. Is Phase 25JN limited to static review?
21. Are syntax validation, profile parsing, materialization, envelope creation, authorization, capability execution, application runtime, C01, C02, Batch D, operational reactivation and public launch unauthorized?
22. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C prior runtime cycle: closed as fail-closed incomplete
- Phase 25JC architecture: 100%
- Phase 25JD implementation plan: 100%
- Phase 25JE network and environment design: 100%
- Phase 25JF static capability plan: 100%
- Phase 25JG original inert source package: 100%
- Phase 25JH original source review: 100%
- Phase 25JI corrected inert revision I: 100%
- Phase 25JJ revision I source review: 100%
- Phase 25JK corrected inert revision II: 100%
- Phase 25JL Revision II source review: 100%
- Phase 25JM corrected inert revision III: 100%
- Phase 25JM Gemini review: pending
- Syntax validation: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
