import repositorySnapshotSchema from './repository-snapshot.schema.json' with { type: 'json' };
import { bufferIdentity, compareUtf8, deepFreeze, repositorySnapshotDigest } from './canonical.mjs';
import { RUNNER_ADAPTERS_V1, validateCommandDependencies } from './command-dependency-validator.mjs';
import { DiagnosticError, diagnostic } from './error-catalog.mjs';
import { validateGovernance } from './governance-validator.mjs';
import { validateOperationContract } from './operation-contract-validator.mjs';
import { normalizePhaseSpec } from './phase-spec.mjs';
import { validateSchema } from './schema-validator.mjs';

const SCOPE_NAMES = Object.freeze(['create_paths', 'modify_paths', 'preserve_paths', 'exclude_paths']);

function sortDiagnostics(records) {
  return records.sort((left, right) =>
    compareUtf8(left.code, right.code) ||
    compareUtf8(left.location_json_pointer, right.location_json_pointer) ||
    compareUtf8(left.command_id_or_null ?? '', right.command_id_or_null ?? ''),
  );
}

function add(records, code, location, evidence = {}, commandId = null) {
  records.push(diagnostic(code, {
    location_json_pointer: location,
    command_id_or_null: commandId,
    sanitized_evidence: evidence,
  }));
}

function verifyScopeSets(spec, diagnostics) {
  const owner = new Map();
  for (const name of SCOPE_NAMES) {
    for (const path of spec.scope[name]) {
      if (
        typeof path !== 'string' ||
        path.startsWith('/') ||
        path.includes('\\') ||
        path.split('/').some((segment) => segment === '' || segment === '.' || segment === '..')
      ) {
        add(diagnostics, 'PATH_TRAVERSAL_FORBIDDEN', `/scope/${name}`, { reason: 'unconfined path' });
        continue;
      }
      const first = owner.get(path);
      if (first !== undefined) add(diagnostics, 'PATH_SCOPE_OVERLAP', `/scope/${name}`, { path, first_set: first, second_set: name });
      else owner.set(path, name);
    }
  }
}

function verifyInspectionAuthority(spec, diagnostics) {
  if (spec.inspection_contract === undefined) return;
  const zeroBudget = Object.values(spec.operation_budgets).every((value) => value === 0);
  const zeroEffect =
    spec.authority_class === 'STATIC_INSPECTION_ONLY' &&
    spec.commands.length === 0 &&
    spec.external_resources.length === 0 &&
    spec.compatibility_adapters.length === 0 &&
    spec.conditional_scopes.length === 0 &&
    spec.rollbacks.length === 0 &&
    spec.scope.create_paths.length === 0 &&
    spec.scope.modify_paths.length === 0 &&
    spec.target_confirmation.required === false &&
    spec.target_confirmation.confirmation_command_id === '' &&
    spec.target_confirmation.first_effect_command_id === '' &&
    spec.target_confirmation.one_use === false &&
    spec.git.commit_count === 0 &&
    spec.git.push_count === 0 &&
    spec.git.commit_subject === '' &&
    spec.git.staged_paths.length === 0 &&
    spec.governance.manifest_path === '' &&
    spec.governance.manifest_transitions.length === 0 &&
    spec.governance.runner_path === '' &&
    spec.governance.runner_additions.length === 0 &&
    spec.governance.runner_removals.length === 0 &&
    spec.state_model.initial_states.length === 0 &&
    spec.state_model.invalidations.length === 0 &&
    zeroBudget;
  if (!zeroEffect) {
    add(diagnostics, 'INSPECTION_AUTHORITY_MISMATCH', '/inspection_contract', {
      authority_class_matches: spec.authority_class === 'STATIC_INSPECTION_ONLY',
      zero_effect_authority: false,
    });
  }
}

