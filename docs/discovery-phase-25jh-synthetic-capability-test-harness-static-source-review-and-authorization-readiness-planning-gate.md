# Phase 25JH — Synthetic Capability-Test Harness Static Source Review and Authorization-Readiness Planning Gate

## Phase identity

- Phase: `25JH`
- Batch: `C — Controlled Runtime Validation`
- Phase type: static source review and authorization-readiness planning
- Approved predecessor phase: `25JG`
- Approved predecessor commit: `a601d8774b1f524ac1c11fc87623efaecb694a88`
- Phase 25JG artifact SHA-256: `e61b2a5767fdd499566fdcbf4b0d76badc25604cc6a9e261d464a40964aa55ab`
- Phase 25JG static package manifest SHA-256: `b8545ead341a58ee03d4aaacaf11aa2aac2a7e6150aeacc8f754ae1266447342`
- Source execution in this phase: `NONE`
- Syntax checking in this phase: `NONE`
- Import or compilation in this phase: `NONE`
- Host capability execution in this phase: `NONE`
- Operational reactivation state: `BLOCKED`

## Purpose

Phase 25JH performs a text-only review of the exact inert Phase 25JG source snapshots and determines whether they are ready for later syntax validation, executable materialization, and authorization planning.

The review does not modify a snapshot, remove an execution sentinel, rename a file, mark a file executable, run `bash -n`, parse a sandbox profile, compile or import Python, invoke `cp -cR`, invoke `sandbox-exec`, create a temporary fixture, open a listener or socket, resolve DNS, inspect an environment value, build or start AiFinder, invoke C01 or C02, access a database or external service, install a package, commit, or push.

## Reviewed package identity

| Inert source snapshot | Verified SHA-256 |
|---|---|
| `aifinder-phase-25jg-shell-wrapper.sh.txt` | `17f973c3caec05a046b24aa8f0b079810156da7639139eb823af1d6d375d3b20` |
| `aifinder-phase-25jg-supervisor.py.txt` | `ce737f4c86c511c6d067d8fae54356179a474622b6a13088f6f7ed26100a1ba6` |
| `aifinder-phase-25jg-deny-all.sb.txt` | `5c358b8d847211333e7ba22df82d84f796b5f30a41a2682209a949d783adbd08` |
| `aifinder-phase-25jg-loopback-template.sb.txt` | `3d5e5990235c6abf3bdb4e99c3a8b2ced01516ae75f07718738d7694b0bfda14` |
| `aifinder-phase-25jg-exact-address-template.sb.txt` | `b32ade8296391f1ccbc56f2850960ebdf27613d2ff45d57f49ee77621c3d8939` |

All reviewed files remain `.txt` snapshots with non-executable intent.

## Review decision

Static source review result:

`REVISION_REQUIRED_NOT_AUTHORIZATION_READY`

The hardcoded execution sentinels remain effective for the inert snapshots. However, removing only those sentinels would produce an unsafe and insufficient executable harness.

A corrected inert source package is required before any syntax-validation phase or authorization-readiness package may be considered.

## Positive findings

The review confirms that the snapshots:

- preserve exact Phase 25JF predecessor identities;
- remain inert text snapshots;
- block their normal entry points;
- represent CAP-01 through CAP-13 in fixed order;
- use deterministic public synthetic fixture concepts;
- avoid AiFinder application data in the proposed fixtures;
- define zero retries;
- attempt stop-on-first-failure and final cleanup;
- use metadata-oriented result structures;
- record known sandbox and implementation uncertainty;
- do not create a runtime authorization.

These strengths do not resolve the blockers below.

## Blocking findings

### JH-B01 — Caller-controlled authorization hash

**Severity:** critical  
**Source:** Python snapshot lines 786–821

The proposed command line accepts both:

- `--authorization-file`
- `--authorization-sha256`

The same caller can therefore choose any file and provide its matching hash. This verifies file integrity relative to caller input, not governance authorization.

The authorization is also not cryptographically bound to:

- the reviewed commit;
- Phase 25JG or later corrected source hashes;
- sandbox profile hashes;
- capability limits;
- the exact one-attempt boundary.

**Required correction:**

A later inert revision must embed or load from an immutable reviewed preflight:

- one exact expected authorization SHA-256;
- exact harness and profile hashes;
- exact baseline commit;
- exact allowed capability set;
- explicit exclusions;
- one-attempt consumption semantics.

The executable artifact must not accept its expected authorization hash from the operator.

### JH-B02 — No effective one-use authorization consumption

**Severity:** critical  
**Source:** Python snapshot lines 794–821

The snapshot validates a file hash but does not atomically mark the authorization as consumed before the first capability action.

The same authorization could be reused after a successful or failed run.

**Required correction:**

