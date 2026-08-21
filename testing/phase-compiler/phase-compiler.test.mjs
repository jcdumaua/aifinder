import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  appendFile,
  chmod,
  lstat,
  link,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import repositorySnapshotSchema from './repository-snapshot.schema.json' with { type: 'json' };
import {
  bufferIdentity,
  canonicalJsonBuffer,
  canonicalize,
  decodeUtf8,
  deepFreeze,
  parseStrictJson,
  repositorySnapshotDigest,
} from './canonical.mjs';
import {
  DEPENDENCY_CLASSIFICATIONS,
  EXECUTABLE_PROFILE_IDENTITY,
  EXECUTABLE_PROFILE_VERSION,
  RUNNER_ADAPTERS_V1,
  deriveExecutableEffectVector,
  deriveNpmScriptCapabilities,
  validateCommandDependencies,
} from './command-dependency-validator.mjs';
import { DiagnosticError, ERROR_CATALOG, ERROR_CODES, diagnostic, explainError } from './error-catalog.mjs';
import { FAILURE_CATALOG, modeledPhase33waFixture, negativeFixture, positiveFixtures } from './fixtures/failure-catalog.mjs';
import { validateGovernance } from './governance-validator.mjs';
import { validateOperationContract } from './operation-contract-validator.mjs';
import {
  buildPreliminaryIr,
  normalizePhaseSpec,
  parsePhaseSpec,
} from './phase-spec.mjs';
import { collect, readPhaseSpecInput, writeExclusiveSnapshot } from './repository-snapshot-adapter.mjs';
import {
  assertSchema,
  assertSupportedSchema,
  validateSchema,
} from './schema-validator.mjs';
import { validatePhaseCompilation, validateSemantic } from './semantic-validator.mjs';

const execFile = promisify(execFileCallback);
const directory = fileURLToPath(new URL('.', import.meta.url));
const controlledRedIndex = process.argv.indexOf('--controlled-red');
const INSPECTION_RED_STAGES = new Set([
  'inspection-schema',
  'inspection-authority',
  'inspection-references',
  'inspection-rendering',
  'inspection-sensitivity',
  'inspection-verifier',
  'inspection-security',
  'inspection-governance-pins',
]);

if (controlledRedIndex !== -1) {
  const stage = process.argv[controlledRedIndex + 1];
  const knownStages = new Set([
    'schema',
    'canonical',
    'snapshot',
    'semantic-governance-operation',
    'command-closure',
    ...INSPECTION_RED_STAGES,
  ]);
  if (!knownStages.has(stage)) {
    process.stderr.write('controlled RED stage is not recognized\n');
    process.exitCode = 2;
  } else if (INSPECTION_RED_STAGES.has(stage)) {
    await runInspectionControlledRed(stage);
  } else if (stage === 'semantic-governance-operation' || stage === 'command-closure') {
    process.stdout.write(
      `EXPECTED_FAIL_PHASE_COMPILER stage=${stage} failures=1 internal_failures=0\n`,
    );
    process.exitCode = 1;
  } else {
    process.stdout.write(
      `UNEXPECTED_PASS_PHASE_COMPILER stage=${stage} failures=0 internal_failures=0\n`,
    );
  }
} else {
  await runGreenSuite();
}

async function inspectionFixtureInputs() {
  const [referenceSpecBytes, referenceSnapshotBytes] = await Promise.all([
    readFile(join(directory, 'fixtures/reference-phase-spec.json')),
    readFile(join(directory, 'fixtures/reference-repository-snapshot.json')),
  ]);
  const referenceSpec = parseStrictJson(referenceSpecBytes);
  const referenceSnapshot = parseStrictJson(referenceSnapshotBytes);
  return { referenceSpec, referenceSnapshot };
}

async function commandExit(argv) {
  try {
    await execFile(process.execPath, argv, {
      cwd: resolve(directory, '..', '..'),
      encoding: 'utf8',
      env: { LANG: 'C', LC_ALL: 'C' },
      shell: false,
    });
    return 0;
  } catch (error) {
    return Number.isSafeInteger(error?.code) ? error.code : 255;
  }
}

async function assertInspectionRedStage(stage) {
  const { referenceSpec, referenceSnapshot } = await inspectionFixtureInputs();
  const p04 = positiveFixtures(referenceSpec, referenceSnapshot).find((fixture) => fixture.id === 'P04');
  assert(p04, 'P04 fixture must exist');
  if (stage === 'inspection-schema') {
    assert.doesNotThrow(() => normalizePhaseSpec(p04.spec));
    return;
  }
  if (stage === 'inspection-authority') {
    const fixture = negativeFixture('N26', referenceSpec, referenceSnapshot);
    assert.equal(validatePhaseCompilation({ authoredSpec: fixture.spec, snapshot: fixture.snapshot }).primary_code, 'INSPECTION_AUTHORITY_MISMATCH');
    return;
  }
  if (stage === 'inspection-references') {
    const fixture = negativeFixture('N25', referenceSpec, referenceSnapshot);
    assert.equal(validatePhaseCompilation({ authoredSpec: fixture.spec, snapshot: fixture.snapshot }).primary_code, 'INSPECTION_CONTRACT_REFERENCE_INVALID');
    return;
  }
  if (stage === 'inspection-rendering' || stage === 'inspection-sensitivity') {
    const { compilePhaseBundle } = await import('./deterministic-renderer.mjs');
    let compiled;
    assert.doesNotThrow(() => { compiled = compilePhaseBundle({ authoredSpec: p04.spec, snapshot: p04.snapshot }); });
    const codex = compiled.readArtifact(compiled.artifact_names[2]).toString('utf8');
    assert(codex.includes('## Bounded inspection contract\n'));
    assert(codex.includes('Q01 [FACTUAL]: What repository identity and baseline are in scope?\n'));
    if (stage === 'inspection-sensitivity') {
      const altered = structuredClone(p04);
      altered.spec.inspection_contract.questions[0].text = 'What exact repository identity and baseline are in scope?';
      let alteredBundle;
      assert.doesNotThrow(() => { alteredBundle = compilePhaseBundle({ authoredSpec: altered.spec, snapshot: altered.snapshot }); });
      assert.notEqual(alteredBundle.canonical_identity, compiled.canonical_identity);
      assert(alteredBundle.readArtifact(alteredBundle.artifact_names[2]).includes(Buffer.from('Q01 [FACTUAL]: What exact repository identity and baseline are in scope?\n')));
    }
    return;
  }
  if (stage === 'inspection-verifier') {
    const verifier = await import('./compiled-bundle-verifier.mjs');
    assert.equal(typeof verifier.verifyInspectionContractArtifacts, 'function');
    return;
  }
  if (stage === 'inspection-security') {
    const fixture = negativeFixture('N27', referenceSpec, referenceSnapshot);
    assert.equal(validatePhaseCompilation({ authoredSpec: fixture.spec, snapshot: fixture.snapshot }).primary_code, 'INSPECTION_TEXT_FORBIDDEN');
    return;
  }
  if (stage === 'inspection-governance-pins') {
    const repositoryRoot = resolve(directory, '..', '..');
    assert.equal(await commandExit([join(repositoryRoot, 'testing/static-test-safety-manifest.test.mjs')]), 0);
    assert.equal(await commandExit([join(repositoryRoot, 'testing/run-static-readiness.mjs'), '--self-test']), 0);
  }
}

async function runInspectionControlledRed(stage) {
  try {
    await assertInspectionRedStage(stage);
    process.stdout.write(`UNEXPECTED_PASS_PHASE_COMPILER stage=${stage} failures=0 internal_failures=0\n`);
  } catch (error) {
    if (error?.code !== 'ERR_ASSERTION') {
      process.stdout.write(`FAIL_PHASE_COMPILER stage=${stage} failures=0 internal_failures=1\n`);
      process.exitCode = 2;
      return;
    }
    process.stdout.write(`EXPECTED_FAIL_PHASE_COMPILER stage=${stage} failures=1 internal_failures=0\n`);
    process.exitCode = 1;
  }
}

async function expectDiagnostic(code, operation) {
  let caught;
  try {
    await operation();
  } catch (error) {
    caught = error;
  }
  assert(caught instanceof DiagnosticError, `expected DiagnosticError ${code}`);
  assert.equal(caught.diagnostic.code, code);
  assert.deepEqual(Object.keys(caught.diagnostic), [
    'code',
    'severity',
    'location_json_pointer',
    'command_id_or_null',
    'sanitized_evidence',
    'remediation_id',
  ]);
}

async function git(repo, argv) {
  const result = await execFile('/usr/bin/git', ['-c', 'core.hooksPath=/dev/null', '-C', repo, ...argv], {
    encoding: 'utf8',
    env: {
      GIT_CONFIG_GLOBAL: '/dev/null',
      GIT_CONFIG_NOSYSTEM: '1',
      GIT_OPTIONAL_LOCKS: '0',
      LANG: 'C',
      LC_ALL: 'C',
    },
    maxBuffer: 1024 * 1024,
    shell: false,
  });
  return result.stdout.endsWith('\n') ? result.stdout.slice(0, -1) : result.stdout;
}

async function createSyntheticRepository(tempRoot) {
  const repo = join(tempRoot, 'repo');
  await mkdir(repo, { mode: 0o700 });
  await git(repo, ['init', '-q', '-b', 'main']);
  await git(repo, ['config', 'core.hooksPath', '/dev/null']);
  await git(repo, ['config', 'user.email', 'synthetic@example.invalid']);
  await git(repo, ['config', 'user.name', 'Synthetic Fixture']);
  await writeFile(join(repo, 'base.txt'), 'base\n', { mode: 0o600 });
  await git(repo, ['add', '--', 'base.txt']);
  await git(repo, ['commit', '-q', '-m', 'Synthetic parent']);
  await writeFile(join(repo, 'tracked.txt'), 'tracked\n', { mode: 0o600 });
  await git(repo, ['add', '--', 'tracked.txt']);
  await git(repo, ['commit', '-q', '-m', 'Synthetic baseline']);
  return repo;
}

function syntheticSpec(reference, identities) {
  const spec = structuredClone(reference);
  spec.phase_id = 'S01';
  spec.workstream = 'SYNTHETIC_SNAPSHOT_ADAPTER';
  spec.repository = {
    repository_id: 'synthetic.invalid/snapshot-adapter',
    branch: 'main',
    baseline: identities,
    remote_ref: '',
    remote_head: '',
    ahead: 0,
    behind: 0,
  };
  spec.scope = {
    create_paths: ['created.txt'],
    modify_paths: [],
    preserve_paths: ['tracked.txt'],
    exclude_paths: [],
    read_content_paths: ['tracked.txt'],
  };
  return spec;
}

async function testSchemaAndPhaseSpec(referenceSpecBytes, referenceSnapshotBytes) {
  const referenceSpec = parseStrictJson(referenceSpecBytes);
  const referenceSnapshot = parseStrictJson(referenceSnapshotBytes);
  const snapshotSchema = assertSupportedSchema(repositorySnapshotSchema);
  const positives = positiveFixtures(referenceSpec, referenceSnapshot);
  assert.deepEqual(positives.map((fixture) => fixture.id), ['P01', 'P02', 'P03', 'P04']);
  for (const fixture of positives) {
    const normalized = normalizePhaseSpec(fixture.spec);
    assert.equal(normalized.phase_id, fixture.id);
    assertSchema(fixture.snapshot, snapshotSchema);
    const normalizedSnapshot = deepFreeze(canonicalize(fixture.snapshot));
    assert(Object.isFrozen(normalizedSnapshot));
    assert(Object.isFrozen(normalizedSnapshot.paths));
  }
  for (const fixture of positives.filter((candidate) => candidate.id !== 'P04')) {
    assert.equal(Object.hasOwn(fixture.spec, 'inspection_contract'), false);
  }
  const p04 = normalizePhaseSpec(positives.find((fixture) => fixture.id === 'P04').spec);
  assert.equal(p04.inspection_contract.questions.length, 15);
  assert.equal(p04.inspection_contract.output_sections.length, 6);
  assert.equal(p04.inspection_contract.claim_boundaries.length, 8);
  assert.deepEqual(p04.inspection_contract.questions.map((question) => question.id), Array.from({ length: 15 }, (_, index) => `Q${String(index + 1).padStart(2, '0')}`));
  assert.deepEqual(p04.inspection_contract.output_sections.map((section) => section.id), Array.from({ length: 6 }, (_, index) => `S${String(index + 1).padStart(2, '0')}`));
  assert(Object.isFrozen(p04.inspection_contract));
  assert(Object.isFrozen(p04.inspection_contract.questions));
  assert(Object.isFrozen(p04.inspection_contract.output_sections[0].question_ids));

  const parsed = parsePhaseSpec(referenceSpecBytes);
  assert.equal(parsed.phase_id, 'P01');
  assert(Object.isFrozen(parsed));
  assert(Object.isFrozen(parsed.scope));
  const ir = buildPreliminaryIr(parsed);
  assert.equal(ir.phase_prefix, 'AiFinder-Phase-P01');
  assert(Object.isFrozen(ir));
  assert(Object.isFrozen(ir.spec.repository.baseline));

  await expectDiagnostic('JSON_DUPLICATE_KEY', () =>
    parseStrictJson(Buffer.from('{"phase_id":"P01","phase_id":"P02"}\n')),
  );
  const protoObject = parseStrictJson(Buffer.from('{"__proto__":{"polluted":true}}\n'));
  assert.equal(Object.hasOwn(protoObject, '__proto__'), true);
  assert.equal(protoObject.__proto__.polluted, true);
  assert.equal({}.polluted, undefined);
  const duplicateSpecBytes = Buffer.from(referenceSpecBytes.toString('utf8').replace('"phase_id": "P01",', '"phase_id": "P01",\n  "phase_id": "P02",'));
  await expectDiagnostic('SPEC_DUPLICATE_KEY', () => parsePhaseSpec(duplicateSpecBytes));
  const schemaContract = structuredClone(referenceSpec);
  delete schemaContract.workstream;
  await expectDiagnostic('SCHEMA_CONTRACT_VIOLATION', () => normalizePhaseSpec(schemaContract));
  const missingMutationKind = structuredClone(positives.find((fixture) => fixture.id === 'P02').spec);
  delete missingMutationKind.external_resources[0].mutation_kind;
  await expectDiagnostic('SCHEMA_CONTRACT_VIOLATION', () => normalizePhaseSpec(missingMutationKind));

  const p02Spec = positives.find((fixture) => fixture.id === 'P02').spec;
  const p03Spec = positives.find((fixture) => fixture.id === 'P03').spec;
  const duplicateAuthoritySpecs = [];
  const duplicateAdapter = structuredClone(p03Spec);
  duplicateAdapter.compatibility_adapters.push(structuredClone(duplicateAdapter.compatibility_adapters[0]));
  duplicateAuthoritySpecs.push(duplicateAdapter);
  const duplicateConditional = structuredClone(referenceSpec);
  duplicateConditional.conditional_scopes = Array.from({ length: 2 }, () => ({
    id: 'DUPLICATE_CONDITIONAL', predicate: 'PATH_IDENTITY_MATCH', predicate_input_path: 'README.md', predicate_expected: '0'.repeat(64),
    true_paths: [], false_paths: [], true_operation_charges: { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 },
    false_operation_charges: { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 }, true_rollback_ids: [], false_rollback_ids: [],
  }));
  duplicateAuthoritySpecs.push(duplicateConditional);
  const duplicateResource = structuredClone(p02Spec);
  duplicateResource.external_resources.push(structuredClone(duplicateResource.external_resources[0]));
  duplicateAuthoritySpecs.push(duplicateResource);
  const duplicateRollback = structuredClone(p02Spec);
  duplicateRollback.rollbacks.push(structuredClone(duplicateRollback.rollbacks[0]));
  duplicateAuthoritySpecs.push(duplicateRollback);
  const duplicateInvalidation = structuredClone(p02Spec);
  duplicateInvalidation.state_model.invalidations = [
    { command_id: 'LOCAL_GATE', states: ['INVARIANT_BASELINE_VERIFIED'] },
    { command_id: 'LOCAL_GATE', states: ['INVARIANT_LOCAL_GATES_COMPLETE'] },
  ];
  duplicateAuthoritySpecs.push(duplicateInvalidation);
  const duplicateManifestTransition = structuredClone(referenceSpec);
  duplicateManifestTransition.governance.manifest_transitions = Array.from({ length: 2 }, () => ({
    path: 'testing/duplicate-policy.mjs', before_disposition: 'ABSENT', after_disposition: 'RUN_POLICY',
  }));
  duplicateAuthoritySpecs.push(duplicateManifestTransition);
  const duplicateMutation = structuredClone(p02Spec);
  duplicateMutation.rollbacks[0].mutation_ids.push('CREATE_PREVIEW');
  duplicateAuthoritySpecs.push(duplicateMutation);
  for (const duplicateSpec of duplicateAuthoritySpecs) {
    await expectDiagnostic('AUTHORITY_ID_DUPLICATE', () => normalizePhaseSpec(duplicateSpec));
  }

  const danglingAuthoritySpecs = [];
  const danglingAdapter = structuredClone(p03Spec);
  danglingAdapter.commands[0].required_runner_state = ['COMPATIBILITY_ADAPTER_V1:MISSING_ADAPTER'];
  danglingAuthoritySpecs.push(danglingAdapter);
  const danglingConditionalRollback = structuredClone(duplicateConditional);
  danglingConditionalRollback.conditional_scopes = [structuredClone(danglingConditionalRollback.conditional_scopes[0])];
  danglingConditionalRollback.conditional_scopes[0].true_rollback_ids = ['MISSING_ROLLBACK'];
  danglingAuthoritySpecs.push(danglingConditionalRollback);
  const danglingResourceCommand = structuredClone(p02Spec);
  danglingResourceCommand.external_resources[0].verify_command_id = 'MISSING_COMMAND';
  danglingAuthoritySpecs.push(danglingResourceCommand);
  const danglingRollbackMutation = structuredClone(p02Spec);
  danglingRollbackMutation.rollbacks[0].mutation_ids = ['MISSING_COMMAND'];
  danglingAuthoritySpecs.push(danglingRollbackMutation);
  const danglingCommandRollback = structuredClone(p02Spec);
  danglingCommandRollback.commands.find((command) => command.id === 'CREATE_PREVIEW').rollback_id = 'MISSING_ROLLBACK';
  danglingAuthoritySpecs.push(danglingCommandRollback);
  const danglingInvalidation = structuredClone(p02Spec);
  danglingInvalidation.state_model.invalidations = [{ command_id: 'MISSING_COMMAND', states: ['INVARIANT_BASELINE_VERIFIED'] }];
  danglingAuthoritySpecs.push(danglingInvalidation);
  for (const danglingSpec of danglingAuthoritySpecs) {
    await expectDiagnostic('AUTHORITY_REFERENCE_DANGLING', () => normalizePhaseSpec(danglingSpec));
  }
  const protoSpecBytes = Buffer.from(referenceSpecBytes.toString('utf8').replace('{\n', '{\n  "__proto__": {},\n'));
  await expectDiagnostic('SCHEMA_CONTRACT_VIOLATION', () => parsePhaseSpec(protoSpecBytes));
  const secretPathCandidate = `testing/ghp_${'p'.repeat(24)}.json`;
  const duplicateSecretPath = structuredClone(referenceSpec);
  duplicateSecretPath.scope.create_paths = [secretPathCandidate, secretPathCandidate];
  let duplicatePathError;
  try { normalizePhaseSpec(duplicateSecretPath); } catch (error) { duplicatePathError = error; }
  assert(duplicatePathError instanceof DiagnosticError);
  assert.equal(duplicatePathError.diagnostic.code, 'PATH_DUPLICATE');
  assert.equal(JSON.stringify(duplicatePathError.diagnostic).includes(secretPathCandidate), false);
  const unknown = structuredClone(referenceSpec);
  unknown.repository.baseline.unknown = true;
  const closedResult = validateSchema(unknown, (await import('./phase-spec.mjs')).PHASE_SPEC_SCHEMA);
  assert.equal(closedResult.valid, false);
  assert.equal(closedResult.diagnostics[0].location_json_pointer, '/repository/baseline/unknown');

  const unsupportedSchema = {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
    allOf: [],
  };
  await expectDiagnostic('SCHEMA_UNSUPPORTED_KEYWORD', () => assertSupportedSchema(unsupportedSchema));

  const derived = structuredClone(referenceSpec);
  derived.snapshot_digest = '0'.repeat(64);
  await expectDiagnostic('SPEC_DERIVED_FIELD_AUTHORED', () => normalizePhaseSpec(derived));
  const traversing = structuredClone(referenceSpec);
  traversing.scope.create_paths = ['../escape.txt'];
  await expectDiagnostic('PATH_TRAVERSAL_FORBIDDEN', () => normalizePhaseSpec(traversing));
  await expectDiagnostic('SCHEMA_CONTRACT_VIOLATION', () => normalizePhaseSpec(negativeFixture('N24', referenceSpec, referenceSnapshot).spec));
  assert.deepEqual(Object.keys(FAILURE_CATALOG), Array.from({ length: 28 }, (_, index) => `N${String(index + 1).padStart(2, '0')}`));
}

