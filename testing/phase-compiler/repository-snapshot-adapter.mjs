import { spawn } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import {
  lstat,
  open,
  realpath,
} from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import repositorySnapshotSchema from './repository-snapshot.schema.json' with { type: 'json' };
import { validateCommandDependencies } from './command-dependency-validator.mjs';
import { bufferIdentity, canonicalJsonBuffer, compareUtf8, deepFreeze, repositorySnapshotDigest } from './canonical.mjs';
import { DiagnosticError } from './error-catalog.mjs';
import { parsePhaseSpec } from './phase-spec.mjs';
import { assertSchema, assertSupportedSchema } from './schema-validator.mjs';

const GIT_ENVIRONMENT = Object.freeze({
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_OPTIONAL_LOCKS: '0',
  LANG: 'C',
  LC_ALL: 'C',
});
const MAX_GIT_OUTPUT = 4 * 1024 * 1024;
const MAX_TRACKED_FILE_BYTES = 1024 * 1024;
const MAX_EMBEDDED_CONTENT_BYTES = 64 * 1024;
const MAX_PHASE_SPEC_BYTES = 1024 * 1024;
const MAX_SNAPSHOT_OUTPUT_BYTES = 64 * 1024 * 1024;
const SNAPSHOT_SCHEMA = assertSupportedSchema(repositorySnapshotSchema);
const BOUND_GIT_PROGRAM = String.raw`import os
import sys

REPOSITORY_FD = 3
GIT_EXECUTABLE = "/usr/bin/git"
GIT_ENVIRONMENT = {
    "GIT_CONFIG_GLOBAL": "/dev/null",
    "GIT_CONFIG_NOSYSTEM": "1",
    "GIT_OPTIONAL_LOCKS": "0",
    "LANG": "C",
    "LC_ALL": "C",
    "PATH": "/usr/bin:/bin",
}

try:
    os.fchdir(REPOSITORY_FD)
    os.set_inheritable(REPOSITORY_FD, False)
    os.close(REPOSITORY_FD)
    os.execve(GIT_EXECUTABLE, [GIT_EXECUTABLE, *sys.argv[1:]], GIT_ENVIRONMENT)
except NotImplementedError:
    sys.exit(72)
except OSError:
    sys.exit(71)
except Exception:
    sys.exit(71)
`;
const BOUND_SNAPSHOT_WRITE_PROGRAM = String.raw`import errno
import hashlib
import os
import stat
import sys

PARENT_FD = 3
NOFOLLOW = getattr(os, "O_NOFOLLOW", 0)
NONBLOCK = getattr(os, "O_NONBLOCK", 0)

def component(value):
    if not value or value in (".", "..") or "/" in value or "\\" in value or "\x00" in value:
        raise ValueError("invalid component")
    return value

def same(left, right):
    return left.st_dev == right.st_dev and left.st_ino == right.st_ino

def verify_file(name, expected_bytes, expected_sha, expected_dev=None, expected_ino=None):
    descriptor = os.open(name, os.O_RDONLY | NOFOLLOW | NONBLOCK, dir_fd=PARENT_FD)
    try:
        descriptor_stat = os.fstat(descriptor)
        path_stat = os.stat(name, dir_fd=PARENT_FD, follow_symlinks=False)
        if not stat.S_ISREG(descriptor_stat.st_mode) or not stat.S_ISREG(path_stat.st_mode) or not same(descriptor_stat, path_stat) or descriptor_stat.st_nlink != 1 or path_stat.st_nlink != 1 or stat.S_IMODE(descriptor_stat.st_mode) != 0o600 or descriptor_stat.st_size != expected_bytes:
            raise ValueError("output identity")
        if expected_dev is not None and (descriptor_stat.st_dev != expected_dev or descriptor_stat.st_ino != expected_ino):
            raise ValueError("output replacement")
        digest = hashlib.sha256()
        total = 0
        while True:
            chunk = os.read(descriptor, min(65536, expected_bytes + 1 - total))
            if not chunk:
                break
            digest.update(chunk)
            total += len(chunk)
            if total > expected_bytes:
                raise ValueError("output grew")
        after = os.fstat(descriptor)
        after_path = os.stat(name, dir_fd=PARENT_FD, follow_symlinks=False)
        if total != expected_bytes or digest.hexdigest() != expected_sha or not same(descriptor_stat, after) or not same(after, after_path):
            raise ValueError("output content")
        return descriptor_stat
    finally:
        os.close(descriptor)

try:
    if os.open not in os.supports_dir_fd or os.stat not in os.supports_dir_fd:
        sys.exit(72)
    action = sys.argv[1]
    name = component(sys.argv[2])
    expected_bytes = int(sys.argv[3])
    expected_sha = sys.argv[4]
    if action == "write":
        chunks = []
        total = 0
        while True:
            chunk = os.read(0, min(65536, expected_bytes + 1 - total))
            if not chunk:
                break
            chunks.append(chunk)
            total += len(chunk)
            if total > expected_bytes:
                raise ValueError("input too large")
        data = b"".join(chunks)
        if len(data) != expected_bytes or hashlib.sha256(data).hexdigest() != expected_sha:
            raise ValueError("input identity")
        descriptor = os.open(name, os.O_WRONLY | os.O_CREAT | os.O_EXCL | NOFOLLOW | NONBLOCK, 0o600, dir_fd=PARENT_FD)
        try:
            offset = 0
            while offset < len(data):
                offset += os.write(descriptor, data[offset:])
            os.fsync(descriptor)
        finally:
            os.close(descriptor)
        identity = verify_file(name, expected_bytes, expected_sha)
        os.fsync(PARENT_FD)
        sys.stdout.write(str(identity.st_dev) + ":" + str(identity.st_ino))
    elif action == "verify":
        verify_file(name, expected_bytes, expected_sha, int(sys.argv[5]), int(sys.argv[6]))
    else:
        sys.exit(72)
except FileExistsError:
    sys.exit(17)
except NotImplementedError:
    sys.exit(72)
except OSError as error:
    if error.errno == errno.EEXIST:
        sys.exit(17)
    sys.exit(71)
except Exception:
    sys.exit(71)
`;

