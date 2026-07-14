#!/usr/bin/env bash
set -u
set -o pipefail

# AiFinder GAP-060/061/062 single-use body-free execution wrapper.
# This source file is intentionally committed as mode 100644 and non-executable.
# A future reviewed execution gate may invoke it with bash only after fresh authorization.

readonly EXPECTED_CANDIDATE_SHA256="e27462d33a8a89b9b79f94c8d584fe8883518b91e51fb9531d3652d047775bfb"
readonly CANDIDATE_PATH="scripts/discovery-gap-060-062-read-only-metadata-check-candidate.sh"
readonly TOKEN_REFERENCE="AIFINDER_VERCEL_READ_ONLY_TOKEN"
readonly PROJECT_REFERENCE="AIFINDER_VERCEL_PROJECT_SELECTOR"
readonly TEAM_REFERENCE="AIFINDER_VERCEL_TEAM_SELECTOR"
readonly TIMEOUT_SECONDS="15"
readonly RETRY_COUNT="0"

is_allowlisted_reason() {
  case "${1-}" in
        "REPOSITORY_PATH_MISMATCH") return 0 ;;
        "ORIGIN_MISMATCH") return 0 ;;
        "BRANCH_MISMATCH") return 0 ;;
        "FETCH_FAILED") return 0 ;;
        "WRAPPER_BASELINE_MISMATCH") return 0 ;;
        "WRAPPER_REMOTE_BASELINE_MISMATCH") return 0 ;;
        "AHEAD_OF_ORIGIN") return 0 ;;
        "BEHIND_ORIGIN") return 0 ;;
        "WORKING_TREE_NOT_CLEAN") return 0 ;;
        "RETRY_POLICY_MISMATCH") return 0 ;;
        "EXPECTED_COUNT_MISMATCH") return 0 ;;
        "TIMEOUT_NOT_REVIEWED") return 0 ;;
        "EXECUTION_BASELINE_NOT_REVIEWED") return 0 ;;
        "ADAPTER_LABEL_MISMATCH") return 0 ;;
        "PLATFORM_CATEGORY_MISMATCH") return 0 ;;
        "SINGLE_REQUEST_NOT_AUTHORIZED") return 0 ;;
        "TOKEN_REFERENCE_MISSING") return 0 ;;
        "PROJECT_SELECTOR_MISSING") return 0 ;;
        "TEAM_SELECTOR_MISSING") return 0 ;;
        "UNEXPECTED_TEAM_SELECTOR") return 0 ;;
        "TEAM_CONTEXT_CONFIRMATION_INVALID") return 0 ;;
        "SENSITIVE_OR_PRIVATE_SELECTOR_INPUT_DETECTED") return 0 ;;
        "UNKNOWN_FAIL_CLOSED_REASON") return 0 ;;
        *) return 1 ;;
  esac
}

