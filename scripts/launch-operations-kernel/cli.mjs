import path from "node:path";
import { pathToFileURL } from "node:url";
import { canonicalJson } from "./canonical.mjs";
import {
  assertLegacyFreezePolicy,
  classifyLegacySnapshot,
  loadCurrentLegacySnapshot,
} from "./legacy-classifier.mjs";
import {
  buildStaticReadinessReport,
  deriveIdentityReport,
  readStrictJsonFile,
  verifyRepositoryCandidateManifest,
} from "./manifest.mjs";

export const CLI_MODES = Object.freeze([
  "classify-current-legacy",
  "derive-identities",
  "static-readiness",
  "verify-candidate",
]);

function candidateManifestPath(repositoryRoot) {
  return path.join(
    repositoryRoot,
    "scripts/launch-operations-kernel/candidate-manifest.json",
  );
}

function freezePath(repositoryRoot) {
  return path.join(
    repositoryRoot,
    "scripts/launch-operations-kernel/legacy-freeze.json",
  );
}

export async function dispatchCli(
  argumentsList,
  {
    repositoryRoot,
    writeOutput = (value) => console.log(canonicalJson(value)),
    loadLegacySnapshot = loadCurrentLegacySnapshot,
  },
) {
  if (
    !Array.isArray(argumentsList) ||
    argumentsList.length !== 1 ||
    !CLI_MODES.includes(argumentsList[0])
  ) {
    return { exit_code: 1, code: "KERNEL_CLI_MODE_DENIED" };
  }
  const mode = argumentsList[0];
  const manifestPath = candidateManifestPath(repositoryRoot);
  let output;
  if (mode === "verify-candidate") {
    output = verifyRepositoryCandidateManifest({ repositoryRoot, manifestPath });
  } else if (mode === "derive-identities") {
    output = deriveIdentityReport({ repositoryRoot, manifestPath });
  } else if (mode === "static-readiness") {
    output = buildStaticReadinessReport({ repositoryRoot, manifestPath });
  } else {
    const freeze = readStrictJsonFile(freezePath(repositoryRoot));
    assertLegacyFreezePolicy(freeze);
    output = classifyLegacySnapshot(loadLegacySnapshot({ freeze }));
  }
  writeOutput(output);
  return { exit_code: 0, code: "PASS" };
}

async function main() {
  const repositoryRoot = path.resolve(import.meta.dirname, "../..");
  try {
    const result = await dispatchCli(process.argv.slice(2), { repositoryRoot });
    if (result.exit_code !== 0) {
      console.log(canonicalJson({ status: "FAIL", code: result.code }));
      process.exitCode = result.exit_code;
    }
  } catch (error) {
    console.log(
      canonicalJson({
        status: "FAIL",
        code: error?.code ?? "KERNEL_CLI_INTERNAL_FAILURE",
      }),
    );
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  await main();
}
