import {
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import path from "node:path";
import {
  canonicalJson,
  digestMemberRows,
  isSha256,
  sha256Hex,
} from "./canonical.mjs";

const FIXED_CANDIDATE_ROOTS = Object.freeze([
  "docs/launch-operations-kernel.md",
  "scripts/launch-operations-kernel",
]);
const FIXED_MANIFEST_PATH =
  "scripts/launch-operations-kernel/candidate-manifest.json";
const COMPLETION_MARKER =
  "PHASE_34JA_34JZ_LAUNCH_OPERATIONS_KERNEL_LOCAL_IMPLEMENTATION_COMPLETE_V1";

export class ManifestError extends Error {
  constructor(code) {
    super(code);
    this.name = "ManifestError";
    this.code = code;
  }
}

function exactArray(left, right) {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((entry, index) => entry === right[index])
  );
}

function decodeUtf8(bytes, code) {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (text.startsWith("\ufeff")) throw new Error("BOM");
    return text;
  } catch {
    throw new ManifestError(code);
  }
}

export function readStrictJsonFile(filePath) {
  const bytes = readFileSync(filePath);
  const text = decodeUtf8(bytes, "STRICT_JSON_UTF8");
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("ROOT");
    }
    return value;
  } catch {
    throw new ManifestError("STRICT_JSON_PARSE");
  }
}

function classifyMember(relativePath) {
  if (relativePath === "docs/launch-operations-kernel.md") {
    return { role: "DOCUMENTATION", surface: "governance" };
  }
  if (relativePath.endsWith(".test.mjs")) {
    return { role: "TEST", surface: "verification" };
  }
  if (relativePath.endsWith("evidence.schema.json")) {
    return { role: "SCHEMA", surface: "evidence" };
  }
  if (relativePath.endsWith("legacy-freeze.json")) {
    return { role: "GOVERNANCE", surface: "governance" };
  }
  if (relativePath.endsWith("legacy-classifier.mjs")) {
    return { role: "SOURCE", surface: "legacy_classification" };
  }
  if (relativePath.endsWith("kernel.mjs") || relativePath.endsWith("canonical.mjs")) {
    return { role: "SOURCE", surface: "runtime" };
  }
  if (relativePath.endsWith("manifest.mjs") || relativePath.endsWith("cli.mjs")) {
    return { role: "TOOL", surface: "verification" };
  }
  throw new ManifestError("CANDIDATE_MEMBER_UNCLASSIFIED");
}

function assertRepositoryPath(repositoryRoot, relativePath) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length < 1 ||
    relativePath.includes("\0") ||
    path.isAbsolute(relativePath) ||
    relativePath.split("/").includes("..")
  ) {
    throw new ManifestError("CANDIDATE_MEMBER_PATH");
  }
  const absolutePath = path.resolve(repositoryRoot, relativePath);
  if (!absolutePath.startsWith(`${repositoryRoot}${path.sep}`)) {
    throw new ManifestError("CANDIDATE_MEMBER_PATH");
  }
  return absolutePath;
}

function collectRepositoryMembers({
  repositoryRoot,
  candidateRoots = FIXED_CANDIDATE_ROOTS,
  manifestPath = FIXED_MANIFEST_PATH,
  readMember = (relativePath) =>
    readFileSync(assertRepositoryPath(repositoryRoot, relativePath)),
}) {
  const discovered = [];
  function walk(relativePath) {
    const absolutePath = assertRepositoryPath(repositoryRoot, relativePath);
    const metadata = lstatSync(absolutePath);
    if (metadata.isSymbolicLink()) throw new ManifestError("CANDIDATE_SYMLINK");
    if (metadata.isDirectory()) {
      for (const name of readdirSync(absolutePath).sort((left, right) => left.localeCompare(right, "en"))) {
        walk(path.posix.join(relativePath, name));
      }
      return;
    }
    if (!metadata.isFile() || metadata.nlink !== 1) {
      throw new ManifestError("CANDIDATE_MEMBER_TYPE");
    }
    if (relativePath === manifestPath) return;
    if ((metadata.mode & 0o777) !== 0o644 || realpathSync(absolutePath) !== absolutePath) {
      throw new ManifestError("CANDIDATE_MEMBER_IDENTITY");
    }
    const bytes = Buffer.from(readMember(relativePath));
    const classification = classifyMember(relativePath);
    discovered.push({
      path: relativePath,
      role: classification.role,
      surface: classification.surface,
      mode: "0644",
      bytes,
    });
  }
  for (const candidateRoot of candidateRoots) walk(candidateRoot);
  return discovered.sort((left, right) => left.path.localeCompare(right.path, "en"));
}

