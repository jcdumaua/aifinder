import { bufferIdentity, deepFreeze, repositorySnapshotDigest } from '../canonical.mjs';
import { validateCommandDependencies } from '../command-dependency-validator.mjs';

const zeroCharges = Object.freeze({
  network: 0,
  database: 0,
  deployments: 0,
  git_commits: 0,
  git_pushes: 0,
  compiled_commands: 0,
});

function clone(value) {
  return structuredClone(value);
}

function snapshotRecord(path, content, role = 'PRESERVE') {
  const identity = bufferIdentity(Buffer.from(content));
  return {
    path,
    role,
    state: 'TRACKED',
    mode: '100644',
    blob: '6'.repeat(40),
    sha256: identity.sha256,
    bytes: identity.bytes,
    lf: identity.lf,
    cr: identity.cr,
    content_utf8: content,
  };
}

function refreshSnapshotDigest(snapshot) {
  const { snapshot_digest: omittedDigest, final_marker: omittedMarker, ...body } = snapshot;
  void omittedDigest;
  void omittedMarker;
  snapshot.snapshot_digest = repositorySnapshotDigest(body);
}

function bindDependencyFacts(spec, snapshot) {
  snapshot.derived_dependency_facts = validateCommandDependencies({ spec, snapshot }).derived_dependency_facts;
}

function addTrackedSource(spec, snapshot, path, content, { role = 'PRESERVE', inScope = true } = {}) {
  if (inScope) {
    const setName = role === 'MODIFY' ? 'modify_paths' : 'preserve_paths';
    if (!spec.scope[setName].includes(path)) spec.scope[setName].push(path);
    if (!spec.scope.read_content_paths.includes(path)) spec.scope.read_content_paths.push(path);
  }
  snapshot.paths.push(snapshotRecord(path, content, role));
}

function baseCommand(overrides = {}) {
  return {
    id: 'SYNTHETIC_COMMAND',
    sequence: 1,
    context: 'DIRECT',
    argv: ['/usr/bin/true'],
    cwd: 'testing',
    reads: [],
    writes: [],
    environment_names: [],
    prerequisite_state: [],
    produced_state: [],
    expected: { exit: 0, stdout: '', stderr: '' },
    required_manifest_state: [],
    required_runner_state: [],
    compatibility_timepoint: 'CURRENT',
    source_references: [],
    operation_charges: { ...zeroCharges },
    rollback_id: '',
    ...overrides,
  };
}

