#!/usr/bin/env bash
# AIFINDER_AUTORUN_SCRIPT_V1
# AiFinder Phase 26YB read-only target catalog preflight wrapper candidate.
# INERT STATIC REVIEW CANDIDATE: intentionally refuses all execution.
set -uo pipefail

main() {
  local phase="26yb"
  local task="read-only-target-catalog-preflight"
  local ts
  ts="$(date +%Y%m%d-%H%M%S)"
  local log="/tmp/aifinder-${phase}-${task}-${ts}.log"

  (
    set -euo pipefail

    echo "=== AiFinder Phase 26YB Read-Only Target Catalog Preflight Candidate ==="
    echo "FAILED: inert static-review guard is active."
    echo "No database connection or query was attempted."
    echo "Sequence scope: ZERO_EXPLICIT_SEQUENCE_IDENTIFIERS."
    echo "A later Gemini-reviewed and explicitly authorized phase must replace this guard"
    echo "with a bounded credential-delivery and target-classification contract."
    exit 90
  ) 2>&1 | tee "${log}"

  local rc=${PIPESTATUS[0]}

  if [[ ${rc} -eq 0 ]]; then
    echo "PASSED: Phase 26YB read-only catalog preflight"
  else
    pbcopy < "${log}" 2>/dev/null || true
    echo "FAILED: Phase 26YB candidate exited with code ${rc}"
    echo "Raw failure log copied to clipboard: ${log}"
  fi

  return "${rc}"
}

main "$@"
exit $?
