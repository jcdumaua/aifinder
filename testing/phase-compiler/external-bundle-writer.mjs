import { spawn } from 'node:child_process';
import { constants } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { bufferIdentity, deepFreeze, parseStrictJson } from './canonical.mjs';
import { DiagnosticError } from './error-catalog.mjs';
import { verifyCompiledDirectory, verifyZipTransport } from './compiled-bundle-verifier.mjs';
import { validateArtifactBuffers, zipNameForPhase } from './deterministic-renderer.mjs';

const BOUND_PARENT_PROGRAM = String.raw`import ctypes
import errno
import hashlib
import json
import os
import platform
import stat
import sys

PARENT_FD = 3
NOFOLLOW = getattr(os, "O_NOFOLLOW", 0)
DIRECTORY = getattr(os, "O_DIRECTORY", 0)
NONBLOCK = getattr(os, "O_NONBLOCK", 0)

def component(value):
    if not value or value in (".", "..") or "/" in value or "\\" in value or "\x00" in value:
        raise ValueError("invalid component")
    return value

def same(left, right):
    return left.st_dev == right.st_dev and left.st_ino == right.st_ino

def checked_dir(name, expected_dev, expected_ino):
    descriptor = os.open(component(name), os.O_RDONLY | DIRECTORY | NOFOLLOW | NONBLOCK, dir_fd=PARENT_FD)
    descriptor_stat = os.fstat(descriptor)
    path_stat = os.stat(name, dir_fd=PARENT_FD, follow_symlinks=False)
    if not stat.S_ISDIR(descriptor_stat.st_mode) or not stat.S_ISDIR(path_stat.st_mode) or not same(descriptor_stat, path_stat) or descriptor_stat.st_dev != int(expected_dev) or descriptor_stat.st_ino != int(expected_ino) or stat.S_IMODE(descriptor_stat.st_mode) != 0o700:
        os.close(descriptor)
        raise ValueError("directory identity")
    return descriptor

def stdin_bounded(limit):
    chunks = []
    total = 0
    while True:
        chunk = os.read(0, min(65536, limit + 1 - total))
        if not chunk:
            break
        chunks.append(chunk)
        total += len(chunk)
        if total > limit:
            raise ValueError("input too large")
    return b"".join(chunks)

def verify_file(directory_fd, name, expected_bytes, expected_sha):
    flags = os.O_RDONLY | NOFOLLOW | NONBLOCK
    descriptor = os.open(component(name), flags, dir_fd=directory_fd)
    try:
        before = os.fstat(descriptor)
        path_stat = os.stat(name, dir_fd=directory_fd, follow_symlinks=False)
        if not stat.S_ISREG(before.st_mode) or not stat.S_ISREG(path_stat.st_mode) or not same(before, path_stat) or before.st_nlink != 1 or stat.S_IMODE(before.st_mode) != 0o600 or before.st_size != expected_bytes:
            raise ValueError("file identity")
        digest = hashlib.sha256()
        total = 0
        while True:
            chunk = os.read(descriptor, min(65536, expected_bytes + 1 - total))
            if not chunk:
                break
            digest.update(chunk)
            total += len(chunk)
            if total > expected_bytes:
                raise ValueError("file grew")
        after = os.fstat(descriptor)
        after_path = os.stat(name, dir_fd=directory_fd, follow_symlinks=False)
        if total != expected_bytes or digest.hexdigest() != expected_sha or not same(before, after) or not same(after, after_path) or after.st_size != expected_bytes:
            raise ValueError("file content or identity")
    finally:
        os.close(descriptor)

try:
    action = sys.argv[1]
    if action == "absent":
        name = component(sys.argv[2])
        try:
            os.stat(name, dir_fd=PARENT_FD, follow_symlinks=False)
        except FileNotFoundError:
            sys.exit(0)
        sys.exit(17)
    elif action == "mkdir-temp":
        prefix = component(sys.argv[2]) + ".phase-compiler-tmp-"
        created = None
        for _ in range(128):
            candidate = prefix + os.urandom(12).hex()
            try:
                os.mkdir(candidate, 0o700, dir_fd=PARENT_FD)
                created = candidate
                break
            except FileExistsError:
                pass
        if created is None:
            raise ValueError("temporary collision")
        descriptor = os.open(created, os.O_RDONLY | DIRECTORY | NOFOLLOW | NONBLOCK, dir_fd=PARENT_FD)
        descriptor_stat = os.fstat(descriptor)
        path_stat = os.stat(created, dir_fd=PARENT_FD, follow_symlinks=False)
        if not stat.S_ISDIR(descriptor_stat.st_mode) or not same(descriptor_stat, path_stat) or stat.S_IMODE(descriptor_stat.st_mode) != 0o700:
            raise ValueError("temporary identity")
        os.fsync(descriptor)
        os.close(descriptor)
        os.fsync(PARENT_FD)
        sys.stdout.write(json.dumps({"name": created, "dev": str(descriptor_stat.st_dev), "ino": str(descriptor_stat.st_ino)}, separators=(",", ":")))
    elif action == "write-file":
        directory_fd = checked_dir(sys.argv[2], sys.argv[3], sys.argv[4])
        try:
            name = component(sys.argv[5])
            expected_bytes = int(sys.argv[6])
            expected_sha = sys.argv[7]
            data = stdin_bounded(expected_bytes)
            if len(data) != expected_bytes or hashlib.sha256(data).hexdigest() != expected_sha:
                raise ValueError("input identity")
            descriptor = os.open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | NOFOLLOW | NONBLOCK, 0o600, dir_fd=directory_fd)
            try:
                offset = 0
                while offset < len(data):
                    offset += os.write(descriptor, data[offset:])
                os.fsync(descriptor)
            finally:
                os.close(descriptor)
            verify_file(directory_fd, name, expected_bytes, expected_sha)
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    elif action == "verify-dir":
        directory_fd = checked_dir(sys.argv[2], sys.argv[3], sys.argv[4])
        try:
            document = json.loads(stdin_bounded(1048576).decode("utf-8"))
            expected_names = [component(item["name"]) for item in document["artifacts"]]
            if sorted(os.listdir(directory_fd)) != sorted(expected_names):
                raise ValueError("artifact inventory")
            for item in document["artifacts"]:
                verify_file(directory_fd, item["name"], int(item["bytes"]), item["sha256"])
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    elif action == "rename-noreplace":
        source = component(sys.argv[2])
        destination = component(sys.argv[3])
        source_fd = checked_dir(source, sys.argv[4], sys.argv[5])
        os.close(source_fd)
        libc = ctypes.CDLL(None, use_errno=True)
        system = platform.system()
        if system == "Darwin" and hasattr(libc, "renameatx_np"):
            result = libc.renameatx_np(PARENT_FD, source.encode(), PARENT_FD, destination.encode(), 4)
        elif system == "Linux" and hasattr(libc, "renameat2"):
            result = libc.renameat2(PARENT_FD, source.encode(), PARENT_FD, destination.encode(), 1)
        else:
            sys.exit(72)
        if result != 0:
            if ctypes.get_errno() == errno.EEXIST:
                sys.exit(17)
            sys.exit(71)
        destination_stat = os.stat(destination, dir_fd=PARENT_FD, follow_symlinks=False)
        if not stat.S_ISDIR(destination_stat.st_mode) or destination_stat.st_dev != int(sys.argv[4]) or destination_stat.st_ino != int(sys.argv[5]) or stat.S_IMODE(destination_stat.st_mode) != 0o700:
            raise ValueError("published identity")
        os.fsync(PARENT_FD)
    elif action == "write-zip":
        name = component(sys.argv[2])
        expected_bytes = int(sys.argv[3])
        expected_sha = sys.argv[4]
        data = stdin_bounded(expected_bytes)
        if len(data) != expected_bytes or hashlib.sha256(data).hexdigest() != expected_sha:
            raise ValueError("ZIP input identity")
        descriptor = os.open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | NOFOLLOW | NONBLOCK, 0o600, dir_fd=PARENT_FD)
        try:
            offset = 0
            while offset < len(data):
                offset += os.write(descriptor, data[offset:])
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
        verify_file(PARENT_FD, name, expected_bytes, expected_sha)
        os.fsync(PARENT_FD)
    elif action == "verify-parent-file":
        name = component(sys.argv[2])
        expected_bytes = int(sys.argv[3])
        expected_sha = sys.argv[4]
        verify_file(PARENT_FD, name, expected_bytes, expected_sha)
    else:
        sys.exit(72)
except SystemExit:
    raise
except FileExistsError:
    sys.exit(17)
except OSError as error:
    if error.errno == errno.EEXIST:
        sys.exit(17)
    sys.exit(71)
except Exception:
    sys.exit(71)
`;

