import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { lstat, open } from 'node:fs/promises';
import { basename, dirname, join, resolve } from 'node:path';
import { bufferIdentity, canonicalJsonBuffer, compareUtf8, deepFreeze, parseStrictJson, semanticDigest } from './canonical.mjs';
import { DiagnosticError } from './error-catalog.mjs';
import { artifactNamesForPhase, validateArtifactBuffers, zipNameForPhase } from './deterministic-renderer.mjs';

const MAX_ARTIFACT_BYTES = 1024 * 1024;
const MAX_ZIP_BYTES = 16 * 1024 * 1024;
const TOKEN_PATTERN = /APPROVE_AIFINDER_[A-Z0-9]+(?:-[A-Z0-9]+)*_[0-9a-f]{64}/u;
const BOUND_DIRECTORY_READ_PROGRAM = String.raw`import json
import os
import stat
import sys

DIRECTORY_FD = 3
NOFOLLOW = getattr(os, "O_NOFOLLOW", 0)
NONBLOCK = getattr(os, "O_NONBLOCK", 0)

def component(value):
    if not value or value in (".", "..") or "/" in value or "\\" in value or "\x00" in value:
        raise ValueError("invalid component")
    return value

def same(left, right):
    return left.st_dev == right.st_dev and left.st_ino == right.st_ino

def check_directory(expected_dev, expected_ino):
    current = os.fstat(DIRECTORY_FD)
    if not stat.S_ISDIR(current.st_mode) or current.st_dev != expected_dev or current.st_ino != expected_ino or stat.S_IMODE(current.st_mode) != 0o700:
        raise ValueError("directory identity")

try:
    if NOFOLLOW == 0 or os.open not in os.supports_dir_fd or os.stat not in os.supports_dir_fd or os.listdir not in os.supports_fd:
        sys.exit(72)
    action = sys.argv[1]
    expected_dev = int(sys.argv[2])
    expected_ino = int(sys.argv[3])
    check_directory(expected_dev, expected_ino)
    if action == "list":
        names = os.listdir(DIRECTORY_FD)
        for name in names:
            component(name)
        sys.stdout.write(json.dumps(names, ensure_ascii=True, separators=(",", ":")))
    elif action == "read":
        name = component(sys.argv[4])
        maximum = int(sys.argv[5])
        expected_mode = int(sys.argv[6], 8)
        descriptor = os.open(name, os.O_RDONLY | NOFOLLOW | NONBLOCK, dir_fd=DIRECTORY_FD)
        try:
            before = os.fstat(descriptor)
            path_before = os.stat(name, dir_fd=DIRECTORY_FD, follow_symlinks=False)
            if not stat.S_ISREG(before.st_mode) or not stat.S_ISREG(path_before.st_mode) or not same(before, path_before) or before.st_nlink != 1 or path_before.st_nlink != 1:
                raise ValueError("file identity")
            if stat.S_IMODE(before.st_mode) != expected_mode:
                sys.exit(73)
            if before.st_size > maximum:
                sys.exit(74)
            chunks = []
            total = 0
            while True:
                chunk = os.read(descriptor, min(65536, maximum + 1 - total))
                if not chunk:
                    break
                chunks.append(chunk)
                total += len(chunk)
                if total > maximum:
                    sys.exit(74)
            after = os.fstat(descriptor)
            path_after = os.stat(name, dir_fd=DIRECTORY_FD, follow_symlinks=False)
            stable = same(before, after) and same(after, path_after) and before.st_mode == after.st_mode and before.st_nlink == after.st_nlink and before.st_size == after.st_size and before.st_mtime_ns == after.st_mtime_ns and before.st_ctime_ns == after.st_ctime_ns
            if not stable or total != after.st_size:
                raise ValueError("file changed")
            sys.stdout.buffer.write(b"".join(chunks))
        finally:
            os.close(descriptor)
    else:
        sys.exit(72)
    check_directory(expected_dev, expected_ino)
except SystemExit:
    raise
except Exception:
    sys.exit(71)
`;

function fail(code, reason) {
  throw new DiagnosticError(code, { sanitized_evidence: { reason } });
}

