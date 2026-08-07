import phaseSpecSchema from './phase-spec.schema.json' with { type: 'json' };
import { compareUtf8, deepFreeze, parseStrictJson } from './canonical.mjs';
import { DiagnosticError } from './error-catalog.mjs';
import { assertSchema, assertSupportedSchema } from './schema-validator.mjs';

export const PHASE_SPEC_SCHEMA = assertSupportedSchema(phaseSpecSchema);

const DERIVED_FIELD_NAMES = new Set([
  'approval_basis',
  'approval_token',
  'artifact_identities',
  'byte_count',
  'bytes',
  'canonical_bytes',
  'content_sha256',
  'cr_count',
  'digest',
  'embedded_identity',
  'file_count',
  'filename',
  'filenames',
  'final_marker_bytes',
  'lf_count',
  'manifest_total',
  'operation_aggregate',
  'output_filename',
  'runner_total',
  'sha256',
  'snapshot_digest',
  'sorted_inventory',
  'token_commitment',
]);

const SCOPE_SET_NAMES = Object.freeze([
  'create_paths',
  'exclude_paths',
  'modify_paths',
  'preserve_paths',
]);

function pointerJoin(pointer, token) {
  return `${pointer}/${String(token).replace(/~/gu, '~0').replace(/\//gu, '~1')}`;
}

function rethrowAs(error, sourceCode, targetCode) {
  if (!(error instanceof DiagnosticError) || error.diagnostic.code !== sourceCode) throw error;
  throw new DiagnosticError(targetCode, {
    location_json_pointer: error.diagnostic.location_json_pointer,
    command_id_or_null: error.diagnostic.command_id_or_null,
    sanitized_evidence: error.diagnostic.sanitized_evidence,
  });
}

function assertPhaseSpecSchema(authored) {
  try {
    assertSchema(authored, PHASE_SPEC_SCHEMA);
  } catch (error) {
    if (error instanceof DiagnosticError && error.diagnostic.code === 'SCHEMA_VALIDATION' && error.diagnostic.sanitized_evidence.constraint === 'uniqueItems' && /^\/scope\/(?:create_paths|exclude_paths|modify_paths|preserve_paths|read_content_paths)$/u.test(error.diagnostic.location_json_pointer)) {
      throw new DiagnosticError('PATH_DUPLICATE', {
        location_json_pointer: error.diagnostic.location_json_pointer,
        sanitized_evidence: { reason: 'duplicate repository path' },
      });
    }
    rethrowAs(error, 'SCHEMA_VALIDATION', 'SCHEMA_CONTRACT_VIOLATION');
  }
}

function rejectAuthoredDerivedFields(value, pointer = '') {
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((child, index) => rejectAuthoredDerivedFields(child, pointerJoin(pointer, index)));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (DERIVED_FIELD_NAMES.has(key) || /^(?:manifest|runner|scope|output)_count$/u.test(key)) {
      throw new DiagnosticError('SPEC_DERIVED_FIELD_AUTHORED', {
        location_json_pointer: pointerJoin(pointer, key),
        sanitized_evidence: { field: key },
      });
    }
    rejectAuthoredDerivedFields(child, pointerJoin(pointer, key));
  }
}

export function normalizePhaseId(value) {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/u.test(normalized) || normalized.length < 2 || normalized.length > 64) {
    throw new DiagnosticError('PHASE_ID_INVALID', {
      location_json_pointer: '/phase_id',
      sanitized_evidence: { reason: 'phase ID grammar' },
    });
  }
  return normalized;
}

export function normalizeRepositoryPath(value, pointer = '') {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    Buffer.byteLength(value) > 240 ||
    value !== value.normalize('NFC') ||
    value.endsWith('/') ||
    value.includes('\\') ||
    value.includes('\u0000')
  ) {
    throw new DiagnosticError(value?.startsWith('/') ? 'PATH_TRAVERSAL_FORBIDDEN' : 'PATH_INVALID', {
      location_json_pointer: pointer,
      sanitized_evidence: { reason: 'path shape' },
    });
  }
  const segments = value.split('/');
  if (segments.some((segment) => segment.length === 0 || segment === '.' || segment === '..')) {
    throw new DiagnosticError('PATH_TRAVERSAL_FORBIDDEN', {
      location_json_pointer: pointer,
      sanitized_evidence: { reason: 'path traversal or empty segment' },
    });
  }
  return segments.join('/');
}

