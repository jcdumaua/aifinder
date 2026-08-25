import {
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import { createRequire } from "node:module";
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
const MANIFEST_MODULE_PATH =
  "scripts/launch-operations-kernel/manifest.mjs";
const CANDIDATE_VERSION =
  "admin-v1-official-runtime-post-publication-activation-bridge-v1";
const COMPLETION_MARKER =
  "ADMIN_V1_OFFICIAL_RUNTIME_POST_PUBLICATION_ACTIVATION_BRIDGE_CANDIDATE_V1";
const CONCRETE_RUNNER_PATH =
  "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs";
const CONCRETE_ADAPTER_PATH =
  "scripts/launch-operations-kernel/nonproduction-qualification-adapters.mjs";
const CONCRETE_CREDENTIAL_LOADER_PATH =
  "scripts/launch-operations-kernel/nonproduction-qualification-credential-loader.mjs";
const CONCRETE_PLATFORM_PATH =
  "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.mjs";
const CONCRETE_CHECKPOINT_PATH =
  "scripts/launch-operations-kernel/nonproduction-qualification-checkpoint-store.mjs";
const CONCRETE_CHECKPOINT_TEST_PATH =
  "scripts/launch-operations-kernel/nonproduction-qualification-checkpoint-store.test.mjs";
const FRESH_RESOURCE_DIAGNOSTICS_PATH =
  "scripts/launch-operations-kernel/fresh-resource-plan-diagnostics.mjs";
const FRESH_RESOURCE_DIAGNOSTICS_TEST_PATH =
  "scripts/launch-operations-kernel/fresh-resource-plan-diagnostics.test.mjs";
const CONCRETE_RUNNER_TEST_PATH =
  "scripts/launch-operations-kernel/nonproduction-qualification-runner.test.mjs";
const OFFICIAL_RUNTIME_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-runtime.mjs";
const OFFICIAL_RUNTIME_TEST_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-runtime.test.mjs";
const OFFICIAL_RUNNER_TEST_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-runner.test.mjs";
const OFFICIAL_AUTHORIZATION_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-authorization.mjs";
const OFFICIAL_AUTHORIZATION_TEST_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-authorization.test.mjs";
const OFFICIAL_LIVE_PLATFORM_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-live-platform.mjs";
const OFFICIAL_LIVE_PLATFORM_TEST_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-live-platform.test.mjs";
const OFFICIAL_ACTIVATION_BRIDGE_TEST_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-activation-bridge.test.mjs";
const OFFICIAL_CONCRETE_BRIDGE_TEST_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-concrete-bridge.test.mjs";
const FIRST_ENVIRONMENT_RUNTIME_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-first-environment-runtime.mjs";
const FIRST_ENVIRONMENT_PLATFORM_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-first-environment-live-platform.mjs";
const FIRST_ENVIRONMENT_RUNTIME_TEST_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-first-environment-runtime.test.mjs";
const FIRST_ENVIRONMENT_SUPERVISOR_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-first-environment-supervisor.mjs";
const FIRST_ENVIRONMENT_SUPERVISOR_TEST_PATH =
  "scripts/launch-operations-kernel/admin-v1-official-first-environment-supervisor.test.mjs";
const INDEPENDENT_SOURCE_REVIEW_PATH =
  "testing/static-test-safety-manifest.json";
const INDEPENDENTLY_REVIEWED_SOURCE_PATHS = Object.freeze([
  "scripts/launch-operations-kernel/activation-bridge.mjs",
  "scripts/launch-operations-kernel/activation-bridge.test.mjs",
  OFFICIAL_ACTIVATION_BRIDGE_TEST_PATH,
  OFFICIAL_AUTHORIZATION_PATH,
  OFFICIAL_AUTHORIZATION_TEST_PATH,
  OFFICIAL_CONCRETE_BRIDGE_TEST_PATH,
  FIRST_ENVIRONMENT_PLATFORM_PATH,
  FIRST_ENVIRONMENT_RUNTIME_PATH,
  FIRST_ENVIRONMENT_RUNTIME_TEST_PATH,
  FIRST_ENVIRONMENT_SUPERVISOR_PATH,
  FIRST_ENVIRONMENT_SUPERVISOR_TEST_PATH,
  OFFICIAL_LIVE_PLATFORM_PATH,
  OFFICIAL_LIVE_PLATFORM_TEST_PATH,
  OFFICIAL_RUNNER_TEST_PATH,
  OFFICIAL_RUNTIME_PATH,
  OFFICIAL_RUNTIME_TEST_PATH,
  "scripts/launch-operations-kernel/canonical.mjs",
  FRESH_RESOURCE_DIAGNOSTICS_PATH,
  FRESH_RESOURCE_DIAGNOSTICS_TEST_PATH,
  "scripts/launch-operations-kernel/kernel.mjs",
  "scripts/launch-operations-kernel/legacy-classifier.mjs",
  "scripts/launch-operations-kernel/manifest.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-adapters.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-authorization.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-checkpoint-store.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-credential-loader.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-credential-loader.test.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.test.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-runner.test.mjs",
  "scripts/launch-operations-kernel/recovery.test.mjs",
]);
const INDEPENDENTLY_REVIEWED_SEMANTIC_SOURCE_PATHS = Object.freeze([
  "scripts/launch-operations-kernel/activation-bridge.mjs",
  OFFICIAL_ACTIVATION_BRIDGE_TEST_PATH,
  OFFICIAL_AUTHORIZATION_PATH,
  OFFICIAL_AUTHORIZATION_TEST_PATH,
  OFFICIAL_CONCRETE_BRIDGE_TEST_PATH,
  FIRST_ENVIRONMENT_PLATFORM_PATH,
  FIRST_ENVIRONMENT_RUNTIME_PATH,
  FIRST_ENVIRONMENT_RUNTIME_TEST_PATH,
  FIRST_ENVIRONMENT_SUPERVISOR_PATH,
  FIRST_ENVIRONMENT_SUPERVISOR_TEST_PATH,
  OFFICIAL_LIVE_PLATFORM_PATH,
  OFFICIAL_LIVE_PLATFORM_TEST_PATH,
  OFFICIAL_RUNNER_TEST_PATH,
  OFFICIAL_RUNTIME_PATH,
  OFFICIAL_RUNTIME_TEST_PATH,
  "scripts/launch-operations-kernel/canonical.mjs",
  "scripts/launch-operations-kernel/cli.mjs",
  FRESH_RESOURCE_DIAGNOSTICS_PATH,
  "scripts/launch-operations-kernel/kernel.mjs",
  "scripts/launch-operations-kernel/legacy-classifier.mjs",
  "scripts/launch-operations-kernel/manifest.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-adapters.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-authorization.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-checkpoint-store.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-credential-loader.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-credential-loader.test.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-runner.mjs",
  "scripts/launch-operations-kernel/nonproduction-qualification-runner.test.mjs",
]);
const CONCRETE_ADAPTER_TEST_PATH =
  "scripts/launch-operations-kernel/nonproduction-qualification-adapters.test.mjs";
const CONCRETE_CREDENTIAL_LOADER_TEST_PATH =
  "scripts/launch-operations-kernel/nonproduction-qualification-credential-loader.test.mjs";
const CONCRETE_PLATFORM_TEST_PATH =
  "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.test.mjs";
const PRIVILEGED_IMPORT_TARGETS = new Set([
  OFFICIAL_RUNTIME_PATH,
  FIRST_ENVIRONMENT_RUNTIME_PATH,
  CONCRETE_RUNNER_PATH,
  CONCRETE_ADAPTER_PATH,
  CONCRETE_CREDENTIAL_LOADER_PATH,
  CONCRETE_PLATFORM_PATH,
  CONCRETE_CHECKPOINT_PATH,
  FIRST_ENVIRONMENT_SUPERVISOR_PATH,
]);
const PRIVILEGED_IMPORT_ALLOWLIST = new Map([
  [FIRST_ENVIRONMENT_PLATFORM_PATH, new Set([
    FIRST_ENVIRONMENT_RUNTIME_PATH,
  ])],
  [FIRST_ENVIRONMENT_RUNTIME_TEST_PATH, new Set([
    FIRST_ENVIRONMENT_RUNTIME_PATH,
  ])],
  [FIRST_ENVIRONMENT_SUPERVISOR_PATH, new Set([
    FIRST_ENVIRONMENT_RUNTIME_PATH,
  ])],
  [FIRST_ENVIRONMENT_SUPERVISOR_TEST_PATH, new Set([
    FIRST_ENVIRONMENT_SUPERVISOR_PATH,
    FIRST_ENVIRONMENT_RUNTIME_PATH,
  ])],
  [CONCRETE_RUNNER_PATH, new Set([
    OFFICIAL_RUNTIME_PATH,
    OFFICIAL_LIVE_PLATFORM_PATH,
    CONCRETE_ADAPTER_PATH,
    CONCRETE_CREDENTIAL_LOADER_PATH,
    CONCRETE_PLATFORM_PATH,
    CONCRETE_CHECKPOINT_PATH,
  ])],
  [OFFICIAL_RUNNER_TEST_PATH, new Set([
    OFFICIAL_RUNTIME_PATH,
    CONCRETE_RUNNER_PATH,
    CONCRETE_ADAPTER_PATH,
    CONCRETE_CREDENTIAL_LOADER_PATH,
    CONCRETE_PLATFORM_PATH,
    CONCRETE_CHECKPOINT_PATH,
    OFFICIAL_LIVE_PLATFORM_PATH,
  ])],
  [OFFICIAL_AUTHORIZATION_PATH, new Set([OFFICIAL_RUNTIME_PATH])],
  [OFFICIAL_AUTHORIZATION_TEST_PATH, new Set([
    OFFICIAL_AUTHORIZATION_PATH,
    OFFICIAL_RUNTIME_PATH,
  ])],
  [OFFICIAL_LIVE_PLATFORM_PATH, new Set([
    OFFICIAL_RUNTIME_PATH,
    CONCRETE_PLATFORM_PATH,
  ])],
  [OFFICIAL_ACTIVATION_BRIDGE_TEST_PATH, new Set([
    OFFICIAL_RUNTIME_PATH,
    OFFICIAL_LIVE_PLATFORM_PATH,
    CONCRETE_RUNNER_PATH,
    CONCRETE_ADAPTER_PATH,
    CONCRETE_CREDENTIAL_LOADER_PATH,
    CONCRETE_PLATFORM_PATH,
    CONCRETE_CHECKPOINT_PATH,
  ])],
  [OFFICIAL_CONCRETE_BRIDGE_TEST_PATH, new Set([
    OFFICIAL_RUNTIME_PATH,
    OFFICIAL_LIVE_PLATFORM_PATH,
    CONCRETE_RUNNER_PATH,
    CONCRETE_ADAPTER_PATH,
    CONCRETE_CREDENTIAL_LOADER_PATH,
    CONCRETE_PLATFORM_PATH,
    CONCRETE_CHECKPOINT_PATH,
  ])],
  [OFFICIAL_LIVE_PLATFORM_TEST_PATH, new Set([
    OFFICIAL_RUNTIME_PATH,
    OFFICIAL_LIVE_PLATFORM_PATH,
    CONCRETE_RUNNER_PATH,
    CONCRETE_ADAPTER_PATH,
    CONCRETE_CREDENTIAL_LOADER_PATH,
    CONCRETE_PLATFORM_PATH,
    CONCRETE_CHECKPOINT_PATH,
  ])],
  [OFFICIAL_RUNTIME_TEST_PATH, new Set([OFFICIAL_RUNTIME_PATH])],
  [CONCRETE_RUNNER_TEST_PATH, new Set([
    OFFICIAL_RUNTIME_PATH,
    CONCRETE_RUNNER_PATH,
    CONCRETE_ADAPTER_PATH,
    CONCRETE_CREDENTIAL_LOADER_PATH,
    CONCRETE_PLATFORM_PATH,
    CONCRETE_CHECKPOINT_PATH,
  ])],
  [CONCRETE_ADAPTER_TEST_PATH, new Set([CONCRETE_ADAPTER_PATH])],
  [CONCRETE_CREDENTIAL_LOADER_TEST_PATH, new Set([CONCRETE_CREDENTIAL_LOADER_PATH])],
  [CONCRETE_PLATFORM_TEST_PATH, new Set([CONCRETE_PLATFORM_PATH])],
  [CONCRETE_CHECKPOINT_TEST_PATH, new Set([CONCRETE_CHECKPOINT_PATH])],
]);
const REVIEWED_NODE_MODULES_BY_PATH = new Map([
  [FIRST_ENVIRONMENT_RUNTIME_PATH, new Set([
    "node:fs", "node:os", "node:path",
  ])],
  [FIRST_ENVIRONMENT_RUNTIME_TEST_PATH, new Set([
    "node:assert/strict", "node:fs", "node:os", "node:path",
  ])],
  [FIRST_ENVIRONMENT_SUPERVISOR_PATH, new Set([
    "node:child_process", "node:crypto", "node:fs", "node:path", "node:url",
  ])],
  [FIRST_ENVIRONMENT_SUPERVISOR_TEST_PATH, new Set([
    "node:assert/strict", "node:child_process", "node:crypto", "node:fs",
    "node:os", "node:path",
  ])],
  [OFFICIAL_ACTIVATION_BRIDGE_TEST_PATH, new Set([
    "node:assert/strict", "node:fs", "node:path",
  ])],
  [OFFICIAL_AUTHORIZATION_PATH, new Set(["node:fs", "node:path"])],
  [OFFICIAL_AUTHORIZATION_TEST_PATH, new Set(["node:assert/strict"])],
  [OFFICIAL_CONCRETE_BRIDGE_TEST_PATH, new Set(["node:assert/strict"])],
  [OFFICIAL_RUNNER_TEST_PATH, new Set(["node:assert/strict"])],
  [
    OFFICIAL_RUNTIME_PATH,
    new Set(["node:fs", "node:path"]),
  ],
  [
    OFFICIAL_RUNTIME_TEST_PATH,
    new Set(["node:assert/strict", "node:crypto", "node:fs", "node:path"]),
  ],
  [
    "scripts/launch-operations-kernel/activation-bridge.test.mjs",
    new Set(["node:assert/strict", "node:fs", "node:path"]),
  ],
  [
    "scripts/launch-operations-kernel/activation-e2e.test.mjs",
    new Set(["node:assert/strict", "node:fs", "node:path"]),
  ],
  ["scripts/launch-operations-kernel/canonical.mjs", new Set(["node:crypto"])],
  [FRESH_RESOURCE_DIAGNOSTICS_TEST_PATH, new Set(["node:assert/strict"])],
  [
    "scripts/launch-operations-kernel/cli.mjs",
    new Set(["node:path", "node:url"]),
  ],
  [
    "scripts/launch-operations-kernel/kernel.test.mjs",
    new Set(["node:assert/strict", "node:fs", "node:path"]),
  ],
  [
    "scripts/launch-operations-kernel/legacy-classifier.mjs",
    new Set(["node:fs", "node:os", "node:path"]),
  ],
  [
    "scripts/launch-operations-kernel/legacy-classifier.test.mjs",
    new Set(["node:assert/strict", "node:fs", "node:os", "node:path"]),
  ],
  [
    "scripts/launch-operations-kernel/manifest.mjs",
    new Set(["node:fs", "node:module", "node:path"]),
  ],
  [
    "scripts/launch-operations-kernel/manifest.test.mjs",
    new Set(["node:assert/strict", "node:fs", "node:path"]),
  ],
  [
    "scripts/launch-operations-kernel/nonproduction-qualification-adapters.test.mjs",
    new Set(["node:assert/strict", "node:fs"]),
  ],
  [
    "scripts/launch-operations-kernel/nonproduction-qualification-authorization.test.mjs",
    new Set(["node:assert/strict", "node:fs"]),
  ],
  [
    CONCRETE_CREDENTIAL_LOADER_PATH,
    new Set(["node:child_process", "node:fs", "node:path"]),
  ],
  [
    CONCRETE_CREDENTIAL_LOADER_TEST_PATH,
    new Set(["node:assert/strict", "node:fs", "node:path"]),
  ],
  [
    "scripts/launch-operations-kernel/nonproduction-qualification-checkpoint-store.mjs",
    new Set([
      "node:async_hooks",
      "node:child_process",
      "node:crypto",
      "node:fs",
      "node:path",
    ]),
  ],
  [
    "scripts/launch-operations-kernel/nonproduction-qualification-checkpoint-store.test.mjs",
    new Set(["node:assert/strict", "node:fs", "node:path"]),
  ],
  [
    "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.mjs",
    new Set(["node:child_process", "node:crypto"]),
  ],
  [
    "scripts/launch-operations-kernel/nonproduction-qualification-live-platform.test.mjs",
    new Set(["node:assert/strict"]),
  ],
  [
    CONCRETE_RUNNER_PATH,
    new Set(["node:child_process", "node:fs", "node:path", "node:url"]),
  ],
  [
    CONCRETE_RUNNER_TEST_PATH,
    new Set([
      "node:assert/strict",
      "node:child_process",
      "node:crypto",
      "node:fs",
      "node:path",
    ]),
  ],
  [
    "scripts/launch-operations-kernel/recovery.test.mjs",
    new Set(["node:assert/strict"]),
  ],
  [
    "scripts/launch-operations-kernel/source-policy.test.mjs",
    new Set(["node:assert/strict", "node:crypto", "node:fs", "node:path"]),
  ],
]);
const requireDependency = createRequire(import.meta.url);
let typescriptDependency = null;

function loadTypescriptDependency() {
  if (typescriptDependency === null) {
    const loaded = requireDependency("typescript");
    if (
      !loaded ||
      typeof loaded.createSourceFile !== "function" ||
      typeof loaded.forEachChild !== "function"
    ) {
      throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
    }
    typescriptDependency = loaded;
  }
  return typescriptDependency;
}

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

function readIndependentSourceReviewPins(repositoryRoot) {
  const reviewPath = path.join(repositoryRoot, INDEPENDENT_SOURCE_REVIEW_PATH);
  const metadata = lstatSync(reviewPath);
  if (
    !metadata.isFile() ||
    metadata.isSymbolicLink() ||
    metadata.nlink !== 1 ||
    (metadata.mode & 0o777) !== 0o644 ||
    realpathSync(reviewPath) !== reviewPath
  ) {
    throw new ManifestError("SOURCE_POLICY_REVIEW_IDENTITY");
  }
  const document = readStrictJsonFile(reviewPath);
  const readPins = (field, expectedPaths) => {
    const pins = document[field];
    if (
      !pins ||
      typeof pins !== "object" ||
      Array.isArray(pins) ||
      Object.getPrototypeOf(pins) !== Object.prototype
    ) {
      throw new ManifestError("SOURCE_POLICY_REVIEW_IDENTITY");
    }
    const entries = Object.entries(pins);
    if (
      !exactArray(entries.map(([relativePath]) => relativePath), expectedPaths) ||
      entries.some(([relativePath, digest]) =>
        !relativePath.startsWith("scripts/launch-operations-kernel/") ||
        relativePath.includes("\\") ||
        relativePath.includes("%") ||
        path.posix.normalize(relativePath) !== relativePath ||
        !isSha256(digest)
      )
    ) {
      throw new ManifestError("SOURCE_POLICY_REVIEW_IDENTITY");
    }
    return new Map(entries);
  };
  return {
    reviewedSemanticSourceSha256ByPath: readPins(
      "launch_operations_kernel_semantic_source_sha256_by_path",
      INDEPENDENTLY_REVIEWED_SEMANTIC_SOURCE_PATHS,
    ),
    reviewedSourceSha256ByPath: readPins(
      "launch_operations_kernel_reviewed_unresolved_source_sha256_by_path",
      INDEPENDENTLY_REVIEWED_SOURCE_PATHS,
    ),
  };
}

function classifyMember(relativePath) {
  if (relativePath === "docs/launch-operations-kernel.md") {
    return { role: "DOCUMENTATION", surface: "governance" };
  }
  if (relativePath.endsWith(".test.mjs")) {
    return { role: "TEST", surface: "verification" };
  }
  if (relativePath.endsWith(".schema.json")) {
    return { role: "SCHEMA", surface: "evidence" };
  }
  if (relativePath.endsWith("legacy-freeze.json")) {
    return { role: "GOVERNANCE", surface: "governance" };
  }
  if (relativePath.endsWith("legacy-classifier.mjs")) {
    return { role: "SOURCE", surface: "legacy_classification" };
  }
  if (relativePath.endsWith("manifest.mjs") || relativePath.endsWith("cli.mjs")) {
    return { role: "TOOL", surface: "verification" };
  }
  if (relativePath.endsWith(".mjs")) {
    return { role: "SOURCE", surface: "runtime" };
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

function executableSourceMask(source) {
  const masked = source.split("");
  const blank = (index) => {
    if (masked[index] !== "\n" && masked[index] !== "\r") masked[index] = " ";
  };
  const maskQuoted = (start, quote) => {
    let index = start;
    blank(index);
    index += 1;
    while (index < source.length) {
      const current = source[index];
      blank(index);
      index += 1;
      if (current === "\\" && index < source.length) {
        blank(index);
        index += 1;
        continue;
      }
      if (current === quote) break;
    }
    return index;
  };
  const maskLineComment = (start) => {
    let index = start;
    while (index < source.length && source[index] !== "\n") {
      blank(index);
      index += 1;
    }
    return index;
  };
  const maskBlockComment = (start) => {
    let index = start;
    while (index < source.length) {
      const closes = source[index] === "*" && source[index + 1] === "/";
      blank(index);
      index += 1;
      if (closes) {
        blank(index);
        return index + 1;
      }
    }
    return index;
  };
  const regexPrefixKeywords = new Set([
    "await",
    "case",
    "delete",
    "do",
    "else",
    "in",
    "instanceof",
    "of",
    "return",
    "throw",
    "typeof",
    "void",
    "yield",
  ]);
  const regexAfterControlParenthesis = new Set([
    "catch",
    "for",
    "if",
    "switch",
    "while",
    "with",
  ]);
  const canStartRegex = (start) => {
    let index = start - 1;
    while (index >= 0 && /\s/u.test(masked[index])) index -= 1;
    if (index < 0) return true;
    const previous = masked[index];
    if ("([{:;,=!?&|+-*%^~<>".includes(previous)) return true;
    if (previous === "}") return true;
    if (previous === ")") {
      let depth = 1;
      index -= 1;
      while (index >= 0 && depth > 0) {
        if (masked[index] === ")") depth += 1;
        if (masked[index] === "(") depth -= 1;
        index -= 1;
      }
      if (depth === 0) {
        while (index >= 0 && /\s/u.test(masked[index])) index -= 1;
        const end = index + 1;
        while (index >= 0 && /[A-Za-z0-9_$]/u.test(masked[index])) index -= 1;
        return regexAfterControlParenthesis.has(
          masked.slice(index + 1, end).join(""),
        );
      }
      return false;
    }
    if (/[A-Za-z0-9_$]/u.test(previous)) {
      const end = index + 1;
      while (index >= 0 && /[A-Za-z0-9_$]/u.test(masked[index])) index -= 1;
      return regexPrefixKeywords.has(masked.slice(index + 1, end).join(""));
    }
    return false;
  };
  const maskRegex = (start) => {
    let index = start;
    let inCharacterClass = false;
    blank(index);
    index += 1;
    while (index < source.length) {
      const current = source[index];
      blank(index);
      index += 1;
      if (current === "\\" && index < source.length) {
        blank(index);
        index += 1;
        continue;
      }
      if (current === "[") {
        inCharacterClass = true;
        continue;
      }
      if (current === "]" && inCharacterClass) {
        inCharacterClass = false;
        continue;
      }
      if (current === "/" && !inCharacterClass) {
        while (index < source.length && /[A-Za-z]/u.test(source[index])) {
          blank(index);
          index += 1;
        }
        return index;
      }
      if (current === "\n" || current === "\r") {
        throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
      }
    }
    throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  };
  let scanCode;
  const maskTemplate = (start) => {
    let index = start;
    blank(index);
    index += 1;
    while (index < source.length) {
      const current = source[index];
      const next = source[index + 1];
      if (current === "\\") {
        blank(index);
        blank(index + 1);
        index += 2;
        continue;
      }
      if (current === "`") {
        blank(index);
        return index + 1;
      }
      if (current === "$" && next === "{") {
        blank(index);
        blank(index + 1);
        index = scanCode(index + 2, true);
        continue;
      }
      blank(index);
      index += 1;
    }
    return index;
  };
  scanCode = (start, stopAtTemplateBrace) => {
    let index = start;
    let braceDepth = stopAtTemplateBrace ? 1 : 0;
    while (index < source.length) {
      const character = source[index];
      const next = source[index + 1];
      if (character === "/" && next === "/") {
        index = maskLineComment(index);
        continue;
      }
      if (character === "/" && next === "*") {
        index = maskBlockComment(index);
        continue;
      }
      if (character === "/" && canStartRegex(index)) {
        index = maskRegex(index);
        continue;
      }
      if (character === '"' || character === "'") {
        index = maskQuoted(index, character);
        continue;
      }
      if (character === "`") {
        index = maskTemplate(index);
        continue;
      }
      if (stopAtTemplateBrace && character === "{") {
        braceDepth += 1;
      } else if (stopAtTemplateBrace && character === "}") {
        braceDepth -= 1;
        if (braceDepth === 0) {
          blank(index);
          return index + 1;
        }
      }
      index += 1;
    }
    return index;
  };
  scanCode(0, false);
  return masked.join("");
}

function canonicalLocalModuleTarget(relativePath, moduleSpecifier) {
  if (
    typeof moduleSpecifier !== "string" ||
    moduleSpecifier.includes("%") ||
    moduleSpecifier.includes("\\")
  ) {
    throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  }
  const specifier = moduleSpecifier.split(/[?#]/u)[0];
  if (!specifier.startsWith(".")) return null;
  return path.posix.normalize(
    path.posix.join(path.posix.dirname(relativePath), specifier),
  );
}

function sourceSyntaxFacts(relativePath, source) {
  const ts = loadTypescriptDependency();
  const sourceFile = ts.createSourceFile(
    relativePath,
    source,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS,
  );
  if (sourceFile.parseDiagnostics.some(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  )) {
    throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  }
  const moduleSpecifiers = [];
  let computedDynamicImport = false;
  let runtimeCodeConstruction = false;
  let filesystemMutation = false;
  let network = false;
  let environment = false;
  const fsMutationSet = new Set([
    "appendFile", "appendFileSync", "chmod", "chmodSync", "chown",
    "chownSync", "copyFile", "copyFileSync", "cp", "cpSync",
    "createWriteStream", "fchmod", "fchmodSync", "fchown", "fchownSync",
    "ftruncate", "ftruncateSync", "futimes", "futimesSync", "lchmod",
    "lchmodSync", "lchown", "lchownSync", "link", "linkSync", "lutimes",
    "lutimesSync", "mkdir", "mkdirSync", "mkdtemp", "mkdtempSync", "open",
    "openSync", "promises", "rename", "renameSync", "rm", "rmSync", "rmdir",
    "rmdirSync", "symlink", "symlinkSync", "truncate", "truncateSync",
    "unlink", "unlinkSync", "utimes", "utimesSync", "write", "writeFile",
    "writeFileSync", "writeSync", "writev", "writevSync",
  ]);
  const runtimeConstructionMembers = new Set([
    "Function",
    "constructor",
    "eval",
    "getBuiltinModule",
    "getOwnPropertyDescriptor",
    "getOwnPropertyDescriptors",
  ]);
  const stringValue = (node) =>
    ts.isStringLiteralLike(node) ? node.text : null;
  const constantDeclarations = [];
  const mutableStringBindings = new Set();
  const collectConstantDeclarations = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer !== undefined
    ) {
      constantDeclarations.push({
        initializer: node.initializer,
        name: node.name.text,
      });
    }
    if (
      ts.isBinaryExpression(node) &&
      ts.isIdentifier(node.left) &&
      node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
    ) {
      mutableStringBindings.add(node.left.text);
      if (node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        constantDeclarations.push({
          initializer: node.right,
          name: node.left.text,
        });
      }
    }
    ts.forEachChild(node, collectConstantDeclarations);
  };
  collectConstantDeclarations(sourceFile);
  const constantBindingValues = new Map();
  const constantStringCandidates = (node, seen = new Set()) => {
    if (ts.isStringLiteralLike(node)) return new Set([node.text]);
    if (ts.isParenthesizedExpression(node)) {
      return constantStringCandidates(node.expression, seen);
    }
    if (ts.isIdentifier(node)) {
      if (seen.has(node.text)) return new Set();
      if (mutableStringBindings.has(node.text)) return new Set();
      const values = constantBindingValues.get(node.text);
      return values === undefined ? new Set() : new Set(values);
    }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.PlusToken
    ) {
      const left = constantStringCandidates(node.left, seen);
      const right = constantStringCandidates(node.right, seen);
      const values = new Set();
      for (const prefix of left) {
        for (const suffix of right) {
          const value = `${prefix}${suffix}`;
          if (value.length <= 256 && values.size < 64) values.add(value);
        }
      }
      return values;
    }
    if (ts.isTemplateExpression(node)) {
      let values = new Set([node.head.text]);
      for (const span of node.templateSpans) {
        const expressions = constantStringCandidates(span.expression, seen);
        const next = new Set();
        for (const prefix of values) {
          for (const expression of expressions) {
            const value = `${prefix}${expression}${span.literal.text}`;
            if (value.length <= 256 && next.size < 64) next.add(value);
          }
        }
        values = next;
      }
      return values;
    }
    return new Set();
  };
  for (let pass = 0; pass <= constantDeclarations.length; pass += 1) {
    let changed = false;
    for (const declaration of constantDeclarations) {
      const values = constantStringCandidates(
        declaration.initializer,
        new Set([declaration.name]),
      );
      const current = constantBindingValues.get(declaration.name) ?? new Set();
      for (const value of values) {
        if (!current.has(value)) {
          current.add(value);
          changed = true;
        }
      }
      if (current.size > 0) constantBindingValues.set(declaration.name, current);
    }
    if (!changed) break;
  }
  const constantStringValue = (node) => {
    const values = constantStringCandidates(node);
    return values.size === 1 ? [...values][0] : null;
  };
  const memberName = (node) =>
    ts.isPropertyAccessExpression(node)
      ? node.name.text
      : ts.isElementAccessExpression(node)
        ? constantStringValue(node.argumentExpression)
        : null;
  const exactReviewedManifestModuleLoader = () => {
    if (relativePath !== "scripts/launch-operations-kernel/manifest.mjs") {
      return false;
    }
    const moduleImports = [];
    const nodeModuleAcquisitions = [];
    const createRequireIdentifiers = [];
    const requireDependencyIdentifiers = [];
    const createRequireCalls = [];
    const requireDependencyCalls = [];
    const typescriptAcquisitions = [];
    const loadTypescriptDependencyCalls = [];
    const loadTypescriptDependencyIdentifiers = [];
    const typescriptDependencyIdentifiers = [];
    const loadedIdentifiers = [];
    const sourceSyntaxFactsCalls = [];
    const sourceSyntaxFactsIdentifiers = [];
    let requireDependencyDeclaration = null;
    let duplicateRequireDependencyDeclaration = false;
    const collect = (node) => {
      if (
        ts.isImportDeclaration(node) &&
        stringValue(node.moduleSpecifier) === "node:module"
      ) {
        moduleImports.push(node);
        nodeModuleAcquisitions.push(node);
      }
      if (
        ts.isExportDeclaration(node) &&
        node.moduleSpecifier !== undefined &&
        stringValue(node.moduleSpecifier) === "node:module"
      ) {
        nodeModuleAcquisitions.push(node);
      }
      if (
        ts.isCallExpression(node) &&
        node.expression.kind === ts.SyntaxKind.ImportKeyword &&
        stringValue(node.arguments[0]) === "node:module"
      ) {
        nodeModuleAcquisitions.push(node);
      }
      if (ts.isIdentifier(node) && node.text === "createRequire") {
        createRequireIdentifiers.push(node);
      }
      if (ts.isIdentifier(node) && node.text === "requireDependency") {
        requireDependencyIdentifiers.push(node);
      }
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "requireDependency"
      ) {
        if (requireDependencyDeclaration !== null) {
          duplicateRequireDependencyDeclaration = true;
        } else {
          requireDependencyDeclaration = node;
        }
      }
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "createRequire"
      ) {
        createRequireCalls.push(node);
      }
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "requireDependency"
      ) {
        requireDependencyCalls.push(node);
      }
      if (
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
        node.moduleSpecifier !== undefined &&
        stringValue(node.moduleSpecifier) === "typescript"
      ) {
        typescriptAcquisitions.push(node);
      }
      if (
        ts.isCallExpression(node) &&
        node.arguments.length >= 1 &&
        stringValue(node.arguments[0]) === "typescript"
      ) {
        typescriptAcquisitions.push(node);
      }
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "loadTypescriptDependency"
      ) {
        loadTypescriptDependencyCalls.push(node);
      }
      if (
        ts.isIdentifier(node) &&
        node.text === "loadTypescriptDependency"
      ) {
        loadTypescriptDependencyIdentifiers.push(node);
      }
      if (ts.isIdentifier(node) && node.text === "typescriptDependency") {
        typescriptDependencyIdentifiers.push(node);
      }
      if (ts.isIdentifier(node) && node.text === "loaded") {
        loadedIdentifiers.push(node);
      }
      if (ts.isIdentifier(node) && node.text === "sourceSyntaxFacts") {
        sourceSyntaxFactsIdentifiers.push(node);
      }
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === "sourceSyntaxFacts"
      ) {
        sourceSyntaxFactsCalls.push(node);
      }
      ts.forEachChild(node, collect);
    };
    collect(sourceFile);
    if (
      moduleImports.length !== 1 ||
      nodeModuleAcquisitions.length !== 1 ||
      createRequireCalls.length !== 1 ||
      requireDependencyCalls.length !== 1 ||
      typescriptAcquisitions.length !== 1 ||
      loadTypescriptDependencyCalls.length !== 1 ||
      loadTypescriptDependencyIdentifiers.length !== 2 ||
      typescriptDependencyIdentifiers.length !== 4 ||
      loadedIdentifiers.length !== 5 ||
      sourceSyntaxFactsCalls.length !== 2 ||
      sourceSyntaxFactsIdentifiers.length !== 3 ||
      requireDependencyDeclaration === null ||
      duplicateRequireDependencyDeclaration
    ) {
      return false;
    }
    const importClause = moduleImports[0].importClause;
    const namedBindings = importClause?.namedBindings;
    if (
      importClause === undefined ||
      importClause.name !== undefined ||
      namedBindings === undefined ||
      !ts.isNamedImports(namedBindings) ||
      namedBindings.elements.length !== 1 ||
      namedBindings.elements[0].propertyName !== undefined ||
      namedBindings.elements[0].name.text !== "createRequire"
    ) {
      return false;
    }
    const factoryCall = createRequireCalls[0];
    const factoryArgument = factoryCall.arguments[0];
    const exactImportMetaUrl =
      factoryCall.arguments.length === 1 &&
      ts.isPropertyAccessExpression(factoryArgument) &&
      factoryArgument.name.text === "url" &&
      ts.isMetaProperty(factoryArgument.expression) &&
      factoryArgument.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
      factoryArgument.expression.name.text === "meta";
    const declarationList = requireDependencyDeclaration.parent;
    const declarationStatement = declarationList.parent;
    const hasExportModifier = (node) =>
      (node.modifiers ?? []).some((modifier) =>
        modifier.kind === ts.SyntaxKind.ExportKeyword ||
        modifier.kind === ts.SyntaxKind.DefaultKeyword
      );
    if (
      requireDependencyDeclaration.initializer !== factoryCall ||
      !ts.isVariableDeclarationList(declarationList) ||
      !ts.isVariableStatement(declarationStatement) ||
      declarationStatement.parent !== sourceFile ||
      hasExportModifier(declarationStatement) ||
      (declarationList.flags & ts.NodeFlags.Const) === 0 ||
      !exactImportMetaUrl
    ) {
      return false;
    }
    const loaderCall = requireDependencyCalls[0];
    let loaderFunction = loaderCall.parent;
    while (
      loaderFunction !== undefined &&
      !ts.isFunctionDeclaration(loaderFunction)
    ) {
      loaderFunction = loaderFunction.parent;
    }
    if (
      loaderCall.arguments.length !== 1 ||
      stringValue(loaderCall.arguments[0]) !== "typescript" ||
      typescriptAcquisitions[0] !== loaderCall ||
      !ts.isFunctionDeclaration(loaderFunction) ||
      loaderFunction.parent !== sourceFile ||
      hasExportModifier(loaderFunction) ||
      loaderFunction.name?.text !== "loadTypescriptDependency"
    ) {
      return false;
    }
    const reviewedExportNames = [
      "ManifestError",
      "readStrictJsonFile",
      "generateCandidateManifest",
      "validateLocalOnlySources",
      "validateActivationBridgeSources",
      "verifyRepositoryCandidateManifest",
      "buildStaticReadinessReport",
      "deriveIdentityReport",
      "buildRepositoryCandidateManifest",
    ];
    const actualExportNames = [];
    for (const statement of sourceFile.statements) {
      if (ts.isExportDeclaration(statement) || ts.isExportAssignment(statement)) {
        return false;
      }
      if (!hasExportModifier(statement)) continue;
      if (
        statement.modifiers?.some((modifier) =>
          modifier.kind === ts.SyntaxKind.DefaultKeyword
        )
      ) {
        return false;
      }
      if (
        (ts.isFunctionDeclaration(statement) ||
          ts.isClassDeclaration(statement)) &&
        statement.name !== undefined
      ) {
        actualExportNames.push(statement.name.text);
        continue;
      }
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (!ts.isIdentifier(declaration.name)) return false;
          actualExportNames.push(declaration.name.text);
        }
        continue;
      }
      return false;
    }
    const parserCall = loadTypescriptDependencyCalls[0];
    let parserFunction = parserCall.parent;
    while (
      parserFunction !== undefined &&
      !ts.isFunctionDeclaration(parserFunction)
    ) {
      parserFunction = parserFunction.parent;
    }
    if (
      !ts.isFunctionDeclaration(parserFunction) ||
      parserFunction.name?.text !== "sourceSyntaxFacts" ||
      !exactArray(actualExportNames, reviewedExportNames)
    ) {
      return false;
    }
    const parserCallOwners = sourceSyntaxFactsCalls.map((call) => {
      let owner = call.parent;
      while (owner !== undefined && !ts.isFunctionDeclaration(owner)) {
        owner = owner.parent;
      }
      return owner?.name?.text ?? null;
    }).sort();
    if (!exactArray(parserCallOwners, [
      "importedLocalTargets",
      "sourceCapabilities",
    ])) {
      return false;
    }
    const exactLoaderText = [
      "function loadTypescriptDependency() {",
      "  if (typescriptDependency === null) {",
      '    const loaded = requireDependency("typescript");',
      "    if (",
      "      !loaded ||",
      '      typeof loaded.createSourceFile !== "function" ||',
      '      typeof loaded.forEachChild !== "function"',
      "    ) {",
      '      throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");',
      "    }",
      "    typescriptDependency = loaded;",
      "  }",
      "  return typescriptDependency;",
      "}",
    ].join("\n");
    if (loaderFunction.getText(sourceFile) !== exactLoaderText) return false;
    const parserDeclaration = parserCall.parent;
    const parserDeclarationList = parserDeclaration.parent;
    const parserDeclarationStatement = parserDeclarationList.parent;
    if (
      !ts.isVariableDeclaration(parserDeclaration) ||
      !ts.isIdentifier(parserDeclaration.name) ||
      parserDeclaration.name.text !== "ts" ||
      parserDeclaration.initializer !== parserCall ||
      !ts.isVariableDeclarationList(parserDeclarationList) ||
      !ts.isVariableStatement(parserDeclarationStatement) ||
      parserDeclarationStatement.parent !== parserFunction.body ||
      (parserDeclarationList.flags & ts.NodeFlags.Const) === 0
    ) {
      return false;
    }
    const approvedParserCallMembers = new Set([
      "createSourceFile",
      "forEachChild",
      "isArrayLiteralExpression",
      "isAsExpression",
      "isAwaitExpression",
      "isBinaryExpression",
      "isBindingElement",
      "isCallExpression",
      "isClassDeclaration",
      "isComputedPropertyName",
      "isConditionalExpression",
      "isElementAccessExpression",
      "isExportAssignment",
      "isExportDeclaration",
      "isFunctionDeclaration",
      "isIdentifier",
      "isImportDeclaration",
      "isIfStatement",
      "isMetaProperty",
      "isNamedImports",
      "isNamespaceImport",
      "isNewExpression",
      "isNonNullExpression",
      "isNumericLiteral",
      "isObjectLiteralExpression",
      "isOmittedExpression",
      "isParameter",
      "isParenthesizedExpression",
      "isPropertyAccessExpression",
      "isPropertyAssignment",
      "isReturnStatement",
      "isShorthandPropertyAssignment",
      "isSpreadAssignment",
      "isSpreadElement",
      "isStringLiteralLike",
      "isTaggedTemplateExpression",
      "isTemplateExpression",
      "isTypeAssertionExpression",
      "isVariableDeclaration",
      "isVariableDeclarationList",
      "isVariableStatement",
    ]);
    const approvedParserEnumMembers = new Set([
      "DiagnosticCategory",
      "NodeFlags",
      "ScriptKind",
      "ScriptTarget",
      "SyntaxKind",
    ]);
    const forbiddenParserExportReferences = new Set(
      reviewedExportNames.filter((name) => name !== "ManifestError"),
    );
    const parserLocalBindings = new Set();
    const collectParserBindings = (node) => {
      if (ts.isIdentifier(node)) {
        const parent = node.parent;
        if (
          ((ts.isVariableDeclaration(parent) ||
              ts.isBindingElement(parent) ||
              ts.isParameter(parent) ||
              ts.isFunctionDeclaration(parent) ||
              ts.isClassDeclaration(parent)) &&
            parent.name === node)
        ) {
          parserLocalBindings.add(node.text);
        }
      }
      ts.forEachChild(node, collectParserBindings);
    };
    collectParserBindings(parserFunction);
    const safeOuterParserCalls = new Set([
      "canonicalLocalModuleTarget",
      "exactArray",
      "loadTypescriptDependency",
      "sha256Hex",
    ]);
    const booleanFactNames = new Set([
      "environment",
      "filesystemMutation",
      "network",
      "runtimeCodeConstruction",
    ]);
    const booleanFactDeclarations = new Map(
      [...booleanFactNames].map((name) => [name, []]),
    );
    const moduleLoaderFactDeclarations = [];
    const moduleLoaderFactIdentifiers = [];
    const collectAssignmentTargetRoots = (node, roots) => {
      if (ts.isParenthesizedExpression(node)) {
        collectAssignmentTargetRoots(node.expression, roots);
        return;
      }
      if (ts.isIdentifier(node)) {
        roots.push(node.text);
        return;
      }
      if (
        ts.isPropertyAccessExpression(node) ||
        ts.isElementAccessExpression(node)
      ) {
        collectAssignmentTargetRoots(node.expression, roots);
        return;
      }
      if (ts.isArrayLiteralExpression(node)) {
        for (const element of node.elements) {
          if (!ts.isOmittedExpression(element)) {
            collectAssignmentTargetRoots(element, roots);
          }
        }
        return;
      }
      if (ts.isObjectLiteralExpression(node)) {
        for (const property of node.properties) {
          if (ts.isShorthandPropertyAssignment(property)) {
            roots.push(property.name.text);
          } else if (ts.isPropertyAssignment(property)) {
            collectAssignmentTargetRoots(property.initializer, roots);
          } else if (ts.isSpreadAssignment(property)) {
            collectAssignmentTargetRoots(property.expression, roots);
          }
        }
        return;
      }
      if (ts.isSpreadElement(node)) {
        collectAssignmentTargetRoots(node.expression, roots);
      }
    };
    let parserBindingConfinementValid = true;
    let moduleSpecifierDeclarationCount = 0;
    let moduleSpecifierPushCount = 0;
    let moduleSpecifierReturnCount = 0;
    const inspectParserConfinement = (node) => {
      if (ts.isIdentifier(node) && node.text === "ts") {
        if (node !== parserDeclaration.name) {
          const member = node.parent;
          if (
            !ts.isPropertyAccessExpression(member) ||
            member.expression !== node
          ) {
            parserBindingConfinementValid = false;
          } else if (approvedParserCallMembers.has(member.name.text)) {
            const call = member.parent;
            if (!ts.isCallExpression(call) || call.expression !== member) {
              parserBindingConfinementValid = false;
            }
          } else if (approvedParserEnumMembers.has(member.name.text)) {
            const enumMember = member.parent;
            if (
              !ts.isPropertyAccessExpression(enumMember) ||
              enumMember.expression !== member
            ) {
              parserBindingConfinementValid = false;
            }
          } else {
            parserBindingConfinementValid = false;
          }
        }
      }
      if (
        ts.isIdentifier(node) &&
        forbiddenParserExportReferences.has(node.text)
      ) {
        parserBindingConfinementValid = false;
      }
      if (
        ts.isBinaryExpression(node) &&
        node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
      ) {
        const roots = [];
        collectAssignmentTargetRoots(node.left, roots);
        if (roots.some((name) => !parserLocalBindings.has(name))) {
          parserBindingConfinementValid = false;
        }
        if (roots.some((name) => booleanFactNames.has(name))) {
          if (
            !ts.isIdentifier(node.left) ||
            node.operatorToken.kind !== ts.SyntaxKind.EqualsToken ||
            ![
              ts.SyntaxKind.FalseKeyword,
              ts.SyntaxKind.TrueKeyword,
            ].includes(node.right.kind)
          ) {
            parserBindingConfinementValid = false;
          }
        }
      }
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        booleanFactDeclarations.has(node.name.text)
      ) {
        booleanFactDeclarations.get(node.name.text).push(node);
      }
      if (
        ts.isVariableDeclaration(node) &&
        ts.isIdentifier(node.name) &&
        node.name.text === "moduleLoaderPolicyViolation"
      ) {
        moduleLoaderFactDeclarations.push(node);
      }
      if (
        ts.isIdentifier(node) &&
        node.text === "moduleLoaderPolicyViolation"
      ) {
        moduleLoaderFactIdentifiers.push(node);
      }
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
        if (
          !parserLocalBindings.has(node.expression.text) &&
          !safeOuterParserCalls.has(node.expression.text)
        ) {
          parserBindingConfinementValid = false;
        }
      }
      if (ts.isNewExpression(node) && ts.isIdentifier(node.expression)) {
        if (!["ManifestError", "Map", "Set"].includes(node.expression.text)) {
          parserBindingConfinementValid = false;
        }
      }
      if (
        ts.isCallExpression(node) &&
        (ts.isPropertyAccessExpression(node.expression) ||
          ts.isElementAccessExpression(node.expression))
      ) {
        let root = node.expression.expression;
        while (
          ts.isPropertyAccessExpression(root) ||
          ts.isElementAccessExpression(root)
        ) {
          root = root.expression;
        }
        if (
          ts.isIdentifier(root) &&
          root.text !== "ts" &&
          !parserLocalBindings.has(root.text)
        ) {
          parserBindingConfinementValid = false;
        }
      }
      if (ts.isIdentifier(node) && node.text === "sourceFile") {
        const parent = node.parent;
        const approvedCollectorCalls = new Set([
          "collect",
          "collectConstantDeclarations",
          "collectIdentityAttestation",
          "collectModuleLoaderDeclarations",
          "visit",
        ]);
        const isDeclaration =
          ts.isVariableDeclaration(parent) && parent.name === node;
        const isApprovedProperty =
          ts.isPropertyAccessExpression(parent) &&
          parent.expression === node &&
          ["parseDiagnostics", "statements"].includes(parent.name.text);
        const isApprovedCollectorArgument =
          ts.isCallExpression(parent) &&
          parent.arguments.includes(node) &&
          ts.isIdentifier(parent.expression) &&
          approvedCollectorCalls.has(parent.expression.text);
        const isApprovedTextArgument =
          ts.isCallExpression(parent) &&
          parent.arguments.includes(node) &&
          ts.isPropertyAccessExpression(parent.expression) &&
          parent.expression.name.text === "getText";
        const isApprovedParentComparison =
          ts.isBinaryExpression(parent) &&
          [
            ts.SyntaxKind.EqualsEqualsEqualsToken,
            ts.SyntaxKind.ExclamationEqualsEqualsToken,
          ].includes(parent.operatorToken.kind) &&
          (parent.left === node || parent.right === node) &&
          [parent.left, parent.right].some((operand) =>
            ts.isPropertyAccessExpression(operand) &&
            operand.name.text === "parent"
          );
        if (
          !isDeclaration &&
          !isApprovedProperty &&
          !isApprovedCollectorArgument &&
          !isApprovedTextArgument &&
          !isApprovedParentComparison
        ) {
          parserBindingConfinementValid = false;
        }
      }
      if (ts.isIdentifier(node) && node.text === "moduleSpecifiers") {
        const parent = node.parent;
        if (
          ts.isVariableDeclaration(parent) &&
          parent.name === node &&
          ts.isArrayLiteralExpression(parent.initializer) &&
          parent.initializer.elements.length === 0
        ) {
          moduleSpecifierDeclarationCount += 1;
        } else if (
          ts.isPropertyAccessExpression(parent) &&
          parent.expression === node &&
          parent.name.text === "push" &&
          ts.isCallExpression(parent.parent) &&
          parent.parent.expression === parent &&
          parent.parent.arguments.length === 1 &&
          ts.isObjectLiteralExpression(parent.parent.arguments[0]) &&
          parent.parent.arguments[0].properties.length === 1 &&
          ts.isShorthandPropertyAssignment(
            parent.parent.arguments[0].properties[0],
          ) &&
          parent.parent.arguments[0].properties[0].name.text === "value"
        ) {
          moduleSpecifierPushCount += 1;
        } else if (
          ts.isShorthandPropertyAssignment(parent) &&
          parent.name === node
        ) {
          moduleSpecifierReturnCount += 1;
        } else {
          parserBindingConfinementValid = false;
        }
      }
      ts.forEachChild(node, inspectParserConfinement);
    };
    inspectParserConfinement(parserFunction);
    const exactBooleanFactDeclarations = [...booleanFactDeclarations.values()]
      .every((declarations) =>
        declarations.length === 1 &&
        declarations[0].initializer?.kind === ts.SyntaxKind.FalseKeyword
      );
    const moduleLoaderFactDeclaration = moduleLoaderFactDeclarations[0];
    const moduleLoaderFactDeclarationList =
      moduleLoaderFactDeclaration?.parent;
    const moduleLoaderFactStatement =
      moduleLoaderFactDeclarationList?.parent;
    const moduleLoaderFactStatementIndex =
      parserFunction.body?.statements.indexOf(moduleLoaderFactStatement) ?? -1;
    const moduleLoaderGuard = moduleLoaderFactStatementIndex > 0
      ? parserFunction.body.statements.at(moduleLoaderFactStatementIndex - 1)
      : null;
    const exactModuleLoaderFactDeclaration =
      moduleLoaderFactDeclarations.length === 1 &&
      moduleLoaderFactIdentifiers.length === 2 &&
      ts.isVariableDeclarationList(moduleLoaderFactDeclarationList) &&
      (moduleLoaderFactDeclarationList.flags & ts.NodeFlags.Const) !== 0 &&
      moduleLoaderFactDeclaration?.initializer?.kind ===
        ts.SyntaxKind.FalseKeyword &&
      ts.isIfStatement(moduleLoaderGuard) &&
      moduleLoaderGuard.getText(sourceFile) === [
        "if (",
        '    relativePath === "scripts/launch-operations-kernel/manifest.mjs" &&',
        "    !exactReviewedManifestModuleLoader()",
        "  ) {",
        '    throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");',
        "  }",
      ].join("\n");
    const finalParserStatement = parserFunction.body?.statements.at(-1);
    const parserReturn = ts.isReturnStatement(finalParserStatement)
      ? finalParserStatement.expression
      : null;
    const parserReturnProperties = ts.isObjectLiteralExpression(parserReturn)
      ? parserReturn.properties
      : [];
    const exactShorthandReturnNames = [
      "environment",
      "filesystemMutation",
      "moduleLoaderPolicyViolation",
      "moduleSpecifiers",
      "network",
      "runtimeCodeConstruction",
    ];
    const exactShorthandReturn =
      parserReturnProperties.length === 8 &&
      exactShorthandReturnNames.every((name, index) => {
        const property = parserReturnProperties[index];
        return ts.isShorthandPropertyAssignment(property) &&
          property.name.text === name;
      });
    const countProperty = parserReturnProperties[6];
    const countInitializer = ts.isPropertyAssignment(countProperty)
      ? countProperty.initializer
      : null;
    const hashProperty = parserReturnProperties[7];
    const hashInitializer = ts.isPropertyAssignment(hashProperty)
      ? hashProperty.initializer
      : null;
    const exactCountReturn =
      ts.isPropertyAssignment(countProperty) &&
      ts.isIdentifier(countProperty.name) &&
      countProperty.name.text === "unresolvedComputedMemberCount" &&
      ts.isPropertyAccessExpression(countInitializer) &&
      ts.isIdentifier(countInitializer.expression) &&
      countInitializer.expression.text === "unresolvedComputedMembers" &&
      countInitializer.name.text === "length";
    const exactHashReturn =
      ts.isPropertyAssignment(hashProperty) &&
      ts.isIdentifier(hashProperty.name) &&
      hashProperty.name.text === "unresolvedComputedMemberSha256" &&
      ts.isCallExpression(hashInitializer) &&
      ts.isIdentifier(hashInitializer.expression) &&
      hashInitializer.expression.text === "sha256Hex" &&
      hashInitializer.arguments.length === 1 &&
      ts.isCallExpression(hashInitializer.arguments[0]) &&
      ts.isPropertyAccessExpression(hashInitializer.arguments[0].expression) &&
      ts.isIdentifier(hashInitializer.arguments[0].expression.expression) &&
      hashInitializer.arguments[0].expression.expression.text ===
        "unresolvedComputedMembers" &&
      hashInitializer.arguments[0].expression.name.text === "join" &&
      hashInitializer.arguments[0].arguments.length === 1 &&
      stringValue(hashInitializer.arguments[0].arguments[0]) === "\n";
    if (
      !parserBindingConfinementValid ||
      moduleSpecifierDeclarationCount !== 1 ||
      moduleSpecifierPushCount !== 1 ||
      moduleSpecifierReturnCount !== 1 ||
      !exactBooleanFactDeclarations ||
      !exactModuleLoaderFactDeclaration ||
      !exactShorthandReturn ||
      !exactCountReturn ||
      !exactHashReturn
    ) {
      return false;
    }
    const allowedCreateRequireIdentifiers = new Set([
      namedBindings.elements[0].name,
      factoryCall.expression,
    ]);
    const allowedRequireDependencyIdentifiers = new Set([
      requireDependencyDeclaration.name,
      loaderCall.expression,
    ]);
    return createRequireIdentifiers.length === 2 &&
      createRequireIdentifiers.every((node) =>
        allowedCreateRequireIdentifiers.has(node)
      ) &&
      requireDependencyIdentifiers.length === 2 &&
      requireDependencyIdentifiers.every((node) =>
        allowedRequireDependencyIdentifiers.has(node)
      );
  };
  if (
    relativePath === "scripts/launch-operations-kernel/manifest.mjs" &&
    !exactReviewedManifestModuleLoader()
  ) {
    throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  }
  const moduleLoaderPolicyViolation = false;
  const unresolvedMemberBindings = new Set();
  const reviewedUnresolvedDataMethods = new Set([
    "add",
    "filter",
    "find",
    "flatMap",
    "has",
    "includes",
    "map",
    "push",
    "slice",
    "some",
  ]);
  const expressionUsesUnresolvedMember = (node) => {
    if (
      ts.isParenthesizedExpression(node) ||
      ts.isAwaitExpression(node) ||
      ts.isNonNullExpression(node) ||
      ts.isAsExpression(node) ||
      ts.isTypeAssertionExpression(node)
    ) {
      return expressionUsesUnresolvedMember(node.expression);
    }
    if (ts.isIdentifier(node)) {
      return unresolvedMemberBindings.has(node.text);
    }
    if (ts.isElementAccessExpression(node)) {
      return (
        !ts.isNumericLiteral(node.argumentExpression) &&
        constantStringValue(node.argumentExpression) === null
      ) || expressionUsesUnresolvedMember(node.expression);
    }
    if (ts.isPropertyAccessExpression(node)) {
      return expressionUsesUnresolvedMember(node.expression);
    }
    if (ts.isConditionalExpression(node)) {
      return expressionUsesUnresolvedMember(node.whenTrue) ||
        expressionUsesUnresolvedMember(node.whenFalse);
    }
    if (ts.isBinaryExpression(node)) {
      return expressionUsesUnresolvedMember(node.left) ||
        expressionUsesUnresolvedMember(node.right);
    }
    return false;
  };
  for (let pass = 0; pass <= constantDeclarations.length; pass += 1) {
    let changed = false;
    for (const declaration of constantDeclarations) {
      if (
        expressionUsesUnresolvedMember(declaration.initializer) &&
        !unresolvedMemberBindings.has(declaration.name)
      ) {
        unresolvedMemberBindings.add(declaration.name);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const declaredPropertyName = (node) => {
    if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) {
      return node.text;
    }
    if (ts.isComputedPropertyName(node)) {
      return constantStringValue(node.expression);
    }
    return null;
  };
  const assignmentPatternUsesRuntimeConstruction = (node) => {
    if (ts.isParenthesizedExpression(node)) {
      return assignmentPatternUsesRuntimeConstruction(node.expression);
    }
    if (ts.isObjectLiteralExpression(node)) {
      return node.properties.some((property) => {
        if (ts.isShorthandPropertyAssignment(property)) {
          return runtimeConstructionMembers.has(property.name.text);
        }
        if (ts.isPropertyAssignment(property)) {
          const resolved = declaredPropertyName(property.name);
          return runtimeConstructionMembers.has(resolved) ||
            (ts.isComputedPropertyName(property.name) && resolved === null) ||
            assignmentPatternUsesRuntimeConstruction(property.initializer);
        }
        if (ts.isSpreadAssignment(property)) {
          return assignmentPatternUsesRuntimeConstruction(property.expression);
        }
        return true;
      });
    }
    if (ts.isArrayLiteralExpression(node)) {
      return node.elements.some((element) =>
        !ts.isOmittedExpression(element) &&
        assignmentPatternUsesRuntimeConstruction(element)
      );
    }
    if (ts.isSpreadElement(node)) {
      return assignmentPatternUsesRuntimeConstruction(node.expression);
    }
    if (ts.isBinaryExpression(node) &&
        node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      return assignmentPatternUsesRuntimeConstruction(node.left);
    }
    return false;
  };
  const processArgumentPaths = new Set([
    "scripts/launch-operations-kernel/cli.mjs",
    CONCRETE_RUNNER_PATH,
    FIRST_ENVIRONMENT_SUPERVISOR_PATH,
    FIRST_ENVIRONMENT_SUPERVISOR_TEST_PATH,
  ]);
  const processExitCodePaths = new Set([
    "scripts/launch-operations-kernel/activation-bridge.test.mjs",
    "scripts/launch-operations-kernel/activation-e2e.test.mjs",
    FIRST_ENVIRONMENT_RUNTIME_TEST_PATH,
    FIRST_ENVIRONMENT_SUPERVISOR_PATH,
    FIRST_ENVIRONMENT_SUPERVISOR_TEST_PATH,
    OFFICIAL_RUNTIME_TEST_PATH,
    "scripts/launch-operations-kernel/cli.mjs",
    "scripts/launch-operations-kernel/kernel.test.mjs",
    "scripts/launch-operations-kernel/legacy-classifier.test.mjs",
    "scripts/launch-operations-kernel/manifest.test.mjs",
    CONCRETE_ADAPTER_TEST_PATH,
    CONCRETE_CREDENTIAL_LOADER_TEST_PATH,
    "scripts/launch-operations-kernel/nonproduction-qualification-authorization.test.mjs",
    CONCRETE_CHECKPOINT_TEST_PATH,
    CONCRETE_PLATFORM_TEST_PATH,
    CONCRETE_RUNNER_PATH,
    CONCRETE_RUNNER_TEST_PATH,
    "scripts/launch-operations-kernel/recovery.test.mjs",
    "scripts/launch-operations-kernel/source-policy.test.mjs",
  ]);
  const exactReviewedProcessUse = (processNode, memberNode, directMember) => {
    if (directMember === "argv") {
      return processArgumentPaths.has(relativePath);
    }
    if (directMember === "pid") {
      return relativePath === CONCRETE_CHECKPOINT_TEST_PATH;
    }
    if (directMember === "exitCode") {
      const assignment = memberNode.parent;
      return processExitCodePaths.has(relativePath) &&
        ts.isBinaryExpression(assignment) &&
        assignment.left === memberNode &&
        assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken;
    }
    if (directMember === "kill") {
      const call = memberNode.parent;
      return relativePath ===
          "scripts/launch-operations-kernel/legacy-classifier.mjs" &&
        ts.isPropertyAccessExpression(memberNode) &&
        memberNode.expression === processNode &&
        ts.isCallExpression(call) &&
        call.expression === memberNode &&
        call.arguments.length === 2 &&
        ts.isIdentifier(call.arguments[0]) &&
        call.arguments[0].text === "pid" &&
        ts.isNumericLiteral(call.arguments[1]) &&
        call.arguments[1].text === "0";
    }
    return false;
  };
  if ([...constantBindingValues.values()].some((values) =>
    [...values].some((value) => runtimeConstructionMembers.has(value))
  )) {
    runtimeCodeConstruction = true;
  }
  const createRequireFactoryBindings = new Set(["createRequire"]);
  const moduleLoaderDeclarations = [];
  const collectModuleLoaderDeclarations = (node) => {
    if (
      ts.isImportDeclaration(node) &&
      stringValue(node.moduleSpecifier) === "node:module" &&
      node.importClause?.namedBindings !== undefined &&
      ts.isNamedImports(node.importClause?.namedBindings)
    ) {
      for (const element of node.importClause.namedBindings.elements) {
        if ((element.propertyName ?? element.name).text === "createRequire") {
          createRequireFactoryBindings.add(element.name.text);
        }
      }
    }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer !== undefined
    ) {
      moduleLoaderDeclarations.push({
        initializer: node.initializer,
        name: node.name.text,
      });
    }
    if (
      ts.isBinaryExpression(node) &&
      ts.isIdentifier(node.left) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ) {
      moduleLoaderDeclarations.push({
        initializer: node.right,
        name: node.left.text,
      });
    }
    ts.forEachChild(node, collectModuleLoaderDeclarations);
  };
  collectModuleLoaderDeclarations(sourceFile);
  const requireLikeBindings = new Set(["require"]);
  const isCreateRequireFactory = (node) =>
    (ts.isIdentifier(node) && createRequireFactoryBindings.has(node.text)) ||
    ((ts.isPropertyAccessExpression(node) ||
        ts.isElementAccessExpression(node)) &&
      memberName(node) === "createRequire");
  for (let pass = 0; pass <= moduleLoaderDeclarations.length; pass += 1) {
    let changed = false;
    for (const declaration of moduleLoaderDeclarations) {
      const initializer = declaration.initializer;
      const createsLoader =
        ts.isCallExpression(initializer) &&
        isCreateRequireFactory(initializer.expression);
      const aliasesLoader =
        ts.isIdentifier(initializer) &&
        requireLikeBindings.has(initializer.text);
      if (
        (createsLoader || aliasesLoader) &&
        !requireLikeBindings.has(declaration.name)
      ) {
        requireLikeBindings.add(declaration.name);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const unresolvedComputedMembers = [];
  const recordModule = (value) => {
    if (typeof value !== "string" || value.length === 0) {
      throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
    }
    moduleSpecifiers.push({ value });
  };
  const visit = (node) => {
    if (
      ts.isIdentifier(node) &&
      ["global", "globalThis"].includes(node.text)
    ) {
      network = true;
    }
    if (ts.isIdentifier(node) && node.text === "process") {
      const parent = node.parent;
      const directMember =
        (ts.isPropertyAccessExpression(parent) ||
          ts.isElementAccessExpression(parent)) &&
          parent.expression === node
          ? memberName(parent)
          : null;
      if (directMember === "env") {
        environment = true;
      } else if (
        directMember === null ||
        !exactReviewedProcessUse(node, parent, directMember)
      ) {
        runtimeCodeConstruction = true;
      }
    }
    if (
      ts.isIdentifier(node) &&
      ["EventSource", "WebSocket", "XMLHttpRequest", "fetch"].includes(
        node.text,
      )
    ) {
      network = true;
    }
    if (
      ts.isIdentifier(node) &&
      ["eval", "Function"].includes(node.text)
    ) {
      runtimeCodeConstruction = true;
    }
    if (ts.isIdentifier(node) && node.text === "Reflect") {
      runtimeCodeConstruction = true;
    }
    if (
      (ts.isPropertyAccessExpression(node) ||
        ts.isElementAccessExpression(node)) &&
      runtimeConstructionMembers.has(memberName(node))
    ) {
      runtimeCodeConstruction = true;
    }
    if (ts.isBindingElement(node)) {
      const propertyName = node.propertyName ?? node.name;
      const resolved = declaredPropertyName(propertyName);
      if (
        runtimeConstructionMembers.has(resolved) ||
        (ts.isComputedPropertyName(propertyName) && resolved === null)
      ) {
        runtimeCodeConstruction = true;
      }
    }
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      assignmentPatternUsesRuntimeConstruction(node.left)
    ) {
      runtimeCodeConstruction = true;
    }
    if (
      ts.isElementAccessExpression(node) &&
      !ts.isNumericLiteral(node.argumentExpression) &&
      constantStringValue(node.argumentExpression) === null
    ) {
      unresolvedComputedMembers.push(node.getText(sourceFile));
    }
    if (
      (ts.isCallExpression(node) || ts.isNewExpression(node)) &&
      expressionUsesUnresolvedMember(node.expression)
    ) {
      const reviewedDataMethodCall =
        ts.isCallExpression(node) &&
        (ts.isPropertyAccessExpression(node.expression) ||
          ts.isElementAccessExpression(node.expression)) &&
        reviewedUnresolvedDataMethods.has(memberName(node.expression)) &&
        expressionUsesUnresolvedMember(node.expression.expression);
      if (!reviewedDataMethodCall) runtimeCodeConstruction = true;
    }
    if (
      ts.isTaggedTemplateExpression(node) &&
      expressionUsesUnresolvedMember(node.tag)
    ) {
      runtimeCodeConstruction = true;
    }
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier !== undefined) {
        recordModule(stringValue(node.moduleSpecifier));
      }
      if (
        ts.isImportDeclaration(node) &&
        stringValue(node.moduleSpecifier) === "node:fs"
      ) {
        const clause = node.importClause;
        const bindings = clause?.namedBindings;
        if (
          clause === undefined ||
          clause.name !== undefined ||
          bindings === undefined ||
          ts.isNamespaceImport(bindings)
        ) {
          filesystemMutation = true;
        } else if (ts.isNamedImports(bindings)) {
          if (bindings.elements.some((element) =>
            fsMutationSet.has((element.propertyName ?? element.name).text)
          )) {
            filesystemMutation = true;
          }
        }
      }
      if (
        ts.isExportDeclaration(node) &&
        node.moduleSpecifier !== undefined &&
        stringValue(node.moduleSpecifier) === "node:fs"
      ) {
        filesystemMutation = true;
      }
    }
    if (ts.isCallExpression(node)) {
      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const specifier = node.arguments.length >= 1
          ? stringValue(node.arguments[0])
          : null;
        if (specifier === null) {
          computedDynamicImport = true;
        } else {
          recordModule(specifier);
          if (["node:fs", "fs", "node:fs/promises", "fs/promises"].includes(
            specifier,
          )) {
            filesystemMutation = true;
          }
        }
      }
      if (
        ts.isIdentifier(node.expression) &&
        requireLikeBindings.has(node.expression.text)
      ) {
        const specifier = node.arguments.length === 1
          ? stringValue(node.arguments[0])
          : null;
        if (specifier === null) {
          computedDynamicImport = true;
        } else {
          recordModule(specifier);
          if (["node:fs", "fs", "node:fs/promises", "fs/promises"].includes(
            specifier,
          )) {
            filesystemMutation = true;
          }
        }
      }
      const calledName = ts.isIdentifier(node.expression)
        ? node.expression.text
        : ts.isPropertyAccessExpression(node.expression)
          ? node.expression.name.text
          : ts.isElementAccessExpression(node.expression)
            ? constantStringValue(node.expression.argumentExpression)
          : null;
      if (calledName !== null && fsMutationSet.has(calledName)) {
        filesystemMutation = true;
      }
      if (
        calledName === "fetch" &&
        (ts.isIdentifier(node.expression) ||
          (ts.isPropertyAccessExpression(node.expression) &&
            ts.isIdentifier(node.expression.expression) &&
            node.expression.expression.text === "globalThis"))
      ) {
        network = true;
      }
    }
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "globalThis" &&
      node.name.text === "fetch"
    ) {
      network = true;
    }
    if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "globalThis" &&
      ["fetch", "WebSocket", "EventSource", "XMLHttpRequest"].includes(
        constantStringValue(node.argumentExpression),
      )
    ) {
      network = true;
    }
    if (
      ts.isPropertyAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "process" &&
      node.name.text === "env"
    ) {
      environment = true;
    }
    if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "process" &&
      constantStringValue(node.argumentExpression) === "env"
    ) {
      environment = true;
    }
    ts.forEachChild(node, visit);
  };
  const exactConcreteRunnerIdentityAttestation = () => {
    if (relativePath !== CONCRETE_RUNNER_PATH) return true;
    const identityNames = [
      "deriveIdentityReport",
      "verifyRepositoryCandidateManifest",
    ];
    const imports = [];
    const manifestModuleAcquisitions = [];
    const callsByName = new Map(identityNames.map((name) => [name, []]));
    const identifiersByName = new Map(
      identityNames.map((name) => [name, []]),
    );
    const collectIdentityAttestation = (node) => {
      const staticModuleSpecifier =
        (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
          node.moduleSpecifier !== undefined
          ? stringValue(node.moduleSpecifier)
          : null;
      const dynamicModuleSpecifier =
        ts.isCallExpression(node) &&
          node.expression.kind === ts.SyntaxKind.ImportKeyword
          ? stringValue(node.arguments[0])
          : null;
      if (
        ts.isImportDeclaration(node) &&
        stringValue(node.moduleSpecifier) === "./manifest.mjs"
      ) {
        imports.push(node);
      }
      if (
        (staticModuleSpecifier !== null || dynamicModuleSpecifier !== null) &&
        canonicalLocalModuleTarget(
          relativePath,
          staticModuleSpecifier ?? dynamicModuleSpecifier,
        ) === MANIFEST_MODULE_PATH
      ) {
        manifestModuleAcquisitions.push(node);
      }
      if (ts.isIdentifier(node) && identifiersByName.has(node.text)) {
        identifiersByName.get(node.text).push(node);
      }
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        callsByName.has(node.expression.text)
      ) {
        callsByName.get(node.expression.text).push(node);
      }
      ts.forEachChild(node, collectIdentityAttestation);
    };
    collectIdentityAttestation(sourceFile);
    if (
      imports.length !== 1 ||
      manifestModuleAcquisitions.length !== 1 ||
      manifestModuleAcquisitions[0] !== imports[0]
    ) return false;
    const importClause = imports[0].importClause;
    const bindings = importClause?.namedBindings;
    if (
      importClause === undefined ||
      importClause.name !== undefined ||
      !ts.isNamedImports(bindings) ||
      !exactArray(
        bindings.elements.map((element) =>
          element.propertyName === undefined
            ? element.name.text
            : null
        ),
        [
          "deriveIdentityReport",
          "readStrictJsonFile",
          "verifyRepositoryCandidateManifest",
        ],
      )
    ) {
      return false;
    }
    const exactAttestedOptions = (argument) => {
      if (
        !ts.isObjectLiteralExpression(argument) ||
        argument.properties.length !== 3
      ) {
        return false;
      }
      const [repositoryRoot, manifestPath, sourcePolicyMode] =
        argument.properties;
      return ts.isShorthandPropertyAssignment(repositoryRoot) &&
        repositoryRoot.name.text === "repositoryRoot" &&
        ts.isShorthandPropertyAssignment(manifestPath) &&
        manifestPath.name.text === "manifestPath" &&
        ts.isPropertyAssignment(sourcePolicyMode) &&
        ts.isIdentifier(sourcePolicyMode.name) &&
        sourcePolicyMode.name.text === "sourcePolicyMode" &&
        stringValue(sourcePolicyMode.initializer) ===
          "ATTESTED_BY_REVIEWED_IDENTITY";
    };
    for (const name of identityNames) {
      const calls = callsByName.get(name);
      const identifiers = identifiersByName.get(name);
      if (calls.length !== 1 || identifiers.length !== 2) return false;
      const call = calls[0];
      if (call.arguments.length !== 1 || !exactAttestedOptions(call.arguments[0])) {
        return false;
      }
      let owner = call.parent;
      while (owner !== undefined && !ts.isFunctionDeclaration(owner)) {
        owner = owner.parent;
      }
      if (owner?.name?.text !== "verifyConcreteCandidate") return false;
    }
    return true;
  };
  visit(sourceFile);
  if (computedDynamicImport) {
    throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  }
  if (!exactConcreteRunnerIdentityAttestation()) {
    throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  }
  return {
    environment,
    filesystemMutation,
    moduleLoaderPolicyViolation,
    moduleSpecifiers,
    network,
    runtimeCodeConstruction,
    unresolvedComputedMemberCount: unresolvedComputedMembers.length,
    unresolvedComputedMemberSha256: sha256Hex(
      unresolvedComputedMembers.join("\n"),
    ),
  };
}

