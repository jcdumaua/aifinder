import { constants } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseStrictJson } from './canonical.mjs';
import { verifyCompiledDirectory } from './compiled-bundle-verifier.mjs';
import { compilePhaseBundle } from './deterministic-renderer.mjs';
import { DiagnosticError, explainError } from './error-catalog.mjs';
import { writeCompiledBundle } from './external-bundle-writer.mjs';
import { parsePhaseSpec } from './phase-spec.mjs';
import { validatePhaseCompilation } from './semantic-validator.mjs';

const usage = 'usage: cli.mjs validate <phase-spec.json> <repository-snapshot.json> | compile <phase-spec.json> <repository-snapshot.json> --out <new-external-directory> [--zip] | verify <compiled-directory> | explain <error-code>\n';
const cliDirectory = fileURLToPath(new URL('.', import.meta.url));
const REPOSITORY_ROOT = resolve(cliDirectory, '..', '..');
const MAX_INPUT_BYTES = 1024 * 1024;

function fail(code, reason) {
  throw new DiagnosticError(code, { sanitized_evidence: { reason } });
}

function sameFileState(left, right) {
  return left.dev === right.dev && left.ino === right.ino && left.size === right.size && left.mode === right.mode && left.nlink === right.nlink && left.mtimeMs === right.mtimeMs && left.ctimeMs === right.ctimeMs;
}

async function readBoundedInput(path) {
  const absolute = resolve(path);
  let handle;
  try {
    try {
      handle = await open(absolute, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    } catch {
      fail('PATH_SYMLINK_FORBIDDEN', 'CLI input cannot be opened without following links');
    }
    const before = await handle.stat();
    if (!before.isFile() || before.nlink !== 1) fail('PATH_SYMLINK_FORBIDDEN', 'CLI input must be a regular single-link file');
    if (before.size > MAX_INPUT_BYTES) fail('INPUT_TOO_LARGE', 'CLI input exceeds its byte bound');
    const bytes = Buffer.alloc(before.size);
    let offset = 0;
    while (offset < bytes.length) {
      const result = await handle.read(bytes, offset, bytes.length - offset, offset);
      if (result.bytesRead === 0) fail('OUTPUT_CHECKSUM_MISMATCH', 'CLI input changed during bounded read');
      offset += result.bytesRead;
    }
    const probe = Buffer.alloc(1);
    const beyond = await handle.read(probe, 0, 1, bytes.length);
    const after = await handle.stat();
    const pathAfter = await lstat(absolute).catch(() => null);
    if (beyond.bytesRead !== 0 || !sameFileState(before, after) || pathAfter === null || pathAfter.isSymbolicLink() || !pathAfter.isFile() || !sameFileState(after, pathAfter)) fail('PATH_SYMLINK_FORBIDDEN', 'CLI input identity changed during bounded read');
    return bytes;
  } finally {
    await handle?.close().catch(() => {});
  }
}

async function loadInputs(specPath, snapshotPath) {
  const [specBytes, snapshotBytes] = await Promise.all([readBoundedInput(specPath), readBoundedInput(snapshotPath)]);
  return { authoredSpec: parsePhaseSpec(specBytes), snapshot: parseStrictJson(snapshotBytes) };
}

function write(stream, value) {
  stream.write(value);
}

export async function runCli(argv, { stdout = process.stdout, stderr = process.stderr } = {}) {
  try {
    const command = argv[0];
    if (command === 'validate' && argv.length === 3) {
      const inputs = await loadInputs(argv[1], argv[2]);
      const result = validatePhaseCompilation(inputs);
      if (!result.valid) throw new DiagnosticError(result.primary_code, { sanitized_evidence: { validation_failures: result.diagnostics.length } });
      write(stdout, `PASS_PHASE_COMPILER_VALIDATE phase=${result.normalized_spec.phase_id} compiled_commands_executed=0\n`);
      return 0;
    }
    if (command === 'compile' && (argv.length === 5 || argv.length === 6) && argv[3] === '--out' && (argv.length === 5 || argv[5] === '--zip')) {
      const inputs = await loadInputs(argv[1], argv[2]);
      const compiled = compilePhaseBundle(inputs);
      const result = await writeCompiledBundle({
        compiled,
        destination: resolve(argv[4]),
        repositoryRoot: REPOSITORY_ROOT,
        includeZip: argv.length === 6,
      });
      write(stdout, `PASS_PHASE_COMPILER_COMPILE phase=${compiled.phase_id} canonical_files=${result.artifact_count} zip=${result.zip === null ? 'false' : 'true'} compiled_commands_executed=0\n`);
      return 0;
    }
    if (command === 'verify' && argv.length === 2) {
      const result = await verifyCompiledDirectory(resolve(argv[1]));
      write(stdout, `PASS_PHASE_COMPILER_VERIFY phase=${result.phase_id} canonical_files=${result.artifact_count} compiled_commands_executed=0\n`);
      return 0;
    }
    if (command === 'explain' && argv.length === 2) {
      const entry = explainError(argv[1]);
      write(stdout, `PHASE_COMPILER_ERROR code=${entry.code} severity=${entry.severity} remediation_id=${entry.remediation_id} invariant_reference=${entry.invariant_reference} explanation=${entry.explanation}\n`);
      return 0;
    }
    write(stderr, usage);
    return 2;
  } catch (error) {
    const code = error instanceof DiagnosticError ? error.diagnostic.code : error instanceof TypeError && argv[0] === 'explain' ? 'ERROR_CODE_UNKNOWN' : 'COMPILER_INTERNAL_ERROR';
    let remediation = 'REPORT_COMPILER_INTERNAL_ERROR';
    try {
      remediation = explainError(code).remediation_id;
    } catch {
      // The stable fallback intentionally excludes raw error text.
    }
    write(stdout, `FAIL_PHASE_COMPILER code=${code} remediation_id=${remediation}\n`);
    return 1;
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await runCli(process.argv.slice(2));
}
