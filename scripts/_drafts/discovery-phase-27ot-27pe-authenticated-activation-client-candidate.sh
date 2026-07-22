#!/bin/bash
# Static thin-client candidate for a protected AiFinder launch boundary.
# It owns no trust, replay state, connection material, journal, or launch ability.
# A future protected parent must preopen, validate, measure, and inherit every FD.

set -u

readonly REQUEST_TYPE='AIFINDER_PROTECTED_LAUNCH_REQUEST'
readonly REQUEST_VERSION='1'
readonly PHASE='PHASE_27NM_27OL_LIVE_PREFLIGHT_ACTIVATION_READINESS_SYNTHETIC_ASSURANCE_AND_DOWNSTREAM_DEPENDENCY_CONSOLIDATION'

fail() {
  printf '%s\n' 'PROTECTED_LAUNCH_REQUEST_FAILED' >&2
  return 1
}

is_sha256() {
  [[ ${1-} =~ ^[0-9a-f]{64}$ ]]
}

is_commit() {
  [[ ${1-} =~ ^[0-9a-f]{40}$ ]]
}

is_request_id() {
  [[ ${1-} =~ ^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$ ]]
}

is_fd() {
  [[ ${1-} =~ ^([3-9]|[1-9][0-9]|[1-9][0-9][0-9]|10[0-1][0-9]|102[0-3])$ ]]
}

normalize_fd() {
  is_fd "$1" || return 1
  printf '%d' "$1"
}