function fail(code, reason) {
  throw new DiagnosticError(code, { sanitized_evidence: { reason } });
}

function containsPath(parent, candidate) {
  const relation = relative(parent, candidate);
  return relation === '' || (!relation.startsWith(`..${sep}`) && relation !== '..' && !isAbsolute(relation));
}

function sameObject(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

async function bindExternalDestination(destination, repositoryRoot) {
  if (!isAbsolute(destination) || resolve(destination) !== destination || basename(destination) === '' || basename(destination) === '.' || basename(destination) === '..') fail('PATH_TRAVERSAL_FORBIDDEN', 'destination must be a normalized absolute path');
  if (!isAbsolute(repositoryRoot)) fail('PATH_INVALID', 'repository root must be absolute');
  const parent = dirname(destination);
  const [realParent, realRepository] = await Promise.all([realpath(parent), realpath(repositoryRoot)]);
  if (realParent !== parent) fail('PATH_SYMLINK_FORBIDDEN', 'destination parent contains a symlink');
  const resolvedDestination = resolve(realParent, basename(destination));
  if (containsPath(realRepository, resolvedDestination) || containsPath(resolve(realRepository, '.git'), resolvedDestination)) fail('SNAPSHOT_OUTPUT_INSIDE_REPOSITORY', 'compiled output must be external to repository and .git');
  let handle;
  try {
    handle = await open(parent, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const identity = await handle.stat();
    const pathIdentity = await lstat(parent);
    if (!identity.isDirectory() || !pathIdentity.isDirectory() || pathIdentity.isSymbolicLink() || !sameObject(identity, pathIdentity)) fail('PATH_SYMLINK_FORBIDDEN', 'destination parent descriptor identity');
    return { handle, identity, parent, destination_name: basename(destination) };
  } catch (error) {
    await handle?.close().catch(() => {});
    if (error instanceof DiagnosticError) throw error;
    fail('PATH_SYMLINK_FORBIDDEN', 'destination parent cannot be bound without following links');
  }
}

async function assertBoundParent(binding) {
  let pathIdentity;
  let descriptorIdentity;
  try {
    [descriptorIdentity, pathIdentity] = await Promise.all([binding.handle.stat(), lstat(binding.parent)]);
  } catch {
    fail('PATH_SYMLINK_FORBIDDEN', 'bound destination parent path disappeared');
  }
  if (!descriptorIdentity.isDirectory() || !pathIdentity.isDirectory() || pathIdentity.isSymbolicLink() || !sameObject(descriptorIdentity, binding.identity) || !sameObject(pathIdentity, binding.identity)) fail('PATH_SYMLINK_FORBIDDEN', 'bound destination parent path identity changed');
  const currentRealParent = await realpath(binding.parent).catch(() => null);
  if (currentRealParent !== binding.parent) fail('PATH_SYMLINK_FORBIDDEN', 'bound destination parent path changed');
}

async function boundParentOperation(binding, args, input = Buffer.alloc(0)) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn('/usr/bin/python3', ['-I', '-S', '-c', BOUND_PARENT_PROGRAM, ...args], {
      cwd: '/',
      env: { LANG: 'C', LC_ALL: 'C', PATH: '/usr/bin:/bin' },
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe', binding.handle.fd],
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
      finish(new DiagnosticError('PATH_SYMLINK_FORBIDDEN', { sanitized_evidence: { reason: `descriptor-relative ${args[0]} operation timed out` } }));
    }, 5000);
    for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => {
      outputBytes += chunk.length;
      if (stream === child.stdout) stdout.push(chunk);
      if (outputBytes > 4096) {
        child.kill('SIGKILL');
        finish(new DiagnosticError('PATH_SYMLINK_FORBIDDEN', { sanitized_evidence: { reason: `descriptor-relative ${args[0]} output exceeded bound` } }));
      }
    });
    child.on('error', () => finish(new DiagnosticError('COMPILER_CAPABILITY_UNAVAILABLE', { sanitized_evidence: { reason: 'fixed /usr/bin/python3 publication helper is unavailable' } })));
    child.on('close', (code) => {
      if (code === 0) finish(null, Buffer.concat(stdout));
      else if (code === 17) finish(new DiagnosticError('OUTPUT_PATH_COLLISION', { sanitized_evidence: { reason: 'descriptor-relative no-replace collision' } }));
      else if (code === 72) finish(new DiagnosticError('COMPILER_CAPABILITY_UNAVAILABLE', { sanitized_evidence: { reason: 'native Darwin/Linux no-replace publication support is unavailable' } }));
      else finish(new DiagnosticError('PATH_SYMLINK_FORBIDDEN', { sanitized_evidence: { reason: `descriptor-relative ${args[0]} operation failed closed` } }));
    });
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}

