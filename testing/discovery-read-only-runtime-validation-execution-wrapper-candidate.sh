#!/bin/bash

# Inert repository candidate; execution requires a separately authorized binding gate.

REPOSITORY_PATH="/Users/jamescarlodumaua/aifinder"
SUPERVISOR_PATH="/Users/jamescarlodumaua/aifinder/testing/discovery-read-only-runtime-validation-execution-supervisor.mjs"
EXPECTED_SUPERVISOR_SHA256="0d469d85cfcb974b978bd4e1742b1679c5516d14adf0e0b685f06caf1b83b317"

EXPECTED_EXECUTION_BASELINE="__BIND_AT_EXECUTION_GATE__"
NODE_EXECUTABLE="__BIND_AT_EXECUTION_GATE__"
OUTPUT_DIRECTORY="__BIND_AT_EXECUTION_GATE__"

main() {
  [ "$#" -eq 0 ] || exit 64

  [[ "$EXPECTED_EXECUTION_BASELINE" =~ ^[0-9a-f]{40}$ ]] || exit 65
  case "$NODE_EXECUTABLE" in
    /*) ;;
    *) exit 66 ;;
  esac
  case "$OUTPUT_DIRECTORY" in
    /tmp/*) exit 67 ;;
  esac
  [[ "$OUTPUT_DIRECTORY" =~ ^/private/tmp/aifinder-runtime-validation-[0-9]{8}T[0-9]{6}Z-[A-Za-z0-9_-]{6,64}-output$ ]] || exit 67
  [[ "$EXPECTED_SUPERVISOR_SHA256" =~ ^[0-9a-f]{64}$ ]] || exit 68

  exec /usr/bin/env -i \
    LANG=C \
    LC_ALL=C \
    AIFINDER_EXPECTED_EXECUTION_BASELINE="$EXPECTED_EXECUTION_BASELINE" \
    AIFINDER_EXPECTED_NODE_EXECUTABLE="$NODE_EXECUTABLE" \
    AIFINDER_OUTPUT_DIRECTORY="$OUTPUT_DIRECTORY" \
    AIFINDER_EXPECTED_SUPERVISOR_SHA256="$EXPECTED_SUPERVISOR_SHA256" \
    "$NODE_EXECUTABLE" "$SUPERVISOR_PATH"
}

main "$@"
