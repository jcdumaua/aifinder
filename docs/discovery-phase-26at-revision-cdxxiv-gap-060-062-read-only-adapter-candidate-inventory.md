# AiFinder Phase 26AT — Revision CDXXIV — GAP-060–GAP-062 Read-Only Adapter Candidate Inventory

## Approved baseline

- `0144e400a03fc14b78369a0b336cc12df35fd6ab`

## Scope

This inventory evaluates abstract adapter classes only. It does not identify a command, endpoint, account, project, deployment, private URL, credential, or environment value.

## Candidate classes

| Adapter class | Description | Network required later | Mutation capability acceptable | Current eligibility |
|---|---|---:|---:|---|
| `LOCAL_COMMITTED_METADATA_ADAPTER` | Reads only committed repository metadata already present locally | NO | NO | `INSUFFICIENT_FOR_PRODUCTION_DEPLOYMENT_EXISTENCE` |
| `PLATFORM_CLI_READ_ONLY_METADATA_ADAPTER` | Future reviewed CLI invocation returning allowlisted deployment metadata | YES | NO | `CONDITIONALLY_ELIGIBLE` |
| `PLATFORM_API_READ_ONLY_METADATA_ADAPTER` | Future reviewed API request returning allowlisted deployment metadata | YES | NO | `CONDITIONALLY_ELIGIBLE` |
| `WEB_UI_MANUAL_OBSERVATION_ADAPTER` | Human observation of platform UI with manually normalized metadata | YES | NO | `NOT_PREFERRED_NON_DETERMINISTIC` |
| `DEPLOYMENT_MUTATION_ADAPTER` | Creates, changes, promotes, rolls back, or redeploys | YES | YES | `PROHIBITED` |

## Mandatory characteristics

Any selected class must support:

- Exactly one read-only request.
- One normalized result row.
- Zero retries.
- Fixed timeout.
- Fixed metadata field allowlist.
- No raw response-body preservation.
- No deployment mutation.
- No build trigger.
- No secret or environment-value output.
- Original exit-status preservation.
- Immediate fail-closed stop on ambiguity.

## Result

`ADAPTER_CLASSES_INVENTORIED_NO_COMMAND_SELECTED`
