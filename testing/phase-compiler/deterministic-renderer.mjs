import { createHash } from 'node:crypto';
import {
  bufferIdentity,
  canonicalJsonBuffer,
  compareUtf8,
  decodeUtf8,
  deepFreeze,
  parseStrictJson,
  semanticDigest,
} from './canonical.mjs';
import { DiagnosticError, diagnostic } from './error-catalog.mjs';
import { normalizePhaseSpec, normalizeRepositoryPath } from './phase-spec.mjs';
import { validatePhaseCompilation } from './semantic-validator.mjs';
import {
  EXECUTABLE_PROFILE_IDENTITY,
  EXECUTABLE_PROFILE_VERSION,
} from './command-dependency-validator.mjs';

export const PHASE_COMPILER_FORMAT_VERSION = 1;
export const APPROVAL_CONTRACT_ID = 'AIFINDER_PHASE_COMPILER_V1_EXACT_GEMINI_TOKEN';

const CODEX_BEGIN = '<!-- AIFINDER_CODEX_PACKAGE_BYTES_BEGIN -->\n';
const CODEX_END = '<!-- AIFINDER_CODEX_PACKAGE_BYTES_END -->';
const NORMALIZED_SPEC_BEGIN = '<!-- AIFINDER_NORMALIZED_PHASE_SPEC_BYTES_BEGIN -->\n';
const NORMALIZED_SPEC_END = '<!-- AIFINDER_NORMALIZED_PHASE_SPEC_BYTES_END -->';
const SANITIZED_SNAPSHOT_BEGIN = '<!-- AIFINDER_SANITIZED_SNAPSHOT_EVIDENCE_BYTES_BEGIN -->\n';
const SANITIZED_SNAPSHOT_END = '<!-- AIFINDER_SANITIZED_SNAPSHOT_EVIDENCE_BYTES_END -->';
const TOKEN_PATTERN = /APPROVE_AIFINDER_[A-Z0-9]+(?:-[A-Z0-9]+)*_[0-9a-f]{64}/gu;
const TOKEN_TEST_PATTERN = /APPROVE_AIFINDER_[A-Z0-9]+(?:-[A-Z0-9]+)*_[0-9a-f]{64}/u;
const SECRET_VALUE_PATTERN = /(?:\bghp_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b|\bAKIA[A-Z0-9]{16}\b|\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b|\b(?:authorization|bearer|cookie|credential|password|secret|session|token)\s*[=:]\s*\S+)/iu;

function marker(phaseId, role) {
  return `AIFINDER_PHASE_${phaseId.replace(/-/gu, '_')}_${role}_END`;
}

export function artifactNamesForPhase(phaseId) {
  const prefix = `AiFinder-Phase-${phaseId}`;
  return Object.freeze([
    `${prefix}-00-README.md`,
    `${prefix}-01-Gemini-Review-Package.md`,
    `${prefix}-02-Codex-Package-and-Prompt.md`,
    `${prefix}-03-Concise-Codex-Prompt.txt`,
    `${prefix}-04-Phase-Spec.canonical.json`,
    `${prefix}-05-Repository-Snapshot-Evidence.canonical.json`,
    `${prefix}-06-CCR-REPORT-TEMPLATE.md`,
    `${prefix}-MANIFEST.canonical.json`,
    `${prefix}-SHA256SUMS.txt`,
  ]);
}

export function zipNameForPhase(phaseId) {
  return `AiFinder-Phase-${phaseId}-Compiled-Bundle-v1.zip`;
}

function textBuffer(lines, finalMarker) {
  return Buffer.from(`${lines.join('\n')}\n\n${finalMarker}\n`, 'utf8');
}

function rawIdentity(bytes) {
  return { algorithm: 'SHA-256', ...bufferIdentity(bytes) };
}

function logicalRepositoryId(value) {
  return typeof value === 'string' &&
    /^[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)+$/u.test(value) &&
    !/^file:/iu.test(value) &&
    !value.includes('\\') &&
    !value.split('/').some((segment) => segment === '.' || segment === '..');
}

function snapshotPathsAuthorized(paths, spec) {
  const authorized = [...spec.scope.create_paths, ...spec.scope.modify_paths, ...spec.scope.preserve_paths].sort(compareUtf8);
  const emitted = [];
  for (const record of paths) {
    try {
      if (normalizeRepositoryPath(record.path, '/snapshot/paths') !== record.path) return false;
    } catch {
      return false;
    }
    emitted.push(record.path);
  }
  return JSON.stringify(emitted.sort(compareUtf8)) === JSON.stringify(authorized);
}

function canonicalSnapshotDependencyFacts(closureClassifications) {
  const facts = [];
  const seen = new Set();
  for (const fact of closureClassifications) {
    const projection = {
      command_id: fact.command_id,
      reference: fact.reference,
      classification: fact.classification,
    };
    const key = `${projection.command_id}\u0000${projection.reference}\u0000${projection.classification}`;
    if (seen.has(key)) continue;
    seen.add(key);
    facts.push(projection);
  }
  return facts.sort((left, right) =>
    compareUtf8(left.command_id, right.command_id) ||
    compareUtf8(left.reference, right.reference) ||
    compareUtf8(left.classification, right.classification),
  );
}