function adapterError(code, pointer, evidence = {}) {
  throw new DiagnosticError(code, {
    location_json_pointer: pointer,
    sanitized_evidence: evidence,
  });
}

async function assertRepositoryBinding(binding) {
  let descriptor;
  let pathname;
  let resolved;
  try {
    [descriptor, pathname, resolved] = await Promise.all([
      binding.handle.stat({ bigint: true }),
      lstat(binding.path, { bigint: true }),
      realpath(binding.path),
    ]);
  } catch {
    adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/repo', { reason: 'repository root binding unavailable' });
  }
  const stable = descriptor.isDirectory() && pathname.isDirectory() && !pathname.isSymbolicLink() &&
    sameIdentity(descriptor, binding.identity) && sameIdentity(pathname, binding.identity) &&
    descriptor.mode === binding.identity.mode && descriptor.nlink === binding.identity.nlink &&
    descriptor.ctimeNs === binding.identity.ctimeNs && descriptor.mtimeNs === binding.identity.mtimeNs &&
    pathname.mode === descriptor.mode && pathname.nlink === descriptor.nlink &&
    pathname.ctimeNs === descriptor.ctimeNs && pathname.mtimeNs === descriptor.mtimeNs && resolved === binding.path;
  if (!stable) adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/repo', { reason: 'repository root binding changed' });
}

async function runGit(repository, argv, { binary = false, hooks } = {}) {
  await assertRepositoryBinding(repository);
  if (hooks?.beforeGitOperation !== undefined) await hooks.beforeGitOperation({ argv: [...argv] });
  await assertRepositoryBinding(repository);
  if (hooks?.beforeGitSpawn !== undefined) await hooks.beforeGitSpawn({ argv: [...argv] });
  let stdout;
  let operationError;
  try {
    stdout = await new Promise((resolvePromise, rejectPromise) => {
      const child = spawn('/usr/bin/python3', [
        '-I',
        '-S',
        '-c',
        BOUND_GIT_PROGRAM,
        '-c',
        'core.hooksPath=/dev/null',
        '-c',
        'core.fsmonitor=false',
        '-c',
        'protocol.file.allow=never',
        ...argv,
      ], {
        cwd: '/',
        env: { ...GIT_ENVIRONMENT, PATH: '/usr/bin:/bin' },
        shell: false,
        stdio: ['ignore', 'pipe', 'pipe', repository.handle.fd],
        windowsHide: true,
      });
      const stdoutChunks = []; let outputBytes = 0; let settled = false;
      const finish = (error, value = undefined) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error === null) resolvePromise(value); else rejectPromise(error);
      };
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        finish(new DiagnosticError('SNAPSHOT_GIT_COMMAND_FAILED', { sanitized_evidence: { operation: argv[0], reason: 'bounded Git command timed out' } }));
      }, 10000);
      for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => {
        outputBytes += chunk.length;
        if (outputBytes > MAX_GIT_OUTPUT) {
          child.kill('SIGKILL');
          finish(new DiagnosticError('SNAPSHOT_GIT_COMMAND_FAILED', { sanitized_evidence: { operation: argv[0], reason: 'bounded Git output exceeded limit' } }));
        }
      });
      child.stdout.on('data', (chunk) => { stdoutChunks.push(chunk); });
      child.on('error', () => finish(new DiagnosticError('COMPILER_CAPABILITY_UNAVAILABLE', { sanitized_evidence: { operation: argv[0], reason: 'fixed descriptor-bound Git helper unavailable' } })));
      child.on('close', (code) => {
        if (code === 0) finish(null, Buffer.concat(stdoutChunks));
        else if (code === 72) finish(new DiagnosticError('COMPILER_CAPABILITY_UNAVAILABLE', { sanitized_evidence: { operation: argv[0], reason: 'descriptor-bound Git capability unavailable' } }));
        else finish(new DiagnosticError('SNAPSHOT_GIT_COMMAND_FAILED', { sanitized_evidence: { operation: argv[0] } }));
      });
    });
  } catch (error) {
    operationError = error;
  }
  if (hooks?.afterGitOperation !== undefined) await hooks.afterGitOperation({
    argv: [...argv],
    stdout_identity: stdout === undefined ? null : bufferIdentity(stdout),
  });
  await assertRepositoryBinding(repository);
  if (operationError instanceof DiagnosticError) throw operationError;
  if (operationError !== undefined) adapterError('SNAPSHOT_GIT_COMMAND_FAILED', '', { operation: argv[0] });
  return binary ? stdout : stdout.toString('utf8');
}

