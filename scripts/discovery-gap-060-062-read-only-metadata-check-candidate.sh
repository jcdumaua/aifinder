#!/usr/bin/env bash
set -u
set -o pipefail

# NON-EXECUTED CANDIDATE ONLY.
# This text contains no platform command and cannot perform a live operation
# until a later reviewed phase supplies one exact read-only adapter.

EXPECTED_REPO="/Users/jamescarlodumaua/aifinder"
EXPECTED_ORIGIN="https://github.com/jcdumaua/aifinder.git"
EXPECTED_BRANCH="main"
APPROVED_BASELINE="__LATER_REVIEWED_EXECUTION_BASELINE__"
EXPECTED_RESULT_COUNT="1"
RETRY_COUNT="0"
TIMEOUT_SECONDS="__LATER_REVIEWED_FIXED_TIMEOUT__"

fail() {
  printf 'STOPPED_FAIL_CLOSED\n'
  printf 'stop_reason=%s\n' "$1"
  return 1
}

main() {
  local adapter="${AIFINDER_REVIEWED_READ_ONLY_ADAPTER:-}"
  local platform_category="${AIFINDER_REVIEWED_PLATFORM_CATEGORY:-}"
  local target_selector="${AIFINDER_REVIEWED_TARGET_SELECTOR:-}"
  local raw_file normalized_file adapter_rc result_count

  [[ "$PWD" == "$EXPECTED_REPO" ]] \
    || fail "REPOSITORY_PATH_MISMATCH" || return 1
  [[ "$(git remote get-url origin 2>/dev/null)" == "$EXPECTED_ORIGIN" ]] \
    || fail "ORIGIN_MISMATCH" || return 1
  [[ "$(git branch --show-current)" == "$EXPECTED_BRANCH" ]] \
    || fail "BRANCH_MISMATCH" || return 1

  git fetch origin main >/dev/null 2>&1 \
    || fail "FETCH_FAILED" || return 1
  [[ "$(git rev-parse HEAD)" == "$APPROVED_BASELINE" ]] \
    || fail "BASELINE_MISMATCH" || return 1
  [[ "$(git rev-parse origin/main)" == "$APPROVED_BASELINE" ]] \
    || fail "REMOTE_BASELINE_MISMATCH" || return 1
  [[ "$(git rev-list --count origin/main..HEAD)" == "0" ]] \
    || fail "AHEAD_OF_ORIGIN" || return 1
  [[ "$(git rev-list --count HEAD..origin/main)" == "0" ]] \
    || fail "BEHIND_ORIGIN" || return 1
  [[ -z "$(git status --porcelain)" ]] \
    || fail "WORKING_TREE_NOT_CLEAN" || return 1

  [[ "$RETRY_COUNT" == "0" ]] \
    || fail "RETRY_POLICY_MISMATCH" || return 1
  [[ "$EXPECTED_RESULT_COUNT" == "1" ]] \
    || fail "EXPECTED_COUNT_MISMATCH" || return 1
  [[ -n "$TIMEOUT_SECONDS" && "$TIMEOUT_SECONDS" != __* ]] \
    || fail "TIMEOUT_NOT_REVIEWED" || return 1

  [[ "$adapter" == "__LATER_REVIEWED_READ_ONLY_ADAPTER__" ]] \
    || fail "ADAPTER_NOT_REVIEWED" || return 1
  [[ -n "$platform_category" ]] \
    || fail "PLATFORM_CATEGORY_MISSING" || return 1
  [[ -n "$target_selector" ]] \
    || fail "TARGET_SELECTOR_MISSING" || return 1

  case "$platform_category$target_selector" in
    *password*|*secret*|*token*|*cookie*|*://*|*@*)
      fail "SENSITIVE_OR_PRIVATE_INPUT_DETECTED"
      return 1
      ;;
  esac

  raw_file="$(mktemp)"
  normalized_file="$(mktemp)"
  trap 'rm -f "$raw_file" "$normalized_file"' EXIT

  # PLACEHOLDER ONLY:
  # A later reviewed phase must replace the next line with exactly one
  # independently approved read-only metadata adapter invocation.
  fail "NO_PLATFORM_COMMAND_SELECTED"
  return 1

  adapter_rc=$?

  [[ "$adapter_rc" == "0" ]] \
    || fail "ADAPTER_NONZERO_EXIT" || return "$adapter_rc"

  if grep -Eiq \
    '(password|secret|token|cookie|connection[_ -]?string|private[_ -]?url)' \
    "$raw_file"; then
    fail "SECRET_LIKE_OUTPUT_DETECTED"
    return 1
  fi

  # A later reviewed parser must reject all fields except:
  # operation_type, read_only, repository_match, branch_match,
  # deployment_record_present, deployment_state_classification,
  # reviewed_identifier_present, result_count, stop_reason, exit_status.

  result_count="$(wc -l < "$normalized_file" | tr -d ' ')"
  [[ "$result_count" == "$EXPECTED_RESULT_COUNT" ]] \
    || fail "RESULT_COUNT_MISMATCH" || return 1

  cat "$normalized_file"
  return "$adapter_rc"
}

main
exit $?
