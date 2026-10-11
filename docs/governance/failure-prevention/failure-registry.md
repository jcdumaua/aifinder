# AiFinder Master Failure & Restriction Registry — v2 (reconciled working evidence baseline)

**Prepared:** 2026-10-09 · **Mode:** ChatGPT independent read-only historical audit and derived local artifact creation · **Scope:** AiFinder historical CCR and admitted R2 report, *not* a live Codex execution or current system-permission audit.

## What is established

Codex R2 reported a completed offline inventory of **1,163 CCR-named files (29,950,233 bytes)** and **1,645 `.jsonl` session files (7,672,125,317 bytes; 1,201,089 lines)**. It recorded **53 exact-SHA duplicate-CCR groups**, **0 reported inaccessible reads**, **0 malformed JSONL lines**, and **2,227 oversized lines skipped** (262,144-byte bound). These are **scanned files/line statistics**, *not* numbers of distinct failures or root causes. Only selected representative CCR incidents were causally verified. Unread/rejected oversized lines and excluded sources make exhaustive causal classification impossible from this baseline.

**R2 reporting discrepancy — resolved as a report defect:** The archived `CODEX_FINDINGS.json` reports `relevant_session_files=426`. The independently inspected archived `forensic_parser.py` increments this counter once for each session `.jsonl` containing one or more matching category regexes in admitted machine fields, via `safe_machine_strings` and `add_hits`. Thus the R2 narrative statement that *no session file* had a recognized category marker is incorrect. **426 is a count of marker-matching session files, not distinct incidents, root causes, or verified failures.** The original R2 narrative and all inputs remain unchanged. This is a logical/source-vs-output audit, **not a fresh execution of the full 7.67GB scan**. The prior C06 V3 SIGABRT also has later, more specific V6 causal closure; historical context is retained without incorrectly labeling that case currently unresolved.

**Crucial distinction:** A recurrent string such as `EPERM`, `SIGABRT` or `BAD_REQUEST` is a symptom. Same symptom does *not* prove same causal restriction; a later passing run does *not* retroactively prove exactly why an earlier run failed.

## Status legend

- **CAUSAL_ESTABLISHED… / ESTABLISHED_AND…:** limited identified trigger/mechanism backed by cited source and verification; observe exact scope.
- **ESTABLISHED_DENIAL / ESTABLISHED_POLICY_BLOCK:** proven barrier or governance reason, not necessarily proven underlying OS cause.
- **CURRENT_FRESH_PASS; HISTORIC…UNRESOLVED:** latest remedy/workload worked; historical masked error cannot be reconstructed.
- **UNVERIFIED_ROOT_CAUSE:** no sufficient causal discriminator; do not convert a guess into a prohibition or workaround.

## Evidence-grounded failure families

Each row captures a distinct *source-supported failure mechanism or still-unresolved case*, not a deduplicated count of all historical incidents.