function oneLine(value) {
  return value.endsWith('\n') ? value.slice(0, -1) : value;
}

function within(root, candidate) {
  return candidate === root || candidate.startsWith(`${root}${sep}`);
}

export function resolveSnapshotOutputPath(parent, outPath) {
  const resolvedOutput = resolve(parent, basename(outPath));
  if (resolvedOutput !== outPath) adapterError('PATH_INVALID', '/out', { reason: 'normalized absolute output path required' });
  return resolvedOutput;
}

async function resolveRepository(repoArgument) {
  if (!isAbsolute(repoArgument)) adapterError('PATH_INVALID', '/repo', { reason: 'absolute path required' });
  const supplied = await lstat(repoArgument).catch(() => null);
  if (supplied === null || !supplied.isDirectory() || supplied.isSymbolicLink()) {
    adapterError('SNAPSHOT_SYMLINK', '/repo', { reason: 'regular directory required' });
  }
  const repositoryRoot = await realpath(repoArgument);
  let handle;
  try {
    handle = await open(repositoryRoot, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_DIRECTORY | fsConstants.O_NONBLOCK);
    const identity = await handle.stat({ bigint: true });
    const binding = { path: repositoryRoot, handle, identity };
    await assertRepositoryBinding(binding);
    const gitTop = oneLine(await runGit(binding, ['rev-parse', '--show-toplevel']));
    const canonicalGitTop = await realpath(gitTop);
    await assertRepositoryBinding(binding);
    if (repositoryRoot !== canonicalGitTop) adapterError('SNAPSHOT_REPOSITORY_MISMATCH', '/repository_id', { reason: 'repository root mismatch' });
    return binding;
  } catch (error) {
    await handle?.close().catch(() => {});
    if (error instanceof DiagnosticError) throw error;
    adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/repo', { reason: 'repository root descriptor binding failed' });
  }
}

async function assertExternalNewOutput(repositoryRoot, outPath) {
  if (!isAbsolute(outPath)) adapterError('PATH_INVALID', '/out', { reason: 'absolute path required' });
  const parent = await realpath(dirname(outPath)).catch(() => null);
  if (parent === null) adapterError('PATH_INVALID', '/out', { reason: 'parent must exist' });
  const resolvedOutput = resolveSnapshotOutputPath(parent, outPath);
  if (within(repositoryRoot, resolvedOutput)) adapterError('SNAPSHOT_OUTPUT_INSIDE_REPOSITORY', '/out');
  const existing = await lstat(resolvedOutput).catch(() => null);
  if (existing !== null) adapterError('SNAPSHOT_OUTPUT_EXISTS', '/out');
  return resolvedOutput;
}

function parseStatus(buffer) {
  const counts = {
    staged: 0,
    tracked_modified: 0,
    tracked_deleted: 0,
    untracked: 0,
    conflicted: 0,
  };
  for (const record of buffer.toString('utf8').split('\u0000')) {
    if (record.length < 3) continue;
    const indexState = record[0];
    const worktreeState = record[1];
    if (indexState === '?' && worktreeState === '?') {
      counts.untracked += 1;
      continue;
    }
    if ('UADMRCT'.includes(indexState) && indexState !== ' ') counts.staged += 1;
    if (indexState === 'U' || worktreeState === 'U' || (indexState === 'A' && worktreeState === 'A')) {
      counts.conflicted += 1;
    }
    if (worktreeState === 'D') counts.tracked_deleted += 1;
    if ('MRT'.includes(worktreeState)) counts.tracked_modified += 1;
  }
  return counts;
}

function assertedMode(stat) {
  return (stat.mode & 0o111) === 0 ? '100644' : '100755';
}

function sameIdentity(left, right) {
  return left.dev === right.dev && left.ino === right.ino;
}

function stableDirectoryIdentity(left, right) {
  return sameIdentity(left, right) && left.mode === right.mode && left.nlink === right.nlink && left.mtimeMs === right.mtimeMs && left.ctimeMs === right.ctimeMs;
}

function stableBoundDirectoryIdentity(left, right) {
  return sameIdentity(left, right) && left.mode === right.mode && left.nlink === right.nlink && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs;
}