function sanitizedSnapshot(snapshot, phaseId, spec, closureClassifications) {
  const projection = {
    snapshot_version: snapshot.snapshot_version,
    adapter_version: snapshot.adapter_version,
    repository_id: snapshot.repository_id,
    branch: snapshot.branch,
    head: snapshot.head,
    parent: snapshot.parent,
    tree: snapshot.tree,
    subject: snapshot.subject,
    remote_ref: snapshot.remote_ref,
    remote_head: snapshot.remote_head,
    ahead: snapshot.ahead,
    behind: snapshot.behind,
    status: {
      staged: snapshot.status.staged,
      tracked_modified: snapshot.status.tracked_modified,
      tracked_deleted: snapshot.status.tracked_deleted,
      untracked: snapshot.status.untracked,
      conflicted: snapshot.status.conflicted,
    },
    paths: snapshot.paths.map((record) => ({
      path: record.path,
      role: record.role,
      state: record.state,
      mode: record.mode,
      blob: record.blob,
      sha256: record.sha256,
      bytes: record.bytes,
      lf: record.lf,
      cr: record.cr,
    })).sort((left, right) => compareUtf8(left.path, right.path)),
    derived_dependency_facts: canonicalSnapshotDependencyFacts(closureClassifications),
    snapshot_digest: snapshot.snapshot_digest,
    final_marker: marker(phaseId, 'REPOSITORY_SNAPSHOT_EVIDENCE'),
  };
  if (!logicalRepositoryId(projection.repository_id) || !snapshotPathsAuthorized(projection.paths, spec) || SECRET_VALUE_PATTERN.test(JSON.stringify(projection))) {
    throw new DiagnosticError('SNAPSHOT_SOURCE_CONTENT_EMISSION', {
      location_json_pointer: '/snapshot',
      sanitized_evidence: { reason: 'secret-like snapshot projection value' },
    });
  }
  return deepFreeze(projection);
}

const OPERATION_CHARGE_NAMES = Object.freeze(['network', 'database', 'deployments', 'git_commits', 'git_pushes', 'compiled_commands']);

function operationAggregateFromSpec(spec) {
  const aggregate = Object.fromEntries(OPERATION_CHARGE_NAMES.map((name) => [name, 0]));
  for (const command of spec.commands) {
    for (const name of OPERATION_CHARGE_NAMES) aggregate[name] += command.operation_charges[name];
  }
  for (const conditional of spec.conditional_scopes) {
    for (const name of OPERATION_CHARGE_NAMES) {
      aggregate[name] += Math.max(conditional.true_operation_charges[name], conditional.false_operation_charges[name]);
    }
  }
  return aggregate;
}

export function reconstructAuthorityIr(spec, snapshotEvidence) {
  return deepFreeze({
    compiler_format_version: PHASE_COMPILER_FORMAT_VERSION,
    executable_profile: {
      identity: EXECUTABLE_PROFILE_IDENTITY,
      version: EXECUTABLE_PROFILE_VERSION,
    },
    phase_spec: spec,
    repository_snapshot_evidence: snapshotEvidence,
    independently_recomputed: {
      command_dependency_facts: snapshotEvidence.derived_dependency_facts,
      governance_contract: spec.governance,
      operation_aggregate: operationAggregateFromSpec(spec),
    },
  });
}

function renderCodex(spec, snapshotEvidence, irDigest) {
  const header = Buffer.from([
    `# AiFinder Phase ${spec.phase_id} — Codex Package and Prompt`,
    '',
    `Compiler format: ${PHASE_COMPILER_FORMAT_VERSION}`,
    `Authority class: ${spec.authority_class}`,
    `Workstream: ${spec.workstream}`,
    `Repository: ${spec.repository.repository_id}`,
    `Branch: ${spec.repository.branch}`,
    `Baseline HEAD: ${spec.repository.baseline.head}`,
    `Authority IR commitment: ${irDigest}`,
    '',
    'Execute only the complete normalized phase specification and sanitized repository snapshot evidence embedded below.',
    'Do not infer scope, authority, credentials, environment values, or phase commands.',
    'This compiler output is static data. Its presence does not authorize execution.',
    'No sibling artifact is required to reconstruct or review the declared authority.',
    '',
    NORMALIZED_SPEC_BEGIN.slice(0, -1),
    '',
  ].join('\n'), 'utf8');
  const between = Buffer.from(`${NORMALIZED_SPEC_END}\n\n${SANITIZED_SNAPSHOT_BEGIN}`, 'utf8');
  const footer = Buffer.from(`${SANITIZED_SNAPSHOT_END}\n\n${marker(spec.phase_id, 'CODEX_PACKAGE_AND_PROMPT')}\n`, 'utf8');
  return Buffer.concat([
    header,
    canonicalJsonBuffer(spec),
    between,
    canonicalJsonBuffer(snapshotEvidence),
    footer,
  ]);
}

