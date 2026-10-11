# AiFinder — Mandatory Codex Handoff Preflight v2

**Usage:** Read-only checklist. No executable or blanket permission grant. Use alongside the evidence-grounded v2 master registry and the controlling James approval.

- [ ] **01 Authority/scope** — Bind one phase, exact owner approval, immutable baseline, admitted reads/writes, forbidden paths, attempts and expiry. Stop before protected access, Git staging/commit/push, DB/network/deployment without specific James approval.
- [ ] **02 Effective sandbox layers** — Separate Codex selected mode, per-run sandbox-exec profile, macOS/TCC/SIP/system permissions, Desktop Commander access, provider/host policy, and AiFinder owner authority. Do not infer effective rights from Codex default danger-full-access.
- [ ] **03 Known-failure lookup** — Match planned operations against registry by trigger + mechanism + exact profile; prioritize AF-001/002/003/010/014/015/017. Mark unknowns UNKNOWN, not allowed.
- [ ] **04 Full source closure** — Discover actual imports, input files, native child executable paths, environment replacement maps, types, expected sizes/hashes, session/cwd dependencies. Confirm only explicitly admitted data; no credential reads.
- [ ] **05 File and executable identity** — Check exact pinned path exists and executable/readable under actual launcher where authorized; keep source-file link rules separate from pinned system runtimes; compare stable metadata and full hashes.
- [ ] **06 Producer–consumer contracts** — Derive exact output grammar and manifest/schema shape from current producer; use bounded synthetic RED/GREEN including malformed and negative cases; verify expected enum vs numeric types.
- [ ] **07 Process/OS bounds** — Include transitive Git/Node/Python/process children and implicit maintenance, exact argv/env/cwd/FD, sysctl access, resource budget, no-detach bound, pressure and monotonic single-instance freshness.
- [ ] **08 Capture and privacy** — Set stdout/stderr/aggregate caps, independently persist/verify output before parse/clear, redact secrets/PII, preserve failure-stage and ownership/EOF/reaping receipts.
- [ ] **09 Dry gates without spent launch** — Run only tests that the phase authorizes; in inspection-only phases do not run tests. Validate parser syntax, imported dependencies, checksums, serialized profiles, negative mutation checks before one-shot work.
- [ ] **10 Decision checkpoint** — PASS only on verified gates. BLOCKED/UNKNOWN -> no workload or substitute path; provide smallest bounded diagnosis and obtain new approval if needed. Do not reuse spent calls.
- [ ] **11 Execution within authority** — Codex can diagnose/test/fix/retest in scope; preserve historical failed attempts, no bypass of platform refusals. Keep all protected operations excluded unless expressly authorized.
- [ ] **12 Final CCR and registry update** — Report trigger -> mechanism -> failure -> correction -> verified result or blocked boundary, exact source, hashes/bytes, attempts, Git/project effects, scope, remaining uncertainty; audit before accepting a new permanent rule.

**Fail-closed decision:** PASS only for demonstrably authorized, current, exact-scope checks; BLOCKED/UNKNOWN means no workload launch and no workaround. Record root cause when established; otherwise causal evidence, hypotheses ruled out, boundary and smallest safe diagnostic.

**Execution effect:** This document has no side effects; stages/commits/pushes **none**.

## R2-specific reporting regression gate (new in v2)

Before publishing any historical-count conclusion, bind **each metric to the exact producer definition**: `relevant_session_files=426` means files with at least one technical-category regex match in allowed machine fields; it is not an incident count. Compare source-code counter semantics, JSON totals, and report narrative; fail the **reporting** gate if they disagree. Do not rerun an expensive source scan merely to correct an established narrative transcription. The original R2 narrative zero count is rejected. Preserve original files and errors.