# AiFinder Phase 26AY — Revision CDXXIX — GAP-060–GAP-062 Vercel API Adapter Research

## Research boundary

Official public Vercel REST API documentation only. No API request was sent and no authenticated resource was accessed.

## Official findings

### Platform

- Platform: `VERCEL`
- API base: `https://api.vercel.com`
- API architecture: REST over SSL.
- Access-token authentication is required.
- Authentication header form: `Authorization: Bearer <TOKEN>`.
- Team-owned resources may require a `teamId` query parameter.
- Rate-limit metadata is reported through response headers.

### Deployment listing operation

- Operation name: `List deployments`
- HTTP method: `GET`
- Path: `/v7/deployments`
- Documented purpose: list deployments for the authenticated user or team.
- Read-only classification: `YES`
- Documented success status: `200`
- Documented authorization failures: `401`, `403`

### Relevant query parameters

- `projectId`: project ID or name filter.
- `target`: environment filter.
- `branch`: branch filter.
- `limit`: maximum deployments returned.
- `teamId` or `slug`: optional team context.
- `state`: optional deployment-state filter.

## Documentation sources

- Vercel REST API overview: `https://vercel.com/docs/rest-api`
- Vercel List deployments endpoint: `https://vercel.com/docs/rest-api/deployments/list-deployments`

## Safety finding

The documented response includes many fields outside the approved AiFinder contract, including deployment URLs, creator data, project settings, metadata, inspector URLs, and error details. Therefore:

- Raw response output must never be printed or copied.
- The response must be parsed locally into a strict allowlist.
- Unexpected structure must fail closed.
- No response field may be treated as safe by default.

## Result

`OFFICIAL_VERCEL_READ_ONLY_ENDPOINT_IDENTIFIED_NO_REQUEST_SENT`
