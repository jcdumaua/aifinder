# AiFinder Phase 26LP — Baseline Dataflow Map

Future baseline validation must use one explicit source of truth:

1. execution gate supplies the approved repository baseline;
2. wrapper validates local `HEAD` and local `origin/main`;
3. candidate receives only the baseline contract it actually needs;
4. producer-specific diagnostics identify where mismatch occurred.