function approvalBasis(spec, irDigest, codexIdentity) {
  return canonicalJsonBuffer({
    compiler_format_version: PHASE_COMPILER_FORMAT_VERSION,
    phase_id: spec.phase_id,
    authority_class: spec.authority_class,
    repository_baseline: spec.repository.baseline,
    scope: spec.scope,
    authority_ir_digest: irDigest,
    codex_package_raw_identity: codexIdentity,
  });
}

function renderGemini(spec, token, codexBytes) {
  const header = Buffer.from([
    `# AiFinder Phase ${spec.phase_id} — Gemini Review Package`,
    '',
    `Review every byte of the exact embedded, self-contained, token-free Codex package. If and only if it is approved, return this proposed approval string exactly unchanged:`,
    '',
    token,
    '',
    CODEX_BEGIN.slice(0, -1),
    '',
  ].join('\n'), 'utf8');
  const footer = Buffer.from(`${CODEX_END}\n\n${marker(spec.phase_id, 'GEMINI_REVIEW_PACKAGE')}\n`, 'utf8');
  return Buffer.concat([header, codexBytes, footer]);
}

function renderReadme(spec, names) {
  return textBuffer([
    `# AiFinder Phase ${spec.phase_id} compiled bundle`,
    '',
    'This directory is deterministic static compiler output. It does not execute or authorize phase commands.',
    '',
    'Canonical files:',
    ...names.map((name) => `- ${name}`),
  ], marker(spec.phase_id, 'README'));
}

function renderConcise(spec) {
  return textBuffer([
    `Execute the phase-specific Codex package for AiFinder Phase ${spec.phase_id}.`,
    'Use only the exact canonical bundle and separately human-confirmed review decision.',
    'Do not infer additional authority.',
  ], marker(spec.phase_id, 'CONCISE_CODEX_PROMPT'));
}

function renderCcrTemplate(spec) {
  return textBuffer([
    '# CCR REPORT',
    `Phase: ${spec.phase_id}`,
    'Result: <PASSED|FAILED|BLOCKED|ROLLED_BACK>',
    'Authority: <exact authority state>',
    'Repository identities: <verified values>',
    'Scope and paths: <exact evidence>',
    'Commands and exits: <exact evidence>',
    'Tests and reviews: <exact evidence>',
    'Git delivery: <exact evidence>',
    'Risks and next action: <bounded statement>',
  ], marker(spec.phase_id, 'CCR_REPORT_TEMPLATE'));
}

function extractEmbeddedCodex(geminiBytes) {
  const begin = Buffer.from(CODEX_BEGIN);
  const end = Buffer.from(CODEX_END);
  const beginAt = geminiBytes.indexOf(begin);
  if (beginAt === -1) return null;
  const contentAt = beginAt + begin.length;
  const endAt = geminiBytes.indexOf(end, contentAt);
  if (endAt === -1 || geminiBytes.indexOf(begin, contentAt) !== -1 || geminiBytes.indexOf(end, endAt + end.length) !== -1) return null;
  return geminiBytes.subarray(contentAt, endAt);
}

function tokenOccurrences(bytes) {
  return Buffer.from(bytes).toString('utf8').match(TOKEN_PATTERN)?.length ?? 0;
}

function artifactMapFrom(input) {
  if (input instanceof Map) return new Map([...input].map(([name, bytes]) => [name, Buffer.from(bytes)]));
  if (Array.isArray(input)) return new Map(input.map(({ name, bytes }) => [name, Buffer.from(bytes)]));
  if (input?.artifact_names && typeof input.readArtifact === 'function') {
    return new Map(input.artifact_names.map((name) => [name, input.readArtifact(name)]));
  }
  throw new TypeError('artifact input must be a compiled bundle, Map, or entry array');
}

function add(records, code, location, evidence = {}) {
  records.push(diagnostic(code, { location_json_pointer: location, sanitized_evidence: evidence }));
}

const OUTPUT_DIAGNOSTIC_RANK = new Map([
  ['OUTPUT_FINAL_MARKER_MISMATCH', 0],
  ['TOKEN_OCCURRENCE_MISMATCH', 1],
  ['OUTPUT_EMBEDDING_MISMATCH', 2],
  ['OUTPUT_CHECKSUM_MISMATCH', 3],
  ['OUTPUT_NONDETERMINISTIC', 4],
]);

function outputDiagnosticRank(code) {
  return OUTPUT_DIAGNOSTIC_RANK.get(code) ?? 10;
}

function plainRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, expected) {
  return plainRecord(value) && JSON.stringify(Object.keys(value).sort(compareUtf8)) === JSON.stringify([...expected].sort(compareUtf8));
}

function rawIdentityShape(value) {
  return exactKeys(value, ['algorithm', 'bytes', 'cr', 'lf', 'sha256']) &&
    value.algorithm === 'SHA-256' &&
    Number.isSafeInteger(value.bytes) && value.bytes >= 0 &&
    Number.isSafeInteger(value.cr) && value.cr >= 0 &&
    Number.isSafeInteger(value.lf) && value.lf >= 0 &&
    typeof value.sha256 === 'string' && /^[0-9a-f]{64}$/u.test(value.sha256);
}

function nonnegativeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