function normalizePathArray(paths, pointer) {
  const seen = new Set();
  const normalized = paths.map((path, index) => normalizeRepositoryPath(path, pointerJoin(pointer, index)));
  for (const path of normalized) {
    if (seen.has(path)) {
      throw new DiagnosticError('PATH_DUPLICATE', {
        location_json_pointer: pointer,
        sanitized_evidence: { path },
      });
    }
    seen.add(path);
  }
  return normalized.sort(compareUtf8);
}

function normalizedCommand(command, index) {
  const setKeys = [
    'environment_names',
    'prerequisite_state',
    'produced_state',
    'reads',
    'required_manifest_state',
    'required_runner_state',
    'source_references',
    'writes',
  ];
  const output = { ...command, cwd: command.cwd === '.' ? '.' : normalizeRepositoryPath(command.cwd, `/commands/${index}/cwd`) };
  for (const key of setKeys) {
    const values = command[key].map((value) => value.normalize('NFC'));
    output[key] = [...new Set(values)].sort(compareUtf8);
  }
  output.argv = [...command.argv];
  output.expected = { ...command.expected };
  output.operation_charges = { ...command.operation_charges };
  return output;
}

function authorityFailure(code, pointer, kind) {
  throw new DiagnosticError(code, {
    location_json_pointer: pointer,
    sanitized_evidence: { authority_kind: kind },
  });
}

function assertUniqueAuthority(records, identity, pointer, kind) {
  const seen = new Set();
  for (const record of records) {
    const value = identity(record);
    if (seen.has(value)) authorityFailure('AUTHORITY_ID_DUPLICATE', pointer, kind);
    seen.add(value);
  }
  return seen;
}