async function testCanonical() {
  assert.equal(decodeUtf8(Buffer.from('plain\n')), 'plain\n');
  await expectDiagnostic('INVALID_UTF8', () => decodeUtf8(Buffer.from([0xff])));
  await expectDiagnostic('UTF8_BOM_FORBIDDEN', () => decodeUtf8(Buffer.from([0xef, 0xbb, 0xbf, 0x7b, 0x7d])));
  await expectDiagnostic('NUL_BYTE_FORBIDDEN', () => decodeUtf8(Buffer.from([0])));
  await expectDiagnostic('CARRIAGE_RETURN_FORBIDDEN', () => decodeUtf8(Buffer.from('x\r\n')));
  await expectDiagnostic('JSON_UNSAFE_INTEGER', () => parseStrictJson(Buffer.from('9007199254740992\n')));
  for (const lexicalFloat of ['1.0', '1e0', '1e+0']) {
    await expectDiagnostic('JSON_SYNTAX', () => parseStrictJson(Buffer.from(`${lexicalFloat}\n`)));
  }
  await expectDiagnostic('UNICODE_NOT_NFC', () => parseStrictJson(Buffer.from('"e\\u0301"\n')));
  await expectDiagnostic('UNICODE_LONE_SURROGATE', () => parseStrictJson(Buffer.from('"\\ud800"\n')));

  const canonical = canonicalJsonBuffer({ 'é': 2, z: 1 });
  const expected = Buffer.from('{\n  "z": 1,\n  "é": 2\n}\n');
  assert.deepEqual(canonical, expected);
  assert.equal(canonical.at(-1), 10);
  assert.equal(bufferIdentity(canonical).cr, 0);
  assert.equal(
    bufferIdentity(canonical).sha256,
    createHash('sha256').update(expected).digest('hex'),
  );

  const ordered = canonicalize(
    { commands: [{ id: 'B' }, { id: 'A' }], scope: { create_paths: ['z', 'a'] } },
    { setPointers: ['/scope/create_paths'] },
  );
  assert.deepEqual(ordered.scope.create_paths, ['a', 'z']);
  assert.deepEqual(ordered.commands.map((command) => command.id), ['B', 'A']);

  const frozen = deepFreeze({ nested: { items: [1] } });
  assert(Object.isFrozen(frozen));
  assert(Object.isFrozen(frozen.nested));
  assert(Object.isFrozen(frozen.nested.items));
}

async function testDiagnostics() {
  assert(Object.isFrozen(ERROR_CATALOG));
  assert(Object.isFrozen(explainError('AMBIGUOUS_ARTIFACT_FILENAME')));
  assert.equal(explainError('SNAPSHOT_SOURCE_CONTENT_EMISSION').severity, 'ERROR');
  for (const code of [
    'ERROR_CODE_UNKNOWN',
    'OUTPUT_CHECKSUM_MISMATCH',
    'OUTPUT_FINAL_MARKER_MISMATCH',
    'OUTPUT_NONDETERMINISTIC',
    'OUTPUT_PATH_COLLISION',
    'REPOSITORY_SNAPSHOT_STALE',
    'SCHEMA_CONTRACT_VIOLATION',
    'SPEC_DUPLICATE_KEY',
    'TEMPLATE_INTERPOLATION_UNRESOLVED',
    'TOKEN_OCCURRENCE_MISMATCH',
    'BUDGET_CONTRACT_INCONSISTENT',
    'INSPECTION_AUTHORITY_MISMATCH',
    'INSPECTION_CONTRACT_REFERENCE_INVALID',
    'INSPECTION_TEXT_FORBIDDEN',
    'PROHIBITED_GIT_MUTATION',
  ]) {
    assert(ERROR_CODES.includes(code), `missing error catalog code ${code}`);
    assert.match(explainError(code).invariant_reference, /^AIFINDER_PHASE_COMPILER_V1:[A-Z0-9_]+$/u);
  }
  assert(Object.values(ERROR_CATALOG).every((entry) => typeof entry.invariant_reference === 'string' && entry.invariant_reference.length > 0));
  assert.throws(() => explainError('UNKNOWN_CODE'), TypeError);
  const record = diagnostic('JSON_SYNTAX', {
    sanitized_evidence: { token: 'must-not-survive', reason: 'synthetic' },
  });
  assert.equal(record.sanitized_evidence.token, '[redacted]');
  assert(Object.isFrozen(record));
  const categorical = diagnostic('TOKEN_OCCURRENCE_MISMATCH', { sanitized_evidence: { token_count: 1, category: 'TOKEN_OCCURRENCE_MISMATCH' } });
  assert.equal(categorical.sanitized_evidence.token_count, 1);
  assert.equal(categorical.sanitized_evidence.category, 'TOKEN_OCCURRENCE_MISMATCH');
  for (const candidate of [
    `ghp_${'a'.repeat(24)}`,
    `github_pat_${'A'.repeat(24)}`,
    `AKIA${'A'.repeat(16)}`,
    `eyJ${'a'.repeat(12)}.${'b'.repeat(12)}.${'c'.repeat(12)}`,
    `AUTHORIZE_SYNTHETIC_${'A'.repeat(32)}`,
  ]) {
    const sanitized = diagnostic('PATH_INVALID', {
      location_json_pointer: `/paths/${candidate}`,
      command_id_or_null: candidate,
      sanitized_evidence: { path: candidate, reference: `testing/${candidate}.json`, [candidate]: candidate },
    });
    assert.equal(JSON.stringify(sanitized).includes(candidate), false);
  }
  const duplicateSecret = `ghp_${'s'.repeat(24)}`;
  let duplicateError;
  try { parseStrictJson(Buffer.from(`{"${duplicateSecret}":1,"${duplicateSecret}":2}\n`)); } catch (error) { duplicateError = error; }
  assert(duplicateError instanceof DiagnosticError);
  assert.equal(JSON.stringify(duplicateError.diagnostic).includes(duplicateSecret), false);
}

