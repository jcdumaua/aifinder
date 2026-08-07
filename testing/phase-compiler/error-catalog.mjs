const catalogDefinitions = {
  INPUT_TOO_LARGE: ['Input exceeds its declared byte bound.', 'REDUCE_INPUT_SIZE'],
  INVALID_UTF8: ['Input is not valid UTF-8.', 'REENCODE_UTF8'],
  UTF8_BOM_FORBIDDEN: ['A UTF-8 byte-order mark is forbidden.', 'REMOVE_UTF8_BOM'],
  NUL_BYTE_FORBIDDEN: ['NUL content is forbidden.', 'REMOVE_NUL'],
  CARRIAGE_RETURN_FORBIDDEN: ['Carriage returns are forbidden.', 'NORMALIZE_LF'],
  JSON_SYNTAX: ['Input is not valid strict JSON.', 'FIX_JSON_SYNTAX'],
  JSON_DUPLICATE_KEY: ['An object contains a duplicate JSON key.', 'REMOVE_DUPLICATE_KEY'],
  JSON_UNSAFE_INTEGER: ['An integer is outside the safe integer range.', 'USE_SAFE_INTEGER'],
  JSON_DEPTH_EXCEEDED: ['JSON nesting exceeds the supported bound.', 'REDUCE_JSON_DEPTH'],
  ERROR_CODE_UNKNOWN: ['A requested diagnostic code is not defined by this compiler version.', 'USE_DEFINED_ERROR_CODE'],
  COMPILER_INTERNAL_ERROR: ['An unexpected internal compiler failure occurred.', 'REPORT_COMPILER_INTERNAL_ERROR'],
  COMPILER_CAPABILITY_UNAVAILABLE: ['A required compiler publication capability is unavailable on this platform.', 'USE_SUPPORTED_COMPILER_PUBLICATION_RUNTIME'],
  UNICODE_NOT_NFC: ['A string is not NFC-normalized.', 'NORMALIZE_UNICODE_NFC'],
  UNICODE_LONE_SURROGATE: ['A string contains an unpaired surrogate.', 'REPLACE_LONE_SURROGATE'],
  SCHEMA_UNSUPPORTED_KEYWORD: ['A schema uses an unsupported keyword.', 'USE_SUPPORTED_SCHEMA_VOCABULARY'],
  SCHEMA_INVALID: ['A schema is outside the supported schema subset.', 'FIX_SCHEMA'],
  SCHEMA_VALIDATION: ['An instance does not satisfy its schema.', 'FIX_SCHEMA_INSTANCE'],
  SCHEMA_DEPTH_EXCEEDED: ['Schema or instance depth exceeds the supported bound.', 'REDUCE_SCHEMA_DEPTH'],
  SCHEMA_CONTRACT_VIOLATION: ['An authored phase specification violates the closed compiler schema contract.', 'FIX_PHASE_SPEC_SCHEMA_CONTRACT'],
  SPEC_DUPLICATE_KEY: ['An authored phase specification contains a duplicate JSON key.', 'REMOVE_SPEC_DUPLICATE_KEY'],
  SPEC_DERIVED_FIELD_AUTHORED: ['The authored specification contains a derived field.', 'REMOVE_DERIVED_FIELD'],
  PHASE_ID_INVALID: ['The phase identifier is invalid.', 'FIX_PHASE_ID'],
  AUTHORITY_ID_DUPLICATE: ['An authority-bearing identifier is duplicated.', 'MAKE_AUTHORITY_IDENTIFIERS_UNIQUE'],
  AUTHORITY_REFERENCE_DANGLING: ['An authority-bearing reference does not resolve exactly once.', 'FIX_AUTHORITY_REFERENCE'],
  PATH_INVALID: ['A repository path is invalid.', 'FIX_REPOSITORY_PATH'],
  PATH_DUPLICATE: ['A repository path set contains a duplicate.', 'REMOVE_DUPLICATE_PATH'],
  SCOPE_SET_OVERLAP: ['Repository scope sets are not pairwise disjoint.', 'MAKE_SCOPE_SETS_DISJOINT'],
  SNAPSHOT_REPOSITORY_MISMATCH: ['The snapshot repository identity does not match the specification.', 'FIX_SNAPSHOT_REPOSITORY'],
  SNAPSHOT_BRANCH_MISMATCH: ['The snapshot branch does not match the specification.', 'FIX_SNAPSHOT_BRANCH'],
  SNAPSHOT_HEAD_MISMATCH: ['The snapshot HEAD does not match the specification.', 'FIX_SNAPSHOT_HEAD'],
  SNAPSHOT_PATH_IDENTITY_MISMATCH: ['A snapshot path identity is inconsistent.', 'RECOLLECT_SNAPSHOT'],
  SNAPSHOT_OUTPUT_EXISTS: ['The requested snapshot output already exists.', 'USE_NEW_SNAPSHOT_OUTPUT'],
  SNAPSHOT_OUTPUT_INSIDE_REPOSITORY: ['Snapshot output must be outside the repository.', 'MOVE_SNAPSHOT_OUTPUT_EXTERNAL'],
  SNAPSHOT_PATH_NOT_TRACKED: ['A declared content path is not tracked.', 'DECLARE_TRACKED_CONTENT_ONLY'],
  SNAPSHOT_CREATE_PATH_PRESENT: ['A declared create path is already present.', 'FIX_CREATE_SCOPE'],
  SNAPSHOT_PATH_MISSING: ['A declared existing path is absent.', 'FIX_EXISTING_SCOPE'],
  SNAPSHOT_SYMLINK: ['A snapshot path resolves to a symbolic link.', 'REPLACE_SYMLINK'],
  SNAPSHOT_SUBMODULE: ['A snapshot path is a Git submodule.', 'REMOVE_SUBMODULE_FROM_SCOPE'],
  SNAPSHOT_HARDLINK: ['A snapshot path has more than one hard link.', 'REPLACE_HARDLINK'],
  SNAPSHOT_GIT_COMMAND_FAILED: ['A fixed read-only Git command failed.', 'FIX_REPOSITORY_STATE'],
  SNAPSHOT_SOURCE_CONTENT_EMISSION: ['Compiled snapshot evidence contains source content.', 'SANITIZE_SNAPSHOT_EVIDENCE'],
  COMMAND_UNBOUND_VARIABLE: ['A command references an unbound variable.', 'BIND_COMMAND_VARIABLE'],
  AMBIGUOUS_EXECUTABLE_FILENAME: ['An executable path is generic, glob-selected, or collision-prone.', 'DECLARE_EXACT_EXECUTABLE_PATH'],
  BUDGET_AGGREGATE_OVERFLOW: ['Derived phase-global operation charges exceed an authorized ceiling.', 'REDUCE_OR_AUTHORIZE_OPERATION_BUDGET'],
  BUDGET_CONTRACT_INCONSISTENT: ['Multiple budget representations disagree.', 'USE_ONE_PHASE_GLOBAL_BUDGET'],
  PROHIBITED_GIT_MUTATION: ['A Git command requests a prohibited destructive or force mutation.', 'REMOVE_PROHIBITED_GIT_MUTATION'],
  COMMAND_CONTEXT_INVALID: ['A command execution context is absent or contradictory.', 'DECLARE_COMMAND_CONTEXT'],
  COMMAND_DEPENDENCY_DECLARED_BUT_UNPROVEN: ['A declared dependency lacks bounded static proof.', 'INCLUDE_DEPENDENCY_SOURCE_PROOF'],
  COMMAND_DEPENDENCY_UNDECLARED: ['Static extraction found an undeclared command dependency.', 'DECLARE_COMMAND_DEPENDENCY'],
  COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION: ['A command dependency cannot be reduced to a bounded static target.', 'REMOVE_COMMAND_INDIRECTION'],
  COMMAND_INJECTION_SURFACE: ['A command exposes shell evaluation or unsafe interpolation.', 'USE_FIXED_ARGV_VECTORS'],
  CONDITIONAL_SCOPE_AMBIGUOUS: ['A conditional scope predicate is not a supported deterministic enum.', 'USE_SUPPORTED_CONDITIONAL_PREDICATE'],
  EXTERNAL_RESOURCE_CLEANUP_IDENTITY_MISSING: ['An external mutation lacks a stable cleanup identity.', 'DECLARE_STABLE_CLEANUP_IDENTITY'],
  GIT_OPERATION_COUNT_INVALID: ['Git operation counts, subject, paths, or branch contract disagree.', 'FIX_EXACT_GIT_CONTRACT'],
  HISTORICAL_CURRENT_IDENTITY_COLLISION: ['Historical identity is implicitly compared with mutable current content.', 'SEPARATE_TIMEPOINT_IDENTITIES'],
  MARKER_BYTE_IDENTITY_MISMATCH: ['A marker and its byte identity are not derived from one buffer.', 'DERIVE_MARKER_IDENTITY_FROM_FINAL_BYTES'],
  PATH_SCOPE_OVERLAP: ['Repository scope sets are not pairwise disjoint.', 'MAKE_SCOPE_SETS_DISJOINT'],
  PATH_SYMLINK_FORBIDDEN: ['A governed path is a symlink, hardlink, or submodule.', 'USE_REGULAR_SINGLE_LINK_FILES'],
  PATH_TRAVERSAL_FORBIDDEN: ['A governed path is absolute or escapes its repository root.', 'USE_CONFINED_REPOSITORY_PATH'],
  REPOSITORY_IDENTITY_MISMATCH: ['Repository snapshot identity contradicts the authored specification.', 'RECOLLECT_AUTHORIZED_SNAPSHOT'],
  REPOSITORY_SNAPSHOT_STALE: ['Repository dependency facts differ from the independently derived snapshot contract.', 'RECOLLECT_AUTHORIZED_SNAPSHOT'],
  ROLLBACK_RESOURCE_UNCOVERED: ['A mutation lacks rollback coverage or terminal verification.', 'COMPLETE_ROLLBACK_COVERAGE'],
  RUNNER_TOPOLOGY_MISMATCH: ['Runner-child and direct-command topology cannot coexist as declared.', 'FIX_RUNNER_TOPOLOGY'],
  SECRET_BEARING_FIELD_FORBIDDEN: ['A raw secret-bearing field or value is structurally forbidden.', 'USE_NAMES_AND_SANITIZED_COMMITMENTS_ONLY'],
  STATE_TRANSITION_INVALID: ['A command prerequisite, invalidation, or produced state is not feasible in sequence.', 'FIX_STATE_TRANSITION_GRAPH'],
  TARGET_CONFIRMATION_ORDER_INVALID: ['Target confirmation is missing or ordered outside the effect boundary.', 'MOVE_TARGET_CONFIRMATION_TO_EFFECT_BOUNDARY'],
  SCOPE_DIRECT_COMMAND_DEPENDENCY: ['A direct command requires a dependency outside its authority.', 'FIX_DIRECT_COMMAND_SCOPE'],
  MANIFEST_COUNT_MISMATCH: ['Manifest counts do not match independently derived counts.', 'FIX_MANIFEST_COUNTS'],
  DEPENDENCY_UNDECLARED: ['A command dependency is undeclared.', 'DECLARE_COMMAND_DEPENDENCY'],
  DEPENDENCY_UNPROVEN: ['A declared command dependency is not proven.', 'PROVE_COMMAND_DEPENDENCY'],
  DEPENDENCY_UNRESOLVED_INDIRECTION: ['A command dependency uses unresolved indirection.', 'REMOVE_COMMAND_INDIRECTION'],
  SCOPE_IDENTITY_COLLISION: ['Historical and current path identities collide.', 'SEPARATE_IDENTITY_NAMESPACES'],
  MARKER_BYTE_MISMATCH: ['A marker does not match its required bytes.', 'FIX_MARKER_BYTES'],
  OPERATION_BUDGET_EXCEEDED: ['A phase-global operation budget is exceeded.', 'REDUCE_OPERATION_CHARGES'],
  ROLLBACK_UNDERCOVERAGE: ['Rollback does not cover every mutation.', 'COMPLETE_ROLLBACK_COVERAGE'],
  TARGET_CONFIRMATION_ORDER: ['Target confirmation occurs after a mutation.', 'MOVE_TARGET_CONFIRMATION_EARLIER'],
  GIT_CONTRACT_MISMATCH: ['Git counts, subject, or paths do not match the contract.', 'FIX_GIT_CONTRACT'],
  TOKEN_LEAKAGE: ['An approval token appears outside its authorized artifact.', 'REMOVE_TOKEN_LEAKAGE'],
  TOKEN_OCCURRENCE_MISMATCH: ['Approval-token occurrence counts differ from the exact artifact contract.', 'FIX_TOKEN_OCCURRENCES'],
  TEMPLATE_INTERPOLATION_UNRESOLVED: ['A template contains an unresolved interpolation placeholder.', 'RESOLVE_TEMPLATE_INTERPOLATION'],
  OUTPUT_EMBEDDING_MISMATCH: ['Embedded artifact bytes do not match their source.', 'FIX_OUTPUT_EMBEDDING'],
  OUTPUT_HASH_MISMATCH: ['An artifact identity does not match its bytes.', 'FIX_OUTPUT_IDENTITY'],
  OUTPUT_CHECKSUM_MISMATCH: ['A checksum companion does not match the final output bytes.', 'FIX_OUTPUT_CHECKSUM'],
  OUTPUT_FINAL_MARKER_MISMATCH: ['An output final marker is absent, duplicated, or not the exact terminal line.', 'FIX_OUTPUT_FINAL_MARKER'],
  OUTPUT_NONDETERMINISTIC: ['Repeated compilation of identical inputs produced different bytes.', 'REMOVE_NONDETERMINISM'],
  OUTPUT_PATH_COLLISION: ['A protected output destination is already occupied or collides with another artifact.', 'USE_UNIQUE_OUTPUT_PATHS'],
  AMBIGUOUS_ARTIFACT_FILENAME: ['An artifact filename is generic, overridden, or not phase-bound.', 'USE_PHASE_PREFIXED_FILENAME'],
  ZIP_NOT_AUTHORIZED: ['ZIP transport output is not authorized by the phase artifact policy.', 'AUTHORIZE_OR_DISABLE_ZIP_TRANSPORT'],
};

