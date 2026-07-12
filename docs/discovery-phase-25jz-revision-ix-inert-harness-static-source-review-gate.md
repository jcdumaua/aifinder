# Phase 25JZ — Revision IX Inert Harness Static Source Review Gate

## Phase identity

- Phase: `25JZ`
- Phase type: Revision IX inert-source static text review
- Approved predecessor commit: `45778d5b5d44402f6ca56bf4a878bdd5951c62f3`
- Phase 25JY artifact SHA-256: `3f47d2e8a0ea011080f7c77cd1f9bd539fc5ff54773c15f8dd4216493b6133d3`
- Revision IX core ZIP SHA-256: `4bef1c2ebb01b60e4cf27acbc9156e9b46ff39b3dfb6a00f6112e3a1b5c84681`
- Revision IX static-package manifest SHA-256: `3a6c73857883a0c8898ca319dcb07a4e2699b6d3bd2ae4211ed187abac721ce1`
- Revision IX review-identities SHA-256: `af726b157b6374eccfea82c2c5cdfd2fe9b528b9cf70d57e30da6fc5f13fa597`
- Phase 25JZ finding-ledger SHA-256: `1119b8856fdfc65d76beb63240e3f96196bd541e51dd935d6943de11bb992674`
- Python parsing: `NONE`
- Python syntax validation: `NONE`
- Schema parsing: `NONE`
- Sandbox-profile parsing: `NONE`
- Materialization: `NONE`
- Execution: `NONE`
- Operational reactivation: `BLOCKED`

## Purpose

Phase 25JZ performs a fresh text-only implementation review of the exact Phase 25JY Revision IX package. The earlier static-design approval is preserved as historical review evidence but is not treated as proof that all controls are correctly connected or executable.

No source parser, import, compiler, syntax checker, schema parser, profile parser, materializer, execution envelope, authorization action, fixture, capability, application command, database, external service, C01, C02, Batch D, deployment, publishing, operational reactivation, or public launch was invoked.

## Package identity result

| Reviewed item | Verified SHA-256 |
|---|---|
| Phase 25JY artifact | `3f47d2e8a0ea011080f7c77cd1f9bd539fc5ff54773c15f8dd4216493b6133d3` |
| Revision IX core ZIP | `4bef1c2ebb01b60e4cf27acbc9156e9b46ff39b3dfb6a00f6112e3a1b5c84681` |
| Static-package manifest | `3a6c73857883a0c8898ca319dcb07a4e2699b6d3bd2ae4211ed187abac721ce1` |
| Review identities | `af726b157b6374eccfea82c2c5cdfd2fe9b528b9cf70d57e30da6fc5f13fa597` |
| Root Manifest | `b81293dde9999195c260aee8f7b3f1b33e3f683cabfad36ff4ba4fe31ed63581` |
| Bootstrap Manifest | `ffc9c224f9a3bc981551be9dde4f499729123b4fecfd5bd834cf655c2683907c` |
| Launcher | `55a72d89432af87cfcbea35e2d4561f4ecec60244c490c075fb78118a10245be` |
| Broker | `18aaadce62cefee2ed5b30fe92cd913b50ddf1763ab16d8d1834eebaf165c18c` |
| Coordinator | `96ff56f24c38495774581c6eb60094909b909c5ce4e2cdd95f0e2e238854aa6c` |
| Probe | `be68449bd85c9136c36bc1f5c1cd75e0abb87f0c83ac0f414a83b04b8cd8e733` |
| Inventory | `fb517f07a3ccf2dc885b86b9a56e3accaf3f94535320d9ef642a6d790c94c97d` |
| Contract | `5471365c7d97ac7e011e7bf27165b374a5a15cd1adea3df396b6ff069efccdd2` |

Package identities:

`VERIFIED`

Execution sentinels:

`PRESERVED`

Static review decision:

`REVISION_REQUIRED_NOT_READY_FOR_SYNTAX_OR_MATERIALIZATION_PREFLIGHT`

Phase 25JZ identifies `16` new implementation-level blockers:

- Critical: `10`
- High: `6`

The Phase 25JY closure matrix remains an approved static-design record. The exact v10 source snapshots do not yet implement several required bindings, framing contracts, identity checks, cleanup paths, and evidence-provenance guarantees.

## Finding summary