async function openTrackedAncestorBindings(repository, path) {
  await assertRepositoryBinding(repository);
  const segments = path.split('/');
  const bindings = [];
  try {
    for (let length = 1; length < segments.length; length += 1) {
      const ancestorPath = join(repository.path, ...segments.slice(0, length));
      const pathname = await lstat(ancestorPath, { bigint: true }).catch(() => null);
      if (pathname === null || !pathname.isDirectory() || pathname.isSymbolicLink()) {
        adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/paths', { path, reason: 'tracked path ancestor unavailable' });
      }
      let handle;
      try {
        handle = await open(ancestorPath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_DIRECTORY | fsConstants.O_NONBLOCK);
      } catch {
        adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/paths', { path, reason: 'tracked path ancestor open failed' });
      }
      const identity = await handle.stat({ bigint: true });
      const resolved = await realpath(ancestorPath).catch(() => null);
      if (!identity.isDirectory() || !sameIdentity(pathname, identity) || pathname.mode !== identity.mode || pathname.nlink !== identity.nlink || resolved !== ancestorPath || !within(repository.path, resolved ?? '')) {
        await handle.close().catch(() => {});
        adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/paths', { path, reason: 'unsafe tracked path ancestor descriptor' });
      }
      bindings.push({ path: ancestorPath, handle, identity });
    }
    await assertRepositoryBinding(repository);
    return bindings;
  } catch (error) {
    for (const binding of bindings.reverse()) await binding.handle.close().catch(() => {});
    throw error;
  }
}

async function assertTrackedAncestorBindings(repository, bindings, path) {
  await assertRepositoryBinding(repository);
  for (const binding of bindings) {
    let descriptor;
    let pathname;
    let resolved;
    try {
      [descriptor, pathname, resolved] = await Promise.all([
        binding.handle.stat({ bigint: true }),
        lstat(binding.path, { bigint: true }),
        realpath(binding.path),
      ]);
    } catch {
      adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/paths', { path, reason: 'tracked path ancestor binding unavailable' });
    }
    const stable = descriptor.isDirectory() && pathname.isDirectory() && !pathname.isSymbolicLink() &&
      stableBoundDirectoryIdentity(binding.identity, descriptor) && sameIdentity(descriptor, pathname) &&
      descriptor.mode === pathname.mode && descriptor.nlink === pathname.nlink &&
      descriptor.ctimeNs === pathname.ctimeNs && descriptor.mtimeNs === pathname.mtimeNs && resolved === binding.path;
    if (!stable) adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/paths', { path, reason: 'tracked path ancestor binding changed' });
  }
}

async function verifiedCreatePathAbsence(repository, path, hooks) {
  await assertRepositoryBinding(repository);
  const repositoryRoot = repository.path;
  const segments = path.split('/');
  const target = join(repositoryRoot, ...segments);
  const ancestorPaths = [repositoryRoot];
  for (let length = 1; length < segments.length; length += 1) ancestorPaths.push(join(repositoryRoot, ...segments.slice(0, length)));
  const records = []; const missingAncestors = [];
  try {
    let missingSeen = false;
    for (const ancestorPath of ancestorPaths) {
      const pathnameBefore = await lstat(ancestorPath).catch(() => null);
      if (pathnameBefore === null) {
        missingSeen = true;
        missingAncestors.push(ancestorPath);
        continue;
      }
      if (missingSeen) adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/scope/create_paths', { path, reason: 'descendant appeared below absent ancestor' });
      if (pathnameBefore.isSymbolicLink()) adapterError('SNAPSHOT_SYMLINK', '/scope/create_paths', { path, reason: 'create path ancestor is a symlink' });
      if (!pathnameBefore.isDirectory()) adapterError('PATH_INVALID', '/scope/create_paths', { path, reason: 'create path ancestor is not a directory' });
      let handle;
      try {
        handle = await open(ancestorPath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_DIRECTORY);
      } catch (error) {
        if (error?.code === 'ELOOP') adapterError('SNAPSHOT_SYMLINK', '/scope/create_paths', { path, reason: 'create path ancestor is a symlink' });
        adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/scope/create_paths', { path, reason: 'create path ancestor open failed' });
      }
      const descriptorBefore = await handle.stat();
      if (!descriptorBefore.isDirectory() || !sameIdentity(pathnameBefore, descriptorBefore) || pathnameBefore.mode !== descriptorBefore.mode || pathnameBefore.nlink !== descriptorBefore.nlink) {
        await handle.close().catch(() => {});
        adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/scope/create_paths', { path, reason: 'unsafe create path ancestor descriptor' });
      }
      const resolvedAncestor = await realpath(ancestorPath).catch(() => null);
      if (resolvedAncestor === null || resolvedAncestor !== ancestorPath || !within(repositoryRoot, resolvedAncestor)) {
        await handle.close().catch(() => {});
        adapterError('SNAPSHOT_SYMLINK', '/scope/create_paths', { path, reason: 'indirect create path ancestor' });
      }
      records.push({ ancestorPath, descriptorBefore, handle });
    }
    if (hooks?.afterCreateAncestorValidation !== undefined) await hooks.afterCreateAncestorValidation({ path, existingAncestors: records.map((record) => record.ancestorPath) });
    if ((await lstat(target).catch(() => null)) !== null) adapterError('SNAPSHOT_CREATE_PATH_PRESENT', '/scope/create_paths', { path });
    for (const missingAncestor of missingAncestors) {
      if ((await lstat(missingAncestor).catch(() => null)) !== null) adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/scope/create_paths', { path, reason: 'absent create path ancestor changed during verification' });
    }
    for (const record of records) {
      const descriptorAfter = await record.handle.stat();
      const pathnameAfter = await lstat(record.ancestorPath).catch(() => null);
      const resolvedAfter = await realpath(record.ancestorPath).catch(() => null);
      const safePathname = pathnameAfter !== null && pathnameAfter.isDirectory() && !pathnameAfter.isSymbolicLink() && sameIdentity(descriptorAfter, pathnameAfter) && pathnameAfter.mode === descriptorAfter.mode && pathnameAfter.nlink === descriptorAfter.nlink;
      if (!stableDirectoryIdentity(record.descriptorBefore, descriptorAfter) || !safePathname || resolvedAfter !== record.ancestorPath || !within(repositoryRoot, resolvedAfter ?? '')) {
        adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/scope/create_paths', { path, reason: 'create path ancestor changed during verification' });
      }
    }
    const nearestExisting = records.at(-1)?.ancestorPath ?? repositoryRoot;
    const finalParent = await realpath(nearestExisting).catch(() => null);
    if (finalParent === null || finalParent !== nearestExisting || !within(repositoryRoot, finalParent) || !within(repositoryRoot, target)) adapterError('SNAPSHOT_SYMLINK', '/scope/create_paths', { path, reason: 'create path final confinement failed' });
    await assertRepositoryBinding(repository);
  } finally {
    for (const record of records.reverse()) await record.handle.close().catch(() => {});
  }
}

