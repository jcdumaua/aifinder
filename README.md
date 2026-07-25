# AiFinder

AiFinder is a Next.js and React directory for discovering, comparing, and
submitting AI tools. Supabase backs the project data and protected
administrative workflows. Static repository assurance does not imply live,
database, deployment, or public-launch readiness.

## Command classes

- **Static:** `npm run check:static` is the default local static gate. It runs
  lint, TypeScript, policy validation, and the sandboxed manifest-approved
  static suites without invoking the application.
- **Build/environment-aware:** `npm run check` includes `next build`.
  Static-only phases do not authorize it.
- **Browser/live:** development, responsive, accessibility, route, and live
  smoke commands require separate browser or live-runtime authority.
- **Database/live:** Supabase, SQL, migrations, schema, RLS, and live-catalog
  commands require separate database authority.
- **Operational:** deployment, publishing, operational reactivation, and
  public launch require explicit operational authorization.

## Deterministic static assurance

`testing/static-test-safety-manifest.json` classifies every file under
`testing/` and fail-closes anything not proven safe. The manifest-driven runner
uses `testing/static-readiness-sandbox.mjs` to deny network, child-process, and
filesystem-mutation capabilities inside approved test processes.

`testing/readiness-coverage-matrix.json` inventories application surfaces and
records static evidence separately from unresolved browser, live-route, and
database gaps. `.github/workflows/static-readiness.yml` applies the same
read-only policy in four dependency-pinned CI jobs. The workflow is a proposed
static gate; its presence does not authorize a run or deployment.

Useful static commands:

```bash
npm run test:static-readiness
npm run check:static
```

## Exact-scope Git workflow

Inspect the worktree and review only the authorized paths:

```bash
git status --short
git diff -- <authorized paths>
git diff --check -- <authorized paths>
```

Never use `git add .`. When staging is separately authorized, stage only the
approved scope:

```bash
git add -- <authorized paths>
git diff --cached --name-only
git diff --cached --check
```

Verify the staged path set and inspect the complete cached diff before
committing. Commit, push, deployment, database access, Supabase actions,
operational reactivation, and public launch each remain separate authorization
boundaries.