| Finding | Severity | Status | Assessment |
|---|---|---|---|
| `JZ-B01` | `critical` | `OPEN` | Launcher does not provide the broker configuration the broker requires |
| `JZ-B02` | `critical` | `OPEN` | Repeated inventory-helper calls collide in the launcher descriptor registry |
| `JZ-B03` | `critical` | `OPEN` | Authorization and envelope records are neither hash-bound nor fully validated |
| `JZ-B04` | `critical` | `OPEN` | Broker root trust is still selected through ambient environment data |
| `JZ-B05` | `critical` | `OPEN` | Launcher final-status validation is too shallow for authoritative PASS |
| `JZ-B06` | `critical` | `OPEN` | Broker process-inventory handling is incompatible with helper framing |
| `JZ-B07` | `critical` | `OPEN` | Probe descriptor evidence is based on constant digests rather than a parent-observed set |
| `JZ-B08` | `critical` | `OPEN` | Network policy evidence classifies a caller-supplied errno without performing an operation |
| `JZ-B09` | `critical` | `OPEN` | Broker operation and coordinator identities are declarative and not revalidated |
| `JZ-B10` | `critical` | `OPEN` | Coordinator output pipes are not drained and diagnostics are fabricated |
| `JZ-B11` | `high` | `OPEN` | Launcher source materialization uses unchecked single-write calls |
| `JZ-B12` | `high` | `OPEN` | RPC validation does not enforce operation-specific argument schemas |
| `JZ-B13` | `high` | `OPEN` | Listener lifecycle lacks failure cleanup and release proof |
| `JZ-B14` | `high` | `OPEN` | Broker descriptor ownership and finalization are not tracked |
| `JZ-B15` | `high` | `OPEN` | Broker prefinal validation checks only a schema label |
| `JZ-B16` | `high` | `OPEN` | Inventory helper identity is not bound to its captured process row |

## Detailed findings

### JZ-B01 — Launcher does not provide the broker configuration the broker requires

**Severity:** `critical`

**Impact**

The launcher starts the broker with only a minimal PATH/HOME/locale environment. The broker immediately requires AIFINDER_PINNED_ROOT_RECORD and later requires AIFINDER_REPOSITORY_PATH and AIFINDER_ALLOWED_OPERATIONS. The broker therefore fails before a trusted coordinator or RPC workflow can start.

**Required Revision X correction**

Replace ambient environment dependencies with one authenticated, bounded broker-configuration frame or read-only descriptor. Bind the exact pinned root record, repository path, allowed operations, attempt nonce, and authorization identity, validate them before use, and include the descriptor in explicit ownership and pass_fds records.

### JZ-B02 — Repeated inventory-helper calls collide in the launcher descriptor registry

**Severity:** `critical`

**Impact**

run_inventory_helper always registers inventory_source, inventory_result_read, and inventory_result_write under fixed names. Launcher main calls it three times. The first invocation leaves records in the registry, so the second acquire detects a duplicate name and fails before broker identity binding.

**Required Revision X correction**

Use a scoped per-invocation registry or nonce-qualified descriptor names. Close and unregister every helper source/result descriptor after the helper is reaped, then prove no helper descriptor or process survives before another invocation.

### JZ-B03 — Authorization and envelope records are neither hash-bound nor fully validated

**Severity:** `critical`

**Impact**

The envelope includes authorization_sha256, but launcher main discards the raw authorization bytes and never compares their digest to that field. The validators also leave multiple schema, state, digest, list, integer, and path fields unchecked. An envelope and authorization can therefore be mixed or malformed before security-sensitive use.

**Required Revision X correction**

Retain canonical raw authority bytes, verify the envelope authorization_sha256 against the exact authorization bytes, enforce exact schema version/state/type/bounds for every field, reject bool-as-int and duplicates, and validate repository/source paths before opening anything.

### JZ-B04 — Broker root trust is still selected through ambient environment data

**Severity:** `critical`

**Impact**

Even if the missing environment variables were supplied, the broker accepts AIFINDER_PINNED_ROOT_RECORD from ambient process state and reads only the root manifest from it. The broker does not consume an authenticated trust descriptor and does not independently bind the bootstrap manifest before source acquisition.

**Required Revision X correction**

Pass a launcher-validated trust record through a dedicated read-only descriptor bound to the attempt and authorization. The broker must exact-validate root and bootstrap identities, phase, predecessor, package state, complete inventory, and source records before materializing coordinator, probe, or inventory code.

### JZ-B05 — Launcher final-status validation is too shallow for authoritative PASS

**Severity:** `critical`

**Impact**

validate_broker_final_status checks the top-level key set, attempt nonce, and prefinal schema name only. It does not exact-validate nested broker/coordinator identities, bind broker identity to launcher-observed PID/start-token/PGID/SID, validate coordinator release evidence or diagnostics, or enforce failure-code consistency. PASS then depends mainly on PREFINAL_PASS and an empty broker failure list.

**Required Revision X correction**

