# AiFinder Phase 26LU — Authorization-Consumption Hardening Plan

A future wrapper must create a producer-unique, body-free marker immediately before candidate invocation and a second marker immediately after return.

Authorization accounting must distinguish:

- wrapper invocation begun;
- candidate invocation begun;
- candidate returned;
- transport trace observed.