async function boundedDescriptorRead(handle, limit, path, pointer = '/paths', kind = 'tracked content') {
  const chunks = []; let total = 0;
  while (true) {
    const remaining = limit - total + 1;
    const buffer = Buffer.alloc(Math.min(64 * 1024, remaining));
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, null);
    if (bytesRead === 0) break;
    total += bytesRead;
    if (total > limit) adapterError('INPUT_TOO_LARGE', pointer, { path, kind });
    chunks.push(buffer.subarray(0, bytesRead));
  }
  return Buffer.concat(chunks, total);
}

export async function readPhaseSpecInput(path, { afterOpen } = {}) {
  const pointer = '/phase_spec';
  if (typeof path !== 'string' || !isAbsolute(path)) adapterError('PATH_INVALID', pointer, { reason: 'absolute regular file required' });
  const pathnameBefore = await lstat(path).catch(() => null);
  if (pathnameBefore === null) adapterError('PATH_INVALID', pointer, { reason: 'phase spec input missing' });
  if (pathnameBefore.isSymbolicLink()) adapterError('SNAPSHOT_SYMLINK', pointer, { reason: 'phase spec input symlink' });
  if (!pathnameBefore.isFile()) adapterError('PATH_INVALID', pointer, { reason: 'phase spec input must be regular' });
  if (pathnameBefore.nlink !== 1) adapterError('SNAPSHOT_HARDLINK', pointer, { reason: 'phase spec input hardlink' });
  if (pathnameBefore.size > MAX_PHASE_SPEC_BYTES) adapterError('INPUT_TOO_LARGE', pointer, { kind: 'phase spec input' });
  let handle;
  try {
    handle = await open(path, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_NONBLOCK);
    const descriptorBefore = await handle.stat();
    const safeBefore = descriptorBefore.isFile() && descriptorBefore.nlink === 1 && sameIdentity(pathnameBefore, descriptorBefore) && pathnameBefore.mode === descriptorBefore.mode && pathnameBefore.size === descriptorBefore.size;
    if (!safeBefore) adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', pointer, { reason: 'unsafe phase spec descriptor identity' });
    if (descriptorBefore.size > MAX_PHASE_SPEC_BYTES) adapterError('INPUT_TOO_LARGE', pointer, { kind: 'phase spec input' });
    if (afterOpen !== undefined) await afterOpen();
    const content = await boundedDescriptorRead(handle, MAX_PHASE_SPEC_BYTES, '[phase-spec-input]', pointer, 'phase spec input');
    const descriptorAfter = await handle.stat();
    const pathnameAfter = await lstat(path).catch(() => null);
    const unchangedDescriptor = sameIdentity(descriptorBefore, descriptorAfter) && descriptorBefore.mode === descriptorAfter.mode && descriptorBefore.nlink === descriptorAfter.nlink && descriptorBefore.size === descriptorAfter.size && descriptorBefore.mtimeMs === descriptorAfter.mtimeMs && descriptorBefore.ctimeMs === descriptorAfter.ctimeMs;
    const safePathname = pathnameAfter !== null && pathnameAfter.isFile() && !pathnameAfter.isSymbolicLink() && pathnameAfter.nlink === 1 && sameIdentity(descriptorAfter, pathnameAfter) && pathnameAfter.mode === descriptorAfter.mode && pathnameAfter.size === descriptorAfter.size;
    if (!unchangedDescriptor || !safePathname || content.length !== descriptorAfter.size) adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', pointer, { reason: 'phase spec changed during bounded descriptor read' });
    return content;
  } catch (error) {
    if (error instanceof DiagnosticError) throw error;
    if (error?.code === 'ELOOP') adapterError('SNAPSHOT_SYMLINK', pointer, { reason: 'phase spec input symlink' });
    adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', pointer, { reason: 'bounded phase spec descriptor read failed' });
  } finally {
    if (handle !== undefined) await handle.close().catch(() => {});
  }
}

