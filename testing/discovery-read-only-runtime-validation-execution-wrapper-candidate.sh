#!/usr/bin/env bash

# Inert Phase 27HD-27IA candidate. The repository copy is not execution-eligible.

REPOSITORY_PATH="/Users/jamescarlodumaua/aifinder"
EXPECTED_BRANCH="main"
EXPECTED_ORIGIN="https://github.com/jcdumaua/aifinder.git"
EXPECTED_EXECUTION_BASELINE="__BIND_AT_EXECUTION_GATE__"
NODE_EXECUTABLE="__BIND_AT_EXECUTION_GATE__"
GIT_EXECUTABLE="/usr/bin/git"
MINIMUM_GIT_VERSION="2.35.2"

RUNTIME_HARNESS_PATH="testing/discovery-read-only-runtime-validation-harness.mjs"
RUNTIME_HARNESS_SHA256="6f7247494fc7348aac42006b6dd97228027acfdcb606b7d0316fb638a79a7722"
RUNTIME_HARNESS_MODE="755"
STATIC_CONTRACT_TEST_PATH="testing/discovery-read-only-runtime-validation-harness-static-contract.test.mjs"
STATIC_CONTRACT_TEST_SHA256="0bc5a0a7e152031ca981feb80c46bb709c0ace797a1a74b37c560780b5a0807c"
STATIC_CONTRACT_TEST_MODE="644"
VALIDATOR_PATH="testing/discovery-read-only-runtime-validation-evidence-validator.mjs"
VALIDATOR_SHA256="a445704b7b682282e16aee44ff52c209dc155dc9056bee36d26d89881f579b62"
VALIDATOR_MODE="644"
EXECUTION_CONTRACT_TEST_PATH="testing/discovery-read-only-runtime-validation-execution-contract.test.mjs"
EXECUTION_CONTRACT_TEST_SHA256="e2eaf6c0762ba68036c165b65f34fa5fe2d896f71437b8bb66233dcf8f993750"
EXECUTION_CONTRACT_TEST_MODE="644"
WRAPPER_CANDIDATE_PATH="testing/discovery-read-only-runtime-validation-execution-wrapper-candidate.sh"

TMP_ROOT_PREFIX="/tmp/aifinder-runtime-validation-"
OUTER_TIMEOUT_SECONDS=10
MAX_COMBINED_LOG_BYTES=2097152
MAX_VALIDATOR_INPUT_BYTES=1048576

GIT_CONFIG_OVERRIDE_ARGS=(
  "-c" "core.fsmonitor=false"
  "-c" "core.untrackedCache=false"
  "-c" "core.hooksPath=/dev/null"
  "-c" "credential.helper="
  "-c" "credential.interactive=false"
  "-c" "diff.external="
)

EXCLUDED_PATHS=(
  "docs/discovery-phase-27fl-discovered-tool-duplicate-source-hardening-patch-planning-gate.md"
  "docs/discovery-phase-27fp-global-security-ledger-final-audit-reselection-gate.md"
  "docs/discovery-phase-27fq-audit-logs-focused-static-inspection-and-test-contract-planning-gate.md"
  "docs/discovery-phase-27ft-audit-logs-source-hardening-patch-planning-gate.md"
  "docs/discovery-phase-27fx-global-security-ledger-final-closure-audit-gate.md"
)
EXCLUDED_HASHES=(
  "6fe6e3d7abb1a5586bc3699ca7bfa6b9712dd355f45e0710bd714b1d94a7ce12"
  "704b24609649b43d54a8a1dbfa0449ea346518c00186bb5eba305b7a39641f9a"
  "2e215686d2efcc7b7b744110af3bc69cb64f46c18512f9797b23c8ba9e7cb723"
  "96bbe26236b7d69a48b46143c5eedd6776edd765f8143eeb43c5e66e187d19ca"
  "5353221fcd406aae20c992d5cd254b11a09cb37ddcda06468573e4ce03b67e45"
)

