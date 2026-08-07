import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmod, lstat, mkdtemp, readFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bufferIdentity, canonicalJsonBuffer, compareUtf8, parseStrictJson, repositorySnapshotDigest, semanticDigest } from './canonical.mjs';
import {
  artifactNamesForPhase,
  compilePhaseBundle,
  reconstructAuthorityIr,
  validateArtifactBuffers,
} from './deterministic-renderer.mjs';
import {
  EXECUTABLE_PROFILE_IDENTITY,
  EXECUTABLE_PROFILE_VERSION,
  validateCommandDependencies,
} from './command-dependency-validator.mjs';
import { writeCompiledBundle } from './external-bundle-writer.mjs';
import { FAILURE_CATALOG, negativeFixture, positiveFixtures } from './fixtures/failure-catalog.mjs';
import { DiagnosticError } from './error-catalog.mjs';
import { validateOperationContract } from './operation-contract-validator.mjs';

const directory = fileURLToPath(new URL('.', import.meta.url));
const EMBEDDED_SPEC_BEGIN = '<!-- AIFINDER_NORMALIZED_PHASE_SPEC_BYTES_BEGIN -->\n';
const EMBEDDED_SPEC_END = '<!-- AIFINDER_NORMALIZED_PHASE_SPEC_BYTES_END -->';
const EMBEDDED_SNAPSHOT_BEGIN = '<!-- AIFINDER_SANITIZED_SNAPSHOT_EVIDENCE_BYTES_BEGIN -->\n';
const EMBEDDED_SNAPSHOT_END = '<!-- AIFINDER_SANITIZED_SNAPSHOT_EVIDENCE_BYTES_END -->';

function artifactMap(bundle) {
  return new Map(bundle.artifact_names.map((name) => [name, bundle.readArtifact(name)]));
}

function codes(result) {
  return [...new Set(result.diagnostics.map((record) => record.code))];
}

function rawIdentity(bytes) {
  return { algorithm: 'SHA-256', ...bufferIdentity(bytes) };
}

function extractSingleEmbeddedBuffer(bytes, beginText, endText) {
  const begin = Buffer.from(beginText);
  const end = Buffer.from(endText);
  const beginAt = bytes.indexOf(begin);
  assert(beginAt >= 0, `missing embedded authority marker ${beginText.trim()}`);
  const contentAt = beginAt + begin.length;
  const endAt = bytes.indexOf(end, contentAt);
  assert(endAt >= 0, `missing embedded authority marker ${endText}`);
  assert.equal(bytes.indexOf(begin, contentAt), -1, `duplicate embedded authority marker ${beginText.trim()}`);
  assert.equal(bytes.indexOf(end, endAt + end.length), -1, `duplicate embedded authority marker ${endText}`);
  return bytes.subarray(contentAt, endAt);
}

function refreshSelfDescribingIntegrity(map, names) {
  const manifest = parseStrictJson(map.get(names[7]));
  for (const entry of manifest.leaf_artifacts) entry.identity = rawIdentity(map.get(entry.name));
  map.set(names[7], canonicalJsonBuffer(manifest));
  map.set(names[8], Buffer.from(names.slice(0, 8).sort(compareUtf8).map((name) => `${bufferIdentity(map.get(name)).sha256}  ${name}\n`).join('')));
}