main() {
  local request_channel_fd=''
  local operation=''
  local repository_baseline=''
  local environment_classification=''
  local assertion_fd=''
  local sql_fd=''
  local activation_manifest_fd=''
  local validator_fd=''
  local psql_fd=''
  local output_directory_fd=''
  local activation_client_sha256=''
  local assertion_sha256=''
  local sql_sha256=''
  local activation_manifest_sha256=''
  local validator_sha256=''
  local output_contract_sha256=''
  local psql_sha256=''
  local output_directory_identity_sha256=''
  local connection_profile_identity_sha256=''
  local consume_request_id=''
  local key value

  while (( $# > 0 )); do
    (( $# == 1 )) && return 1
    key=$1
    value=$2
    shift 2
    case "$key" in
      --request-channel-fd) [[ -z $request_channel_fd ]] || return 1; request_channel_fd=$value ;;
      --operation) [[ -z $operation ]] || return 1; operation=$value ;;
      --repository-baseline) [[ -z $repository_baseline ]] || return 1; repository_baseline=$value ;;
      --environment) [[ -z $environment_classification ]] || return 1; environment_classification=$value ;;
      --assertion-fd) [[ -z $assertion_fd ]] || return 1; assertion_fd=$value ;;
      --sql-fd) [[ -z $sql_fd ]] || return 1; sql_fd=$value ;;
      --activation-manifest-fd) [[ -z $activation_manifest_fd ]] || return 1; activation_manifest_fd=$value ;;
      --validator-fd) [[ -z $validator_fd ]] || return 1; validator_fd=$value ;;
      --psql-fd) [[ -z $psql_fd ]] || return 1; psql_fd=$value ;;
      --output-directory-fd) [[ -z $output_directory_fd ]] || return 1; output_directory_fd=$value ;;
      --activation-client-sha256) [[ -z $activation_client_sha256 ]] || return 1; activation_client_sha256=$value ;;
      --assertion-sha256) [[ -z $assertion_sha256 ]] || return 1; assertion_sha256=$value ;;
      --sql-sha256) [[ -z $sql_sha256 ]] || return 1; sql_sha256=$value ;;
      --activation-manifest-sha256) [[ -z $activation_manifest_sha256 ]] || return 1; activation_manifest_sha256=$value ;;
      --validator-sha256) [[ -z $validator_sha256 ]] || return 1; validator_sha256=$value ;;
      --output-contract-sha256) [[ -z $output_contract_sha256 ]] || return 1; output_contract_sha256=$value ;;
      --psql-sha256) [[ -z $psql_sha256 ]] || return 1; psql_sha256=$value ;;
      --output-directory-identity-sha256) [[ -z $output_directory_identity_sha256 ]] || return 1; output_directory_identity_sha256=$value ;;
      --connection-profile-identity-sha256) [[ -z $connection_profile_identity_sha256 ]] || return 1; connection_profile_identity_sha256=$value ;;
      --consume-request-id) [[ -z $consume_request_id ]] || return 1; consume_request_id=$value ;;
      *) return 1 ;;
    esac
  done

  request_channel_fd=$(normalize_fd "$request_channel_fd") || return 1
  assertion_fd=$(normalize_fd "$assertion_fd") || return 1
  sql_fd=$(normalize_fd "$sql_fd") || return 1
  activation_manifest_fd=$(normalize_fd "$activation_manifest_fd") || return 1
  validator_fd=$(normalize_fd "$validator_fd") || return 1
  psql_fd=$(normalize_fd "$psql_fd") || return 1
  output_directory_fd=$(normalize_fd "$output_directory_fd") || return 1

  is_commit "$repository_baseline" || return 1
  is_request_id "$consume_request_id" || return 1
  case "$environment_classification" in
    LOCAL|PREVIEW|STAGING|PRODUCTION) ;;
    *) return 1 ;;
  esac
  case "$operation" in
    CONSUME_AND_CLAIM|RECOVER_AND_CLAIM) ;;
    *) return 1 ;;
  esac

  local digest
  for digest in \
    "$activation_client_sha256" \
    "$assertion_sha256" \
    "$sql_sha256" \
    "$activation_manifest_sha256" \
    "$validator_sha256" \
    "$output_contract_sha256" \
    "$psql_sha256" \
    "$output_directory_identity_sha256" \
    "$connection_profile_identity_sha256"
  do
    is_sha256 "$digest" || return 1
  done

  local seen_fds=' '
  local descriptor
  for descriptor in \
    "$request_channel_fd" \
    "$assertion_fd" \
    "$sql_fd" \
    "$activation_manifest_fd" \
    "$validator_fd" \
    "$psql_fd" \
    "$output_directory_fd"
  do
    case "$seen_fds" in
      *" $descriptor "*) return 1 ;;
    esac
    seen_fds="${seen_fds}${descriptor} "
  done

  local request
  request="{\"activation_client_sha256\":\"${activation_client_sha256}\",\"activation_manifest_fd\":${activation_manifest_fd},\"activation_manifest_sha256\":\"${activation_manifest_sha256}\",\"assertion_fd\":${assertion_fd},\"assertion_sha256\":\"${assertion_sha256}\",\"connection_profile_identity_sha256\":\"${connection_profile_identity_sha256}\",\"consume_request_id\":\"${consume_request_id}\",\"environment_classification\":\"${environment_classification}\",\"operation\":\"${operation}\",\"output_contract_sha256\":\"${output_contract_sha256}\",\"output_directory_fd\":${output_directory_fd},\"output_directory_identity_sha256\":\"${output_directory_identity_sha256}\",\"phase\":\"${PHASE}\",\"psql_fd\":${psql_fd},\"psql_sha256\":\"${psql_sha256}\",\"repository_baseline\":\"${repository_baseline}\",\"sql_fd\":${sql_fd},\"sql_sha256\":\"${sql_sha256}\",\"type\":\"${REQUEST_TYPE}\",\"validator_fd\":${validator_fd},\"validator_sha256\":\"${validator_sha256}\",\"version\":${REQUEST_VERSION}}"

  (( ${#request} <= 8192 )) || return 1
  printf '%s' "$request" >&"$request_channel_fd" || return 1
  return 0
}

if ! main "$@"; then
  fail
  exit 1
fi
exit 0