| ID | Failure family / layer | Diagnosis status | Verified outcome and mandatory preflight |
|---|---|---|---|
| **AF-001** | Derived-write EPERM (macOS / effective process sandbox) | ESTABLISHED DENIAL; HOST ORIGIN UNPROVEN | No historical repair evidenced; No effects; not a successful attempt |
| **AF-002** | Node allocator startup / pagesize (selected macOS sandbox profile) | CAUSAL ESTABLISHED CASE SPECIFIC | Exact hw.pagesize_compat read grant in approved diagnostic profile; getconf 16384; two clean Node interventions; not a project-qualification run |
| **AF-003** | Node GetOSInformation startup / C06 (selected macOS sandbox profile) | CAUSAL ESTABLISHED AND C06 PASSED | Scoped five-rule profile under specific V6 authority, not global sandbox relaxation; ABAB; five necessity tests; seven-case containment canary; C06 24/24 assertions PASS |
| **AF-004** | C07 helper/dependency closure (static source contract / read admission) | RESOLVED FOR LATER C07 V5 | Independently admit actual helper identity and full import/package/JSON closure; use current exact hashes; V5 C07 launched once, exited 0; qualification proposed 2/29 subject to audit |
| **AF-005** | C08 terminal-parser/producer mismatch (test contract / assistant-authored script) | ESTABLISHED AND VERIFIED IN FRESH C08 | Parser recognizes exact producer enum grammar; tests exercise real producer and downstream consumers; Focused 36/36; JS 184/184; Python 73/73; fresh C08 PASS |
| **AF-006** | C08 stdout capture loss (test harness / evidence retention) | ESTABLISHED AND VERIFIED IN FRESH C08 | Private capture, fsync, independent re-read/hash/byte identity before decoding/framing/parsing; preserve failure stage; 11/11 helper and integration; fresh 48,554-byte output retained and parsed |
| **AF-007** | C08 stale bindings / shape mismatch (script preflight / identity validation) | ESTABLISHED AND VERIFIED | Update exact affected current hashes; inspect nested sha256/algorithm/excluded-self fields; regenerate bindings in order; JS 184/184, nine aggregates; checklist passed; later C08 PASS |
| **AF-008** | C18 Trace2 environment propagation (process environment / tool chain) | ESTABLISHED CAUSE OF DIAGNOSTIC BLOCK | Specifically bind required approved setting at actual direct and bound Git environment boundaries; Initial static eight checks; later diagnostic/foreground phases reached native Trace2 execution |
| **AF-009** | C18 detached Git maintenance children (process lifecycle / bounded accounting) | ESTABLISHED AND FRESHLY VERIFIED | Exact approved maintenance.autoDetach=false at two existing Git boundaries; Fresh suite with seven foreground --no-detach children; 356 process-image bound; capability2 and qualification PASS, pending indepe… |
| **AF-010** | C18 mirrored path instead of admitted source (sandbox file-read admission / script design) | ESTABLISHED AND FRESHLY VERIFIED | Replace 17 read literals and 4 metadata projections with exact admitted originals; 6 negative mutants; 77 synthetic checks; successful fresh capability2 and qualification |
| **AF-011** | C19 cross-process pressure freshness (controller timing / script defect) | ESTABLISHED AND VERIFIED IN FRESH C19 | Use one continuous controller instance/PID with in-memory timestamps, recheck immediately before fork; Two RED cases, 38 actual-function checks, nine lifecycle tests, fresh capability+qualification PASS |
| **AF-012** | C20 prerequisite sequence (governance/controller ordering) | ESTABLISHED AND VERIFIED IN FRESH C20 | Require new qualifying capability first and stop on failed/spent/incomplete gates; Nine tests + 133 mandatory controls; C20 capability and qualification PASS |
| **AF-013** | C20 historical EPERM (selected sandbox / unresolved historical site) | CURRENT FRESH PASS; HISTORIC SYSCALL UNRESOLVED | Approved exact profile/read prerequisites and new authority; do not claim one line is proven historic cause; 133 controls; fresh native pair exit 0, but old EPERM not reproduced |
| **AF-014** | C19 historical executable-access EPERM (system executable access / selected sandbox) | ESTABLISHED DENIED OPERATION; HOST REASON UNPROVEN | Only approved exact executable/profile control in later fresh phased repair; R6 reproduced selected denial; later fresh C19 capability+qualification PASS |
| **AF-015** | Missing pinned xcrun path (filesystem executable identity) | ESTABLISHED MISSING PATH | Correct plan and separately authorized exact runtime identity; no unapproved substitute path; lstat and descriptor observation both ENOENT; no replacement run |
| **AF-016** | Executable hardlink count / atime reader assumptions (assistant-generated file identity checker) | ESTABLISHED NLINK DEFECT; HISTORIC ATIME DIFFERENCE UNRECORDED | Use exact pinned link count for named runtime only; compare stated stable fields, not incidental atime; normalize mode/nlink representation; C20 current admission/metadata conversion tests and fresh workload… |
| **AF-017** | R2 unsafe launcher contract (execution transport / script authoring) | ESTABLISHED CONTRACT VIOLATION | Generate launcher strictly from approved complete contract and preflight receipt; Report preserved failed invocation; no native workload started |
| **AF-018** | MCP envelope classifier (tool protocol / synthetic parser) | ESTABLISHED AND LOCALLY CORRECTED | Recursive transport-layer classification with guarded accessors; 33 synthetic checks passed |
| **AF-019** | 90-second aggregate timeout (resource/time budget) | ESTABLISHED TRANSIENT IN SAMPLE | Measured fit-for-purpose budget and distinguish aggregate vs component; Later isolated completion and aggregate PASS |
| **AF-020** | Authorization gate (human governance not technical sandbox) | ESTABLISHED POLICY BLOCK | Prepare exact bounded package and request James approval before protected work; Historical report declares NOT_RUN |
| **AF-021** | Provider create BAD_REQUEST (external/provider request schema) | UNVERIFIED ROOT CAUSE | New separately authorized, nondisclosing request-contract diagnosis if ever needed; No correction demonstrated |
| **AF-022** | Device-schema blocked category (source/response structural contract) | UNVERIFIED ROOT CAUSE | Prospective nondisclosing structural discriminator; not executed; None |
| **AF-023** | Manifest candidate-test stopped (test/fixture mismatch candidate) | UNVERIFIED ROOT CAUSE | Candidate/manifest alignment preflight proposed; No verified correction in anchor |
| **AF-024** | JSON Lines report parse (assistant report-construction defect) | ESTABLISHED AND CORRECTED WITHOUT NATIVE RETRY | Parse and validate individual JSONL records without changing captured bytes; Writer completed after correction; native workloads not rerun |
| **AF-025** | Oversized preview/report output (assistant tool output guard) | ESTABLISHED TOOLING FAILURE | Bound both per-record and response aggregation; emit narrow pages; Subsequent narrower reads permitted; previous failure retained |

## Detailed case cards and evidence

