import { compareUtf8, deepFreeze } from './canonical.mjs';
import { deriveCommandSourceGraph, deriveExecutableEffectVector, deriveNpmScriptCapabilities } from './command-dependency-validator.mjs';
import { diagnostic } from './error-catalog.mjs';

const CHARGE_NAMES = Object.freeze(['network', 'database', 'deployments', 'git_commits', 'git_pushes', 'compiled_commands']);
const TARGET_EFFECT_NAMES = Object.freeze(['network', 'database', 'deployments']);

function zeroCharges() { return Object.fromEntries(CHARGE_NAMES.map((name) => [name, 0])); }
function deriveVector(vector, charges, externalMutations, diagnostics, commandId, location, executionContext) {
  const effect = deriveExecutableEffectVector(vector, executionContext);
  for (const name of CHARGE_NAMES) charges[name] += effect.charges[name];
  for (const mutation of effect.external_mutations) externalMutations.add(mutation);
  if (effect.injection) add(diagnostics, 'COMMAND_INJECTION_SURFACE', location, { reason: 'shell or eval invocation vector' }, commandId);
  if (effect.prohibited_git) add(diagnostics, 'PROHIBITED_GIT_MUTATION', location, { reason: 'force or destructive Git mutation' }, commandId);
  if (!effect.supported) add(diagnostics, 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION', location, { reason: 'unsupported executable capability' }, commandId);
  return effect;
}

function deriveOperationAuthority(spec, snapshot, diagnostics) {
  const snapshotByPath = new Map((snapshot?.paths ?? []).map((record) => [record.path, record]));
  const byCommand = new Map(); const aggregate = zeroCharges();
  for (const [index, command] of spec.commands.entries()) {
    const charges = zeroCharges(); const externalMutations = new Set(); const localWrites = new Set();
    const npmCapability = deriveNpmScriptCapabilities({ command, snapshotByPath });
    const sourceCommandCwd = npmCapability.package_cwd ?? command.cwd;
    const sourceGraph = deriveCommandSourceGraph({ command, snapshotByPath, commandCwd: sourceCommandCwd });
    const analyzedSourceKinds = new Map(sourceGraph.analyzed_source_kinds.map((entry) => [entry.path, entry.kind]));
    const executionContext = { commandCwd: command.cwd, sourceReferences: new Set(command.source_references), analyzedSourceKinds };
    const directEffect = deriveVector(command.argv, charges, externalMutations, diagnostics, command.id, `/commands/${index}/argv`, executionContext);
    for (const path of directEffect.local_writes) localWrites.add(path);
    for (const edge of npmCapability.edges) {
      if (edge.unresolved) add(diagnostics, 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION', `/commands/${index}/argv`, { reason: 'unresolved npm script capability', reference: edge.reference }, command.id);
      if (edge.injection) add(diagnostics, 'COMMAND_INJECTION_SURFACE', `/commands/${index}/argv`, { reason: 'npm script injection surface' }, command.id);
    }
    for (const [vectorIndex, vector] of npmCapability.vectors.entries()) {
      const effect = deriveVector(vector, charges, externalMutations, diagnostics, command.id, `/commands/${index}/argv`, { ...executionContext, commandCwd: npmCapability.vector_cwds[vectorIndex] });
      for (const path of effect.local_writes) localWrites.add(path);
    }
    for (const edge of sourceGraph.edges) {
      if (edge.kind === 'PATH' && edge.access === 'WRITE' && !edge.unresolved) localWrites.add(edge.reference);
      if (edge.unresolved) add(diagnostics, 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION', `/commands/${index}/source_references`, { reason: 'unresolved source capability', reference: edge.reference }, command.id);
      if (edge.injection) add(diagnostics, 'COMMAND_INJECTION_SURFACE', `/commands/${index}/source_references`, { reason: 'source capability injection surface' }, command.id);
    }
    for (const vector of sourceGraph.vectors) {
      const effect = deriveVector(vector.argv, charges, externalMutations, diagnostics, command.id, `/commands/${index}/source_references`, { ...executionContext, commandCwd: vector.cwd });
      for (const path of effect.local_writes) localWrites.add(path);
    }
    for (const name of CHARGE_NAMES) {
      aggregate[name] += charges[name];
      if (command.operation_charges[name] !== charges[name]) add(diagnostics, 'BUDGET_CONTRACT_INCONSISTENT', `/commands/${index}/operation_charges/${name}`, { operation: name, authored: command.operation_charges[name], derived_minimum: charges[name] }, command.id);
    }
    byCommand.set(command.id, { ...charges, external_mutations: [...externalMutations].sort(compareUtf8), local_writes: [...localWrites].sort(compareUtf8) });
  }
  return { aggregate, byCommand };
}

function sortDiagnostics(records) {
  return records.sort((left, right) =>
    compareUtf8(left.code, right.code) ||
    compareUtf8(left.location_json_pointer, right.location_json_pointer) ||
    compareUtf8(left.command_id_or_null ?? '', right.command_id_or_null ?? ''),
  );
}

function add(records, code, location, evidence = {}, commandId = null) {
  records.push(diagnostic(code, { location_json_pointer: location, command_id_or_null: commandId, sanitized_evidence: evidence }));
}

function secretBearingPointer(value, key = '', pointer = '') {
  const allowedNameOnly = key === 'environment_names';
  if (!allowedNameOnly && /(?:^|_)(?:api_key|access_key|private_key|authorization|bearer|cookie|credential|password|secret|session|token)(?:_|$)/iu.test(key)) return pointer;
  if (typeof value === 'string') {
    if (allowedNameOnly) return null;
    if (/\b(?:authorization\s*:|bearer\s+[A-Za-z0-9._~+\/-]{4,}|(?:api|access|private)[_-]?key\s*[=:]|(?:cookie|credential|password|secret|session|token)\s*[=:])\s*\S+/iu.test(value) || /\bsk[-_][A-Za-z0-9_-]{16,}\b/u.test(value) || /\bpk_[A-Za-z0-9_-]{8,}\b/u.test(value) || /\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16}|eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,})\b/u.test(value)) return pointer;
    return null;
  }
  if (value === null || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = secretBearingPointer(value[index], key, `${pointer}/${index}`);
      if (found !== null) return found;
    }
    return null;
  }
  for (const childKey of Object.keys(value)) {
    const found = secretBearingPointer(value[childKey], childKey, `${pointer}/${childKey}`);
    if (found !== null) return found;
  }
  return null;
}