const utf8Compare = (left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right));

const entries = Object.fromEntries(
  Object.entries(catalogDefinitions).map(([code, [explanation, remediationId]]) => [
    code,
    Object.freeze({
      code,
      severity: 'ERROR',
      remediation_id: remediationId,
      explanation,
      invariant_reference: `AIFINDER_PHASE_COMPILER_V1:${code}`,
    }),
  ]),
);

export const ERROR_CATALOG = Object.freeze(entries);
export const ERROR_CODES = Object.freeze(Object.keys(entries).sort(utf8Compare));

const SECRET_VALUE_PATTERN = /(?:\bghp_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b|\bAKIA[A-Z0-9]{16}\b|\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b|\bsk[-_][A-Za-z0-9_-]{16,}\b|\b(?:AUTHORIZE|APPROVE)_[A-Z0-9_]{16,}\b|\b(?:authorization\s*:|bearer\s+|(?:api|access|private)[_-]?key\s*[=:]|(?:cookie|credential|password|secret|session|token)\s*[=:])\s*\S+)/iu;

function sanitizeString(value) {
  const cleaned = value.normalize('NFC').replace(/[\u0000-\u001f\u007f]/gu, '?');
  if (SECRET_VALUE_PATTERN.test(cleaned)) return '[redacted]';
  const bytes = Buffer.from(cleaned);
  return bytes.length <= 256 ? cleaned : `${bytes.subarray(0, 240).toString('utf8')}...`;
}