### AF-001 — Derived-write EPERM
- **Layer:** macOS / effective process sandbox
- **Root-cause status:** ESTABLISHED_DENIAL; HOST_ORIGIN_UNPROVEN
- **Trigger:** Direct Node/fs derived writer in first-environment reseal
- **Mechanism:** Write denied before any derived output changed
- **Observed failure:** EPERM; zero derived bytes; matrix not invoked
- **Correction:** No historical repair evidenced
- **Verification:** No effects; not a successful attempt
- **Mandatory preflight rule:** Independently prove exact write destination admission before spending one-shot execution; do not infer broader write access from read access
- **Evidence:** AiFinder-Admin-V1-Official-First-Environment-Derived-Reseal-Host-Hunk-Recovery-Design-V2-CCR-20260830T195356Z/CCR-REPORT.md:33
- **Uncertainty:** EPERM alone does not attribute the denial to SIP or Codex.

### AF-002 — Node allocator startup / pagesize
- **Layer:** selected macOS sandbox profile
- **Root-cause status:** CAUSAL_ESTABLISHED_CASE_SPECIFIC
- **Trigger:** Node empty-script baseline with low_level_alloc.cc:437 abort
- **Mechanism:** Specific profile denied hw.pagesize_compat sysctl; getconf PAGESIZE denied
- **Observed failure:** ABAB: baseline SIGABRT; exact intervention exit 0; withdrawal SIGABRT; reintroduction exit 0
- **Correction:** Exact hw.pagesize_compat read grant in approved diagnostic profile
- **Verification:** getconf 16384; two clean Node interventions; not a project-qualification run
- **Mandatory preflight rule:** Check required startup sysctl grants using pinned runtime/profile; only adopt exact, separately authorized grants for matching execution
- **Evidence:** AiFinder-C06-Pagesize-Causal-Diagnostic-V2-20260920T030918Z/CCR-REPORT.md §Findings
- **Uncertainty:** Internal allocator operands not inspected; do not generalize the grant.

### AF-003 — Node GetOSInformation startup / C06
- **Layer:** selected macOS sandbox profile
- **Root-cause status:** CAUSAL_ESTABLISHED_AND_C06_PASSED
- **Trigger:** Direct node:os import under the exact C06 V6 profile
- **Mechanism:** Five required selectors absent under baseline: hw.machine; kern.hostname; kern.osrelease; kern.ostype; kern.version
- **Observed failure:** GetOSInformation abort under baseline and each leave-one-out; restored with five-rule set
- **Correction:** Scoped five-rule profile under specific V6 authority, not global sandbox relaxation
- **Verification:** ABAB; five necessity tests; seven-case containment canary; C06 24/24 assertions PASS
- **Mandatory preflight rule:** For an approved identical Node launcher, compare exact runtime/profile requirements before launch; never copy five grants into arbitrary workloads
- **Evidence:** AiFinder-C06-V6-Direct-Node-20260920T145712238865Z/CCR-REPORT.md §Outcome/Actual observations
- **Uncertainty:** Only C06 qualified in this V6 phase; other 28 rows NOT_RUN.

### AF-004 — C07 helper/dependency closure
- **Layer:** static source contract / read admission
- **Root-cause status:** RESOLVED_FOR_LATER_C07_V5
- **Trigger:** V1 helper identity mismatch and V2 additional imported dependency
- **Mechanism:** Selected source reads/imports were outside reviewed input set
- **Observed failure:** C07 V1/V2 BLOCKED_NOT_RUN; later V5 C07 PASS
- **Correction:** Independently admit actual helper identity and full import/package/JSON closure; use current exact hashes
- **Verification:** V5 C07 launched once, exited 0; qualification proposed 2/29 subject to audit
- **Mandatory preflight rule:** Extract real imports and data reads before deriving an exact read profile or test launcher
- **Evidence:** AiFinder-C07-V1-Contract-Compilation-20260920T152959819966Z/CCR-REPORT.md; AiFinder-C07-V2-Contract-Completion-20260920T154352614509Z/CCR-REPORT.md; AiFinder-C07-V5-Execution-20260921T002942199931Z/CCR-REPORT.md
- **Uncertainty:** V5 success does not authorize replay or all future dependencies.

### AF-005 — C08 terminal-parser/producer mismatch
- **Layer:** test contract / assistant-authored script
- **Root-cause status:** ESTABLISHED_AND_VERIFIED_IN_FRESH_C08
- **Trigger:** Terminal parser expected numeric governance values
- **Mechanism:** Unchanged producer emits PRE_RUNTIME/POST_RUNTIME enums; tests and parser shared wrong synthetic assumption
- **Observed failure:** C08 original parser rejected successful child frame; qualification not accepted
- **Correction:** Parser recognizes exact producer enum grammar; tests exercise real producer and downstream consumers
- **Verification:** Focused 36/36; JS 184/184; Python 73/73; fresh C08 PASS
- **Mandatory preflight rule:** Derive output grammar from producer, not invented fixtures; RED/GREEN positive and negative test cases before one-shot
- **Evidence:** AiFinder-C08-Consolidated-Repair-Qualification-V2-20260923T232650597805Z/CCR-REPORT.md §RC01
- **Uncertainty:** Historical failed C08 evidence remains failed; new phase used fresh authority.