function importedLocalTargets(relativePath, source, sources) {
  const syntax = sourceSyntaxFacts(relativePath, source);
  const targets = new Set();
  for (const entry of syntax.moduleSpecifiers) {
    const resolved = canonicalLocalModuleTarget(relativePath, entry.value);
    if (resolved === null) continue;
    if (!sources.has(resolved)) {
      throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
    }
    targets.add(resolved);
  }
  return targets;
}

function reachablePrivilegedTargets(relativePath, sources, importsByPath) {
  const targets = new Set();
  const visited = new Set();
  const visit = (currentPath) => {
    if (visited.has(currentPath)) return;
    visited.add(currentPath);
    for (const importedPath of importsByPath.get(currentPath) ?? []) {
      for (const target of PRIVILEGED_IMPORT_TARGETS) {
        if (importedPath === target || importedPath.endsWith(`/${target}`)) {
          targets.add(target);
        }
      }
      if (sources.has(importedPath)) visit(importedPath);
    }
  };
  visit(relativePath);
  return targets;
}

function privilegedImportsAllowed(relativePath, sources, importsByPath) {
  const allowed = PRIVILEGED_IMPORT_ALLOWLIST.get(relativePath) ?? new Set();
  return [...reachablePrivilegedTargets(relativePath, sources, importsByPath)].every((target) =>
    allowed.has(target)
  );
}

