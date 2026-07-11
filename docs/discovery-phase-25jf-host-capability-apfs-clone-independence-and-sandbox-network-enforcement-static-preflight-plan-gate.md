# Phase 25JF — Host Capability, APFS Clone Independence, and Sandbox Network-Enforcement Static Preflight Plan Gate

## Phase identity

- Phase: `25JF`
- Batch: `C — Controlled Runtime Validation`
- Phase type: static host-capability preflight plan
- Approved predecessor phase: `25JE`
- Approved predecessor commit: `b992f163481e5ef2ca8d44b0733ded7fcb0ef259`
- Phase 25JE artifact SHA-256: `ccd1b08201d0f3f0a0ec49f0f9be337429ca5dd144b06cd05d9a576fe0f73c42`
- Reduced public-only manifest SHA-256: `19a39103cfb9a9f6d29892daf0c9ea994febefd7f0223cb0a5dfe6dce26ebe5e`
- Host capability execution in this phase: `NONE`
- Host capability inspection in this phase: `NONE`
- Network activity in this phase: `NONE`
- Environment-value access in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Governance alert disposition

Phase 25JF is documentation-only.

No local shell script, host probe, capability test, filesystem clone, sandbox profile, listener, socket, DNS lookup, environment-value lookup, build, server, route, database connection, package installation, or system-configuration action is executed or requested by this artifact.

All host facts remain deliberately unverified in Phase 25JF.

The following states therefore remain:

- host filesystem capability: `NOT_INSPECTED`
- APFS clone support: `UNPROVEN`
- `cp -cR` independence: `UNPROVEN`
- `sandbox-exec` availability: `UNPROVEN`
- sandbox network enforcement: `UNPROVEN`
- loopback-only policy enforcement: `UNPROVEN`
- exact-address and exact-port enforcement: `UNPROVEN`
- process-tree sandbox inheritance: `UNPROVEN`

This is intentional. Phase 25JF defines only how a later, separately authorized synthetic capability test would prove or reject those assumptions.

## Purpose

Phase 25JF defines the exact synthetic capability proofs required before any isolated production-mode validation harness may be implemented or used.

The phase converts the requirements from Phases 25JC through 25JE into a fail-closed preflight plan.

The plan must determine whether the host can safely provide:

1. a logically independent APFS dependency clone;
2. deny-all network enforcement for the production build;
3. loopback-only startup enforcement;
4. exact-address, exact-port, and exact-protocol runtime allowlisting;
5. sandbox inheritance across the full process tree;
6. bounded output, secret scanning, deterministic termination, cleanup, and repository preservation.

No capability is assumed merely because a command or feature is commonly available on macOS.

## Safety boundary

Phase 25JF does not authorize:

- creating synthetic test fixtures;
- running `cp -cR`;
- invoking `sandbox-exec`;
- inspecting filesystem allocation or clone behavior;
- opening a listener or socket;
- resolving DNS;
- contacting any host, database, Supabase endpoint, or external service;
- inspecting `.env` files;
- reading, checking, measuring, hashing, or printing environment values;
- cloning AiFinder dependencies;
- building or starting AiFinder;
- invoking C01 or C02;
- modifying source, API, UI, schema, migration, generated types, packages, or lockfiles;
- implementing the production validation harness;
- committing or pushing;
- operational reactivation;
- Batch D;
- public launch.

## Required future authorization boundary

Any future capability-test execution requires all of the following:

1. an exact synthetic test harness generated outside the application source tree;
2. a committed static implementation and preflight artifact;
3. exact hashes for the reviewed shell wrapper, Python supervisor, sandbox profiles, and synthetic fixture definitions;
4. Gemini approval;
5. a fresh, exact human authorization specific to one synthetic capability attempt;
6. one fail-closed execution with zero retries;
7. metadata-only reporting;
8. complete cleanup and repository-preservation proof.

Authorization for synthetic host testing must not authorize:

- environment-value access;
- private destination derivation;
- private DNS resolution;
- application build;
- application startup;
- C01;
- C02;
- database access;
- operational reactivation;
- Batch D;
- public launch.

## Synthetic-only test environment

A later authorized test must use only public deterministic fixtures under one temporary root outside the repository:

```text
/private/tmp/aifinder-25jh-capability-<unpredictable-run-id>/
  clone/
    source/
    destination/
  sandbox/
    profiles/
    probes/
    logs/
  listeners/
  metadata/
```

Requirements:

- directory mode `0700`;
- owned by the invoking user;
- not inside the AiFinder repository;
- no symlink escaping the temporary root;
- no AiFinder source content;
- no `node_modules` content;
- no environment-file content;
- no credentials or user data;
- no application build artifacts;
- no database rows;
- no external service responses;
- complete deletion before successful completion.

## Capability proof sequence

The future capability suite must execute in the following fixed order:

1. `CAP-01` — filesystem and volume eligibility;
2. `CAP-02` — APFS clone operation;
3. `CAP-03` — destination mutation independence;
4. `CAP-04` — source mutation independence;
5. `CAP-05` — deny-all sandbox networking;
6. `CAP-06` — loopback-only sandbox policy;
7. `CAP-07` — exact-address, exact-port, and protocol restriction;
8. `CAP-08` — resolver behavior without private destination access;
9. `CAP-09` — synthetic destination-set canonicalization;
10. `CAP-10` — process-group ownership and termination;
11. `CAP-11` — output limiting and metadata extraction;
12. `CAP-12` — secret-scan stop condition;
13. `CAP-13` — cleanup and repository preservation.

Rules:

- stop after the first failed capability;
- always execute cleanup;
- do not run any later capability after a failure;
- use zero retries;
- do not weaken a profile after a failure;
- do not substitute another copy mechanism automatically;
- do not fall back from sandbox enforcement to unsandboxed execution;
- do not use application or repository data.

## CAP-01 — Filesystem and volume eligibility

### Purpose

Determine whether the future synthetic source and destination roots satisfy the prerequisites for the selected clone mechanism.

### Planned checks

A later authorized test may inspect only metadata for the synthetic temporary paths:

- filesystem type;
- device number;
- same-volume state;
- ownership;
- directory permissions;
- path containment;
- symlink state.

### Pass criteria

All must be true:

- source and destination report filesystem type `apfs`;
- source and destination are on the same device;
- both are below the approved temporary root;
- the invoking user owns every path;
- no path component is a symlink escaping the root;
- no privilege escalation is required.

### Stop conditions

Any failed criterion produces:

`CAP_FILESYSTEM_NOT_ELIGIBLE`

The suite stops before `cp -cR`.

## CAP-02 — APFS clone operation

### Purpose

Determine whether the exact reviewed `/bin/cp -cR` operation succeeds on deterministic synthetic data.

### Synthetic fixture design

The source fixture may contain:

- one deterministic `4 MiB` binary file generated from a fixed public byte pattern;
- one small public text file;
- one nested directory;
- one nested public text file.

No repository or dependency content may be used.

### Planned operation

```text
/bin/cp -cR <synthetic-source> <synthetic-destination>
```

### Pass criteria

- command classification `EXIT_0`;
- destination created only under the approved temporary root;
- source and destination file counts match;
- source and destination byte counts match;
- source and destination inventory hashes match before mutation;
- no unexpected file is created;
- raw command output is not retained.

### Stop conditions

Any mismatch produces:

`CAP_APFS_CLONE_OPERATION_FAILED`

A successful copy does not prove independence. CAP-03 and CAP-04 remain mandatory.

## CAP-03 — Destination mutation independence

### Purpose

Prove that changing the cloned destination does not change the synthetic source.

### Planned mutations

- modify a bounded byte range in the destination binary file;
- add one destination-only file;
- remove one destination nested file.

### Pass criteria

- every source path remains present;
- every source content hash remains unchanged;
- destination changes exactly match the planned mutation set;
- no path outside the destination changes;
- no temporary-root escape occurs.

### Stop conditions

Any source change produces:

`CAP_DESTINATION_MUTATION_AFFECTED_SOURCE`

## CAP-04 — Source mutation independence

### Purpose

Prove that changing the synthetic source after cloning does not change the destination.

### Planned mutations

Mirror CAP-03 on the source side.

### Pass criteria

- every destination path remains present;
- every destination content hash remains unchanged;
- source changes exactly match the planned mutation set.

### Stop conditions

Any destination change produces:

`CAP_SOURCE_MUTATION_AFFECTED_DESTINATION`

CAP-03 and CAP-04 prove logical independence only. They do not require allocation-block or private filesystem-internal evidence.

## CAP-05 — Deny-all sandbox networking

### Purpose

Prove that the proposed build profile denies all network activity while permitting bounded non-network filesystem work.

### Synthetic fixtures

- one controlled IPv4 listener;
- one controlled IPv6 listener when supported;
- one Python parent probe;
- one child probe;
- one grandchild probe;
- one public temporary file.

No external destination is used.

### Planned attempts

Each sandboxed process attempts:

- one IPv4 loopback connection;
- one IPv6 loopback connection when supported;
- one UDP socket operation;
- one permitted local file read.

### Pass criteria

- all network attempts are denied;
- the local file read succeeds;
- the child and grandchild inherit the denial;
- no listener accepts a connection;
- no payload is received;
- the entire process tree exits within the limit.

### Stop conditions

- profile parse failure: `CAP_DENY_ALL_PROFILE_PARSE_FAILED`
- network succeeds: `CAP_DENY_ALL_NETWORK_NOT_ENFORCED`
- child inheritance fails: `CAP_DENY_ALL_PROCESS_INHERITANCE_FAILED`

## CAP-06 — Loopback-only startup policy

### Purpose

Prove that a startup profile can allow only one exact controlled loopback endpoint while denying other loopback endpoints and all non-loopback activity.

### Synthetic fixtures

- allowed listener A on `127.0.0.1` and one random high port;
- denied listener B on a different port;
- optional denied listener C on an alternate loopback address when supported.

No HTTP request is used.

### Pass criteria

- listener A receives exactly one permitted synthetic connection;
- listeners B and C receive none;
- no external destination is contacted;
- child and grandchild processes cannot broaden access;
- no wildcard-port or wildcard-address behavior is observed.

### Stop conditions

- profile parse failure: `CAP_LOOPBACK_PROFILE_PARSE_FAILED`
- allowed endpoint unavailable: `CAP_LOOPBACK_ALLOW_RULE_FAILED`
- denied endpoint reachable: `CAP_LOOPBACK_DENY_RULE_FAILED`
- inheritance failure: `CAP_LOOPBACK_PROCESS_INHERITANCE_FAILED`

## CAP-07 — Exact-address, exact-port, and protocol restriction

### Purpose

Prove the enforcement shape proposed for a future privately derived C01 destination without using a real hostname, Supabase, DNS, or the internet.

### Synthetic fixtures

- allowed synthetic endpoint A;
- same-address wrong-port endpoint B;
- alternate-address same-port endpoint C when supported;
- denied UDP endpoint D.

### Pass criteria

Only A is reachable.

B, C, and D must be denied.

The result must demonstrate that the rule does not imply:

- wildcard port access;
- wildcard address access;
- UDP access;
- broader child-process access.

### Stop conditions

- allowed rule fails: `CAP_EXACT_ADDRESS_ALLOW_RULE_FAILED`
- wrong port succeeds: `CAP_EXACT_PORT_DENY_RULE_FAILED`
- alternate address succeeds: `CAP_EXACT_ADDRESS_DENY_RULE_FAILED`
- UDP succeeds: `CAP_PROTOCOL_DENY_RULE_FAILED`

A pass does not authorize private destination derivation or C01 execution.

## CAP-08 — Resolver behavior without private destination access

### Purpose

Determine whether a future profile can support only the minimum resolver behavior required by an approved destination-derivation phase.

### Permitted input

Only static `localhost`.

### Prohibited input

- a project hostname;
- a Supabase hostname;
- an environment-derived hostname;
- an intentionally external hostname.

### Pass criteria

- behavior is classified in one attempt;
- no private destination is accessed;
- no raw hostname, address, or resolver response is retained;
- no retry occurs.

### Stop condition

Any indeterminate or unsafe result produces:

`CAP_RESOLVER_BEHAVIOR_UNPROVEN`

If safe resolver behavior cannot be proven synthetically, the host architecture remains blocked.

## CAP-09 — Frozen destination-set canonicalization

### Purpose

Test only the deterministic canonicalization and comparison logic for a future private address set.

### Synthetic inputs

