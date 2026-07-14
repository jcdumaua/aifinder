#!/usr/bin/env bash
set -u
set -o pipefail

# NON-EXECUTED REVIEWED STATIC CANDIDATE.
# This file is intentionally mode 100644.
# Do not execute until a separate live-execution gate supplies and approves:
# - the exact execution baseline,
# - the exact timeout,
# - confirmed non-secret selectors,
# - explicit one-request operator authorization.

EXPECTED_REPO="/Users/jamescarlodumaua/aifinder"
EXPECTED_ORIGIN="https://github.com/jcdumaua/aifinder.git"
EXPECTED_BRANCH="main"
APPROVED_BASELINE="96f91601611e7d0be168e68fa6d5554aa76fa1a3"
EXPECTED_RESULT_COUNT="1"
RETRY_COUNT="0"
TIMEOUT_SECONDS="15"
ADAPTER_LABEL="VERCEL_LIST_DEPLOYMENTS_READ_ONLY_V1"
PLATFORM_CATEGORY="VERCEL"

fail() {
  local reason="${1-}"
  case "$reason" in
    REPOSITORY_PATH_MISMATCH) ;;
    ORIGIN_MISMATCH) ;;
    BRANCH_MISMATCH) ;;
    FETCH_FAILED) ;;
    BASELINE_MISMATCH) ;;
    REMOTE_BASELINE_MISMATCH) ;;
    AHEAD_OF_ORIGIN) ;;
    BEHIND_ORIGIN) ;;
    WORKING_TREE_NOT_CLEAN) ;;
    RETRY_POLICY_MISMATCH) ;;
    EXPECTED_COUNT_MISMATCH) ;;
    TIMEOUT_NOT_REVIEWED) ;;
    EXECUTION_BASELINE_NOT_REVIEWED) ;;
    ADAPTER_LABEL_MISMATCH) ;;
    PLATFORM_CATEGORY_MISMATCH) ;;
    SINGLE_REQUEST_NOT_AUTHORIZED) ;;
    TOKEN_REFERENCE_MISSING) ;;
    PROJECT_SELECTOR_MISSING) ;;
    TEAM_SELECTOR_MISSING) ;;
    UNEXPECTED_TEAM_SELECTOR) ;;
    TEAM_CONTEXT_CONFIRMATION_INVALID) ;;
    SENSITIVE_OR_PRIVATE_SELECTOR_INPUT_DETECTED) ;;
    *) reason="UNKNOWN_FAIL_CLOSED_REASON" ;;
  esac
  printf 'STOPPED_FAIL_CLOSED\n'
  printf 'stop_reason=%s\n' "$reason"
  return 1
}

cleanup_files() {
  [[ -n "${raw_file:-}" ]] && rm -f -- "$raw_file"
  [[ -n "${normalized_file:-}" ]] && rm -f -- "$normalized_file"
  [[ -n "${header_file:-}" ]] && rm -f -- "$header_file"
}