fail_closed() {
  failure_class="$1"
  if [ -n "${WRAPPER_STATUS_FILE-}" ] && [ -f "$WRAPPER_STATUS_FILE" ] && [ ! -L "$WRAPPER_STATUS_FILE" ]; then
    printf 'result=FAILED\nfailure_class=%s\n' "$failure_class" > "$WRAPPER_STATUS_FILE"
    chmod 600 "$WRAPPER_STATUS_FILE" || exit 97
  fi
  exit 1
}

require_fixed_bindings() {
  [ "$#" -eq 0 ] || fail_closed "ARGUMENTS_PROHIBITED"
  [ "$EXPECTED_EXECUTION_BASELINE" != "__BIND_AT_EXECUTION_GATE__" ] || fail_closed "BASELINE_UNBOUND"
  [ "$NODE_EXECUTABLE" != "__BIND_AT_EXECUTION_GATE__" ] || fail_closed "NODE_EXECUTABLE_UNBOUND"
  [ -n "$NODE_EXECUTABLE" ] || fail_closed "NODE_EXECUTABLE_UNBOUND"
  [ "${NODE_EXECUTABLE#/}" != "$NODE_EXECUTABLE" ] || fail_closed "NODE_EXECUTABLE_NOT_ABSOLUTE"
}