function verifyBudgets(spec, diagnostics) {
  const aggregate = Object.fromEntries(CHARGE_NAMES.map((name) => [name, 0]));
  for (const command of spec.commands) for (const name of CHARGE_NAMES) aggregate[name] += command.operation_charges[name];
  for (const conditional of spec.conditional_scopes ?? []) {
    for (const name of CHARGE_NAMES) {
      const trueCharge = Number.isInteger(conditional?.true_operation_charges?.[name]) ? conditional.true_operation_charges[name] : 0;
      const falseCharge = Number.isInteger(conditional?.false_operation_charges?.[name]) ? conditional.false_operation_charges[name] : 0;
      aggregate[name] += Math.max(trueCharge, falseCharge);
    }
  }
  for (const name of CHARGE_NAMES) {
    if (aggregate[name] > spec.operation_budgets[name]) add(diagnostics, 'BUDGET_AGGREGATE_OVERFLOW', `/operation_budgets/${name}`, { operation: name, aggregate: aggregate[name], ceiling: spec.operation_budgets[name] });
  }
  return aggregate;
}

function verifyStateGraph(spec, diagnostics) {
  const active = new Set(spec.state_model.initial_states);
  const invalidations = new Map(spec.state_model.invalidations.map((entry) => [entry.command_id, entry.states]));
  for (const command of spec.commands) {
    for (const prerequisite of command.prerequisite_state) {
      if (!active.has(prerequisite)) add(diagnostics, 'STATE_TRANSITION_INVALID', '/commands', { state: prerequisite, reason: 'prerequisite not active' }, command.id);
      const namespace = stateNamespace(prerequisite);
      if (namespace === null) add(diagnostics, 'STATE_TRANSITION_INVALID', '/commands', { state: prerequisite, reason: 'unknown prerequisite namespace' }, command.id);
      else if (namespace !== 'INVARIANT' && namespace !== command.compatibility_timepoint) add(diagnostics, 'STATE_TRANSITION_INVALID', '/commands', { state: prerequisite, command_timepoint: command.compatibility_timepoint, reason: 'prerequisite namespace mismatch' }, command.id);
    }
    for (const state of invalidations.get(command.id) ?? []) active.delete(state);
    for (const state of command.produced_state) if (stateNamespace(state) === null) add(diagnostics, 'STATE_TRANSITION_INVALID', '/commands', { state, reason: 'unknown produced namespace' }, command.id);
    const prerequisiteNamespaces = new Set(command.prerequisite_state.map(stateNamespace).filter((namespace) => namespace !== null && namespace !== 'INVARIANT'));
    const producedNamespaces = new Set(command.produced_state.map(stateNamespace).filter((namespace) => namespace !== null && namespace !== 'INVARIANT'));
    for (const from of prerequisiteNamespaces) for (const to of producedNamespaces) {
      if (from === to) continue;
      const adapterState = command.required_runner_state.find((state) => /^COMPATIBILITY_ADAPTER_V\d+:/u.test(state));
      const adapterMatch = adapterState === undefined ? null : /^COMPATIBILITY_ADAPTER_V(\d+):([A-Z0-9_-]+)$/u.exec(adapterState);
      const adapter = adapterMatch === null ? undefined : spec.compatibility_adapters.find((candidate) => candidate.id === adapterMatch[2] && candidate.version === Number(adapterMatch[1]));
      if (adapter === undefined || adapter.from !== from || adapter.to !== to) add(diagnostics, 'HISTORICAL_CURRENT_IDENTITY_COLLISION', '/commands', { from, to, reason: 'cross-timepoint transition lacks exact adapter' }, command.id);
    }
    for (const state of command.produced_state) active.add(state);
  }
  return active;
}