async function trackedPathIdentity(repository, path, role, includeContent, hooks) {
  await assertRepositoryBinding(repository);
  const repositoryRoot = repository.path;
  const ancestorBindings = await openTrackedAncestorBindings(repository, path);
  try {
    const lexicalPath = join(repositoryRoot, ...path.split('/'));
    const fileStat = await lstat(lexicalPath).catch(() => null);
    const stageLine = oneLine(await runGit(repository, ['ls-files', '--error-unmatch', '--stage', '--', path], { hooks }));
    const match = /^(\d{6}) ([0-9a-f]{40}) [0-3]\t/u.exec(stageLine);
    if (match === null) adapterError('SNAPSHOT_PATH_NOT_TRACKED', '/paths', { path });
    const [, mode, blob] = match;
    if (mode === '120000') adapterError('SNAPSHOT_SYMLINK', '/paths', { path });
    if (mode === '160000') adapterError('SNAPSHOT_SUBMODULE', '/paths', { path });
    if (mode !== '100644' && mode !== '100755') adapterError('PATH_INVALID', '/paths', { path, reason: 'unsupported mode' });
    if (fileStat === null) adapterError('SNAPSHOT_PATH_MISSING', `/scope/${role.toLowerCase()}_paths`, { path });
    if (fileStat.isSymbolicLink()) adapterError('SNAPSHOT_SYMLINK', '/paths', { path });
    if (!fileStat.isFile()) adapterError('PATH_INVALID', '/paths', { path, reason: 'regular file required' });
    if (fileStat.nlink !== 1) adapterError('SNAPSHOT_HARDLINK', '/paths', { path });
    if (assertedMode(fileStat) !== mode) adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/paths', { path, reason: 'mode differs from index' });
    const resolvedPath = await realpath(lexicalPath);
    if (!within(repositoryRoot, resolvedPath) || resolvedPath !== lexicalPath) {
      adapterError('SNAPSHOT_SYMLINK', '/paths', { path, reason: 'indirect symlink' });
    }
    const limit = includeContent ? MAX_EMBEDDED_CONTENT_BYTES : MAX_TRACKED_FILE_BYTES;
    let handle;
    let content;
    try {
      if (hooks?.beforePathOpen !== undefined) await hooks.beforePathOpen({ path, lexicalPath });
      handle = await open(lexicalPath, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_NONBLOCK);
      const descriptorBefore = await handle.stat();
      if (!descriptorBefore.isFile() || descriptorBefore.nlink !== 1 || !sameIdentity(fileStat, descriptorBefore) || assertedMode(descriptorBefore) !== mode) adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/paths', { path, reason: 'unsafe opened descriptor identity' });
      if (descriptorBefore.size > limit) adapterError('INPUT_TOO_LARGE', '/paths', { path, kind: 'tracked content' });
      if (hooks?.afterPathValidation !== undefined) await hooks.afterPathValidation({ path, lexicalPath });
      content = await boundedDescriptorRead(handle, limit, path);
      const descriptorAfter = await handle.stat();
      const pathnameAfter = await lstat(lexicalPath).catch(() => null);
      const unchangedDescriptor = sameIdentity(descriptorBefore, descriptorAfter) && descriptorBefore.size === descriptorAfter.size && descriptorBefore.mtimeMs === descriptorAfter.mtimeMs && descriptorBefore.ctimeMs === descriptorAfter.ctimeMs;
      const safePathname = pathnameAfter !== null && pathnameAfter.isFile() && !pathnameAfter.isSymbolicLink() && pathnameAfter.nlink === 1 && sameIdentity(descriptorAfter, pathnameAfter) && assertedMode(pathnameAfter) === mode;
      if (!unchangedDescriptor || !safePathname || content.length !== descriptorAfter.size) adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/paths', { path, reason: 'path changed during bounded descriptor read' });
    } catch (error) {
      if (error instanceof DiagnosticError) throw error;
      if (error?.code === 'ELOOP') adapterError('SNAPSHOT_SYMLINK', '/paths', { path });
      adapterError('SNAPSHOT_PATH_IDENTITY_MISMATCH', '/paths', { path, reason: 'bounded descriptor read failed' });
    } finally {
      if (handle !== undefined) await handle.close().catch(() => {});
    }
    const identity = bufferIdentity(content);
    const record = {
      path,
      role,
      state: 'TRACKED',
      mode,
      blob,
      sha256: identity.sha256,
      bytes: identity.bytes,
      lf: identity.lf,
      cr: identity.cr,
    };
    if (includeContent) {
      try {
        record.content_utf8 = new TextDecoder('utf-8', { fatal: true }).decode(content);
      } catch {
        adapterError('INVALID_UTF8', '/paths', { path });
      }
    }
    await assertTrackedAncestorBindings(repository, ancestorBindings, path);
    return record;
  } finally {
    for (const binding of ancestorBindings.reverse()) await binding.handle.close().catch(() => {});
  }
}

function absentPathIdentity(path) {
  return {
    path,
    role: 'CREATE',
    state: 'ABSENT',
    mode: '',
    blob: '',
    sha256: '',
    bytes: 0,
    lf: 0,
    cr: 0,
  };
}

