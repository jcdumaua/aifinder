# Phase 25JU — Corrected Synthetic Capability Harness Inert Source Revision VII Gate

## Phase identity

- Phase: `25JU`
- Batch: `C — Controlled Runtime Validation`
- Phase type: corrected inert source revision VII
- Approved predecessor phase: `25JT`
- Approved predecessor commit: `acf5aabcf8f4be34aeb0519d97f7310cb9e9a9e2`
- Phase 25JT artifact SHA-256: `e39e3370057237e3f8892c0d3053fcb9786c50c4d761601ee863315461baa080`
- Phase 25JT review-manifest SHA-256: `7c9c7c799bce844583f3389eca4fc6f6e1d48fa3a97ea5ca889253ce9831378c`
- Phase 25JT finding-ledger SHA-256: `3bed01dd4b8fd242ed80276d38788699464d733c1eb74caabe49c720ed996b64`
- Phase 25JU outer package-manifest SHA-256: `149006ce51afd4091aff5d1108d56dd0258d80bbf26e20bea070ac20a024a1b9`
- Phase 25JU root-trust-manifest SHA-256: `79091b7308d240ad48cf5a68cdeff9792898a916a0418ded9ced3de17c7d93dc`
- Phase 25JU bootstrap-manifest SHA-256: `0808932c7360f3ed041d11eed61c6f29ce2b3b89749d33b41a2a33160a7a8d38`
- Phase 25JU launcher SHA-256: `5f25103e745ee3e0a4b2ae6603377360f267080b832426baa2fff4772b429b16`
- Phase 25JU coordinator SHA-256: `8ed21fe691050994909c4d7a10643a292e3379bf432fcf8dea13ebf64c72d669`
- Phase 25JU broker SHA-256: `b95bae120de39ecfeccc7d182463bd382fec6f03ed2208991fad5a7df46ab127`
- Phase 25JU probe SHA-256: `33644d7d06f6b1f7a6965eb307dd3e0c892659928bc12801091b50a583e2328b`
- Phase 25JU inventory-helper SHA-256: `7c94c97c2ffb7d0cc6faf0391783a22bc9db3d44642c45dc70cbafd316d0fd2f`
- Phase 25JU defect-closure matrix SHA-256: `babe2f88cfd1f7d80cd16b0af44f7276433789ee5d15674575474301c24308b3`
- Source execution in this phase: `NONE`
- Source parsing in this phase: `NONE`
- Syntax checking in this phase: `NONE`
- Sandbox-profile parsing in this phase: `NONE`
- Materialization in this phase: `NONE`
- Execution-envelope or authorization creation in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JU creates a new mode-`0644`, non-executable Revision VII package resolving the 17 static-review blockers `JT-B01` through `JT-B17`.

The Phase 25JS Revision VI package and Phase 25JT review evidence remain unchanged historical records.

## Package identities

| Inert component | SHA-256 |
|---|---|
| `aifinder-phase-25ju-authorization-schema-v8.json.txt` | `ea5da1c011fe3a406229c5796c1d80680a27b425e61ee0157a42b6ad76236cd2` |
| `aifinder-phase-25ju-bootstrap-manifest-v8.json.txt` | `0808932c7360f3ed041d11eed61c6f29ce2b3b89749d33b41a2a33160a7a8d38` |
| `aifinder-phase-25ju-broker-rpc-schema-v8.json.txt` | `cdd20e36f832b9a48d1c2ecc6fb48e9b3a03f618eb51da4f68c11e0da4df9d1e` |
| `aifinder-phase-25ju-broker-v8.py.txt` | `b95bae120de39ecfeccc7d182463bd382fec6f03ed2208991fad5a7df46ab127` |
| `aifinder-phase-25ju-contract-v8.json.txt` | `4b233238ffc97d7e5601ac3d4e9108a0f2fc9102d6cf8dd9d87f2522bc42c5f4` |
| `aifinder-phase-25ju-coordinator-v8.py.txt` | `8ed21fe691050994909c4d7a10643a292e3379bf432fcf8dea13ebf64c72d669` |
| `aifinder-phase-25ju-deny-all-v8.sb.txt` | `1505e6f1819c7f6d806c4c02ee2e5cca510e8b1eeb303599c1550c322bc7e1e6` |
| `aifinder-phase-25ju-exact-tcp-endpoint-v8.sb.txt` | `8583fd0f2bb3abc8124d8a2243ba66b5c294ac32589063a64c0a54e0f1d3865d` |
| `aifinder-phase-25ju-execution-envelope-schema-v8.json.txt` | `ef7564586962e244dac2092ea1f5cdc986d88ecce4c79960dab9dd978fe48d68` |
| `aifinder-phase-25ju-inventory-helper-v8.py.txt` | `7c94c97c2ffb7d0cc6faf0391783a22bc9db3d44642c45dc70cbafd316d0fd2f` |
| `aifinder-phase-25ju-launcher-v8.py.txt` | `5f25103e745ee3e0a4b2ae6603377360f267080b832426baa2fff4772b429b16` |
| `aifinder-phase-25ju-ledger-policy-v8.json.txt` | `38a6fc28f3f6c89b6ee0790915cea9b36e10bd89cd41a302d7980f004c6fad47` |
| `aifinder-phase-25ju-loopback-v8.sb.txt` | `19d47434a059132bd61c793131790bd8e4b9e5d4f0ebf74e759f049bdf524013` |
| `aifinder-phase-25ju-probe-v8.py.txt` | `33644d7d06f6b1f7a6965eb307dd3e0c892659928bc12801091b50a583e2328b` |
| `aifinder-phase-25ju-resolver-v8.sb.txt` | `4300f6724dc2842ea1f32e8e200f04e4d9344dc94a4dcd2b2e5975ab68a180b0` |
| `aifinder-phase-25ju-result-schema-v8.json.txt` | `12aa14c2c1dc70e6f2a66b3bc8835a1b20fc16bc4ba0852754dedeb75ced9913` |
| `aifinder-phase-25ju-root-trust-manifest-v8.json.txt` | `79091b7308d240ad48cf5a68cdeff9792898a916a0418ded9ced3de17c7d93dc` |