function sanitizeEvidenceValue(value, depth = 0, seen = new WeakSet()) {
  if (depth > 6) return '[bounded]';
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'string') return sanitizeString(value);
  if (typeof value === 'number') return Number.isSafeInteger(value) ? value : '[non-safe-number]';
  if (typeof value === 'bigint') return '[bigint]';
  if (Array.isArray(value)) {
    return Object.freeze(value.slice(0, 64).map((item) => sanitizeEvidenceValue(item, depth + 1, seen)));
  }
  if (typeof value !== 'object' || value === undefined) return `[${typeof value}]`;
  if (seen.has(value)) return '[circular]';
  seen.add(value);
  const output = {};
  for (const key of Object.keys(value).sort(utf8Compare).slice(0, 64)) {
    const safeKey = sanitizeString(key);
    const keyIsSensitive = /authorization|cookie|credential|password|secret|session|token|environment_value/iu.test(safeKey);
    const rawValue = value[key];
    const safeValue = keyIsSensitive && (typeof rawValue === 'string' || (rawValue !== null && typeof rawValue === 'object'))
      ? '[redacted]'
      : sanitizeEvidenceValue(rawValue, depth + 1, seen);
    Object.defineProperty(output, safeKey, { value: safeValue, enumerable: true, configurable: true, writable: true });
  }
  seen.delete(value);
  return Object.freeze(output);
}

export function explainError(code) {
  const entry = ERROR_CATALOG[code];
  if (entry === undefined) throw new TypeError('Unknown diagnostic code');
  return entry;
}

export function diagnostic(
  code,
  {
    location_json_pointer = '',
    command_id_or_null = null,
    sanitized_evidence = {},
    remediation_id = undefined,
  } = {},
) {
  const entry = explainError(code);
  return Object.freeze({
    code,
    severity: entry.severity,
    location_json_pointer: sanitizeString(String(location_json_pointer)),
    command_id_or_null:
      command_id_or_null === null ? null : sanitizeString(String(command_id_or_null)),
    sanitized_evidence: sanitizeEvidenceValue(sanitized_evidence),
    remediation_id: remediation_id === undefined ? entry.remediation_id : sanitizeString(String(remediation_id)),
  });
}

export class DiagnosticError extends Error {
  constructor(code, details = undefined) {
    const record = diagnostic(code, details);
    super(record.code);
    this.name = 'DiagnosticError';
    this.diagnostic = record;
    Object.freeze(this);
  }
}