async function boundAbsent(binding, name) {
  await boundParentOperation(binding, ['absent', name]);
}

function artifactIdentityDocument(compiled) {
  return Buffer.from(JSON.stringify({ artifacts: compiled.artifact_names.map((name) => ({ name, ...bufferIdentity(compiled.readArtifact(name)) })) }), 'utf8');
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) === 0 ? 0 : 0xedb88320);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export function deterministicStoreZip(compiled) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const name of compiled.artifact_names) {
    const nameBytes = Buffer.from(name, 'utf8');
    const data = compiled.readArtifact(name);
    const crc = crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x0021, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, nameBytes, data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(0x0314, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x0021, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0x81800000, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, nameBytes);
    offset += local.length + nameBytes.length + data.length;
  }
  const centralBytes = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(compiled.artifact_names.length, 8);
  end.writeUInt16LE(compiled.artifact_names.length, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  return Buffer.concat([...localParts, centralBytes, end]);
}

async function writeZip(compiled, destination, binding, afterZipVerificationStage = undefined) {
  const zipPath = join(binding.parent, compiled.zip_name);
  await boundAbsent(binding, compiled.zip_name);
  const zipBytes = deterministicStoreZip(compiled);
  const identity = bufferIdentity(zipBytes);
  await boundParentOperation(binding, ['write-zip', compiled.zip_name, String(identity.bytes), identity.sha256], zipBytes);
  await assertBoundParent(binding);
  const verified = await verifyZipTransport(zipPath, destination, { afterBoundReadStage: afterZipVerificationStage });
  if (verified.canonical_identity !== compiled.canonical_identity || verified.zip_sha256 !== identity.sha256 || verified.zip_bytes !== identity.bytes) fail('OUTPUT_CHECKSUM_MISMATCH', 'ZIP verifier identity differs from descriptor-written intended bytes');
  await boundParentOperation(binding, ['verify-parent-file', compiled.zip_name, String(identity.bytes), identity.sha256]);
  await assertBoundParent(binding);
  return { zip_path: zipPath, zip_identity: { ...bufferIdentity(zipBytes), transport_only: true }, canonical_identity: verified.canonical_identity };
}

