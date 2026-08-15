import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  buildStaticReadinessReport,
  deriveIdentityReport,
  generateCandidateManifest,
  verifyRepositoryCandidateManifest,
} from "./manifest.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const MANIFEST_PATH = path.join(
  ROOT,
  "scripts/launch-operations-kernel/candidate-manifest.json",
);
const LEGACY_CANDIDATE =
  "09a4066876033d68aaa43c8a1a9c703eb6e0176f8d32aacdceccc28e0134de71";
const failures = [];
let assertions = 0;

async function check(name, operation) {
  try {
    await operation();
    assertions += 1;
  } catch (error) {
    failures.push(`${name}:${error?.code ?? error?.message ?? "UNKNOWN"}`);
  }
}

const virtualMembers = [
  {
    path: "docs/example.md",
    role: "DOCUMENTATION",
    surface: "governance",
    mode: "0644",
    bytes: Buffer.from("example\n", "utf8"),
  },
  {
    path: "scripts/example.mjs",
    role: "SOURCE",
    surface: "runtime",
    mode: "0644",
    bytes: Buffer.from("export const value = 1;\n", "utf8"),
  },
];

await check("canonical manifest determinism", async () => {
  const input = {
    candidateVersion: "example-v1",
    manifestPath: "scripts/candidate-manifest.json",
    candidateRoots: ["docs/example.md", "scripts"],
    legacyCandidateIdentity: LEGACY_CANDIDATE,
    members: virtualMembers,
  };
  const first = generateCandidateManifest(input);
  const second = generateCandidateManifest({
    ...input,
    members: [...virtualMembers].reverse(),
  });
  assert.deepEqual(first, second);
  assert.deepEqual(first.members.map((entry) => entry.path), [
    "docs/example.md",
    "scripts/example.mjs",
  ]);
});

await check("derived digest determinism", async () => {
  const manifest = generateCandidateManifest({
    candidateVersion: "example-v1",
    manifestPath: "scripts/candidate-manifest.json",
    candidateRoots: ["docs/example.md", "scripts"],
    legacyCandidateIdentity: LEGACY_CANDIDATE,
    members: virtualMembers,
  });
  assert.deepEqual(
    Object.keys(manifest.derived_surface_sha256),
    ["governance", "runtime"],
  );
  assert.match(manifest.candidate_identity_sha256, /^[0-9a-f]{64}$/u);
  assert.notEqual(
    manifest.derived_surface_sha256.governance.sha256,
    manifest.derived_surface_sha256.runtime.sha256,
  );
});

await check("current candidate verifies", async () => {
  const report = verifyRepositoryCandidateManifest({
    repositoryRoot: ROOT,
    manifestPath: MANIFEST_PATH,
  });
  assert.equal(report.verified, true);
  assert.equal(report.source_policy_verified, true);
  assert.ok(report.member_count >= 9);
});

await check("source mutation is detected", async () => {
  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  assert.throws(
    () =>
      verifyRepositoryCandidateManifest({
        repositoryRoot: ROOT,
        manifestPath: MANIFEST_PATH,
        readMember(relativePath) {
          const bytes = readFileSync(path.join(ROOT, relativePath));
          return relativePath.endsWith("kernel.mjs")
            ? Buffer.concat([bytes, Buffer.from("\n", "utf8")])
            : bytes;
        },
        manifest,
      }),
    (error) => error?.code === "CANDIDATE_MEMBER_IDENTITY_MISMATCH",
  );
});

await check("static readiness integration", async () => {
  const report = buildStaticReadinessReport({
    repositoryRoot: ROOT,
    manifestPath: MANIFEST_PATH,
  });
  assert.deepEqual(report, {
    schema_version: 1,
    status: "PASS",
    candidate_verified: true,
    source_policy_verified: true,
    legacy_route_current: false,
    kernel_live_routes: 0,
    network_requests: 0,
    external_mutations: 0,
    database_writes: 0,
    storage_writes: 0,
  });
});

await check("historical and current candidates are separated", async () => {
  const report = deriveIdentityReport({
    repositoryRoot: ROOT,
    manifestPath: MANIFEST_PATH,
  });
  assert.equal(report.legacy_candidate_identity_sha256, LEGACY_CANDIDATE);
  assert.notEqual(report.candidate_identity_sha256, LEGACY_CANDIDATE);
  assert.equal(report.historical_current_equal, false);
  assert.match(report.manifest_sha256, /^[0-9a-f]{64}$/u);
});

if (failures.length > 0) {
  console.log(
    `FAIL_LAUNCH_OPERATIONS_MANIFEST assertions=${assertions} failures=${failures.length} failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_LAUNCH_OPERATIONS_MANIFEST assertions=${assertions} deterministic=true source_policy=true failures=0 internal_failures=0`,
  );
}