function assertAuthorityReferences(authored, commandIds) {
  const adapterIds = assertUniqueAuthority(authored.compatibility_adapters, (adapter) => adapter.id, '/compatibility_adapters', 'compatibility_adapter');
  const adapterIdentities = new Set(authored.compatibility_adapters.map((adapter) => `${adapter.version}:${adapter.id}`));
  assertUniqueAuthority(authored.conditional_scopes, (conditional) => conditional.id, '/conditional_scopes', 'conditional_scope');
  const externalResourceIds = assertUniqueAuthority(authored.external_resources, (resource) => resource.id, '/external_resources', 'external_resource');
  void externalResourceIds;
  assertUniqueAuthority(authored.external_resources, (resource) => resource.cleanup_identity, '/external_resources', 'external_cleanup_identity');
  const rollbackIds = assertUniqueAuthority(authored.rollbacks, (rollback) => rollback.id, '/rollbacks', 'rollback');
  assertUniqueAuthority(authored.state_model.invalidations, (entry) => entry.command_id, '/state_model/invalidations', 'state_invalidation');
  assertUniqueAuthority(authored.governance.manifest_transitions, (transition) => transition.path, '/governance/manifest_transitions', 'manifest_transition');

  const mutationIds = [];
  for (const rollback of authored.rollbacks) mutationIds.push(...rollback.mutation_ids.map((mutationId) => ({ mutationId })));
  assertUniqueAuthority(mutationIds, (entry) => entry.mutationId, '/rollbacks/mutation_ids', 'rollback_mutation');

  const externalRoleCommands = [];
  for (const resource of authored.external_resources) {
    externalRoleCommands.push(
      { commandId: resource.create_command_id },
      { commandId: resource.verify_command_id },
      { commandId: resource.cleanup_command_id },
    );
  }
  assertUniqueAuthority(externalRoleCommands, (entry) => entry.commandId, '/external_resources', 'external_resource_command_role');

  for (const [index, command] of authored.commands.entries()) {
    for (const state of command.required_runner_state) {
      const match = /^COMPATIBILITY_ADAPTER_V(\d+):([A-Z0-9_-]+)$/u.exec(state);
      if (match !== null && (!adapterIds.has(match[2]) || !adapterIdentities.has(`${Number(match[1])}:${match[2]}`))) {
        authorityFailure('AUTHORITY_REFERENCE_DANGLING', `/commands/${index}/required_runner_state`, 'compatibility_adapter');
      }
    }
    if (command.rollback_id !== '' && !rollbackIds.has(command.rollback_id)) {
      authorityFailure('AUTHORITY_REFERENCE_DANGLING', `/commands/${index}/rollback_id`, 'rollback');
    }
  }
  for (const [index, conditional] of authored.conditional_scopes.entries()) {
    for (const rollbackId of [...conditional.true_rollback_ids, ...conditional.false_rollback_ids]) {
      if (!rollbackIds.has(rollbackId)) authorityFailure('AUTHORITY_REFERENCE_DANGLING', `/conditional_scopes/${index}`, 'conditional_rollback');
    }
  }
  for (const [index, resource] of authored.external_resources.entries()) {
    for (const commandId of [resource.create_command_id, resource.verify_command_id, resource.cleanup_command_id]) {
      if (!commandIds.has(commandId)) authorityFailure('AUTHORITY_REFERENCE_DANGLING', `/external_resources/${index}`, 'external_resource_command');
    }
  }
  for (const [index, rollback] of authored.rollbacks.entries()) {
    for (const mutationId of rollback.mutation_ids) {
      if (!commandIds.has(mutationId)) authorityFailure('AUTHORITY_REFERENCE_DANGLING', `/rollbacks/${index}/mutation_ids`, 'rollback_mutation');
    }
  }
  for (const [index, invalidation] of authored.state_model.invalidations.entries()) {
    if (!commandIds.has(invalidation.command_id)) authorityFailure('AUTHORITY_REFERENCE_DANGLING', `/state_model/invalidations/${index}/command_id`, 'state_invalidation');
  }
  if (authored.target_confirmation.required) {
    for (const [field, commandId] of [
      ['confirmation_command_id', authored.target_confirmation.confirmation_command_id],
      ['first_effect_command_id', authored.target_confirmation.first_effect_command_id],
    ]) {
      if (!commandIds.has(commandId)) authorityFailure('AUTHORITY_REFERENCE_DANGLING', `/target_confirmation/${field}`, 'target_confirmation_command');
    }
  }
}