function exactMode(stat, expected) {
  return (stat.mode & 0o777) === expected;
}

function sameObject(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function sameFileState(left, right) {
  return sameObject(left, right) && left.size === right.size && left.mode === right.mode && left.nlink === right.nlink && left.mtimeMs === right.mtimeMs && left.ctimeMs === right.ctimeMs;
}

async function boundDirectoryOperation(binding, args, maximumOutputBytes) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('/usr/bin/python3', ['-I', '-S', '-c', BOUND_DIRECTORY_READ_PROGRAM, ...args], {
      cwd: '/',
      env: { LANG: 'C', LC_ALL: 'C', PATH: '/usr/bin:/bin' },
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe', binding.handle.fd],
      windowsHide: true,
    });
    const stdout = [];
    let outputBytes = 0;
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error === null) resolvePromise(value);
      else rejectPromise(error);
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(new DiagnosticError('PATH_SYMLINK_FORBIDDEN', { sanitized_evidence: { reason: 'descriptor-relative verifier helper timed out' } }));
    }, 5000);
    for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => {
      outputBytes += chunk.length;
      if (stream === child.stdout) stdout.push(chunk);
      if (outputBytes > maximumOutputBytes) {
        child.kill('SIGKILL');
        finish(new DiagnosticError('INPUT_TOO_LARGE', { sanitized_evidence: { reason: 'descriptor-relative verifier output exceeded bound' } }));
      }
    });
    child.on('error', () => finish(new DiagnosticError('COMPILER_CAPABILITY_UNAVAILABLE', { sanitized_evidence: { reason: 'fixed /usr/bin/python3 verifier helper is unavailable' } })));
    child.on('close', (code) => {
      if (code === 0) finish(null, Buffer.concat(stdout));
      else if (code === 72) finish(new DiagnosticError('COMPILER_CAPABILITY_UNAVAILABLE', { sanitized_evidence: { reason: 'descriptor-relative verifier capability is unavailable' } }));
      else if (code === 73) finish(new DiagnosticError('OUTPUT_HASH_MISMATCH', { sanitized_evidence: { reason: 'descriptor-relative verifier file mode mismatch' } }));
      else if (code === 74) finish(new DiagnosticError('INPUT_TOO_LARGE', { sanitized_evidence: { reason: 'descriptor-relative verifier file exceeds bound' } }));
      else finish(new DiagnosticError('PATH_SYMLINK_FORBIDDEN', { sanitized_evidence: { reason: 'descriptor-relative verifier operation failed closed' } }));
    });
  });
}

async function assertBoundDirectory(binding) {
  const descriptor = await binding.handle.stat();
  const pathname = await lstat(binding.path).catch(() => null);
  if (!descriptor.isDirectory() || pathname === null || !pathname.isDirectory() || pathname.isSymbolicLink() || !sameFileState(descriptor, binding.identity) || !sameFileState(descriptor, pathname) || !exactMode(descriptor, 0o700)) fail('PATH_SYMLINK_FORBIDDEN', 'compiled directory identity changed during verification');
}

async function readBoundFile(path, maximumBytes, expectedMode, label, afterBoundReadStage = undefined) {
  const pathnameBefore = await lstat(path).catch(() => null);
  if (pathnameBefore === null || !pathnameBefore.isFile() || pathnameBefore.isSymbolicLink() || pathnameBefore.nlink !== 1) fail('PATH_SYMLINK_FORBIDDEN', `${label} path identity`);
  let handle;
  try {
    handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const before = await handle.stat();
    if (!sameFileState(pathnameBefore, before) || !before.isFile() || before.nlink !== 1) fail('PATH_SYMLINK_FORBIDDEN', `${label} descriptor identity`);
    if (!exactMode(before, expectedMode)) fail('OUTPUT_HASH_MISMATCH', `${label} mode`);
    if (before.size > maximumBytes) fail('INPUT_TOO_LARGE', `${label} size`);
    await afterBoundReadStage?.({ stage: 'zip-file-bound' });
    const bytes = Buffer.alloc(before.size);
    let offset = 0;
    while (offset < bytes.length) {
      const result = await handle.read(bytes, offset, bytes.length - offset, offset);
      if (result.bytesRead === 0) fail('OUTPUT_CHECKSUM_MISMATCH', `${label} was truncated during descriptor read`);
      offset += result.bytesRead;
    }
    const probe = Buffer.alloc(1);
    const beyond = await handle.read(probe, 0, 1, bytes.length);
    const after = await handle.stat();
    await afterBoundReadStage?.({ stage: 'zip-file-read' });
    const pathAfter = await lstat(path).catch(() => null);
    if (beyond.bytesRead !== 0 || !sameFileState(before, after) || pathAfter === null || !sameFileState(after, pathAfter) || !pathAfter.isFile() || pathAfter.isSymbolicLink() || pathAfter.size !== bytes.length || pathAfter.nlink !== 1 || !exactMode(pathAfter, expectedMode)) fail('PATH_SYMLINK_FORBIDDEN', `${label} identity changed during descriptor read`);
    return bytes;
  } finally {
    await handle?.close().catch(() => {});
  }
}