function expectedMarkers(phaseId, names) {
  return new Map([
    [names[0], marker(phaseId, 'README')],
    [names[1], marker(phaseId, 'GEMINI_REVIEW_PACKAGE')],
    [names[2], marker(phaseId, 'CODEX_PACKAGE_AND_PROMPT')],
    [names[3], marker(phaseId, 'CONCISE_CODEX_PROMPT')],
    [names[4], marker(phaseId, 'PHASE_SPEC')],
    [names[5], marker(phaseId, 'REPOSITORY_SNAPSHOT_EVIDENCE')],
    [names[6], marker(phaseId, 'CCR_REPORT_TEMPLATE')],
    [names[7], marker(phaseId, 'MANIFEST')],
  ]);
}

function validateSanitizedSnapshot(bytes, expectedMarker, diagnostics, spec) {
  let snapshot;
  try {
    snapshot = parseStrictJson(bytes);
  } catch {
    add(diagnostics, 'SNAPSHOT_SOURCE_CONTENT_EMISSION', '/snapshot', { reason: 'snapshot evidence is not strict JSON' });
    return null;
  }
  const exactKeys = ['adapter_version', 'ahead', 'behind', 'branch', 'derived_dependency_facts', 'final_marker', 'head', 'parent', 'paths', 'remote_head', 'remote_ref', 'repository_id', 'snapshot_digest', 'snapshot_version', 'status', 'subject', 'tree'].sort(compareUtf8);
  const pathKeys = ['blob', 'bytes', 'cr', 'lf', 'mode', 'path', 'role', 'sha256', 'state'].sort(compareUtf8);
  const factKeys = ['classification', 'command_id', 'reference'].sort(compareUtf8);
  const statusKeys = ['conflicted', 'staged', 'tracked_deleted', 'tracked_modified', 'untracked'].sort(compareUtf8);
  const shapeValid =
    plainRecord(snapshot) &&
    JSON.stringify(Object.keys(snapshot).sort(compareUtf8)) === JSON.stringify(exactKeys) &&
    snapshot.snapshot_version === 1 && snapshot.adapter_version === 1 &&
    typeof snapshot.repository_id === 'string' && typeof snapshot.branch === 'string' &&
    typeof snapshot.head === 'string' && /^[0-9a-f]{40}$/u.test(snapshot.head) &&
    typeof snapshot.parent === 'string' && /^[0-9a-f]{40}$/u.test(snapshot.parent) &&
    typeof snapshot.tree === 'string' && /^[0-9a-f]{40}$/u.test(snapshot.tree) &&
    typeof snapshot.subject === 'string' && typeof snapshot.remote_ref === 'string' &&
    typeof snapshot.remote_head === 'string' && /^(?:|[0-9a-f]{40})$/u.test(snapshot.remote_head) &&
    nonnegativeInteger(snapshot.ahead) && nonnegativeInteger(snapshot.behind) &&
    typeof snapshot.snapshot_digest === 'string' && /^[0-9a-f]{64}$/u.test(snapshot.snapshot_digest) &&
    snapshot.final_marker === expectedMarker &&
    Array.isArray(snapshot.paths) && snapshot.paths.every((record) =>
      plainRecord(record) && JSON.stringify(Object.keys(record).sort(compareUtf8)) === JSON.stringify(pathKeys) &&
      typeof record.path === 'string' && ['CREATE', 'MODIFY', 'PRESERVE'].includes(record.role) && ['ABSENT', 'TRACKED'].includes(record.state) &&
      typeof record.mode === 'string' && /^(?:|100644|100755|120000|160000)$/u.test(record.mode) &&
      typeof record.blob === 'string' && /^(?:|[0-9a-f]{40})$/u.test(record.blob) &&
      typeof record.sha256 === 'string' && /^(?:|[0-9a-f]{64})$/u.test(record.sha256) &&
      nonnegativeInteger(record.bytes) && nonnegativeInteger(record.lf) && nonnegativeInteger(record.cr)) &&
    Array.isArray(snapshot.derived_dependency_facts) && snapshot.derived_dependency_facts.every((record) =>
      plainRecord(record) && JSON.stringify(Object.keys(record).sort(compareUtf8)) === JSON.stringify(factKeys) &&
      typeof record.command_id === 'string' && typeof record.reference === 'string' &&
      ['DECLARED_AND_MATCHED', 'DECLARED_BUT_UNPROVEN', 'UNDECLARED', 'UNRESOLVED_INDIRECTION'].includes(record.classification)) &&
    plainRecord(snapshot.status) && JSON.stringify(Object.keys(snapshot.status).sort(compareUtf8)) === JSON.stringify(statusKeys) &&
    statusKeys.every((key) => nonnegativeInteger(snapshot.status[key]));
  if (!shapeValid) {
    add(diagnostics, 'SNAPSHOT_SOURCE_CONTENT_EMISSION', '/snapshot', { reason: 'snapshot evidence exceeds sanitized allowlist' });
    return null;
  }
  if (!canonicalJsonBuffer(snapshot).equals(bytes) || !logicalRepositoryId(snapshot.repository_id) || spec === null || !snapshotPathsAuthorized(snapshot.paths, spec) || JSON.stringify(snapshot).includes('content_utf8') || SECRET_VALUE_PATTERN.test(JSON.stringify(snapshot))) {
    add(diagnostics, 'SNAPSHOT_SOURCE_CONTENT_EMISSION', '/snapshot', { reason: 'snapshot evidence exceeds sanitized allowlist' });
    return null;
  }
  return snapshot;
}

