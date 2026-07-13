# AiFinder Phase 25VA — Revision CCLXXV — GAP-063 Static Evidence Scope Definition

## Purpose

Define the narrow repository-local static-evidence scope for `GAP-063 / SEC-LR-011` without performing evidence acquisition or making a control decision.

## Scope

Permitted future static evidence is limited to committed repository content that can be inspected without executing the application or contacting external systems:

- Existing governance Markdown records that explicitly reference `GAP-063` or `SEC-LR-011`.
- Source files that define or document the relevant security control boundary.
- Tests, scripts, or configuration files only when read as inert text.
- Commit history and file identity metadata needed to establish provenance.
- Existing static review conclusions that remain attributable to committed artifacts.

## Excluded evidence

The following are outside this chain unless a new explicitly approved governance phase authorizes them:

- Live platform configuration.
- Deployed policy state.
- Database queries, SQL, migrations, or row inspection.
- Runtime route or middleware behavior.
- Authentication-session execution.
- Browser automation.
- Network requests other than ordinary Git synchronization.
- Environment files or environment values.
- Secret stores, credentials, tokens, cookies, connection strings, project references, or raw diagnostics.
- Production mutation or operational reactivation.

## Evidence classification

Future evidence must be classified as one of:

- `DIRECT_STATIC_EVIDENCE`
- `INDIRECT_STATIC_EVIDENCE`
- `CONTRADICTORY_STATIC_EVIDENCE`
- `MISSING_STATIC_EVIDENCE`
- `OUT_OF_SCOPE_RUNTIME_EVIDENCE`

Static evidence may demonstrate design intent or repository implementation. It cannot by itself prove current deployed effectiveness.

## Fail-closed rule

Ambiguous, stale, unattributed, generated, or runtime-dependent material must not be upgraded into direct evidence. Any unresolved ambiguity remains blocking.

## Result

The Phase 25VB successor may plan a repository-local inventory under this scope. No evidence has yet been accepted and `GAP-063` remains `UNRESOLVED`.
