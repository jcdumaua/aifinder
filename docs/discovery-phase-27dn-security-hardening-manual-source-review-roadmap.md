# AiFinder Phase 27DN — Security Hardening Manual Source Review Roadmap

## Status
`PENDING_GEMINI_REVIEW_AS_BATCH_COMPONENT`

## Review Order

### Batch A — Critical Authentication and Privilege
Review first:
- admin login/logout/session routes;
- admin authentication and rate-limit primitives;
- privileged Supabase/admin clients.

### Batch B — Critical Discovery and Database Mutation
Review:
- discovery decision/staging/admin services;
- database RPCs, migrations, and SQL candidates;
- homepage-control mutation services.

### Batch C — Standard Admin UI and Server Boundaries
Review:
- admin layouts/pages;
- admin components invoking privileged operations;
- audit logging and supporting libraries.

### Batch D — Testing and Harness Safety
Review:
- smoke scripts;
- admin/discovery tests;
- read-only runtime verification harnesses;
- controlled cleanup/preparation scripts.

## Evidence Required Per File
- file identity;
- logical role;
- privilege level;
- authorization entry point;
- mutation capability;
- logging behavior;
- environment/service-role usage;
- client/server boundary;
- disposition:
  - `SECURE_BY_DESIGN`
  - `REQUIRES_HARDENING`
  - `OBSOLETE_AND_REMOVAL_CANDIDATE`

## Recommended Phase Structure
1. larger static manual review of Critical Batch A;
2. larger static manual review of Critical Batch B;
3. larger static review of Standard Batch C;
4. larger static review of Testing Batch D;
5. consolidated remediation decision gate;
6. only then, narrowly authorized code changes if required.

No code changes or runtime validation are authorized by this roadmap.