### AF-006 — C08 stdout capture loss
- **Layer:** test harness / evidence retention
- **Root-cause status:** ESTABLISHED_AND_VERIFIED_IN_FRESH_C08
- **Trigger:** First C08 parser failed after process output arrived
- **Mechanism:** Controller parsed memory before durable write, then cleared raw streams
- **Observed failure:** Previous 48,554-byte stdout unrecoverable after parser rejection
- **Correction:** Private capture, fsync, independent re-read/hash/byte identity before decoding/framing/parsing; preserve failure stage
- **Verification:** 11/11 helper and integration; fresh 48,554-byte output retained and parsed
- **Mandatory preflight rule:** Never clear process output before bounded durable independent capture; explicit privacy redaction and size ceilings
- **Evidence:** AiFinder-C08-Consolidated-Repair-Qualification-V2-20260923T232650597805Z/CCR-REPORT.md §RC02
- **Uncertainty:** Fresh bytes are not reconstructed historical lost bytes.

### AF-007 — C08 stale bindings / shape mismatch
- **Layer:** script preflight / identity validation
- **Root-cause status:** ESTABLISHED_AND_VERIFIED
- **Trigger:** Binding still pinned old parser bytes; checklist treated structured manifest digest as string
- **Mechanism:** Preflight compared wrong types/hashes after source change
- **Observed failure:** Static RED 4/6 and SURFACE_DIGEST rejection before native run
- **Correction:** Update exact affected current hashes; inspect nested sha256/algorithm/excluded-self fields; regenerate bindings in order
- **Verification:** JS 184/184, nine aggregates; checklist passed; later C08 PASS
- **Mandatory preflight rule:** On input/schema change, validate actual JSON types and rebind dependent pins before native authorization
- **Evidence:** AiFinder-C08-Consolidated-Repair-Qualification-V2-20260923T232650597805Z/CCR-REPORT.md §RC04/RC05
- **Uncertainty:** Errors in assistant/task-local scripts, not evidence of sandbox refusal.

### AF-008 — C18 Trace2 environment propagation
- **Layer:** process environment / tool chain
- **Root-cause status:** ESTABLISHED_CAUSE_OF_DIAGNOSTIC_BLOCK
- **Trigger:** Parent attempted Trace2 activation for Git descendants
- **Mechanism:** Direct/Node/bound Git launchers constructed replacement env maps, dropping parent variable
- **Observed failure:** Trace2 required at final exec was absent; C18 initial qualification blocked
- **Correction:** Specifically bind required approved setting at actual direct and bound Git environment boundaries
- **Verification:** Initial static eight checks; later diagnostic/foreground phases reached native Trace2 execution
- **Mandatory preflight rule:** Inspect final exec environment and intermediate replacement maps; parent-only env injection is insufficient
- **Evidence:** AiFinder-C18-Closure-20260926T205748Z/CCR-REPORT.md §What failed, why, and evidence; AiFinder-C18-Trace2-Continuation-20260926T221841414489Z/CCR-REPORT.md
- **Uncertainty:** Do not expand environment/trace scope outside expressly approved bounds.

### AF-009 — C18 detached Git maintenance children
- **Layer:** process lifecycle / bounded accounting
- **Root-cause status:** ESTABLISHED_AND_FRESHLY_VERIFIED
- **Trigger:** Git commit automatically spawned maintenance with --detach
- **Mechanism:** Detached workers escaped complete selected lifecycle accounting
- **Observed failure:** C18 initialization suite passed terminal but full <=768 image bound unknown; qualification blocked
- **Correction:** Exact approved maintenance.autoDetach=false at two existing Git boundaries
- **Verification:** Fresh suite with seven foreground --no-detach children; 356 process-image bound; capability2 and qualification PASS, pending independent seal/audit
- **Mandatory preflight rule:** Preflight implicit subprocesses and detached maintenance; require complete source-derived descendant bound before qualification
- **Evidence:** AiFinder-C18-Initialization-20260927T055504893620Z/CCR-REPORT.md; AiFinder-C18-Foreground-20260927T090607574957Z/CCR-REPORT.md
- **Uncertainty:** One earlier nonconforming capability launch remains material procedural failure.

### AF-010 — C18 mirrored path instead of admitted source
- **Layer:** sandbox file-read admission / script design
- **Root-cause status:** ESTABLISHED_AND_FRESHLY_VERIFIED
- **Trigger:** First C18 capability used diagnostic mirror paths
- **Mechanism:** 17 file-read literals pointed at mirrors instead of 17 original admitted source files
- **Observed failure:** MODULE_NOT_FOUND; exit 1 before source tests loaded; launch spent
- **Correction:** Replace 17 read literals and 4 metadata projections with exact admitted originals
- **Verification:** 6 negative mutants; 77 synthetic checks; successful fresh capability2 and qualification
- **Mandatory preflight rule:** Prove effective readable source paths, not just source hash or mocked sequence; no launch before independent read closure
- **Evidence:** AiFinder-C18-Foreground-20260927T090607574957Z/CCR-REPORT.md §Material failures
- **Uncertainty:** Do not treat the first spent and premature launch as compliant.