main() {
  local token="${AIFINDER_VERCEL_READ_ONLY_TOKEN:-}"
  local project_selector="${AIFINDER_VERCEL_PROJECT_SELECTOR:-}"
  local team_selector="${AIFINDER_VERCEL_TEAM_SELECTOR:-}"
  local team_context_required="${AIFINDER_VERCEL_TEAM_CONTEXT_REQUIRED:-no}"
  local single_request_authorized="${AIFINDER_SINGLE_REQUEST_AUTHORIZED:-no}"
  local raw_file normalized_file header_file
  local request_url http_code curl_rc parser_rc result_count

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
  [[ "$TIMEOUT_SECONDS" =~ ^[1-9][0-9]*$ ]] \
    || fail "TIMEOUT_NOT_REVIEWED" || return 1
  [[ "$APPROVED_BASELINE" =~ ^[0-9a-f]{40}$ ]] \
    || fail "EXECUTION_BASELINE_NOT_REVIEWED" || return 1
  [[ "$ADAPTER_LABEL" == "VERCEL_LIST_DEPLOYMENTS_READ_ONLY_V1" ]] \
    || fail "ADAPTER_LABEL_MISMATCH" || return 1
  [[ "$PLATFORM_CATEGORY" == "VERCEL" ]] \
    || fail "PLATFORM_CATEGORY_MISMATCH" || return 1
  [[ "$single_request_authorized" == "yes" ]] \
    || fail "SINGLE_REQUEST_NOT_AUTHORIZED" || return 1

  [[ -n "$token" ]] || fail "TOKEN_REFERENCE_MISSING" || return 1
  [[ -n "$project_selector" ]] || fail "PROJECT_SELECTOR_MISSING" || return 1
  case "$team_context_required" in
    yes) [[ -n "$team_selector" ]] || fail "TEAM_SELECTOR_MISSING" || return 1 ;;
    no) [[ -z "$team_selector" ]] || fail "UNEXPECTED_TEAM_SELECTOR" || return 1 ;;
    *) fail "TEAM_CONTEXT_CONFIRMATION_INVALID"; return 1 ;;
  esac

  case "$project_selector$team_selector" in
    *password*|*secret*|*token*|*cookie*|*://*|*@*)
      fail "SENSITIVE_OR_PRIVATE_SELECTOR_INPUT_DETECTED"
      return 1
      ;;
  esac

  printf "DIAGNOSTIC_TRACE: PREFLIGHT_VALIDATION_PASSED\n"

  raw_file="$(mktemp)"
  normalized_file="$(mktemp)"
  header_file="$(mktemp)"
  chmod 0600 "$raw_file" "$normalized_file" "$header_file"
  trap cleanup_files EXIT

  request_url="https://api.vercel.com/v7/deployments?projectId=${project_selector}&target=production&branch=main&limit=1"
  if [[ "$team_context_required" == "yes" ]]; then
    request_url="${request_url}&teamId=${team_selector}"
  fi

  http_code="$(
    curl \
      --silent \
      --show-error \
      --request GET \
      --max-time "$TIMEOUT_SECONDS" \
      --max-redirs 0 \
      --output "$raw_file" \
      --dump-header "$header_file" \
      --write-out '%{http_code}' \
      --header "Authorization: Bearer ${token}" \
      --header 'Accept: application/json' \
      "$request_url"
  )"
  curl_rc=$?

  printf "DIAGNOSTIC_TRACE: CURL_EXIT=%d HTTP_CODE=%s\n" "$curl_rc" "$http_code"

  token=""
  unset AIFINDER_VERCEL_READ_ONLY_TOKEN

  [[ "$curl_rc" == "0" ]] \
    || fail "ADAPTER_NONZERO_EXIT" || return "$curl_rc"
  [[ "$http_code" == "200" ]] \
    || fail "HTTP_STATUS_NOT_ALLOWED" || return 1

  if grep -Eiq \
    '(password|secret|token|cookie|connection[_ -]?string|private[_ -]?url)' \
    "$raw_file" "$header_file"; then
    fail "SECRET_LIKE_OUTPUT_DETECTED"
    return 1
  fi

  python3 - "$raw_file" "$normalized_file" "$project_selector" <<'PY'
import json
import sys
from pathlib import Path

raw_path = Path(sys.argv[1])
normalized_path = Path(sys.argv[2])
expected_project = sys.argv[3]

STOP_REASONS = {
    "NONE",
    "INVALID_TOP_LEVEL",
    "DEPLOYMENTS_NOT_ARRAY",
    "RESULT_COUNT_EXCEEDED",
    "INVALID_ITEM",
    "PARSER_ERROR",
}
STATE_MAP = {
    "READY": "READY",
    "BUILDING": "BUILDING",
    "QUEUED": "QUEUED",
    "ERROR": "ERROR",
    "CANCELED": "CANCELED",
    "CANCELLED": "CANCELED",
}

