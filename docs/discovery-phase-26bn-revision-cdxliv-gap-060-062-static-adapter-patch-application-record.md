# AiFinder Phase 26BN — Revision CDXLIV — GAP-060–GAP-062 Static Adapter Patch Application Record

## Approved baseline

- `4ad282a8b2fc9bf45543af12561182d3b5d9e996`

## Change scope

- Modified files: `1`
- Modified candidate: `scripts/discovery-gap-060-062-read-only-metadata-check-candidate.sh`
- Review artifacts created: `4`
- Candidate SHA-256 before patch: `98c8a36a51b4b54a3b1295ed02494a57367fb81eabb9f4d5f4e30d1674a2268e`
- Candidate SHA-256 after patch: `560cbbc2a547d06b5f6237f28a6df7af4404ab391e34b2794bf029bca12b3617`
- File mode before patch: `100644`
- File mode after patch: `100644`
- Candidate executable: `NO`

## Applied static logic

- Adapter label: `VERCEL_LIST_DEPLOYMENTS_READ_ONLY_V1`
- Method: `GET`
- Host: `api.vercel.com`
- Path: `/v7/deployments`
- Fixed filters: `target=production`, `branch=main`, `limit=1`
- Retry count: `0`
- Redirect following: `DISABLED`
- Request body: `NONE`
- Local strict parser: `PRESENT`
- Raw response publication: `PROHIBITED`

## Activity counts

- Candidate executions: `0`
- API requests sent: `0`
- Token values obtained: `0`
- Selector values obtained: `0`

## Result

`STATIC_PATCH_APPLIED_NON_EXECUTABLE_AND_UNEXECUTED`