### AF-011 — C19 cross-process pressure freshness
- **Layer:** controller timing / script defect
- **Root-cause status:** ESTABLISHED_AND_VERIFIED_IN_FRESH_C19
- **Trigger:** Timestamp from Python process A was compared in process B
- **Mechanism:** Comparable monotonic origin not established for authorization decision
- **Observed failure:** Freshness gate BLOCKED without C19 start; later receipt shows rejected comparisons
- **Correction:** Use one continuous controller instance/PID with in-memory timestamps, recheck immediately before fork
- **Verification:** Two RED cases, 38 actual-function checks, nine lifecycle tests, fresh capability+qualification PASS
- **Mandatory preflight rule:** Bind all time comparisons to demonstrated same clock origin and instance; do not infer macOS clocks universally process-local
- **Evidence:** AiFinder-C19-Execution-20260927T153355926321Z/CCR-REPORT.md; AiFinder-C19-CommonClock-20260927T170502020579Z/CCR-REPORT.md §Root cause
- **Uncertainty:** Latest phase still conditional on separate seal and ChatGPT credit audit.

### AF-012 — C20 prerequisite sequence
- **Layer:** governance/controller ordering
- **Root-cause status:** ESTABLISHED_AND_VERIFIED_IN_FRESH_C20
- **Trigger:** Old controller could execute qualification without a fresh capability
- **Mechanism:** Conditional prerequisite was missing after terminal R6
- **Observed failure:** Actual-function RED proved qualification-only path
- **Correction:** Require new qualifying capability first and stop on failed/spent/incomplete gates
- **Verification:** Nine tests + 133 mandatory controls; C20 capability and qualification PASS
- **Mandatory preflight rule:** Enforce phase prerequisites and one-shot counters mechanically; a PASS on old capability cannot supply new authority
- **Evidence:** AiFinder-C20-Recovery-20260926T114211812197Z/CCR-REPORT.md §Findings
- **Uncertainty:** C20 credit is proposed pending exact independent audit/seal.

### AF-013 — C20 historical EPERM
- **Layer:** selected sandbox / unresolved historical site
- **Root-cause status:** CURRENT_FRESH_PASS; HISTORIC_SYSCALL_UNRESOLVED
- **Trigger:** R6 C20 qualification returned EPERM
- **Mechanism:** Exact denied syscall/path was masked, so not reconstructible from retained evidence
- **Observed failure:** R6 qualification FAIL; later fresh conforming capability+qualification PASS
- **Correction:** Approved exact profile/read prerequisites and new authority; do not claim one line is proven historic cause
- **Verification:** 133 controls; fresh native pair exit 0, but old EPERM not reproduced
- **Mandatory preflight rule:** Compare selected profile/source/dependencies to current contract; never label the old site solved by guessing
- **Evidence:** AiFinder-Qualification-Group-C5-R6-20260926T073826014873Z/CCR-REPORT.md; AiFinder-C20-Recovery-20260926T114211812197Z/CCR-REPORT.md §Findings
- **Uncertainty:** Do not equate later PASS with causal proof of old denial.

### AF-014 — C19 historical executable-access EPERM
- **Layer:** system executable access / selected sandbox
- **Root-cause status:** ESTABLISHED_DENIED_OPERATION; HOST_REASON_UNPROVEN
- **Trigger:** R6 C19 source tried access(/usr/bin/git,X_OK)
- **Mechanism:** Selected sandbox process returned EPERM for exact executable check
- **Observed failure:** C19 R6 qualification FAIL; later new phases progressed and C19 passed
- **Correction:** Only approved exact executable/profile control in later fresh phased repair
- **Verification:** R6 reproduced selected denial; later fresh C19 capability+qualification PASS
- **Mandatory preflight rule:** Before launcher build, verify exact required binary, X_OK admission and final effective profile, not inferred from path existence
- **Evidence:** AiFinder-Qualification-Group-C5-R6-20260926T073826014873Z/CCR-REPORT.md §Outcome; AiFinder-C19-CommonClock-20260927T170502020579Z/CCR-REPORT.md
- **Uncertainty:** Denial reason within host/macOS remains unproved and should not be globalized.