function invalidArtifactValidation(reason = 'artifact validation input shape') {
  return deepFreeze({ valid: false, diagnostics: [diagnostic('OUTPUT_HASH_MISMATCH', { sanitized_evidence: { reason } })] });
}

function validateArtifactBuffersInternal(input) {
  if (!plainRecord(input) || typeof input.phaseId !== 'string' || !/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/u.test(input.phaseId)) return invalidArtifactValidation();
  const { phaseId, artifacts } = input;
  const diagnostics = [];
  const expectedNames = artifactNamesForPhase(phaseId);
  let map;
  try {
    map = artifactMapFrom(artifacts);
  } catch {
    return deepFreeze({ valid: false, diagnostics: [diagnostic('OUTPUT_HASH_MISMATCH')] });
  }
  const actualNames = [...map.keys()].sort(compareUtf8);
  const sortedExpected = [...expectedNames].sort(compareUtf8);
  if (JSON.stringify(actualNames) !== JSON.stringify(sortedExpected) || actualNames.some((name) => !name.startsWith(`AiFinder-Phase-${phaseId}-`))) {
    add(diagnostics, 'AMBIGUOUS_ARTIFACT_FILENAME', '/artifacts', { reason: 'artifact set is not exact and phase-prefixed' });
  }
  if (actualNames.some((name) => TOKEN_TEST_PATTERN.test(name))) add(diagnostics, 'TOKEN_LEAKAGE', '/artifacts', { reason: 'token in filename' });

  for (const name of expectedNames) {
    const bytes = map.get(name);
    if (!Buffer.isBuffer(bytes)) continue;
    const identity = bufferIdentity(bytes);
    try {
      decodeUtf8(bytes);
    } catch (error) {
      add(diagnostics, error instanceof DiagnosticError ? error.diagnostic.code : 'INVALID_UTF8', `/artifacts/${name}`, { reason: 'artifact encoding' });
    }
    if (identity.bytes > 1024 * 1024) add(diagnostics, 'INPUT_TOO_LARGE', `/artifacts/${name}`, { reason: 'artifact output bound' });
    if (identity.cr !== 0 || bytes.at(-1) !== 10) add(diagnostics, 'OUTPUT_FINAL_MARKER_MISMATCH', `/artifacts/${name}`, { reason: 'LF/CR policy' });
  }
  for (const [name, expected] of expectedMarkers(phaseId, expectedNames)) {
    const bytes = map.get(name);
    if (!Buffer.isBuffer(bytes)) continue;
    let markerMatches = false;
    if (name.endsWith('.json')) {
      try {
        markerMatches = parseStrictJson(bytes).final_marker === expected;
      } catch {
        markerMatches = false;
      }
    } else {
      markerMatches = bytes.toString('utf8').endsWith(`${expected}\n`);
    }
    if (!markerMatches) add(diagnostics, 'OUTPUT_FINAL_MARKER_MISMATCH', `/artifacts/${name}`, { reason: 'final marker bytes' });
  }

  const gemini = map.get(expectedNames[1]);
  const codex = map.get(expectedNames[2]);
  if (Buffer.isBuffer(gemini) && Buffer.isBuffer(codex)) {
    const embedded = extractEmbeddedCodex(gemini);
    if (embedded === null || !embedded.equals(codex)) add(diagnostics, 'OUTPUT_EMBEDDING_MISMATCH', `/artifacts/${expectedNames[1]}`, { reason: 'embedded Codex bytes' });
  }
  for (const name of expectedNames) {
    const bytes = map.get(name);
    if (!Buffer.isBuffer(bytes)) continue;
    const occurrences = tokenOccurrences(bytes);
    if ((name === expectedNames[1] && occurrences !== 1) || (name !== expectedNames[1] && occurrences !== 0)) {
      add(diagnostics, 'TOKEN_OCCURRENCE_MISMATCH', `/artifacts/${name}`, { reason: 'token occurrence policy' });
    }
  }
  let normalizedSpec = null;
  if (Buffer.isBuffer(map.get(expectedNames[4]))) {
    try {
      const document = parseStrictJson(map.get(expectedNames[4]));
      if (!exactKeys(document, ['compiler_format_version', 'final_marker', 'phase_spec']) || !plainRecord(document.phase_spec) || document.compiler_format_version !== PHASE_COMPILER_FORMAT_VERSION || document.final_marker !== marker(phaseId, 'PHASE_SPEC') || !canonicalJsonBuffer(document).equals(map.get(expectedNames[4]))) throw new Error('phase spec document shape');
      normalizedSpec = normalizePhaseSpec(document.phase_spec);
      const expectedDocument = { compiler_format_version: PHASE_COMPILER_FORMAT_VERSION, phase_spec: normalizedSpec, final_marker: marker(phaseId, 'PHASE_SPEC') };
      if (normalizedSpec.phase_id !== phaseId || !canonicalJsonBuffer(expectedDocument).equals(map.get(expectedNames[4]))) throw new Error('phase spec phase identity or normalization');
    } catch {
      normalizedSpec = null;
      add(diagnostics, 'OUTPUT_HASH_MISMATCH', `/artifacts/${expectedNames[4]}`, { reason: 'canonical normalized phase spec' });
    }
  }
  const sanitized = Buffer.isBuffer(map.get(expectedNames[5])) ? validateSanitizedSnapshot(map.get(expectedNames[5]), marker(phaseId, 'REPOSITORY_SNAPSHOT_EVIDENCE'), diagnostics, normalizedSpec) : null;
  if (normalizedSpec !== null && sanitized !== null) {
    for (const [field, expected] of [
      ['repository_id', normalizedSpec.repository.repository_id],
      ['branch', normalizedSpec.repository.branch],
      ['head', normalizedSpec.repository.baseline.head],
      ['parent', normalizedSpec.repository.baseline.parent],
      ['tree', normalizedSpec.repository.baseline.tree],
      ['subject', normalizedSpec.repository.baseline.subject],
      ['remote_ref', normalizedSpec.repository.remote_ref],
      ['remote_head', normalizedSpec.repository.remote_head],
      ['ahead', normalizedSpec.repository.ahead],
      ['behind', normalizedSpec.repository.behind],
    ]) if (sanitized[field] !== expected) add(diagnostics, 'REPOSITORY_IDENTITY_MISMATCH', `/snapshot/${field}`, { reason: 'sanitized snapshot/spec mismatch' });
  }

  let manifest;
  try {
    manifest = parseStrictJson(map.get(expectedNames[7]));
    const manifestShape = exactKeys(manifest, ['approval', 'canonical_artifact_names', 'codex_embedding_identity', 'compiler_format_version', 'final_marker', 'leaf_artifacts', 'phase_id']) &&
      manifest.compiler_format_version === PHASE_COMPILER_FORMAT_VERSION && typeof manifest.phase_id === 'string' && typeof manifest.final_marker === 'string' &&
      Array.isArray(manifest.canonical_artifact_names) && manifest.canonical_artifact_names.every((name) => typeof name === 'string') &&
      Array.isArray(manifest.leaf_artifacts) && manifest.leaf_artifacts.every((entry) =>
        exactKeys(entry, ['audience', 'final_marker', 'identity', 'name', 'token_occurrences']) &&
        ['SHARED', 'GEMINI', 'CODEX'].includes(entry.audience) && typeof entry.final_marker === 'string' && typeof entry.name === 'string' &&
        Number.isSafeInteger(entry.token_occurrences) && entry.token_occurrences >= 0 && rawIdentityShape(entry.identity)) &&
      rawIdentityShape(manifest.codex_embedding_identity) &&
      exactKeys(manifest.approval, ['approval_contract_id', 'commitment_algorithm', 'token_sha256_commitment']) &&
      typeof manifest.approval.approval_contract_id === 'string' && typeof manifest.approval.commitment_algorithm === 'string' &&
      typeof manifest.approval.token_sha256_commitment === 'string' && /^[0-9a-f]{64}$/u.test(manifest.approval.token_sha256_commitment);
    if (!manifestShape || !canonicalJsonBuffer(manifest).equals(map.get(expectedNames[7]))) throw new Error('manifest shape or canonical form');
  } catch {
    manifest = null;
    add(diagnostics, 'OUTPUT_HASH_MISMATCH', `/artifacts/${expectedNames[7]}`, { reason: 'manifest parse/canonical form' });
  }
  if (manifest !== null) {
    if (manifest.final_marker !== marker(phaseId, 'MANIFEST') || manifest.phase_id !== phaseId || manifest.approval?.approval_contract_id !== APPROVAL_CONTRACT_ID || manifest.approval?.commitment_algorithm !== 'SHA-256' || !/^[0-9a-f]{64}$/u.test(manifest.approval?.token_sha256_commitment ?? '')) {
      add(diagnostics, 'OUTPUT_HASH_MISMATCH', '/manifest', { reason: 'manifest contract' });
    }
    const geminiText = gemini?.toString('utf8') ?? '';
    const token = geminiText.match(TOKEN_PATTERN)?.[0] ?? '';
    const commitment = createHash('sha256').update(Buffer.from(token)).digest('hex');
    if (commitment !== manifest.approval?.token_sha256_commitment) add(diagnostics, 'TOKEN_LEAKAGE', '/manifest/approval', { reason: 'token commitment mismatch' });
    const expectedLeaves = expectedNames.slice(0, 7);
    if (JSON.stringify(manifest.canonical_artifact_names) !== JSON.stringify(expectedNames) || JSON.stringify(manifest.leaf_artifacts?.map((entry) => entry.name)) !== JSON.stringify(expectedLeaves)) {
      add(diagnostics, 'OUTPUT_HASH_MISMATCH', '/manifest/leaf_artifacts', { reason: 'artifact inventory' });
    } else {
      for (const entry of manifest.leaf_artifacts) {
        const bytes = map.get(entry.name);
        const expectedOccurrences = entry.name === expectedNames[1] ? 1 : 0;
        if (!Buffer.isBuffer(bytes) || !canonicalJsonBuffer(entry.identity).equals(canonicalJsonBuffer(rawIdentity(bytes)))) add(diagnostics, 'OUTPUT_CHECKSUM_MISMATCH', `/manifest/leaf_artifacts/${entry.name}`, { reason: 'leaf identity' });
        if (entry.token_occurrences !== expectedOccurrences) add(diagnostics, 'TOKEN_OCCURRENCE_MISMATCH', `/manifest/leaf_artifacts/${entry.name}`, { reason: 'manifest token occurrence policy' });
        if (entry.final_marker !== expectedMarkers(phaseId, expectedNames).get(entry.name)) add(diagnostics, 'OUTPUT_FINAL_MARKER_MISMATCH', `/manifest/leaf_artifacts/${entry.name}`, { reason: 'manifest final marker' });
      }
      const embedded = extractEmbeddedCodex(gemini);
      if (embedded === null || !canonicalJsonBuffer(manifest.codex_embedding_identity).equals(canonicalJsonBuffer(rawIdentity(embedded)))) add(diagnostics, 'OUTPUT_EMBEDDING_MISMATCH', '/manifest/codex_embedding_identity');
    }
    if (normalizedSpec !== null && Buffer.isBuffer(codex) && Buffer.isBuffer(gemini)) {
      const declaredIrDigest = /Authority IR commitment: ([0-9a-f]{64})\n/u.exec(codex.toString('utf8'))?.[1] ?? '';
      const irDigest = sanitized === null ? '' : semanticDigest('authority-ir', canonicalJsonBuffer(reconstructAuthorityIr(normalizedSpec, sanitized)));
      if (declaredIrDigest !== irDigest) add(diagnostics, 'OUTPUT_CHECKSUM_MISMATCH', `/artifacts/${expectedNames[2]}`, { reason: 'authority IR commitment does not match canonical phase spec and snapshot evidence' });
      const codexIdentity = rawIdentity(codex);
      const expectedCodex = irDigest === '' || sanitized === null ? null : renderCodex(normalizedSpec, sanitized, irDigest);
      const expectedBasis = irDigest === '' ? '' : semanticDigest('approval-basis', approvalBasis(normalizedSpec, irDigest, codexIdentity));
      const expectedToken = `APPROVE_AIFINDER_${phaseId}_${expectedBasis}`;
      if (expectedCodex === null || !expectedCodex.equals(codex)) add(diagnostics, 'OUTPUT_NONDETERMINISTIC', `/artifacts/${expectedNames[2]}`, { reason: 'fixed Codex renderer output' });
      if (token !== expectedToken) add(diagnostics, 'TOKEN_LEAKAGE', `/artifacts/${expectedNames[1]}`, { reason: 'approval basis/token grammar' });
      if (!renderGemini(normalizedSpec, expectedToken, codex).equals(gemini)) add(diagnostics, 'OUTPUT_EMBEDDING_MISMATCH', `/artifacts/${expectedNames[1]}`, { reason: 'fixed Gemini renderer output' });
      if (!renderReadme(normalizedSpec, expectedNames).equals(map.get(expectedNames[0])) || !renderConcise(normalizedSpec).equals(map.get(expectedNames[3])) || !renderCcrTemplate(normalizedSpec).equals(map.get(expectedNames[6]))) add(diagnostics, 'OUTPUT_NONDETERMINISTIC', '/artifacts', { reason: 'fixed renderer output' });
      const expectedManifest = {
        compiler_format_version: PHASE_COMPILER_FORMAT_VERSION,
        phase_id: normalizedSpec.phase_id,
        canonical_artifact_names: expectedNames,
        leaf_artifacts: expectedNames.slice(0, 7).map((name) => ({
          name,
          audience: name.includes('-01-') ? 'GEMINI' : name.includes('-02-') || name.includes('-03-') ? 'CODEX' : 'SHARED',
          identity: rawIdentity(map.get(name)),
          final_marker: expectedMarkers(phaseId, expectedNames).get(name),
          token_occurrences: name === expectedNames[1] ? 1 : 0,
        })),
        codex_embedding_identity: codexIdentity,
        approval: {
          approval_contract_id: APPROVAL_CONTRACT_ID,
          commitment_algorithm: 'SHA-256',
          token_sha256_commitment: createHash('sha256').update(Buffer.from(expectedToken, 'utf8')).digest('hex'),
        },
        final_marker: marker(phaseId, 'MANIFEST'),
      };
      if (!canonicalJsonBuffer(expectedManifest).equals(map.get(expectedNames[7]))) add(diagnostics, 'OUTPUT_NONDETERMINISTIC', `/artifacts/${expectedNames[7]}`, { reason: 'fixed manifest derivation' });
    }
  }

  const checksum = map.get(expectedNames[8]);
  if (Buffer.isBuffer(checksum) && expectedNames.slice(0, 8).every((name) => Buffer.isBuffer(map.get(name)))) {
    const expectedChecksum = Buffer.from(expectedNames.slice(0, 8).sort(compareUtf8).map((name) => `${bufferIdentity(map.get(name)).sha256}  ${name}\n`).join(''));
    if (!checksum.equals(expectedChecksum)) add(diagnostics, 'OUTPUT_CHECKSUM_MISMATCH', `/artifacts/${expectedNames[8]}`, { reason: 'checksum inventory/order/identity' });
  } else if (!Buffer.isBuffer(checksum)) {
    add(diagnostics, 'OUTPUT_CHECKSUM_MISMATCH', `/artifacts/${expectedNames[8]}`, { reason: 'checksum artifact is absent or not bytes' });
  }
  const sorted = diagnostics.sort((left, right) => outputDiagnosticRank(left.code) - outputDiagnosticRank(right.code) || compareUtf8(left.code, right.code) || compareUtf8(left.location_json_pointer, right.location_json_pointer));
  return deepFreeze({ valid: sorted.length === 0, diagnostics: sorted });
}