function inferPhaseId(entries) {
  const candidates = entries.map((name) => /^AiFinder-Phase-([A-Z0-9]+(?:-[A-Z0-9]+)*)-MANIFEST\.canonical\.json$/u.exec(name)).filter(Boolean);
  if (candidates.length !== 1) fail('AMBIGUOUS_ARTIFACT_FILENAME', 'manifest filename is absent or ambiguous');
  return candidates[0][1];
}

async function readAndVerifyCompiledDirectory(directory, { expectedPhaseId = null, afterBoundReadStage = undefined } = {}) {
  const absolute = resolve(directory);
  let directoryHandle;
  let directoryStat;
  try {
    directoryStat = await lstat(absolute);
  } catch {
    fail('PATH_INVALID', 'compiled directory is absent');
  }
  if (!directoryStat.isDirectory() || directoryStat.isSymbolicLink()) fail('PATH_SYMLINK_FORBIDDEN', 'compiled output is not a real directory');
  if (!exactMode(directoryStat, 0o700)) fail('OUTPUT_HASH_MISMATCH', 'compiled directory mode');
  try {
    try {
      directoryHandle = await open(absolute, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
    } catch {
      fail('PATH_SYMLINK_FORBIDDEN', 'compiled directory cannot be opened without following links');
    }
    const descriptorStat = await directoryHandle.stat();
    if (!descriptorStat.isDirectory() || !sameFileState(directoryStat, descriptorStat) || !exactMode(descriptorStat, 0o700)) fail('PATH_SYMLINK_FORBIDDEN', 'compiled directory descriptor identity');
    const binding = { path: absolute, handle: directoryHandle, identity: descriptorStat };
    await afterBoundReadStage?.({ stage: 'directory-bound' });
    const entriesDocument = parseStrictJson(await boundDirectoryOperation(binding, ['list', String(descriptorStat.dev), String(descriptorStat.ino)], 64 * 1024));
    if (!Array.isArray(entriesDocument) || !entriesDocument.every((name) => typeof name === 'string')) fail('AMBIGUOUS_ARTIFACT_FILENAME', 'compiled artifact inventory response');
    const entries = entriesDocument.sort(compareUtf8);
    const phaseId = inferPhaseId(entries);
    if (expectedPhaseId !== null && phaseId !== expectedPhaseId) fail('AMBIGUOUS_ARTIFACT_FILENAME', 'compiled phase identity mismatch');
    const expected = [...artifactNamesForPhase(phaseId)].sort(compareUtf8);
    if (JSON.stringify(entries) !== JSON.stringify(expected)) fail('AMBIGUOUS_ARTIFACT_FILENAME', 'compiled artifact set mismatch');
    const artifacts = new Map();
    for (const name of entries) artifacts.set(name, await boundDirectoryOperation(binding, ['read', String(descriptorStat.dev), String(descriptorStat.ino), name, String(MAX_ARTIFACT_BYTES), '600'], MAX_ARTIFACT_BYTES + 1));
    await afterBoundReadStage?.({ stage: 'artifacts-read' });
    await assertBoundDirectory(binding);
    const validation = validateArtifactBuffers({ phaseId, artifacts });
    if (!validation.valid) fail(validation.diagnostics[0].code, 'compiled artifact verification');
    const canonicalIdentity = semanticDigest('canonical-bundle', canonicalJsonBuffer(
      artifactNamesForPhase(phaseId).map((name) => ({ name, ...bufferIdentity(artifacts.get(name)) })),
    ));
    return { result: deepFreeze({ valid: true, phase_id: phaseId, canonical_identity: canonicalIdentity, artifact_count: entries.length }), artifacts };
  } finally {
    await directoryHandle?.close().catch(() => {});
  }
}

export async function verifyCompiledDirectory(directory, options = undefined) {
  return (await readAndVerifyCompiledDirectory(directory, options)).result;
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) === 0 ? 0 : 0xedb88320);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export async function verifyZipTransport(zipPath, compiledDirectory, { afterBoundReadStage = undefined } = {}) {
  const canonicalRead = await readAndVerifyCompiledDirectory(compiledDirectory, { afterBoundReadStage });
  const canonical = canonicalRead.result;
  const absoluteDirectory = resolve(compiledDirectory);
  const absoluteZip = resolve(zipPath);
  const expectedZip = join(dirname(absoluteDirectory), zipNameForPhase(canonical.phase_id));
  if (absoluteZip !== expectedZip || basename(absoluteZip) !== zipNameForPhase(canonical.phase_id)) fail('AMBIGUOUS_ARTIFACT_FILENAME', 'ZIP path and filename must be exact siblings of the compiled directory');
  const bytes = await readBoundFile(absoluteZip, MAX_ZIP_BYTES, 0o600, 'ZIP transport', afterBoundReadStage);
  const expectedNames = artifactNamesForPhase(canonical.phase_id);
  const entries = new Map();
  const localRecords = [];
  let offset = 0;
  while (offset + 4 <= bytes.length && bytes.readUInt32LE(offset) === 0x04034b50) {
    if (offset + 30 > bytes.length) fail('OUTPUT_HASH_MISMATCH', 'truncated ZIP local header');
    const versionNeeded = bytes.readUInt16LE(offset + 4);
    const flags = bytes.readUInt16LE(offset + 6);
    const method = bytes.readUInt16LE(offset + 8);
    const modifiedTime = bytes.readUInt16LE(offset + 10);
    const modifiedDate = bytes.readUInt16LE(offset + 12);
    const crc = bytes.readUInt32LE(offset + 14);
    const size = bytes.readUInt32LE(offset + 18);
    const uncompressed = bytes.readUInt32LE(offset + 22);
    const nameLength = bytes.readUInt16LE(offset + 26);
    const extraLength = bytes.readUInt16LE(offset + 28);
    const nameAt = offset + 30;
    const dataAt = nameAt + nameLength + extraLength;
    if (dataAt + size > bytes.length || versionNeeded !== 20 || flags !== 0x0800 || method !== 0 || modifiedTime !== 0 || modifiedDate !== 0x0021 || size !== uncompressed || extraLength !== 0) fail('OUTPUT_HASH_MISMATCH', 'ZIP local metadata');
    const nameBytes = bytes.subarray(nameAt, nameAt + nameLength);
    const name = nameBytes.toString('utf8');
    if (TOKEN_PATTERN.test(name) || entries.has(name)) fail('TOKEN_LEAKAGE', 'ZIP filename metadata');
    const data = bytes.subarray(dataAt, dataAt + size);
    if (crc32(data) !== crc) fail('OUTPUT_CHECKSUM_MISMATCH', 'ZIP CRC');
    entries.set(name, Buffer.from(data));
    localRecords.push({ name, flags, method, modifiedTime, modifiedDate, crc, compressedSize: size, uncompressedSize: uncompressed, localOffset: offset });
    offset = dataAt + size;
  }
  const centralStart = offset;
  let centralCount = 0;
  while (offset + 4 <= bytes.length && bytes.readUInt32LE(offset) === 0x02014b50) {
    if (offset + 46 > bytes.length) fail('OUTPUT_HASH_MISMATCH', 'truncated ZIP central header');
    const versionMade = bytes.readUInt16LE(offset + 4);
    const versionNeeded = bytes.readUInt16LE(offset + 6);
    const flags = bytes.readUInt16LE(offset + 8);
    const method = bytes.readUInt16LE(offset + 10);
    const modifiedTime = bytes.readUInt16LE(offset + 12);
    const modifiedDate = bytes.readUInt16LE(offset + 14);
    const crc = bytes.readUInt32LE(offset + 16);
    const compressedSize = bytes.readUInt32LE(offset + 20);
    const uncompressedSize = bytes.readUInt32LE(offset + 24);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const extraLength = bytes.readUInt16LE(offset + 30);
    const commentLength = bytes.readUInt16LE(offset + 32);
    const diskStart = bytes.readUInt16LE(offset + 34);
    const internalAttributes = bytes.readUInt16LE(offset + 36);
    const externalAttributes = bytes.readUInt32LE(offset + 38);
    const localOffset = bytes.readUInt32LE(offset + 42);
    const nameAt = offset + 46;
    const endAt = nameAt + nameLength + extraLength + commentLength;
    if (endAt > bytes.length || versionMade !== 0x0314 || versionNeeded !== 20 || flags !== 0x0800 || method !== 0 || modifiedTime !== 0 || modifiedDate !== 0x0021 || extraLength !== 0 || commentLength !== 0 || diskStart !== 0 || internalAttributes !== 0 || externalAttributes !== 0x81800000) fail('OUTPUT_HASH_MISMATCH', 'ZIP central metadata');
    const name = bytes.subarray(nameAt, nameAt + nameLength).toString('utf8');
    const metadata = bytes.subarray(nameAt, endAt).toString('utf8');
    if (TOKEN_PATTERN.test(metadata)) fail('TOKEN_LEAKAGE', 'ZIP central metadata');
    const local = localRecords[centralCount];
    if (local === undefined || name !== local.name || flags !== local.flags || method !== local.method || modifiedTime !== local.modifiedTime || modifiedDate !== local.modifiedDate || crc !== local.crc || compressedSize !== local.compressedSize || uncompressedSize !== local.uncompressedSize || localOffset !== local.localOffset) fail('OUTPUT_HASH_MISMATCH', 'ZIP central/local identity mismatch');
    centralCount += 1;
    offset = endAt;
  }
  if (offset + 22 !== bytes.length || bytes.readUInt32LE(offset) !== 0x06054b50) fail('OUTPUT_HASH_MISMATCH', 'ZIP end record');
  const diskEntries = bytes.readUInt16LE(offset + 8);
  const totalEntries = bytes.readUInt16LE(offset + 10);
  const centralSize = bytes.readUInt32LE(offset + 12);
  const centralOffset = bytes.readUInt32LE(offset + 16);
  const commentLength = bytes.readUInt16LE(offset + 20);
  const diskNumber = bytes.readUInt16LE(offset + 4);
  const centralDisk = bytes.readUInt16LE(offset + 6);
  if (diskNumber !== 0 || centralDisk !== 0 || diskEntries !== expectedNames.length || totalEntries !== expectedNames.length || centralCount !== expectedNames.length || localRecords.length !== expectedNames.length || centralOffset !== centralStart || centralSize !== offset - centralStart || commentLength !== 0) fail('OUTPUT_HASH_MISMATCH', 'ZIP inventory/end metadata');
  if (JSON.stringify([...entries.keys()]) !== JSON.stringify(expectedNames)) fail('AMBIGUOUS_ARTIFACT_FILENAME', 'ZIP entry order or names');
  for (const name of expectedNames) {
    const canonicalBytes = canonicalRead.artifacts.get(name);
    if (!entries.get(name).equals(canonicalBytes)) fail('OUTPUT_CHECKSUM_MISMATCH', 'ZIP payload differs from canonical directory');
  }
  return deepFreeze({ valid: true, phase_id: canonical.phase_id, canonical_identity: canonical.canonical_identity, zip_sha256: createHash('sha256').update(bytes).digest('hex'), zip_bytes: bytes.length });
}