### AF-015 — Missing pinned xcrun path
- **Layer:** filesystem executable identity
- **Root-cause status:** ESTABLISHED_MISSING_PATH
- **Trigger:** R1 required /Library/Developer/CommandLineTools/usr/bin/xcrun
- **Mechanism:** Required absolute executable path was absent (ENOENT)
- **Observed failure:** R1 STOP before C18/C19/C20 starts
- **Correction:** Correct plan and separately authorized exact runtime identity; no unapproved substitute path
- **Verification:** lstat and descriptor observation both ENOENT; no replacement run
- **Mandatory preflight rule:** Check actual pinned executable identities/locations before creating command; do not hardcode absent CLT xcrun path
- **Evidence:** AiFinder-Qualification-Group-C5-R1-20260925T131449685403Z/CCR-REPORT.md §Outcome
- **Uncertainty:** The absence does not prove cause of host installation state.

### AF-016 — Executable hardlink count / atime reader assumptions
- **Layer:** assistant-generated file identity checker
- **Root-cause status:** ESTABLISHED_NLINK_DEFECT; HISTORIC_ATIME_DIFFERENCE_UNRECORDED
- **Trigger:** Generic source checker used nlink==1 for pinned Apple dispatcher; metadata equality included atime
- **Mechanism:** Runtime executable legitimately had multiple links; atime can change from reads
- **Observed failure:** False admission errors before work; reviewer later had unspecified stat difference
- **Correction:** Use exact pinned link count for named runtime only; compare stated stable fields, not incidental atime; normalize mode/nlink representation
- **Verification:** C20 current admission/metadata conversion tests and fresh workload PASS
- **Mandatory preflight rule:** Separate source-file policy from system executable identity; never silently weaken checks for arbitrary files
- **Evidence:** AiFinder-Qualification-Group-C5-R1-20260925T131449685403Z/CCR-REPORT.md §Failures; AiFinder-C20-Recovery-20260926T114211812197Z/CCR-REPORT.md §Findings
- **Uncertainty:** The first lost stat-field delta cannot be proven to be atime.

### AF-017 — R2 unsafe launcher contract
- **Layer:** execution transport / script authoring
- **Root-cause status:** ESTABLISHED_CONTRACT_VIOLATION
- **Trigger:** C5 R2 reader launched with /bin/zsh + tty + missing isolation/prelaunch receipts
- **Mechanism:** Actual invocation failed mandatory approved launcher contract
- **Observed failure:** R2 FAILED before native/runtime workload; not evidence Python/Git cannot run
- **Correction:** Generate launcher strictly from approved complete contract and preflight receipt
- **Verification:** Report preserved failed invocation; no native workload started
- **Mandatory preflight rule:** Before execution, statically verify shell/TTY/isolation flags, binary identity, independent prelaunch and output limits
- **Evidence:** AiFinder-Qualification-Group-C5-R2-20260925T143130973691Z/CCR-REPORT.md §Result
- **Uncertainty:** No authority to reroute or weaken launcher requirements.

### AF-018 — MCP envelope classifier
- **Layer:** tool protocol / synthetic parser
- **Root-cause status:** ESTABLISHED_AND_LOCALLY_CORRECTED
- **Trigger:** Three synthetic protocol envelope forms received
- **Mechanism:** CF1 unwrapping collapsed three classes to one
- **Observed failure:** Expected three diagnostics, observed one
- **Correction:** Recursive transport-layer classification with guarded accessors
- **Verification:** 33 synthetic checks passed
- **Mandatory preflight rule:** Discriminate response shapes at each envelope layer before treating tool result as failure/root cause
- **Evidence:** AiFinder-CF2-Response-Handling-Review-20260905T222800Z/CCR-REPORT.md:50-62
- **Uncertainty:** Provider compatibility outside synthetic tests unverified.

### AF-019 — 90-second aggregate timeout
- **Layer:** resource/time budget
- **Root-cause status:** ESTABLISHED_TRANSIENT_IN_SAMPLE
- **Trigger:** Aggregate phase-compiler-security child
- **Mechanism:** Aggregate budget expired although isolated work later completed
- **Observed failure:** Aggregate timed out; isolated run took 83,722 ms
- **Correction:** Measured fit-for-purpose budget and distinguish aggregate vs component
- **Verification:** Later isolated completion and aggregate PASS
- **Mandatory preflight rule:** Use measured wall-time upper bound and explicit capture; timeouts are not sandbox denials by default
- **Evidence:** AiFinder-Activation-Bridge-Compatibility-Closure-20260816-120323/AiFinder-Activation-Bridge-Compatibility-Closure-PASSED-CCR.md:237
- **Uncertainty:** One instance cannot establish global timeout setting.

### AF-020 — Authorization gate
- **Layer:** human governance not technical sandbox
- **Root-cause status:** ESTABLISHED_POLICY_BLOCK
- **Trigger:** Requested build/check outside phase authority
- **Mechanism:** Approval missing or action explicitly excluded
- **Observed failure:** NOT_RUN without observing workload
- **Correction:** Prepare exact bounded package and request James approval before protected work
- **Verification:** Historical report declares NOT_RUN
- **Mandatory preflight rule:** No substitute execution route when one-shot or protected authority denies action
- **Evidence:** AiFinder-Activation-Bridge-20260816-092931/AiFinder-Activation-Bridge-BLOCKED-CCR.md:222-223
- **Uncertainty:** Never count an authority block as a technical failure.