export function validateArtifactBuffers(input) {
  try {
    return validateArtifactBuffersInternal(input);
  } catch {
    return invalidArtifactValidation('artifact validation failed closed');
  }
}

export function compilePhaseBundle({ authoredSpec, snapshot }) {
  const validation = validatePhaseCompilation({ authoredSpec, snapshot });
  if (!validation.valid) {
    throw new DiagnosticError(validation.primary_code, {
      sanitized_evidence: { validation_failures: validation.diagnostics.length },
    });
  }
  const spec = validation.normalized_spec;
  const names = artifactNamesForPhase(spec.phase_id);
  const snapshotProjection = sanitizedSnapshot(snapshot, spec.phase_id, spec, validation.closure.classifications);
  const ir = reconstructAuthorityIr(spec, snapshotProjection);
  const irDigest = semanticDigest('authority-ir', canonicalJsonBuffer(ir));
  const codex = renderCodex(spec, snapshotProjection, irDigest);
  const codexIdentity = rawIdentity(codex);
  const basisDigest = semanticDigest('approval-basis', approvalBasis(spec, irDigest, codexIdentity));
  const token = `APPROVE_AIFINDER_${spec.phase_id}_${basisDigest}`;
  const tokenCommitment = createHash('sha256').update(Buffer.from(token, 'utf8')).digest('hex');
  const artifacts = new Map([
    [names[0], renderReadme(spec, names)],
    [names[1], renderGemini(spec, token, codex)],
    [names[2], codex],
    [names[3], renderConcise(spec)],
    [names[4], canonicalJsonBuffer({ compiler_format_version: PHASE_COMPILER_FORMAT_VERSION, phase_spec: spec, final_marker: marker(spec.phase_id, 'PHASE_SPEC') })],
    [names[5], canonicalJsonBuffer(snapshotProjection)],
    [names[6], renderCcrTemplate(spec)],
  ]);
  const manifest = {
    compiler_format_version: PHASE_COMPILER_FORMAT_VERSION,
    phase_id: spec.phase_id,
    canonical_artifact_names: names,
    leaf_artifacts: names.slice(0, 7).map((name) => ({
      name,
      audience: name.includes('-01-') ? 'GEMINI' : name.includes('-02-') || name.includes('-03-') ? 'CODEX' : 'SHARED',
      identity: rawIdentity(artifacts.get(name)),
      final_marker: expectedMarkers(spec.phase_id, names).get(name),
      token_occurrences: name === names[1] ? 1 : 0,
    })),
    codex_embedding_identity: codexIdentity,
    approval: {
      approval_contract_id: APPROVAL_CONTRACT_ID,
      commitment_algorithm: 'SHA-256',
      token_sha256_commitment: tokenCommitment,
    },
    final_marker: marker(spec.phase_id, 'MANIFEST'),
  };
  artifacts.set(names[7], canonicalJsonBuffer(manifest));
  artifacts.set(names[8], Buffer.from(names.slice(0, 8).sort(compareUtf8).map((name) => `${bufferIdentity(artifacts.get(name)).sha256}  ${name}\n`).join('')));
  const verified = validateArtifactBuffers({ phaseId: spec.phase_id, artifacts });
  if (!verified.valid) throw new DiagnosticError(verified.diagnostics[0].code, { sanitized_evidence: { render_failures: verified.diagnostics.length } });
  const privateArtifacts = new Map([...artifacts].map(([name, bytes]) => [name, Buffer.from(bytes)]));
  return Object.freeze({
    compiler_format_version: PHASE_COMPILER_FORMAT_VERSION,
    phase_id: spec.phase_id,
    phase_prefix: `AiFinder-Phase-${spec.phase_id}`,
    allow_zip: spec.artifact_policy.allow_zip,
    artifact_names: names,
    zip_name: zipNameForPhase(spec.phase_id),
    canonical_identity: semanticDigest('canonical-bundle', canonicalJsonBuffer(names.map((name) => ({ name, ...bufferIdentity(privateArtifacts.get(name)) })))),
    readArtifact(name) {
      const bytes = privateArtifacts.get(name);
      if (bytes === undefined) throw new TypeError('unknown canonical artifact');
      return Buffer.from(bytes);
    },
  });
}
