# AiFinder Phase 26OL — GAP-060–062 Future Runtime Gate-Control Correction Plan

## Purpose

Correct the orchestration layer that failed to produce the normal Phase 26OG review package, without changing the candidate or wrapper source files.

## Required correction scope

A future gate implementation must:

- preserve exact candidate and wrapper identities;
- contain no candidate or wrapper source edits;
- avoid global `set -e` behavior after capturing the one permitted wrapper status;
- guard every no-match `grep`, `comm`, and filtering pipeline explicitly;
- make all post-invocation classification steps non-aborting;
- write the result artifact through a guaranteed finalization path;
- remove raw capture only after artifact creation and hash verification;
- print and copy a review package even when the wrapper exits nonzero;
- record whether invocation occurred using provenance markers only;
- never infer success from exit code alone;
- never display raw output;
- permit zero retries.

## Required static validation

Before any new authorization request, the corrected gate must pass synthetic tests for:

- wrapper exit `0`;
- wrapper exit nonzero;
- no allowlisted lines;
- only invocation provenance;
- invocation plus status provenance;
- no new consumption log;
- exactly one valid new consumption log;
- malformed consumption log;
- `comm` or `grep` no-match paths;
- artifact finalization despite all supported fail-closed outcomes.

This phase does not implement or authorize the corrected gate.
