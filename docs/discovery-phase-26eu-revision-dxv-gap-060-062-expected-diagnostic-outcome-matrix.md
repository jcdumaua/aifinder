# AiFinder Phase 26EU — Expected Diagnostic Outcome Matrix

Possible body-free outcomes include:

- preflight trace absent: failure before validated request preparation;
- preflight present, curl trace absent: failure before or during transport invocation setup;
- curl nonzero: transport-level failure;
- HTTP code outside accepted range: provider response classification;
- parser exception trace: normalized parser failure;
- no parser exception with normalized failure: candidate-defined failure path;
- success result: read-only diagnostic success only.

No outcome proves launch readiness by itself.