function stateNamespace(state) {
  for (const namespace of ['HISTORICAL', 'CURRENT', 'PRE_RUNTIME', 'POST_RUNTIME', 'INVARIANT']) if (state === namespace || state.startsWith(`${namespace}_`)) return namespace;
  return null;
}

function verifyExternalResources(spec, diagnostics, activeStates, derivedByCommand) {
  const commands = new Map(spec.commands.map((command) => [command.id, command]));
  const resourceIds = new Set(); const cleanupIdentities = new Set(); const commandOwners = new Map(); const rolesByCommand = new Map();
  const rollbackOwnersByMutation = new Map();
  for (const rollback of spec.rollbacks) for (const mutationId of rollback.mutation_ids) {
    if (!rollbackOwnersByMutation.has(mutationId)) rollbackOwnersByMutation.set(mutationId, []);
    rollbackOwnersByMutation.get(mutationId).push(rollback);
  }
  for (const [index, resource] of spec.external_resources.entries()) {
    if (resourceIds.has(resource.id)) add(diagnostics, 'EXTERNAL_RESOURCE_CLEANUP_IDENTITY_MISSING', `/external_resources/${index}`, { reason: 'duplicate resource id' });
    resourceIds.add(resource.id);
    if (cleanupIdentities.has(resource.cleanup_identity)) add(diagnostics, 'EXTERNAL_RESOURCE_CLEANUP_IDENTITY_MISSING', `/external_resources/${index}/cleanup_identity`, { resource_id: resource.id, reason: 'cleanup identity is not unique' });
    cleanupIdentities.add(resource.cleanup_identity);
    for (const [role, commandId] of [['create', resource.create_command_id], ['verify', resource.verify_command_id], ['cleanup', resource.cleanup_command_id]]) {
      if (!rolesByCommand.has(commandId)) rolesByCommand.set(commandId, []);
      rolesByCommand.get(commandId).push({ resource_id: resource.id, role });
      if (commandOwners.has(commandId)) add(diagnostics, 'ROLLBACK_RESOURCE_UNCOVERED', `/external_resources/${index}/${role}_command_id`, { resource_id: resource.id, reason: 'resource command role is not bijective' });
      else commandOwners.set(commandId, `${resource.id}:${role}`);
    }
    const create = commands.get(resource.create_command_id);
    const verify = commands.get(resource.verify_command_id);
    const cleanup = commands.get(resource.cleanup_command_id);
    const stableIdentity = /^[A-Za-z0-9][A-Za-z0-9._:/-]{3,239}$/u.test(resource.cleanup_identity) && !/(?:latest|newest|\*)/iu.test(resource.cleanup_identity);
    if (!stableIdentity) add(diagnostics, 'EXTERNAL_RESOURCE_CLEANUP_IDENTITY_MISSING', `/external_resources/${index}/cleanup_identity`, { resource_id: resource.id });
    if (create === undefined || verify === undefined || cleanup === undefined || !(create.sequence < verify.sequence && verify.sequence < cleanup.sequence)) {
      add(diagnostics, 'ROLLBACK_RESOURCE_UNCOVERED', `/external_resources/${index}`, { resource_id: resource.id, reason: 'create verify cleanup bijection or order' });
      continue;
    }
    const identityState = `POST_RUNTIME_CLEANUP_IDENTITY:${resource.cleanup_identity}`;
    const expectedTerminal = `POST_RUNTIME_EXTERNAL_RESOURCE_ABSENT:${resource.id}:${resource.cleanup_identity}`;
    const argvBound = cleanup.argv.includes(resource.cleanup_identity);
    const cleanupStateBound = cleanup.prerequisite_state.includes(identityState) && cleanup.produced_state.includes(expectedTerminal);
    const createBound = create.produced_state.includes(identityState);
    const rollbackOwners = rollbackOwnersByMutation.get(create.id) ?? [];
    if (rollbackOwners.length !== 1) add(diagnostics, 'ROLLBACK_RESOURCE_UNCOVERED', `/external_resources/${index}`, { resource_id: resource.id, reason: 'rollback mutation ownership is not unique' }, create.id);
    const rollback = rollbackOwners.length === 1 ? rollbackOwners[0] : undefined;
    const terminal = rollback?.terminal_state ?? '';
    const terminalBound = terminal === expectedTerminal && cleanup.produced_state.includes(expectedTerminal) && activeStates.has(expectedTerminal);
    if (!argvBound || !cleanupStateBound || !createBound || !terminalBound) add(diagnostics, 'EXTERNAL_RESOURCE_CLEANUP_IDENTITY_MISSING', `/external_resources/${index}/cleanup_identity`, { resource_id: resource.id, reason: 'identity not bound to create, cleanup argv/state, and rollback terminal' });
    if (!create.produced_state.includes(`POST_RUNTIME_EXTERNAL_RESOURCE:${resource.id}`) || !terminalBound || rollback === undefined || create.rollback_id !== rollback.id) {
      add(diagnostics, 'ROLLBACK_RESOURCE_UNCOVERED', `/external_resources/${index}`, { resource_id: resource.id, reason: 'resource or terminal state proof' });
    }
    const createKinds = derivedByCommand.get(create.id)?.external_mutations ?? [];
    const verifyKinds = derivedByCommand.get(verify.id)?.external_mutations ?? [];
    const cleanupKinds = derivedByCommand.get(cleanup.id)?.external_mutations ?? [];
    if (createKinds.length > 1 || cleanupKinds.length > 1) add(diagnostics, 'ROLLBACK_RESOURCE_UNCOVERED', `/external_resources/${index}/mutation_kind`, { resource_id: resource.id, reason: 'multi-kind external mutation is ambiguous' });
    if (createKinds.length === 1 && createKinds[0] !== resource.mutation_kind || cleanupKinds.length === 1 && cleanupKinds[0] !== resource.mutation_kind) add(diagnostics, 'ROLLBACK_RESOURCE_UNCOVERED', `/external_resources/${index}/mutation_kind`, { resource_id: resource.id, reason: 'external mutation kind mismatch' });
    if (verifyKinds.length > 0) add(diagnostics, 'ROLLBACK_RESOURCE_UNCOVERED', `/external_resources/${index}/verify_command_id`, { mutation_id: verify.id, resource_id: resource.id, reason: 'derived external mutation has no exact lifecycle role' }, verify.id);
  }
  for (const [commandId] of commands) {
    const derivedMutations = derivedByCommand.get(commandId)?.external_mutations ?? [];
    const roles = rolesByCommand.get(commandId) ?? [];
    if (derivedMutations.length > 0 && (roles.length !== 1 || !['create', 'cleanup'].includes(roles[0].role))) {
      add(diagnostics, 'ROLLBACK_RESOURCE_UNCOVERED', '/external_resources', { mutation_id: commandId, reason: 'derived external mutation has no exact lifecycle role' }, commandId);
    }
    for (const role of roles) {
      if (['create', 'cleanup'].includes(role.role) && derivedMutations.length === 0) add(diagnostics, 'ROLLBACK_RESOURCE_UNCOVERED', '/external_resources', { mutation_id: commandId, resource_id: role.resource_id, reason: 'lifecycle mutation role lacks exact derived external mutation' }, commandId);
    }
  }
  return commands;
}