Exact-validate every nested status object and bound. Compare broker identity to the launcher-observed identity, validate coordinator identity and release records, diagnostics hashes and byte counts, prefinal exact keys and release states, and require consistent failure codes before deriving authoritative PASS.

### JZ-B06 — Broker process-inventory handling is incompatible with helper framing

**Severity:** `critical`

**Impact**

The inventory helper writes a four-byte length prefix followed by JSON. Broker process_inventory captures stdout and passes the entire framed byte sequence directly to json.loads. A successful helper response therefore cannot be decoded as JSON.

**Required Revision X correction**

Use the same bounded frame reader on helper stdout and validate exact frame length, nonce, helper identity, byte counts, return code, EOF, and trailing-byte policy before accepting inventory evidence.

### JZ-B07 — Probe descriptor evidence is based on constant digests rather than a parent-observed set

**Severity:** `critical`

**Impact**

The coordinator sends hashes of literal labels such as single-role-fds and tree-role-fds. Broker forwards those values without constructing a descriptor expectation record, and probe defaults fd-expectation-fd to -1. The expected digest is not derived from the actual pre-exec descriptor set and the probe source descriptor is not explicitly excluded.

**Required Revision X correction**

The parent must enumerate and bind the exact role descriptor set before exec, create a nonce-bound expectation record on a dedicated descriptor, pass that descriptor explicitly, and require the probe to exclude the source, expectation, and inventory mechanism descriptors deterministically.

### JZ-B08 — Network policy evidence classifies a caller-supplied errno without performing an operation

**Severity:** `critical`

**Impact**

The coordinator submits the integer 1 as evidence, and broker network_check merely classifies that supplied value. No socket operation produces the errno, no sandbox profile is tied to the attempt, and no endpoint or exception record is observed. CAP-12 network evidence remains synthetic.

**Required Revision X correction**

Perform the exact network operation inside an identity-bound operation group under the selected profile. Capture the real exception errno, family, endpoint, profile identity, release evidence, and bounded diagnostics, then apply the exact denial or IPv6-unsupported allowlist.

### JZ-B09 — Broker operation and coordinator identities are declarative and not revalidated

**Severity:** `critical`

**Impact**

bounded_process records the literal start token AUTHENTICATED_INVENTORY without consulting the inventory helper. Coordinator identity stores only a start_token_source label. TERM and KILL are sent using captured PGIDs without revalidating PID, actual start token, PGID, and SID immediately before each signal.

**Required Revision X correction**

Integrate the bounded inventory helper into broker process registration and every pre-signal checkpoint. Record actual start tokens and exact identities, reject changes, signal only the revalidated group, reap the leader, and prove group absence.

### JZ-B10 — Coordinator output pipes are not drained and diagnostics are fabricated

**Severity:** `critical`

**Impact**

Broker launches coordinator stdout and stderr as pipes but never drains them. A coordinator that writes enough data can block before prefinal completion. Broker final status then reports zero-byte diagnostics and empty hashes rather than observed bounded streams.

**Required Revision X correction**

Continuously drain coordinator stdout and stderr with selectors, independent byte budgets and deadlines. Hash the actual bytes, preserve bounded metadata, terminate and reap on overflow or timeout, and populate final diagnostics only from observed captures.

### JZ-B11 — Launcher source materialization uses unchecked single-write calls

**Severity:** `high`

**Impact**

Helper and broker snapshots are written with one os.write call. POSIX writes may be partial, so a truncated source descriptor can be launched or hashed inconsistently without an exact-length write loop and readback check.

**Required Revision X correction**

Use a bounded write_all primitive, verify the final descriptor size and SHA-256 against the pinned source record, rewind, set final mode, and only then transfer the descriptor.

### JZ-B12 — RPC validation does not enforce operation-specific argument schemas

**Severity:** `high`

**Impact**

validate_rpc_request checks only the top-level key set, schema name, and nonce. It does not validate identifier formats, operation membership, exact argument keys, types, ranges, endpoint forms, or digest formats before dispatch_request performs direct indexing.

**Required Revision X correction**

Create exact validators for every operation, reject unknown or extra argument keys, enforce identifier and digest formats, integer bounds and endpoint forms, and convert all failures to bounded allowlisted codes without raw exception text.

### JZ-B13 — Listener lifecycle lacks failure cleanup and release proof

**Severity:** `high`

**Impact**

ListenerLedger.open registers the socket before bind/listen but has no exception cleanup. CLOSE_LISTENERS reports close state only; it does not prove endpoint rebind or absence. SHUTDOWN discards the release result, so final capability evidence can omit listener cleanup failures.

**Required Revision X correction**

Close and mark the record on every acquisition exception, validate exact ledger state, perform bounded rebind or absence proof after close, propagate release failures through RPC and final status, and reject PASS while any listener remains.

