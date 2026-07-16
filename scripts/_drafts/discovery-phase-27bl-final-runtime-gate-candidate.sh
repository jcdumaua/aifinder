#!/usr/bin/env bash
# AIFINDER_AUTORUN_SCRIPT_V1
# Phase 27BL final runtime gate candidate. Inert without exact --execute.
set -uo pipefail

main() {
  local repo="/Users/jamescarlodumaua/aifinder"
  local expected_head="6c7058c1845810ff77fe68cb1154a703a9c4391a"
  local adapter="scripts/_drafts/discovery-phase-27bj-narrow-adapter-candidate.sh"
  local expected_adapter_sha="4371c104b54806a7eb4c671cdd7bd9fa638e6be908e58536092ed1f3efc0499e"
  local retained="scripts/_drafts/discovery-phase-27bh-targeted-classifier-repair-candidate.sh"
  local execute_flag="${1:-}"

  if [[ "${execute_flag}" != "--execute" || $# -ne 1 ]]; then
    echo "BLOCKED: Phase 27BL runtime gate is inert"
    return 93
  fi

  (
    set -euo pipefail
    umask 077
    cd "${repo}"

    [[ "$(git rev-parse HEAD)" == "${expected_head}" ]] || { echo "FAILED: baseline mismatch"; exit 10; }
    [[ "$(git rev-parse origin/main)" == "${expected_head}" ]] || { echo "FAILED: origin mismatch"; exit 11; }
    [[ "$(shasum -a 256 "${adapter}" | awk '{print $1}')" == "${expected_adapter_sha}" ]] || {
      echo "FAILED: adapter identity mismatch"
      exit 12
    }

    local quarantine=""
    cleanup() {
      local saved_rc=$?
      if [[ -n "${quarantine:-}" && -f "${quarantine}" ]]; then
        mv -- "${quarantine}" "${retained}" 2>/dev/null || true
      fi
      return "${saved_rc}"
    }
    trap cleanup EXIT HUP INT TERM

    local status unexpected
    status="$(git status --porcelain=v1 --untracked-files=all)"
    unexpected="$(printf '%s\n' "${status}" | awk -v r="${retained}" 'NF {p=substr($0,4); if (p != r) print}')"
    [[ -z "${unexpected}" ]] || { echo "FAILED: unexpected workspace changes"; exit 13; }

    if [[ -f "${retained}" ]]; then
      quarantine="$(mktemp "/tmp/aifinder-phase-27bl-retained-candidate.XXXXXX")"
      chmod 600 "${quarantine}"
      mv -- "${retained}" "${quarantine}"
    fi

    [[ -z "$(git status --porcelain=v1 --untracked-files=all)" ]] || {
      echo "FAILED: repository is not clean after bounded quarantine"
      exit 14
    }

    "${adapter}" --execute
  )
}

main "$@"
exit $?