export function positiveFixtures(referenceSpec, referenceSnapshot) {
  const p01 = { id: 'P01', spec: clone(referenceSpec), snapshot: clone(referenceSnapshot) };
  const p02Spec = clone(referenceSpec);
  p02Spec.phase_id = 'P02';
  p02Spec.workstream = 'SYNTHETIC_P02_EXTERNAL_OPERATION';
  p02Spec.operation_budgets.network = 3;
  p02Spec.operation_budgets.deployments = 2;
  p02Spec.state_model.initial_states = ['INVARIANT_BASELINE_VERIFIED'];
  p02Spec.compatibility_adapters = [{ id: 'RUNTIME_EFFECT', version: 1, from: 'PRE_RUNTIME', to: 'POST_RUNTIME', paths: [] }];
  p02Spec.commands = [
    baseCommand({ id: 'LOCAL_GATE', sequence: 1, compatibility_timepoint: 'INVARIANT', prerequisite_state: ['INVARIANT_BASELINE_VERIFIED'], produced_state: ['INVARIANT_LOCAL_GATES_COMPLETE'] }),
    baseCommand({ id: 'TARGET_CONFIRM', sequence: 2, compatibility_timepoint: 'PRE_RUNTIME', prerequisite_state: ['INVARIANT_LOCAL_GATES_COMPLETE'], produced_state: ['PRE_RUNTIME_TARGET_CONFIRMED'] }),
    baseCommand({ id: 'CREATE_PREVIEW', sequence: 3, argv: ['/usr/local/bin/vercel', 'deploy'], compatibility_timepoint: 'PRE_RUNTIME', prerequisite_state: ['PRE_RUNTIME_TARGET_CONFIRMED'], produced_state: ['POST_RUNTIME_EXTERNAL_RESOURCE:PREVIEW_1', 'POST_RUNTIME_CLEANUP_IDENTITY:preview-id:synthetic-preview-1'], required_runner_state: ['COMPATIBILITY_ADAPTER_V1:RUNTIME_EFFECT'], operation_charges: { ...zeroCharges, network: 1, deployments: 1 }, rollback_id: 'ROLLBACK_PREVIEW' }),
    baseCommand({ id: 'VERIFY_PREVIEW', sequence: 4, argv: ['/usr/local/bin/vercel', 'inspect'], compatibility_timepoint: 'POST_RUNTIME', prerequisite_state: ['POST_RUNTIME_EXTERNAL_RESOURCE:PREVIEW_1'], produced_state: ['POST_RUNTIME_PREVIEW_VERIFIED'], operation_charges: { ...zeroCharges, network: 1 } }),
    baseCommand({ id: 'CLEANUP_PREVIEW', sequence: 5, compatibility_timepoint: 'POST_RUNTIME', argv: ['/usr/local/bin/vercel', 'remove', 'preview-id:synthetic-preview-1'], prerequisite_state: ['POST_RUNTIME_PREVIEW_VERIFIED', 'POST_RUNTIME_CLEANUP_IDENTITY:preview-id:synthetic-preview-1'], produced_state: ['POST_RUNTIME_EXTERNAL_RESOURCE_ABSENT:PREVIEW_1:preview-id:synthetic-preview-1'], operation_charges: { ...zeroCharges, network: 1, deployments: 1 } }),
  ];
  p02Spec.external_resources = [{
    id: 'PREVIEW_1',
    mutation_kind: 'DEPLOYMENT',
    create_command_id: 'CREATE_PREVIEW',
    verify_command_id: 'VERIFY_PREVIEW',
    cleanup_command_id: 'CLEANUP_PREVIEW',
    cleanup_identity: 'preview-id:synthetic-preview-1',
  }];
  p02Spec.rollbacks = [{ id: 'ROLLBACK_PREVIEW', mutation_ids: ['CREATE_PREVIEW'], cleanup_paths: [], terminal_state: 'POST_RUNTIME_EXTERNAL_RESOURCE_ABSENT:PREVIEW_1:preview-id:synthetic-preview-1' }];
  p02Spec.target_confirmation = { required: true, confirmation_command_id: 'TARGET_CONFIRM', first_effect_command_id: 'CREATE_PREVIEW', one_use: true };
  const p02Snapshot = clone(referenceSnapshot);
  p02Snapshot.repository_id = p02Spec.repository.repository_id;
  bindDependencyFacts(p02Spec, p02Snapshot);
  refreshSnapshotDigest(p02Snapshot);

  const p03Spec = clone(referenceSpec);
  p03Spec.phase_id = 'P03';
  p03Spec.workstream = 'SYNTHETIC_P03_COMPATIBILITY';
  p03Spec.state_model.initial_states = ['HISTORICAL_IDENTITY_BOUND'];
  p03Spec.compatibility_adapters = [{ id: 'HISTORICAL_GOVERNANCE', version: 1, from: 'HISTORICAL', to: 'CURRENT', paths: ['testing/current-governance.json'] }];
  p03Spec.commands = [baseCommand({
    id: 'HISTORICAL_READ',
    context: 'RUNNER_CHILD',
    argv: ['/usr/bin/node', './synthetic-p03.mjs'],
    reads: ['testing/current-governance.json'],
    prerequisite_state: ['HISTORICAL_IDENTITY_BOUND'],
    produced_state: ['CURRENT_IDENTITY_CONFIRMED'],
    expected: { exit: 0, stdout: 'PASS_SYNTHETIC_P03\n', stderr: '' },
    required_manifest_state: [],
    required_runner_state: ['COMPATIBILITY_ADAPTER_V1:HISTORICAL_GOVERNANCE'],
    compatibility_timepoint: 'HISTORICAL',
    source_references: ['testing/synthetic-p03.mjs'],
  })];
  const p03Snapshot = clone(referenceSnapshot);
  p03Snapshot.repository_id = p03Spec.repository.repository_id;
  addTrackedSource(
    p03Spec,
    p03Snapshot,
    'testing/synthetic-p03.mjs',
    "import { readFileSync } from 'node:fs';\nreadFileSync('./current-governance.json');\n",
  );
  p03Spec.scope.modify_paths.push('testing/current-governance.json');
  p03Spec.scope.read_content_paths.push('testing/current-governance.json');
  p03Snapshot.paths.push(snapshotRecord('testing/current-governance.json', '{}\n', 'MODIFY'));
  bindDependencyFacts(p03Spec, p03Snapshot);
  refreshSnapshotDigest(p03Snapshot);
  return deepFreeze([
    p01,
    { id: 'P02', spec: p02Spec, snapshot: p02Snapshot },
    { id: 'P03', spec: p03Spec, snapshot: p03Snapshot },
  ]);
}