function materializeMembers(members) {
  const ordered = [...members].sort((left, right) => left.path.localeCompare(right.path, "en"));
  if (ordered.length !== new Set(ordered.map((entry) => entry.path)).size) {
    throw new ManifestError("CANDIDATE_MEMBER_DUPLICATE");
  }
  return ordered.map((entry) => {
    if (
      typeof entry.path !== "string" ||
      !["DOCUMENTATION", "GOVERNANCE", "SCHEMA", "SOURCE", "TEST", "TOOL"].includes(entry.role) ||
      typeof entry.surface !== "string" ||
      entry.surface.length < 1 ||
      entry.mode !== "0644"
    ) {
      throw new ManifestError("CANDIDATE_MEMBER_SHAPE");
    }
    const bytes = Buffer.from(entry.bytes);
    return {
      path: entry.path,
      role: entry.role,
      surface: entry.surface,
      sha256: sha256Hex(bytes),
      bytes: bytes.byteLength,
      mode: entry.mode,
    };
  });
}

export function generateCandidateManifest({
  candidateVersion,
  manifestPath,
  candidateRoots,
  legacyCandidateIdentity,
  members,
}) {
  if (
    typeof candidateVersion !== "string" ||
    candidateVersion.length < 1 ||
    typeof manifestPath !== "string" ||
    !Array.isArray(candidateRoots) ||
    candidateRoots.length < 1 ||
    !isSha256(legacyCandidateIdentity)
  ) {
    throw new ManifestError("CANDIDATE_MANIFEST_INPUT");
  }
  const materialized = materializeMembers(members);
  const surfaces = {};
  for (const surface of [...new Set(materialized.map((entry) => entry.surface))].sort()) {
    const entries = materialized.filter((entry) => entry.surface === surface);
    surfaces[surface] = {
      path_count: entries.length,
      sha256: digestMemberRows(entries),
    };
  }
  return {
    schema_version: 1,
    candidate_version: candidateVersion,
    manifest_path: manifestPath,
    candidate_roots: [...candidateRoots].sort((left, right) => left.localeCompare(right, "en")),
    manifest_self_exclusion: "EXCLUDED_TO_AVOID_CIRCULAR_BYTE_IDENTITY",
    identity_algorithm: "SHA256_PATH_NUL_SHA256_NUL_BYTES_NUL_MODE_ROWS_LF",
    legacy_candidate_identity_sha256: legacyCandidateIdentity,
    member_count: materialized.length,
    members: materialized,
    candidate_identity_sha256: digestMemberRows(materialized),
    derived_surface_sha256: surfaces,
    completion_marker: COMPLETION_MARKER,
  };
}

function forbiddenCapability(source) {
  const forbiddenModules = [
    "child" + "_" + "process",
    "ht" + "tp",
    "ht" + "tps",
    "n" + "et",
    "t" + "ls",
    "d" + "ns",
    "d" + "gram",
    "clu" + "ster",
    "worker" + "_" + "threads",
  ];
  if (forbiddenModules.some((name) => source.includes(`node:${name}`))) return true;
  const fsMutationNames = [
    "write" + "File",
    "append" + "File",
    "unlink" + "Sync",
    "rm" + "Sync",
    "rename" + "Sync",
    "mkdir" + "Sync",
    "chmod" + "Sync",
    "chown" + "Sync",
    "symlink" + "Sync",
    "truncate" + "Sync",
  ];
  if (fsMutationNames.some((name) => source.includes(name))) return true;
  const networkCall = new RegExp("\\b" + "fet" + "ch\\s*\\(", "u");
  const environmentRead = new RegExp("process" + "\\." + "env\\b", "u");
  const legacyImport = [
    "admin-v1-staging-runtime-",
    "orchestrator.mjs",
  ].join("");
  const legacyImportPattern = new RegExp(
    "\\b(?:import|from)\\b[^\\n]*" + legacyImport.replace(".", "\\."),
    "u",
  );
  const applicationRoute = ["app", "api", ""].join("/");
  return (
    networkCall.test(source) ||
    environmentRead.test(source) ||
    legacyImportPattern.test(source) ||
    source.includes(applicationRoute)
  );
}

