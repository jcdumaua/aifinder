import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { chmod, lstat, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bufferIdentity, canonicalJsonBuffer, compareUtf8, parseStrictJson, repositorySnapshotDigest, semanticDigest } from './canonical.mjs';
import {
  artifactNamesForPhase,
  compilePhaseBundle,
  reconstructAuthorityIr,
  validateArtifactBuffers,
} from './deterministic-renderer.mjs';
import { verifyCompiledDirectory, verifyInspectionContractArtifacts } from './compiled-bundle-verifier.mjs';
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

function replaceSingleBuffer(source, needle, replacement, label) {
  const offset = source.indexOf(needle);
  assert(offset >= 0, `missing ${label}`);
  assert.equal(source.indexOf(needle, offset + needle.length), -1, `duplicate ${label}`);
  return Buffer.concat([
    source.subarray(0, offset),
    replacement,
    source.subarray(offset + needle.length),
  ]);
}

async function materializeArtifactMap(map, names, destination) {
  await mkdir(destination, { mode: 0o700 });
  for (const name of names) await writeFile(join(destination, name), map.get(name), { mode: 0o600 });
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

function mutateInspectionRenderedContent(bundle, variant) {
  const map = artifactMap(bundle);
  const names = bundle.artifact_names;
  const codex = map.get(names[2]).toString('utf8');
  let tampered;
  if (variant === 'altered-question') {
    tampered = codex.replace(
      'Q01 [FACTUAL]: What repository identity and baseline are in scope?',
      'Q01 [FACTUAL]: What altered repository identity and baseline are in scope?',
    );
  } else if (variant === 'omitted-section') {
    tampered = codex.replace('S06 Next phase recommendation: Q10\n', '');
  } else if (variant === 'reordered-boundaries') {
    tampered = codex.replace(
      '- NO_IMPLEMENTATION_AUTHORITY\n- NO_RUNTIME_VALIDATION\n',
      '- NO_RUNTIME_VALIDATION\n- NO_IMPLEMENTATION_AUTHORITY\n',
    );
  } else {
    throw new TypeError('unknown inspection mutation');
  }
  assert.notEqual(tampered, codex, variant);
  const tamperedCodex = Buffer.from(tampered);
  map.set(names[2], tamperedCodex);
  const manifest = parseStrictJson(map.get(names[7]));
  manifest.codex_embedding_identity = rawIdentity(tamperedCodex);
  map.set(names[7], canonicalJsonBuffer(manifest));
  refreshSelfDescribingIntegrity(map, names);
  return map;
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

  const positives = positiveFixtures(referenceSpec, referenceSnapshot);
  for (const fixture of positives.filter((candidate) => candidate.id !== 'P04')) {
    const bundle = fixture.id === 'P01' ? first : compilePhaseBundle({ authoredSpec: fixture.spec, snapshot: fixture.snapshot });
    const document = parseStrictJson(bundle.readArtifact(bundle.artifact_names[4]));
    assert.equal(Object.hasOwn(document.phase_spec, 'inspection_contract'), false);
    assert.equal(bundle.readArtifact(bundle.artifact_names[2]).includes(Buffer.from('## Bounded inspection contract\n')), false);
  }
  const p04 = positives.find((fixture) => fixture.id === 'P04');
  const p04Bundle = compilePhaseBundle({ authoredSpec: p04.spec, snapshot: p04.snapshot });
  assert.equal(p04Bundle.artifact_names.length, 9);
  assert.equal(verifyInspectionContractArtifacts({ phaseId: 'P04', artifacts: p04Bundle }).valid, true);
  const p04Document = parseStrictJson(p04Bundle.readArtifact(p04Bundle.artifact_names[4]));
  assert.deepEqual(p04Document.phase_spec.inspection_contract, p04.spec.inspection_contract);
  const p04Codex = p04Bundle.readArtifact(p04Bundle.artifact_names[2]).toString('utf8');
  const p04Readme = p04Bundle.readArtifact(p04Bundle.artifact_names[0]).toString('utf8');
  const p04Ccr = p04Bundle.readArtifact(p04Bundle.artifact_names[6]).toString('utf8');
  assert(p04Codex.includes('## Bounded inspection contract\n'));
  assert(p04Codex.includes('### Questions\nQ01 [FACTUAL]: What repository identity and baseline are in scope?\n'));
  assert(p04Codex.includes('### Required CCR output sections\nS01 Repository and scope facts: Q01, Q02, Q11\n'));
  assert(p04Codex.includes('### Claim boundaries\n- NO_IMPLEMENTATION_AUTHORITY\n- NO_RUNTIME_VALIDATION\n'));
  assert(p04Readme.includes('Bounded inspection title: Bounded static inspection for the next AiFinder compiler phase\n'));
  assert(p04Readme.includes('Inspection coverage: questions=15 output_sections=6 claim_boundaries=8\n'));
  assert(p04Ccr.includes('## Required inspection output sections\n'));
  assert(p04Ccr.includes('## Inspection question coverage ledger\n'));
  for (const question of p04.spec.inspection_contract.questions) {
    assert.equal((p04Codex.match(new RegExp(`^${question.id} \\[${question.answer_kind}\\]:`, 'gmu')) ?? []).length, 1);
    assert(p04Ccr.includes(`${question.id} [${question.answer_kind}]: <answer>\n`));
  }
  const p04Token = p04Bundle.readArtifact(p04Bundle.artifact_names[1]).toString('utf8').match(/APPROVE_AIFINDER_P04_[0-9a-f]{64}/u)?.[0];
  assert(p04Token);
  const illegalInspectionAuthorityArtifacts = artifactMap(p04Bundle);
  const illegalInspectionSpecDocument = parseStrictJson(illegalInspectionAuthorityArtifacts.get(p04Bundle.artifact_names[4]));
  const priorInspectionSpecBytes = canonicalJsonBuffer(illegalInspectionSpecDocument.phase_spec);
  illegalInspectionSpecDocument.phase_spec.operation_budgets.network = 1;
  const illegalInspectionSpecBytes = canonicalJsonBuffer(illegalInspectionSpecDocument.phase_spec);
  const inspectionSnapshotEvidence = parseStrictJson(illegalInspectionAuthorityArtifacts.get(p04Bundle.artifact_names[5]));
  const priorInspectionIrDigest = p04Codex.match(/Authority IR commitment: ([0-9a-f]{64})\n/u)?.[1];
  assert(priorInspectionIrDigest);
  const illegalInspectionIrDigest = semanticDigest(
    'authority-ir',
    canonicalJsonBuffer(reconstructAuthorityIr(illegalInspectionSpecDocument.phase_spec, inspectionSnapshotEvidence)),
  );
  const inspectionCodexWithIllegalSpec = replaceSingleBuffer(
    p04Bundle.readArtifact(p04Bundle.artifact_names[2]),
    priorInspectionSpecBytes,
    illegalInspectionSpecBytes,
    'embedded P04 phase specification',
  );
  const illegalInspectionCodex = Buffer.from(
    inspectionCodexWithIllegalSpec.toString('utf8').replace(priorInspectionIrDigest, illegalInspectionIrDigest),
  );
  const illegalInspectionCodexIdentity = rawIdentity(illegalInspectionCodex);
  const illegalInspectionApprovalBasis = semanticDigest('approval-basis', canonicalJsonBuffer({
    compiler_format_version: 1,
    phase_id: illegalInspectionSpecDocument.phase_spec.phase_id,
    authority_class: illegalInspectionSpecDocument.phase_spec.authority_class,
    repository_baseline: illegalInspectionSpecDocument.phase_spec.repository.baseline,
    scope: illegalInspectionSpecDocument.phase_spec.scope,
    authority_ir_digest: illegalInspectionIrDigest,
    codex_package_raw_identity: illegalInspectionCodexIdentity,
  }));
  const illegalInspectionToken = `APPROVE_AIFINDER_P04_${illegalInspectionApprovalBasis}`;
  const inspectionGeminiWithIllegalCodex = replaceSingleBuffer(
    p04Bundle.readArtifact(p04Bundle.artifact_names[1]),
    p04Bundle.readArtifact(p04Bundle.artifact_names[2]),
    illegalInspectionCodex,
    'embedded P04 Codex package',
  );
  const illegalInspectionGemini = replaceSingleBuffer(
    inspectionGeminiWithIllegalCodex,
    Buffer.from(p04Token),
    Buffer.from(illegalInspectionToken),
    'P04 approval token',
  );
  illegalInspectionAuthorityArtifacts.set(p04Bundle.artifact_names[1], illegalInspectionGemini);
  illegalInspectionAuthorityArtifacts.set(p04Bundle.artifact_names[2], illegalInspectionCodex);
  illegalInspectionAuthorityArtifacts.set(p04Bundle.artifact_names[4], canonicalJsonBuffer(illegalInspectionSpecDocument));
  const illegalInspectionManifest = parseStrictJson(illegalInspectionAuthorityArtifacts.get(p04Bundle.artifact_names[7]));
  illegalInspectionManifest.codex_embedding_identity = illegalInspectionCodexIdentity;
  illegalInspectionManifest.approval.token_sha256_commitment = createHash('sha256').update(Buffer.from(illegalInspectionToken)).digest('hex');
  illegalInspectionAuthorityArtifacts.set(p04Bundle.artifact_names[7], canonicalJsonBuffer(illegalInspectionManifest));
  refreshSelfDescribingIntegrity(illegalInspectionAuthorityArtifacts, p04Bundle.artifact_names);
  assert.equal(validateArtifactBuffers({ phaseId: 'P04', artifacts: illegalInspectionAuthorityArtifacts }).valid, true);
  await expectDiagnostic('INSPECTION_AUTHORITY_MISMATCH', () => verifyInspectionContractArtifacts({
    phaseId: 'P04',
    artifacts: illegalInspectionAuthorityArtifacts,
  }));

  for (const malformedInspectionInput of [null, undefined, {}, [], { phaseId: 'P04', artifacts: null }]) {
    await expectDiagnostic('OUTPUT_HASH_MISMATCH', () => verifyInspectionContractArtifacts(malformedInspectionInput));
  }
  const alteredReadmeSummary = artifactMap(p04Bundle);
  alteredReadmeSummary.set(
    p04Bundle.artifact_names[0],
    Buffer.from(p04Readme.replace('Inspection coverage: questions=15', 'Inspection coverage: questions=14')),
  );
  refreshSelfDescribingIntegrity(alteredReadmeSummary, p04Bundle.artifact_names);
  await expectDiagnostic('OUTPUT_HASH_MISMATCH', () => verifyInspectionContractArtifacts({ phaseId: 'P04', artifacts: alteredReadmeSummary }));
  const suffixedReadmeSummary = artifactMap(p04Bundle);
  suffixedReadmeSummary.set(
    p04Bundle.artifact_names[0],
    Buffer.from(p04Readme.replace('claim_boundaries=8\n', 'claim_boundaries=8 forged\n')),
  );
  refreshSelfDescribingIntegrity(suffixedReadmeSummary, p04Bundle.artifact_names);
  await expectDiagnostic('OUTPUT_HASH_MISMATCH', () => verifyInspectionContractArtifacts({ phaseId: 'P04', artifacts: suffixedReadmeSummary }));

  const suffixedCcrStatus = artifactMap(p04Bundle);
  suffixedCcrStatus.set(
    p04Bundle.artifact_names[6],
    Buffer.from(p04Ccr.replace('Coverage status: EXACT\n', 'Coverage status: EXACT forged\n')),
  );
  refreshSelfDescribingIntegrity(suffixedCcrStatus, p04Bundle.artifact_names);
  await expectDiagnostic('OUTPUT_HASH_MISMATCH', () => verifyInspectionContractArtifacts({ phaseId: 'P04', artifacts: suffixedCcrStatus }));

  const undeclaredInspectionCcr = artifactMap(first);
  const p01Ccr = undeclaredInspectionCcr.get(first.artifact_names[6]).toString('utf8');
  undeclaredInspectionCcr.set(
    first.artifact_names[6],
    Buffer.from(p01Ccr.replace('# CCR REPORT\n', '# CCR REPORT\n\n## Required inspection output sections\n')),
  );
  refreshSelfDescribingIntegrity(undeclaredInspectionCcr, first.artifact_names);
  await expectDiagnostic('OUTPUT_HASH_MISMATCH', () => verifyInspectionContractArtifacts({ phaseId: 'P01', artifacts: undeclaredInspectionCcr }));

  for (const mutate of [
    (contract) => { contract.questions[0].text = 'What exact repository identity and baseline are in scope?'; },
    (contract) => { [contract.questions[0], contract.questions[1]] = [contract.questions[1], contract.questions[0]]; },
    (contract) => { [contract.output_sections[0], contract.output_sections[1]] = [contract.output_sections[1], contract.output_sections[0]]; },
    (contract) => { contract.claim_boundaries.push(contract.claim_boundaries.shift()); },
  ]) {
    const altered = structuredClone(p04);
    mutate(altered.spec.inspection_contract);
    const alteredBundle = compilePhaseBundle({ authoredSpec: altered.spec, snapshot: altered.snapshot });
    const alteredToken = alteredBundle.readArtifact(alteredBundle.artifact_names[1]).toString('utf8').match(/APPROVE_AIFINDER_P04_[0-9a-f]{64}/u)?.[0];
    assert.notEqual(alteredBundle.canonical_identity, p04Bundle.canonical_identity);
    assert.notEqual(alteredToken, p04Token);
  }

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

  const n28 = negativeFixture('N28', referenceSpec, referenceSnapshot);
  const n28TamperedArtifacts = n28.rendererMutation.variants.map((variant) => ({
    variant,
    artifacts: mutateInspectionRenderedContent(p04Bundle, variant),
  }));
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
    const illegalInspectionDestination = join(tempRoot, 'illegal-inspection-authority');
    await materializeArtifactMap(illegalInspectionAuthorityArtifacts, p04Bundle.artifact_names, illegalInspectionDestination);
    await expectDiagnostic('INSPECTION_AUTHORITY_MISMATCH', () => verifyCompiledDirectory(illegalInspectionDestination, { expectedPhaseId: 'P04' }));
    for (const { variant, artifacts } of n28TamperedArtifacts) {
      const validation = validateArtifactBuffers({ phaseId: 'P04', artifacts });
      const destination = join(tempRoot, `n28-${variant}`);
      await materializeArtifactMap(artifacts, p04Bundle.artifact_names, destination);
      await expectDiagnostic(validation.diagnostics[0].code, () => verifyCompiledDirectory(destination, { expectedPhaseId: 'P04' }));
    }
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
  for (const { variant, artifacts: tampered } of n28TamperedArtifacts) {
    const result = validateArtifactBuffers({ phaseId: 'P04', artifacts: tampered });
    assert.equal(result.valid, false, `${variant} unexpectedly valid`);
    assert(['OUTPUT_EMBEDDING_MISMATCH', 'OUTPUT_HASH_MISMATCH'].includes(result.diagnostics[0].code), `${variant}: ${JSON.stringify(result)}`);
    await expectDiagnostic('OUTPUT_HASH_MISMATCH', () => verifyInspectionContractArtifacts({ phaseId: 'P04', artifacts: tampered }));
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
  process.stdout.write('PASS_PHASE_COMPILER_DETERMINISM gates=6-7 canonical_files=9 phase_prefixed=true byte_identical=true separate_tmp_dirs=true atomic_sibling_temp_publish=true zip_canonical_identity_unchanged=true zip_policy=bound authority_ir=recomputed-from-canonical-evidence executable_profile=derived-identity-version-bound retained_old_profile=rejected conditional_operation_aggregate=global-max-branch-bound retained_old_aggregate=rejected authority_tamper=commands,budgets,rollback,target,git,inspection-contract-rejected inspection_contract=P04-fixed-order-token-checksum-bound inspection_verifier=shape,authority,boundaries,readme,ccr,line-anchored-suffix,directory-tamper-fail-closed artifact_validation=total-fail-closed snapshot_paths=confined-and-authorized dependency_facts=derived-only token_occurrences=gemini:1,others:0 embedding=exact sanitized_snapshot=true output_nondeterminism=detected negatives=N05,N16,N17,N22,N23,N28 temp_cleanup=true compiled_commands_executed=0\n');
}

try {
  await main();
} catch (error) {
  process.stdout.write(`FAIL_PHASE_COMPILER_DETERMINISM failures=1 code=${String(error?.diagnostic?.code ?? error?.code ?? error?.name ?? 'ERROR')}\n`);
  process.exitCode = 1;
}