function verifyInspectionReferences(spec, diagnostics) {
  const contract = spec.inspection_contract;
  if (contract === undefined) return;
  const questionCounts = new Map();
  for (const question of contract.questions) {
    questionCounts.set(question.id, (questionCounts.get(question.id) ?? 0) + 1);
  }
  const sectionIds = new Set();
  const referenceCounts = new Map();
  let valid = questionCounts.size === contract.questions.length;
  for (const section of contract.output_sections) {
    if (sectionIds.has(section.id)) valid = false;
    sectionIds.add(section.id);
    for (const questionId of section.question_ids) {
      if (questionCounts.get(questionId) !== 1) valid = false;
      referenceCounts.set(questionId, (referenceCounts.get(questionId) ?? 0) + 1);
    }
  }
  if (sectionIds.size !== contract.output_sections.length) valid = false;
  for (const questionId of questionCounts.keys()) {
    if (questionCounts.get(questionId) !== 1 || referenceCounts.get(questionId) !== 1) valid = false;
  }
  for (const [questionId, count] of referenceCounts) {
    if (!questionCounts.has(questionId) || count !== 1) valid = false;
  }
  if (!valid) {
    add(diagnostics, 'INSPECTION_CONTRACT_REFERENCE_INVALID', '/inspection_contract/output_sections', {
      question_count: contract.questions.length,
      unique_question_id_count: questionCounts.size,
      output_section_count: contract.output_sections.length,
      unique_output_section_id_count: sectionIds.size,
    });
  }
}

function verifyRepositoryIdentity(spec, snapshot, diagnostics) {
  for (const [field, expected] of [
    ['repository_id', spec.repository.repository_id],
    ['branch', spec.repository.branch],
    ['head', spec.repository.baseline.head],
    ['parent', spec.repository.baseline.parent],
    ['tree', spec.repository.baseline.tree],
    ['subject', spec.repository.baseline.subject],
    ['remote_ref', spec.repository.remote_ref],
    ['remote_head', spec.repository.remote_head],
    ['ahead', spec.repository.ahead],
    ['behind', spec.repository.behind],
  ]) {
    if (snapshot[field] !== expected) add(diagnostics, 'REPOSITORY_IDENTITY_MISMATCH', `/${field}`, { field });
  }
}

function verifySnapshotScope(spec, snapshot, diagnostics) {
  const snapshotByPath = new Map();
  for (const record of snapshot.paths) {
    if (snapshotByPath.has(record.path)) add(diagnostics, 'PATH_SCOPE_OVERLAP', '/paths', { path: record.path, reason: 'duplicate snapshot path' });
    snapshotByPath.set(record.path, record);
    if (record.mode === '120000' || record.mode === '160000') add(diagnostics, 'PATH_SYMLINK_FORBIDDEN', '/paths', { path: record.path });
    if (record.state === 'ABSENT') {
      if (record.mode !== '' || record.blob !== '' || record.sha256 !== '' || record.bytes !== 0 || record.lf !== 0 || record.cr !== 0 || Object.hasOwn(record, 'content_utf8')) {
        add(diagnostics, 'REPOSITORY_IDENTITY_MISMATCH', '/paths', { path: record.path, reason: 'absent path has content identity' });
      }
    } else if (!['100644', '100755', '120000', '160000'].includes(record.mode) || !/^[0-9a-f]{40}$/u.test(record.blob) || !/^[0-9a-f]{64}$/u.test(record.sha256)) {
      add(diagnostics, 'REPOSITORY_IDENTITY_MISMATCH', '/paths', { path: record.path, reason: 'tracked mode or blob identity' });
    }
    if (Object.hasOwn(record, 'content_utf8')) {
      const identity = bufferIdentity(Buffer.from(record.content_utf8));
      if (identity.sha256 !== record.sha256 || identity.bytes !== record.bytes || identity.lf !== record.lf || identity.cr !== record.cr) {
        add(diagnostics, 'REPOSITORY_IDENTITY_MISMATCH', '/paths', { path: record.path, reason: 'content identity mismatch' });
      }
    }
  }
  for (const [name, expectedRole, expectedState] of [
    ['create_paths', 'CREATE', 'ABSENT'],
    ['modify_paths', 'MODIFY', 'TRACKED'],
    ['preserve_paths', 'PRESERVE', 'TRACKED'],
  ]) {
    for (const path of spec.scope[name]) {
      const record = snapshotByPath.get(path);
      if (record === undefined || record.role !== expectedRole || record.state !== expectedState) {
        add(diagnostics, 'REPOSITORY_IDENTITY_MISMATCH', `/scope/${name}`, { path, expected_role: expectedRole, expected_state: expectedState });
      }
    }
  }
  const exactInventory = [...spec.scope.create_paths, ...spec.scope.modify_paths, ...spec.scope.preserve_paths].sort(compareUtf8);
  const snapshotInventory = snapshot.paths.map((record) => record.path).sort(compareUtf8);
  if (JSON.stringify(snapshotInventory) !== JSON.stringify(exactInventory)) {
    add(diagnostics, 'REPOSITORY_IDENTITY_MISMATCH', '/paths', { reason: 'snapshot path inventory differs from exact scope' });
  }
  const excluded = new Set(spec.scope.exclude_paths);
  const trackedContentAuthority = new Set([...spec.scope.modify_paths, ...spec.scope.preserve_paths]);
  const readContentAuthority = new Set(spec.scope.read_content_paths);
  spec.commands.forEach((command, index) => {
    for (const path of [...command.reads, ...command.writes, ...command.source_references]) {
      if (excluded.has(path)) add(diagnostics, 'PATH_SCOPE_OVERLAP', `/commands/${index}`, { path, reason: 'excluded path consumed' }, command.id);
    }
    for (const path of command.source_references) {
      if (!trackedContentAuthority.has(path) || !readContentAuthority.has(path)) {
        add(diagnostics, 'COMMAND_DEPENDENCY_UNDECLARED', `/commands/${index}/source_references`, { path, reason: 'source reference lacks tracked content authority' }, command.id);
      }
    }
  });
  const requiredContent = new Set([
    ...spec.scope.read_content_paths,
    ...spec.commands.flatMap((command) => command.source_references),
  ]);
  for (const path of requiredContent) {
    if (!Object.hasOwn(snapshotByPath.get(path) ?? {}, 'content_utf8')) {
      add(diagnostics, 'COMMAND_DEPENDENCY_DECLARED_BUT_UNPROVEN', '/paths', { path, reason: 'required source content absent' });
    }
  }
  const { snapshot_digest: omittedDigest, final_marker: omittedMarker, ...body } = snapshot;
  void omittedDigest;
  void omittedMarker;
  if (repositorySnapshotDigest(body) !== snapshot.snapshot_digest) {
    add(diagnostics, 'REPOSITORY_IDENTITY_MISMATCH', '/snapshot_digest', { reason: 'domain-separated snapshot digest mismatch' });
  }
}