function replaceAuthorityCommitment(map, names, spec, currentDigest, replacementDigest) {
  const currentCodex = map.get(names[2]);
  const currentGemini = map.get(names[1]);
  const currentToken = currentGemini.toString('utf8').match(/APPROVE_AIFINDER_[A-Z0-9-]+_[0-9a-f]{64}/u)?.[0];
  assert(currentToken);
  const replacementCodex = Buffer.from(currentCodex.toString('utf8').replace(currentDigest, replacementDigest));
  assert.notEqual(bufferIdentity(replacementCodex).sha256, bufferIdentity(currentCodex).sha256);
  const codexIdentity = rawIdentity(replacementCodex);
  const approvalBasisDigest = semanticDigest('approval-basis', canonicalJsonBuffer({
    compiler_format_version: 1,
    phase_id: spec.phase_id,
    authority_class: spec.authority_class,
    repository_baseline: spec.repository.baseline,
    scope: spec.scope,
    authority_ir_digest: replacementDigest,
    codex_package_raw_identity: codexIdentity,
  }));
  const replacementToken = `APPROVE_AIFINDER_${spec.phase_id}_${approvalBasisDigest}`;
  const replacementGemini = Buffer.from(currentGemini.toString('utf8')
    .replace(currentToken, replacementToken)
    .replace(currentDigest, replacementDigest));
  map.set(names[2], replacementCodex);
  map.set(names[1], replacementGemini);
  const manifest = parseStrictJson(map.get(names[7]));
  manifest.codex_embedding_identity = codexIdentity;
  manifest.approval.token_sha256_commitment = createHash('sha256').update(Buffer.from(replacementToken, 'utf8')).digest('hex');
  map.set(names[7], canonicalJsonBuffer(manifest));
  refreshSelfDescribingIntegrity(map, names);
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
}

function mutateForFixture(bundle, fixture) {
  const map = artifactMap(bundle);
  const names = bundle.artifact_names;
  if (fixture.id === 'N05') {
    const bytes = map.get(names[2]);
    map.set(names[2], Buffer.from(bytes.toString('utf8').replace(/_END\n$/u, '_END')));
  } else if (fixture.id === 'N16') {
    const token = map.get(names[1]).toString('utf8').match(/APPROVE_AIFINDER_[A-Z0-9-]+_[0-9a-f]{64}/u)[0];
    map.set(names[3], Buffer.concat([map.get(names[3]), Buffer.from(`${token}\n`)]));
  } else if (fixture.id === 'N17') {
    const gemini = map.get(names[1]);
    const sentinel = Buffer.from('<!-- AIFINDER_CODEX_PACKAGE_BYTES_END -->');
    const endAt = gemini.indexOf(sentinel);
    assert(endAt > 0);
    map.set(names[1], Buffer.concat([gemini.subarray(0, endAt - 1), gemini.subarray(endAt)]));
  } else if (fixture.id === 'N22') {
    map.set(fixture.rendererMutation.artifact_name, map.get(names[2]));
    map.delete(names[2]);
  } else if (fixture.id === 'N23') {
    const snapshot = parseStrictJson(map.get(names[5]));
    snapshot.paths[0].content_utf8 = '# forbidden source text\n';
    map.set(names[5], canonicalJsonBuffer(snapshot));
  }
  return map;
}

