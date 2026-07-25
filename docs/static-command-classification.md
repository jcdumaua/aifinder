# Static Command Classification

AiFinder commands are classified by capability, not by name or expected
output. A static-only phase may run only commands explicitly authorized by its
controlling contract.

| Class | Examples | Static-only default |
| --- | --- | --- |
| Deterministic static | `npm run check:static`, manifest policy tests, the sandboxed core runner | Allowed when authorized |
| Build/environment-aware | `npm run check`, `npm run build` | Denied |
| Browser or live route | development server, Playwright, responsive, accessibility, smoke, route invocation | Denied |
| Database or live service | Supabase, SQL, migrations, schema, RLS, live catalog | Denied |
| Operational | staging, commit, push, deployment, publishing, reactivation, launch | Denied unless separately authorized |

The safety manifest is the executable classification authority for
`testing/**`. Only `SAFE_STATIC_CORE` entries with `RUN_CORE` can enter the
sandboxed core runner. `SAFE_STATIC_POLICY` entries validate governance
artifacts but are not core application evidence. Support, fixture, and config
entries are never invoked directly. Any uncertainty is classified
`UNPROVEN_DENY`.

`npm run check` remains unchanged and includes a production build. It is not a
substitute for `npm run check:static` and is outside static-only authority.