### JZ-B14 — Broker descriptor ownership and finalization are not tracked

**Severity:** `high`

**Impact**

Coordinator, probe, and inventory source descriptors, both RPC sockets, and prefinal pipe descriptors are created as local values without a broker descriptor registry or an outer independent close-all finalizer. Exceptional paths can retain writers, suppress EOF, or leak authority descriptors.

**Required Revision X correction**

Add a broker descriptor registry with sentinel initialization, immediate ownership registration, explicit transfer, independent BaseException-contained close units, and a final closure ledger included in broker status.

### JZ-B15 — Broker prefinal validation checks only a schema label

**Severity:** `high`

**Impact**

After reading prefinal, the broker checks schema_version but does not enforce the exact key set, attempt nonce, failure-code list, repository snapshot schemas, capability evidence, or REQUESTED/PENDING release states. Malformed or cross-attempt prefinal data can enter broker final status.

**Required Revision X correction**

Apply an exact prefinal validator before status construction, including attempt binding, exact keys, nested evidence schemas, failure consistency, repository identity, capability IDs, and release-state constants.

### JZ-B16 — Inventory helper identity is not bound to its captured process row

**Severity:** `high`

**Impact**

The helper reports PID/PGID/SID plus the label SELF_ROW_IN_BOUNDED_CAPTURE, but it does not locate its unique row and include the actual start token. Launcher validation accepts helper_identity as an arbitrary object and does not compare it to rows.

**Required Revision X correction**

Require exactly one self row, include its actual start token and parent/group/session fields in helper_identity, exact-validate the nested object, and compare it to the row before using any inventory result for identity decisions.

## Disposition

Revision IX package:

`PRESERVED_AS_HISTORICAL_STATIC_DESIGN_INPUT`

Revision IX implementation readiness:

`REJECTED`

Revision X corrected inert source:

`REQUIRED`

Python syntax validation:

`NOT_AUTHORIZED`

Schema and profile parsing:

`NOT_AUTHORIZED`

Materialization preflight:

`NOT_AUTHORIZED`

Execution-envelope or authorization creation:

`NOT_AUTHORIZED`

Capability execution, application runtime, C01, C02, and Batch D:

`NOT_AUTHORIZED`

Operational reactivation:

`BLOCKED`

## Safe successor

**Phase 25KA — Corrected Synthetic Capability Harness Inert Source Revision X Gate**

Phase 25KA may begin only after Gemini approves this Phase 25JZ review record. It may create a new static non-executable Revision X package addressing `JZ-B01` through `JZ-B16`. It must not overwrite Revision IX, parse or execute source, parse schemas or profiles, materialize runtime files, create or consume authorization, invoke capabilities, run C01/C02, access a database or external service, begin Batch D, deploy, publish, reactivate operations, or launch publicly.

## Gemini senior-review questions

Gemini should approve Phase 25JZ only if all answers are affirmative:

1. Is the review anchored to exact Phase 25JY commit `45778d5b5d44402f6ca56bf4a878bdd5951c62f3`?
2. Are all 23 core identities and five execution sentinels verified?
3. Does the launcher omit broker configuration required by the broker?
4. Do repeated inventory-helper calls collide in DescriptorRegistry?
5. Is authorization_sha256 ignored and authority validation incomplete?
6. Is broker root trust still ambient-environment selected?
7. Is launcher final-status validation insufficient for authoritative PASS?
8. Is process-inventory helper framing incompatible with broker JSON decoding?
9. Is probe FD evidence based on constant labels rather than a parent-observed set?
10. Is network evidence based on a caller-supplied errno rather than an observed operation?
11. Are broker operation/coordinator identities not inventory-revalidated before signals?
12. Are coordinator output pipes undrained while diagnostics are fabricated as empty?
13. Are launcher source writes vulnerable to partial writes?
14. Are RPC operation arguments incompletely validated?
15. Is listener cleanup/release evidence incomplete?
16. Is broker descriptor ownership incomplete?
17. Is prefinal validation incomplete?
18. Is helper identity not bound to its captured row?
19. Must syntax validation and materialization remain blocked?
20. Is Phase 25KA limited to a new inert Revision X correction?
21. Does operational reactivation remain `BLOCKED`?

## System layer progress report

- Phase 25JY Revision IX inert package: 100%
- Phase 25JZ Revision IX static source review: 100%
- Phase 25JZ Gemini review: pending
- Phase 25KA Revision X correction: 0%
- Python syntax validation: 0%
- Materialization preflight: 0%
- Host capability execution: 0%
- Successful C01 runtime validation: not achieved
- Overall Discovery Engine progress estimate: 99%
- Operational reactivation: BLOCKED