sanitize_observation() {
  local raw_file="$1"
  local sanitized_file="$2"

  RAW_FILE="$raw_file" SANITIZED_FILE="$sanitized_file" python3 - <<'PY_SANITIZER'
import os
import re
import sys
from pathlib import Path

allowed_reasons = {
        'REPOSITORY_PATH_MISMATCH',
        'ORIGIN_MISMATCH',
        'BRANCH_MISMATCH',
        'FETCH_FAILED',
        'BASELINE_MISMATCH',
        'REMOTE_BASELINE_MISMATCH',
        'AHEAD_OF_ORIGIN',
        'BEHIND_ORIGIN',
        'WORKING_TREE_NOT_CLEAN',
        'RETRY_POLICY_MISMATCH',
        'EXPECTED_COUNT_MISMATCH',
        'TIMEOUT_NOT_REVIEWED',
        'EXECUTION_BASELINE_NOT_REVIEWED',
        'ADAPTER_LABEL_MISMATCH',
        'PLATFORM_CATEGORY_MISMATCH',
        'SINGLE_REQUEST_NOT_AUTHORIZED',
        'TOKEN_REFERENCE_MISSING',
        'PROJECT_SELECTOR_MISSING',
        'TEAM_SELECTOR_MISSING',
        'UNEXPECTED_TEAM_SELECTOR',
        'TEAM_CONTEXT_CONFIRMATION_INVALID',
        'SENSITIVE_OR_PRIVATE_SELECTOR_INPUT_DETECTED',
        'UNKNOWN_FAIL_CLOSED_REASON'
}

raw_path = Path(os.environ["RAW_FILE"])
out_path = Path(os.environ["SANITIZED_FILE"])
lines = raw_path.read_text(errors="replace").splitlines()

fixed_marker = "STOPPED_FAIL_CLOSED"
patterns = {
    "preflight": re.compile(r"^DIAGNOSTIC_TRACE: PREFLIGHT_VALIDATION_PASSED$"),
    "curl": re.compile(r"^DIAGNOSTIC_TRACE: CURL_EXIT=[0-9]+ HTTP_CODE=(?:[0-9]{3}|000|unavailable|UNKNOWN)$"),
    "parser": re.compile(r"^DIAGNOSTIC_TRACE: PARSER_EXCEPTION=[A-Za-z_][A-Za-z0-9_]*$"),
}
stop_reason_re = re.compile(r"^stop_reason=([A-Z][A-Z0-9_]*)$")

deny = re.compile(
    r"(?i)(authorization:|bearer |token|secret|cookie|password|"
    r"https?://|project[_ -]?id|team[_ -]?id|deployment[_ -]?id|"
    r"request[_ -]?url|response[_ -]?body|set-cookie|traceback|"
    r"AIFINDER_VERCEL_|raw_file|normalized_file|header_file)"
)

counts = {
    "marker": 0,
    "stop_reason": 0,
    "preflight": 0,
    "curl": 0,
    "parser": 0,
}
safe = []
unknown_nonempty = 0
denylisted = 0
malformed_approved_prefix = 0

for line in lines:
    # Exact approved forms are evaluated before the broad denylist.
    # Their full-match contracts make them safe even when a symbolic token
    # contains words such as TOKEN, PROJECT, TEAM, or PATH.
    if line == fixed_marker:
        counts["marker"] += 1
        safe.append(line)
        continue

    stop_match = stop_reason_re.fullmatch(line)
    if stop_match:
        if stop_match.group(1) not in allowed_reasons:
            malformed_approved_prefix += 1
        else:
            counts["stop_reason"] += 1
            safe.append(line)
        continue

    matched = False
    for name, pattern in patterns.items():
        if pattern.fullmatch(line):
            counts[name] += 1
            safe.append(line)
            matched = True
            break
    if matched:
        continue

    # The broad denylist applies only to output that failed every exact
    # approved-form check above.
    if deny.search(line):
        denylisted += 1
        continue

    # Admission of provenance markers
    if line.startswith("DIAGNOSTIC_TRACE: WRAPPER_INVOCATION_PROVENANCE") or \
       line.startswith("DIAGNOSTIC_TRACE: WRAPPER_STATUS_PROVENANCE"):
        safe.append(line)
        continue

    if line.startswith("STOPPED_FAIL_CLOSED") or line.startswith("stop_reason=") or line.startswith("DIAGNOSTIC_TRACE:"):
        malformed_approved_prefix += 1
    elif line.strip():
        unknown_nonempty += 1

if denylisted:
    print("Denylisted output detected.", file=sys.stderr)
    sys.exit(61)

if malformed_approved_prefix:
    print("Malformed approved-prefix output detected.", file=sys.stderr)
    sys.exit(62)

if any(value > 1 for value in counts.values()):
    print("Duplicate allowlisted output detected.", file=sys.stderr)
    sys.exit(63)

output = [
    "# Sanitized Body-Free Observation",
    "",
    "## Allowlisted output",
    "",
]
if safe:
    output.extend(f"- `{line}`" for line in safe)
else:
    output.append("- No allowlisted output was observed.")

output.extend([
    "",
    "## Sanitizer accounting",
    "",
    f"- Fixed marker count: `{counts['marker']}`",
    f"- Symbolic stop-reason count: `{counts['stop_reason']}`",
    f"- Preflight trace count: `{counts['preflight']}`",
    f"- Curl/HTTP trace count: `{counts['curl']}`",
    f"- Parser trace count: `{counts['parser']}`",
    f"- Unknown non-empty lines excluded: `{unknown_nonempty}`",
    "- Denylisted lines detected: `0`",
    "- Malformed approved-prefix lines detected: `0`",
    "- Response body included: `NO`",
    "- Raw output included: `NO`",
    "",
])

out_path.write_text("\n".join(output) + "\n")
PY_SANITIZER
}