Use fixed documentation-only IPv4 and IPv6 strings embedded in the reviewed test code.

No DNS and no socket connection are allowed.

### Pass criteria

- order-independent hash is stable;
- duplicates are removed deterministically;
- changed-set detection is deterministic;
- no raw address appears in console, clipboard, or artifact.

### Stop condition

`CAP_DESTINATION_SET_LOGIC_FAILED`

## CAP-10 — Process-group ownership and termination

### Purpose

Prove that the future Python supervisor can own and terminate a sandboxed parent, child, and grandchild without leaving processes or listeners.

### Pass criteria

- one owned process group;
- every descendant belongs to that group;
- bounded graceful termination succeeds or bounded forced termination completes;
- no descendant remains;
- every controlled listener is released.

### Stop conditions

- ownership failure: `CAP_PROCESS_TREE_OWNERSHIP_FAILED`
- termination failure: `CAP_PROCESS_TERMINATION_FAILED`
- listener release failure: `CAP_LISTENER_RELEASE_FAILED`

## CAP-11 — Output limiting and metadata-only extraction

### Purpose

Prove bounded output handling without retaining raw output.

### Synthetic cases

1. fixed public output below the limit;
2. fixed public output above the limit.

### Pass criteria

Below-limit case:

- only byte count and SHA-256 retained;
- raw output deleted.

Above-limit case:

- process terminated;
- classification `CAP_OUTPUT_LIMIT_ENFORCED`;
- raw output deleted;
- no raw pattern appears in clipboard or artifact.

### Stop conditions

- limit not enforced: `CAP_OUTPUT_LIMIT_NOT_ENFORCED`
- raw output retained: `CAP_RAW_OUTPUT_RETAINED`

## CAP-12 — Secret-scan stop condition

### Purpose

Prove that a synthetic placeholder matching an approved secret-like pattern causes a stop without disclosing the matched text.

The placeholder must not be a real credential.

### Pass criteria

- scanner state `TRIGGERED`;
- matched text is absent from console, clipboard, and artifact;
- raw file deleted;
- no later capability is executed.

### Stop condition

`CAP_SECRET_SCAN_NOT_ENFORCED`

## CAP-13 — Cleanup and repository preservation

### Purpose

Prove complete cleanup and confirm that the AiFinder repository remains unchanged.

### Pass criteria

- all controlled processes stopped;
- all listeners released;
- all profiles, probes, logs, fixtures, and metadata deleted;
- temporary root absent;
- repository HEAD unchanged;
- `origin/main` unchanged;
- ahead and behind counts remain zero;
- working tree remains clean;
- no repository file created;
- no commit;
- no push.

### Stop conditions

- temporary material remains: `CAP_TEMPORARY_CLEANUP_FAILED`
- repository state changes: `CAP_REPOSITORY_PRESERVATION_FAILED`

## Proposed limits

The following are static proposals for later review:

- total suite timeout: `180 seconds`;
- individual sandbox test timeout: `15 seconds`;
- process termination grace interval: `3 seconds`;
- maximum combined temporary output: `2 MiB`;
- maximum synthetic file payload: `8 MiB`;
- maximum controlled listener count: `4`;
- retries: `0`.

No value is authorized by Phase 25JF for execution.

## Metadata-only result schema

A future result may retain only:

- reviewed commit and artifact hashes;
- future test-harness hashes;
- future authorization hash and disposition;
- capability identifiers and states;
- filesystem eligibility state;
- exit classifications;
- durations;
- file counts and byte counts;
- inventory hashes;
- process and listener counts;
- output byte counts and output hashes;
- secret-scan states;
- cleanup state;
- repository-preservation state.

It must not retain:

- raw command output;
- socket payloads;
- listener addresses or ports;
- process environments;
- resolver output;
- hostnames;
- IP addresses;
- environment values;
- value-derived hashes;
- repository content;
- dependency content;
- application logs;
- response bodies;
- response header values;
- database rows.

## Fail-closed disposition rules

The later capability result must be one of:

- `ALL_SYNTHETIC_CAPABILITIES_PROVEN`
- `FAILED_CLOSED_AT_CAP_<NN>`
- `FAILED_CLOSED_DURING_CLEANUP`
- `FAILED_CLOSED_UNEXPECTED_INTERNAL_FAILURE`