read_fixed_origin() {
  /usr/bin/awk '
    /^\[remote "origin"\]$/ { in_origin = 1; next }
    /^\[/ { in_origin = 0 }
    in_origin && /^[[:space:]]*url[[:space:]]*=/ {
      sub(/^[^=]*=[[:space:]]*/, "")
      print
      exit
    }
  ' "$REPOSITORY_PATH/.git/config"
}

sha256_file() {
  /usr/bin/shasum -a 256 "$1" | /usr/bin/awk '{print $1}'
}

mode_file() {
  /usr/bin/stat -f '%Lp' "$1"
}

verify_file_identity() {
  relative_path="$1"
  expected_hash="$2"
  expected_mode="$3"
  absolute_path="$REPOSITORY_PATH/$relative_path"
  [ -f "$absolute_path" ] && [ ! -L "$absolute_path" ] || fail_closed "FILE_IDENTITY_MISMATCH"
  [ "$(sha256_file "$absolute_path")" = "$expected_hash" ] || fail_closed "FILE_IDENTITY_MISMATCH"
  [ "$(mode_file "$absolute_path")" = "$expected_mode" ] || fail_closed "FILE_MODE_MISMATCH"
}

verify_git_version_text() {
  version_text="$1"
  case "$version_text" in
    "git version "[0-9]*.[0-9]*.[0-9]*) ;;
    *) fail_closed "GIT_VERSION_MALFORMED" ;;
  esac
  version_number=${version_text#git version }
  version_major=${version_number%%.*}
  version_tail=${version_number#*.}
  version_minor=${version_tail%%.*}
  version_patch=${version_tail#*.}
  case "$version_major:$version_minor:$version_patch" in
    *[!0-9:]*|::*|*::*|*:) fail_closed "GIT_VERSION_MALFORMED" ;;
  esac
  if [ "$version_major" -lt 2 ] \
    || { [ "$version_major" -eq 2 ] && [ "$version_minor" -lt 35 ]; } \
    || { [ "$version_major" -eq 2 ] && [ "$version_minor" -eq 35 ] && [ "$version_patch" -lt 2 ]; }; then
    fail_closed "GIT_VERSION_UNSUPPORTED"
  fi
}

verify_repository_preconditions() {
  [ "$(pwd -P)" = "$REPOSITORY_PATH" ] || fail_closed "REPOSITORY_PATH_MISMATCH"
  [ -f "$GIT_EXECUTABLE" ] && [ -x "$GIT_EXECUTABLE" ] || fail_closed "GIT_EXECUTABLE_UNAVAILABLE"
  [ -c /dev/null ] && [ -r /dev/null ] && [ -w /dev/null ] || fail_closed "DEV_NULL_UNAVAILABLE"
  version_text=$(/usr/bin/env -i LANG=C LC_ALL=C GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null GIT_OPTIONAL_LOCKS=0 GIT_TERMINAL_PROMPT=0 GIT_PAGER=cat PAGER=cat "$GIT_EXECUTABLE" --version) \
    || fail_closed "GIT_VERSION_COMMAND_FAILED"
  verify_git_version_text "$version_text"
  branch=$(/usr/bin/env -i LANG=C LC_ALL=C GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null GIT_OPTIONAL_LOCKS=0 GIT_TERMINAL_PROMPT=0 GIT_PAGER=cat PAGER=cat "$GIT_EXECUTABLE" "${GIT_CONFIG_OVERRIDE_ARGS[@]}" branch --show-current) \
    || fail_closed "BRANCH_CHECK_FAILED"
  [ "$branch" = "$EXPECTED_BRANCH" ] || fail_closed "BRANCH_MISMATCH"
  head_sha=$(/usr/bin/env -i LANG=C LC_ALL=C GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null GIT_OPTIONAL_LOCKS=0 GIT_TERMINAL_PROMPT=0 GIT_PAGER=cat PAGER=cat "$GIT_EXECUTABLE" "${GIT_CONFIG_OVERRIDE_ARGS[@]}" rev-parse HEAD) \
    || fail_closed "HEAD_CHECK_FAILED"
  [ "$head_sha" = "$EXPECTED_EXECUTION_BASELINE" ] || fail_closed "BASELINE_MISMATCH"
  origin=$(read_fixed_origin) || fail_closed "ORIGIN_CHECK_FAILED"
  [ "$origin" = "$EXPECTED_ORIGIN" ] || fail_closed "ORIGIN_MISMATCH"
  status_text=$(/usr/bin/env -i LANG=C LC_ALL=C GIT_CONFIG_NOSYSTEM=1 GIT_CONFIG_GLOBAL=/dev/null GIT_OPTIONAL_LOCKS=0 GIT_TERMINAL_PROMPT=0 GIT_PAGER=cat PAGER=cat "$GIT_EXECUTABLE" "${GIT_CONFIG_OVERRIDE_ARGS[@]}" status --porcelain --untracked-files=all) \
    || fail_closed "STATUS_CHECK_FAILED"
  expected_status=$(printf '?? %s\n?? %s\n?? %s\n?? %s\n?? %s' "${EXCLUDED_PATHS[0]}" "${EXCLUDED_PATHS[1]}" "${EXCLUDED_PATHS[2]}" "${EXCLUDED_PATHS[3]}" "${EXCLUDED_PATHS[4]}")
  [ "$status_text" = "$expected_status" ] || fail_closed "REPOSITORY_STATE_MISMATCH"
  excluded_index=0
  while [ "$excluded_index" -lt 5 ]; do
    verify_file_identity "${EXCLUDED_PATHS[$excluded_index]}" "${EXCLUDED_HASHES[$excluded_index]}" "644"
    excluded_index=$((excluded_index + 1))
  done
}

verify_committed_source_identities() {
  verify_file_identity "$RUNTIME_HARNESS_PATH" "$RUNTIME_HARNESS_SHA256" "$RUNTIME_HARNESS_MODE"
  verify_file_identity "$STATIC_CONTRACT_TEST_PATH" "$STATIC_CONTRACT_TEST_SHA256" "$STATIC_CONTRACT_TEST_MODE"
  verify_file_identity "$VALIDATOR_PATH" "$VALIDATOR_SHA256" "$VALIDATOR_MODE"
  verify_file_identity "$EXECUTION_CONTRACT_TEST_PATH" "$EXECUTION_CONTRACT_TEST_SHA256" "$EXECUTION_CONTRACT_TEST_MODE"
  [ -f "$REPOSITORY_PATH/$WRAPPER_CANDIDATE_PATH" ] && [ ! -L "$REPOSITORY_PATH/$WRAPPER_CANDIDATE_PATH" ] \
    || fail_closed "WRAPPER_IDENTITY_MISMATCH"
}

prepare_output_directory() {
  umask 077
  timestamp=$(/bin/date -u '+%Y%m%dT%H%M%SZ') || fail_closed "TIMESTAMP_FAILED"
  OUTPUT_DIRECTORY=$(/usr/bin/mktemp -d "${TMP_ROOT_PREFIX}${timestamp}-XXXXXX") || fail_closed "TEMP_DIRECTORY_FAILED"
  [ -d "$OUTPUT_DIRECTORY" ] && [ ! -L "$OUTPUT_DIRECTORY" ] || fail_closed "TEMP_DIRECTORY_INVALID"
  chmod 700 "$OUTPUT_DIRECTORY" || fail_closed "TEMP_PERMISSION_FAILED"
  HARNESS_CANDIDATE_FILE="$OUTPUT_DIRECTORY/harness-candidate.json"
  VALIDATOR_RESULT_FILE="$OUTPUT_DIRECTORY/validator-result.json"
  WRAPPER_STATUS_FILE="$OUTPUT_DIRECTORY/wrapper-status.txt"
  BOUNDED_REVIEW_FILE="$OUTPUT_DIRECTORY/bounded-review.txt"
  STDOUT_CAPTURE_FILE="$OUTPUT_DIRECTORY/stdout.capture"
  STDERR_CAPTURE_FILE="$OUTPUT_DIRECTORY/stderr.capture"
  TIMEOUT_MARKER_FILE="$OUTPUT_DIRECTORY/timeout.marker"
  for output_file in "$HARNESS_CANDIDATE_FILE" "$VALIDATOR_RESULT_FILE" "$WRAPPER_STATUS_FILE" "$BOUNDED_REVIEW_FILE" "$STDOUT_CAPTURE_FILE" "$STDERR_CAPTURE_FILE" "$TIMEOUT_MARKER_FILE"; do
    [ ! -e "$output_file" ] && [ ! -L "$output_file" ] || fail_closed "TEMP_OUTPUT_PREEXISTS"
    : > "$output_file" || fail_closed "TEMP_OUTPUT_CREATE_FAILED"
    chmod 600 "$output_file" || fail_closed "TEMP_PERMISSION_FAILED"
  done
}

run_harness_with_watchdog() {
  "$NODE_EXECUTABLE" "$REPOSITORY_PATH/$RUNTIME_HARNESS_PATH" >> "$STDOUT_CAPTURE_FILE" 2>> "$STDERR_CAPTURE_FILE" &
  child_pid=$!
  (
    /bin/sleep "$OUTER_TIMEOUT_SECONDS"
    if /bin/kill -0 "$child_pid" 2> /dev/null; then
      printf 'TIMEOUT\n' > "$TIMEOUT_MARKER_FILE"
      /bin/kill -KILL "$child_pid" 2> /dev/null
    fi
  ) &
  watchdog_pid=$!
  wait "$child_pid"
  child_status=$?
  /bin/kill "$watchdog_pid" 2> /dev/null
  wait "$watchdog_pid" 2> /dev/null
  [ ! -s "$TIMEOUT_MARKER_FILE" ] || fail_closed "OUTER_TIMEOUT"
  return "$child_status"
}

run_future_authorized_static_checks() {
  "$NODE_EXECUTABLE" --check "$REPOSITORY_PATH/$RUNTIME_HARNESS_PATH" >> "$STDOUT_CAPTURE_FILE" 2>> "$STDERR_CAPTURE_FILE" \
    || fail_closed "HARNESS_SYNTAX_CHECK_FAILED"
  "$NODE_EXECUTABLE" --check "$REPOSITORY_PATH/$STATIC_CONTRACT_TEST_PATH" >> "$STDOUT_CAPTURE_FILE" 2>> "$STDERR_CAPTURE_FILE" \
    || fail_closed "STATIC_TEST_SYNTAX_CHECK_FAILED"
  "$NODE_EXECUTABLE" --check "$REPOSITORY_PATH/$VALIDATOR_PATH" >> "$STDOUT_CAPTURE_FILE" 2>> "$STDERR_CAPTURE_FILE" \
    || fail_closed "VALIDATOR_SYNTAX_CHECK_FAILED"
  "$NODE_EXECUTABLE" --check "$REPOSITORY_PATH/$EXECUTION_CONTRACT_TEST_PATH" >> "$STDOUT_CAPTURE_FILE" 2>> "$STDERR_CAPTURE_FILE" \
    || fail_closed "EXECUTION_TEST_SYNTAX_CHECK_FAILED"
  /bin/bash -n "$0" >> "$STDOUT_CAPTURE_FILE" 2>> "$STDERR_CAPTURE_FILE" \
    || fail_closed "WRAPPER_SYNTAX_CHECK_FAILED"
  "$NODE_EXECUTABLE" --test "$REPOSITORY_PATH/$STATIC_CONTRACT_TEST_PATH" "$REPOSITORY_PATH/$EXECUTION_CONTRACT_TEST_PATH" \
    >> "$STDOUT_CAPTURE_FILE" 2>> "$STDERR_CAPTURE_FILE" || fail_closed "STATIC_TEST_EXECUTION_FAILED"
}

extract_and_validate_bounded_evidence() {
  combined_bytes=$(( $(/usr/bin/wc -c < "$STDOUT_CAPTURE_FILE") + $(/usr/bin/wc -c < "$STDERR_CAPTURE_FILE") ))
  [ "$combined_bytes" -le "$MAX_COMBINED_LOG_BYTES" ] || fail_closed "COMBINED_OUTPUT_LIMIT_EXCEEDED"
  last_line=""
  while IFS= read -r captured_line; do
    last_line=$captured_line
  done < "$STDOUT_CAPTURE_FILE"
  printf '%s\n' "$last_line" > "$HARNESS_CANDIDATE_FILE" || fail_closed "EVIDENCE_EXTRACTION_FAILED"
  chmod 600 "$HARNESS_CANDIDATE_FILE" || fail_closed "TEMP_PERMISSION_FAILED"
  candidate_bytes=$(/usr/bin/wc -c < "$HARNESS_CANDIDATE_FILE")
  [ "$candidate_bytes" -le "$MAX_VALIDATOR_INPUT_BYTES" ] || fail_closed "VALIDATOR_INPUT_LIMIT_EXCEEDED"
  "$NODE_EXECUTABLE" "$REPOSITORY_PATH/$VALIDATOR_PATH" "$HARNESS_CANDIDATE_FILE" > "$VALIDATOR_RESULT_FILE" 2> /dev/null
  validator_status=$?
  [ "$validator_status" -eq 0 ] || fail_closed "EVIDENCE_VALIDATION_REJECTED"
  /bin/cp "$HARNESS_CANDIDATE_FILE" "$BOUNDED_REVIEW_FILE" || fail_closed "BOUNDED_EVIDENCE_PRESERVE_FAILED"
  chmod 600 "$BOUNDED_REVIEW_FILE" || fail_closed "TEMP_PERMISSION_FAILED"
  : > "$STDOUT_CAPTURE_FILE"
  : > "$STDERR_CAPTURE_FILE"
  chmod 600 "$STDOUT_CAPTURE_FILE" "$STDERR_CAPTURE_FILE" || fail_closed "TEMP_PERMISSION_FAILED"
}

finalize_delivery() {
  verify_repository_preconditions
  printf 'result=PASSED\nchild_status=%s\nvalidator_status=0\npost_run_state=VERIFIED\n' "$1" > "$WRAPPER_STATUS_FILE"
  chmod 600 "$WRAPPER_STATUS_FILE" || fail_closed "TEMP_PERMISSION_FAILED"
  /usr/bin/pbcopy < "$BOUNDED_REVIEW_FILE" || fail_closed "CLIPBOARD_UNAVAILABLE"
}

main() {
  require_fixed_bindings
  verify_repository_preconditions
  verify_committed_source_identities
  prepare_output_directory
  run_future_authorized_static_checks
  run_harness_with_watchdog
  harness_status=$?
  extract_and_validate_bounded_evidence
  finalize_delivery "$harness_status"
  exit "$harness_status"
}

main
