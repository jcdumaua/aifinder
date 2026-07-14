# AiFinder Phase 26MR — Mode, Syntax, and Control Preservation Plan

Any implementation must preserve:

- mode `100644`;
- non-executable state;
- passing `bash -n`;
- timeout `15`;
- retry `0`;
- no redirects;
- no team context;
- one candidate invocation site;
- no response-body output;
- no environment-value output.