async function main() {
  const referenceSpec = parseStrictJson(await readFile(new URL('./fixtures/reference-phase-spec.json', import.meta.url)));
  const referenceSnapshot = parseStrictJson(await readFile(new URL('./fixtures/reference-repository-snapshot.json', import.meta.url)));
  const zipAuthorizedSpec = structuredClone(referenceSpec);
  zipAuthorizedSpec.artifact_policy.allow_zip = true;
  const first = compilePhaseBundle({ authoredSpec: zipAuthorizedSpec, snapshot: referenceSnapshot });
  const second = compilePhaseBundle({ authoredSpec: structuredClone(zipAuthorizedSpec), snapshot: structuredClone(referenceSnapshot) });
  assert.deepEqual(first.artifact_names, artifactNamesForPhase('P01'));
  assert.deepEqual(first.artifact_names, second.artifact_names);
  assert.equal(first.canonical_identity, second.canonical_identity);
  assert.equal(first.artifact_names.length, 9);
  for (const name of first.artifact_names) {
    assert(name.startsWith('AiFinder-Phase-P01-'));
    assert(first.readArtifact(name).equals(second.readArtifact(name)), name);
  }
  const mutableCopy = first.readArtifact(first.artifact_names[0]);
  mutableCopy[0] ^= 0xff;
  assert(first.readArtifact(first.artifact_names[0]).equals(second.readArtifact(first.artifact_names[0])));
  assert.equal(validateArtifactBuffers({ phaseId: 'P01', artifacts: first }).valid, true);

  const callerFactSnapshot = structuredClone(referenceSnapshot);
  callerFactSnapshot.derived_dependency_facts = [{
    command_id: 'CALLER_SUPPLIED',
    reference: 'caller/supplied.txt',
    classification: 'DECLARED_AND_MATCHED',
  }];
  const { snapshot_digest: omittedDigest, final_marker: omittedMarker, ...callerFactBody } = callerFactSnapshot;
  void omittedDigest;
  void omittedMarker;
  callerFactSnapshot.snapshot_digest = repositorySnapshotDigest(callerFactBody);
  await expectDiagnostic('REPOSITORY_SNAPSHOT_STALE', () => compilePhaseBundle({ authoredSpec: zipAuthorizedSpec, snapshot: callerFactSnapshot }));
  const emittedSnapshot = parseStrictJson(first.readArtifact(first.artifact_names[5]));
  assert.deepEqual(emittedSnapshot.derived_dependency_facts, []);
  assert.equal(JSON.stringify(emittedSnapshot).includes('CALLER_SUPPLIED'), false);
  const p03 = positiveFixtures(referenceSpec, referenceSnapshot).find((fixture) => fixture.id === 'P03');
  const p03Closure = validateCommandDependencies({ spec: p03.spec, snapshot: p03.snapshot });
  assert(p03Closure.derived_dependency_facts.length > 0);
  const p03Bundle = compilePhaseBundle({ authoredSpec: p03.spec, snapshot: p03.snapshot });
  const p03Evidence = parseStrictJson(p03Bundle.readArtifact(p03Bundle.artifact_names[5]));
  assert.deepEqual(p03Evidence.derived_dependency_facts, p03Closure.derived_dependency_facts);

  const p02 = positiveFixtures(referenceSpec, referenceSnapshot).find((fixture) => fixture.id === 'P02');
  const p02Bundle = compilePhaseBundle({ authoredSpec: p02.spec, snapshot: p02.snapshot });
  const p02SpecDocument = parseStrictJson(p02Bundle.readArtifact(p02Bundle.artifact_names[4]));
  const p02SnapshotEvidence = parseStrictJson(p02Bundle.readArtifact(p02Bundle.artifact_names[5]));
  const p02Codex = p02Bundle.readArtifact(p02Bundle.artifact_names[2]);
  const p02Gemini = p02Bundle.readArtifact(p02Bundle.artifact_names[1]);
  const embeddedSpecBytes = extractSingleEmbeddedBuffer(p02Codex, EMBEDDED_SPEC_BEGIN, EMBEDDED_SPEC_END);
  const embeddedSnapshotBytes = extractSingleEmbeddedBuffer(p02Codex, EMBEDDED_SNAPSHOT_BEGIN, EMBEDDED_SNAPSHOT_END);
  assert.deepEqual(embeddedSpecBytes, canonicalJsonBuffer(p02SpecDocument.phase_spec));
  assert.deepEqual(embeddedSnapshotBytes, p02Bundle.readArtifact(p02Bundle.artifact_names[5]));
  const reconstructedEmbeddedSpec = parseStrictJson(embeddedSpecBytes);
  const reconstructedEmbeddedSnapshot = parseStrictJson(embeddedSnapshotBytes);
  for (const authorityField of [
    'commands',
    'scope',
    'operation_budgets',
    'target_confirmation',
    'rollbacks',
    'git',
    'state_model',
    'governance',
    'compatibility_adapters',
    'conditional_scopes',
    'external_resources',
    'repository',
  ]) assert.deepEqual(reconstructedEmbeddedSpec[authorityField], p02SpecDocument.phase_spec[authorityField], authorityField);
  assert.deepEqual(reconstructedEmbeddedSnapshot, p02SnapshotEvidence);
  assert.match(p02Codex.toString('utf8'), /No sibling artifact is required to reconstruct or review the declared authority\./u);
  const geminiCodex = extractSingleEmbeddedBuffer(
    p02Gemini,
    '<!-- AIFINDER_CODEX_PACKAGE_BYTES_BEGIN -->\n',
    '<!-- AIFINDER_CODEX_PACKAGE_BYTES_END -->',
  );
  assert.deepEqual(geminiCodex, p02Codex);
  assert.equal(Object.hasOwn(p02SpecDocument.phase_spec, 'executable_profile'), false);
  const currentAuthorityIr = reconstructAuthorityIr(p02SpecDocument.phase_spec, p02SnapshotEvidence);
  assert.deepEqual(currentAuthorityIr.executable_profile, {
    identity: EXECUTABLE_PROFILE_IDENTITY,
    version: EXECUTABLE_PROFILE_VERSION,
  });
  const currentAuthorityDigest = semanticDigest('authority-ir', canonicalJsonBuffer(currentAuthorityIr));
  assert.equal(
    p02Bundle.readArtifact(p02Bundle.artifact_names[2]).toString('utf8').match(/Authority IR commitment: ([0-9a-f]{64})\n/u)?.[1],
    currentAuthorityDigest,
  );
  const profileOmittedAuthorityIr = structuredClone(currentAuthorityIr);
  delete profileOmittedAuthorityIr.executable_profile;
  const profileOmittedDigest = semanticDigest('authority-ir', canonicalJsonBuffer(profileOmittedAuthorityIr));
  assert.notEqual(profileOmittedDigest, currentAuthorityDigest);
  const retainedOldProfileArtifacts = artifactMap(p02Bundle);
  replaceAuthorityCommitment(retainedOldProfileArtifacts, p02Bundle.artifact_names, p02SpecDocument.phase_spec, currentAuthorityDigest, profileOmittedDigest);
  const retainedOldProfileResult = validateArtifactBuffers({ phaseId: 'P02', artifacts: retainedOldProfileArtifacts });
  assert.equal(retainedOldProfileResult.valid, false, 'profile-omitted Authority IR retained authority');
  assert(codes(retainedOldProfileResult).includes('OUTPUT_CHECKSUM_MISMATCH'), JSON.stringify(retainedOldProfileResult));

  const siblingDependentArtifacts = artifactMap(p02Bundle);
  const replacementCodex = Buffer.concat([
    p02Codex.subarray(0, p02Codex.indexOf(embeddedSpecBytes)),
    Buffer.from('{}\n'),
    p02Codex.subarray(p02Codex.indexOf(embeddedSpecBytes) + embeddedSpecBytes.length),
  ]);
  const geminiCodexAt = p02Gemini.indexOf(p02Codex);
  assert(geminiCodexAt >= 0);
  siblingDependentArtifacts.set(p02Bundle.artifact_names[2], replacementCodex);
  siblingDependentArtifacts.set(p02Bundle.artifact_names[1], Buffer.concat([
    p02Gemini.subarray(0, geminiCodexAt),
    replacementCodex,
    p02Gemini.subarray(geminiCodexAt + p02Codex.length),
  ]));
  const siblingDependentManifest = parseStrictJson(siblingDependentArtifacts.get(p02Bundle.artifact_names[7]));
  siblingDependentManifest.codex_embedding_identity = rawIdentity(replacementCodex);
  siblingDependentArtifacts.set(p02Bundle.artifact_names[7], canonicalJsonBuffer(siblingDependentManifest));
  refreshSelfDescribingIntegrity(siblingDependentArtifacts, p02Bundle.artifact_names);
  const siblingDependentResult = validateArtifactBuffers({ phaseId: 'P02', artifacts: siblingDependentArtifacts });
  assert.equal(siblingDependentResult.valid, false, 'Codex package retained authority after embedded normalized spec removal');
  assert(codes(siblingDependentResult).includes('OUTPUT_NONDETERMINISTIC'), JSON.stringify(siblingDependentResult));

  const zeroCharges = { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 };
  const conditionalSpec = structuredClone(referenceSpec);
  conditionalSpec.operation_budgets.network = 6;
  conditionalSpec.operation_budgets.database = 5;
  conditionalSpec.conditional_scopes = [
    {
      id: 'STATIC_REPAIR_A',
      predicate: 'PATH_IDENTITY_MATCH',
      predicate_input_path: 'README.md',
      predicate_expected: referenceSnapshot.paths.find((record) => record.path === 'README.md').sha256,
      true_paths: [],
      false_paths: [],
      true_operation_charges: { ...zeroCharges, network: 2 },
      false_operation_charges: { ...zeroCharges, network: 1, database: 3 },
      true_rollback_ids: [],
      false_rollback_ids: [],
    },
    {
      id: 'STATIC_REPAIR_B',
      predicate: 'PATH_IDENTITY_MATCH',
      predicate_input_path: 'README.md',
      predicate_expected: referenceSnapshot.paths.find((record) => record.path === 'README.md').sha256,
      true_paths: [],
      false_paths: [],
      true_operation_charges: { ...zeroCharges, network: 1, database: 2 },
      false_operation_charges: { ...zeroCharges, network: 4, database: 1 },
      true_rollback_ids: [],
      false_rollback_ids: [],
    },
  ];
  const conditionalBundle = compilePhaseBundle({ authoredSpec: conditionalSpec, snapshot: referenceSnapshot });
  const conditionalSpecDocument = parseStrictJson(conditionalBundle.readArtifact(conditionalBundle.artifact_names[4]));
  const conditionalSnapshotEvidence = parseStrictJson(conditionalBundle.readArtifact(conditionalBundle.artifact_names[5]));
  const conditionalOperationValidation = validateOperationContract({ spec: conditionalSpecDocument.phase_spec, snapshot: referenceSnapshot });
  assert.equal(conditionalOperationValidation.valid, true, JSON.stringify(conditionalOperationValidation.diagnostics));
  const conditionalAuthorityIr = reconstructAuthorityIr(conditionalSpecDocument.phase_spec, conditionalSnapshotEvidence);
  const expectedConditionalAggregate = { compiled_commands: 0, database: 5, deployments: 0, git_commits: 0, git_pushes: 0, network: 6 };
  assert.deepEqual(conditionalAuthorityIr.independently_recomputed.operation_aggregate, expectedConditionalAggregate);
  assert.deepEqual(conditionalAuthorityIr.independently_recomputed.operation_aggregate, conditionalOperationValidation.aggregate);
  assert(Object.values(conditionalAuthorityIr.independently_recomputed.operation_aggregate).every(Number.isSafeInteger));
  const conditionalAuthorityDigest = semanticDigest('authority-ir', canonicalJsonBuffer(conditionalAuthorityIr));
  const retainedOldAggregateIr = structuredClone(conditionalAuthorityIr);
  retainedOldAggregateIr.independently_recomputed.operation_aggregate.network = 0;
  const retainedOldAggregateDigest = semanticDigest('authority-ir', canonicalJsonBuffer(retainedOldAggregateIr));
  const retainedOldAggregateArtifacts = artifactMap(conditionalBundle);
  replaceAuthorityCommitment(retainedOldAggregateArtifacts, conditionalBundle.artifact_names, conditionalSpecDocument.phase_spec, conditionalAuthorityDigest, retainedOldAggregateDigest);
  const retainedOldAggregateResult = validateArtifactBuffers({ phaseId: 'P01', artifacts: retainedOldAggregateArtifacts });
  assert.equal(retainedOldAggregateResult.valid, false, 'command-only Authority IR aggregate retained authority');
  assert(codes(retainedOldAggregateResult).includes('OUTPUT_CHECKSUM_MISMATCH'), JSON.stringify(retainedOldAggregateResult));
  const authorityMutations = [
    { id: 'commands', mutate(phaseSpec) { phaseSpec.commands[0].expected.stdout = 'ALTERED_AUTHORITY\n'; } },
    { id: 'budgets', mutate(phaseSpec) { phaseSpec.operation_budgets.network += 1; } },
    { id: 'rollback', mutate(phaseSpec) { phaseSpec.rollbacks[0].terminal_state = 'POST_RUNTIME_ALTERED_TERMINAL'; } },
    { id: 'target', mutate(phaseSpec) { phaseSpec.target_confirmation.one_use = false; } },
    { id: 'git', mutate(phaseSpec) { phaseSpec.git.commit_subject = 'Altered authority subject'; } },
  ];
  for (const mutation of authorityMutations) {
    const authorityTamper = artifactMap(p02Bundle);
    const tamperedSpecDocument = parseStrictJson(authorityTamper.get(p02Bundle.artifact_names[4]));
    mutation.mutate(tamperedSpecDocument.phase_spec);
    authorityTamper.set(p02Bundle.artifact_names[4], canonicalJsonBuffer(tamperedSpecDocument));
    refreshSelfDescribingIntegrity(authorityTamper, p02Bundle.artifact_names);
    const authorityTamperResult = validateArtifactBuffers({ phaseId: 'P02', artifacts: authorityTamper });
    assert.equal(authorityTamperResult.valid, false, `retained Codex/Gemini/token authorized altered ${mutation.id}`);
    assert(codes(authorityTamperResult).includes('OUTPUT_CHECKSUM_MISMATCH'), `${mutation.id}: ${JSON.stringify(authorityTamperResult)}`);
  }

  for (const invalidInput of [null, undefined, {}, [], { phaseId: null, artifacts: null }]) {
    let result;
    assert.doesNotThrow(() => { result = validateArtifactBuffers(invalidInput); });
    assert.equal(result.valid, false);
    assert(result.diagnostics.length > 0);
  }
  const malformedArtifactCases = [
    { index: 4, bytes: Buffer.from('null\n') },
    { index: 4, bytes: Buffer.from('[]\n') },
    { index: 5, bytes: Buffer.from('null\n') },
    { index: 5, bytes: Buffer.from('{}\n') },
    { index: 7, bytes: Buffer.from('null\n') },
    { index: 7, mutate(manifest) { manifest.leaf_artifacts[0] = null; } },
    { index: 7, mutate(manifest) { manifest.leaf_artifacts[0].identity = []; } },
    { index: 8, bytes: Buffer.from('{}\n') },
  ];
  for (const malformed of malformedArtifactCases) {
    const map = artifactMap(first);
    if (malformed.mutate !== undefined) {
      const manifest = parseStrictJson(map.get(first.artifact_names[7]));
      malformed.mutate(manifest);
      map.set(first.artifact_names[7], canonicalJsonBuffer(manifest));
    } else map.set(first.artifact_names[malformed.index], malformed.bytes);
    let result;
    assert.doesNotThrow(() => { result = validateArtifactBuffers({ phaseId: 'P01', artifacts: map }); });
    assert.equal(result.valid, false);
    assert(result.diagnostics.length > 0);
  }

  const nondeterministicArtifacts = artifactMap(first);
  const readmeName = first.artifact_names[0];
  nondeterministicArtifacts.set(readmeName, Buffer.from(nondeterministicArtifacts.get(readmeName).toString('utf8').replace('compiled bundle\n', 'compiled output\n')));
  assert(codes(validateArtifactBuffers({ phaseId: 'P01', artifacts: nondeterministicArtifacts })).includes('OUTPUT_NONDETERMINISTIC'));

  const tempRoot = await mkdtemp('/private/tmp/aifinder-phase-34ba-determinism-');
  try {
    const firstDestination = join(tempRoot, 'first');
    const secondDestination = join(tempRoot, 'second');
    const firstWrite = await writeCompiledBundle({ compiled: first, destination: firstDestination, repositoryRoot: resolve(directory, '..', '..') });
    const secondWrite = await writeCompiledBundle({ compiled: second, destination: secondDestination, repositoryRoot: resolve(directory, '..', '..'), includeZip: true });
    assert.equal(firstWrite.canonical_identity, secondWrite.canonical_identity);
    assert.equal(secondWrite.zip.canonical_identity, firstWrite.canonical_identity);
    for (const name of first.artifact_names) assert((await readFile(join(firstDestination, name))).equals(await readFile(join(secondDestination, name))), name);
    const zipForbidden = compilePhaseBundle({ authoredSpec: referenceSpec, snapshot: referenceSnapshot });
    await expectDiagnostic('ZIP_NOT_AUTHORIZED', () => writeCompiledBundle({ compiled: zipForbidden, destination: join(tempRoot, 'zip-forbidden'), repositoryRoot: resolve(directory, '..', '..'), includeZip: true }));
  } finally {
    await chmod(tempRoot, 0o700).catch(() => {});
    await rm(tempRoot, { recursive: true, force: true });
  }
  assert.equal(await lstat(tempRoot).catch(() => null), null);

  for (const id of ['N05', 'N16', 'N17', 'N22', 'N23']) {
    const fixture = negativeFixture(id, referenceSpec, referenceSnapshot);
    const result = validateArtifactBuffers({ phaseId: 'P01', artifacts: mutateForFixture(first, fixture) });
    assert.equal(result.valid, false, `${id} unexpectedly valid`);
    for (const expected of FAILURE_CATALOG[id].expected_codes) assert(codes(result).includes(expected), `${id} missing ${expected}: ${JSON.stringify(result)}`);
  }
  for (const mutate of [
    (snapshot) => { snapshot.repository_id = '/Users/synthetic/private-repository'; },
    (snapshot) => { snapshot.paths[0].path = '../private-source.txt'; },
  ]) {
    const map = artifactMap(first);
    const snapshot = parseStrictJson(map.get(first.artifact_names[5]));
    mutate(snapshot);
    map.set(first.artifact_names[5], canonicalJsonBuffer(snapshot));
    const result = validateArtifactBuffers({ phaseId: 'P01', artifacts: map });
    assert(codes(result).includes('SNAPSHOT_SOURCE_CONTENT_EMISSION'), JSON.stringify(result));
  }
  process.stdout.write('PASS_PHASE_COMPILER_DETERMINISM gates=6-7 canonical_files=9 phase_prefixed=true byte_identical=true separate_tmp_dirs=true atomic_sibling_temp_publish=true zip_canonical_identity_unchanged=true zip_policy=bound authority_ir=recomputed-from-canonical-evidence executable_profile=derived-identity-version-bound retained_old_profile=rejected conditional_operation_aggregate=global-max-branch-bound retained_old_aggregate=rejected authority_tamper=commands,budgets,rollback,target,git-rejected artifact_validation=total-fail-closed snapshot_paths=confined-and-authorized dependency_facts=derived-only token_occurrences=gemini:1,others:0 embedding=exact sanitized_snapshot=true output_nondeterminism=detected negatives=N05,N16,N17,N22,N23 temp_cleanup=true compiled_commands_executed=0\n');
}

try {
  await main();
} catch (error) {
  process.stdout.write(`FAIL_PHASE_COMPILER_DETERMINISM failures=1 code=${String(error?.diagnostic?.code ?? error?.code ?? error?.name ?? 'ERROR')}\n`);
  process.exitCode = 1;
}
