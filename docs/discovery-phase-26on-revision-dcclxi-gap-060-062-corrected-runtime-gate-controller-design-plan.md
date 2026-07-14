# AiFinder Phase 26ON — GAP-060–062 Corrected Runtime-Gate Controller Design Plan

## Baseline lock

- Repository baseline: `d513d310830f95ac862205795c6883c7afb75dda`
- Candidate SHA-256: `188912db8e2c566eddcd31ab7c9dc6012955447edc37077a1603599657bfc09b`
- Wrapper SHA-256: `412f1945ba77d54e7b23533c0c139c681ba4e5026a15a25f41a072af2f807d89`
- Candidate mode: `100644 NON-EXECUTABLE`
- Wrapper mode: `100644 NON-EXECUTABLE`

## Purpose

Design a corrected external runtime-gate controller that guarantees body-free result finalization after one authorized attempt, including fail-closed outcomes and nonzero wrapper exit statuses.

This phase does not implement the controller and does not modify the candidate or wrapper.

## Confirmed incident boundary

The Phase 26OG authorization was consumed, but the gate exited before producing its normal review package.

The committed evidence does not establish a sufficient runtime outcome. Therefore:

- no retry is allowed under the consumed authorization;
- GAP-060–062 remain operationally uncleared;
- no new authorization request is permitted;
- the controller must be corrected and independently reviewed first.

## Controller invariants

A corrected controller must preserve all of the following:

1. Exactly one wrapper invocation after a fresh explicit authorization.
2. Authorization consumption before environment-presence inspection.
3. Zero retries, fallbacks, alternate selectors, or replay.
4. Body-free raw-output handling.
5. No token, selector, environment value, header, cookie, credential, or response-body output.
6. Candidate and wrapper source identities remain unchanged.
7. Operational reactivation remains separately blocked.

## Control-flow architecture

### Stage A — Pre-consumption validation

Fail before authorization consumption when any of these checks fail:

- repository path, origin, branch, and synchronized baseline;
- clean working tree and empty staging area;
- candidate and wrapper SHA-256 identities;
- `100644` non-executable modes;
- `bash -n` syntax checks;
- exact fresh human authorization binding;
- result artifact path absence.

### Stage B — Irreversible authorization consumption

Create the authorization lock and secure consumption record before any environment-presence check.

Any failure after this point must still enter artifact finalization with:

- authorization consumed: `YES`;
- retry permitted: `NO`;
- live authorization remaining: `0`.

### Stage C — Presence-only preflight

Check only presence or absence of:

- `AIFINDER_VERCEL_READ_ONLY_TOKEN`;
- `AIFINDER_VERCEL_PROJECT_SELECTOR`;
- `AIFINDER_VERCEL_TEAM_SELECTOR`.

Never expand or print values.

A preflight failure must produce a result artifact without invoking the wrapper.

### Stage D — Single wrapper invocation

Use a narrow status-capture block:

```bash
set +e
bash "$wrapper" "$marker" >"$raw" 2>&1
wrapper_rc=$?
set -e
```

Immediately after status capture, enter a non-aborting finalization region.

### Stage E — Non-aborting classification

The controller must not rely on unguarded commands whose ordinary no-match status is nonzero.

Every `grep`, `comm`, `find`, counter, and filtering pipeline must use one of:

- explicit `if` control flow;
- `|| true` where no-match is expected and safe;
- Python classification that returns success while recording a symbolic disposition;
- local `set +e` around the entire classification region with explicit status handling.

No classification branch may bypass artifact finalization.

### Stage F — Guaranteed finalization

A single finalization function must always:

1. create the body-free result artifact;
2. verify the artifact exists and is nonempty;
3. calculate its SHA-256;
4. print the body-free review package;
5. copy the review package to the clipboard;
6. remove private raw capture only after artifact verification;
7. stop before staging, commit, or push.

The finalization function must run for:

- preflight failure after authorization consumption;
- wrapper exit `0`;
- wrapper exit nonzero;
- zero allowlisted lines;
- sanitizer failure;
- no consumption-log delta;
- malformed consumption log;
- unexpected but safely classified conditions.

## Explicitly prohibited constructs

The corrected controller must not:

- use global `set -e` as the sole post-invocation error policy;
- leave unguarded `grep`, `comm`, or command-substitution pipelines in finalization;
- infer wrapper invocation solely from the existence of a raw file;
- infer network success solely from exit status;
- display raw output on failure;
- delete raw capture before the result artifact is verified;
- invoke the wrapper from a cleanup trap;
- request or embed a new authorization marker during static implementation.

## Required static synthetic matrix

The implementation must pass at least these cases without network or source execution:

1. pre-consumption baseline mismatch;
2. authorization already consumed;
3. missing token presence;
4. missing project-selector presence;
5. forbidden team-selector presence;
6. wrapper exit `0`, valid provenance;
7. wrapper exit nonzero, valid provenance;
8. invocation provenance only;
9. status provenance only;
10. no allowlisted output;
11. mixed allowlisted and rejected output;
12. no new consumption log;
13. one valid `0600` consumption log;
14. malformed consumption log;
15. multiple consumption logs;
16. `grep` no-match path;
17. `comm` empty-delta path;
18. sanitizer internal failure;
19. artifact-write failure simulation;
20. review-package copy failure after artifact creation.

Every post-consumption case must prove:

- the artifact finalization path was attempted;
- no second wrapper invocation occurred;
- retries remained `0`;
- authorization remaining remained `0`.

## Implementation boundary

The corrected controller should be an external, reviewable gate script. It must not be committed to the repository as production/runtime source unless a later phase explicitly authorizes that scope.

The first implementation phase must:

- create the external gate only;
- run static and synthetic checks only;
- create one evidence artifact;
- stop before staging, commit, push, environment inspection, or runtime execution.

## Readiness disposition

`READY_FOR_CORRECTED_GATE_STATIC_IMPLEMENTATION_AFTER_INDEPENDENT_REVIEW`

## Current authorization state

- New runtime authorization requested: `NO`
- New runtime authorization granted: `NO`
- Live authorization remaining: `0`
- Candidate or wrapper invocation authorized: `NO`
- Operational reactivation: `BLOCKED`

## Gemini review request

Verify the controller invariants, staged control-flow architecture, guaranteed finalization design, guarded no-match handling, 20-case static synthetic matrix, unchanged source boundary, and prohibition on requesting new runtime authorization before implementation review.
