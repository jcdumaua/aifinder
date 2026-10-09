# AiFinder — HANDOFF.md

**Permanent cross-chat starting point (root causes summarized; full CCRs stay at source).** Read this file before any new AiFinder/Codex work. Historical evidence and approvals remain authoritative in their original records. This document does **not** grant execution, modification, deployment, database, network, or merge authority.

## Active state (snapshot 2026-10-09)

- Workflow: owner-approved **Workflow V3**, prospective only; active phases require their own amendment to adopt new rules.
- Failure-prevention integration: **draft PR #5**, branch `docs/failure-prevention-v1`, **not merged or activated on main**.
- Registry v2 synchronized in this PR under `docs/governance/failure-prevention/`; matching copies in ChatGPT Library `/AiFinder/Failure-Prevention/`.
- Offline checker: `scripts/failure-prevention/preflight.mjs`. Initial isolated tests **11/11 PASS**; independent source review found four gaps, **hardening not yet verified**: self-reported evidence, optional failure matching, descriptive rather than actual command inspection, and blanket REPAIR on known IDs. Treat checker as **advisory only**.
- **Existing engineering track to resume (separate from PR #5):** G1-R1 offline per-source attribution correction. Reported **116/116 synthetic tests GREEN**; this does not establish runtime equivalence or independent expected outputs. Qualification ledger **25/29**; H1 host authorization and remaining native qualification are blocked. First verify whether the short independent re-review of the corrected comparator/tests/seal has already been completed (do not duplicate it). Then use the controlling E1/G1 offline host-readiness/independent-expected-output preparation handoff for the next authorized work, with no Docker, Node/native qualification, protected host/provider changes, or spent-attempt replay absent applicable approval.
- **PR #5 side track:** The registry and root-cause handoff are documentary working references. The automated checker has four open independent-review findings (self-reported evidence, optional failure matching, descriptive command inspection, blanket REPAIR) and remains **advisory only**; further hardening is deferred to a separate explicitly authorized task. Do not let that side track block resuming the existing G1/E1 engineering phase.
- AiFinder application/public-launch/DB operations are **not** authorized by this handoff. Existing qualification ledgers and spent attempts must remain unchanged.

## Working rules

1. **ChatGPT** controls task scope, packages, reviews and CCR acceptance; **Codex** implements and diagnoses within the task's explicit authority; **owner** alone grants consequential approvals. Never use old approvals as reusable authority.
2. Before Codex handoff, review this document, the detailed failure registry and the relevant permissions/launcher/source closure. Prefer deterministic offline preflight over spending native launches.
3. On failure, seek most specific evidence-supported **root cause** and check for existing failure IDs before creating a new one. Shared cause = amend existing entry; distinct cause = new ID.
4. **Update this handoff after meaningful new verified findings**, including unresolved root-cause uncertainty. Only include **root cause, verified fix or proposed remedy, prevention**, and evidence pointer; **no full CCR**. Keep raw CCRs untouched. Avoid duplicate IDs for the same evidence-supported mechanism; an error string alone is not a causal match.
5. A failed or blocked phase does not become PASSED through documentation. Checker PASS is not permission to execute; no DB operations, migrations, production access, deploy/publish, environment or sandbox expansion, qualification starts, or merge without separate applicable authority.
6. For relevant Codex tasks, discover and actually invoke applicable installed skills within current authority (systematic debugging, TDD, verification, review); a skill PASS cannot override project safety gates.

## Root-cause reference (compact)

These **25 entries are a selected evidence-grounded baseline, not an exhaustive census** of every historical error or unique cause. Each registry ID below maps to the **original CCR evidence**, trigger, status, and prevention rule in [failure-registry.json](docs/governance/failure-prevention/failure-registry.json). Status is about the historical finding, **not** general permission to apply the remedy.

| ID | Root-cause status | Established mechanism / current uncertainty | Correction or next treatment |
|---|---|---|---|
| AF-001 | Partially established | Write denied before any derived output changed | No historical repair evidenced |
| AF-002 | Established | Specific profile denied hw.pagesize_compat sysctl; getconf PAGESIZE denied | Exact hw.pagesize_compat read grant in approved diagnostic profile |
| AF-003 | Established | Five required selectors absent under baseline: hw.machine; kern.hostname; kern.osrelease; kern.ostype; kern.version | Scoped five-rule profile under specific V6 authority, not global sandbox relaxation |
| AF-004 | Established | Selected source reads/imports were outside reviewed input set | Independently admit actual helper identity and full import/package/JSON closure; use current exact hashes |
| AF-005 | Established | Unchanged producer emits PRE_RUNTIME/POST_RUNTIME enums; tests and parser shared wrong synthetic assumption | Parser recognizes exact producer enum grammar; tests exercise real producer and downstream consumers |
| AF-006 | Established | Controller parsed memory before durable write, then cleared raw streams | Private capture, fsync, independent re-read/hash/byte identity before decoding/framing/parsing; preserve failure stage |
| AF-007 | Established | Preflight compared wrong types/hashes after source change | Update exact affected current hashes; inspect nested sha256/algorithm/excluded-self fields; regenerate bindings in order |
| AF-008 | Established | Direct/Node/bound Git launchers constructed replacement env maps, dropping parent variable | Specifically bind required approved setting at actual direct and bound Git environment boundaries |
| AF-009 | Established | Detached workers escaped complete selected lifecycle accounting | Exact approved maintenance.autoDetach=false at two existing Git boundaries |
| AF-010 | Established | 17 file-read literals pointed at mirrors instead of 17 original admitted source files | Replace 17 read literals and 4 metadata projections with exact admitted originals |
| AF-011 | Established | Comparable monotonic origin not established for authorization decision | Use one continuous controller instance/PID with in-memory timestamps, recheck immediately before fork |
| AF-012 | Established | Conditional prerequisite was missing after terminal R6 | Require new qualifying capability first and stop on failed/spent/incomplete gates |
| AF-013 | Partially established | Exact denied syscall/path was masked, so not reconstructible from retained evidence | Approved exact profile/read prerequisites and new authority; do not claim one line is proven historic cause |
| AF-014 | Partially established | Selected sandbox process returned EPERM for exact executable check | Only approved exact executable/profile control in later fresh phased repair |
| AF-015 | Established | Required absolute executable path was absent (ENOENT) | Correct plan and separately authorized exact runtime identity; no unapproved substitute path |
| AF-016 | Established | Runtime executable legitimately had multiple links; atime can change from reads | Use exact pinned link count for named runtime only; compare stated stable fields, not incidental atime; normalize mode/nlink representation |
| AF-017 | Established | Actual invocation failed mandatory approved launcher contract | Generate launcher strictly from approved complete contract and preflight receipt |
| AF-018 | Established | CF1 unwrapping collapsed three classes to one | Recursive transport-layer classification with guarded accessors |
| AF-019 | Established | Aggregate budget expired although isolated work later completed | Measured fit-for-purpose budget and distinguish aggregate vs component |
| AF-020 | Established | Approval missing or action explicitly excluded | Prepare exact bounded package and request James approval before protected work |
| AF-021 | Unconfirmed | Specific invalid field/request predicate not present in admitted evidence | New separately authorized, nondisclosing request-contract diagnosis if ever needed |
| AF-022 | Unconfirmed | Cannot localize which schema element failed | Prospective nondisclosing structural discriminator; not executed |
| AF-023 | Unconfirmed | Available anchor lacks discriminating test-vs-candidate proof | Candidate/manifest alignment preflight proposed |
| AF-024 | Established | Multiple line-delimited JSON objects not a single JSON value | Parse and validate individual JSONL records without changing captured bytes |
| AF-025 | Established | Missing downstream output guard allowed item larger than 4,096-byte limit | Bound both per-record and response aggregation; emit narrow pages |

**Interpretation:** `UNVERIFIED` cases are hypotheses or nondiscriminating failures, **not confirmed causal prevention rules**. In cases of inconsistent status or generalization uncertainty, inspect the source registry and original CCR and retain the narrower justified finding.

## Failure entry template (append only for a genuinely distinct root cause)

```md
### AF-NNN — concise category
Root cause: [specific demonstrated cause or UNCONFIRMED + missing evidence]
Verified correction: [what passed, or NOT VERIFIED]
Prevention: [minimal future check; no unsupported generalization]
Status: [RESOLVED | UNRESOLVED | PARTIALLY ESTABLISHED | SUPERSEDED]
Evidence: [original CCR location / commit / tests]
```

Keep new findings short; update the table and detailed registry together after review. Don't paste full CCRs.

## Update checkpoint

On any completed engineering phase, first verify the current branch, governing handoff, last accepted CCR, actual approvals, and whether a purported next review has already been finished. Update the short active-state lines and *only new or changed root-cause entries*. Do not automatically expand into a historical census. A new chat must not assume this snapshot is current without checking live repository/evidence.

## Starting a fresh chat

Say: **"Continue AiFinder: read `HANDOFF.md` from GitHub `jcdumaua/aifinder` (check draft PR #5 until merged) and verify its referenced registry before proceeding."**

If the file or active branch is unavailable, **say so** and request the latest approved handoff; do not assume chat memory equals a verified repository read.
