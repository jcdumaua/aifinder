# AiFinder Phase 26AZ — Revision CDXXX — GAP-060–GAP-062 Exact Adapter Specification

## Selected adapter

- Platform: `VERCEL`
- Adapter class: `PLATFORM_API_READ_ONLY_METADATA_ADAPTER`
- Base URL: `https://api.vercel.com`
- HTTP method: `GET`
- Endpoint path: `/v7/deployments`
- Planned operation count: `1`
- Planned retry count: `0`
- Planned maximum deployment items: `1`
- Candidate insertion authorized: `NO`
- Live invocation authorized: `NO`

## Required future query contract

A later reviewed implementation may construct exactly these query categories:

- `projectId=<REVIEWED_NON_SECRET_PROJECT_SELECTOR>`
- `target=production`
- `branch=main`
- `limit=1`
- Optional `teamId=<REVIEWED_NON_SECRET_TEAM_SELECTOR>` only when independently required and reviewed.

No other query parameter is allowed without a new review gate.

## Authentication specification

- Mechanism: `VERCEL_ACCESS_TOKEN_BEARER`
- Header name: `Authorization`
- Header form: `Bearer <TOKEN>`
- Token value printing: `PROHIBITED`
- Token discovery: `PROHIBITED`
- Environment enumeration: `PROHIBITED`
- Secret-store inspection: `PROHIBITED`
- Authentication-source selection: `NOT_AUTHORIZED_IN_THIS_PHASE`

## Transport requirements

- HTTPS only.
- Exact host allowlist: `api.vercel.com`
- Redirect following: `PROHIBITED`
- Fixed timeout: `REQUIRED_BUT_NOT_YET_SELECTED`
- Retry count: `0`
- Request body: `NONE`
- Mutation parameters: `NONE`

## Expected status handling

- `200`: parse only through the approved minimization contract.
- `400`: stop fail closed.
- `401`: stop fail closed without printing authentication details.
- `403`: stop fail closed without printing account or team details.
- `404`: stop fail closed.
- `422`: stop fail closed.
- Any other status: stop fail closed.

## Result

`EXACT_VERCEL_ENDPOINT_SPECIFIED_IMPLEMENTATION_AND_EXECUTION_BLOCKED`
