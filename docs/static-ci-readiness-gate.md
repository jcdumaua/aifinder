# Static CI Readiness Gate

The proposed `.github/workflows/static-readiness.yml` is a static-only,
read-only GitHub Actions gate. It triggers on pull requests, pushes to `main`,
and manual dispatch, with top-level `contents: read` permission and concurrency
cancellation.

It contains exactly four jobs:

1. `policy` validates the safety manifest, coverage matrix, public-launch
   blocker registry, public-production-runtime plan, workflow, and
   accessibility/responsive static contract.
2. `lint` depends on `policy`.
3. `typecheck` depends on `policy`.
4. `static-readiness` depends on `policy` and executes only the manifest-bound
   core runner.

Every job pins Node `24.15.0`, uses `actions/checkout` and
`actions/setup-node` by exact official 40-character commit, disables checkout
credential persistence, uses a bounded timeout, and installs the lockfile with
scripts, audit, and funding calls disabled.

The workflow contains no build, browser, route, database, Supabase, secret,
service, cache, artifact, deployment, or write step. Static creation and local
validation do not dispatch it. A later commit or workflow run needs its own
authorization and must revalidate the pinned actions and repository baseline.

The blocker policy step is exactly `npm run test:public-launch-blockers`,
immediately after readiness coverage. The planning policy step is exactly
`npm run test:public-production-runtime-planning`, immediately after the
blocker-registry step. The accessibility/responsive policy step remains
`npm run test:accessibility-responsive-static`; no synthetic browser command
is present in any of the four jobs. The workflow contains exactly thirteen run
steps. This static plan does not authorize target resolution, HTTP, browser,
production-data, form-submission, or mutation activity.