export function normalizePhaseSpec(authored) {
  rejectAuthoredDerivedFields(authored);
  assertPhaseSpecSchema(authored);
  const scope = {};
  for (const name of SCOPE_SET_NAMES) scope[name] = normalizePathArray(authored.scope[name], `/scope/${name}`);
  scope.read_content_paths = normalizePathArray(authored.scope.read_content_paths, '/scope/read_content_paths');

  const ownerByPath = new Map();
  for (const name of SCOPE_SET_NAMES) {
    for (const path of scope[name]) {
      const prior = ownerByPath.get(path);
      if (prior !== undefined) {
        throw new DiagnosticError('SCOPE_SET_OVERLAP', {
          location_json_pointer: `/scope/${name}`,
          sanitized_evidence: { path, first_set: prior, second_set: name },
        });
      }
      ownerByPath.set(path, name);
    }
  }
  const trackedAuthority = new Set([...scope.modify_paths, ...scope.preserve_paths]);
  for (const path of scope.read_content_paths) {
    if (!trackedAuthority.has(path)) {
      throw new DiagnosticError('PATH_INVALID', {
        location_json_pointer: '/scope/read_content_paths',
        sanitized_evidence: { path, reason: 'content path lacks tracked authority' },
      });
    }
  }

  const commands = authored.commands.map(normalizedCommand).sort((left, right) => left.sequence - right.sequence || compareUtf8(left.id, right.id));
  const commandIds = new Set();
  const sequences = new Set();
  for (const command of commands) {
    if (commandIds.has(command.id) || sequences.has(command.sequence)) {
      throw new DiagnosticError('SCHEMA_CONTRACT_VIOLATION', {
        location_json_pointer: '/commands',
        sanitized_evidence: { constraint: 'unique command id and sequence' },
      });
    }
    commandIds.add(command.id);
    sequences.add(command.sequence);
  }
  assertAuthorityReferences(authored, commandIds);

  const normalized = {
    ...authored,
    phase_id: normalizePhaseId(authored.phase_id),
    repository: {
      ...authored.repository,
      baseline: { ...authored.repository.baseline },
    },
    scope,
    operation_budgets: { ...authored.operation_budgets },
    commands,
    compatibility_adapters: authored.compatibility_adapters.map((adapter) => ({
      ...adapter,
      paths: normalizePathArray(adapter.paths, `/compatibility_adapters/${adapter.id}/paths`),
    })),
    conditional_scopes: authored.conditional_scopes.map((conditional) => ({
      ...conditional,
      predicate_input_path: normalizeRepositoryPath(conditional.predicate_input_path, `/conditional_scopes/${conditional.id}/predicate_input_path`),
      true_paths: normalizePathArray(conditional.true_paths, `/conditional_scopes/${conditional.id}/true_paths`),
      false_paths: normalizePathArray(conditional.false_paths, `/conditional_scopes/${conditional.id}/false_paths`),
      true_operation_charges: { ...conditional.true_operation_charges },
      false_operation_charges: { ...conditional.false_operation_charges },
      true_rollback_ids: [...conditional.true_rollback_ids].sort(compareUtf8),
      false_rollback_ids: [...conditional.false_rollback_ids].sort(compareUtf8),
    })),
    external_resources: authored.external_resources.map((resource) => ({ ...resource })),
    governance: {
      ...authored.governance,
      manifest_path: authored.governance.manifest_path === '' ? '' : normalizeRepositoryPath(authored.governance.manifest_path, '/governance/manifest_path'),
      manifest_transitions: authored.governance.manifest_transitions.map((transition) => ({
        ...transition,
        path: normalizeRepositoryPath(transition.path, '/governance/manifest_transitions/path'),
      })).sort((left, right) => compareUtf8(left.path, right.path)),
      runner_path: authored.governance.runner_path === '' ? '' : normalizeRepositoryPath(authored.governance.runner_path, '/governance/runner_path'),
      runner_additions: [...authored.governance.runner_additions].sort(compareUtf8),
      runner_removals: [...authored.governance.runner_removals].sort(compareUtf8),
    },
    rollbacks: authored.rollbacks.map((rollback) => ({
      ...rollback,
      cleanup_paths: normalizePathArray(rollback.cleanup_paths, `/rollbacks/${rollback.id}/cleanup_paths`),
      mutation_ids: [...new Set(rollback.mutation_ids)].sort(compareUtf8),
    })),
    state_model: {
      initial_states: [...authored.state_model.initial_states].sort(compareUtf8),
      invalidations: authored.state_model.invalidations.map((entry) => ({
        command_id: entry.command_id,
        states: [...entry.states].sort(compareUtf8),
      })),
    },
    target_confirmation: { ...authored.target_confirmation },
    git: {
      ...authored.git,
      staged_paths: normalizePathArray(authored.git.staged_paths, '/git/staged_paths'),
    },
    artifact_policy: { ...authored.artifact_policy },
  };
  return deepFreeze(normalized);
}

export function parsePhaseSpec(bytes) {
  let authored;
  try {
    authored = parseStrictJson(bytes);
  } catch (error) {
    rethrowAs(error, 'JSON_DUPLICATE_KEY', 'SPEC_DUPLICATE_KEY');
  }
  return normalizePhaseSpec(authored);
}

export function buildPreliminaryIr(normalizedSpec) {
  const spec = normalizePhaseSpec(normalizedSpec);
  return deepFreeze({
    ir_version: 1,
    phase_id: spec.phase_id,
    phase_prefix: `AiFinder-Phase-${spec.phase_id}`,
    spec,
  });
}

export function parseAndBuildPreliminaryIr(bytes) {
  return buildPreliminaryIr(parsePhaseSpec(bytes));
}