def emit(**values):
    ordered = [
        "operation_type",
        "read_only",
        "repository_match",
        "branch_match",
        "deployment_record_present",
        "deployment_state_classification",
        "reviewed_identifier_present",
        "result_count",
        "stop_reason",
        "exit_status",
    ]
    normalized_path.write_text(
        " ".join(f"{key}={values[key]}" for key in ordered) + "\n"
    )

try:
    data = json.loads(raw_path.read_text())
    if not isinstance(data, dict):
        raise ValueError("INVALID_TOP_LEVEL")
    deployments = data.get("deployments")
    if not isinstance(deployments, list):
        raise ValueError("DEPLOYMENTS_NOT_ARRAY")
    if len(deployments) > 1:
        raise ValueError("RESULT_COUNT_EXCEEDED")

    if not deployments:
        emit(
            operation_type="VERCEL_LIST_DEPLOYMENTS",
            read_only="true",
            repository_match="indeterminate",
            branch_match="indeterminate",
            deployment_record_present="false",
            deployment_state_classification="ABSENT",
            reviewed_identifier_present="false",
            result_count="0",
            stop_reason="NONE",
            exit_status="0",
        )
        sys.exit(0)

    item = deployments[0]
    if not isinstance(item, dict):
        raise ValueError("INVALID_ITEM")

    project_match = str(item.get("projectId", "")) == expected_project
    meta = item.get("meta")
    branch_value = None
    if isinstance(meta, dict):
        branch_value = meta.get("githubCommitRef")
    branch_match = (
        "true" if branch_value == "main"
        else "false" if isinstance(branch_value, str)
        else "indeterminate"
    )

    raw_state = item.get("readyState", item.get("state", ""))
    state = STATE_MAP.get(str(raw_state).upper(), "UNKNOWN")

    emit(
        operation_type="VERCEL_LIST_DEPLOYMENTS",
        read_only="true",
        repository_match="true" if project_match else "false",
        branch_match=branch_match,
        deployment_record_present="true",
        deployment_state_classification=state,
        reviewed_identifier_present="true" if bool(item.get("uid")) else "false",
        result_count="1",
        stop_reason="NONE",
        exit_status="0",
    )
except ValueError as exc:
    reason = str(exc)
    if reason not in STOP_REASONS:
        reason = "PARSER_ERROR"
    emit(
        operation_type="VERCEL_LIST_DEPLOYMENTS",
        read_only="true",
        repository_match="indeterminate",
        branch_match="indeterminate",
        deployment_record_present="false",
        deployment_state_classification="STOPPED_FAIL_CLOSED",
        reviewed_identifier_present="false",
        result_count="0",
        stop_reason=reason,
        exit_status="1",
    )
    sys.exit(1)
except Exception as e:
    sys.stderr.write(f"DIAGNOSTIC_TRACE: PARSER_EXCEPTION={type(e).__name__}\n")
    emit(
        operation_type="VERCEL_LIST_DEPLOYMENTS",
        read_only="true",
        repository_match="indeterminate",
        branch_match="indeterminate",
        deployment_record_present="false",
        deployment_state_classification="STOPPED_FAIL_CLOSED",
        reviewed_identifier_present="false",
        result_count="0",
        stop_reason="PARSER_ERROR",
        exit_status="1",
    )
    sys.exit(1)
PY
  parser_rc=$?

  [[ "$parser_rc" == "0" ]] \
    || fail "PARSER_FAILED" || return "$parser_rc"

  result_count="$(wc -l < "$normalized_file" | tr -d ' ')"
  [[ "$result_count" == "$EXPECTED_RESULT_COUNT" ]] \
    || fail "NORMALIZED_ROW_COUNT_MISMATCH" || return 1

  if grep -Eiq \
    '(https?://|password|secret|token|cookie|connection[_ -]?string|private[_ -]?url|@)' \
    "$normalized_file"; then
    fail "NORMALIZED_OUTPUT_SAFETY_CHECK_FAILED"
    return 1
  fi

  cat "$normalized_file"
  return "$parser_rc"
}

main
exit $?