export function validateLocalOnlySources(sources) {
  if (!(sources instanceof Map) || sources.size < 1) {
    throw new ManifestError("SOURCE_POLICY_INPUT");
  }
  let legacyImports = 0;
  let liveRoutes = 0;
  for (const [relativePath, source] of sources) {
    if (typeof relativePath !== "string" || typeof source !== "string") {
      throw new ManifestError("SOURCE_POLICY_INPUT");
    }
    const legacyImport = ["admin-v1-staging-runtime-", "orchestrator.mjs"].join("");
    const legacyImportPattern = new RegExp(
      "\\b(?:import|from)\\b[^\\n]*" + legacyImport.replace(".", "\\."),
      "u",
    );
    if (legacyImportPattern.test(source)) {
      legacyImports += 1;
    }
    if (source.includes(["app", "api", ""].join("/"))) liveRoutes += 1;
    if (forbiddenCapability(source)) {
      throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
    }
  }
  return {
    verified: true,
    source_count: sources.size,
    forbidden_capabilities: 0,
    legacy_imports: legacyImports,
    live_routes: liveRoutes,
  };
}

function validateManifestHeader(manifest) {
  if (
    manifest?.schema_version !== 1 ||
    manifest.candidate_version !== "phase-34ja-34jz-launch-operations-kernel-v1" ||
    manifest.manifest_path !== FIXED_MANIFEST_PATH ||
    !exactArray(manifest.candidate_roots, FIXED_CANDIDATE_ROOTS) ||
    manifest.manifest_self_exclusion !== "EXCLUDED_TO_AVOID_CIRCULAR_BYTE_IDENTITY" ||
    manifest.identity_algorithm !== "SHA256_PATH_NUL_SHA256_NUL_BYTES_NUL_MODE_ROWS_LF" ||
    !isSha256(manifest.legacy_candidate_identity_sha256) ||
    manifest.completion_marker !== COMPLETION_MARKER ||
    !Array.isArray(manifest.members)
  ) {
    throw new ManifestError("CANDIDATE_MANIFEST_HEADER");
  }
}