async function collectPathIdentities(repository, spec, hooks) {
  const identities = [];
  for (const path of spec.scope.create_paths) {
    await verifiedCreatePathAbsence(repository, path, hooks);
    identities.push(absentPathIdentity(path));
  }
  const contentPaths = new Set(spec.scope.read_content_paths);
  for (const [role, paths] of [
    ['MODIFY', spec.scope.modify_paths],
    ['PRESERVE', spec.scope.preserve_paths],
  ]) {
    for (const path of paths) {
      identities.push(await trackedPathIdentity(repository, path, role, contentPaths.has(path), hooks));
    }
  }
  return identities.sort((left, right) => compareUtf8(left.path, right.path));
}

export async function writeExclusiveSnapshot(outPath, bytes, { beforeOpen, afterOpen } = {}) {
  let parentHandle;
  try {
    if (!Buffer.isBuffer(bytes) || bytes.length > MAX_SNAPSHOT_OUTPUT_BYTES) adapterError('INPUT_TOO_LARGE', '/out', { reason: 'snapshot output exceeds byte bound' });
    if (!isAbsolute(outPath)) adapterError('PATH_INVALID', '/out', { reason: 'absolute path required' });
    const parent = dirname(outPath);
    const canonicalParent = await realpath(parent);
    resolveSnapshotOutputPath(canonicalParent, outPath);
    if (canonicalParent !== parent) adapterError('PATH_INVALID', '/out', { reason: 'output parent must be canonical' });
    parentHandle = await open(parent, fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW | fsConstants.O_DIRECTORY | fsConstants.O_NONBLOCK);
    const parentIdentity = await parentHandle.stat({ bigint: true });
    const assertParentBinding = async () => {
      const [descriptor, pathname, resolvedParent] = await Promise.all([
        parentHandle.stat({ bigint: true }),
        lstat(parent, { bigint: true }),
        realpath(parent),
      ]);
      if (!descriptor.isDirectory() || !pathname.isDirectory() || pathname.isSymbolicLink() || !sameIdentity(descriptor, parentIdentity) || !sameIdentity(pathname, parentIdentity) || resolvedParent !== parent) {
        adapterError('PATH_INVALID', '/out', { reason: 'output parent binding changed' });
      }
    };
    await assertParentBinding();
    if (beforeOpen !== undefined) await beforeOpen();
    await assertParentBinding();
    const identity = bufferIdentity(bytes);
    const runBoundOperation = (action, extraArguments = [], input = Buffer.alloc(0)) => new Promise((resolvePromise, rejectPromise) => {
      const child = spawn('/usr/bin/python3', ['-I', '-S', '-c', BOUND_SNAPSHOT_WRITE_PROGRAM, action, basename(outPath), String(identity.bytes), identity.sha256, ...extraArguments], {
        cwd: '/', env: { LANG: 'C', LC_ALL: 'C', PATH: '/usr/bin:/bin' }, shell: false,
        stdio: ['pipe', 'pipe', 'pipe', parentHandle.fd], windowsHide: true,
      });
      const stdout = []; let outputBytes = 0; let settled = false;
      const finish = (error, value = undefined) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error === null) resolvePromise(value); else rejectPromise(error);
      };
      const timer = setTimeout(() => {
        child.kill('SIGKILL');
        finish(new DiagnosticError('PATH_INVALID', { location_json_pointer: '/out', sanitized_evidence: { reason: 'descriptor-relative snapshot write timed out' } }));
      }, 10000);
      child.stdout.on('data', (chunk) => { stdout.push(chunk); });
      for (const stream of [child.stdout, child.stderr]) stream.on('data', (chunk) => {
        outputBytes += chunk.length;
        if (outputBytes > 4096) {
          child.kill('SIGKILL');
          finish(new DiagnosticError('PATH_INVALID', { location_json_pointer: '/out', sanitized_evidence: { reason: 'descriptor-relative snapshot write output exceeded bound' } }));
        }
      });
      child.on('error', () => finish(new DiagnosticError('COMPILER_CAPABILITY_UNAVAILABLE', { location_json_pointer: '/out', sanitized_evidence: { reason: 'fixed snapshot publication helper unavailable' } })));
      child.on('close', (code) => {
        if (code === 0) finish(null, Buffer.concat(stdout).toString('ascii'));
        else if (code === 17) finish(new DiagnosticError('SNAPSHOT_OUTPUT_EXISTS', { location_json_pointer: '/out', sanitized_evidence: { reason: 'descriptor-relative no-replace collision' } }));
        else if (code === 72) finish(new DiagnosticError('COMPILER_CAPABILITY_UNAVAILABLE', { location_json_pointer: '/out', sanitized_evidence: { reason: 'descriptor-relative snapshot publication capability unavailable' } }));
        else finish(new DiagnosticError('PATH_INVALID', { location_json_pointer: '/out', sanitized_evidence: { reason: 'descriptor-relative snapshot write failed closed' } }));
      });
      child.stdin.on('error', () => {});
      child.stdin.end(input);
    });
    const createdIdentity = await runBoundOperation('write', [], bytes);
    if (!/^[0-9]+:[0-9]+$/u.test(createdIdentity)) adapterError('PATH_INVALID', '/out', { reason: 'descriptor-relative snapshot identity unavailable' });
    if (afterOpen !== undefined) await afterOpen();
    await assertParentBinding();
    await runBoundOperation('verify', createdIdentity.split(':'));
  } catch (error) {
    if (error instanceof DiagnosticError) throw error;
    if (error?.code === 'EEXIST') adapterError('SNAPSHOT_OUTPUT_EXISTS', '/out');
    adapterError('PATH_INVALID', '/out', { reason: 'exclusive write failed' });
  } finally {
    await parentHandle?.close().catch(() => {});
  }
}

