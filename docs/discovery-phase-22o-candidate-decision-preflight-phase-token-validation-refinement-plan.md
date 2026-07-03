# AiFinder Discovery Engine — Phase 22O Candidate Decision Preflight Phase Token Validation Refinement Plan

## Phase Status

Phase 22O is a documentation-only refinement plan.

This phase plans a future refinement to the candidate decision execution preflight script's phase-token validation.

This phase does not modify the preflight script.

This phase does not run the preflight script.

This phase does not perform live database reads or writes.

This phase does not execute candidate decisions.

## Starting Checkpoint

Phase 22N was completed and pushed to `main`.

```text
Latest pushed commit: ed2d7b9 Document Phase 22N candidate decision preflight script review
Expected repo status before Phase 22O docs step: ## main...origin/main
```

## Background

Phase 22N verified that the non-mutating preflight script behaves safely.

The review found one compatibility issue:

```text
Numeric-leading phase tokens like 22N currently fail locked.
```

This happens because the preflight script validates the phase token with the same identifier rule used for action, status, and audit tokens.

That rule requires identifiers to start with a letter.

Canonical AiFinder phase names commonly start with numbers, such as:

```text
22N
22O
22P
```

The current behavior is safe because it fails closed.

However, before any future live candidate decision workflow uses canonical phase identifiers, the validation should be refined so canonical AiFinder phase tokens are accepted without weakening validation for action, status, or audit values.

## Purpose

The purpose of Phase 22O is to plan a safe, narrow refinement to phase-token validation only.

The refinement should preserve fail-closed behavior while allowing canonical AiFinder phase identifiers such as `22N`.

## Allowed Scope

Phase 22O may document:

- the Phase 22N validation finding
- why the current behavior is safe
- the desired future phase-token validation rule
- the exact future implementation boundary
- future test cases
- future Gemini review requirements
- future phase sequencing

## Forbidden Scope

Phase 22O must not include:

- source code changes
- executable script changes
- preflight execution
- live database reads
- live database writes
- candidate decision execution
- `approve_for_draft`
- public publishing
- cleanup mutation
- API behavior changes
- UI behavior changes
- Supabase schema changes
- migration changes
- generated type changes
- RLS policy changes
- crawler execution
- extraction execution
- scheduler or automation enablement
- commit or push before Gemini review and explicit James approval

## Safety Assessment

The Phase 22N finding is safe because numeric-leading phase tokens fail closed.

A failed phase-token validation produces:

```text
PREFLIGHT_FAIL_LOCKED
```

That means the script does not continue to a pass marker when a canonical numeric-leading phase token is used.

No mutation path exists in the script.

No live database read exists in the script.

No candidate decision execution exists in the script.

## Desired Future Behavior

A future refinement should allow canonical AiFinder phase tokens such as:

```text
22N
22O
22P
22AA
22AB
```

It should also continue to allow explicit letter-prefixed compatibility tokens such as:

```text
Phase22N
```

The future phase-token validator should reject unsafe values, including:

```text
22 N
../22N
22N;
22N&&echo
22N/../../
<22N>
"22N"
```

## Proposed Future Validation Rule

The phase token should use a dedicated validator, separate from the generic safe identifier validator.

Recommended future phase-token pattern:

```text
^(?:Phase)?[0-9]{1,3}[A-Z]{1,3}$
```

This allows examples such as:

```text
22N
22O
22AA
Phase22N
Phase22O
Phase22AA
```

This rejects lowercase, punctuation, whitespace, path traversal, shell metacharacters, and overly broad free text.

## Implementation Boundary For Future Phase

A future implementation phase should change only the phase-token validation logic inside:

```text
testing/discovery-candidate-decision-execution-preflight.mjs
```

Recommended future code shape:

```text
function validatePhaseToken(value) {
  if (!/^(?:Phase)?[0-9]{1,3}[A-Z]{1,3}$/.test(value)) {
    lock("Phase must be a canonical AiFinder phase token such as 22N or Phase22N.");
  }
}
```

The future implementation should then call:

```text
validatePhaseToken(phase);
```

instead of:

```text
validateIdentifier("Phase", phase);
```

All other validators should remain unchanged.

## Future Implementation Must Not Change

The future refinement must not change:

- candidate id UUID validation
- action validation
- current status validation
- next status validation
- audit event validation
- public publishing lock behavior
- `approve_for_draft` lock behavior
- cleanup lock behavior
- approval phrase exact-match logic
- final decision markers
- repo clean/alignment guard
- expected commit guard
- no-live-DB-read behavior
- no-mutation behavior

## Future Test Plan

A future implementation should verify these fail-closed cases:

1. Missing opt-in fails locked.
2. Generic approval phrase fails locked.
3. Mismatched approval phrase fails locked.
4. Phase token with whitespace fails locked.
5. Phase token with punctuation fails locked.
6. Phase token with path traversal fails locked.
7. Phase token with shell metacharacters fails locked.
8. Lowercase phase token fails locked unless explicitly approved otherwise.
9. `approve_for_draft` action remains locked.
10. Public publishing allowed value other than `false` fails locked.
11. Cleanup allowed value other than `false` fails locked.

A future implementation should verify these non-mutating pass cases:

1. `22N` passes with exact matching approval phrase.
2. `22O` passes with exact matching approval phrase.
3. `22AA` passes with exact matching approval phrase.
4. `Phase22N` continues to pass with exact matching approval phrase.

All pass cases must still print:

```text
PREFLIGHT_PASS_NON_MUTATING
```

All fail cases must still print:

```text
PREFLIGHT_FAIL_LOCKED
```

## Future Review Criteria

Before committing a future implementation, Gemini should review:

1. Only the preflight script changed.
2. No API/UI/Supabase files changed.
3. No live database reads were introduced.
4. No mutation path was introduced.
5. Phase-token validation is narrow.
6. Action/status/audit validation was not weakened.
7. Lock behavior remains unchanged.
8. Approval phrase exact-match behavior remains unchanged.
9. Fail-closed tests pass.
10. Canonical phase-token pass cases are non-mutating.

## Recommended Future Phase Sequence

Recommended next phase after Phase 22O:

```text
Phase 22P — Candidate Decision Preflight Phase Token Validation Refinement Implementation
```

Recommended boundary for Phase 22P:

```text
Modify only the phase-token validation logic in the non-mutating preflight script.
No live DB reads.
No DB mutation.
No candidate decision execution.
No approve_for_draft.
No public publishing.
No cleanup mutation.
No API/UI/Supabase changes.
```

Recommended follow-up phase:

```text
Phase 22Q — Candidate Decision Preflight Phase Token Validation Refinement Review
```

Phase 22Q should rerun focused smokes, including canonical tokens such as `22N`, `22O`, and `22AA`.

## Gemini Review Requirement

Phase 22O should be reviewed by Gemini before commit.

The Gemini review should confirm:

1. Phase 22O is documentation-only.
2. The Phase 22N finding is represented accurately.
3. The current behavior fails closed safely.
4. The proposed validation refinement is narrow.
5. The future implementation boundary is safe.
6. No live DB reads or mutations are authorized.
7. Candidate decision execution remains locked.
8. Public publishing remains locked.
9. `approve_for_draft` remains locked.
10. Cleanup mutation remains locked.
11. It is safe to commit this documentation gate.

## Workflow Note

AiFinder terminal workflow should continue in no-heredoc mode by default.

Preferred methods:

- downloadable `.sh` files for long scripts
- base64 decode for long file creation
- small direct commands only when safe
- `pbpaste > file` only when prepared content is intentionally copied first

All important terminal work must save output with `tee`, copy raw terminal output with `pbcopy`, and preserve original command status.

## Phase 22O Conclusion

Phase 22O plans a narrow and safe phase-token validation refinement.

It does not modify executable code.

It does not run the preflight script.

It does not unlock live database reads.

It does not unlock candidate decision execution.

It does not unlock public publishing.

It does not unlock `approve_for_draft`.

It does not unlock cleanup mutation.

The Discovery Engine remains fail-closed before any future mutation-capable candidate decision work.