export const FAILURE_CATALOG = deepFreeze({
  N01: { title: 'phase-global request budget aggregate overflow', expected_codes: ['BUDGET_AGGREGATE_OVERFLOW'], historical_class: '33NA', mutation: 'duplicate-request-charge' },
  N02: { title: 'generic newest-file cleanup selection', expected_codes: ['AMBIGUOUS_EXECUTABLE_FILENAME'], historical_class: '33RA', mutation: 'generic-package-filename' },
  N03: { title: 'cleanup script filename collision', expected_codes: ['AMBIGUOUS_EXECUTABLE_FILENAME'], historical_class: '33UA', mutation: 'generic-cleanup-filename' },
  N04: { title: 'cleanup shell unbound commit variable', expected_codes: ['COMMAND_UNBOUND_VARIABLE'], historical_class: '33UA-v1', mutation: 'unbound-shell-variable' },
  N05: { title: 'marker final-LF identity mismatch', expected_codes: ['OUTPUT_FINAL_MARKER_MISMATCH'], historical_class: '33VA', mutation: 'marker-final-lf' },
  N06: { title: 'direct command reads mutable governance outside scope', expected_codes: ['SCOPE_DIRECT_COMMAND_DEPENDENCY'], historical_class: '33WA', mutation: 'direct-governance-dependency' },
  N07: { title: 'direct command expects incompatible manifest total', expected_codes: ['MANIFEST_COUNT_MISMATCH'], historical_class: '33WA', mutation: 'manifest-after-contradiction' },
  N08: { title: 'runner adapter offered to direct command', expected_codes: ['RUNNER_TOPOLOGY_MISMATCH'], historical_class: '33WA', mutation: 'direct-runner-adapter' },
  N09: { title: 'historical identity compared with mutable current governance', expected_codes: ['HISTORICAL_CURRENT_IDENTITY_COLLISION'], historical_class: '33WA-follow-up', mutation: 'historical-current-collision' },
  N10: { title: 'declared source dependency lacks snapshot content', expected_codes: ['COMMAND_DEPENDENCY_DECLARED_BUT_UNPROVEN'], historical_class: 'closure-risk', mutation: 'source-content-omitted' },
  N11: { title: 'static source discovers undeclared manifest read', expected_codes: ['COMMAND_DEPENDENCY_UNDECLARED'], historical_class: 'closure-risk', mutation: 'undeclared-static-read' },
  N12: { title: 'computed import cannot be bounded', expected_codes: ['COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'], historical_class: 'closure-risk', mutation: 'dynamic-import' },
  N13: { title: 'repository path traversal', expected_codes: ['PATH_TRAVERSAL_FORBIDDEN'], historical_class: 'path-attack', mutation: 'parent-segment' },
  N14: { title: 'snapshot source is a symlink', expected_codes: ['PATH_SYMLINK_FORBIDDEN'], historical_class: 'symlink-attack', mutation: 'symlink-mode' },
  N15: { title: 'shell command substitution injection surface', expected_codes: ['COMMAND_INJECTION_SURFACE'], historical_class: 'command-injection', mutation: 'command-substitution' },
  N16: { title: 'approval token leaks into Codex prompt', expected_codes: ['TOKEN_OCCURRENCE_MISMATCH'], historical_class: 'token-isolation', mutation: 'token-copy' },
  N17: { title: 'embedded Codex bytes differ by final LF', expected_codes: ['OUTPUT_EMBEDDING_MISMATCH'], historical_class: 'hash-confusion', mutation: 'embedded-byte-difference' },
  N18: { title: 'external preview lacks cleanup identity', expected_codes: ['ROLLBACK_RESOURCE_UNCOVERED'], historical_class: 'rollback-undercoverage', mutation: 'missing-resource-cleanup' },
  N19: { title: 'conditional repair predicate is free-form shell', expected_codes: ['CONDITIONAL_SCOPE_AMBIGUOUS'], historical_class: 'ambiguous-scope', mutation: 'free-form-condition' },
  N20: { title: 'snapshot head differs from authored baseline', expected_codes: ['REPOSITORY_IDENTITY_MISMATCH'], historical_class: 'stale-snapshot', mutation: 'snapshot-head-mismatch' },
  N21: { title: 'raw credential value is authored', expected_codes: ['SECRET_BEARING_FIELD_FORBIDDEN'], historical_class: 'secret-leakage', mutation: 'raw-credential-value' },
  N22: { title: 'generic canonical artifact name', expected_codes: ['AMBIGUOUS_ARTIFACT_FILENAME'], historical_class: 'artifact-collision', mutation: 'generic-artifact-filename' },
  N23: { title: 'snapshot evidence emits source content', expected_codes: ['SNAPSHOT_SOURCE_CONTENT_EMISSION'], historical_class: 'source-content-leakage', mutation: 'snapshot-source-emission' },
});

