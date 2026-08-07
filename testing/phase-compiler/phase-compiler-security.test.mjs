import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { constants } from 'node:fs';
import {
  access,
  chmod,
  lstat,
  link,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  symlink,
  truncate,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { bufferIdentity, canonicalJsonBuffer, parseStrictJson, repositorySnapshotDigest } from './canonical.mjs';
import { runCli } from './cli.mjs';
import { verifyCompiledDirectory, verifyZipTransport } from './compiled-bundle-verifier.mjs';
import { compilePhaseBundle } from './deterministic-renderer.mjs';
import { validateCommandDependencies } from './command-dependency-validator.mjs';
import { DiagnosticError, explainError } from './error-catalog.mjs';
import { deterministicStoreZip, writeCompiledBundle } from './external-bundle-writer.mjs';

const directory = fileURLToPath(new URL('.', import.meta.url));
const repositoryRoot = resolve(directory, '..', '..');
const execFile = promisify(execFileCallback);

async function expectDiagnostic(code, operation) {
  let caught;
  try {
    await operation();
  } catch (error) {
    caught = error;
  }
  assert(caught instanceof DiagnosticError, `expected DiagnosticError ${code}`);
  assert.equal(caught.diagnostic.code, code);
  assert.equal(JSON.stringify(caught.diagnostic).includes(repositoryRoot), false);
}

function capture() {
  let value = '';
  return {
    stream: { write(chunk) { value += String(chunk); } },
    read() { return value; },
  };
}

function refreshSnapshotDigest(snapshot) {
  const { snapshot_digest: omittedDigest, final_marker: omittedMarker, ...body } = snapshot;
  void omittedDigest;
  void omittedMarker;
  snapshot.snapshot_digest = repositorySnapshotDigest(body);
}

async function directoryInventory(root, prefix = '') {
  const inventory = [];
  const entries = await readdir(root, { withFileTypes: true });
  entries.sort((left, right) => Buffer.compare(Buffer.from(left.name), Buffer.from(right.name)));
  for (const entry of entries) {
    const relativePath = prefix === '' ? entry.name : `${prefix}/${entry.name}`;
    const absolutePath = join(root, entry.name);
    const stat = await lstat(absolutePath);
    const record = {
      path: relativePath,
      dev: String(stat.dev),
      ino: String(stat.ino),
      mode: stat.mode & 0o777,
      nlink: stat.nlink,
      type: stat.isDirectory() ? 'directory' : stat.isFile() ? 'file' : stat.isSymbolicLink() ? 'symlink' : 'other',
    };
    if (stat.isFile()) record.identity = bufferIdentity(await readFile(absolutePath));
    inventory.push(record);
    if (stat.isDirectory()) inventory.push(...await directoryInventory(absolutePath, relativePath));
  }
  return inventory;
}

async function materializeCompiledBundle(compiled, destination) {
  await mkdir(destination, { mode: 0o700 });
  for (const name of compiled.artifact_names) {
    await writeFile(join(destination, name), compiled.readArtifact(name), { mode: 0o600 });
  }
}

async function main() {
  for (const code of [
    'AUTHORITY_ID_DUPLICATE',
    'AUTHORITY_REFERENCE_DANGLING',
    'COMPILER_CAPABILITY_UNAVAILABLE',
    'COMPILER_INTERNAL_ERROR',
  ]) {
    const entry = explainError(code);
    assert.equal(entry.code, code);
    assert.equal(entry.severity, 'ERROR');
    assert.equal(entry.invariant_reference, `AIFINDER_PHASE_COMPILER_V1:${code}`);
  }
  const [specBytes, snapshotBytes] = await Promise.all([
    readFile(new URL('./fixtures/reference-phase-spec.json', import.meta.url)),
    readFile(new URL('./fixtures/reference-repository-snapshot.json', import.meta.url)),
  ]);
  const spec = parseStrictJson(specBytes);
  const snapshot = parseStrictJson(snapshotBytes);
  const compiled = compilePhaseBundle({ authoredSpec: spec, snapshot });
  const alternateSpec = structuredClone(spec);
  alternateSpec.workstream = 'SYNTHETIC_ALTERNATE_SELF_CONSISTENT_BUNDLE';
  const alternateCompiled = compilePhaseBundle({ authoredSpec: alternateSpec, snapshot });
  assert.notEqual(alternateCompiled.canonical_identity, compiled.canonical_identity);
  const zipSpec = structuredClone(spec);
  zipSpec.artifact_policy.allow_zip = true;
  const zipCompiled = compilePhaseBundle({ authoredSpec: zipSpec, snapshot });
  const alternateZipSpec = structuredClone(alternateSpec);
  alternateZipSpec.artifact_policy.allow_zip = true;
  const alternateZipCompiled = compilePhaseBundle({ authoredSpec: alternateZipSpec, snapshot });
  const tempRoot = await mkdtemp('/private/tmp/aifinder-phase-34ba-security-');
  let compiledCommandsExecuted = 0;
  try {
    const destination = join(tempRoot, 'compiled');
    const written = await writeCompiledBundle({ compiled, destination, repositoryRoot });
    assert.equal(written.valid, true);
    assert.equal(written.zip, null);
    assert.equal(written.canonical_identity, compiled.canonical_identity);
    const verified = await verifyCompiledDirectory(destination, { expectedPhaseId: 'P01' });
    assert.equal(verified.canonical_identity, compiled.canonical_identity);
    assert.equal((await lstat(destination)).mode & 0o777, 0o700);
    assert.equal((await readdir(destination)).length, 9);
    assert.equal((await readdir(tempRoot)).some((name) => name.startsWith('compiled.phase-compiler-tmp-')), false);
    for (const name of compiled.artifact_names) {
      const stat = await lstat(join(destination, name));
      assert.equal(stat.isFile(), true);
      assert.equal(stat.isSymbolicLink(), false);
      assert.equal(stat.nlink, 1);
      assert.equal(stat.mode & 0o777, 0o600);
      assert.equal((await readFile(join(destination, name))).includes(Buffer.from(repositoryRoot)), false);
    }

    const alternateDirectory = join(tempRoot, 'alternate-self-consistent');
    const displacedDirectory = join(tempRoot, 'compiled-original-displaced');
    const parkedAlternateDirectory = join(tempRoot, 'compiled-alternate-parked');
    await materializeCompiledBundle(alternateCompiled, alternateDirectory);
    const directoryAbaStages = [];
    await expectDiagnostic('PATH_SYMLINK_FORBIDDEN', () => verifyCompiledDirectory(destination, {
      expectedPhaseId: 'P01',
      afterBoundReadStage: async ({ stage }) => {
        directoryAbaStages.push(stage);
        if (stage === 'directory-bound') {
          await rename(destination, displacedDirectory);
          await rename(alternateDirectory, destination);
        } else if (stage === 'artifacts-read') {
          await rename(destination, parkedAlternateDirectory);
          await rename(displacedDirectory, destination);
        }
      },
    }));
    assert.deepEqual(directoryAbaStages, ['directory-bound', 'artifacts-read']);
    assert.equal((await verifyCompiledDirectory(destination)).canonical_identity, compiled.canonical_identity);
    assert.equal((await verifyCompiledDirectory(parkedAlternateDirectory)).canonical_identity, alternateCompiled.canonical_identity);

    for (const stage of ['parent-bound', 'temporary-created', 'before-publish', 'before-zip']) {
      const parent = join(tempRoot, `parent-swap-${stage}`);
      const movedParent = `${parent}.moved`;
      const replacementMarker = Buffer.from(`replacement-${stage}\n`);
      const stageCompiled = stage === 'before-zip' ? zipCompiled : compiled;
      let swapped = false;
      let movedParentInventoryAtSwap;
      await mkdir(parent, { mode: 0o700 });
      await expectDiagnostic('PATH_SYMLINK_FORBIDDEN', () => writeCompiledBundle({
        compiled: stageCompiled,
        destination: join(parent, 'compiled'),
        repositoryRoot,
        includeZip: stage === 'before-zip',
        afterBoundParentStage: async ({ stage: currentStage }) => {
          if (currentStage !== stage || swapped) return;
          await rename(parent, movedParent);
          movedParentInventoryAtSwap = await directoryInventory(movedParent);
          await mkdir(parent, { mode: 0o700 });
          await writeFile(join(parent, 'replacement-owner.txt'), replacementMarker, { mode: 0o600 });
          swapped = true;
        },
      }));
      assert.equal(swapped, true, `parent replacement hook was not reached for ${stage}`);
      assert.deepEqual(await readdir(parent), ['replacement-owner.txt']);
      assert.deepEqual(await readFile(join(parent, 'replacement-owner.txt')), replacementMarker);
      assert.equal(await lstat(join(parent, 'compiled')).catch(() => null), null);
      assert.equal(await lstat(join(parent, stageCompiled.zip_name)).catch(() => null), null);
      assert.deepEqual(
        await directoryInventory(movedParent),
        movedParentInventoryAtSwap,
        `original bound parent changed after replacement at ${stage}`,
      );
    }

    const existing = join(tempRoot, 'existing-output');
    const existingBytes = Buffer.from('competitor-owned\n');
    await writeFile(existing, existingBytes, { mode: 0o600 });
    const existingBefore = await lstat(existing);
    await expectDiagnostic('OUTPUT_PATH_COLLISION', () => writeCompiledBundle({ compiled, destination: existing, repositoryRoot }));
    const existingAfter = await lstat(existing);
    assert.equal(existingAfter.dev, existingBefore.dev);
    assert.equal(existingAfter.ino, existingBefore.ino);
    assert.deepEqual(await readFile(existing), existingBytes);

    const raceDestination = join(tempRoot, 'race-output');
    const competitor = Buffer.from('race-competitor\n');
    let raceBefore;
    await expectDiagnostic('OUTPUT_PATH_COLLISION', () => writeCompiledBundle({
      compiled,
      destination: raceDestination,
      repositoryRoot,
      afterFinalAbsenceCheck: async () => {
        await mkdir(raceDestination, { mode: 0o700 });
        await writeFile(join(raceDestination, 'competitor.txt'), competitor, { mode: 0o600 });
        raceBefore = await lstat(raceDestination);
      },
    }));
    const raceAfter = await lstat(raceDestination);
    assert.equal(raceAfter.isDirectory(), true);
    assert.equal(raceAfter.dev, raceBefore.dev);
    assert.equal(raceAfter.ino, raceBefore.ino);
    assert.deepEqual(await readFile(join(raceDestination, 'competitor.txt')), competitor);
    const retainedRaceTemps = (await readdir(tempRoot)).filter((name) => name.startsWith('race-output.phase-compiler-tmp-'));
    assert.equal(retainedRaceTemps.length, 1);
    assert.deepEqual((await readdir(join(tempRoot, retainedRaceTemps[0]))).sort(), [...compiled.artifact_names].sort());

    const replacementDestination = join(tempRoot, 'replacement-output');
    const originalCompetitor = Buffer.from('original-competitor\n');
    const replacementCompetitor = Buffer.from('replacement-competitor\n');
    await expectDiagnostic('OUTPUT_PATH_COLLISION', () => writeCompiledBundle({
      compiled,
      destination: replacementDestination,
      repositoryRoot,
      afterFinalAbsenceCheck: async () => {
        await writeFile(replacementDestination, originalCompetitor, { mode: 0o600 });
        await rename(replacementDestination, `${replacementDestination}.moved`);
        await writeFile(replacementDestination, replacementCompetitor, { mode: 0o600 });
      },
    }));
    assert.deepEqual(await readFile(`${replacementDestination}.moved`), originalCompetitor);
    assert.deepEqual(await readFile(replacementDestination), replacementCompetitor);

    const realParent = join(tempRoot, 'real-parent');
    const linkedParent = join(tempRoot, 'linked-parent');
    await mkdir(realParent, { mode: 0o700 });
    await symlink(realParent, linkedParent);
    await expectDiagnostic('PATH_SYMLINK_FORBIDDEN', () => writeCompiledBundle({ compiled, destination: join(linkedParent, 'compiled'), repositoryRoot }));
    assert.equal(await lstat(join(realParent, 'compiled')).catch(() => null), null);
    await expectDiagnostic('PATH_TRAVERSAL_FORBIDDEN', () => writeCompiledBundle({ compiled, destination: 'relative-output', repositoryRoot }));
    const insideRepository = join(directory, '.forbidden-compiled-output');
    await expectDiagnostic('SNAPSHOT_OUTPUT_INSIDE_REPOSITORY', () => writeCompiledBundle({ compiled, destination: insideRepository, repositoryRoot }));
    assert.equal(await lstat(insideRepository).catch(() => null), null);

    const firstName = compiled.artifact_names[0];
    const firstPath = join(destination, firstName);
    await chmod(firstPath, 0o644);
    await expectDiagnostic('OUTPUT_HASH_MISMATCH', () => verifyCompiledDirectory(destination));
    await chmod(firstPath, 0o600);
    const hardlinkPath = join(tempRoot, 'artifact-hardlink');
    await link(firstPath, hardlinkPath);
    await expectDiagnostic('PATH_SYMLINK_FORBIDDEN', () => verifyCompiledDirectory(destination));
    await unlink(hardlinkPath);
    const savedPath = join(tempRoot, 'saved-artifact');
    await rename(firstPath, savedPath);
    await symlink(savedPath, firstPath);
    await expectDiagnostic('PATH_SYMLINK_FORBIDDEN', () => verifyCompiledDirectory(destination));
    await unlink(firstPath);
    await rename(savedPath, firstPath);

    const codexName = compiled.artifact_names[2];
    const codexPath = join(destination, codexName);
    const codexBytes = await readFile(codexPath);
    await writeFile(codexPath, codexBytes.subarray(0, codexBytes.length - 1), { mode: 0o600 });
    await expectDiagnostic('OUTPUT_FINAL_MARKER_MISMATCH', () => verifyCompiledDirectory(destination));
    await writeFile(codexPath, codexBytes, { mode: 0o600 });
    const checksumPath = join(destination, compiled.artifact_names[8]);
    const checksumBytes = await readFile(checksumPath);
    await writeFile(checksumPath, Buffer.concat([checksumBytes, Buffer.from('0\n')]), { mode: 0o600 });
    await expectDiagnostic('OUTPUT_CHECKSUM_MISMATCH', () => verifyCompiledDirectory(destination));
    await writeFile(checksumPath, checksumBytes, { mode: 0o600 });
    const extraPath = join(destination, 'generic-output.txt');
    await writeFile(extraPath, 'extra\n', { mode: 0o600 });
    await expectDiagnostic('AMBIGUOUS_ARTIFACT_FILENAME', () => verifyCompiledDirectory(destination));
    await unlink(extraPath);
    assert.equal((await verifyCompiledDirectory(destination)).valid, true);

    const malformedOnDiskCases = [
      { id: 'phase-spec-null', index: 4, bytes: Buffer.from('null\n') },
      { id: 'phase-spec-array', index: 4, bytes: Buffer.from('[]\n') },
      { id: 'snapshot-null', index: 5, bytes: Buffer.from('null\n') },
      { id: 'snapshot-object', index: 5, bytes: Buffer.from('{}\n') },
      { id: 'manifest-null', index: 7, bytes: Buffer.from('null\n') },
      { id: 'manifest-wrong-entry', index: 7, mutate(manifest) { manifest.leaf_artifacts[0] = null; } },
      { id: 'manifest-wrong-identity', index: 7, mutate(manifest) { manifest.leaf_artifacts[0].identity = []; } },
      { id: 'checksum-object', index: 8, bytes: Buffer.from('{}\n') },
    ];
    for (const malformed of malformedOnDiskCases) {
      const name = compiled.artifact_names[malformed.index];
      const path = join(destination, name);
      const original = await readFile(path);
      let bytes = malformed.bytes;
      if (malformed.mutate !== undefined) {
        const document = parseStrictJson(original);
        malformed.mutate(document);
        bytes = canonicalJsonBuffer(document);
      }
      await writeFile(path, bytes, { mode: 0o600 });
      let caught;
      try {
        await verifyCompiledDirectory(destination);
      } catch (error) {
        caught = error;
      }
      assert(caught instanceof DiagnosticError, `${malformed.id} escaped as a raw exception`);
      const cliOut = capture(); const cliErr = capture();
      assert.equal(await runCli(['verify', destination], { stdout: cliOut.stream, stderr: cliErr.stream }), 1);
      assert.equal(cliOut.read(), `FAIL_PHASE_COMPILER code=${caught.diagnostic.code} remediation_id=${caught.diagnostic.remediation_id}\n`);
      assert.equal(cliErr.read(), '');
      await writeFile(path, original, { mode: 0o600 });
    }
    assert.equal((await verifyCompiledDirectory(destination)).valid, true);

    const forgedZipName = { ...zipCompiled, zip_name: '../forbidden.zip' };
    await expectDiagnostic('AMBIGUOUS_ARTIFACT_FILENAME', () => writeCompiledBundle({ compiled: forgedZipName, destination: join(tempRoot, 'forged-zip-name'), repositoryRoot, includeZip: true }));
    assert.equal(await lstat(join(tempRoot, 'forbidden.zip')).catch(() => null), null);
    const zipDestination = join(tempRoot, 'compiled-with-zip');
    const zipped = await writeCompiledBundle({ compiled: zipCompiled, destination: zipDestination, repositoryRoot, includeZip: true });
    assert.equal(zipped.canonical_identity, zipCompiled.canonical_identity);
    assert.equal(zipped.zip.canonical_identity, zipCompiled.canonical_identity);
    const zipVerification = await verifyZipTransport(zipped.zip.zip_path, zipDestination);
    assert.equal(zipVerification.canonical_identity, zipCompiled.canonical_identity);
    const writerZipAbaParent = join(tempRoot, 'writer-zip-aba-parent');
    const writerZipAbaDestination = join(writerZipAbaParent, 'compiled');
    const writerZipAbaOriginal = join(writerZipAbaParent, 'original');
    const writerZipAbaAlternate = join(writerZipAbaParent, 'alternate');
    await mkdir(writerZipAbaParent, { mode: 0o700 });
    await materializeCompiledBundle(alternateZipCompiled, writerZipAbaAlternate);
    let writerZipAbaSwapped = false;
    await expectDiagnostic('PATH_SYMLINK_FORBIDDEN', () => writeCompiledBundle({
      compiled: zipCompiled,
      destination: writerZipAbaDestination,
      repositoryRoot,
      includeZip: true,
      afterZipVerificationStage: async ({ stage }) => {
        if (stage !== 'zip-file-bound' || writerZipAbaSwapped) return;
        await rename(writerZipAbaDestination, writerZipAbaOriginal);
        await rename(writerZipAbaAlternate, writerZipAbaDestination);
        writerZipAbaSwapped = true;
      },
    }));
    assert.equal(writerZipAbaSwapped, true);
    assert.equal((await verifyCompiledDirectory(writerZipAbaOriginal)).canonical_identity, zipCompiled.canonical_identity);
    assert.equal((await verifyCompiledDirectory(writerZipAbaDestination)).canonical_identity, alternateZipCompiled.canonical_identity);
    const alternateZipPrepared = join(tempRoot, 'alternate-zip-prepared');
    const displacedZip = join(tempRoot, 'original-zip-displaced');
    const parkedAlternateZip = join(tempRoot, 'alternate-zip-parked');
    const alternateZipBytes = deterministicStoreZip(alternateZipCompiled);
    await writeFile(alternateZipPrepared, alternateZipBytes, { mode: 0o600 });
    const zipAbaStages = [];
    await expectDiagnostic('PATH_SYMLINK_FORBIDDEN', () => verifyZipTransport(zipped.zip.zip_path, zipDestination, {
      afterBoundReadStage: async ({ stage }) => {
        if (!stage.startsWith('zip-')) return;
        zipAbaStages.push(stage);
        if (stage === 'zip-file-bound') {
          await rename(zipped.zip.zip_path, displacedZip);
          await rename(alternateZipPrepared, zipped.zip.zip_path);
        } else if (stage === 'zip-file-read') {
          await rename(zipped.zip.zip_path, parkedAlternateZip);
          await rename(displacedZip, zipped.zip.zip_path);
        }
      },
    }));
    assert.deepEqual(zipAbaStages, ['zip-file-bound', 'zip-file-read']);
    assert.equal((await verifyZipTransport(zipped.zip.zip_path, zipDestination)).canonical_identity, zipCompiled.canonical_identity);
    assert.deepEqual(await readFile(parkedAlternateZip), alternateZipBytes);
    await expectDiagnostic('AMBIGUOUS_ARTIFACT_FILENAME', () => verifyZipTransport(join(tempRoot, 'wrong-parent', zipCompiled.zip_name), zipDestination));
    assert.equal((await lstat(zipped.zip.zip_path)).nlink, 1);
    assert.equal((await lstat(zipped.zip.zip_path)).mode & 0o777, 0o600);
    const zipBytes = await readFile(zipped.zip.zip_path);
    const centralAt = zipBytes.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    assert(centralAt > 0);
    const tamperedCentral = Buffer.from(zipBytes);
    tamperedCentral.writeUInt32LE((tamperedCentral.readUInt32LE(centralAt + 42) + 1) >>> 0, centralAt + 42);
    await writeFile(zipped.zip.zip_path, tamperedCentral, { mode: 0o600 });
    await expectDiagnostic('OUTPUT_HASH_MISMATCH', () => verifyZipTransport(zipped.zip.zip_path, zipDestination));
    await writeFile(zipped.zip.zip_path, zipBytes, { mode: 0o600 });
    await truncate(zipped.zip.zip_path, 16 * 1024 * 1024 + 1);
    await expectDiagnostic('INPUT_TOO_LARGE', () => verifyZipTransport(zipped.zip.zip_path, zipDestination));
    await writeFile(zipped.zip.zip_path, zipBytes, { mode: 0o600 });

    const validateOut = capture(); const validateErr = capture();
    assert.equal(await runCli(['validate', fileURLToPath(new URL('./fixtures/reference-phase-spec.json', import.meta.url)), fileURLToPath(new URL('./fixtures/reference-repository-snapshot.json', import.meta.url))], { stdout: validateOut.stream, stderr: validateErr.stream, repositoryRoot }), 0);
    assert.match(validateOut.read(), /^PASS_PHASE_COMPILER_VALIDATE phase=P01 compiled_commands_executed=0\n$/u);
    assert.equal(validateErr.read(), '');

    const safeSpecPath = join(tempRoot, 'safe-input-spec.json');
    const safeSnapshotPath = join(tempRoot, 'safe-input-snapshot.json');
    await writeFile(safeSpecPath, specBytes, { mode: 0o600 });
    await writeFile(safeSnapshotPath, snapshotBytes, { mode: 0o600 });
    const duplicateSpecPath = join(tempRoot, 'duplicate-spec.json');
    await writeFile(duplicateSpecPath, '{"phase_id":"P01","phase_id":"P01"}\n', { mode: 0o600 });
    const duplicateOut = capture(); const duplicateErr = capture();
    assert.equal(await runCli(['validate', duplicateSpecPath, safeSnapshotPath], { stdout: duplicateOut.stream, stderr: duplicateErr.stream }), 1);
    assert.match(duplicateOut.read(), /^FAIL_PHASE_COMPILER code=SPEC_DUPLICATE_KEY remediation_id=/u);
    assert.equal(duplicateErr.read(), '');
    const schemaSpecPath = join(tempRoot, 'schema-invalid-spec.json');
    await writeFile(schemaSpecPath, '{}\n', { mode: 0o600 });
    const schemaOut = capture(); const schemaErr = capture();
    assert.equal(await runCli(['validate', schemaSpecPath, safeSnapshotPath], { stdout: schemaOut.stream, stderr: schemaErr.stream }), 1);
    assert.match(schemaOut.read(), /^FAIL_PHASE_COMPILER code=SCHEMA_CONTRACT_VIOLATION remediation_id=/u);
    assert.equal(schemaErr.read(), '');
    const linkedSpecPath = join(tempRoot, 'linked-spec.json');
    await symlink(safeSpecPath, linkedSpecPath);
    const linkedOut = capture(); const linkedErr = capture();
    assert.equal(await runCli(['validate', linkedSpecPath, safeSnapshotPath], { stdout: linkedOut.stream, stderr: linkedErr.stream }), 1);
    assert.match(linkedOut.read(), /^FAIL_PHASE_COMPILER code=PATH_SYMLINK_FORBIDDEN remediation_id=/u);
    assert.equal(linkedErr.read(), '');
    const oversizedSpecPath = join(tempRoot, 'oversized-spec.json');
    await writeFile(oversizedSpecPath, '', { mode: 0o600 });
    await truncate(oversizedSpecPath, 1024 * 1024 + 1);
    const oversizedOut = capture(); const oversizedErr = capture();
    assert.equal(await runCli(['validate', oversizedSpecPath, safeSnapshotPath], { stdout: oversizedOut.stream, stderr: oversizedErr.stream }), 1);
    assert.match(oversizedOut.read(), /^FAIL_PHASE_COMPILER code=INPUT_TOO_LARGE remediation_id=/u);
    assert.equal(oversizedErr.read(), '');

    const canaryExecutable = '/usr/bin/git';
    await access(canaryExecutable, constants.X_OK);
    const canaryExecutableStat = await lstat(canaryExecutable);
    assert.equal(canaryExecutableStat.isFile(), true);
    assert.equal(canaryExecutableStat.isSymbolicLink(), false);
    const canarySpec = structuredClone(spec);
    canarySpec.phase_id = 'P04';
    canarySpec.workstream = 'SYNTHETIC_COMMAND_NON_EXECUTION_CANARY';
    canarySpec.scope.create_paths = ['synthetic/canary.marker'];
    canarySpec.commands = [{
      id: 'LOCAL_NON_EXECUTION_CANARY',
      sequence: 1,
      context: 'DIRECT',
      argv: [canaryExecutable, 'init', './canary.marker'],
      cwd: 'synthetic',
      reads: [],
      writes: ['synthetic/canary.marker'],
      environment_names: [],
      prerequisite_state: [],
      produced_state: ['CURRENT_CANARY_MARKER_CREATED', 'CURRENT_CANARY_MARKER_ABSENT'],
      expected: { exit: 0, stdout: '', stderr: '' },
      required_manifest_state: [],
      required_runner_state: [],
      compatibility_timepoint: 'CURRENT',
      source_references: [],
      operation_charges: { network: 0, database: 0, deployments: 0, git_commits: 0, git_pushes: 0, compiled_commands: 0 },
      rollback_id: 'ROLLBACK_CANARY_MARKER',
    }];
    canarySpec.rollbacks = [{ id: 'ROLLBACK_CANARY_MARKER', mutation_ids: ['LOCAL_NON_EXECUTION_CANARY'], cleanup_paths: ['synthetic/canary.marker'], terminal_state: 'CURRENT_CANARY_MARKER_ABSENT' }];
    const canarySnapshot = structuredClone(snapshot);
    canarySnapshot.paths = canarySnapshot.paths.filter((record) => record.path !== 'generated/p01.txt');
    canarySnapshot.paths.push({ path: 'synthetic/canary.marker', role: 'CREATE', state: 'ABSENT', mode: '', blob: '', sha256: '', bytes: 0, lf: 0, cr: 0 });
    canarySnapshot.derived_dependency_facts = validateCommandDependencies({ spec: canarySpec, snapshot: canarySnapshot }).derived_dependency_facts;
    refreshSnapshotDigest(canarySnapshot);
    const syntheticDirectory = join(tempRoot, 'synthetic');
    await mkdir(syntheticDirectory, { mode: 0o700 });
    await access(syntheticDirectory, constants.W_OK | constants.X_OK);
    const syntheticDirectoryStat = await lstat(syntheticDirectory);
    assert.equal(syntheticDirectoryStat.isDirectory(), true);
    assert.equal(syntheticDirectoryStat.isSymbolicLink(), false);
    const canarySpecPath = join(tempRoot, 'canary-spec.json');
    const canarySnapshotPath = join(tempRoot, 'canary-snapshot.json');
    const canaryOutputPath = join(tempRoot, 'canary-compiled');
    await writeFile(canarySpecPath, canonicalJsonBuffer(canarySpec), { mode: 0o600 });
    await writeFile(canarySnapshotPath, canonicalJsonBuffer(canarySnapshot), { mode: 0o600 });
    assert.equal(await lstat(join(tempRoot, 'canary.marker')).catch(() => null), null);
    assert.equal(await lstat(join(syntheticDirectory, 'canary.marker')).catch(() => null), null);
    const canaryCompile = await execFile(process.execPath, [
      fileURLToPath(new URL('./cli.mjs', import.meta.url)),
      'compile', canarySpecPath, canarySnapshotPath, '--out', canaryOutputPath,
    ], { cwd: tempRoot, encoding: 'utf8', env: { LANG: 'C', LC_ALL: 'C' }, shell: false });
    assert.match(canaryCompile.stdout, /^PASS_PHASE_COMPILER_COMPILE phase=P04 canonical_files=9 zip=false compiled_commands_executed=0\n$/u);
    assert.equal(canaryCompile.stderr, '');
    const canaryVerify = await execFile(process.execPath, [fileURLToPath(new URL('./cli.mjs', import.meta.url)), 'verify', canaryOutputPath], { cwd: tempRoot, encoding: 'utf8', env: { LANG: 'C', LC_ALL: 'C' }, shell: false });
    assert.match(canaryVerify.stdout, /^PASS_PHASE_COMPILER_VERIFY phase=P04 canonical_files=9 compiled_commands_executed=0\n$/u);
    assert.equal(canaryVerify.stderr, '');
    assert.equal(await lstat(join(tempRoot, 'canary.marker')).catch(() => null), null);
    assert.equal(await lstat(join(syntheticDirectory, 'canary.marker')).catch(() => null), null);
    const cliDestination = join(tempRoot, 'cli-compiled');
    const compileOut = capture(); const compileErr = capture();
    assert.equal(await runCli(['compile', fileURLToPath(new URL('./fixtures/reference-phase-spec.json', import.meta.url)), fileURLToPath(new URL('./fixtures/reference-repository-snapshot.json', import.meta.url)), '--out', cliDestination], { stdout: compileOut.stream, stderr: compileErr.stream, repositoryRoot }), 0);
    assert.match(compileOut.read(), /^PASS_PHASE_COMPILER_COMPILE phase=P01 canonical_files=9 zip=false compiled_commands_executed=0\n$/u);
    assert.equal(compileErr.read(), '');
    const verifyOut = capture(); const verifyErr = capture();
    assert.equal(await runCli(['verify', cliDestination], { stdout: verifyOut.stream, stderr: verifyErr.stream, repositoryRoot }), 0);
    assert.match(verifyOut.read(), /^PASS_PHASE_COMPILER_VERIFY phase=P01 canonical_files=9 compiled_commands_executed=0\n$/u);
    assert.equal(verifyErr.read(), '');
    const explainOut = capture(); const explainErr = capture();
    assert.equal(await runCli(['explain', 'TOKEN_LEAKAGE'], { stdout: explainOut.stream, stderr: explainErr.stream, repositoryRoot }), 0);
    assert.match(explainOut.read(), /^PHASE_COMPILER_ERROR code=TOKEN_LEAKAGE severity=ERROR remediation_id=REMOVE_TOKEN_LEAKAGE invariant_reference=AIFINDER_PHASE_COMPILER_V1:TOKEN_LEAKAGE explanation=/u);
    assert.equal(explainErr.read(), '');
    const unknownExplainOut = capture(); const unknownExplainErr = capture();
    assert.equal(await runCli(['explain', 'NOT_A_REAL_ERROR'], { stdout: unknownExplainOut.stream, stderr: unknownExplainErr.stream, repositoryRoot }), 1);
    assert.match(unknownExplainOut.read(), /^FAIL_PHASE_COMPILER code=ERROR_CODE_UNKNOWN remediation_id=/u);
    assert.equal(unknownExplainErr.read(), '');
    const invalidOut = capture(); const invalidErr = capture();
    assert.equal(await runCli(['compile'], { stdout: invalidOut.stream, stderr: invalidErr.stream, repositoryRoot }), 2);
    assert.equal(invalidOut.read(), '');
    assert.match(invalidErr.read(), /^usage: cli\.mjs /u);

    const cliInsideRepository = join(directory, '.forbidden-cli-output');
    let cliFailure;
    try {
      await execFile(process.execPath, [
        fileURLToPath(new URL('./cli.mjs', import.meta.url)),
        'compile',
        fileURLToPath(new URL('./fixtures/reference-phase-spec.json', import.meta.url)),
        fileURLToPath(new URL('./fixtures/reference-repository-snapshot.json', import.meta.url)),
        '--out',
        cliInsideRepository,
      ], { cwd: tempRoot, encoding: 'utf8', env: { LANG: 'C', LC_ALL: 'C' }, shell: false });
    } catch (error) {
      cliFailure = error;
    }
    assert.equal(cliFailure?.code, 1);
    assert.match(cliFailure?.stdout ?? '', /^FAIL_PHASE_COMPILER code=SNAPSHOT_OUTPUT_INSIDE_REPOSITORY remediation_id=/u);
    assert.equal(cliFailure?.stderr, '');
    assert.equal((cliFailure?.stdout ?? '').includes(repositoryRoot), false);
    assert.equal(await lstat(cliInsideRepository).catch(() => null), null);

    for (const moduleName of ['deterministic-renderer.mjs', 'external-bundle-writer.mjs', 'compiled-bundle-verifier.mjs', 'cli.mjs']) {
      const source = await readFile(new URL(`./${moduleName}`, import.meta.url), 'utf8');
      assert.equal(/process\.env|\bfetch\s*\(/u.test(source), false, moduleName);
      if (!['external-bundle-writer.mjs', 'compiled-bundle-verifier.mjs'].includes(moduleName)) assert.equal(/node:child_process/u.test(source), false, moduleName);
      else if (moduleName === 'external-bundle-writer.mjs') {
        assert.equal((source.match(/spawn\('\/usr\/bin\/python3'/gu) ?? []).length, 1);
        assert.match(source, /spawn\('\/usr\/bin\/python3', \['-I', '-S', '-c', BOUND_PARENT_PROGRAM, \.\.\.args\]/u);
        assert.match(source, /code === 72[^\n]+COMPILER_CAPABILITY_UNAVAILABLE/u);
        assert.match(source, /child\.on\('error',[^\n]+COMPILER_CAPABILITY_UNAVAILABLE/u);
        assert.match(source, /env: \{ LANG: 'C', LC_ALL: 'C', PATH: '\/usr\/bin:\/bin' \}/u);
        assert.match(source, /stdio: \['pipe', 'pipe', 'pipe', binding\.handle\.fd\]/u);
        assert.match(source, /outputBytes > 4096/u);
        assert.equal(source.includes('}, 5000);'), true);
        assert.match(source, /shell: false/u);
      } else {
        assert.equal((source.match(/spawn\('\/usr\/bin\/python3'/gu) ?? []).length, 1);
        assert.match(source, /stdio: \['ignore', 'pipe', 'pipe', binding\.handle\.fd\]/u);
        assert.match(source, /env: \{ LANG: 'C', LC_ALL: 'C', PATH: '\/usr\/bin:\/bin' \}/u);
        assert.match(source, /outputBytes > maximumOutputBytes/u);
        assert.equal(source.includes('}, 5000);'), true);
        assert.match(source, /shell: false/u);
      }
      if (moduleName === 'deterministic-renderer.mjs') assert.equal(/node:fs|process\.|Date\.|Math\.random/u.test(source), false, moduleName);
      if (moduleName === 'cli.mjs') assert.equal(/process\.cwd/u.test(source), false, moduleName);
    }
    compiledCommandsExecuted = 0;
  } finally {
    await chmod(tempRoot, 0o700).catch(() => {});
    await rm(tempRoot, { recursive: true, force: true });
  }
  assert.equal(await lstat(tempRoot).catch(() => null), null);
  assert.equal(compiledCommandsExecuted, 0);
  process.stdout.write('PASS_PHASE_COMPILER_SECURITY gate=7 external_new_only=true bound_parent_fd=nofollow-directory-identity-stable parent_replacement=before,temp,publish,zip-fail-closed-and-no-write writer_zip_window_aba=FAIL_CLOSED verifier_directory_aba=FAIL_CLOSED verifier_zip_aba=FAIL_CLOSED sibling_temp_verified=true atomic_no_replace_publish=true native_helper=fixed-isolated-bounded-dirfd-protocol dir_mode=0700 file_mode=0600 links=1 competitor_replacement_no_clobber=true retained_failed_temp=true path_symlink_hardlink_mode_tamper=PASS marker_checksum_set_tamper=PASS descriptor_bound_reads=true malformed_artifacts=in-memory,directory,cli-fail-closed zip_store_transport=PASS zip_name_path_bound=true zip_central_binding=PASS zip_size_bound=PASS cli=validate,compile,verify,explain,error-code-unknown cli_inputs=nofollow,bounded,post-identity spec_parse=duplicate-and-schema-stable command_canary=absolute-git-x-ok-exact-cwd-target-not-executed cli_repo_root=fixed sanitized_failures=true temp_cleanup=true compiled_commands_executed=0\n');
}

try {
  await main();
} catch (error) {
  process.stdout.write(`FAIL_PHASE_COMPILER_SECURITY failures=1 code=${String(error?.diagnostic?.code ?? error?.code ?? error?.name ?? 'ERROR')}\n`);
  process.exitCode = 1;
}