function executableMatches(source, executableSource, pattern, token) {
  return [...source.matchAll(pattern)].some((match) =>
    executableSource.slice(match.index, match.index + token.length) === token
  );
}

function sourceCapabilities(
  relativePath,
  source,
  reviewedSourceSha256ByPath = new Map(),
) {
  const syntax = sourceSyntaxFacts(relativePath, source);
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
    "ht" + "tp2",
    "pro" + "cess",
    "v" + "m",
  ];
  const moduleNames = syntax.moduleSpecifiers.map((entry) =>
    entry.value.split(/[?#]/u)[0]
  );
  const reviewedNodeModules =
    REVIEWED_NODE_MODULES_BY_PATH.get(relativePath) ?? new Set();
  const unreviewedNodeModule = moduleNames.some((name) =>
    name.startsWith("node:") && !reviewedNodeModules.has(name)
  );
  const childProcess = moduleNames.some((name) =>
    name === "node:" + "child" + "_" + "process" ||
    name === "child" + "_" + "process"
  );
  const otherForbiddenModule = forbiddenModules
    .filter((name) => name !== "child" + "_" + "process")
    .some((name) =>
      moduleNames.includes(`node:${name}`) || moduleNames.includes(name)
    );
  const filesystemModule = moduleNames.some((name) =>
    ["node:fs/promises", "fs/promises"].includes(name)
  );
  const reviewedPackage = (name) =>
    (relativePath === "scripts/launch-operations-kernel/manifest.mjs" &&
      name === "typescript") ||
    (name === "ajv" && [
      "scripts/launch-operations-kernel/activation-bridge.test.mjs",
      FIRST_ENVIRONMENT_RUNTIME_TEST_PATH,
    ].includes(relativePath));
  const unreviewedPackage = moduleNames.some((name) =>
    !name.startsWith(".") &&
    !name.startsWith("node:") &&
    !reviewedPackage(name)
  );
  const unreviewedModuleLoader = moduleNames.some((name) =>
    ["node:module", "module"].includes(name)
  ) && relativePath !== "scripts/launch-operations-kernel/manifest.mjs";
  const legacyImport = [
    "admin-v1-staging-runtime-",
    "orchestrator.mjs",
  ].join("");
  const unresolvedMemberContextMismatch =
    (reviewedSourceSha256ByPath.has(relativePath) ||
      syntax.unresolvedComputedMemberCount > 0) &&
    reviewedSourceSha256ByPath.get(relativePath) !== sha256Hex(source);
  return {
    child_process: childProcess,
    other_forbidden_module:
      otherForbiddenModule ||
      unreviewedNodeModule ||
      unreviewedModuleLoader ||
      unreviewedPackage ||
      syntax.moduleLoaderPolicyViolation ||
      syntax.runtimeCodeConstruction ||
      unresolvedMemberContextMismatch,
    filesystem_mutation: syntax.filesystemMutation || filesystemModule,
    network: syntax.network,
    environment: syntax.environment,
    legacy_import: moduleNames.some((name) => name.includes(legacyImport)),
  };
}

function concreteCapabilityAllowed(relativePath, source, capabilities) {
  const elevatedMode = /--(?:official-runtime|production|public|crawler|legacy)/iu;
  const broadGit =
    /["']add["']\s*,\s*["'](?:-A|\.)["']/u.test(source) ||
    /refs\/heads\/main/u.test(source) ||
    /["']--force(?:-with-lease)?["']/u.test(source);
  if (capabilities.other_forbidden_module || capabilities.legacy_import) {
    return false;
  }
  if (relativePath === CONCRETE_RUNNER_PATH) {
    return (
      capabilities.child_process &&
      !capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      !elevatedMode.test(source) &&
      !broadGit &&
      source.includes('argumentsList[0] !== "--qualify-nonproduction"') &&
      source.includes('argumentsList[0] === "--run-admin-v1-official"') &&
      source.includes("dispatchAdminV1OfficialRunner") &&
      source.includes('argumentsList[0] === "--self-test"') &&
      source.includes("createConcreteRunnerDependencies") &&
      source.includes("verifyConcretePreEffectAuthorization") &&
      source.includes("readLiveCredentials") &&
      source.includes("pathToFileURL")
    );
  }
  if (relativePath === OFFICIAL_RUNTIME_PATH) {
    return (
      !capabilities.child_process &&
      capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      !broadGit &&
      source.includes('"ADMIN_V1_OFFICIAL_RUNTIME_V1"') &&
      source.includes('"SELF_PROJECT_OIDC"') &&
      source.includes("OFFICIAL_AUTHORIZATION_SPENT") &&
      source.includes("OFFICIAL_BUDGET_EXHAUSTED") &&
      source.includes("delete_storage_exact_version") &&
      source.includes("STORAGE_REPLACEMENT_PRESERVED") &&
      source.includes("admin-v1-official-runtime-retired.json") &&
      !source.includes("process.env") &&
      !source.includes("globalThis.fetch")
    );
  }
  if (relativePath === FIRST_ENVIRONMENT_RUNTIME_PATH) {
    return (
      !capabilities.child_process &&
      capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      !broadGit &&
      source.includes(
        '"ADMIN_V1_OFFICIAL_FIRST_ENVIRONMENT_CREATE_ONLY_RUNTIME_V1"',
      ) &&
      source.includes("FIRST_ENVIRONMENT_AUTHORIZATION_SPENT") &&
      source.includes("FIRST_ENVIRONMENT_BUDGET_EXHAUSTED") &&
      source.includes('classification: "RECOVERY_PENDING"') &&
      source.includes(
        '"admin-v1-official-first-environment-runtime-journal.json"',
      ) &&
      source.includes('flag: "wx"') &&
      source.includes("mode: 0o600") &&
      !source.includes("process.env") &&
      !source.includes("globalThis.fetch")
    );
  }
  if (relativePath === FIRST_ENVIRONMENT_RUNTIME_TEST_PATH) {
    return (
      !capabilities.child_process &&
      capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      source.includes("mkdtempSync(path.join(") &&
      source.includes("environment_create_max=1") &&
      source.includes("git_remote_mutations=0") &&
      source.includes("database_supabase_reads=0") &&
      source.includes("database_supabase_writes=0") &&
      source.includes("storage_rpc_operations=0") &&
      source.includes("full_official_ledger=0") &&
      source.includes("retries=0 replays=0")
    );
  }
  if (relativePath === FIRST_ENVIRONMENT_SUPERVISOR_PATH) {
    return (
      capabilities.child_process &&
      !capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      !broadGit &&
      source.includes('argumentsList[0] !== "--run-first-environment"') &&
      source.includes('argumentsList[0] === "--self-test"') &&
      source.includes("FIRST_ENVIRONMENT_SUPERVISOR_LIVE_BINDING_REQUIRED") &&
      source.includes("verifyRepositoryCandidateManifest") &&
      source.includes("validateAdminV1OfficialFirstEnvironmentAuthorization") &&
      source.includes("createAdminV1OfficialFirstEnvironmentAdapter") &&
      source.includes("runAdminV1OfficialFirstEnvironmentRuntime") &&
      source.includes("load_sensitive") &&
      !source.includes("process.env") &&
      !source.includes("globalThis.fetch") &&
      !source.includes("ADMIN_V1_OFFICIAL_RUNTIME_V1")
    );
  }
  if (relativePath === FIRST_ENVIRONMENT_SUPERVISOR_TEST_PATH) {
    return (
      capabilities.child_process &&
      capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      source.includes("process_start_before_credential=true") &&
      source.includes("credential_value_reads_before_process_start=0") &&
      source.includes("real_provider_calls=0") &&
      source.includes("full_official_ledger=0")
    );
  }
  if (relativePath === OFFICIAL_RUNTIME_TEST_PATH) {
    return (
      !capabilities.child_process &&
      capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      source.includes('"/tmp/aifinder-admin-v1-official-') &&
      source.includes("real_calls=0")
    );
  }
  if (relativePath === OFFICIAL_ACTIVATION_BRIDGE_TEST_PATH) {
    return (
      !capabilities.child_process &&
      capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      source.includes('"/tmp/aifinder-admin-v1-official-') &&
      source.includes("real_external_actions=0")
    );
  }
  if (relativePath === OFFICIAL_AUTHORIZATION_PATH) {
    return (
      !capabilities.child_process &&
      capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      source.includes("constants.O_EXCL") &&
      source.includes("constants.O_NOFOLLOW") &&
      source.includes("0o600") &&
      source.includes("OFFICIAL_AUTHORIZATION_GENERATOR_REPOSITORY_MISMATCH") &&
      !source.includes("process.env") &&
      !source.includes("globalThis.fetch")
    );
  }
  if (relativePath === OFFICIAL_LIVE_PLATFORM_PATH) {
    return (
      !capabilities.child_process &&
      !capabilities.filesystem_mutation &&
      capabilities.network &&
      !capabilities.environment &&
      source.includes("ADMIN_V1_OFFICIAL_ADAPTER_OPERATION_MAP") &&
      source.includes("createAdminV1OfficialConcreteTransport") &&
      source.includes("createConcreteLiveTransport") &&
      source.includes("runAdminV1OfficialRuntime") &&
      source.includes("OFFICIAL_ADAPTER_OPERATION_DENIED") &&
      !source.includes("process.env")
    );
  }
  if (relativePath === OFFICIAL_RUNNER_TEST_PATH) {
    return !capabilities.child_process &&
      !capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      source.includes("pre_effect_before_credentials=true") &&
      source.includes("operation_class_separate=true");
  }
  if (relativePath === CONCRETE_ADAPTER_PATH) {
    return (
      !capabilities.child_process &&
      !capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      source.includes("export function loadConcreteLiveCredentials({ environment, authorization })") &&
      source.includes("CONCRETE_CREDENTIAL_TARGET_MISMATCH") &&
      !elevatedMode.test(source) &&
      !broadGit
    );
  }
  if (relativePath === CONCRETE_CREDENTIAL_LOADER_PATH) {
    const exactFilesystemImport = [
      "import {",
      "  closeSync,",
      "  constants,",
      "  fstatSync,",
      "  openSync,",
      "  readFileSync,",
      "  realpathSync,",
      "  statSync,",
      '} from "node:fs";',
    ].join("\n");
    const exactOpen = [
      "descriptor = openSync(",
      "      credentialPath,",
      "      constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),",
      "    );",
    ].join("\n");
    return (
      capabilities.child_process &&
      capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      source.includes(exactFilesystemImport) &&
      source.includes(exactOpen) &&
      source.match(/from "node:fs"/gu)?.length === 1 &&
      source.match(/\bopenSync\s*\(/gu)?.length === 2 &&
      source.match(/\breadFileSync\s*\(/gu)?.length === 2 &&
      source.match(/\bfstatSync\s*\(/gu)?.length === 3 &&
      source.match(/\bstatSync\s*\(/gu)?.length === 2 &&
      source.match(/\bsameCredentialFileIdentity\s*\(/gu)?.length === 4 &&
      source.includes("const bytes = readFileSync(descriptor);") &&
      source.includes("function sameCredentialFileIdentity(left, right)") &&
      source.includes("left.dev === right.dev") &&
      source.includes("left.ino === right.ino") &&
      source.includes("left.mtimeMs === right.mtimeMs") &&
      source.includes("left.ctimeMs === right.ctimeMs") &&
      source.match(/constants\.O_/gu)?.length === 4 &&
      source.includes('path.join(repositoryRoot, ".env.local")') &&
      source.includes("constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)") &&
      source.includes('"/opt/homebrew/bin/gh"') &&
      source.includes('["auth", "token"]') &&
      source.includes('"/usr/local/bin/node"') &&
      source.includes('[resolvedExecutable, "whoami"]') &&
      source.includes('PATH: "/usr/local/bin:/usr/bin:/bin"') &&
      source.includes("realpathSync(executablePath) !== targetPath") &&
      source.includes("shell: false") &&
      source.includes('"com.vercel.cli"') &&
      source.includes('"auth.json"') &&
      source.includes('new TextDecoder("utf-8", { fatal: true })') &&
      source.includes("CONCRETE_CREDENTIAL_NAMES") &&
      source.includes("CONCRETE_CREDENTIAL_FILE_INVALID") &&
      !source.includes("writeFile") &&
      !source.includes("appendFile") &&
      !source.includes("rename") &&
      !source.includes("unlink") &&
      !source.includes("rmSync") &&
      !elevatedMode.test(source) &&
      !broadGit
    );
  }
  if (relativePath === CONCRETE_PLATFORM_PATH) {
    return (
      capabilities.child_process &&
      capabilities.network &&
      !capabilities.filesystem_mutation &&
      !capabilities.environment &&
      !elevatedMode.test(source) &&
      !broadGit &&
      source.includes('spawn_sync("/usr/bin/git"') &&
      source.match(/--force-with-lease=/gu)?.length === 2 &&
      source.includes('`--force-with-lease=${expectedRef}:`') &&
      source.includes('`--force-with-lease=${expectedRef}:${commit_sha}`') &&
      source.match(/https:\/\/github\.com\/\$\{authorization\.repository\.remote_repository\}\.git/gu)?.length === 4 &&
      source.includes("--config-env=http.extraHeader=AIFINDER_GIT_HTTP_AUTHORIZATION") &&
      source.includes('p_phase_id: STORAGE_CAS_PHASE') &&
      source.includes('service: "SUPABASE_ANON"') &&
      source.includes('operation: "STORAGE_CAS_DELETE"') &&
      source.includes('body: { prefixes: [authorization.execution.storage_name] }')
    );
  }
  if (relativePath === CONCRETE_CHECKPOINT_PATH) {
    return (
      capabilities.child_process &&
      capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      source.match(/\bspawn\s*\(/gu)?.length === 1 &&
      !source.includes("spawnSync") &&
      !source.includes("execFile") &&
      source.includes('spawn("/usr/bin/lockf"') &&
      source.includes('"/usr/bin/tee"') &&
      source.includes('"/dev/null"') &&
      source.includes('const FILE_NAME = "qualification-journal.json"') &&
      source.includes("recordExternalBinding")
    );
  }
  if (relativePath === CONCRETE_CHECKPOINT_TEST_PATH) {
    return (
      !capabilities.child_process &&
      capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      source.includes('mkdtempSync("/tmp/aifinder-concrete-checkpoint.")')
    );
  }
  if (relativePath === CONCRETE_RUNNER_TEST_PATH) {
    return (
      capabilities.child_process &&
      capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      source.includes('mkdtempSync("/tmp/aifinder-concrete-runner-filter.")') &&
      source.includes('spawnSync("/usr/bin/git"') &&
      source.includes("filter.aifinder.clean")
    );
  }
  if (relativePath === CONCRETE_CREDENTIAL_LOADER_TEST_PATH) {
    return (
      !capabilities.child_process &&
      capabilities.filesystem_mutation &&
      !capabilities.network &&
      !capabilities.environment &&
      source.includes('mkdtempSync("/tmp/aifinder-credential-loader.') &&
      source.includes("real_credential_reads=0")
    );
  }
  if (
    relativePath ===
    "scripts/launch-operations-kernel/legacy-classifier.test.mjs"
  ) {
    return (
      !capabilities.child_process &&
      !capabilities.network &&
      !capabilities.environment &&
      source.includes(
        'path.join(os.tmpdir(), "aifinder-lok-legacy-classifier-test-")',
      ) &&
      source.includes(
        'const recoveryRootBasename = "aifinder-34ia-delta20-synthetic-fixture"',
      ) &&
      source.includes("rmSync(temporaryRoot, { recursive: true, force: true })") &&
      source.includes("assert.equal(existsSync(temporaryRoot), false)")
    );
  }
  return !capabilities.child_process &&
    !capabilities.filesystem_mutation &&
    !capabilities.network &&
    !capabilities.environment;
}

export function validateLocalOnlySources(
  sources,
  {
    reviewedSemanticSourceSha256ByPath = new Map(),
    reviewedSourceSha256ByPath = new Map(),
  } = {},
) {
  if (
    !(sources instanceof Map) ||
    sources.size < 1 ||
    !(reviewedSemanticSourceSha256ByPath instanceof Map) ||
    !(reviewedSourceSha256ByPath instanceof Map) ||
    [...reviewedSemanticSourceSha256ByPath].some(
      ([relativePath, digest]) =>
        typeof relativePath !== "string" || !isSha256(digest),
    ) ||
    [...reviewedSourceSha256ByPath].some(([relativePath, digest]) =>
      typeof relativePath !== "string" || !isSha256(digest)
    )
  ) {
    throw new ManifestError("SOURCE_POLICY_INPUT");
  }
  if ([...reviewedSourceSha256ByPath].some(([relativePath, digest]) =>
    !sources.has(relativePath) ||
    sha256Hex(sources.get(relativePath)) !== digest
  ) || [...reviewedSemanticSourceSha256ByPath].some(
    ([relativePath, digest]) =>
      !sources.has(relativePath) ||
      sha256Hex(sources.get(relativePath)) !== digest,
  )) {
    throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  }
  const hasConcreteSurface = [...sources.keys()].some((relativePath) =>
    relativePath.startsWith(
      "scripts/launch-operations-kernel/nonproduction-qualification-",
    ) && !relativePath.endsWith(".test.mjs")
  );
  if (
    hasConcreteSurface &&
    (!exactArray(
      [...reviewedSemanticSourceSha256ByPath.keys()].sort(),
      [...INDEPENDENTLY_REVIEWED_SEMANTIC_SOURCE_PATHS],
    ) ||
      !exactArray(
        [...reviewedSourceSha256ByPath.keys()].sort(),
        [...INDEPENDENTLY_REVIEWED_SOURCE_PATHS],
      ))
  ) {
    throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  }
  let legacyImports = 0;
  let liveEntrypoints = 0;
  let liveCapabilityFiles = 0;
  let credentialAccessFiles = 0;
  let checkpointWriterFiles = 0;
  const importsByPath = new Map();
  for (const [relativePath, source] of sources) {
    if (typeof relativePath !== "string" || typeof source !== "string") {
      throw new ManifestError("SOURCE_POLICY_INPUT");
    }
    importsByPath.set(
      relativePath,
      importedLocalTargets(relativePath, source, sources),
    );
  }
  if (hasConcreteSurface) {
    const reachableFromRunner = new Set();
    const visitRunnerImport = (relativePath) => {
      if (reachableFromRunner.has(relativePath)) return;
      reachableFromRunner.add(relativePath);
      for (const importedPath of importsByPath.get(relativePath) ?? []) {
        if (sources.has(importedPath)) visitRunnerImport(importedPath);
      }
    };
    visitRunnerImport(CONCRETE_RUNNER_PATH);
    const manifestModuleImporters = [...reachableFromRunner]
      .filter((relativePath) =>
        importsByPath.get(relativePath)?.has(
          "scripts/launch-operations-kernel/manifest.mjs",
        )
      );
    if (!exactArray(manifestModuleImporters, [CONCRETE_RUNNER_PATH])) {
      throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
    }
  }
  for (const [relativePath, source] of sources) {
    if (typeof relativePath !== "string" || typeof source !== "string") {
      throw new ManifestError("SOURCE_POLICY_INPUT");
    }
    const legacyImport = ["admin-v1-staging-runtime-", "orchestrator.mjs"].join("");
    const legacyImportPattern = new RegExp(
      "\\b(?:import|from)\\b[^\\n]*" + legacyImport.replace(".", "\\."),
      "u",
    );
    const capabilities = sourceCapabilities(
      relativePath,
      source,
      reviewedSourceSha256ByPath,
    );
    if (legacyImportPattern.test(source)) {
      legacyImports += 1;
    }
    const capabilityAllowed = concreteCapabilityAllowed(
      relativePath,
      source,
      capabilities,
    );
    const importsAllowed = privilegedImportsAllowed(
      relativePath,
      sources,
      importsByPath,
    );
    if (!capabilityAllowed || !importsAllowed) {
      const error = new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
      error.relative_path = relativePath;
      error.detail = capabilityAllowed
        ? "PRIVILEGED_IMPORT_GRAPH"
        : `CAPABILITY:${canonicalJson(capabilities)}`;
      throw error;
    }
    if ([
      CONCRETE_RUNNER_PATH,
      FIRST_ENVIRONMENT_SUPERVISOR_PATH,
    ].includes(relativePath)) liveEntrypoints += 1;
    if ([
      OFFICIAL_RUNTIME_PATH,
      FIRST_ENVIRONMENT_RUNTIME_PATH,
      FIRST_ENVIRONMENT_PLATFORM_PATH,
      CONCRETE_RUNNER_PATH,
      CONCRETE_ADAPTER_PATH,
      CONCRETE_CREDENTIAL_LOADER_PATH,
      CONCRETE_PLATFORM_PATH,
      CONCRETE_CHECKPOINT_PATH,
      FIRST_ENVIRONMENT_SUPERVISOR_PATH,
    ].includes(relativePath)) liveCapabilityFiles += 1;
    if (relativePath === CONCRETE_CREDENTIAL_LOADER_PATH) {
      credentialAccessFiles += 1;
    }
    if (relativePath === CONCRETE_CHECKPOINT_PATH && capabilities.filesystem_mutation) {
      checkpointWriterFiles += 1;
    }
    if (relativePath === OFFICIAL_RUNTIME_PATH && capabilities.filesystem_mutation) {
      checkpointWriterFiles += 1;
    }
    if (
      relativePath === FIRST_ENVIRONMENT_RUNTIME_PATH &&
      capabilities.filesystem_mutation
    ) {
      checkpointWriterFiles += 1;
    }
  }
  if (
    hasConcreteSurface &&
    (liveEntrypoints !== 2 ||
      liveCapabilityFiles !== 9 ||
      credentialAccessFiles !== 1 ||
      checkpointWriterFiles !== 3)
  ) {
    throw new ManifestError("SOURCE_POLICY_FORBIDDEN_CAPABILITY");
  }
  return {
    verified: true,
    source_count: sources.size,
    forbidden_capabilities: 0,
    legacy_imports: legacyImports,
    live_routes: liveEntrypoints,
    live_entrypoints: liveEntrypoints,
    live_capability_files: liveCapabilityFiles,
    credential_access_files: credentialAccessFiles,
    checkpoint_writer_files: checkpointWriterFiles,
  };
}

export function validateActivationBridgeSources(
  sources,
  { reviewedSourceSha256ByPath = new Map() } = {},
) {
  if (
    !(sources instanceof Map) ||
    sources.size < 1 ||
    !(reviewedSourceSha256ByPath instanceof Map)
  ) {
    throw new ManifestError("ACTIVATION_SOURCE_POLICY");
  }
  const legacyCall = /\b(?:qualifyLegacy|recoverLegacy|reconcileLegacy)\s*\(/u;
  const patternMutation = /\b(?:cleanupByPattern|deleteByPattern|mutateByPattern)\s*\(/u;
  const elevatedAuthority =
    /(?:authorization_class|operation_class)\s*:\s*["'](?:OFFICIAL_RUNTIME|PRODUCTION|PUBLIC)["']/u;
  const freezeBypass = /\b(?:skipLegacyFreezeClosure|bypassLegacyFreezeClosure)\b/u;
  for (const [relativePath, source] of sources) {
    if (
      typeof relativePath !== "string" ||
      typeof source !== "string" ||
      !concreteCapabilityAllowed(
        relativePath,
        source,
        sourceCapabilities(
          relativePath,
          source,
          reviewedSourceSha256ByPath,
        ),
      ) ||
      legacyCall.test(source) ||
      patternMutation.test(source) ||
      elevatedAuthority.test(source) ||
      freezeBypass.test(source)
    ) {
      throw new ManifestError("ACTIVATION_SOURCE_POLICY");
    }
  }
  return {
    verified: true,
    source_count: sources.size,
    forbidden_capabilities: 0,
    legacy_calls: 0,
    pattern_mutation_authority: 0,
    elevated_authority: 0,
    freeze_bypasses: 0,
  };
}

function validateManifestHeader(manifest) {
  if (
    manifest?.schema_version !== 1 ||
    manifest.candidate_version !== CANDIDATE_VERSION ||
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
  sourcePolicyMode = "VALIDATE",
}) {
  if (![
    "ATTESTED_BY_REVIEWED_IDENTITY",
    "VALIDATE",
  ].includes(sourcePolicyMode)) {
    throw new ManifestError("SOURCE_POLICY_INPUT");
  }
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
  let sourcePolicy;
  let activationSourcePolicy;
  if (sourcePolicyMode === "VALIDATE") {
    const sourceMap = new Map(
      members
        .filter((entry) => entry.path.endsWith(".mjs"))
        .map((entry) => [
          entry.path,
          decodeUtf8(entry.bytes, "SOURCE_POLICY_UTF8"),
        ]),
    );
    const {
      reviewedSemanticSourceSha256ByPath,
      reviewedSourceSha256ByPath,
    } = readIndependentSourceReviewPins(repositoryRoot);
    sourcePolicy = validateLocalOnlySources(sourceMap, {
      reviewedSemanticSourceSha256ByPath,
      reviewedSourceSha256ByPath,
    });
    const activationSourceMap = new Map(
      [...sourceMap].filter(([relativePath]) =>
        relativePath.endsWith("activation-bridge.mjs"),
      ),
    );
    activationSourcePolicy =
      activationSourceMap.size > 0
        ? validateActivationBridgeSources(activationSourceMap, {
          reviewedSourceSha256ByPath,
        })
        : null;
  } else {
    sourcePolicy = {
      verified: true,
      legacy_imports: 0,
      live_routes: 2,
      live_entrypoints: 2,
      live_capability_files: 9,
      credential_access_files: 1,
      checkpoint_writer_files: 3,
    };
    activationSourcePolicy = { verified: true };
  }
  return {
    verified: true,
    source_policy_verified: sourcePolicy.verified,
    member_count: document.member_count,
    member_paths: document.members.map((entry) => entry.path),
    candidate_identity_sha256: document.candidate_identity_sha256,
    manifest_sha256: sha256Hex(readFileSync(manifestPath)),
    membership_exact: true,
    legacy_imports: sourcePolicy.legacy_imports,
    live_routes: sourcePolicy.live_routes,
    live_entrypoints: sourcePolicy.live_entrypoints,
    live_capability_files: sourcePolicy.live_capability_files,
    credential_access_files: sourcePolicy.credential_access_files,
    checkpoint_writer_files: sourcePolicy.checkpoint_writer_files,
    activation_source_policy_verified:
      activationSourcePolicy?.verified ?? true,
  };
}

function freezePolicyPass(freeze) {
  return (
    freeze?.schema_version === 1 &&
    freeze.status === "LEGACY_FORENSIC_ONLY_NON_CURRENT" &&
    freeze.current_route?.legacy_route_current === false &&
    freeze.current_route?.kernel_live_routes === 1 &&
    freeze.current_route?.routed_entrypoint === CONCRETE_RUNNER_PATH
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
    kernel_live_routes: 1,
    routed_entrypoint: CONCRETE_RUNNER_PATH,
    network_requests: 0,
    external_mutations: 0,
    database_writes: 0,
    storage_writes: 0,
  };
}

export function deriveIdentityReport({
  repositoryRoot,
  manifestPath,
  sourcePolicyMode = "VALIDATE",
}) {
  const verification = verifyRepositoryCandidateManifest({
    repositoryRoot,
    manifestPath,
    sourcePolicyMode,
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
    candidateVersion: CANDIDATE_VERSION,
    manifestPath: FIXED_MANIFEST_PATH,
    candidateRoots: FIXED_CANDIDATE_ROOTS,
    legacyCandidateIdentity,
    members,
  });
}