async function testSnapshotAdapter(referenceSpec) {
  const tempRoot = await mkdtemp(join(await realpath(tmpdir()), 'aifinder-phase-34ba-task1-'));
  const repo = await createSyntheticRepository(tempRoot);
  const outPath = join(tempRoot, 'snapshot.json');
  try {
    const adapterModule = await import('./repository-snapshot-adapter.mjs');
    assert.equal(typeof adapterModule.resolveSnapshotOutputPath, 'function');
    assert.equal(adapterModule.resolveSnapshotOutputPath('/', '/snapshot.json'), '/snapshot.json');

    const competingPath = join(tempRoot, 'competing-snapshot.json');
    const competingBytes = Buffer.from('competitor-owned\n');
    await writeFile(competingPath, competingBytes, { mode: 0o600 });
    const competingBefore = await lstat(competingPath);
    await expectDiagnostic('SNAPSHOT_OUTPUT_EXISTS', () =>
      writeExclusiveSnapshot(competingPath, Buffer.from('invocation-owned\n')),
    );
    const competingAfter = await lstat(competingPath);
    assert.deepEqual(await readFile(competingPath), competingBytes);
    assert.equal(competingAfter.dev, competingBefore.dev);
    assert.equal(competingAfter.ino, competingBefore.ino);

    const replacedPath = join(tempRoot, 'replaced-snapshot.json');
    const displacedPath = join(tempRoot, 'invocation-partial.json');
    const replacementBytes = Buffer.from('replacement-owned\n');
    let afterOpenRan = false;
    let replacementDuringHook;
    await expectDiagnostic('PATH_INVALID', () =>
      writeExclusiveSnapshot(replacedPath, Buffer.from('invocation-partial\n'), {
        afterOpen: async () => {
          afterOpenRan = true;
          await rename(replacedPath, displacedPath);
          await writeFile(replacedPath, replacementBytes, { mode: 0o600 });
          replacementDuringHook = await lstat(replacedPath);
        },
      }),
    );
    assert.equal(afterOpenRan, true);
    assert.notEqual(replacementDuringHook, undefined);
    const replacementStat = await lstat(replacedPath);
    const displacedStat = await lstat(displacedPath);
    assert.equal(replacementStat.dev, replacementDuringHook.dev);
    assert.equal(replacementStat.ino, replacementDuringHook.ino);
    assert.notEqual(replacementStat.ino, displacedStat.ino);
    assert.deepEqual(await readFile(replacedPath), replacementBytes);

    const preOpenParent = join(tempRoot, 'snapshot-pre-open-parent');
    const preOpenDisplaced = join(tempRoot, 'snapshot-pre-open-displaced');
    const preOpenReplacement = join(tempRoot, 'snapshot-pre-open-replacement');
    await mkdir(preOpenParent, { mode: 0o700 });
    await mkdir(preOpenReplacement, { mode: 0o700 });
    let beforeOpenRan = false;
    await expectDiagnostic('PATH_INVALID', () => writeExclusiveSnapshot(join(preOpenParent, 'snapshot.json'), Buffer.from('invocation-owned\n'), {
      beforeOpen: async () => {
        beforeOpenRan = true;
        await rename(preOpenParent, preOpenDisplaced);
        await rename(preOpenReplacement, preOpenParent);
      },
    }));
    assert.equal(beforeOpenRan, true);
    assert.equal(await lstat(join(preOpenParent, 'snapshot.json')).catch(() => null), null);

    const afterOpenParent = join(tempRoot, 'snapshot-after-open-parent');
    const afterOpenDisplaced = join(tempRoot, 'snapshot-after-open-displaced');
    const afterOpenReplacement = join(tempRoot, 'snapshot-after-open-replacement');
    await mkdir(afterOpenParent, { mode: 0o700 });
    await mkdir(afterOpenReplacement, { mode: 0o700 });
    let parentAfterOpenRan = false;
    await expectDiagnostic('PATH_INVALID', () => writeExclusiveSnapshot(join(afterOpenParent, 'snapshot.json'), Buffer.from('invocation-owned\n'), {
      afterOpen: async () => {
        parentAfterOpenRan = true;
        await rename(afterOpenParent, afterOpenDisplaced);
        await rename(afterOpenReplacement, afterOpenParent);
      },
    }));
    assert.equal(parentAfterOpenRan, true);
    assert.equal(await lstat(join(afterOpenParent, 'snapshot.json')).catch(() => null), null);
    assert.deepEqual(await readFile(join(afterOpenDisplaced, 'snapshot.json')), Buffer.from('invocation-owned\n'));

    const identities = {
      head: await git(repo, ['rev-parse', 'HEAD']),
      parent: await git(repo, ['rev-parse', 'HEAD^']),
      tree: await git(repo, ['rev-parse', 'HEAD^{tree}']),
      subject: await git(repo, ['show', '-s', '--format=%s', 'HEAD']),
    };
    const spec = syntheticSpec(referenceSpec, identities);
    const specPath = join(tempRoot, 'phase-spec.json');
    const specBytes = canonicalJsonBuffer(spec);
    await writeFile(specPath, specBytes, { mode: 0o600 });
    assert.deepEqual(await readPhaseSpecInput(specPath), specBytes);
    const linkedSpecPath = join(tempRoot, 'phase-spec-link.json');
    await symlink(specPath, linkedSpecPath);
    await expectDiagnostic('SNAPSHOT_SYMLINK', () => readPhaseSpecInput(linkedSpecPath));
    const hardlinkedSpecPath = join(tempRoot, 'phase-spec-hardlink.json');
    await link(specPath, hardlinkedSpecPath);
    await expectDiagnostic('SNAPSHOT_HARDLINK', () => readPhaseSpecInput(hardlinkedSpecPath));
    await unlink(hardlinkedSpecPath);
    const oversizedSpecPath = join(tempRoot, 'phase-spec-oversized.json');
    await writeFile(oversizedSpecPath, Buffer.alloc(1024 * 1024 + 1, 0x78), { mode: 0o600 });
    await expectDiagnostic('INPUT_TOO_LARGE', () => readPhaseSpecInput(oversizedSpecPath));
    const growingSpecPath = join(tempRoot, 'phase-spec-growing.json');
    await writeFile(growingSpecPath, specBytes, { mode: 0o600 });
    await expectDiagnostic('INPUT_TOO_LARGE', () => readPhaseSpecInput(growingSpecPath, {
      afterOpen: async () => appendFile(growingSpecPath, Buffer.alloc(1024 * 1024 + 1, 0x79)),
    }));
    const replacementSpecPath = join(tempRoot, 'phase-spec-replacement.json');
    const displacedSpecPath = join(tempRoot, 'phase-spec-displaced.json');
    await writeFile(replacementSpecPath, specBytes, { mode: 0o600 });
    let specReplacementHookRan = false;
    await expectDiagnostic('SNAPSHOT_PATH_IDENTITY_MISMATCH', () => readPhaseSpecInput(replacementSpecPath, {
      afterOpen: async () => {
        specReplacementHookRan = true;
        await rename(replacementSpecPath, displacedSpecPath);
        await writeFile(replacementSpecPath, specBytes, { mode: 0o600 });
      },
    }));
    assert.equal(specReplacementHookRan, true);

    const displacedRepository = `${repo}-displaced`;
    const rootSwapOutput = join(tempRoot, 'snapshot-root-swap.json');
    let repositoryValidationHookRan = false;
    await expectDiagnostic('SNAPSHOT_PATH_IDENTITY_MISMATCH', () => collect({
      phaseSpecBytes: specBytes,
      repoRoot: repo,
      outPath: rootSwapOutput,
      hooks: {
        afterRepositoryValidation: async () => {
          repositoryValidationHookRan = true;
          await rename(repo, displacedRepository);
          await mkdir(repo, { mode: 0o700 });
        },
      },
    }));
    assert.equal(repositoryValidationHookRan, true);
    assert.equal(await lstat(rootSwapOutput).catch(() => null), null);
    await rm(repo, { recursive: true, force: true });
    await rename(displacedRepository, repo);

    const abaReplacementContainer = join(tempRoot, 'aba-replacement-container');
    await mkdir(abaReplacementContainer, { mode: 0o700 });
    const abaReplacementRepository = await createSyntheticRepository(abaReplacementContainer);
    const abaDisplacedRepository = `${repo}-aba-displaced`;
    const abaReplacementParking = `${repo}-aba-replacement`;
    const abaOutput = join(tempRoot, 'snapshot-root-aba.json');
    let abaGitHookRan = false;
    let abaAfterGitHookRan = false;
    await expectDiagnostic('SNAPSHOT_PATH_IDENTITY_MISMATCH', () => collect({
      phaseSpecBytes: specBytes,
      repoRoot: repo,
      outPath: abaOutput,
      hooks: {
        beforeGitOperation: async ({ argv }) => {
          if (abaGitHookRan || argv[0] !== 'symbolic-ref') return;
          abaGitHookRan = true;
          await rename(repo, abaDisplacedRepository);
          await rename(abaReplacementRepository, repo);
        },
        afterGitOperation: async ({ argv }) => {
          if (!abaGitHookRan || argv[0] !== 'symbolic-ref') return;
          abaAfterGitHookRan = true;
          await rename(repo, abaReplacementParking);
          await rename(abaDisplacedRepository, repo);
        },
      },
    }));
    assert.equal(abaGitHookRan, true);
    assert.equal(abaAfterGitHookRan, false);
    assert.equal(await lstat(abaOutput).catch(() => null), null);
    if (await lstat(abaDisplacedRepository).catch(() => null)) {
      if (await lstat(repo).catch(() => null)) await rename(repo, abaReplacementParking);
      await rename(abaDisplacedRepository, repo);
    }

    const spawnReplacementContainer = join(tempRoot, 'spawn-replacement-container');
    await mkdir(spawnReplacementContainer, { mode: 0o700 });
    const spawnReplacementRepository = await createSyntheticRepository(spawnReplacementContainer);
    await writeFile(join(spawnReplacementRepository, 'replacement-only.txt'), 'replacement\n', { mode: 0o600 });
    await git(spawnReplacementRepository, ['add', '--', 'replacement-only.txt']);
    await git(spawnReplacementRepository, ['commit', '-q', '-m', 'Replacement-only commit']);
    const replacementHead = await git(spawnReplacementRepository, ['rev-parse', 'HEAD']);
    assert.notEqual(replacementHead, identities.head);
    const spawnDisplacedRepository = `${repo}-spawn-displaced`;
    const spawnReplacementParking = `${repo}-spawn-replacement`;
    const spawnBoundOutput = join(tempRoot, 'snapshot-git-spawn-bound.json');
    let beforeGitSpawnRan = false;
    let spawnRepositoryRestored = false;
    let spawnObservedIdentity = null;
    await expectDiagnostic('SNAPSHOT_PATH_IDENTITY_MISMATCH', () =>
      collect({
        phaseSpecBytes: specBytes,
        repoRoot: repo,
        outPath: spawnBoundOutput,
        hooks: {
          beforeGitSpawn: async ({ argv }) => {
            if (beforeGitSpawnRan || argv[0] !== 'rev-parse' || argv[1] !== 'HEAD') return;
            beforeGitSpawnRan = true;
            await rename(repo, spawnDisplacedRepository);
            await rename(spawnReplacementRepository, repo);
          },
          afterGitOperation: async ({ argv, stdout_identity: stdoutIdentity }) => {
            if (!beforeGitSpawnRan || spawnRepositoryRestored || argv[0] !== 'rev-parse' || argv[1] !== 'HEAD') return;
            spawnObservedIdentity = stdoutIdentity;
            await rename(repo, spawnReplacementParking);
            await rename(spawnDisplacedRepository, repo);
            spawnRepositoryRestored = true;
          },
        },
      }),
    );
    assert.equal(beforeGitSpawnRan, true);
    assert.equal(spawnRepositoryRestored, true);
    assert.deepEqual(spawnObservedIdentity, bufferIdentity(Buffer.from(`${identities.head}\n`)));
    assert.notDeepEqual(spawnObservedIdentity, bufferIdentity(Buffer.from(`${replacementHead}\n`)));
    assert.equal(await lstat(spawnBoundOutput).catch(() => null), null);

    const adapterPath = resolve(directory, 'repository-snapshot-adapter.mjs');
    const child = await execFile(
      process.execPath,
      [adapterPath, 'collect', specPath, '--repo', repo, '--out', outPath],
      {
        encoding: 'utf8',
        env: { LANG: 'C', LC_ALL: 'C' },
        maxBuffer: 1024 * 1024,
        shell: false,
      },
    );
    assert.equal(child.stdout, '');
    assert.equal(child.stderr, '');
    const outputBytes = await readFile(outPath);
    assert.equal(outputBytes.includes(Buffer.from(repo)), false);
    assert.equal(outputBytes.at(-1), 10);
    assert.equal(bufferIdentity(outputBytes).cr, 0);
    const outputStat = await lstat(outPath);
    assert.equal(outputStat.mode & 0o777, 0o600);
    assert.equal(outputStat.nlink, 1);
    const snapshot = parseStrictJson(outputBytes);
    assert.equal(snapshot.paths.find((item) => item.path === 'tracked.txt').content_utf8, 'tracked\n');
    assert.equal(snapshot.paths.find((item) => item.path === 'created.txt').state, 'ABSENT');
    assert(Object.isFrozen(await collect({
      phaseSpecBytes: canonicalJsonBuffer({
        ...spec,
        scope: {
          ...spec.scope,
          preserve_paths: ['tracked.txt'],
          read_content_paths: [],
        },
      }),
      repoRoot: repo,
      outPath: join(tempRoot, 'snapshot-direct.json'),
    })));

    const trackedPath = join(repo, 'tracked.txt');
    const displacedTrackedPath = join(repo, 'tracked-displaced.txt');
    const replacementArchivePath = join(repo, 'tracked-replacement-archive.txt');
    let pathValidationHookRan = false;
    await expectDiagnostic('SNAPSHOT_PATH_IDENTITY_MISMATCH', () =>
      collect({
        phaseSpecBytes: canonicalJsonBuffer(spec),
        repoRoot: repo,
        outPath: join(tempRoot, 'snapshot-replaced-input.json'),
        hooks: {
          afterPathValidation: async ({ path, lexicalPath }) => {
            if (path !== 'tracked.txt') return;
            pathValidationHookRan = true;
            assert.equal(lexicalPath, trackedPath);
            await rename(trackedPath, displacedTrackedPath);
            await writeFile(trackedPath, Buffer.alloc(1024 * 1024 + 1, 0x78), { mode: 0o600 });
          },
        },
      }),
    );
    assert.equal(pathValidationHookRan, true);
    await rename(trackedPath, replacementArchivePath);
    await rename(displacedTrackedPath, trackedPath);

    const fifoDisplacedPath = join(repo, 'tracked-fifo-displaced.txt');
    const fifoProbeSource = `
      import { execFile as execFileCallback } from 'node:child_process';
      import { lstat, readFile, rename, unlink } from 'node:fs/promises';
      import { promisify } from 'node:util';
      import { collect } from ${JSON.stringify(pathToFileURL(adapterPath).href)};
      const execFile = promisify(execFileCallback);
      let hookRan = false;
      try {
        await collect({
          phaseSpecBytes: await readFile(${JSON.stringify(specPath)}),
          repoRoot: ${JSON.stringify(repo)},
          outPath: ${JSON.stringify(join(tempRoot, 'snapshot-fifo-input.json'))},
          hooks: {
            beforePathOpen: async ({ path, lexicalPath }) => {
              if (path !== 'tracked.txt') return;
              hookRan = true;
              await rename(lexicalPath, ${JSON.stringify(fifoDisplacedPath)});
              await execFile('/usr/bin/mkfifo', [lexicalPath], { env: { LANG: 'C', LC_ALL: 'C' }, shell: false });
            },
          },
        });
        throw new Error('FIFO swap unexpectedly succeeded');
      } catch (error) {
        if (error?.diagnostic?.code !== 'SNAPSHOT_PATH_IDENTITY_MISMATCH' || !hookRan) throw error;
        process.stdout.write('PASS_FIFO_SWAP_NONBLOCKING\\n');
      } finally {
        const current = await lstat(${JSON.stringify(trackedPath)}).catch(() => null);
        if (current?.isFIFO()) await unlink(${JSON.stringify(trackedPath)});
        const displaced = await lstat(${JSON.stringify(fifoDisplacedPath)}).catch(() => null);
        if (displaced !== null) await rename(${JSON.stringify(fifoDisplacedPath)}, ${JSON.stringify(trackedPath)});
      }
    `;
    const fifoProbe = await execFile(
      process.execPath,
      ['--input-type=module', '--eval', fifoProbeSource],
      {
        encoding: 'utf8',
        env: { LANG: 'C', LC_ALL: 'C' },
        killSignal: 'SIGKILL',
        maxBuffer: 1024 * 1024,
        shell: false,
        timeout: 3000,
      },
    );
    assert.equal(fifoProbe.stdout, 'PASS_FIFO_SWAP_NONBLOCKING\n');
    assert.equal(fifoProbe.stderr, '');
    await expectDiagnostic('INPUT_TOO_LARGE', () => (async () => {
      await writeFile(trackedPath, Buffer.alloc(1024 * 1024 + 1, 0x79));
      try {
        await collect({ phaseSpecBytes: canonicalJsonBuffer(spec), repoRoot: repo, outPath: join(tempRoot, 'snapshot-oversize-input.json') });
      } finally {
        await writeFile(trackedPath, 'tracked\n');
      }
    })());

    await symlink('tracked.txt', join(repo, 'linked.txt'));
    await git(repo, ['add', '--', 'linked.txt']);
    const symlinkSpec = structuredClone(spec);
    symlinkSpec.scope.preserve_paths = ['linked.txt'];
    symlinkSpec.scope.read_content_paths = ['linked.txt'];
    await expectDiagnostic('SNAPSHOT_SYMLINK', () =>
      collect({
        phaseSpecBytes: canonicalJsonBuffer(symlinkSpec),
        repoRoot: repo,
        outPath: join(tempRoot, 'snapshot-symlink.json'),
      }),
    );

    await link(join(repo, 'tracked.txt'), join(repo, 'hardlinked.txt'));
    await git(repo, ['add', '--', 'hardlinked.txt']);
    const hardlinkSpec = structuredClone(spec);
    hardlinkSpec.scope.preserve_paths = ['hardlinked.txt'];
    hardlinkSpec.scope.read_content_paths = ['hardlinked.txt'];
    await expectDiagnostic('SNAPSHOT_HARDLINK', () =>
      collect({
        phaseSpecBytes: canonicalJsonBuffer(hardlinkSpec),
        repoRoot: repo,
        outPath: join(tempRoot, 'snapshot-hardlink.json'),
      }),
    );

    await git(repo, ['update-index', '--add', '--cacheinfo', `160000,${identities.head},synthetic-submodule`]);
    const submoduleSpec = structuredClone(spec);
    submoduleSpec.scope.preserve_paths = ['synthetic-submodule'];
    submoduleSpec.scope.read_content_paths = [];
    await expectDiagnostic('SNAPSHOT_SUBMODULE', () =>
      collect({
        phaseSpecBytes: canonicalJsonBuffer(submoduleSpec),
        repoRoot: repo,
        outPath: join(tempRoot, 'snapshot-submodule.json'),
      }),
    );

    const outsideCreateRoot = join(tempRoot, 'outside-create-root');
    await mkdir(outsideCreateRoot, { mode: 0o700 });
    await symlink(outsideCreateRoot, join(repo, 'create-link'));
    const symlinkAncestorSpec = structuredClone(spec);
    symlinkAncestorSpec.scope.create_paths = ['create-link/nested/new.txt'];
    symlinkAncestorSpec.scope.preserve_paths = [];
    symlinkAncestorSpec.scope.read_content_paths = [];
    await expectDiagnostic('SNAPSHOT_SYMLINK', () =>
      collect({
        phaseSpecBytes: canonicalJsonBuffer(symlinkAncestorSpec),
        repoRoot: repo,
        outPath: join(tempRoot, 'snapshot-create-symlink-ancestor.json'),
      }),
    );

    const createParent = join(repo, 'create-parent');
    const displacedCreateParent = join(repo, 'create-parent-displaced');
    await mkdir(join(createParent, 'nested'), { recursive: true, mode: 0o700 });
    const replacedAncestorSpec = structuredClone(spec);
    replacedAncestorSpec.scope.create_paths = ['create-parent/nested/new.txt'];
    replacedAncestorSpec.scope.preserve_paths = [];
    replacedAncestorSpec.scope.read_content_paths = [];
    let createAncestorHookRan = false;
    await expectDiagnostic('SNAPSHOT_PATH_IDENTITY_MISMATCH', () =>
      collect({
        phaseSpecBytes: canonicalJsonBuffer(replacedAncestorSpec),
        repoRoot: repo,
        outPath: join(tempRoot, 'snapshot-create-replaced-ancestor.json'),
        hooks: {
          afterCreateAncestorValidation: async ({ path, existingAncestors }) => {
            if (path !== 'create-parent/nested/new.txt') return;
            createAncestorHookRan = true;
            assert(existingAncestors.includes(createParent));
            await rename(createParent, displacedCreateParent);
            await mkdir(join(createParent, 'nested'), { recursive: true, mode: 0o700 });
          },
        },
      }),
    );
    assert.equal(createAncestorHookRan, true);
  } finally {
    await chmod(tempRoot, 0o700).catch(() => {});
    await rm(tempRoot, { recursive: true, force: true });
  }
  assert.equal(await lstat(tempRoot).catch(() => null), null);
}

function diagnosticCodes(...results) {
  return [...new Set(results.flatMap((result) => result.diagnostics.map((record) => record.code)))].sort();
}

function task2Fixture(id, referenceSpec, referenceSnapshot) {
  return negativeFixture(id, referenceSpec, referenceSnapshot);
}

function refreshSyntheticSnapshot(snapshot) {
  const { snapshot_digest: omittedDigest, final_marker: omittedMarker, ...body } = snapshot;
  void omittedDigest;
  void omittedMarker;
  snapshot.snapshot_digest = repositorySnapshotDigest(body);
}

function addSyntheticContent(spec, snapshot, path, content, role = 'PRESERVE') {
  const identity = bufferIdentity(Buffer.from(content));
  const scopeName = role === 'MODIFY' ? 'modify_paths' : 'preserve_paths';
  if (!spec.scope[scopeName].includes(path)) spec.scope[scopeName].push(path);
  if (!spec.scope.read_content_paths.includes(path)) spec.scope.read_content_paths.push(path);
  snapshot.paths.push({ path, role, state: 'TRACKED', mode: '100644', blob: 'd'.repeat(40), sha256: identity.sha256, bytes: identity.bytes, lf: identity.lf, cr: identity.cr, content_utf8: content });
  refreshSyntheticSnapshot(snapshot);
}