### AF-021 — Provider create BAD_REQUEST
- **Layer:** external/provider request schema
- **Root-cause status:** UNVERIFIED_ROOT_CAUSE
- **Trigger:** Provider create returned 4XX BAD_REQUEST
- **Mechanism:** Specific invalid field/request predicate not present in admitted evidence
- **Observed failure:** Rejected create with zero claimed validated result
- **Correction:** New separately authorized, nondisclosing request-contract diagnosis if ever needed
- **Verification:** No correction demonstrated
- **Mandatory preflight rule:** Validate approved request schema offline before consuming one-shot provider call; no live retry without authority
- **Evidence:** AiFinder-Admin-V1-Official-First-Environment-Gate-C-True-Create-Only-Runtime-Proven-No-Effect-Failure-CCR-20260830T164205Z/CCR-REPORT.md:172
- **Uncertainty:** No network/provider access in this review.

### AF-022 — Device-schema blocked category
- **Layer:** source/response structural contract
- **Root-cause status:** UNVERIFIED_ROOT_CAUSE
- **Trigger:** Diagnostic report omitted field/predicate discriminator
- **Mechanism:** Cannot localize which schema element failed
- **Observed failure:** Blocked category only
- **Correction:** Prospective nondisclosing structural discriminator; not executed
- **Verification:** None
- **Mandatory preflight rule:** Require field-level safely redacted structural classification before asserting causality
- **Evidence:** AiFinder-Admin-V1-V186-Device-Schema-Blocked-CCR-20260905T203628Z/CCR-REPORT.md:27
- **Uncertainty:** Not evidence of expired credentials, server drift, or a specific invalid field.

### AF-023 — Manifest candidate-test stopped
- **Layer:** test/fixture mismatch candidate
- **Root-cause status:** UNVERIFIED_ROOT_CAUSE
- **Trigger:** First candidate manifest test failed
- **Mechanism:** Available anchor lacks discriminating test-vs-candidate proof
- **Observed failure:** Matrix stopped, following steps NOT_RUN
- **Correction:** Candidate/manifest alignment preflight proposed
- **Verification:** No verified correction in anchor
- **Mandatory preflight rule:** Verify expected identities and producer contract before one-shot test matrix; retain RED/failure details
- **Evidence:** AiFinder-Admin-V1-Two-Zero-Disposition-Contract-Corrected-Reseal-CCR-20260830T082043Z/CCR-REPORT.md:17
- **Uncertainty:** Do not classify it automatically as a sandbox issue.

### AF-024 — JSON Lines report parse
- **Layer:** assistant report-construction defect
- **Root-cause status:** ESTABLISHED_AND_CORRECTED_WITHOUT_NATIVE_RETRY
- **Trigger:** C18 writer parsed events.json JSONL as one JSON document
- **Mechanism:** Multiple line-delimited JSON objects not a single JSON value
- **Observed failure:** JSONDecodeError Extra data, before final artifact creation
- **Correction:** Parse and validate individual JSONL records without changing captured bytes
- **Verification:** Writer completed after correction; native workloads not rerun
- **Mandatory preflight rule:** Inspect file format rather than guessing from .json-like naming; syntax/shape check writer before final seal
- **Evidence:** AiFinder-C18-Foreground-20260927T090607574957Z/CCR-REPORT.md §Material failures
- **Uncertainty:** Correction confined to report writer.

### AF-025 — Oversized preview/report output
- **Layer:** assistant tool output guard
- **Root-cause status:** ESTABLISHED_TOOLING_FAILURE
- **Trigger:** C20 review reprinted 13,228-byte handoff after bounded intake
- **Mechanism:** Missing downstream output guard allowed item larger than 4,096-byte limit
- **Observed failure:** C20 platform review RESULT=FAILED despite other conclusions
- **Correction:** Bound both per-record and response aggregation; emit narrow pages
- **Verification:** Subsequent narrower reads permitted; previous failure retained
- **Mandatory preflight rule:** Preflight max output size, byte encoding and redaction; never use unguarded full source previews
- **Evidence:** AiFinder-C20-Platform-Review-Only-20260926T090246Z/CCR-REPORT.md §Review deviations
- **Uncertainty:** Later repair does not retroactively change FAILED phase.

## Independent audit disposition and limits

**Disposition: `ACCEPTED_AS_WORKING_BASELINE_WITH_OPEN_AUDIT_ISSUES`, not exhaustive certification.** Independently inspected the existing R2 CCR, narrative, structured findings, manifest and source parser, plus later case reports for C06, C07, C08, C18, C19, C20 and C5 R1/R2/R6. Did not repeat historical tests or run a Codex workload; did not read project credentials, environment, database, live providers or the AiFinder repository; did not mutate Git, change security settings or claim present Codex capacity. Existing R2 report artifacts and the original CCRs were not edited.