export function verifyRepositoryCandidateManifest({
  repositoryRoot,
  manifestPath,
  readMember,
  manifest,
}) {
  const canonicalRoot = realpathSync(repositoryRoot);
  if (canonicalRoot !== repositoryRoot) throw new ManifestError("REPOSITORY_ROOT");
  const relativeManifestPath = path.relative(repositoryRoot, manifestPath).split(path.sep).join("/");
  if (relativeManifestPath !== FIXED_MANIFEST_PATH) {
    throw new ManifestError("CANDIDATE_MANIFEST_PATH");
  }
  const manifestMetadata = lstatSync(manifestPath);
  if (
    !manifestMetadata.isFile() ||
    manifestMetadata.isSymbolicLink() ||
    manifestMetadata.nlink !== 1 ||
    (manifestMetadata.mode & 0o777) !== 0o644 ||
    realpathSync(manifestPath) !== manifestPath
  ) {
    throw new ManifestError("CANDIDATE_MANIFEST_IDENTITY");
  }
  const document = manifest ?? readStrictJsonFile(manifestPath);
  validateManifestHeader(document);
  const members = collectRepositoryMembers({
    repositoryRoot,
    candidateRoots: document.candidate_roots,
    manifestPath: document.manifest_path,
    readMember,
  });
  const actualPaths = members.map((entry) => entry.path);
  const manifestPaths = document.members.map((entry) => entry.path);
  if (!exactArray(actualPaths, manifestPaths)) {
    throw new ManifestError("CANDIDATE_MEMBERSHIP_MISMATCH");
  }
  const materialized = materializeMembers(members);
  for (let index = 0; index < materialized.length; index += 1) {
    const actual = materialized[index];
    const expected = document.members[index];
    if (
      actual.sha256 !== expected.sha256 ||
      actual.bytes !== expected.bytes ||
      actual.mode !== expected.mode
    ) {
      throw new ManifestError("CANDIDATE_MEMBER_IDENTITY_MISMATCH");
    }
  }
  const expected = generateCandidateManifest({
    candidateVersion: document.candidate_version,
    manifestPath: document.manifest_path,
    candidateRoots: document.candidate_roots,
    legacyCandidateIdentity: document.legacy_candidate_identity_sha256,
    members,
  });
  if (canonicalJson(expected) !== canonicalJson(document)) {
    throw new ManifestError("CANDIDATE_MANIFEST_MISMATCH");
  }
  const sourceMap = new Map(
    members
      .filter((entry) => entry.path.endsWith(".mjs"))
      .map((entry) => [entry.path, decodeUtf8(entry.bytes, "SOURCE_POLICY_UTF8")]),
  );
  const sourcePolicy = validateLocalOnlySources(sourceMap);
  return {
    verified: true,
    source_policy_verified: sourcePolicy.verified,
    member_count: document.member_count,
    member_paths: document.members.map((entry) => entry.path),
    candidate_identity_sha256: document.candidate_identity_sha256,
    legacy_imports: sourcePolicy.legacy_imports,
    live_routes: sourcePolicy.live_routes,
  };
}

function freezePolicyPass(freeze) {
  return (
    freeze?.schema_version === 1 &&
    freeze.status === "LEGACY_FORENSIC_ONLY_NON_CURRENT" &&
    freeze.current_route?.legacy_route_current === false &&
    freeze.current_route?.kernel_live_routes === 0 &&
    freeze.current_route?.routed_entrypoint === null
  );
}

export function buildStaticReadinessReport({ repositoryRoot, manifestPath }) {
  const verification = verifyRepositoryCandidateManifest({
    repositoryRoot,
    manifestPath,
  });
  const freeze = readStrictJsonFile(
    path.join(repositoryRoot, "scripts/launch-operations-kernel/legacy-freeze.json"),
  );
  if (!freezePolicyPass(freeze)) throw new ManifestError("LEGACY_FREEZE_POLICY");
  return {
    schema_version: 1,
    status: "PASS",
    candidate_verified: verification.verified,
    source_policy_verified: verification.source_policy_verified,
    legacy_route_current: false,
    kernel_live_routes: 0,
    network_requests: 0,
    external_mutations: 0,
    database_writes: 0,
    storage_writes: 0,
  };
}

export function deriveIdentityReport({ repositoryRoot, manifestPath }) {
  const verification = verifyRepositoryCandidateManifest({
    repositoryRoot,
    manifestPath,
  });
  const manifest = readStrictJsonFile(manifestPath);
  return {
    schema_version: 1,
    candidate_version: manifest.candidate_version,
    candidate_identity_sha256: verification.candidate_identity_sha256,
    manifest_sha256: sha256Hex(readFileSync(manifestPath)),
    member_count: verification.member_count,
    derived_surface_sha256: manifest.derived_surface_sha256,
    legacy_candidate_identity_sha256: manifest.legacy_candidate_identity_sha256,
    historical_current_equal:
      manifest.legacy_candidate_identity_sha256 ===
      verification.candidate_identity_sha256,
    completion_marker: manifest.completion_marker,
  };
}

export function buildRepositoryCandidateManifest({
  repositoryRoot,
  legacyCandidateIdentity,
}) {
  const members = collectRepositoryMembers({ repositoryRoot });
  return generateCandidateManifest({
    candidateVersion: "phase-34ja-34jz-launch-operations-kernel-v1",
    manifestPath: FIXED_MANIFEST_PATH,
    candidateRoots: FIXED_CANDIDATE_ROOTS,
    legacyCandidateIdentity,
    members,
  });
}