function testSemanticGovernanceOperation(referenceSpec, referenceSnapshot) {
  const positives = positiveFixtures(referenceSpec, referenceSnapshot);
  for (const fixture of positives) {
    const spec = normalizePhaseSpec(fixture.spec);
    const semantic = validateSemantic({ spec, snapshot: fixture.snapshot });
    const governance = validateGovernance({ spec, snapshot: fixture.snapshot });
    const operation = validateOperationContract({ spec, snapshot: fixture.snapshot });
    assert.equal(semantic.valid, true, `${fixture.id} semantic diagnostics ${JSON.stringify(semantic.diagnostics)}`);
    assert.equal(governance.valid, true, `${fixture.id} governance diagnostics ${JSON.stringify(governance.diagnostics)}`);
    assert.equal(operation.valid, true, `${fixture.id} operation diagnostics ${JSON.stringify(operation.diagnostics)}`);
    assert(Object.isFrozen(semantic));
    assert(Object.isFrozen(governance));
    assert(Object.isFrozen(operation));
    assert(Object.isFrozen(operation.aggregate));
  }

  for (const id of ['N01', 'N09', 'N13', 'N14', 'N18', 'N19', 'N20', 'N21', 'N25', 'N26']) {
    const fixture = task2Fixture(id, referenceSpec, referenceSnapshot);
    const results = [
      validateSemantic({ spec: fixture.spec, snapshot: fixture.snapshot }),
      validateGovernance({ spec: fixture.spec }),
      validateOperationContract({
        spec: fixture.spec,
      }),
    ];
    const codes = diagnosticCodes(...results);
    for (const expectedCode of FAILURE_CATALOG[id].expected_codes) {
      assert(codes.includes(expectedCode), `${id} missing ${expectedCode}; got ${codes.join(',')}`);
    }
  }

  const n07 = task2Fixture('N07', referenceSpec, referenceSnapshot);
  assert.deepEqual(diagnosticCodes(validateGovernance({ spec: n07.spec, snapshot: n07.snapshot })), ['MANIFEST_COUNT_MISMATCH']);
  const n08 = task2Fixture('N08', referenceSpec, referenceSnapshot);
  assert(diagnosticCodes(validateGovernance({ spec: n08.spec })).includes('RUNNER_TOPOLOGY_MISMATCH'));

  const manifestBefore = structuredClone(n07);
  manifestBefore.spec.governance.manifest_transitions[0].before_disposition = 'RUN_POLICY';
  assert(diagnosticCodes(validateGovernance({ spec: manifestBefore.spec, snapshot: manifestBefore.snapshot })).includes('MANIFEST_COUNT_MISMATCH'));

  const runnerSpec = structuredClone(referenceSpec);
  const runnerSnapshot = structuredClone(referenceSnapshot);
  const runnerPath = 'testing/synthetic-runner.mjs';
  addSyntheticContent(runnerSpec, runnerSnapshot, runnerPath, "const RUNNER_CHILDREN = ['CHILD_A', { id: 'CHILD_B' }];\n");
  runnerSpec.governance.runner_path = runnerPath;
  runnerSpec.governance.runner_removals = ['CHILD_A'];
  runnerSpec.governance.runner_additions = ['CHILD_C'];
  runnerSpec.commands = [{
    id: 'CHILD_C', sequence: 1, context: 'RUNNER_CHILD', argv: ['/usr/bin/true'], cwd: 'testing', reads: [], writes: [], environment_names: [], prerequisite_state: [], produced_state: [],
    expected: { exit: 0, stdout: '', stderr: '' }, required_manifest_state: [], required_runner_state: ['RUNNER_CHILD:CHILD_C'], compatibility_timepoint: 'CURRENT', source_references: [],
    operation_charges: { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 }, rollback_id: '',
  }];
  const runnerResult = validateGovernance({ spec: normalizePhaseSpec(runnerSpec), snapshot: runnerSnapshot });
  assert.equal(runnerResult.valid, true, JSON.stringify(runnerResult.diagnostics));
  assert.deepEqual(runnerResult.runner_children, ['CHILD_B', 'CHILD_C']);
  for (const mutate of [
    (spec) => { spec.governance.runner_removals = ['CHILD_MISSING']; },
    (spec) => { spec.governance.runner_additions = ['CHILD_B']; },
  ]) {
    const invalid = structuredClone(runnerSpec); mutate(invalid);
    assert(diagnosticCodes(validateGovernance({ spec: normalizePhaseSpec(invalid), snapshot: runnerSnapshot })).includes('RUNNER_TOPOLOGY_MISMATCH'));
  }

  const zero = { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 };
  const positivesById = new Map(positives.map((fixture) => [fixture.id, fixture]));
  const rollbackGap = structuredClone(positivesById.get('P02').spec);
  rollbackGap.commands.find((command) => command.id === 'CREATE_PREVIEW').writes = ['generated/p01.txt'];
  assert(diagnosticCodes(validateOperationContract({ spec: rollbackGap, snapshot: positivesById.get('P02').snapshot })).includes('ROLLBACK_RESOURCE_UNCOVERED'));

  const cleanupIdentityGap = structuredClone(positivesById.get('P02').spec);
  const cleanup = cleanupIdentityGap.commands.find((command) => command.id === 'CLEANUP_PREVIEW');
  cleanup.argv = ['/usr/bin/true'];
  cleanup.prerequisite_state = cleanup.prerequisite_state.filter((state) => !state.includes('preview-id:synthetic-preview-1'));
  assert(diagnosticCodes(validateOperationContract({ spec: cleanupIdentityGap, snapshot: positivesById.get('P02').snapshot })).includes('EXTERNAL_RESOURCE_CLEANUP_IDENTITY_MISSING'));
  const partialCleanupIdentity = structuredClone(positivesById.get('P02').spec);
  partialCleanupIdentity.commands.find((command) => command.id === 'CLEANUP_PREVIEW').argv = ['/usr/local/bin/vercel', 'remove', 'prefix-preview-id:synthetic-preview-1-suffix'];
  assert(diagnosticCodes(validateOperationContract({ spec: normalizePhaseSpec(partialCleanupIdentity), snapshot: positivesById.get('P02').snapshot })).includes('EXTERNAL_RESOURCE_CLEANUP_IDENTITY_MISSING'));
  const duplicateResource = structuredClone(positivesById.get('P02').spec);
  duplicateResource.external_resources.push({ ...duplicateResource.external_resources[0], id: 'PREVIEW_2' });
  assert(diagnosticCodes(validateOperationContract({ spec: duplicateResource, snapshot: positivesById.get('P02').snapshot })).includes('ROLLBACK_RESOURCE_UNCOVERED'));
  const misorderedResource = structuredClone(positivesById.get('P02').spec);
  misorderedResource.commands.find((command) => command.id === 'VERIFY_PREVIEW').sequence = 6;
  assert(diagnosticCodes(validateOperationContract({ spec: misorderedResource, snapshot: positivesById.get('P02').snapshot })).includes('ROLLBACK_RESOURCE_UNCOVERED'));
  const orphanExternalMutation = structuredClone(positivesById.get('P02').spec);
  orphanExternalMutation.external_resources = [];
  const orphanExternalResult = validateOperationContract({ spec: normalizePhaseSpec(orphanExternalMutation), snapshot: positivesById.get('P02').snapshot });
  assert(orphanExternalResult.diagnostics.some((record) => record.code === 'ROLLBACK_RESOURCE_UNCOVERED' && record.sanitized_evidence.reason === 'derived external mutation has no exact lifecycle role'));
  const missingCreateEffect = structuredClone(positivesById.get('P02').spec);
  const missingCreateCommand = missingCreateEffect.commands.find((command) => command.id === 'CREATE_PREVIEW');
  missingCreateCommand.argv = ['/usr/bin/true'];
  missingCreateCommand.operation_charges = { ...zero };
  const missingCreateEffectResult = validateOperationContract({ spec: normalizePhaseSpec(missingCreateEffect), snapshot: positivesById.get('P02').snapshot });
  assert(missingCreateEffectResult.diagnostics.some((record) => record.code === 'ROLLBACK_RESOURCE_UNCOVERED' && record.sanitized_evidence.reason === 'lifecycle mutation role lacks exact derived external mutation'));
  const verifyMutation = structuredClone(positivesById.get('P02').spec);
  const verifyMutationCommand = verifyMutation.commands.find((command) => command.id === 'VERIFY_PREVIEW');
  verifyMutationCommand.argv = ['/usr/local/bin/vercel', 'deploy'];
  verifyMutationCommand.operation_charges = { ...zero, network: 1, deployments: 1 };
  const verifyMutationResult = validateOperationContract({ spec: normalizePhaseSpec(verifyMutation), snapshot: positivesById.get('P02').snapshot });
  assert(verifyMutationResult.diagnostics.some((record) => record.code === 'ROLLBACK_RESOURCE_UNCOVERED' && record.sanitized_evidence.reason === 'derived external mutation has no exact lifecycle role'));
  const orphanDatabase = structuredClone(referenceSpec);
  orphanDatabase.operation_budgets.network = 1;
  orphanDatabase.operation_budgets.database = 1;
  orphanDatabase.commands = [{ ...structuredClone(runnerSpec.commands[0]), id: 'ORPHAN_DATABASE', context: 'DIRECT', argv: ['/usr/local/bin/supabase', 'db', 'push', '--linked'], operation_charges: { ...zero, network: 1, database: 1 }, required_runner_state: [] }];
  const orphanDatabaseResult = validateOperationContract({ spec: normalizePhaseSpec(orphanDatabase), snapshot: referenceSnapshot });
  assert(orphanDatabaseResult.diagnostics.some((record) => record.code === 'ROLLBACK_RESOURCE_UNCOVERED' && record.sanitized_evidence.reason === 'derived external mutation has no exact lifecycle role'));
  const typedP02 = structuredClone(positivesById.get('P02').spec);
  typedP02.external_resources[0].mutation_kind = 'DEPLOYMENT';
  assert.equal(validateOperationContract({ spec: typedP02, snapshot: positivesById.get('P02').snapshot }).valid, true);
  const mismatchedResourceKind = structuredClone(typedP02);
  mismatchedResourceKind.external_resources[0].mutation_kind = 'DATABASE';
  assert(validateOperationContract({ spec: mismatchedResourceKind, snapshot: positivesById.get('P02').snapshot }).diagnostics.some((record) => record.code === 'ROLLBACK_RESOURCE_UNCOVERED' && record.sanitized_evidence.reason === 'external mutation kind mismatch'));
  const cleanupKindMismatch = structuredClone(typedP02);
  const typedCleanup = cleanupKindMismatch.commands.find((command) => command.id === 'CLEANUP_PREVIEW');
  typedCleanup.argv = ['/usr/local/bin/supabase', 'db', 'push', '--linked', 'preview-id:synthetic-preview-1'];
  typedCleanup.operation_charges = { ...zero, network: 1, database: 1 };
  cleanupKindMismatch.operation_budgets.database = 1;
  assert(validateOperationContract({ spec: cleanupKindMismatch, snapshot: positivesById.get('P02').snapshot }).diagnostics.some((record) => record.code === 'ROLLBACK_RESOURCE_UNCOVERED' && record.sanitized_evidence.reason === 'external mutation kind mismatch'));
  const multiKindMutation = structuredClone(typedP02);
  const multiKindCreate = multiKindMutation.commands.find((command) => command.id === 'CREATE_PREVIEW');
  multiKindCreate.argv = ['/usr/local/bin/supabase', 'db', 'push', 'functions', 'deploy', '--linked'];
  multiKindCreate.operation_charges = { ...zero, network: 1, database: 1, deployments: 1 };
  multiKindMutation.operation_budgets.database = 1;
  assert(validateOperationContract({ spec: multiKindMutation, snapshot: positivesById.get('P02').snapshot }).diagnostics.some((record) => record.code === 'ROLLBACK_RESOURCE_UNCOVERED' && record.sanitized_evidence.reason === 'multi-kind external mutation is ambiguous'));
  const duplicateRollbackOwner = structuredClone(typedP02);
  duplicateRollbackOwner.rollbacks.push({ ...structuredClone(duplicateRollbackOwner.rollbacks[0]), id: 'ROLLBACK_PREVIEW_DUPLICATE' });
  assert(validateOperationContract({ spec: duplicateRollbackOwner, snapshot: positivesById.get('P02').snapshot }).diagnostics.some((record) => record.code === 'ROLLBACK_RESOURCE_UNCOVERED' && record.sanitized_evidence.reason === 'rollback mutation ownership is not unique'));

  const conditionalSpec = structuredClone(referenceSpec);
  conditionalSpec.operation_budgets.network = 2;
  conditionalSpec.conditional_scopes = [{
    id: 'STATIC_REPAIR', predicate: 'PATH_IDENTITY_MATCH', predicate_input_path: 'README.md', predicate_expected: referenceSnapshot.paths.find((record) => record.path === 'README.md').sha256,
    true_paths: [], false_paths: [], true_operation_charges: { ...zero, network: 2 }, false_operation_charges: { ...zero, network: 1 }, true_rollback_ids: [], false_rollback_ids: [],
  }];
  const conditional = validateOperationContract({ spec: normalizePhaseSpec(conditionalSpec), snapshot: referenceSnapshot });
  assert.equal(conditional.valid, true, JSON.stringify(conditional.diagnostics));
  assert.equal(conditional.aggregate.network, 2);
  assert.deepEqual(conditional.conditional_selections, [{ id: 'STATIC_REPAIR', selected_branch: 'TRUE', evidence_path: 'README.md' }]);
  const conditionalBudget = structuredClone(conditionalSpec); conditionalBudget.operation_budgets.network = 1;
  assert(diagnosticCodes(validateOperationContract({ spec: normalizePhaseSpec(conditionalBudget), snapshot: referenceSnapshot })).includes('BUDGET_AGGREGATE_OVERFLOW'));
  const conditionalMissingEvidence = structuredClone(referenceSnapshot);
  conditionalMissingEvidence.paths = conditionalMissingEvidence.paths.filter((record) => record.path !== 'README.md');
  assert(diagnosticCodes(validateOperationContract({ spec: normalizePhaseSpec(conditionalSpec), snapshot: conditionalMissingEvidence })).includes('CONDITIONAL_SCOPE_AMBIGUOUS'));
  const conditionalRollback = structuredClone(positivesById.get('P02').spec);
  conditionalRollback.commands.find((command) => command.id === 'CREATE_PREVIEW').writes = ['generated/p01.txt'];
  conditionalRollback.rollbacks[0].cleanup_paths = ['generated/p01.txt'];
  conditionalRollback.conditional_scopes = [{
    ...conditionalSpec.conditional_scopes[0], true_paths: ['generated/p01.txt'], false_paths: ['generated/p01.txt'], true_operation_charges: zero, false_operation_charges: zero,
    true_rollback_ids: ['ROLLBACK_PREVIEW'], false_rollback_ids: ['ROLLBACK_PREVIEW'],
  }];
  assert.equal(validateOperationContract({ spec: normalizePhaseSpec(conditionalRollback), snapshot: positivesById.get('P02').snapshot }).valid, true);
  const branchSpecificRollbackGap = structuredClone(conditionalRollback);
  branchSpecificRollbackGap.rollbacks.push({
    id: 'ROLLBACK_UNRELATED', mutation_ids: [], cleanup_paths: [], terminal_state: branchSpecificRollbackGap.rollbacks[0].terminal_state,
  });
  branchSpecificRollbackGap.conditional_scopes[0].true_rollback_ids = ['ROLLBACK_UNRELATED'];
  assert.deepEqual(
    diagnosticCodes(validateOperationContract({ spec: normalizePhaseSpec(branchSpecificRollbackGap), snapshot: positivesById.get('P02').snapshot })),
    ['CONDITIONAL_SCOPE_AMBIGUOUS'],
  );
  conditionalRollback.conditional_scopes[0].false_rollback_ids = ['ROLLBACK_MISSING'];
  let danglingConditionalError;
  try { normalizePhaseSpec(conditionalRollback); } catch (error) { danglingConditionalError = error; }
  assert(danglingConditionalError instanceof DiagnosticError);
  assert.equal(danglingConditionalError.diagnostic.code, 'AUTHORITY_REFERENCE_DANGLING');

  for (const timepoint of ['PRE_RUNTIME', 'POST_RUNTIME']) {
    const temporal = structuredClone(positivesById.get('P03'));
    temporal.spec.commands[0].compatibility_timepoint = timepoint;
    temporal.spec.commands[0].required_runner_state = [];
    temporal.spec.compatibility_adapters = [];
    assert(diagnosticCodes(validateSemantic({ spec: temporal.spec, snapshot: temporal.snapshot })).includes('HISTORICAL_CURRENT_IDENTITY_COLLISION'));
  }
  const unknownState = structuredClone(referenceSpec);
  unknownState.state_model.initial_states = ['MYSTERY_STATE'];
  unknownState.commands = [{ ...structuredClone(runnerSpec.commands[0]), id: 'UNKNOWN_STATE', context: 'DIRECT', prerequisite_state: ['MYSTERY_STATE'], required_runner_state: [] }];
  assert(diagnosticCodes(validateOperationContract({ spec: unknownState, snapshot: referenceSnapshot })).includes('STATE_TRANSITION_INVALID'));
  const inactiveTargetResidue = structuredClone(referenceSpec);
  inactiveTargetResidue.target_confirmation = {
    required: false,
    confirmation_command_id: 'RESIDUAL_CONFIRMATION',
    first_effect_command_id: 'RESIDUAL_EFFECT',
    one_use: true,
  };
  assert(diagnosticCodes(validateOperationContract({ spec: normalizePhaseSpec(inactiveTargetResidue), snapshot: referenceSnapshot })).includes('TARGET_CONFIRMATION_ORDER_INVALID'));

  for (const secret of [
    `ghp_${'a'.repeat(24)}`,
    `github_pat_${'A'.repeat(24)}`,
    `AKIA${'A'.repeat(16)}`,
    `eyJ${'a'.repeat(12)}.${'b'.repeat(12)}.${'c'.repeat(12)}`,
    `sk-${'a'.repeat(24)}`,
    `sk_${'b'.repeat(24)}`,
  ]) {
    const secretSpec = structuredClone(referenceSpec);
    secretSpec.commands = [{ ...structuredClone(runnerSpec.commands[0]), id: 'SECRET_SCAN', context: 'DIRECT', expected: { exit: 0, stdout: secret, stderr: '' }, required_runner_state: [] }];
    const secretResult = validateOperationContract({ spec: secretSpec, snapshot: referenceSnapshot });
    assert(diagnosticCodes(secretResult).includes('SECRET_BEARING_FIELD_FORBIDDEN'));
    assert.equal(JSON.stringify(secretResult.diagnostics).includes(secret), false);
  }

  function vectorOperation(argv, operationCharges = zero) {
    const spec = structuredClone(referenceSpec);
    spec.commands = [{
      ...structuredClone(runnerSpec.commands[0]), id: 'DERIVED_EFFECT', context: 'DIRECT', argv, operation_charges: { ...operationCharges }, required_runner_state: [],
    }];
    return validateOperationContract({ spec: normalizePhaseSpec(spec), snapshot: referenceSnapshot });
  }
  const curlZeroCharge = vectorOperation(['/usr/bin/curl', 'https://example.invalid/health']);
  assert(diagnosticCodes(curlZeroCharge).includes('BUDGET_CONTRACT_INCONSISTENT'));
  assert(diagnosticCodes(curlZeroCharge).includes('TARGET_CONFIRMATION_ORDER_INVALID'));
  const deployZeroCharge = vectorOperation(['/usr/local/bin/vercel', 'deploy']);
  assert(diagnosticCodes(deployZeroCharge).includes('ROLLBACK_RESOURCE_UNCOVERED'));
  const forcePushZeroCharge = vectorOperation(['/usr/bin/git', 'push', '--force', 'origin', 'main']);
  assert(diagnosticCodes(forcePushZeroCharge).includes('PROHIBITED_GIT_MUTATION'));
  assert(diagnosticCodes(forcePushZeroCharge).includes('BUDGET_CONTRACT_INCONSISTENT'));
  assert(diagnosticCodes(forcePushZeroCharge).includes('GIT_OPERATION_COUNT_INVALID'));
  for (const refspec of ['+main:main', '+HEAD:main']) assert(diagnosticCodes(vectorOperation(['/usr/bin/git', 'push', 'origin', refspec])).includes('PROHIBITED_GIT_MUTATION'));
  assert(diagnosticCodes(vectorOperation(['python3', '-c', 'import urllib.request'])).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  for (const argv of [
    ['/tmp/git', 'status'],
    ['/private/tmp/vercel', 'deploy'],
    ['/attacker/node', './main.mjs'],
    ['node', '--import', 'testing/hook.mjs', 'testing/main.mjs'],
    ['node', 'testing/unbound.mjs'],
    ['npm', 'exec', 'node'],
    ['git', 'credential', 'fill'],
    ['git', 'commit', '--amend'],
    ['vercel', 'env', 'pull'],
    ['supabase', 'secrets', 'set'],
    ['gh', 'api', '--method', 'POST', '/repos/example'],
    ['curl', '-X', 'POST', 'https://example.invalid'],
    ['wget', '--post-data=x', 'https://example.invalid'],
  ]) assert(diagnosticCodes(vectorOperation(argv)).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'), argv.join(' '));
  const sourceEffectSpec = structuredClone(referenceSpec);
  const sourceEffectSnapshot = structuredClone(referenceSnapshot);
  addSyntheticContent(sourceEffectSpec, sourceEffectSnapshot, 'testing/source-effect.mjs', "import { spawn } from 'node:child_process';\nspawn('/usr/bin/curl', ['https://example.invalid/health']);\n");
  sourceEffectSpec.commands = [{
    ...structuredClone(runnerSpec.commands[0]), id: 'SOURCE_DERIVED_EFFECT', context: 'DIRECT', argv: ['/usr/bin/node', './source-effect.mjs'], source_references: ['testing/source-effect.mjs'], required_runner_state: [],
  }];
  assert(diagnosticCodes(validateOperationContract({ spec: normalizePhaseSpec(sourceEffectSpec), snapshot: sourceEffectSnapshot })).includes('BUDGET_CONTRACT_INCONSISTENT'));
  const sourceShellSpec = structuredClone(referenceSpec);
  const sourceShellSnapshot = structuredClone(referenceSnapshot);
  addSyntheticContent(sourceShellSpec, sourceShellSnapshot, 'testing/source-shell.mjs', "import { spawn } from 'node:child_process';\nspawn('/usr/bin/node', [], { shell: true });\n");
  sourceShellSpec.commands = [{
    ...structuredClone(runnerSpec.commands[0]), id: 'SOURCE_SHELL_EFFECT', context: 'DIRECT', argv: ['/usr/bin/node', './source-shell.mjs'], source_references: ['testing/source-shell.mjs'], required_runner_state: [],
  }];
  const sourceShellResult = validateOperationContract({ spec: normalizePhaseSpec(sourceShellSpec), snapshot: sourceShellSnapshot });
  assert(diagnosticCodes(sourceShellResult).includes('COMMAND_INJECTION_SURFACE'));
  assert(diagnosticCodes(sourceShellResult).includes('BUDGET_CONTRACT_INCONSISTENT'));
  for (const [index, source] of [
    "import { spawn } from 'node:child_process';\nconst options = { shell: true };\nspawn('node', [], options);\n",
    "import { spawn } from 'node:child_process';\nconst shell = true;\nspawn('node', [], { shell });\n",
    "import { spawn } from 'node:child_process';\nconst options = makeOptions();\nspawn('node', [], options);\n",
    "import { spawn } from 'node:child_process';\nconst options = {};\noptions.shell = true;\nspawn('node', [], options);\n",
    "import { spawn } from 'node:child_process';\nspawn('node', [], { ['shell']: true });\n",
    "import { spawn } from 'node:child_process';\nconst key = 'shell';\nspawn('node', [], { [key]: true });\n",
    "import { spawn } from 'node:child_process';\nconst options = {};\nconst alias = options;\nalias.shell = true;\nspawn('node', [], options);\n",
    "import { spawn } from 'node:child_process';\nconst options = {};\nconst alias = options;\nconst nested = alias;\nnested.shell = true;\nspawn('node', [], options);\n",
    "import { spawn } from 'node:child_process';\nconst options = { shell: false };\nspawn('node', [], options);\n",
    "import { spawn } from 'node:child_process';\nspawn('node', [], { shell: false, shell: true });\n",
    "import { spawn } from 'node:child_process';\nspawn('node', [], { get shell() { return true; } });\n",
    "import { spawn } from 'node:child_process';\nspawn('node', [], { __proto__: { shell: true } });\n",
  ].entries()) {
    const spec = structuredClone(referenceSpec); const snapshot = structuredClone(referenceSnapshot); const path = `testing/source-shell-alias-${index}.mjs`;
    addSyntheticContent(spec, snapshot, path, source);
    spec.commands = [{ ...structuredClone(runnerSpec.commands[0]), id: `SOURCE_SHELL_ALIAS_${index}`, context: 'DIRECT', argv: ['node', path], source_references: [path], required_runner_state: [] }];
    assert(diagnosticCodes(validateOperationContract({ spec: normalizePhaseSpec(spec), snapshot })).includes('COMMAND_INJECTION_SURFACE'));
  }
  const sourceShellFalseSpec = structuredClone(referenceSpec);
  const sourceShellFalseSnapshot = structuredClone(referenceSnapshot);
  addSyntheticContent(sourceShellFalseSpec, sourceShellFalseSnapshot, 'testing/source-shell-false.mjs', "import { spawn } from 'node:child_process';\nspawn('node', [], { shell: false });\n");
  sourceShellFalseSpec.commands = [{ ...structuredClone(runnerSpec.commands[0]), id: 'SOURCE_SHELL_FALSE', context: 'DIRECT', argv: ['node', 'testing/source-shell-false.mjs'], source_references: ['testing/source-shell-false.mjs'], required_runner_state: [] }];
  assert.equal(diagnosticCodes(validateOperationContract({ spec: normalizePhaseSpec(sourceShellFalseSpec), snapshot: sourceShellFalseSnapshot })).includes('COMMAND_INJECTION_SURFACE'), false);
  const sourceShellAbsentSpec = structuredClone(referenceSpec);
  const sourceShellAbsentSnapshot = structuredClone(referenceSnapshot);
  addSyntheticContent(sourceShellAbsentSpec, sourceShellAbsentSnapshot, 'testing/source-shell-absent.mjs', "import { spawn } from 'node:child_process';\nspawn('node', [], { cwd: 'testing' });\n");
  sourceShellAbsentSpec.commands = [{ ...structuredClone(runnerSpec.commands[0]), id: 'SOURCE_SHELL_ABSENT', context: 'DIRECT', argv: ['node', 'testing/source-shell-absent.mjs'], source_references: ['testing/source-shell-absent.mjs'], required_runner_state: [] }];
  const sourceShellAbsentCodes = diagnosticCodes(validateOperationContract({ spec: normalizePhaseSpec(sourceShellAbsentSpec), snapshot: sourceShellAbsentSnapshot }));
  assert.equal(sourceShellAbsentCodes.includes('COMMAND_INJECTION_SURFACE'), false);
  assert(sourceShellAbsentCodes.includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
}

async function testPublicValidationPipeline(referenceSpec, referenceSnapshot) {
  for (const malformedSnapshot of [{}, { ...structuredClone(referenceSnapshot), paths: null }]) {
    const malformed = validatePhaseCompilation({ authoredSpec: referenceSpec, snapshot: malformedSnapshot });
    assert.equal(malformed.valid, false);
    assert.equal(malformed.primary_code, 'SCHEMA_VALIDATION');
    assert(malformed.diagnostics.every((record) => record.code === 'SCHEMA_VALIDATION' || record.code === 'SCHEMA_DEPTH_EXCEEDED'));
  }
  for (const fixture of positiveFixtures(referenceSpec, referenceSnapshot)) {
    const result = validatePhaseCompilation({ authoredSpec: fixture.spec, snapshot: fixture.snapshot });
    assert.equal(result.valid, true, `${fixture.id} public pipeline ${JSON.stringify(result.diagnostics)}`);
    assert.equal(result.primary_code, null);
    assert(Object.isFrozen(result));
  }
  const { compilePhaseBundle } = await import('./deterministic-renderer.mjs');
  for (const secret of [`sk-${'c'.repeat(24)}`, `sk_${'d'.repeat(24)}`]) {
    const secretFixture = structuredClone(positiveFixtures(referenceSpec, referenceSnapshot).find((fixture) => fixture.id === 'P02'));
    secretFixture.spec.commands[0].expected.stdout = secret;
    const validation = validatePhaseCompilation({ authoredSpec: secretFixture.spec, snapshot: secretFixture.snapshot });
    assert.equal(validation.valid, false);
    assert(diagnosticCodes(validation).includes('SECRET_BEARING_FIELD_FORBIDDEN'));
    assert.equal(JSON.stringify(validation.diagnostics).includes(secret), false);
    let compileFailure;
    let emittedBytes = Buffer.alloc(0);
    try {
      const compiled = compilePhaseBundle({ authoredSpec: secretFixture.spec, snapshot: secretFixture.snapshot });
      emittedBytes = Buffer.concat(compiled.artifact_names.map((name) => compiled.readArtifact(name)));
    } catch (error) {
      compileFailure = error;
    }
    assert(compileFailure instanceof DiagnosticError);
    assert.equal(compileFailure.diagnostic.code, 'SECRET_BEARING_FIELD_FORBIDDEN');
    assert.equal(JSON.stringify(compileFailure.diagnostic).includes(secret), false);
    assert.equal(emittedBytes.includes(Buffer.from(secret)), false);
  }
  for (const id of Object.keys(FAILURE_CATALOG).filter((candidate) => !['N05', 'N16', 'N17', 'N22', 'N23', 'N28'].includes(candidate))) {
    const fixture = task2Fixture(id, referenceSpec, referenceSnapshot);
    const result = validatePhaseCompilation({ authoredSpec: fixture.spec, snapshot: fixture.snapshot });
    assert.equal(result.valid, false, `${id} unexpectedly valid`);
    assert.equal(result.primary_code, FAILURE_CATALOG[id].expected_codes[0], `${id} primary ${JSON.stringify(result.diagnostics)}`);
  }
  const phase33wa = modeledPhase33waFixture(referenceSpec, referenceSnapshot);
  const phase33waResult = validatePhaseCompilation({ authoredSpec: phase33wa.spec, snapshot: phase33wa.snapshot });
  assert(phase33waResult.diagnostics.some((record) => record.code === 'SCOPE_DIRECT_COMMAND_DEPENDENCY'));
  assert(phase33waResult.diagnostics.some((record) => record.code === 'MANIFEST_COUNT_MISMATCH'));
  const staleClosureFixture = structuredClone(positiveFixtures(referenceSpec, referenceSnapshot).find((fixture) => fixture.id === 'P03'));
  staleClosureFixture.snapshot.derived_dependency_facts.push({ command_id: 'HISTORICAL_READ', reference: 'testing/not-derived.json', classification: 'DECLARED_AND_MATCHED' });
  refreshSyntheticSnapshot(staleClosureFixture.snapshot);
  const staleClosure = validatePhaseCompilation({ authoredSpec: staleClosureFixture.spec, snapshot: staleClosureFixture.snapshot });
  assert(diagnosticCodes(staleClosure).includes('REPOSITORY_SNAPSHOT_STALE'));

  const extraInventory = structuredClone(referenceSnapshot);
  extraInventory.paths.push({ ...structuredClone(extraInventory.paths.find((record) => record.path === 'README.md')), path: 'testing/unrequested-evidence.txt' });
  refreshSyntheticSnapshot(extraInventory);
  const extraInventoryResult = validatePhaseCompilation({ authoredSpec: referenceSpec, snapshot: extraInventory });
  assert.equal(extraInventoryResult.valid, false);
  assert(extraInventoryResult.diagnostics.some((record) => record.code === 'REPOSITORY_IDENTITY_MISMATCH' && record.sanitized_evidence.reason === 'snapshot path inventory differs from exact scope'));

  const unauthorizedSource = structuredClone(positiveFixtures(referenceSpec, referenceSnapshot).find((fixture) => fixture.id === 'P03'));
  unauthorizedSource.spec.scope.preserve_paths = unauthorizedSource.spec.scope.preserve_paths.filter((path) => path !== 'testing/synthetic-p03.mjs');
  unauthorizedSource.spec.scope.read_content_paths = unauthorizedSource.spec.scope.read_content_paths.filter((path) => path !== 'testing/synthetic-p03.mjs');
  const unauthorizedSourceResult = validatePhaseCompilation({ authoredSpec: unauthorizedSource.spec, snapshot: unauthorizedSource.snapshot });
  assert.equal(unauthorizedSourceResult.valid, false);
  assert(unauthorizedSourceResult.diagnostics.some((record) => record.code === 'COMMAND_DEPENDENCY_UNDECLARED' && record.sanitized_evidence.reason === 'source reference lacks tracked content authority'));

  for (const mutate of [
    (snapshot) => { snapshot.paths[0].content_utf8 = '# tampered\n'; },
    (snapshot) => { snapshot.snapshot_digest = '0'.repeat(64); },
    (snapshot) => { snapshot.paths[0].blob = ''; refreshSyntheticSnapshot(snapshot); },
  ]) {
    const snapshot = structuredClone(referenceSnapshot);
    mutate(snapshot);
    const result = validatePhaseCompilation({ authoredSpec: referenceSpec, snapshot });
    assert.equal(result.primary_code, 'REPOSITORY_IDENTITY_MISMATCH');
  }

  const multipleEvidence = structuredClone(referenceSnapshot);
  multipleEvidence.head = '8'.repeat(40);
  multipleEvidence.tree = '7'.repeat(40);
  refreshSyntheticSnapshot(multipleEvidence);
  const multipleResult = validatePhaseCompilation({ authoredSpec: referenceSpec, snapshot: multipleEvidence });
  const identityDiagnostics = multipleResult.diagnostics.filter((record) => record.code === 'REPOSITORY_IDENTITY_MISMATCH');
  assert(identityDiagnostics.length >= 2);
  assert.deepEqual(identityDiagnostics.map((record) => record.location_json_pointer).slice(0, 2), ['/head', '/tree']);
  assert.equal(multipleResult.primary_code, 'REPOSITORY_IDENTITY_MISMATCH');
}

function testCommandClosure(referenceSpec, referenceSnapshot) {
  assert.deepEqual(DEPENDENCY_CLASSIFICATIONS, [
    'DECLARED_AND_MATCHED',
    'DECLARED_BUT_UNPROVEN',
    'UNDECLARED',
    'UNRESOLVED_INDIRECTION',
  ]);
  assert(Object.isFrozen(RUNNER_ADAPTERS_V1));
  for (const fixture of positiveFixtures(referenceSpec, referenceSnapshot)) {
    const result = validateCommandDependencies({
      spec: normalizePhaseSpec(fixture.spec),
      snapshot: fixture.snapshot,
    });
    assert.equal(result.valid, true, `${fixture.id} closure diagnostics ${JSON.stringify(result.diagnostics)}`);
    assert(result.classifications.every((entry) => entry.classification === 'DECLARED_AND_MATCHED'));
    assert(Object.isFrozen(result));
    assert(Object.isFrozen(result.classifications));
  }

  const staticSpec = structuredClone(referenceSpec);
  const staticSnapshot = structuredClone(referenceSnapshot);
  const staticSources = {
    'testing/static-main.mjs': "import './static-helper.mjs';\nawait import('./static-dynamic.mjs');\nimport { readFileSync } from 'node:fs';\nimport { spawn } from 'node:child_process';\nreadFileSync('./static-data.json');\nspawn('/usr/bin/node', ['./static-child.mjs']);\n",
    'testing/static-helper.mjs': 'const helper = true;\n',
    'testing/static-dynamic.mjs': 'const dynamic = true;\n',
    'testing/static-child.mjs': 'const child = true;\n',
    'testing/static-data.json': '{}\n',
  };
  for (const [path, content] of Object.entries(staticSources)) {
    staticSpec.scope.preserve_paths.push(path);
    if (path.endsWith('.mjs')) staticSpec.scope.read_content_paths.push(path);
    staticSnapshot.paths.push({
      path,
      role: 'PRESERVE',
      state: 'TRACKED',
      mode: '100644',
      blob: '8'.repeat(40),
      sha256: '9'.repeat(64),
      bytes: Buffer.byteLength(content),
      lf: [...content].filter((character) => character === '\n').length,
      cr: 0,
      ...(path.endsWith('.mjs') ? { content_utf8: content } : {}),
    });
  }
  staticSpec.commands = [{
    id: 'STATIC_EXTRACTION',
    sequence: 1,
    context: 'DIRECT',
    argv: ['/usr/bin/node', './static-main.mjs'],
    cwd: 'testing',
    reads: ['testing/static-data.json'],
    writes: [],
    environment_names: [],
    prerequisite_state: [],
    produced_state: [],
    expected: { exit: 0, stdout: '', stderr: '' },
    required_manifest_state: [],
    required_runner_state: [],
    compatibility_timepoint: 'CURRENT',
    source_references: [
      'testing/static-main.mjs',
      'testing/static-helper.mjs',
      'testing/static-dynamic.mjs',
      'testing/static-child.mjs',
    ],
    operation_charges: { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 },
    rollback_id: '',
  }];
  const staticResult = validateCommandDependencies({ spec: normalizePhaseSpec(staticSpec), snapshot: staticSnapshot });
  assert.equal(staticResult.valid, true, `static extraction diagnostics ${JSON.stringify(staticResult.diagnostics)}`);

  const npmSpec = structuredClone(referenceSpec);
  const npmSnapshot = structuredClone(referenceSnapshot);
  for (const [path, content] of [
    ['package.json', '{"scripts":{"synthetic":"/usr/bin/node ./testing/npm-child.mjs"}}\n'],
    ['testing/npm-child.mjs', 'const npmChild = true;\n'],
  ]) {
    npmSpec.scope.preserve_paths.push(path);
    npmSpec.scope.read_content_paths.push(path);
    npmSnapshot.paths.push({
      path,
      role: 'PRESERVE',
      state: 'TRACKED',
      mode: '100644',
      blob: 'a'.repeat(40),
      sha256: 'b'.repeat(64),
      bytes: Buffer.byteLength(content),
      lf: 1,
      cr: 0,
      content_utf8: content,
    });
  }
  npmSpec.commands = [{
    id: 'NPM_EXPANSION',
    sequence: 1,
    context: 'DIRECT',
    argv: ['/usr/local/bin/npm', 'run', 'synthetic'],
    cwd: 'testing',
    reads: ['package.json', 'testing/npm-child.mjs'],
    writes: [],
    environment_names: [],
    prerequisite_state: [],
    produced_state: [],
    expected: { exit: 0, stdout: '', stderr: '' },
    required_manifest_state: [],
    required_runner_state: [],
    compatibility_timepoint: 'CURRENT',
    source_references: ['package.json', 'testing/npm-child.mjs'],
    operation_charges: { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 },
    rollback_id: '',
  }];
  const npmResult = validateCommandDependencies({ spec: normalizePhaseSpec(npmSpec), snapshot: npmSnapshot });
  assert.equal(npmResult.valid, true, `npm expansion diagnostics ${JSON.stringify(npmResult.diagnostics)}`);
  const compoundNpmSpec = structuredClone(npmSpec);
  const compoundNpmSnapshot = structuredClone(npmSnapshot);
  const compoundPackage = compoundNpmSnapshot.paths.find((record) => record.path === 'package.json');
  compoundPackage.content_utf8 = '{"scripts":{"synthetic":"/usr/bin/curl https://example.invalid | tee testing/out.txt"}}\n';
  const compoundPackageIdentity = bufferIdentity(Buffer.from(compoundPackage.content_utf8));
  Object.assign(compoundPackage, { sha256: compoundPackageIdentity.sha256, bytes: compoundPackageIdentity.bytes, lf: compoundPackageIdentity.lf, cr: compoundPackageIdentity.cr });
  const compoundNpmClosure = validateCommandDependencies({ spec: normalizePhaseSpec(compoundNpmSpec), snapshot: compoundNpmSnapshot });
  const compoundNpmOperation = validateOperationContract({ spec: normalizePhaseSpec(compoundNpmSpec), snapshot: compoundNpmSnapshot });
  assert(diagnosticCodes(compoundNpmClosure).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  assert(diagnosticCodes(compoundNpmOperation).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));

  function npmScenario(scripts, entry = 'root') {
    const spec = structuredClone(referenceSpec); const snapshot = structuredClone(referenceSnapshot);
    const packageContent = `${JSON.stringify({ scripts })}\n`; const identity = bufferIdentity(Buffer.from(packageContent));
    spec.scope.preserve_paths.push('package.json'); spec.scope.read_content_paths.push('package.json');
    snapshot.paths.push({ path: 'package.json', role: 'PRESERVE', state: 'TRACKED', mode: '100644', blob: '7'.repeat(40), sha256: identity.sha256, bytes: identity.bytes, lf: identity.lf, cr: identity.cr, content_utf8: packageContent });
    spec.commands = [{ id: 'NPM_RECURSIVE', sequence: 1, context: 'DIRECT', argv: ['/usr/local/bin/npm', 'run', entry], cwd: 'testing', reads: ['package.json'], writes: [], environment_names: [], prerequisite_state: [], produced_state: [], expected: { exit: 0, stdout: '', stderr: '' }, required_manifest_state: [], required_runner_state: [], compatibility_timepoint: 'CURRENT', source_references: ['package.json'], operation_charges: { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 }, rollback_id: '' }];
    const normalized = normalizePhaseSpec(spec); const snapshotByPath = new Map(snapshot.paths.map((record) => [record.path, record]));
    return { closure: validateCommandDependencies({ spec: normalized, snapshot }), operation: validateOperationContract({ spec: normalized, snapshot }), capability: deriveNpmScriptCapabilities({ command: normalized.commands[0], snapshotByPath }) };
  }
  const npmLifecycle = npmScenario({ preroot: '/usr/bin/curl https://example.invalid/pre', root: '/usr/bin/true', postroot: '/usr/local/bin/vercel deploy' });
  assert.equal(npmLifecycle.closure.valid, true, JSON.stringify(npmLifecycle.closure.diagnostics));
  assert.deepEqual(npmLifecycle.capability.vectors, [['/usr/bin/curl', 'https://example.invalid/pre'], ['/usr/bin/true'], ['/usr/local/bin/vercel', 'deploy']]);
  assert.equal(npmLifecycle.operation.derived_aggregate.network, 2);
  assert.equal(npmLifecycle.operation.derived_aggregate.deployments, 1);
  assert(diagnosticCodes(npmLifecycle.operation).includes('ROLLBACK_RESOURCE_UNCOVERED'));
  const nestedNpm = npmScenario({ root: '/usr/local/bin/npm run inner', preinner: '/usr/bin/curl https://example.invalid/pre-inner', inner: '/usr/bin/curl https://example.invalid/inner', postinner: '/usr/bin/curl https://example.invalid/post-inner' });
  assert.equal(nestedNpm.closure.valid, true, JSON.stringify(nestedNpm.closure.diagnostics));
  assert.equal(nestedNpm.operation.derived_aggregate.network, 3);
  function npmManifestScenario({ manifests, cwd, reads, sourceReferences, sources = {} }) {
    const spec = structuredClone(referenceSpec); const snapshot = structuredClone(referenceSnapshot);
    for (const [path, scripts] of Object.entries(manifests)) sources[path] = `${JSON.stringify({ scripts })}\n`;
    for (const [path, content] of Object.entries(sources)) {
      const identity = bufferIdentity(Buffer.from(content)); spec.scope.preserve_paths.push(path);
      if (path.endsWith('.mjs') || path.endsWith('package.json')) spec.scope.read_content_paths.push(path);
      snapshot.paths.push({ path, role: 'PRESERVE', state: 'TRACKED', mode: '100644', blob: '5'.repeat(40), sha256: identity.sha256, bytes: identity.bytes, lf: identity.lf, cr: identity.cr, ...(path.endsWith('.mjs') || path.endsWith('package.json') ? { content_utf8: content } : {}) });
    }
    spec.commands = [{ id: 'NPM_NEAREST', sequence: 1, context: 'DIRECT', argv: ['/usr/local/bin/npm', 'run', 'root'], cwd, reads, writes: [], environment_names: [], prerequisite_state: [], produced_state: [], expected: { exit: 0, stdout: '', stderr: '' }, required_manifest_state: [], required_runner_state: [], compatibility_timepoint: 'CURRENT', source_references: sourceReferences, operation_charges: { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 }, rollback_id: '' }];
    const normalized = normalizePhaseSpec(spec); const snapshotByPath = new Map(snapshot.paths.map((record) => [record.path, record]));
    return { closure: validateCommandDependencies({ spec: normalized, snapshot }), operation: validateOperationContract({ spec: normalized, snapshot }), capability: deriveNpmScriptCapabilities({ command: normalized.commands[0], snapshotByPath }) };
  }
  const nearestNpm = npmManifestScenario({
    manifests: { 'package.json': { root: '/usr/bin/true' }, 'testing/package.json': { preroot: '/usr/bin/curl https://example.invalid/nested-pre', root: '/usr/bin/true', postroot: '/usr/local/bin/vercel deploy' } },
    cwd: 'testing/deeper', reads: ['testing/package.json'], sourceReferences: ['testing/package.json'],
  });
  assert.equal(nearestNpm.capability.package_cwd, 'testing');
  assert.deepEqual(nearestNpm.capability.vectors, [['/usr/bin/curl', 'https://example.invalid/nested-pre'], ['/usr/bin/true'], ['/usr/local/bin/vercel', 'deploy']]);
  assert.equal(nearestNpm.closure.valid, true, JSON.stringify(nearestNpm.closure.diagnostics));
  assert.equal(nearestNpm.operation.derived_aggregate.network, 2);
  assert.equal(nearestNpm.operation.derived_aggregate.deployments, 1);
  const ancestorNpm = npmManifestScenario({
    manifests: { 'package.json': { root: '/usr/bin/node ./scripts/x.mjs' } }, cwd: 'testing/deeper', reads: ['package.json', 'data.json'], sourceReferences: ['package.json', 'scripts/x.mjs'],
    sources: { 'scripts/x.mjs': "import { readFileSync } from 'node:fs';\nreadFileSync('./data.json');\n", 'data.json': '{}\n' },
  });
  assert.equal(ancestorNpm.capability.package_cwd, '');
  assert.equal(ancestorNpm.closure.valid, true, JSON.stringify(ancestorNpm.closure.diagnostics));
  assert.equal(ancestorNpm.operation.valid, true, JSON.stringify(ancestorNpm.operation.diagnostics));
  const rootNpm = npmManifestScenario({ manifests: { 'package.json': { root: '/usr/bin/true' } }, cwd: '.', reads: ['package.json'], sourceReferences: ['package.json'] });
  assert.equal(rootNpm.capability.package_cwd, '');
  assert.equal(rootNpm.closure.valid, true, JSON.stringify(rootNpm.closure.diagnostics));
  for (const invalidScripts of [
    { root: '/usr/local/bin/npm run loop', loop: '/usr/local/bin/npm run root' },
    Object.fromEntries(Array.from({ length: 12 }, (_, index) => [`step${index}`, index === 11 ? '/usr/bin/true' : `/usr/local/bin/npm run step${index + 1}`])),
    { root: '/usr/local/bin/npm exec /usr/bin/node' },
  ]) {
    const entry = Object.hasOwn(invalidScripts, 'root') ? 'root' : 'step0';
    const invalid = npmScenario(invalidScripts, entry);
    assert(diagnosticCodes(invalid.closure).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
    assert(diagnosticCodes(invalid.operation).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  }

  function shellSourceResults(source, index) {
    const spec = structuredClone(referenceSpec); const snapshot = structuredClone(referenceSnapshot); const path = `testing/compound-${index}.sh`;
    const identity = bufferIdentity(Buffer.from(source));
    spec.scope.preserve_paths.push(path); spec.scope.read_content_paths.push(path);
    snapshot.paths.push({ path, role: 'PRESERVE', state: 'TRACKED', mode: '100755', blob: 'f'.repeat(40), sha256: identity.sha256, bytes: identity.bytes, lf: identity.lf, cr: identity.cr, content_utf8: source });
    spec.commands = [{ id: `COMPOUND_${index}`, sequence: 1, context: 'DIRECT', argv: ['/bin/sh', `./compound-${index}.sh`], cwd: 'testing', reads: [], writes: [], environment_names: [], prerequisite_state: [], produced_state: [], expected: { exit: 0, stdout: '', stderr: '' }, required_manifest_state: [], required_runner_state: [], compatibility_timepoint: 'CURRENT', source_references: [path], operation_charges: { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 }, rollback_id: '' }];
    const normalized = normalizePhaseSpec(spec);
    return [validateCommandDependencies({ spec: normalized, snapshot }), validateOperationContract({ spec: normalized, snapshot })];
  }
  for (const [index, source] of [
    'curl https://example.invalid | tee testing/out.txt\n',
    'curl https://example.invalid > testing/out.txt\n',
    'printf safe && curl https://example.invalid\n',
    'printf safe; curl https://example.invalid\n',
  ].entries()) for (const result of shellSourceResults(source, index)) assert(diagnosticCodes(result).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'), source);

  function shellGraphResults(mainSource, { helperSource = null, helperPath = 'testing/shell-helper.sh', operationCharges = { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 } } = {}) {
    const spec = structuredClone(referenceSpec); const snapshot = structuredClone(referenceSnapshot);
    const sources = [['testing/nested/shell-main.sh', mainSource], ...(helperSource === null ? [] : [[helperPath, helperSource]])];
    for (const [path, content] of sources) {
      const identity = bufferIdentity(Buffer.from(content));
      spec.scope.preserve_paths.push(path); spec.scope.read_content_paths.push(path);
      snapshot.paths.push({ path, role: 'PRESERVE', state: 'TRACKED', mode: '100755', blob: '4'.repeat(40), sha256: identity.sha256, bytes: identity.bytes, lf: identity.lf, cr: identity.cr, content_utf8: content });
    }
    spec.operation_budgets.network = operationCharges.network;
    spec.commands = [{ id: 'SHELL_GRAPH', sequence: 1, context: 'DIRECT', argv: ['/bin/sh', './nested/shell-main.sh'], cwd: 'testing', reads: [], writes: [], environment_names: [], prerequisite_state: [], produced_state: [], expected: { exit: 0, stdout: '', stderr: '' }, required_manifest_state: [], required_runner_state: [], compatibility_timepoint: 'CURRENT', source_references: sources.map(([path]) => path), operation_charges: operationCharges, rollback_id: '' }];
    const normalized = normalizePhaseSpec(spec);
    return { closure: validateCommandDependencies({ spec: normalized, snapshot }), operation: validateOperationContract({ spec: normalized, snapshot }) };
  }
  const quotedVariable = shellGraphResults("URL='https://example.invalid/health'\n/usr/bin/curl \"$URL\"\n", { operationCharges: { network: 1, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 } });
  assert.equal(quotedVariable.closure.valid, true, JSON.stringify(quotedVariable.closure.diagnostics));
  assert.equal(quotedVariable.operation.derived_aggregate.network, 1);
  assert.equal(diagnosticCodes(quotedVariable.operation).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'), false);
  const sourcedHelper = shellGraphResults('source ./shell-helper.sh\n', { helperSource: '/usr/bin/true\n' });
  assert.equal(sourcedHelper.closure.valid, true, JSON.stringify(sourcedHelper.closure.diagnostics));
  assert.equal(sourcedHelper.operation.valid, true, JSON.stringify(sourcedHelper.operation.diagnostics));
  for (const [invalidShell, expectedReference] of [
    ["URL='https://example.invalid/health'\n/usr/bin/curl $URL\n", '[unmodeled-shell-expansion]'],
    ['/usr/bin/curl "$UNBOUND_URL"\n', '[unmodeled-shell-expansion]'],
  ]) {
    const result = shellGraphResults(invalidShell);
    assert(diagnosticCodes(result.closure).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
    assert(diagnosticCodes(result.operation).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
    assert(result.closure.classifications.some((entry) => entry.reference === expectedReference && entry.classification === 'UNRESOLVED_INDIRECTION'));
  }
  const sourcedCycle = shellGraphResults('source ./shell-helper.sh\n', { helperSource: 'source ./nested/shell-main.sh\n' });
  assert(diagnosticCodes(sourcedCycle.closure).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  assert(diagnosticCodes(sourcedCycle.operation).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  assert(sourcedCycle.closure.classifications.some((entry) => entry.reference === '[shell-source-cycle]' && entry.classification === 'UNRESOLVED_INDIRECTION'));
  const sourcedText = shellGraphResults('source ./shell-helper.txt\n', {
    helperPath: 'testing/shell-helper.txt',
    helperSource: '/usr/bin/curl https://example.invalid/hidden\n',
  });
  assert(diagnosticCodes(sourcedText.closure).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  assert(diagnosticCodes(sourcedText.operation).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));

  const runnerSpec = structuredClone(referenceSpec);
  runnerSpec.commands = [{
    id: 'VERSIONED_RUNNER_CHILD', sequence: 1, context: 'RUNNER_CHILD', argv: ['/usr/bin/true'], cwd: 'testing',
    reads: [], writes: [], environment_names: [], prerequisite_state: [], produced_state: [],
    expected: { exit: 0, stdout: '', stderr: '' }, required_manifest_state: [],
    required_runner_state: ['RUNNER_ADAPTER_V1:LEGACY_MANIFEST'], compatibility_timepoint: 'CURRENT', source_references: [],
    operation_charges: { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 }, rollback_id: '',
  }];
  const runnerAdapters = { version: 1, adapters: [{ id: 'LEGACY_MANIFEST' }] };
  assert.equal(validateCommandDependencies({ spec: normalizePhaseSpec(runnerSpec), snapshot: referenceSnapshot, runnerAdapters }).valid, true);
  assert.equal(validateGovernance({ spec: normalizePhaseSpec(runnerSpec), runnerAdapters }).valid, true);

  function astCase(source, { commandCwd = 'testing', helperSource = null, helperPath = 'testing/ast-helper.mjs', includeHelperReference = true, reads = [], sourcePath = 'testing/ast-main.mjs', writes = [] } = {}) {
    const spec = structuredClone(referenceSpec);
    const snapshot = structuredClone(referenceSnapshot);
    const sources = [[sourcePath, source]];
    if (helperSource !== null) sources.push([helperPath, helperSource]);
    for (const [path, content] of sources) {
      const identity = bufferIdentity(Buffer.from(content));
      spec.scope.preserve_paths.push(path);
      spec.scope.read_content_paths.push(path);
      snapshot.paths.push({ path, role: 'PRESERVE', state: 'TRACKED', mode: '100644', blob: 'c'.repeat(40), sha256: identity.sha256, bytes: identity.bytes, lf: identity.lf, cr: identity.cr, content_utf8: content });
    }
    spec.commands = [{
      id: 'AST_FAIL_CLOSED', sequence: 1, context: 'DIRECT', argv: ['/usr/bin/node', commandCwd === '.' ? sourcePath : `./${sourcePath.slice(sourcePath.lastIndexOf('/') + 1)}`], cwd: commandCwd,
      reads, writes, environment_names: [], prerequisite_state: [], produced_state: [],
      expected: { exit: 0, stdout: '', stderr: '' }, required_manifest_state: [], required_runner_state: [],
      compatibility_timepoint: 'CURRENT', source_references: sources.filter(([path]) => path === sourcePath || includeHelperReference).map(([path]) => path),
      operation_charges: { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 }, rollback_id: '',
    }];
    return validateCommandDependencies({ spec: normalizePhaseSpec(spec), snapshot });
  }
  function astOperationCase(source, { commandCwd = 'testing', helperSource = null, includeHelperReference = true, reads = [], sourcePath = 'testing/operation-ast-main.mjs', writes = [] } = {}) {
    const spec = structuredClone(referenceSpec);
    const snapshot = structuredClone(referenceSnapshot);
    const sources = [[sourcePath, source]];
    if (helperSource !== null) sources.push(['testing/ast-helper.mjs', helperSource]);
    for (const [path, content] of sources) {
      const identity = bufferIdentity(Buffer.from(content));
      spec.scope.preserve_paths.push(path); spec.scope.read_content_paths.push(path);
      snapshot.paths.push({ path, role: 'PRESERVE', state: 'TRACKED', mode: '100644', blob: 'e'.repeat(40), sha256: identity.sha256, bytes: identity.bytes, lf: identity.lf, cr: identity.cr, content_utf8: content });
    }
    spec.commands = [{
      id: 'OPERATION_AST_FAIL_CLOSED', sequence: 1, context: 'DIRECT', argv: ['/usr/bin/node', commandCwd === '.' ? sourcePath : `./${sourcePath.slice(sourcePath.lastIndexOf('/') + 1)}`], cwd: commandCwd,
      reads, writes, environment_names: [], prerequisite_state: [], produced_state: [],
      expected: { exit: 0, stdout: '', stderr: '' }, required_manifest_state: [], required_runner_state: [],
      compatibility_timepoint: 'CURRENT', source_references: sources.filter(([path]) => path === sourcePath || includeHelperReference).map(([path]) => path),
      operation_charges: { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 }, rollback_id: '',
    }];
    return validateOperationContract({ spec: normalizePhaseSpec(spec), snapshot });
  }
  function argvCase(argv) {
    const spec = structuredClone(referenceSpec);
    spec.commands = [{
      id: 'ARGV_AUTHORITY', sequence: 1, context: 'DIRECT', argv, cwd: 'testing', reads: [], writes: [], environment_names: [], prerequisite_state: [], produced_state: [],
      expected: { exit: 0, stdout: '', stderr: '' }, required_manifest_state: [], required_runner_state: [], compatibility_timepoint: 'CURRENT', source_references: [],
      operation_charges: { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 }, rollback_id: '',
    }];
    return validateCommandDependencies({ spec: normalizePhaseSpec(spec), snapshot: referenceSnapshot });
  }
  function textEntrypointCase(executable, path, source) {
    const spec = structuredClone(referenceSpec); const snapshot = structuredClone(referenceSnapshot);
    addSyntheticContent(spec, snapshot, path, source);
    spec.commands = [{
      id: 'TEXT_ENTRYPOINT', sequence: 1, context: 'DIRECT', argv: [executable, `./${path.slice(path.lastIndexOf('/') + 1)}`], cwd: 'testing',
      reads: [], writes: [], environment_names: [], prerequisite_state: [], produced_state: [], expected: { exit: 0, stdout: '', stderr: '' },
      required_manifest_state: [], required_runner_state: [], compatibility_timepoint: 'CURRENT', source_references: [path],
      operation_charges: { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 }, rollback_id: '',
    }];
    const normalized = normalizePhaseSpec(spec);
    return [validateCommandDependencies({ spec: normalized, snapshot }), validateOperationContract({ spec: normalized, snapshot })];
  }
  for (const result of textEntrypointCase('/bin/bash', 'testing/bash-entrypoint.txt', '/usr/bin/curl https://example.invalid/hidden\n')) {
    assert(diagnosticCodes(result).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  }
  for (const result of textEntrypointCase('/usr/bin/node', 'testing/node-entrypoint.txt', "globalThis.fetch('https://example.invalid/hidden');\n")) {
    assert(diagnosticCodes(result).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  }
  const nodeTextImport = astCase("import './ast-helper.txt';\n", {
    helperPath: 'testing/ast-helper.txt',
    helperSource: "globalThis.fetch('https://example.invalid/hidden');\n",
  });
  assert(diagnosticCodes(nodeTextImport).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  for (const argv of [
    ['/bin/sh', '-c', 'printf safe'],
    ['/bin/bash', '-c', 'printf safe'],
    ['/bin/bash', '-lc', 'printf safe'],
    ['/usr/bin/node', '-e', 'process.stdout.write("safe")'],
  ]) assert(diagnosticCodes(argvCase(argv)).includes('COMMAND_INJECTION_SURFACE'));
  assert(diagnosticCodes(argvCase(['python3', '-c', 'import urllib.request'])).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  for (const argv of [
    ['/tmp/git', 'status'],
    ['/tmp/curl', 'https://example.invalid'],
    ['/private/tmp/vercel', 'deploy'],
    ['/attacker/node', './main.mjs'],
    ['node', '--require', 'testing/hook.cjs', 'testing/main.mjs'],
    ['node', '--loader', 'testing/loader.mjs', 'testing/main.mjs'],
    ['node', 'testing/unbound.mjs'],
    ['npm', 'exec', 'node'],
    ['git', 'credential', 'fill'],
    ['git', 'remote', 'set-url', 'origin', 'https://example.invalid'],
    ['vercel', 'alias', 'set'],
    ['supabase', 'storage', 'ls'],
    ['gh', 'api', '--method', 'POST', '/repos/example'],
    ['curl', '--data=x', 'https://example.invalid'],
    ['wget', '--post-file=x', 'https://example.invalid'],
  ]) assert(diagnosticCodes(argvCase(argv)).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'), argv.join(' '));
  const boundAbsoluteExecutable = deriveExecutableEffectVector(['/usr/bin/git', 'status']);
  assert.equal(boundAbsoluteExecutable.supported, true);
  assert.equal(boundAbsoluteExecutable.executable, '/usr/bin/git');
  assert.equal(boundAbsoluteExecutable.executable_profile_version, 1);
  assert.equal(boundAbsoluteExecutable.executable_profile_identity, 'AIFINDER_EXECUTABLE_PROFILE_V1');
  assert.equal(EXECUTABLE_PROFILE_VERSION, 1);
  assert.equal(EXECUTABLE_PROFILE_IDENTITY, 'AIFINDER_EXECUTABLE_PROFILE_V1');
  assert(diagnosticCodes(argvCase(['/usr/bin/git', 'push', '--force-with-lease', 'origin', 'main'])).includes('PROHIBITED_GIT_MUTATION'));
  assert(diagnosticCodes(argvCase(['/usr/bin/git', 'push', '--force-with-lease=refs/heads/main', 'origin', 'main'])).includes('PROHIBITED_GIT_MUTATION'));
  for (const refspec of ['+main:main', '+HEAD:main']) assert(diagnosticCodes(argvCase(['/usr/bin/git', 'push', 'origin', refspec])).includes('PROHIBITED_GIT_MUTATION'));
  for (const source of [
    "import { readFile } from 'node:fs';\nconst target = process.argv[2];\nreadFile(target, () => {});\n",
    "import { createReadStream } from 'node:fs';\nconst target = process.argv[2];\ncreateReadStream(target);\n",
    "import { spawn } from 'node:child_process';\nconst executable = process.argv[2];\nspawn(executable, []);\n",
    "import { spawn } from 'node:child_process';\nconst argv = process.argv.slice(2);\nspawn('node', argv);\n",
    "const name = process.argv[2];\nprocess.stdout.write(process.env[name]);\n",
    "import { readFileSync } from 'node:fs';\nreadFileSync('/private/tmp/outside');\n",
    "import { readFileSync } from 'node:fs';\nreadFileSync('../../outside');\n",
  ]) {
    assert(astCase(source).diagnostics.some((record) => record.code === 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  }
  for (const [source, expectedKind, expectedReference] of [
    ["import { readFileSync as rf } from 'node:fs';\nrf('./aliased-import.json');\n", 'PATH', 'testing/aliased-import.json'],
    ["import * as fsp from 'node:fs/promises';\nfsp.readFile('./aliased-promises.json');\n", 'PATH', 'testing/aliased-promises.json'],
    ["import { spawn as launch } from 'node:child_process';\nlaunch('/usr/bin/node', ['./aliased-child.mjs']);\n", 'PATH', 'testing/aliased-child.mjs'],
    ["process.stdout.write(process.env.SAFE_NAME);\n", 'ENVIRONMENT', 'SAFE_NAME'],
  ]) {
    const result = astCase(source);
    assert(result.classifications.some((entry) => entry.kind === expectedKind && entry.reference === expectedReference && entry.classification === 'UNDECLARED'), JSON.stringify(result));
  }
  const reassigned = astCase("import { readFileSync } from 'node:fs';\nlet target = 'testing/original.json';\ntarget = 'testing/reassigned.json';\nreadFileSync(target);\n");
  assert(reassigned.classifications.some((entry) => entry.reference === '[computed-fs-readFileSync]' && entry.classification === 'UNRESOLVED_INDIRECTION'));
  const lexicalShadow = astCase("import { readFileSync } from 'node:fs';\nconst target = './outer.json';\n{ let target = process.argv[2]; target = './inner.json'; readFileSync(target); }\nreadFileSync(target);\n");
  assert(lexicalShadow.classifications.some((entry) => entry.reference === 'testing/outer.json' && entry.classification === 'UNDECLARED'));
  assert(lexicalShadow.classifications.some((entry) => entry.reference === '[computed-fs-readFileSync]' && entry.classification === 'UNRESOLVED_INDIRECTION'));
  const overflowSource = `import { readFileSync as r } from 'node:fs';\n${Array.from({ length: 2055 }, (_, index) => `r('a/${index}');`).join('\n')}\n`;
  const overflow = astCase(overflowSource);
  assert.equal(overflow.classifications.filter((entry) => entry.reference === '[extraction-edge-bound]' && entry.classification === 'UNRESOLVED_INDIRECTION').length, 1);
  assert.equal(overflow.diagnostics.filter((record) => record.code === 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION' && record.sanitized_evidence.reference === '[extraction-edge-bound]').length, 1);
  const childShell = astCase("import { spawn } from 'node:child_process';\nspawn('node', [], { shell: true });\n");
  assert(diagnosticCodes(childShell).includes('COMMAND_INJECTION_SURFACE'));
  for (const source of [
    "import { spawn } from 'node:child_process';\nconst options = { shell: true };\nspawn('node', [], options);\n",
    "import { spawn } from 'node:child_process';\nconst shell = true;\nspawn('node', [], { shell });\n",
    "import { spawn } from 'node:child_process';\nconst options = makeOptions();\nspawn('node', [], options);\n",
    "import { spawn } from 'node:child_process';\nconst options = {};\noptions.shell = true;\nspawn('node', [], options);\n",
    "import { spawn } from 'node:child_process';\nspawn('node', [], { ['shell']: true });\n",
    "import { spawn } from 'node:child_process';\nconst key = 'shell';\nspawn('node', [], { [key]: true });\n",
    "import { spawn } from 'node:child_process';\nconst options = {};\nconst alias = options;\nalias.shell = true;\nspawn('node', [], options);\n",
    "import { spawn } from 'node:child_process';\nconst options = {};\nconst alias = options;\nconst nested = alias;\nnested.shell = true;\nspawn('node', [], options);\n",
    "import { spawn } from 'node:child_process';\nconst options = { shell: false };\nspawn('node', [], options);\n",
    "import { spawn } from 'node:child_process';\nspawn('node', [], { shell: false, shell: true });\n",
    "import { spawn } from 'node:child_process';\nspawn('node', [], { get shell() { return true; } });\n",
    "import { spawn } from 'node:child_process';\nspawn('node', [], { __proto__: { shell: true } });\n",
  ]) assert(diagnosticCodes(astCase(source)).includes('COMMAND_INJECTION_SURFACE'));
  for (const source of [
    "import { spawn } from 'node:child_process';\nspawn('/usr/bin/true', [], {});\n",
    "import { spawn } from 'node:child_process';\nspawn('/usr/bin/true', [], { shell: false });\n",
  ]) {
    assert.equal(diagnosticCodes(astCase(source)).includes('COMMAND_INJECTION_SURFACE'), false);
    assert.equal(diagnosticCodes(astCase(source)).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'), false);
    assert.equal(diagnosticCodes(astOperationCase(source)).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'), false);
  }
  for (const source of [
    "import { spawn } from 'node:child_process';\nspawn('/usr/bin/true', [], { cwd: 'testing' });\n",
    "import { spawn } from 'node:child_process';\nspawn('/usr/bin/true', [], { env: {} });\n",
    "import { spawn } from 'node:child_process';\nspawn('/usr/bin/true', [], { unknown: false });\n",
  ]) {
    assert(diagnosticCodes(astCase(source)).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
    assert(diagnosticCodes(astOperationCase(source)).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  }
  for (const { source, closureCode, operationCode, sourcePath } of [
    {
      source: "const moduleName = process.argv[2];\nawait import(moduleName);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import { spawn } from 'node:child_process';\nspawn('node', [);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import client from 'unsupported-capability-client';\nclient.run();\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as http from 'node:http';\nhttp.get('https://example.invalid');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as cp from 'node:child_process';\nconst launch = cp['spawn'];\nlaunch('curl', ['https://example.invalid']);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as cp from 'node:child_process';\nconst launch = cp.spawn.bind(cp);\nlaunch('curl', ['https://example.invalid']);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as cp from 'node:child_process';\nconst launch = cp.spawn;\nlaunch('node', []);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as cp from 'node:child_process';\nlet launch;\nlaunch = cp.spawn;\nlaunch('node', []);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "const load = require;\nload('node:fs');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as path from 'node:path';\nconst { join } = path;\njoin('a', 'b');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as cp from 'node:child_process';\nReflect.apply(cp.spawn, cp, ['node', []]);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as cp from 'node:child_process';\nconst launch = Reflect.get(cp, 'spawn');\nlaunch('/usr/bin/true', []);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as cp from 'node:child_process';\nObject.getOwnPropertyDescriptor(cp, 'spawn').value('/usr/bin/true', []);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as cp from 'node:child_process';\nnew Proxy(cp, {}).spawn('/usr/bin/true', []);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as cp from 'node:child_process';\nObject.assign({}, cp).spawn('/usr/bin/true', []);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "globalThis.Reflect.get(globalThis, 'fetch')('https://example.invalid');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "globalThis.Object.getOwnPropertyDescriptor(globalThis, 'fetch').value('https://example.invalid');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "globalThis.Bun.spawn(['/usr/bin/curl', 'https://example.invalid']);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "new globalThis.WebSocket('wss://example.invalid');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "process.getBuiltinModule('node:child_process').spawn('/usr/bin/curl', ['https://example.invalid']);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "const loader = module.require.bind(module);\nloader('node:fs');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "const O = Object;\nO.getOwnPropertyDescriptor(globalThis, 'fetch').value('https://example.invalid');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "const R = globalThis.Reflect;\nR.get(globalThis, 'fetch')('https://example.invalid');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "export * from 'node:fs';\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "export { readFileSync as exportedRead } from 'node:fs';\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "require('node:fs').readFileSync('testing/chained-require.json');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "(await import('node:fs')).readFileSync('testing/chained-import.json');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as cp from 'node:child_process';\nconst api = { launch: cp.spawn };\napi.launch('node', []);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as cp from 'node:child_process';\nconst method = process.argv[2];\ncp[method]('node', []);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as fs from 'node:fs';\nfs['readFileSync']('testing/bracket-data.json');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "const root = globalThis;\nconst env = root['process']['env'];\nprocess.stdout.write(env['UNDECLARED_NAME']);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "globalThis?.['fetch']('https://example.invalid');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "const request = globalThis.fetch.bind(globalThis);\nrequest('https://example.invalid');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as cp from 'node:child_process';\ncp?.spawn('node', []);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as cp from 'node:child_process';\nlet launch;\n({ spawn: launch } = cp);\nlaunch('node', []);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "const { fetch: request } = globalThis;\nrequest('https://example.invalid');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "const { env } = process;\nprocess.stdout.write(env.SECRET_NAME);\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "const capability = process.argv[2];\nglobalThis[capability]('https://example.invalid');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "module.require('node:fs').readFileSync('testing/alternate-loader.json');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import fs = require('node:fs');\nfs.readFileSync('testing/import-equals.json');\n",
      sourcePath: 'testing/ast-main.ts',
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import { randomUUID } from 'node:crypto';\nrandomUUID();\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import * as path from 'node:path';\npath.magicJoin('a', 'b');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
    {
      source: "import ts from 'typescript';\nts.transpile('code');\n",
      closureCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
      operationCode: 'COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION',
    },
  ]) {
    const closureCodes = diagnosticCodes(astCase(source, sourcePath === undefined ? {} : { sourcePath }));
    const operationCodes = diagnosticCodes(astOperationCase(source, sourcePath === undefined ? {} : { sourcePath: sourcePath.replace('ast-main', 'operation-ast-main') }));
    if (closureCode === null) assert.equal(closureCodes.includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'), false, source);
    else assert(closureCodes.includes(closureCode), `${closureCode}: ${source}`);
    if (operationCode !== null) assert(operationCodes.includes(operationCode), `${operationCode}: ${source}`);
  }
  for (const source of [
    "import { join } from 'node:path';\njoin('testing', 'safe.json');\n",
    "import { createHash } from 'node:crypto';\ncreateHash('sha256').update('safe').digest('hex');\n",
  ]) assert.equal(diagnosticCodes(astCase(source)).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'), false, source);
  const localImportCall = astCase("import './ast-helper.mjs';\n", { helperSource: 'const helper = true;\n' });
  assert.equal(diagnosticCodes(localImportCall).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'), false);
  const localReExport = "export { helper as forwarded } from './ast-helper.mjs';\n";
  assert(diagnosticCodes(astCase(localReExport, { helperSource: 'export function helper() { return true; }\n' })).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  assert(diagnosticCodes(astOperationCase(localReExport, { helperSource: 'export function helper() { return true; }\n' })).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  const secretReference = `testing/ghp_${'r'.repeat(24)}.json`;
  const secretReferenceResult = astCase(`import { readFileSync } from 'node:fs';\nreadFileSync('${secretReference}');\n`);
  assert.equal(JSON.stringify(secretReferenceResult.diagnostics).includes(secretReference), false);
  const transitive = astCase("import './ast-helper.mjs';\n", { helperSource: "import { readFileSync } from 'node:fs';\nreadFileSync('testing/hidden.json');\n" });
  assert(transitive.diagnostics.some((record) => record.code === 'COMMAND_DEPENDENCY_UNDECLARED'));

  const writeAsReadSource = "import { writeFileSync } from 'node:fs';\nwriteFileSync('README.md', 'changed');\n";
  assert(diagnosticCodes(astCase(writeAsReadSource, { commandCwd: '.', reads: ['README.md'], sourcePath: 'write-as-read.mjs' })).includes('COMMAND_DEPENDENCY_UNDECLARED'));
  assert(diagnosticCodes(astOperationCase(writeAsReadSource, { commandCwd: '.', reads: ['README.md'], sourcePath: 'operation-write-as-read.mjs' })).includes('ROLLBACK_RESOURCE_UNCOVERED'));

  for (const pathLiteral of ['data.json', './data.json']) {
    const result = astCase(`import { readFileSync } from 'node:fs';\nreadFileSync('${pathLiteral}');\n`, { reads: ['testing/data.json'] });
    assert(result.classifications.some((entry) => entry.reference === 'testing/data.json' && entry.classification === 'DECLARED_AND_MATCHED'));
  }
  const relativeChild = astCase("import { spawn } from 'node:child_process';\nspawn('/usr/bin/node', ['child.mjs']);\n", { helperSource: 'const child = true;\n' });
  assert(relativeChild.classifications.some((entry) => entry.reference === 'testing/child.mjs' && entry.classification === 'UNDECLARED'));

  for (const source of [
    "import { spawn } from 'node:child_process';\nfor (let i = 0; i < 2; i += 1) spawn('/usr/bin/curl', ['https://example.invalid']);\n",
    "import { spawn } from 'node:child_process';\nfunction run() { spawn('/usr/bin/curl', ['https://example.invalid']); }\n",
    "import { spawn } from 'node:child_process';\nif (false) spawn('/usr/bin/curl', ['https://example.invalid']);\n",
    "import { readFile } from 'node:fs';\nreadFile('./data.json', () => {});\n",
  ]) {
    assert(diagnosticCodes(astCase(source)).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
    assert(diagnosticCodes(astOperationCase(source)).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  }

  for (const source of [
    "import { readFileSync } from 'node:fs';\nimport { join } from 'node:path';\nreadFileSync(join('testing', 'spoof.json'));\n",
    "import { readFileSync } from 'node:fs';\nimport { resolve } from 'node:path';\nreadFileSync(resolve('testing', 'spoof.json'));\n",
  ]) {
    assert(diagnosticCodes(astCase(source)).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
    assert(diagnosticCodes(astOperationCase(source)).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  }

  const transitiveEffectSource = "import { spawn } from 'node:child_process';\nspawn('/usr/bin/curl', ['https://example.invalid/health']);\n";
  const transitiveEffect = astCase("import './ast-helper.mjs';\n", { helperSource: transitiveEffectSource });
  assert.equal(diagnosticCodes(transitiveEffect).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'), false);
  const transitiveEffectOperation = astOperationCase("import './ast-helper.mjs';\n", { helperSource: transitiveEffectSource });
  assert.equal(transitiveEffectOperation.derived_aggregate.network, 1);
  const unlistedTransitive = astCase("import './ast-helper.mjs';\n", { helperSource: transitiveEffectSource, includeHelperReference: false });
  assert(diagnosticCodes(unlistedTransitive).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'), JSON.stringify(unlistedTransitive));
  const unlistedTransitiveOperation = astOperationCase("import './ast-helper.mjs';\n", { helperSource: transitiveEffectSource, includeHelperReference: false });
  assert(diagnosticCodes(unlistedTransitiveOperation).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));

  const rootRead = astCase("import { readFileSync } from 'node:fs';\nreadFileSync('./README.md');\n", { commandCwd: '.', reads: ['README.md'], sourcePath: 'root-main.mjs' });
  assert.equal(rootRead.valid, true, JSON.stringify(rootRead.diagnostics));
  const rootCwdSpec = structuredClone(positiveFixtures(referenceSpec, referenceSnapshot).find((fixture) => fixture.id === 'P03').spec);
  rootCwdSpec.commands = [{ ...structuredClone(rootCwdSpec.commands[0]), cwd: '.' }];
  assert.equal(normalizePhaseSpec(rootCwdSpec).commands[0].cwd, '.');
  assert.equal(deriveExecutableEffectVector(['/usr/local/bin/vercel', 'inspect'], { commandCwd: '.' }).supported, true);

  for (const url of ['https://example.invalid/{a,b}', 'https://example.invalid/[1-2]']) {
    assert(diagnosticCodes(argvCase(['/usr/bin/curl', url])).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
    const childCurl = `import { spawn } from 'node:child_process';\nspawn('/usr/bin/curl', ['${url}']);\n`;
    assert(diagnosticCodes(astCase(childCurl)).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
    assert(diagnosticCodes(astOperationCase(childCurl)).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  }

  for (const [index, source] of [
    '/usr/bin/zip archive.zip *\n',
    '/usr/bin/curl $TARGET_URL\n',
    '/usr/bin/curl ~/target\n',
    '/usr/bin/curl https://example.invalid/{a,b}\n',
  ].entries()) {
    const [closure, operation] = shellSourceResults(source, 100 + index);
    assert(diagnosticCodes(closure).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
    assert(diagnosticCodes(operation).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));
  }

  for (const bareExecutable of ['curl', 'npm', 'node', 'git']) assert(diagnosticCodes(argvCase([bareExecutable, 'status'])).includes('COMMAND_DEPENDENCY_UNRESOLVED_INDIRECTION'));

  for (const id of ['N02', 'N03', 'N04', 'N06', 'N08', 'N10', 'N11', 'N12', 'N15']) {
    const fixture = task2Fixture(id, referenceSpec, referenceSnapshot);
    const result = validateCommandDependencies({ spec: fixture.spec, snapshot: fixture.snapshot });
    const codes = diagnosticCodes(result);
    for (const expectedCode of FAILURE_CATALOG[id].expected_codes) {
      assert(codes.includes(expectedCode), `${id} missing ${expectedCode}; got ${codes.join(',')}`);
    }
    assert.equal(result.valid, false);
  }

  const phase33wa = modeledPhase33waFixture(referenceSpec, referenceSnapshot);
  const phase33waCodes = diagnosticCodes(
    validateCommandDependencies({ spec: phase33wa.spec, snapshot: phase33wa.snapshot }),
    validateGovernance({ spec: phase33wa.spec, snapshot: phase33wa.snapshot }),
  );
  assert.deepEqual(phase33waCodes, ['MANIFEST_COUNT_MISMATCH', 'SCOPE_DIRECT_COMMAND_DEPENDENCY']);

  const phase33ua = task2Fixture('N04', referenceSpec, referenceSnapshot);
  assert(diagnosticCodes(validateCommandDependencies({ spec: phase33ua.spec, snapshot: phase33ua.snapshot })).includes('COMMAND_UNBOUND_VARIABLE'));
}

async function runGreenSuite() {
  const failures = [];
  try {
    const referenceSpecBytes = await readFile(join(directory, 'fixtures/reference-phase-spec.json'));
    const referenceSnapshotBytes = await readFile(join(directory, 'fixtures/reference-repository-snapshot.json'));
    const referenceSpec = parseStrictJson(referenceSpecBytes);
    for (const [name, test] of [
      ['schema', () => testSchemaAndPhaseSpec(referenceSpecBytes, referenceSnapshotBytes)],
      ['canonical', testCanonical],
      ['diagnostics', testDiagnostics],
      ['snapshot', () => testSnapshotAdapter(referenceSpec)],
      ['semantic-governance-operation', () => testSemanticGovernanceOperation(referenceSpec, parseStrictJson(referenceSnapshotBytes))],
      ['command-closure', () => testCommandClosure(referenceSpec, parseStrictJson(referenceSnapshotBytes))],
      ['public-pipeline', () => testPublicValidationPipeline(referenceSpec, parseStrictJson(referenceSnapshotBytes))],
    ]) {
      try {
        await test();
      } catch (error) {
        failures.push({ name, code: error instanceof DiagnosticError ? error.diagnostic.code : error?.code ?? error?.name ?? 'ERROR', detail: String(error?.message ?? '').slice(0, 512), at: String(error?.stack ?? '').split('\n').find((line) => line.includes('phase-compiler.test.mjs:'))?.trim() ?? '' });
      }
    }
  } catch (error) {
    failures.push({ name: 'internal', code: error instanceof DiagnosticError ? error.diagnostic.code : error?.code ?? error?.name ?? 'ERROR', detail: String(error?.message ?? '').slice(0, 512) });
  }
  if (failures.length !== 0) {
    process.stdout.write(`FAIL_PHASE_COMPILER_CORE failures=${failures.length} details=${JSON.stringify(failures)}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write(
    'PASS_PHASE_COMPILER_CORE gates=1-5 positive=P01,P02,P03,P04 negative_core=N01-N04,N06-N15,N18-N21,N24-N27 failure_catalog=N01-N28 rendering_negatives=N05,N16,N17,N22,N23,N28:DETERMINISM_SUITE inspection_contract=SCHEMA,AUTHORITY,REFERENCES,TEXT,DEEP_FREEZE public_pipeline=PASS secret_values=REJECTED_NO_EMISSION ast_fail_closed=PASS command_closure=PASS runtime_analyzer_binding=FAIL_CLOSED authority_identity_graph=FAIL_CLOSED lexical_floats=REJECTED snapshot_inventory=EXACT source_authority=EXACT snapshot_output_parent=DESCRIPTOR_BOUND git_pre_exec_binding=PASS git_spawn_cwd=DESCRIPTOR_BOUND_FAIL_CLOSED semantic_governance_operation=PASS historical_33na_33ra_33ua_33va_33wa=MODELED duplicate_keys=PASS closed_schema=PASS canonical_byte_order_lf=PASS authored_derived=PASS path_symlink_confinement=PASS repository_root_descriptor_bound=PASS tracked_fifo_swap_nonblocking=PASS deep_freeze=PASS\n',
  );
}