export async function collect({ phaseSpecBytes, repoRoot, outPath, hooks = {} }) {
  const spec = parsePhaseSpec(phaseSpecBytes);
  const repository = await resolveRepository(repoRoot);
  try {
    if (hooks.afterRepositoryValidation !== undefined) {
      await hooks.afterRepositoryValidation({ repositoryRoot: repository.path });
    }
    await assertRepositoryBinding(repository);
    const outputPath = await assertExternalNewOutput(repository.path, outPath);
    await assertRepositoryBinding(repository);

    const branch = oneLine(await runGit(repository, ['symbolic-ref', '--quiet', '--short', 'HEAD'], { hooks }));
    const head = oneLine(await runGit(repository, ['rev-parse', 'HEAD'], { hooks }));
    const parent = oneLine(await runGit(repository, ['rev-parse', 'HEAD^'], { hooks }));
    const tree = oneLine(await runGit(repository, ['rev-parse', 'HEAD^{tree}'], { hooks }));
    const subject = oneLine(await runGit(repository, ['show', '-s', '--format=%s', 'HEAD'], { hooks }));

    if (branch !== spec.repository.branch) adapterError('SNAPSHOT_BRANCH_MISMATCH', '/branch');
    if (head !== spec.repository.baseline.head || parent !== spec.repository.baseline.parent || tree !== spec.repository.baseline.tree || subject !== spec.repository.baseline.subject) {
      adapterError('SNAPSHOT_HEAD_MISMATCH', '/head');
    }

    let remoteHead = '';
    let ahead = 0;
    let behind = 0;
    if (spec.repository.remote_ref !== '') {
      remoteHead = oneLine(await runGit(repository, ['rev-parse', '--verify', spec.repository.remote_ref], { hooks }));
      const divergence = oneLine(
        await runGit(repository, ['rev-list', '--left-right', '--count', `HEAD...${spec.repository.remote_ref}`], { hooks }),
      ).split(/\s+/u);
      ahead = Number(divergence[0]);
      behind = Number(divergence[1]);
    }
    if (remoteHead !== spec.repository.remote_head || ahead !== spec.repository.ahead || behind !== spec.repository.behind) {
      adapterError('SNAPSHOT_REPOSITORY_MISMATCH', '/remote_ref', { reason: 'local remote-ref identity' });
    }

    const statusBytes = await runGit(
      repository,
      ['status', '--porcelain=v1', '-z', '--untracked-files=all'],
      { binary: true, hooks },
    );
    const body = {
      snapshot_version: 1,
      adapter_version: 1,
      repository_id: spec.repository.repository_id,
      branch,
      head,
      parent,
      tree,
      subject,
      remote_ref: spec.repository.remote_ref,
      remote_head: remoteHead,
      ahead,
      behind,
      status: parseStatus(statusBytes),
      paths: await collectPathIdentities(repository, spec, hooks),
      derived_dependency_facts: [],
    };
    body.derived_dependency_facts = validateCommandDependencies({ spec, snapshot: body }).derived_dependency_facts;
    const snapshot = deepFreeze({
      ...body,
      snapshot_digest: repositorySnapshotDigest(body),
      final_marker: 'AIFINDER_REPOSITORY_SNAPSHOT_END',
    });
    assertSchema(snapshot, SNAPSHOT_SCHEMA);
    await assertRepositoryBinding(repository);
    await writeExclusiveSnapshot(outputPath, canonicalJsonBuffer(snapshot));
    await assertRepositoryBinding(repository);
    return snapshot;
  } finally {
    await repository.handle.close().catch(() => {});
  }
}

async function main(argv) {
  if (argv.length !== 6 || argv[0] !== 'collect' || argv[2] !== '--repo' || argv[4] !== '--out') {
    throw new DiagnosticError('SCHEMA_VALIDATION', {
      location_json_pointer: '/argv',
      sanitized_evidence: { expected: 'collect <phase-spec.json> --repo <absolute-repo> --out <new-external-snapshot.json>' },
    });
  }
  const phaseSpecBytes = await readPhaseSpecInput(argv[1]);
  await collect({ phaseSpecBytes, repoRoot: argv[3], outPath: argv[5] });
}

const isEntrypoint = process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isEntrypoint) {
  main(process.argv.slice(2)).catch((error) => {
    const record = error instanceof DiagnosticError
      ? error.diagnostic
      : new DiagnosticError('SCHEMA_VALIDATION', {
          location_json_pointer: '',
          sanitized_evidence: { reason: 'internal adapter failure' },
        }).diagnostic;
    process.stderr.write(`${JSON.stringify(record)}\n`);
    process.exitCode = 1;
  });
}
