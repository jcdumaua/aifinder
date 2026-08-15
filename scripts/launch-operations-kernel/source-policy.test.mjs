import assert from "node:assert/strict";
import path from "node:path";
import { CLI_MODES, dispatchCli } from "./cli.mjs";
import {
  validateLocalOnlySources,
  verifyRepositoryCandidateManifest,
} from "./manifest.mjs";

const ROOT = path.resolve(import.meta.dirname, "../..");
const MANIFEST_PATH = path.join(
  ROOT,
  "scripts/launch-operations-kernel/candidate-manifest.json",
);
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

await check("safe source accepted", async () => {
  const result = validateLocalOnlySources(
    new Map([
      [
        "scripts/read-only.mjs",
        'import { readFileSync } from "node:fs";\nexport const read = readFileSync;\n',
      ],
    ]),
  );
  assert.deepEqual(result, {
    verified: true,
    source_count: 1,
    forbidden_capabilities: 0,
    legacy_imports: 0,
    live_routes: 0,
  });
});

for (const [name, source] of [
  [
    "child process mutation rejected",
    'import { spawn } from "node:' + "child" + "_" + 'process";\nspawn("true");\n',
  ],
  [
    "filesystem mutation rejected",
    'import { ' + "write" + 'FileSync } from "node:fs";\n' + "write" + 'FileSync("x", "y");\n',
  ],
  ["network mutation rejected", 'await ' + "fet" + 'ch("https://example.com");\n'],
  ["environment mutation rejected", "export const value = " + "process" + ".env.SECRET;\n"],
  [
    "legacy route mutation rejected",
    'import "../../testing/' + "admin-v1-staging-runtime-" + 'orchestrator.mjs";\n',
  ],
]) {
  await check(name, async () => {
    assert.throws(
      () => validateLocalOnlySources(new Map([["scripts/mutant.mjs", source]])),
      (error) => error?.code === "SOURCE_POLICY_FORBIDDEN_CAPABILITY",
    );
  });
}

await check("actual candidate source policy", async () => {
  const result = verifyRepositoryCandidateManifest({
    repositoryRoot: ROOT,
    manifestPath: MANIFEST_PATH,
  });
  assert.equal(result.source_policy_verified, true);
  assert.equal(result.legacy_imports, 0);
  assert.equal(result.live_routes, 0);
});

await check("legacy and live CLI modes denied", async () => {
  const output = [];
  let classifierCalls = 0;
  const result = await dispatchCli(["recover-legacy"], {
    repositoryRoot: ROOT,
    writeOutput(value) {
      output.push(value);
    },
    loadLegacySnapshot() {
      classifierCalls += 1;
      throw new Error("must not run");
    },
  });
  assert.equal(result.exit_code, 1);
  assert.equal(result.code, "KERNEL_CLI_MODE_DENIED");
  assert.equal(classifierCalls, 0);
  assert.deepEqual(output, []);
  assert.deepEqual(CLI_MODES, [
    "classify-current-legacy",
    "derive-identities",
    "static-readiness",
    "verify-candidate",
  ]);
});

if (failures.length > 0) {
  console.log(
    `FAIL_LAUNCH_OPERATIONS_SOURCE_POLICY assertions=${assertions} mutations=5 failures=${failures.length} failed=${failures.join(",")}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `PASS_LAUNCH_OPERATIONS_SOURCE_POLICY assertions=${assertions} mutations=5 network=0 live_routes=0 legacy_imports=0 failures=0 internal_failures=0`,
  );
}
