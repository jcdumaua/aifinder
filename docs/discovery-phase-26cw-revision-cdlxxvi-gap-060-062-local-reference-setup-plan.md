# AiFinder Phase 26CW — GAP-060–GAP-062 Local Reference Setup Plan

## Status

PLANNING ONLY — NO VALUES CREATED OR STORED.

## Required future setup

The human operator must separately obtain and locally configure:

- one Vercel token suitable for the reviewed read-only deployment-list request;
- one project selector identifying the AiFinder Vercel project.

## Storage boundary

The values must:

- remain outside repository files;
- never be committed;
- never be pasted into governance documents or chat;
- never be printed by verification scripts;
- be exposed only through the reviewed environment-variable references;
- be checked only as `SET` or `NOT_SET`.

## Team boundary

Team context is `no`. No team selector should be configured or supplied.

## Success condition

A later terminal check may report:

- token reference available: `yes`;
- project selector reference available: `yes`;
- team context required: `no`;
- team selector reference available: `no`.

This plan does not authorize creating a token, loading values, executing the candidate, or sending a request.
