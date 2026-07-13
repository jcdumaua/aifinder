# AiFinder Phase 26AH — Revision CDXII — GAP-060–GAP-062 Static Script Safeguard Contract

## Mandatory safeguards

### Identity checks

- Exact repository path.
- Exact origin.
- Exact branch.
- Exact approved baseline.
- Ahead and behind both zero.
- Clean working tree.

### Input controls

- Non-secret parameters only.
- No environment scanning.
- No automatic credential discovery.
- No private target discovery.
- No fallback target.
- No wildcard selector.

### Command controls

- Exactly one command.
- Read-only classification required.
- Fixed timeout.
- Retry count zero.
- No shell expansion of unreviewed values.
- No deployment mutation flag.
- No build, promote, rollback, cancel, redeploy, alias, domain, or configuration action.

### Output controls

- Fixed field allowlist.
- One result row maximum.
- Raw response body prohibited.
- stderr sanitized before review packaging.
- Secret-like scan before clipboard copy.
- Original exit status preserved.

### Stop conditions

- Repository mismatch.
- Target ambiguity.
- Login or privilege escalation prompt.
- Redirect.
- Mutation capability.
- Unexpected field.
- Unexpected result count.
- Secret-like content.
- Non-zero or indeterminate command result.

## Current authorization

- Executable script creation: `NOT_AUTHORIZED`
- Platform command selection: `NOT_AUTHORIZED`
- Platform access: `NOT_AUTHORIZED`
- Production inspection: `NOT_AUTHORIZED`
- Deployment action: `NOT_AUTHORIZED`

## Result

`STATIC_SCRIPT_SAFEGUARDS_DEFINED`