Defect-closure matrix:

`babe2f88cfd1f7d80cd16b0af44f7276433789ee5d15674575474301c24308b3`

Outer package manifest:

`149006ce51afd4091aff5d1108d56dd0258d80bbf26e20bea070ac20a024a1b9`

## Hard execution blocks

- Launcher: `EXECUTION_ENABLED = False`
- Coordinator: `EXECUTION_ENABLED = False`
- Broker: `EXECUTION_ENABLED = False`
- Probe: `EXECUTION_ENABLED = False`
- Inventory helper: `EXECUTION_ENABLED = False`
- Execution envelope: `NOT_CREATED`
- Authorization: `NOT_CREATED`
- Executable files: `0`

## Revision VII architecture

Revision VII replaces nested broker sessions with one launcher-owned broker session.

The launcher creates and authenticates exactly two managed session types:

1. the long-lived broker session;
2. short-lived startup-gated inventory-helper sessions.

The coordinator creates no subprocesses. It sends exact length-prefixed RPC requests to the broker. The broker is the sole runtime process creator, and all coordinator, command, probe, and process-inventory descendants remain in the broker PGID/SID.

## JT-B01 — Descriptor isolation

Broker startup, status, RPC, source-directory, coordinator, and final-release descriptors are non-inheritable.

Before every role exec, the broker closes every descriptor except:

- the immutable probe descriptor;
- the immutable rendered profile descriptor;
- that role's result descriptor;
- that role's exit-receipt descriptor;
- that role's release descriptor.

## JT-B02 and JT-B03 — Authenticated tree completion

The broker constructs the parent-child-grandchild hierarchy before exec.

Each role receives a unique nonce and a unique exit-receipt channel.

- Grandchild emits a receipt and exits.
- Child waits for the grandchild, records the exit code, emits its receipt, and exits.
- Parent waits for the child, records the exit code, emits its receipt, and exits.
- Broker reaps the parent.

CAP-10 metadata is derived from these receipts, wait statuses, lineage links, broker PGID/SID binding, and independent process inventory.

## JT-B04 and JT-B14 — Exact role identity

Single and tree records bind:

- exact schema;
- role;
- nonce;
- PID and PPID;
- broker PGID and SID;
- exit receipt;
- lineage;
- broker reap evidence.

## JT-B05 — One session boundary

Nested `start_new_session` brokers are prohibited.

The broker remains the sole process-creation authority and session anchor until the launcher completes independent pre-release verification.

## JT-B06 — Start-token revalidation

A separately managed inventory-helper session captures the broker's PID, start token, PGID, and SID before broker release.

Immediately before any normal or failure-path group signal, a new inventory-helper request must reproduce the exact registered identity.

## JT-B07 and JT-B17 — Authoritative launcher finalization

The authoritative result includes:

- launcher broker-group release;
- launcher inventory-helper release;
- launcher status-channel state;
- launcher ledger-read state;
- launcher bootstrap cleanup;
- merged launcher failure codes;
- all coordinator cleanup and release states.

No suppressed launcher finalization failure can coexist with authoritative PASS.

## JT-B08 — Isolated startup

Every trusted Python component starts with:

`/usr/bin/python3 -I -S`

This applies before launcher-reviewed broker, coordinator, probe, and inventory-helper source executes.

## JT-B09 — Descriptor-only trusted execution

Verified broker, coordinator, and inventory-helper bytes are staged in a private `0700` bootstrap directory, opened, unlinked, and the directory is removed before startup.

Broker, coordinator, probe, and sandbox profiles are then used only through retained `/dev/fd` descriptors.

## JT-B10 — Strict trust reads