export async function writeCompiledBundle({ compiled, destination, repositoryRoot, includeZip = false, afterFinalAbsenceCheck = undefined, afterBoundParentStage = undefined, afterZipVerificationStage = undefined }) {
  const binding = await bindExternalDestination(destination, repositoryRoot);
  try {
    const expectedZipName = zipNameForPhase(compiled.phase_id);
    if (compiled.zip_name !== expectedZipName || basename(compiled.zip_name) !== compiled.zip_name || resolve(dirname(destination), compiled.zip_name) !== join(dirname(destination), expectedZipName)) fail('AMBIGUOUS_ARTIFACT_FILENAME', 'ZIP filename is not exactly phase-bound');
    const inMemory = validateArtifactBuffers({ phaseId: compiled.phase_id, artifacts: compiled });
    if (!inMemory.valid) fail(inMemory.diagnostics[0].code, 'in-memory compiled bundle verification');
    const phaseSpecDocument = parseStrictJson(compiled.readArtifact(compiled.artifact_names[4]));
    if (includeZip && phaseSpecDocument.phase_spec.artifact_policy.allow_zip !== true) fail('ZIP_NOT_AUTHORIZED', 'phase artifact policy forbids ZIP transport');
    await afterBoundParentStage?.({ stage: 'parent-bound', destination, parent: binding.parent });
    await assertBoundParent(binding);
    await boundAbsent(binding, binding.destination_name);
    if (includeZip) await boundAbsent(binding, compiled.zip_name);
    const temporaryDocument = parseStrictJson(await boundParentOperation(binding, ['mkdir-temp', binding.destination_name]));
    if (typeof temporaryDocument.name !== 'string' || typeof temporaryDocument.dev !== 'string' || typeof temporaryDocument.ino !== 'string') fail('PATH_SYMLINK_FORBIDDEN', 'descriptor-relative temporary identity response');
    const temporary = join(binding.parent, temporaryDocument.name);
    await afterBoundParentStage?.({ stage: 'temporary-created', destination, parent: binding.parent, temporary });
    await assertBoundParent(binding);
    for (const name of compiled.artifact_names) {
      const bytes = compiled.readArtifact(name);
      const identity = bufferIdentity(bytes);
      await boundParentOperation(binding, ['write-file', temporaryDocument.name, temporaryDocument.dev, temporaryDocument.ino, name, String(identity.bytes), identity.sha256], bytes);
    }
    await assertBoundParent(binding);
    await boundParentOperation(binding, ['verify-dir', temporaryDocument.name, temporaryDocument.dev, temporaryDocument.ino], artifactIdentityDocument(compiled));
    await assertBoundParent(binding);
    await boundAbsent(binding, binding.destination_name);
    if (afterFinalAbsenceCheck !== undefined) await afterFinalAbsenceCheck({ destination, temporary });
    await afterBoundParentStage?.({ stage: 'before-publish', destination, parent: binding.parent, temporary });
    await assertBoundParent(binding);
    await boundParentOperation(binding, ['verify-dir', temporaryDocument.name, temporaryDocument.dev, temporaryDocument.ino], artifactIdentityDocument(compiled));
    await boundParentOperation(binding, ['rename-noreplace', temporaryDocument.name, binding.destination_name, temporaryDocument.dev, temporaryDocument.ino]);
    await assertBoundParent(binding);
    await boundParentOperation(binding, ['verify-dir', binding.destination_name, temporaryDocument.dev, temporaryDocument.ino], artifactIdentityDocument(compiled));
    await assertBoundParent(binding);
    const verification = await verifyCompiledDirectory(destination, { expectedPhaseId: compiled.phase_id });
    await assertBoundParent(binding);
    if (verification.canonical_identity !== compiled.canonical_identity || verification.artifact_count !== compiled.artifact_names.length) fail('OUTPUT_CHECKSUM_MISMATCH', 'compiled verifier identity differs from descriptor-written intended bytes');
    await boundParentOperation(binding, ['verify-dir', binding.destination_name, temporaryDocument.dev, temporaryDocument.ino], artifactIdentityDocument(compiled));
    await assertBoundParent(binding);
    let zip = null;
    if (includeZip) {
      await afterBoundParentStage?.({ stage: 'before-zip', destination, parent: binding.parent });
      await assertBoundParent(binding);
      zip = await writeZip(compiled, destination, binding, afterZipVerificationStage);
      await boundParentOperation(binding, ['verify-dir', binding.destination_name, temporaryDocument.dev, temporaryDocument.ino], artifactIdentityDocument(compiled));
      await assertBoundParent(binding);
    }
    return deepFreeze({
      valid: true,
      destination,
      canonical_identity: verification.canonical_identity,
      artifact_count: verification.artifact_count,
      zip,
    });
  } catch (error) {
    // Fail closed and retain the invocation-owned partial output. Test harnesses own cleanup.
    throw error;
  } finally {
    await binding.handle.close().catch(() => {});
  }
}