**Two unresolved inventory issues:** (1) `relevant_session_files` 426 versus R2 narrative "none" needs a targeted source/readback reconciliation; (2) 2,227 skipped oversize lines and excluded standalone Codex app-specific storage mean the scan is not a claim to have read *every* historical message or covered all possible failures. Also, selected evidence has conditional independent seal and ChatGPT audit statuses; those credits are **not silently upgraded here**.

**What can be reused now:** the mechanism-indexed caution rules, the exact case-specific verified corrections, and the preflight gate below. This artifact is a first operational draft. It is not authorization to run a previously denied command, broaden sandbox grants, start a spent qualification, or touch production.

## Mandatory Codex script / handoff preflight

**01 Authority/scope.** Bind one phase, exact owner approval, immutable baseline, admitted reads/writes, forbidden paths, attempts and expiry. Stop before protected access, Git staging/commit/push, DB/network/deployment without specific James approval.

**02 Effective sandbox layers.** Separate Codex selected mode, per-run sandbox-exec profile, macOS/TCC/SIP/system permissions, Desktop Commander access, provider/host policy, and AiFinder owner authority. Do not infer effective rights from Codex default danger-full-access.

**03 Known-failure lookup.** Match planned operations against registry by trigger + mechanism + exact profile; prioritize AF-001/002/003/010/014/015/017. Mark unknowns UNKNOWN, not allowed.

**04 Full source closure.** Discover actual imports, input files, native child executable paths, environment replacement maps, types, expected sizes/hashes, session/cwd dependencies. Confirm only explicitly admitted data; no credential reads.

**05 File and executable identity.** Check exact pinned path exists and executable/readable under actual launcher where authorized; keep source-file link rules separate from pinned system runtimes; compare stable metadata and full hashes.

**06 Producer–consumer contracts.** Derive exact output grammar and manifest/schema shape from current producer; use bounded synthetic RED/GREEN including malformed and negative cases; verify expected enum vs numeric types.

**07 Process/OS bounds.** Include transitive Git/Node/Python/process children and implicit maintenance, exact argv/env/cwd/FD, sysctl access, resource budget, no-detach bound, pressure and monotonic single-instance freshness.

**08 Capture and privacy.** Set stdout/stderr/aggregate caps, independently persist/verify output before parse/clear, redact secrets/PII, preserve failure-stage and ownership/EOF/reaping receipts.

**09 Dry gates without spent launch.** Run only tests that the phase authorizes; in inspection-only phases do not run tests. Validate parser syntax, imported dependencies, checksums, serialized profiles, negative mutation checks before one-shot work.

**10 Decision checkpoint.** PASS only on verified gates. BLOCKED/UNKNOWN -> no workload or substitute path; provide smallest bounded diagnosis and obtain new approval if needed. Do not reuse spent calls.

**11 Execution within authority.** Codex can diagnose/test/fix/retest in scope; preserve historical failed attempts, no bypass of platform refusals. Keep all protected operations excluded unless expressly authorized.

**12 Final CCR and registry update.** Report trigger -> mechanism -> failure -> correction -> verified result or blocked boundary, exact source, hashes/bytes, attempts, Git/project effects, scope, remaining uncertainty; audit before accepting a new permanent rule.

## Proposed next bounded diagnostic (not executed)

First reconcile R2 session-match reporting by comparing `analysis.json`, `CODEX_FINDINGS.json` and narrative under the existing admitted, redacted source scope. Then expand root-cause cards case by case from current CCRs without replaying blocked workloads. A true environment inventory (current Codex invocation, macOS privacy permissions, effective per-process sandbox and Desktop Commander config) requires its *own* explicit read-only scope; this registry does not claim to certify every macOS permission.

**Change control:** The v1 entries stay documentary. Treat them as a mandatory review reference prospectively; binding them into running Codex tooling, editing AiFinder files, staging/committing/pushing, changing permissions or using DB/network/deployment needs separate authority. No code/script in this package performs those actions.


## v2 reconciliation receipt (2026-10-09)

- Evidence compared: archived `CODEX_FORENSIC_REPORT.md` (narrative zero claim), `CODEX_FINDINGS.json` (`coverage.relevant_session_files=426`), and `forensic_parser.py` (actual `relevant` update and per-file counter).
- Disposition: `R2_NARRATIVE_SESSION_ZERO=REJECTED_AS_REPORTING_DEFECT`; `R2_STRUCTURED_MARKER_MATCHING_FILES=426`; `ROOT_CAUSE_CENSUS=NOT_ESTABLISHED`.
- No historical R2 artifacts were modified, no session files or credentials were reread, and no CodeX/qualification workload was executed.
- Remaining audit limit: 2,227 oversized lines skipped and constrained source-field parsing mean absence of a marker cannot establish absence of an incident; matching a marker cannot establish one either.
- Next productive use: integrate v2 rules into future **authorized** Codex handoffs as a read-only preflight; do not spend execution authority to relitigate closed C06/C08/C18/C19/C20 cases without a genuinely new source/host difference.