export function negativeFixture(id, referenceSpec, referenceSnapshot) {
  if (!(id in FAILURE_CATALOG)) throw new TypeError(`unknown failure fixture ${id}`);
  const spec = clone(referenceSpec);
  const snapshot = clone(referenceSnapshot);
  const extra = { rendererMutation: null };

  if (id === 'N01') {
    spec.operation_budgets.network = 1;
    spec.commands = [
      baseCommand({ id: 'REQUEST_ONE', sequence: 1, prerequisite_state: ['TARGET_CONFIRMED'], operation_charges: { ...zeroCharges, network: 1 } }),
      baseCommand({ id: 'REQUEST_TWO', sequence: 2, prerequisite_state: ['TARGET_CONFIRMED'], operation_charges: { ...zeroCharges, network: 1 } }),
    ];
  } else if (id === 'N02') {
    spec.commands = [baseCommand({ id: 'GENERIC_PACKAGE', argv: ['open', '02-Codex-Package-and-Prompt.md'], reads: ['02-Codex-Package-and-Prompt.md'] })];
  } else if (id === 'N03') {
    spec.commands = [baseCommand({ id: 'GENERIC_CLEANUP', argv: ['/bin/sh', 'cleanup.sh'], reads: ['cleanup.sh'] })];
  } else if (id === 'N04') {
    const sourcePath = 'testing/cleanup-33ua.sh';
    spec.commands = [baseCommand({ id: 'CLEANUP_33UA', argv: ['/bin/sh', sourcePath], source_references: [sourcePath] })];
    addTrackedSource(spec, snapshot, sourcePath, "set -u\nprintf '%s\\n' \"$COMMIT_SHA\"\n");
  } else if (id === 'N05') {
    extra.rendererMutation = { marker_bytes: 'AIFINDER_MARKER', expected_marker_bytes: 'AIFINDER_MARKER\n' };
  } else if (id === 'N06' || id === 'N07') {
    const sourcePath = 'testing/phase-33wa-green.mjs';
    const manifestPath = 'testing/static-test-safety-manifest.json';
    spec.commands = [baseCommand({
      id: 'PHASE_33WA_DIRECT_GREEN',
      argv: ['/usr/bin/node', `./${sourcePath.slice(sourcePath.lastIndexOf('/') + 1)}`],
      reads: [manifestPath],
      source_references: [sourcePath],
      required_manifest_state: [`MANIFEST_ENTRY:testing/phase-compiler-new.mjs:${id === 'N06' ? 'RUN_POLICY' : 'DENY'}`],
    })];
    spec.governance.manifest_path = manifestPath;
    spec.governance.manifest_transitions = [{ path: 'testing/phase-compiler-new.mjs', before_disposition: 'DENY', after_disposition: 'RUN_POLICY' }];
    addTrackedSource(spec, snapshot, sourcePath, "import { readFileSync } from 'node:fs';\nreadFileSync('./static-test-safety-manifest.json');\n");
    snapshot.paths.push(snapshotRecord(manifestPath, '{"entries":[{"path":"testing/phase-compiler-new.mjs","ci_disposition":"DENY"}]}\n', 'PRESERVE'));
    if (id === 'N07') {
      spec.scope.preserve_paths.push(manifestPath);
      spec.scope.read_content_paths.push(manifestPath);
    }
  } else if (id === 'N08') {
    spec.commands = [baseCommand({ id: 'DIRECT_WITH_ADAPTER', required_runner_state: ['RUNNER_ADAPTER_V1:LEGACY_MANIFEST'] })];
  } else if (id === 'N09') {
    const path = 'testing/current-governance.json';
    spec.scope.modify_paths.push(path);
    spec.scope.read_content_paths.push(path);
    snapshot.paths.push(snapshotRecord(path, '{}\n', 'MODIFY'));
    spec.commands = [baseCommand({ id: 'HISTORICAL_COLLISION', reads: [path], compatibility_timepoint: 'HISTORICAL' })];
  } else if (id === 'N10') {
    const path = 'testing/missing-source.mjs';
    spec.scope.preserve_paths.push(path);
    const record = snapshotRecord(path, '');
    delete record.content_utf8;
    snapshot.paths.push(record);
    spec.commands = [baseCommand({ id: 'UNPROVEN_SOURCE', argv: ['/usr/bin/node', `./${path.slice(path.lastIndexOf('/') + 1)}`], source_references: [path] })];
  } else if (id === 'N11') {
    const sourcePath = 'testing/undeclared-reader.mjs';
    spec.commands = [baseCommand({ id: 'UNDECLARED_READ', argv: ['/usr/bin/node', `./${sourcePath.slice(sourcePath.lastIndexOf('/') + 1)}`], source_references: [sourcePath] })];
    addTrackedSource(spec, snapshot, sourcePath, "import { readFileSync } from 'node:fs';\nreadFileSync('testing/static-test-safety-manifest.json');\n");
  } else if (id === 'N12') {
    const sourcePath = 'testing/dynamic-reader.mjs';
    spec.commands = [baseCommand({ id: 'DYNAMIC_IMPORT', argv: ['/usr/bin/node', `./${sourcePath.slice(sourcePath.lastIndexOf('/') + 1)}`], source_references: [sourcePath] })];
    addTrackedSource(spec, snapshot, sourcePath, "const name = process.argv[2];\nawait import(name);\n");
  } else if (id === 'N13') {
    spec.scope.create_paths = ['../escape.txt'];
  } else if (id === 'N14') {
    snapshot.paths[0].mode = '120000';
  } else if (id === 'N15') {
    spec.operation_budgets.compiled_commands = 1;
    spec.commands = [baseCommand({ id: 'SHELL_INJECTION', argv: ['/bin/sh', '-c', 'printf %s $(id)'], operation_charges: { ...zeroCharges, compiled_commands: 1 } })];
  } else if (id === 'N16') {
    extra.rendererMutation = { codex_prompt: 'APPROVE_AIFINDER_SYNTHETIC_'.padEnd(92, '0') };
  } else if (id === 'N17') {
    extra.rendererMutation = { standalone_codex: 'bytes\n', embedded_codex: 'bytes' };
  } else if (id === 'N18') {
    spec.commands = [
      baseCommand({ id: 'CREATE_PREVIEW', sequence: 1 }),
      baseCommand({ id: 'VERIFY_PREVIEW', sequence: 2 }),
      baseCommand({ id: 'CLEANUP_PREVIEW', sequence: 3 }),
    ];
    spec.external_resources = [{ id: 'PREVIEW_1', mutation_kind: 'DEPLOYMENT', create_command_id: 'CREATE_PREVIEW', verify_command_id: 'VERIFY_PREVIEW', cleanup_command_id: 'CLEANUP_PREVIEW', cleanup_identity: '' }];
  } else if (id === 'N19') {
    spec.conditional_scopes = [{ id: 'REPAIR_SCOPE', predicate: '$(test -f repair)', true_paths: [], false_paths: [] }];
  } else if (id === 'N20') {
    snapshot.head = '9'.repeat(40);
  } else if (id === 'N21') {
    spec.commands = [baseCommand({ id: 'RAW_CREDENTIAL', expected: { exit: 0, stdout: 'token=synthetic-not-a-secret', stderr: '' } })];
  } else if (id === 'N22') {
    extra.rendererMutation = { artifact_name: '02-Codex-Package-and-Prompt.md' };
  } else if (id === 'N23') {
    extra.rendererMutation = { snapshot_source_emission: true };
  }
  bindDependencyFacts(spec, snapshot);
  refreshSnapshotDigest(snapshot);
  return deepFreeze({ id, spec, snapshot, ...extra });
}

export function modeledPhase33waFixture(referenceSpec, referenceSnapshot) {
  const fixture = structuredClone(negativeFixture('N06', referenceSpec, referenceSnapshot));
  fixture.id = 'PHASE_33WA';
  fixture.spec.commands[0].required_manifest_state = ['MANIFEST_ENTRY:testing/phase-compiler-new.mjs:DENY'];
  refreshSnapshotDigest(fixture.snapshot);
  return deepFreeze(fixture);
}