function verifyTimepointNamespaces(spec, diagnostics, compatibilityAdapters) {
  const modified = new Set(spec.scope.modify_paths);
  const adapters = new Map(compatibilityAdapters.map((adapter) => [adapter.id, adapter]));
  spec.commands.forEach((command, index) => {
    if (command.compatibility_timepoint === 'CURRENT') return;
    for (const path of [...command.reads, ...command.source_references]) {
      if (!modified.has(path)) continue;
      const state = command.required_runner_state.find((item) => /^COMPATIBILITY_ADAPTER_V\d+:/u.test(item));
      const match = state === undefined ? null : /^COMPATIBILITY_ADAPTER_V(\d+):([A-Z0-9_-]+)$/u.exec(state);
      const adapter = match === null ? undefined : adapters.get(match[2]);
      const compatible = adapter !== undefined && adapter.version === Number(match[1]) && adapter.paths.includes(path) && adapter.from === command.compatibility_timepoint && adapter.to === 'CURRENT';
      if (!compatible) {
        add(diagnostics, 'HISTORICAL_CURRENT_IDENTITY_COLLISION', `/commands/${index}`, { path }, command.id);
      }
    }
  });
}

export function validateSemantic({ spec, snapshot, compatibilityAdapters = spec.compatibility_adapters ?? [] }) {
  const diagnostics = [];
  const schema = validateSchema(snapshot, repositorySnapshotSchema);
  if (!schema.valid) return deepFreeze({ valid: false, diagnostics: [...schema.diagnostics] });
  verifyInspectionReferences(spec, diagnostics);
  verifyInspectionAuthority(spec, diagnostics);
  verifyScopeSets(spec, diagnostics);
  verifyRepositoryIdentity(spec, snapshot, diagnostics);
  verifySnapshotScope(spec, snapshot, diagnostics);
  verifyTimepointNamespaces(spec, diagnostics, compatibilityAdapters);
  const sorted = sortDiagnostics(diagnostics);
  return deepFreeze({ valid: sorted.length === 0, diagnostics: sorted });
}