function verifyRollback(spec, diagnostics, commands, derivedByCommand) {
  const cleanupCommandIds = new Set(spec.external_resources.map((resource) => resource.cleanup_command_id));
  const rollbackById = new Map(spec.rollbacks.map((rollback) => [rollback.id, rollback]));
  for (const [index, command] of spec.commands.entries()) {
    if (cleanupCommandIds.has(command.id)) continue;
    const derived = derivedByCommand.get(command.id) ?? zeroCharges();
    const exactWrites = [...new Set([...command.writes, ...(derived.local_writes ?? [])])];
    const mutation = exactWrites.length > 0 || derived.database > 0 || derived.deployments > 0 || derived.git_commits > 0 || derived.git_pushes > 0 || command.produced_state.some((state) => state.includes('_EXTERNAL_RESOURCE:'));
    if (!mutation) continue;
    const rollback = rollbackById.get(command.rollback_id);
    if (rollback === undefined || !rollback.mutation_ids.includes(command.id) || exactWrites.some((path) => !rollback.cleanup_paths.includes(path))) add(diagnostics, 'ROLLBACK_RESOURCE_UNCOVERED', `/commands/${index}/rollback_id`, { mutation_id: command.id, reason: 'mutation or written path not covered' }, command.id);
  }
  for (const [index, rollback] of spec.rollbacks.entries()) {
    if (!rollback.mutation_ids.every((id) => commands.has(id)) || !spec.commands.some((command) => command.produced_state.includes(rollback.terminal_state))) {
      add(diagnostics, 'ROLLBACK_RESOURCE_UNCOVERED', `/rollbacks/${index}`, { rollback_id: rollback.id, reason: 'mutation or terminal proof missing' });
    }
    const authorizedPaths = new Set([...spec.scope.create_paths, ...spec.scope.modify_paths]);
    if (rollback.cleanup_paths.some((path) => !authorizedPaths.has(path))) add(diagnostics, 'ROLLBACK_RESOURCE_UNCOVERED', `/rollbacks/${index}/cleanup_paths`, { rollback_id: rollback.id, reason: 'cleanup path outside mutable scope' });
  }
}