Every launcher trust read requires:

- `O_NOFOLLOW`;
- regular-file type;
- current-user ownership;
- exact mode;
- single link;
- bounded size;
- exact SHA-256.

## JT-B11 — Exact execution baseline

The approved execution baseline is fixed to:

`acf5aabcf8f4be34aeb0519d97f7310cb9e9a9e2`

The launcher, coordinator, contract, envelope schema, authorization schema, and repository snapshots require this exact commit.

Any future baseline requires a newly reviewed package.

## JT-B12 — TCP-scoped CAP-07

CAP-07 claims only:

`EXACT_IPV4_TCP_ADDRESS_PORT_PARENT_ONLY`

The static design requires one allowed TCP endpoint and one wrong-port TCP denial.

## JT-B13 — Resolver evidence

CAP-08 requires:

- canonical returned addresses;
- address-set SHA-256;
- all-addresses-loopback classification;
- family count;
- `external_resolver_contact = false`;
- `SANDBOX_DENY_NETWORK_LOCAL_FILES_ONLY` boundary.

## JT-B15 — Exact RPC and status schemas

Every RPC operation has an exact argument-key set.

Every response has exact:

- request ID parity;
- operation parity;
- broker PID/PGID/SID parity;
- payload key set;
- diagnostic digest format.

The final broker status and inventory-helper records also use exact key sets and identity parity.

## JT-B16 — Managed launcher inventory

The launcher never invokes `/bin/ps` directly.

Every process inventory runs inside a separately registered, startup-gated, isolated helper session. The helper session is reaped and its PGID absence is proved after every request.

## Defect-closure matrix

The package includes:

`aifinder-phase-25ju-defect-closure-matrix.md`

All findings `JT-B01` through `JT-B17` have Revision VII static dispositions.

## Phase decision

- Revision VII inert package: `READY_FOR_STATIC_REVIEW`
- Revision VI package: `PRESERVED_UNCHANGED`
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

**Phase 25JV — Revision VII Inert Harness Static Source Review Gate**

Phase 25JV may review only the exact Revision VII launcher, coordinator, broker, probe, inventory helper, manifests, contract, schemas, policy, profiles, and defect-closure matrix.

Phase 25JV must not modify a snapshot, remove an execution sentinel, parse or execute Python, run syntax checks, parse or launch sandbox profiles, materialize files, create or consume authorization, create fixtures, invoke clone or sandbox operations, open listeners or sockets, resolve DNS, inspect environment values, lint, build, start AiFinder, invoke C01 or C02, access a database or external service, install packages, begin Batch D, or authorize operational reactivation or public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JU only if all answers are affirmative:

1. Is Phase 25JU anchored to exact Phase 25JT commit `acf5aabcf8f4be34aeb0519d97f7310cb9e9a9e2`?
2. Are the Phase 25JT artifact, review-manifest, and finding-ledger identities preserved?
3. Are all Revision VII components new mode-`0644` inert snapshots?
4. Are all five Python components hard-blocked?
5. Are broker-control descriptors non-inheritable and excluded from role exec?
6. Does each role receive only immutable code/profile descriptors and its own evidence descriptors?
7. Are parent, child, and grandchild exit receipts independently nonce-bound?
8. Do parent and child directly reap their descendants?
9. Is CAP-10 derived from receipts, waits, lineage, broker binding, and independent inventory?
10. Are single-probe records exactly bound to role, nonce, PID/PPID, PGID/SID, receipt, and broker reap?
11. Are nested broker sessions prohibited?
12. Is the broker the sole process-creation authority?
13. Does the launcher independently capture and revalidate broker start identity?
14. Is launcher broker-group release required for authoritative PASS?
15. Do all trusted Python components use isolated/no-site startup?
16. Are trusted components executed only through verified descriptors?
17. Do launcher trust reads require regular-file type, owner, mode, link count, size, and hash?
18. Is execution_baseline_commit fixed to `acf5aabcf8f4be34aeb0519d97f7310cb9e9a9e2`?
19. Is CAP-07 explicitly TCP-scoped?
20. Does CAP-08 include canonical loopback-address and resolver-boundary evidence?
21. Are tree records bound to authenticated broker PGID/SID?
22. Are RPC operation arguments and response payloads exact?
23. Is the launcher process inventory separately gated and managed?
24. Are launcher finalization states and failure codes present in authoritative evidence?
25. Does the closure matrix cover `JT-B01` through `JT-B17`?
26. Is Phase 25JV limited to static review?
27. Are parsing, syntax validation, profile parsing, materialization, envelope creation, authorization, capability execution, application runtime, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
28. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C prior runtime cycle: closed as fail-closed incomplete
- Phase 25JS corrected inert revision VI: 100%
- Phase 25JT Revision VI source review: 100%
- Phase 25JU corrected inert revision VII: 100%
- Phase 25JU Gemini review: pending
- Syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