const PRIMARY_PRIORITY = Object.freeze([
  'INSPECTION_CONTRACT_REFERENCE_INVALID',
  'INSPECTION_AUTHORITY_MISMATCH',
  'INSPECTION_TEXT_FORBIDDEN',
  'BUDGET_AGGREGATE_OVERFLOW',
  'BUDGET_CONTRACT_INCONSISTENT',
  'AMBIGUOUS_EXECUTABLE_FILENAME',
  'COMMAND_UNBOUND_VARIABLE',
  'SCOPE_DIRECT_COMMAND_DEPENDENCY',
  'MANIFEST_COUNT_MISMATCH',
  'RUNNER_TOPOLOGY_MISMATCH',
  'HISTORICAL_CURRENT_IDENTITY_COLLISION',
  'COMMAND_DEPENDENCY_DECLARED_BUT_UNPROVEN',
  'COMMAND_DEPENDENCY_UNDECLARED',
  'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
  'PATH_TRAVERSAL_FORBIDDEN',
  'PATH_SYMLINK_FORBIDDEN',
  'COMMAND_INJECTION_SURFACE',
  'PROHIBITED_GIT_MUTATION',
  'ROLLBACK_RESOURCE_UNCOVERED',
  'CONDITIONAL_SCOPE_AMBIGUOUS',
  'REPOSITORY_IDENTITY_MISMATCH',
  'REPOSITORY_SNAPSHOT_STALE',
  'SECRET_BEARING_FIELD_FORBIDDEN',
]);

function canonicalDiagnostics(results) {
  return results.flatMap((result) => result.diagnostics).sort((left, right) =>
    compareUtf8(left.code, right.code) ||
    compareUtf8(left.location_json_pointer, right.location_json_pointer) ||
    compareUtf8(left.command_id_or_null ?? '', right.command_id_or_null ?? '') ||
    compareUtf8(JSON.stringify(left.sanitized_evidence), JSON.stringify(right.sanitized_evidence)),
  );
}

function primaryCode(diagnostics) {
  let selected = null; let selectedPriority = Number.POSITIVE_INFINITY;
  for (const record of diagnostics) {
    const position = PRIMARY_PRIORITY.indexOf(record.code);
    const priority = position === -1 ? PRIMARY_PRIORITY.length : position;
    if (priority < selectedPriority) { selected = record.code; selectedPriority = priority; }
  }
  return selected;
}

export function validatePhaseCompilation({ authoredSpec, snapshot, runnerAdapters = RUNNER_ADAPTERS_V1 }) {
  let spec;
  try {
    spec = normalizePhaseSpec(authoredSpec);
  } catch (error) {
    let record = error instanceof DiagnosticError ? error.diagnostic : diagnostic('SCHEMA_VALIDATION');
    if (record.code === 'SCHEMA_CONTRACT_VIOLATION' && record.location_json_pointer.includes('/conditional_scopes/')) {
      record = diagnostic('CONDITIONAL_SCOPE_AMBIGUOUS', { location_json_pointer: record.location_json_pointer, sanitized_evidence: { reason: 'predicate is not a supported enum' } });
    }
    return deepFreeze({ valid: false, primary_code: record.code, normalized_spec: null, diagnostics: [record] });
  }
  const semantic = validateSemantic({ spec, snapshot });
  if (semantic.diagnostics.some((record) => record.code === 'SCHEMA_VALIDATION' || record.code === 'SCHEMA_DEPTH_EXCEEDED')) {
    const diagnostics = canonicalDiagnostics([semantic]);
    return deepFreeze({ valid: false, primary_code: primaryCode(diagnostics), normalized_spec: spec, diagnostics });
  }
  const closure = validateCommandDependencies({ spec, snapshot, runnerAdapters, requireSnapshotFacts: true });
  const governance = validateGovernance({ spec, snapshot, runnerAdapters });
  const operation = validateOperationContract({ spec, snapshot });
  const diagnostics = canonicalDiagnostics([semantic, closure, governance, operation]);
  return deepFreeze({
    valid: diagnostics.length === 0,
    primary_code: primaryCode(diagnostics),
    normalized_spec: spec,
    diagnostics,
    closure,
    governance,
    operation,
  });
}