Any failure means:

- the host architecture remains unapproved;
- the production validation harness remains unimplemented;
- no application build or runtime preflight begins;
- no weaker mechanism is substituted;
- no retry occurs;
- a new static disposition phase is required.

## Authorization ledger

The Phase 25IW authorization SHA-256 `1e255bd9cc41a14291bb9848406bf37978b19ee24e8e1a6457e32b4260177473` remains `CONSUMED_AND_NOT_REUSABLE`.

The Phase 25IZ authorization SHA-256 `c5a915c6d18d400fdc164c4ce2ff339e6b7c120ee5abfbd36ea9bc977815c080` remains `CONSUMED_AND_NOT_REUSABLE`.

Phase 25JF creates no new authorization.

## Plan decision

Capability-test plan:

`READY_FOR_GEMINI_REVIEW`

Host metadata verification:

`NOT_PERFORMED`

APFS clone test execution:

`NOT_AUTHORIZED`

Sandbox network test execution:

`NOT_AUTHORIZED`

Resolver test execution:

`NOT_AUTHORIZED`

Environment-value access:

`NOT_AUTHORIZED`

Private destination resolution:

`NOT_AUTHORIZED`

Harness implementation:

`NOT_AUTHORIZED`

Application build:

`NOT_AUTHORIZED`

Production startup:

`NOT_AUTHORIZED`

C01 request:

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

**Phase 25JG — Synthetic Host Capability Test Harness Static Implementation and Preflight Gate**

Phase 25JG may define and generate, without executing:

- a parser-safe shell wrapper;
- an embedded Python synthetic-test supervisor;
- exact sandbox profiles;
- deterministic synthetic fixture definitions;
- metadata-only result schema;
- cleanup logic;
- exact authorization text template;
- exact test artifact hashes.

Phase 25JG must not:

- run a capability test;
- create the synthetic runtime fixtures;
- invoke `cp -cR`;
- invoke `sandbox-exec`;
- open a listener or socket;
- perform DNS resolution;
- inspect environment values;
- resolve a private destination;
- build or start the application;
- invoke C01 or C02;
- access a database or external service;
- install packages;
- implement the application runtime harness;
- modify application source;
- authorize operational reactivation;
- begin Batch D;
- authorize public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JF only if all answers are affirmative:

1. Is Phase 25JF anchored to exact Phase 25JE commit `b992f163481e5ef2ca8d44b0733ded7fcb0ef259`?
2. Is the approved Phase 25JE artifact identity preserved?
3. Does Phase 25JF explicitly state that no host capability was inspected or executed?
4. Are all host capabilities classified as unproven pending a later authorized synthetic test?
5. Are all proposed tests synthetic and restricted to `/private/tmp`?
6. Are AiFinder source, dependencies, environment files, application runtime, databases, and external services excluded?
7. Do CAP-02 through CAP-04 separately test clone operation and two-way mutation independence?
8. Do CAP-05 through CAP-07 test deny-all, loopback-only, exact-address, exact-port, protocol, and process inheritance without external network?
9. Does CAP-08 prohibit private destination access and intentional external DNS?
10. Does CAP-09 use documentation-only synthetic address strings without network activity?
11. Are process ownership, termination, listener release, output limiting, secret scanning, cleanup, and repository preservation explicitly planned?
12. Is stop-on-first-failure with cleanup and zero retries required?
13. Are all retained results metadata-only?
14. Are raw outputs, payloads, addresses, ports, environments, resolver data, values, application logs, bodies, headers, and rows prohibited?
15. Are both prior authorizations preserved as consumed and non-reusable?
16. Is a fresh authorization required specifically for one synthetic capability attempt?
17. Does that authorization exclude application runtime and private value access?
18. Is Phase 25JG limited to static harness implementation and preflight?
19. Are capability execution, value access, build, startup, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
20. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C prior runtime cycle: closed as fail-closed incomplete
- Phase 25JC architecture: 100%
- Phase 25JD implementation plan: 100%
- Phase 25JE network and environment design: 100%
- Phase 25JF static capability preflight plan: 100%
- Phase 25JF host capability execution: 0%
- Phase 25JF Gemini review: pending
- Synthetic capability execution: not authorized
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