function verifyTargetOrder(spec, diagnostics, commands, derivedByCommand) {
  const effects = spec.commands.filter((command) => TARGET_EFFECT_NAMES.some((name) => derivedByCommand.get(command.id)?.[name] > 0));
  if (!spec.target_confirmation.required) {
    if (effects.length !== 0) add(diagnostics, 'TARGET_CONFIRMATION_ORDER_INVALID', '/target_confirmation', { reason: 'target effect without confirmation contract' });
    if (spec.target_confirmation.confirmation_command_id !== '' || spec.target_confirmation.first_effect_command_id !== '' || spec.target_confirmation.one_use !== false) add(diagnostics, 'TARGET_CONFIRMATION_ORDER_INVALID', '/target_confirmation', { reason: 'inactive target confirmation retains authority residue' });
    return;
  }
  const confirmation = commands.get(spec.target_confirmation.confirmation_command_id);
  const firstEffect = commands.get(spec.target_confirmation.first_effect_command_id);
  if (confirmation === undefined || firstEffect === undefined || effects[0]?.id !== firstEffect.id || !spec.target_confirmation.one_use) {
    add(diagnostics, 'TARGET_CONFIRMATION_ORDER_INVALID', '/target_confirmation', { reason: 'missing exact one-use boundary' });
    return;
  }
  const ordered = [...spec.commands].sort((left, right) => left.sequence - right.sequence);
  const effectIndex = ordered.findIndex((command) => command.id === firstEffect.id);
  if (effectIndex === 0 || ordered[effectIndex - 1].id !== confirmation.id || !confirmation.produced_state.includes('PRE_RUNTIME_TARGET_CONFIRMED') || !firstEffect.prerequisite_state.includes('PRE_RUNTIME_TARGET_CONFIRMED')) {
    add(diagnostics, 'TARGET_CONFIRMATION_ORDER_INVALID', '/target_confirmation', { reason: 'confirmation is not immediately before first effect' }, firstEffect.id);
  }
  if (!confirmation.prerequisite_state.includes('INVARIANT_LOCAL_GATES_COMPLETE')) add(diagnostics, 'TARGET_CONFIRMATION_ORDER_INVALID', '/target_confirmation', { reason: 'confirmation not after local gates' }, confirmation.id);
  if (spec.commands.filter((command) => command.prerequisite_state.includes('PRE_RUNTIME_TARGET_CONFIRMED')).length !== 1) add(diagnostics, 'TARGET_CONFIRMATION_ORDER_INVALID', '/target_confirmation', { reason: 'confirmation not one-use' });
}