main() {
  local expected_baseline="${AIFINDER_EXPECTED_BASELINE_SHA-}"
  local authorization_marker="${AIFINDER_SINGLE_USE_AUTHORIZATION_MARKER-}"
  local timestamp raw_file sanitized_file consumed_file candidate_rc sanitizer_rc

  [[ "$expected_baseline" =~ ^[0-9a-f]{40}$ ]] || {
    printf 'STOPPED_FAIL_CLOSED
'
    printf 'stop_reason=BASELINE_REFERENCE_INVALID
'
    return 1
  }

  [[ "$authorization_marker" == "AUTHORIZED_EXACTLY_ONE_INVOCATION" ]] || {
    printf 'STOPPED_FAIL_CLOSED
'
    printf 'stop_reason=AUTHORIZATION_MARKER_MISSING
'
    return 1
  }

  [[ "$(git rev-parse HEAD)" == "$expected_baseline" ]] || {
    printf 'STOPPED_FAIL_CLOSED
'
    printf 'stop_reason=BASELINE_MISMATCH
'
    return 1
  }

  [[ "$(git rev-parse origin/main)" == "$expected_baseline" ]] || {
    printf 'STOPPED_FAIL_CLOSED
'
    printf 'stop_reason=ORIGIN_BASELINE_MISMATCH
'
    return 1
  }

  [[ "$(git status --short --branch)" == "## main...origin/main" ]] || {
    printf 'STOPPED_FAIL_CLOSED
'
    printf 'stop_reason=WORKING_TREE_NOT_CLEAN
'
    return 1
  }

  [[ -f "$CANDIDATE_PATH" ]] || {
    printf 'STOPPED_FAIL_CLOSED
'
    printf 'stop_reason=CANDIDATE_PATH_MISSING
'
    return 1
  }

  [[ "$(shasum -a 256 "$CANDIDATE_PATH" | awk '{print $1}')" == "$EXPECTED_CANDIDATE_SHA256" ]] || {
    printf 'STOPPED_FAIL_CLOSED
'
    printf 'stop_reason=CANDIDATE_HASH_MISMATCH
'
    return 1
  }

  [[ "$(git ls-files -s -- "$CANDIDATE_PATH" | awk 'NR==1 {print $1}')" == "100644" && ! -x "$CANDIDATE_PATH" ]] || {
    printf 'STOPPED_FAIL_CLOSED
'
    printf 'stop_reason=CANDIDATE_MODE_MISMATCH
'
    return 1
  }

  bash -n "$CANDIDATE_PATH" || {
    printf 'STOPPED_FAIL_CLOSED
'
    printf 'stop_reason=CANDIDATE_SYNTAX_FAILURE
'
    return 1
  }

  [[ -n "${!TOKEN_REFERENCE-}" ]] || {
    printf 'STOPPED_FAIL_CLOSED
'
    printf 'stop_reason=TOKEN_REFERENCE_UNAVAILABLE
'
    return 1
  }

  [[ -n "${!PROJECT_REFERENCE-}" ]] || {
    printf 'STOPPED_FAIL_CLOSED
'
    printf 'stop_reason=PROJECT_REFERENCE_UNAVAILABLE
'
    return 1
  }

  [[ -z "${!TEAM_REFERENCE-}" ]] || {
    printf 'STOPPED_FAIL_CLOSED
'
    printf 'stop_reason=TEAM_REFERENCE_MUST_BE_ABSENT
'
    return 1
  }

  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  raw_file="/private/tmp/aifinder-single-use-raw-${timestamp}.log"
  sanitized_file="/private/tmp/aifinder-single-use-sanitized-${timestamp}.txt"
  consumed_file="/private/tmp/aifinder-single-use-consumed-${timestamp}.txt"

  umask 077
  : >"$raw_file"
  chmod 0600 "$raw_file"

  {
    printf 'authorization=CONSUMED
'
    printf 'candidate_sha256=%s
' "$EXPECTED_CANDIDATE_SHA256"
    printf 'consumed_at_utc=%s
' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  } >"$consumed_file"
  chmod 0600 "$consumed_file"

  # EXACTLY ONE candidate invocation. Never retry.
  set +e
  printf '%s\n' 'DIAGNOSTIC_TRACE: WRAPPER_INVOCATION_PROVENANCE'
  bash "$CANDIDATE_PATH" >"$raw_file" 2>&1
  candidate_rc=$?
  printf 'DIAGNOSTIC_TRACE: WRAPPER_STATUS_PROVENANCE=%s\n' "$candidate_rc"
  set -e

  set +e
  sanitize_observation "$raw_file" "$sanitized_file"
  sanitizer_rc=$?
  set -e

  if [[ "$sanitizer_rc" -ne 0 ]]; then
    printf 'SANITIZER_STATE=FAILED_CLOSED
'
    printf 'AUTHORIZATION_STATE=CONSUMED
'
    printf 'CANDIDATE_EXIT_STATUS=%d
' "$candidate_rc"
    printf 'RETRY_AUTHORIZED=NO
'
    return "$sanitizer_rc"
  fi

  cat "$sanitized_file"
  printf '
- Authorization consumed: `YES`
'
  printf -- '- Candidate invocations: `1`
'
  printf -- '- Candidate exit status: `%d`
' "$candidate_rc"
  printf -- '- Retry performed: `NO`
'
  printf -- '- Operational reactivation: `BLOCKED`
'

  return 0
}

main "$@"
exit $?