The corrected design must define a fail-closed consumption ledger that:

1. verifies the authorization package;
2. writes a non-secret consumed marker atomically;
3. treats creation of the first synthetic fixture or capability subprocess as consumption;
4. refuses a previously consumed authorization;
5. records only the authorization hash and disposition.

### JH-B03 — Negative sandbox outcomes can false-pass

**Severity:** critical  
**Source:** Python snapshot lines 479–532, 543–574, and 586–618

CAP-05, CAP-06, and CAP-07 treat a nonzero probe exit as evidence that networking was denied.

A nonzero exit could instead result from:

- invalid sandbox grammar;
- denied Python execution;
- denied file access;
- missing tool;
- probe syntax failure;
- profile-load failure;
- unexpected internal error.

This can produce a false claim that the sandbox enforced the intended network rule.

**Required correction:**

Every network capability needs:

- a separate profile parse and launch preflight;
- a non-network control operation proving the probe ran;
- a structured private probe-result channel;
- distinct classifications for profile failure, probe failure, and expected connection denial;
- positive listener evidence for allowed cases;
- positive no-connection evidence for denied cases;
- no reliance on generic nonzero exit as proof.

### JH-B04 — CAP-05 implementation is materially incomplete

**Severity:** high  
**Source:** Python snapshot lines 479–541

The Phase 25JF plan required deny-all testing for:

- IPv4;
- IPv6 when supported;
- UDP;
- non-network file access;
- child process;
- grandchild process.

The snapshot tests only one IPv4 TCP connection from one process.

**Required correction:**

CAP-05 must implement every required dimension or explicitly narrow the approved capability claim. A partial test must not be labeled as proof of deny-all networking or process inheritance.

### JH-B05 — CAP-06 and CAP-07 overclaim enforcement coverage

**Severity:** high  
**Source:** Python snapshot lines 543–626

CAP-06 does not test:

- alternate loopback address;
- external-network denial;
- child or grandchild inheritance.

CAP-07 does not test:

- alternate address;
- UDP denial;
- protocol restriction;
- child or grandchild inheritance.

**Required correction:**

The corrected snapshots must align function behavior, metadata, and success labels with the complete Phase 25JF proof requirements.

### JH-B06 — CAP-08 does not test sandboxed resolver behavior

**Severity:** high  
**Source:** Python snapshot lines 628–648

CAP-08 calls `socket.getaddrinfo("localhost")` directly in the supervisor, outside the proposed sandbox profile.

This demonstrates only that the host Python process can resolve `localhost`. It does not prove resolver behavior within the sandbox or identify the minimum sandbox permissions.

**Required correction:**

CAP-08 must be redesigned as a sandboxed synthetic resolver probe, or removed as an executable capability until a safe synthetic method is established.

### JH-B07 — CAP-10 does not prove process-tree ownership

**Severity:** critical  
**Source:** Python snapshot lines 680–712

The probe:

- starts only a child, not a grandchild;
- provides no readiness handshake proving the child exists;
- sends `SIGTERM` immediately;
- does not enumerate descendants;
- does not verify process-group membership;
- does not confirm that no descendant remains.

The test can pass without proving its stated capability.

**Required correction:**

CAP-10 needs deterministic parent, child, and grandchild readiness handshakes, positive process-tree enumeration, process-group membership evidence, bounded termination, and post-termination absence checks.

### JH-B08 — Output limit is checked after output completion

**Severity:** critical  
**Source:** Python snapshot lines 176–227 and 714–738

`run_bounded` checks output size only after the subprocess exits.

CAP-11 writes an oversized file directly and confirms that it is oversized. It does not prove that a running producer is terminated when the limit is crossed.

A future process could write unbounded output before the post-exit check.

**Required correction:**

The corrected design must use bounded streaming or active file-size monitoring that terminates the process group immediately at the limit, then verifies deletion and metadata-only retention.

### JH-B09 — CAP-13 passes before cleanup occurs

**Severity:** critical  
**Source:** Python snapshot lines 758–783

CAP-13 records `PASS` while cleanup is explicitly deferred to `finally`.

Therefore CAP-13 does not prove:

- temporary-root deletion;
- listener release;
- profile deletion;
- raw-output deletion;
- absence of remaining descendants.

If a prior capability fails and cleanup also fails, the result preserves only the earlier failure and can omit cleanup failure.

**Required correction:**

Cleanup and preservation must be evaluated after cleanup. The final result must independently report:

- primary capability disposition;
- cleanup disposition;
- repository-preservation disposition;
- listener-release disposition;
- process-release disposition.

Cleanup failure must never be masked.

### JH-B10 — Repository guard is incomplete

**Severity:** high  
**Source:** Python snapshot lines 156–173 and 816–840

The snapshot records HEAD, `origin/main`, and a hash of `git status`, but does not require:

- exact expected baseline;
- exact branch;
- approved origin;
- ahead and behind counts of zero;
- a clean initial working tree;
- exact predecessor artifact identity;
- exact source and profile hashes.

A dirty repository could be accepted if it remains identically dirty.

**Required correction:**

All repository and package identities must be verified before authorization consumption and before temporary-state creation.

### JH-B11 — Source and profile identity drift is not prevented

**Severity:** high  
**Source:** Python snapshot lines 822–838

The Python snapshot embeds sandbox profile strings internally, but does not verify them against the reviewed `.sb.txt` snapshot hashes.

The shell wrapper also does not verify or materialize the reviewed source files.

**Required correction:**

A later corrected package must have one canonical source for every profile and verify all component hashes before any syntax check or execution. Embedded and external profile definitions must not diverge.

### JH-B12 — Total timeout and listener bound are not enforced

**Severity:** high  
**Source:** Python snapshot lines 31–38 and capability methods

`TOTAL_TIMEOUT_SECONDS` and `MAX_LISTENERS` are defined but unused.

The suite accumulates:

- one listener in CAP-05;
- two in CAP-06;
- two in CAP-07.

This exceeds the declared maximum of four before final cleanup.

**Required correction:**

The corrected supervisor must enforce:

- one suite-wide monotonic deadline;
- per-capability deadlines;
- listener acquisition limits;
- immediate listener closure after each capability;
- no listener accumulation across unrelated tests.

### JH-B13 — Unexpected exceptions are not safely classified

**Severity:** high  
**Source:** Python snapshot lines 316–365 and top-level `main`

The suite catches only `CapabilityFailure`.

`OSError`, `subprocess.CalledProcessError`, `ValueError`, JSON errors, and other exceptions may escape and print a traceback, bypassing the planned metadata-only result.

**Required correction:**

The corrected design must:

- sanitize all unexpected exceptions into `UNEXPECTED_INTERNAL_FAILURE`;
- retain no exception text that may expose paths or raw output;
- always execute cleanup;
- return a bounded metadata-only result.

### JH-B14 — Temporary-state creation belongs after every guard

**Severity:** high  
**Source:** Python snapshot lines 286–298

`CapabilitySuite.__init__` creates the temporary root and captures repository state.

Although the current normal `main` checks its execution sentinel and authorization file first, the class constructor itself is side-effectful and can be called through another import path.

**Required correction:**

Temporary-root creation must be isolated behind one guarded execution function after:

- execution-state verification;
- immutable authorization verification;
- repository identity verification;
- component hash verification;
- tool identity verification.

Constructors and imports must remain side-effect free.

### JH-B15 — Sandbox profiles are not ready for materialization

**Severity:** critical  
**Source:** all three `.sb.txt` snapshots and Python lines 822–838

The profiles use `(allow default)` and unverified `remote ip` address-and-port expressions.

No static syntax or least-privilege proof exists.

The intended deny and later allow behavior may depend on sandbox rule precedence and grammar that remain unverified.

**Required correction:**

A corrected inert package must:

- separate profile grammar from runtime substitution;
- minimize default permissions;
- define exact required filesystem and process permissions;
- include a profile-only parse preflight;
- treat any grammar uncertainty as blocking;
- prohibit execution until the exact host version accepts the reviewed profiles.

### JH-B16 — Shell wrapper is not an execution-preflight implementation

**Severity:** high  
**Source:** shell snapshot lines 1–27

The shell wrapper is an effective inert blocker, but it contains no future guarded materialization path.

It does not verify:

- package hashes;
- file modes;
- baseline and synchronization;
- authorization binding;
- source reconstruction;
- log and result paths;
- original exit-code propagation;
- cleanup.

**Required correction:**

Phase 25JI must produce a new inert shell snapshot representing the complete future gate while keeping execution hard-blocked.

### JH-B17 — APFS proof terminology is unresolved

**Severity:** medium  
**Source:** CAP-02 through CAP-04 design

The current tests can prove that `/bin/cp -cR` succeeds and that source and destination are logically mutation-independent.

They do not prove copy-on-write allocation behavior.

**Required correction:**

The next phase must choose one explicit claim:

- `LOGICALLY_INDEPENDENT_DISPOSABLE_COPY`, which requires no allocation claim; or
- `APFS_CLONE_CONFIRMED`, which requires a separately approved non-sensitive clone-specific proof.

The result must not use stronger terminology than the evidence supports.

## Authorization-readiness disposition

Authorization readiness:

`BLOCKED_PENDING_CORRECTED_INERT_SOURCES`

Syntax-validation readiness:

`BLOCKED_PENDING_CORRECTED_INERT_SOURCES`

Executable-materialization readiness:

`BLOCKED_PENDING_CORRECTED_INERT_SOURCES`

Synthetic capability execution:

`NOT_AUTHORIZED`

No authorization text or hash should be generated for the current Phase 25JG snapshots.

## Required revision package

The next inert package must include new hashes for:

1. corrected shell-wrapper snapshot;
2. corrected Python-supervisor snapshot;
3. corrected deny-all profile;
4. corrected loopback-only profile template;
5. corrected exact-address and exact-port profile template;
6. an immutable component manifest;
7. a static defect-closure matrix mapping JH-B01 through JH-B17 to exact source sections.

The original Phase 25JG snapshots remain historical review inputs and must not be overwritten.

## Required later gate sequence

After a corrected inert package is approved:

1. static corrected-source review;
2. static syntax-validation command plan;
3. separately authorized syntax and profile-parse validation only;
4. result review and defect disposition;
5. exact synthetic execution preflight;
6. fresh one-attempt human authorization;
7. one synthetic capability execution;
8. result and cleanup review.

A syntax-validation authorization must not authorize capability execution.

## Authorization ledger

The Phase 25IW authorization SHA-256 `1e255bd9cc41a14291bb9848406bf37978b19ee24e8e1a6457e32b4260177473` remains `CONSUMED_AND_NOT_REUSABLE`.

The Phase 25IZ authorization SHA-256 `c5a915c6d18d400fdc164c4ce2ff339e6b7c120ee5abfbd36ea9bc977815c080` remains `CONSUMED_AND_NOT_REUSABLE`.

Phase 25JH creates no authorization.

## Phase decision

Phase 25JG static package identity:

`VERIFIED`

Phase 25JG execution sentinels:

`PRESERVED`

Static source quality:

`REVISION_REQUIRED`

Syntax validation:

`NOT_AUTHORIZED`

Executable materialization:

`NOT_AUTHORIZED`

Synthetic capability execution:

`NOT_AUTHORIZED`

Host capabilities:

`UNPROVEN`

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

**Phase 25JI — Corrected Synthetic Capability Harness Inert Source Revision Gate**

Phase 25JI may create a new, non-executable static review package that:

- preserves all hard execution blocks;
- resolves JH-B01 through JH-B17;
- supplies a defect-closure matrix;
- assigns new source and profile hashes;
- keeps all files as mode-`0644` `.txt` snapshots;
- updates no application source.

Phase 25JI must not:

- overwrite the Phase 25JG historical snapshots;
- remove execution sentinels;
- create executable files;
- run shell or Python syntax checks;
- parse a sandbox profile;
- create synthetic fixtures;
- invoke `cp -cR` or `sandbox-exec`;
- open listeners or sockets;
- perform DNS resolution;
- inspect environment values;
- build or start AiFinder;
- invoke C01 or C02;
- access a database or external service;
- install packages;
- authorize capability execution;
- begin Batch D;
- authorize operational reactivation or public launch.

## Gemini senior-review questions

Gemini should approve Phase 25JH only if all answers are affirmative:

1. Is Phase 25JH anchored to exact Phase 25JG commit `a601d8774b1f524ac1c11fc87623efaecb694a88`?
2. Are all Phase 25JG package hashes verified without syntax checking or execution?
3. Are the hard execution sentinels preserved?
4. Is caller-controlled authorization hashing classified as a critical blocker?
5. Is one-use authorization consumption required before the first capability action?
6. Are generic nonzero sandbox exits rejected as proof of enforcement?
7. Are CAP-05 through CAP-08 classified as incomplete or non-probative where appropriate?
8. Is CAP-10 classified as insufficient to prove parent-child-grandchild ownership?
9. Is post-exit output-size checking rejected as an output-limit proof?
10. Is CAP-13 classified as occurring before actual cleanup?
11. Are repository, component-hash, timeout, listener, exception, and side-effect guards required?
12. Are sandbox profiles classified as unproven and not materialization-ready?
13. Is the shell wrapper classified as an inert blocker rather than a complete future gate?
14. Is APFS terminology required to match the evidence?
15. Are syntax validation, executable materialization, authorization creation, and capability execution blocked?
16. Is Phase 25JI limited to a corrected inert source package with new hashes?
17. Are application build, startup, C01, C02, Batch D, operational reactivation, and public launch unauthorized?
18. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Batch A governance closure: 100%
- Batch B operational reactivation readiness: 100%
- Batch C prior runtime cycle: closed as fail-closed incomplete
- Phase 25JC architecture: 100%
- Phase 25JD implementation plan: 100%
- Phase 25JE network and environment design: 100%
- Phase 25JF static capability plan: 100%
- Phase 25JG inert source package: 100%
- Phase 25JH static source review: 100%
- Phase 25JH Gemini review: pending
- Corrected inert source package: pending
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
