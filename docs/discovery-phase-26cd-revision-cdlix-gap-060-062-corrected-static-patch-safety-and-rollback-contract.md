# AiFinder Phase 26CD — GAP-060–GAP-062 Corrected Static Patch Safety and Rollback Contract

## Status

DOCUMENTATION-ONLY SAFETY CONTRACT.

## Pre-write checks

Any successor patch application must fail closed unless:

- repository path, origin, branch, and synchronized baseline are exact;
- the working tree contains only the reviewed documentation batch before patch application;
- the candidate SHA-256 equals the approved pre-patch identity;
- the candidate is tracked as mode `100644`, non-executable, and unstaged;
- `bash -n` passes;
- the exact reviewed assignment occurs once.

## Write boundary

The patch may alter only one inert baseline assignment in the candidate. No other line, file, mode, permission, variable, or control may change.

## Rollback contract

Before any write, the successor gate must create a protected temporary backup outside the repository.

On every failure after the write, it must:

1. restore the original candidate bytes;
2. restore mode `100644`;
3. verify the original SHA-256;
4. verify the candidate is non-executable and unstaged;
5. stop immediately with the original nonzero status;
6. copy the raw failure log to the clipboard.

The rollback path must not continue into later validations after restoration.

## Post-write checks

Success requires exactly one changed repository path, post-patch `bash -n`, unchanged mode, no concrete timeout insertion, no staged changes, a newly calculated post-patch SHA-256, zero candidate executions, and zero API requests.

## Authorization boundary

This contract does not authorize applying or committing the patch.