function verifyGit(spec, derivedAggregate, diagnostics) {
  const expectedStagePaths = [...spec.scope.create_paths, ...spec.scope.modify_paths].sort(compareUtf8);
  const stagedPaths = [...spec.git.staged_paths].sort(compareUtf8);
  const mismatch = derivedAggregate.git_commits !== spec.git.commit_count || derivedAggregate.git_pushes !== spec.git.push_count || spec.git.push_count > spec.git.commit_count || (spec.git.commit_count === 0 && (spec.git.commit_subject !== '' || stagedPaths.length !== 0)) || (spec.git.commit_count === 1 && (spec.git.commit_subject === '' || JSON.stringify(stagedPaths) !== JSON.stringify(expectedStagePaths)));
  if (mismatch) add(diagnostics, 'GIT_OPERATION_COUNT_INVALID', '/git', { reason: 'exact Git contract mismatch' });
}

function verifyConditionalScopes(spec, snapshot, diagnostics) {
  const authorized = new Set([...spec.scope.create_paths, ...spec.scope.modify_paths, ...spec.scope.preserve_paths, ...spec.scope.exclude_paths]);
  const rollbackById = new Map(spec.rollbacks.map((rollback) => [rollback.id, rollback]));
  const selections = [];
  for (const [index, conditional] of spec.conditional_scopes.entries()) {
    const record = snapshot?.paths?.find((candidate) => candidate.path === conditional.predicate_input_path);
    let selected = null;
    if (record === undefined) add(diagnostics, 'CONDITIONAL_SCOPE_AMBIGUOUS', `/conditional_scopes/${index}`, { reason: 'predicate input evidence absent' });
    else if (conditional.predicate === 'PATH_IDENTITY_MATCH') selected = record.sha256 === conditional.predicate_expected;
    else if (record.content_utf8 === undefined) add(diagnostics, 'CONDITIONAL_SCOPE_AMBIGUOUS', `/conditional_scopes/${index}`, { reason: 'predicate content evidence absent' });
    else if (conditional.predicate === 'STATIC_DIAGNOSTIC_PRESENT') selected = record.content_utf8.includes(conditional.predicate_expected);
    else if (conditional.predicate === 'STATIC_DIAGNOSTIC_ABSENT') selected = !record.content_utf8.includes(conditional.predicate_expected);
    const allPaths = [...(conditional.true_paths ?? []), ...(conditional.false_paths ?? [])];
    const allRollbackIds = [...(conditional.true_rollback_ids ?? []), ...(conditional.false_rollback_ids ?? [])];
    const branchCovered = (paths, rollbackIds) => {
      const cleanupPaths = new Set(rollbackIds.flatMap((id) => rollbackById.get(id)?.cleanup_paths ?? []));
      return paths.every((path) => cleanupPaths.has(path));
    };
    const trueCovered = branchCovered(conditional.true_paths ?? [], conditional.true_rollback_ids ?? []);
    const falseCovered = branchCovered(conditional.false_paths ?? [], conditional.false_rollback_ids ?? []);
    if (selected === null || allPaths.some((path) => !authorized.has(path)) || allRollbackIds.some((id) => !rollbackById.has(id)) || !trueCovered || !falseCovered) add(diagnostics, 'CONDITIONAL_SCOPE_AMBIGUOUS', `/conditional_scopes/${index}`, { reason: 'unsupported, incomplete, uncovered, or out-of-authority branch' });
    else selections.push({ id: conditional.id, selected_branch: selected ? 'TRUE' : 'FALSE', evidence_path: conditional.predicate_input_path });
  }
  return selections;
}

export function validateOperationContract({ spec, snapshot = { paths: [] } }) {
  const diagnostics = [];
  const secretPointer = secretBearingPointer(spec);
  if (secretPointer !== null) add(diagnostics, 'SECRET_BEARING_FIELD_FORBIDDEN', secretPointer, { reason: 'secret-bearing authored content' });
  const aggregate = verifyBudgets(spec, diagnostics);
  const derived = deriveOperationAuthority(spec, snapshot, diagnostics);
  const activeStates = verifyStateGraph(spec, diagnostics);
  const commands = verifyExternalResources(spec, diagnostics, activeStates, derived.byCommand);
  verifyRollback(spec, diagnostics, commands, derived.byCommand);
  verifyTargetOrder(spec, diagnostics, commands, derived.byCommand);
  verifyGit(spec, derived.aggregate, diagnostics);
  const conditionalSelections = verifyConditionalScopes(spec, snapshot, diagnostics);
  const sorted = sortDiagnostics(diagnostics);
  return deepFreeze({ valid: sorted.length === 0, aggregate, derived_aggregate: derived.aggregate, active_states: [...activeStates].sort(compareUtf8), conditional_selections: conditionalSelections, diagnostics: sorted });
}
