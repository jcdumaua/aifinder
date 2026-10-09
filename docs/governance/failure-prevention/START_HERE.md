# AiFinder failure prevention — repository bootstrap

Status: prospective Workflow V3 integration candidate. No historical authority is altered.

## Source and discovery

The current validated historical registry is **v2**, preserved in ChatGPT Library under `/AiFinder/Failure-Prevention/`:
- `AiFinder_Master_Failure_Restriction_Registry_v2.md`
- `AiFinder_Master_Failure_Restriction_Registry_v2.json`
- `AiFinder_Codex_Preflight_Gate_v2.md`
- `START_HERE.md`

The v2 registry and checklist are now mirrored in this draft branch as `failure-registry.json`, `failure-registry.md`, and `preflight-rules.md`. The offline checker is `scripts/failure-prevention/preflight.mjs` with Node tests at `scripts/failure-prevention/preflight.test.mjs`. The cross-chat Library remains a backup. The draft PR and its checker are not merged or activated for main-branch executions. A PASS is not approval to execute.

## Before every Codex handoff

1. Load the latest registry and checklist from the Library or a verified repository copy. Confirm version and applicability. Missing resources mean `REGISTRY_UNAVAILABLE`.
2. Compare proposed argv/env/cwd, command transport, executable identity, imported-file closure, profile grants, macOS/Codex permissions, stdout/stderr contract, timeouts, resource bounds, privacy and protected-operation authority against established incidents.
3. Distinguish verified causal corrections from unresolved symptoms. Same `EPERM` or `SIGABRT` wording alone does not prove the same root cause.
4. Issue one preflight disposition: `PASS`, `REPAIR`, or `BLOCKED`; explain evidence and uncertainty. PASS never grants owner or platform authority.
5. Codex may diagnose/fix/retest ordinary in-scope errors. Do not rerun spent native or qualification attempts, broaden sandbox permissions, read credentials, change DB, deploy or publish without separate applicable approval.
6. At meaningful phase closure, add only evidence-verified new root causes, minimal correction, negative regression, verification, supersession and exact CCR references. Preserve original CCRs unchanged.

## Safety

Prefer offline static checks and source-derived limits before native launches. No invented exhaustive list of macOS/Codex permissions. This document is documentation only; no production or qualification permission is supplied.

## Fresh chat

Ask ChatGPT: "Continue AiFinder. Read the latest `/AiFinder/Failure-Prevention/START_HERE.md` from my ChatGPT Library; verify the registry version and apply its preflight before new Codex work." If the Library is unavailable, say so rather than claiming it loaded.
