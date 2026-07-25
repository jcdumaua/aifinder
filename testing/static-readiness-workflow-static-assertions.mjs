import { readFileSync } from "node:fs";
import {
  GovernanceError,
  assertRegularFile,
  categoricalFailure,
  readStrictJson,
} from "./static-governance-utils.mjs";

const WORKFLOW_PATH = ".github/workflows/static-readiness.yml";
const PACKAGE_PATH = "package.json";
const CHECKOUT_SHA = "3d3c42e5aac5ba805825da76410c181273ba90b1";
const SETUP_NODE_SHA = "820762786026740c76f36085b0efc47a31fe5020";
const NODE_VERSION = "24.15.0";
const EXPECTED_JOBS = new Set([
  "policy",
  "lint",
  "typecheck",
  "static-readiness",
]);
const EXPECTED_SCRIPTS = {
  "test:static-safety-manifest":
    "node testing/static-test-safety-manifest.test.mjs",
  "test:readiness-coverage":
    "node testing/readiness-coverage-matrix.test.mjs",
  "test:static-readiness-workflow":
    "node testing/static-readiness-workflow-static-assertions.mjs",
  "test:accessibility-responsive-static":
    "node testing/accessibility-responsive-static-assertions.mjs",
  "test:static-readiness-core": "node testing/run-static-readiness.mjs",
};
const INSTALL = "npm ci --ignore-scripts --no-audit --no-fund";
const EXPECTED_RUNS = {
  policy: [
    INSTALL,
    "npm run test:static-safety-manifest",
    "npm run test:readiness-coverage",
    "npm run test:static-readiness-workflow",
    "npm run test:accessibility-responsive-static",
  ],
  lint: [INSTALL, "npm run lint -- --quiet"],
  typecheck: [INSTALL, "npm run typecheck"],
  "static-readiness": [INSTALL, "npm run test:static-readiness-core"],
};

function fail(stage) {
  throw new GovernanceError(stage);
}

function assert(condition, stage) {
  if (!condition) fail(stage);
}

function executableLines(source) {
  return source
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+#.*$/, ""))
    .filter((line) => line.trim() !== "" && !line.trimStart().startsWith("#"));
}

function parseWorkflow(source) {
  const lines = executableLines(source);
  const jobs = new Map();
  const uses = [];
  const runs = [];
  const triggers = new Set();
  const topPermissions = Object.create(null);
  let section = "";
  let currentJob = null;
  let currentStep = null;
  let inTopPermissions = false;
  let inOn = false;
  let currentTrigger = null;
  const triggerBranches = new Map();

  for (const line of lines) {
    const indent = line.match(/^ */)[0].length;
    const trimmed = line.trim();
    if (indent === 0 && trimmed === "on:") {
      section = "on";
      inOn = true;
      inTopPermissions = false;
      currentJob = null;
      currentTrigger = null;
      continue;
    }
    if (indent === 0 && trimmed === "permissions:") {
      section = "permissions";
      inTopPermissions = true;
      inOn = false;
      currentJob = null;
      currentTrigger = null;
      continue;
    }
    if (indent === 0 && trimmed === "jobs:") {
      section = "jobs";
      inTopPermissions = false;
      inOn = false;
      currentJob = null;
      currentTrigger = null;
      continue;
    }
    if (indent === 0) {
      section = "";
      inTopPermissions = false;
      inOn = false;
      currentJob = null;
      currentTrigger = null;
    }
    if (inOn && indent === 2) {
      const match = trimmed.match(/^([A-Za-z0-9_-]+):/);
      if (match) {
        currentTrigger = match[1];
        triggers.add(currentTrigger);
      }
    }
    if (inOn && currentTrigger && indent === 4) {
      const match = trimmed.match(/^branches:\s*\[([^\]]*)\]$/);
      if (match) {
        triggerBranches.set(
          currentTrigger,
          match[1]
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean),
        );
      }
    }
    if (inTopPermissions && indent === 2) {
      const match = trimmed.match(/^([A-Za-z0-9_-]+):\s*(\S+)$/);
      if (match) topPermissions[match[1]] = match[2];
    }
    if (section === "jobs" && indent === 2) {
      const match = trimmed.match(/^([A-Za-z0-9_-]+):$/);
      if (match) {
        currentJob = {
          id: match[1],
          needs: [],
          timeout: null,
          runsOn: null,
          runs: [],
          uses: [],
          permissions: [],
          checkoutPersistCredentialsFalse: false,
          nodeVersion: null,
        };
        jobs.set(currentJob.id, currentJob);
        currentStep = null;
        continue;
      }
    }
    if (!currentJob) continue;
    if (indent === 4 && trimmed.startsWith("needs:")) {
      const value = trimmed.slice("needs:".length).trim();
      currentJob.needs = value
        .replace(/^\[/, "")
        .replace(/\]$/, "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (indent === 4 && trimmed.startsWith("runs-on:")) {
      currentJob.runsOn = trimmed.slice("runs-on:".length).trim();
    } else if (indent === 4 && trimmed.startsWith("timeout-minutes:")) {
      currentJob.timeout = Number(trimmed.split(":")[1].trim());
    } else if (indent >= 6 && trimmed.startsWith("- uses:")) {
      const value = trimmed.slice("- uses:".length).trim();
      currentJob.uses.push(value);
      uses.push(value);
      currentStep = value;
    } else if (indent >= 6 && trimmed.startsWith("- run:")) {
      const value = trimmed.slice("- run:".length).trim();
      currentJob.runs.push(value);
      runs.push(value);
      currentStep = "run";
    } else if (
      currentStep?.startsWith("actions/checkout@") &&
      indent >= 8 &&
      trimmed === "persist-credentials: false"
    ) {
      currentJob.checkoutPersistCredentialsFalse = true;
    } else if (
      currentStep?.startsWith("actions/setup-node@") &&
      indent >= 8 &&
      trimmed.startsWith("node-version:")
    ) {
      currentJob.nodeVersion = trimmed.split(":").slice(1).join(":").trim().replace(/['"]/g, "");
    }
  }
  return {
    lines,
    jobs,
    uses,
    runs,
    triggers,
    triggerBranches,
    topPermissions,
  };
}

function validateWorkflow() {
  let absolute;
  try {
    absolute = assertRegularFile(WORKFLOW_PATH);
  } catch (caught) {
    if (
      caught instanceof GovernanceError &&
      caught.stage === "REGULAR_FILE_ABSENT"
    ) {
      fail("STATIC_READINESS_WORKFLOW_ABSENT");
    }
    throw caught;
  }
  const source = readFileSync(absolute, "utf8");
  const parsed = parseWorkflow(source);
  const packageJson = readStrictJson(PACKAGE_PATH);

  assert(
    parsed.triggers.has("pull_request") &&
      parsed.triggers.has("push") &&
      parsed.triggers.has("workflow_dispatch") &&
      parsed.triggers.size === 3,
    "WORKFLOW_TRIGGERS",
  );
  assert(
    parsed.triggerBranches.get("push")?.length === 1 &&
      parsed.triggerBranches.get("push")[0] === "main",
    "WORKFLOW_PUSH_BRANCH",
  );
  for (const forbidden of [
    "pull_request_target",
    "schedule",
    "workflow_run",
    "repository_dispatch",
  ]) {
    assert(!parsed.triggers.has(forbidden), "WORKFLOW_UNSAFE_TRIGGER");
  }
  assert(
    Object.keys(parsed.topPermissions).length === 1 &&
      parsed.topPermissions.contents === "read",
    "WORKFLOW_PERMISSIONS",
  );
  assert(
    parsed.lines.some(
      (line) =>
        line.trim() ===
        "group: static-readiness-${{ github.workflow }}-${{ github.ref }}",
    ) &&
      parsed.lines.some((line) => line.trim() === "cancel-in-progress: true"),
    "WORKFLOW_CONCURRENCY",
  );
  assert(
    parsed.jobs.size === EXPECTED_JOBS.size &&
      [...EXPECTED_JOBS].every((job) => parsed.jobs.has(job)),
    "WORKFLOW_JOBS",
  );
  for (const [jobId, job] of parsed.jobs) {
    assert(
      Number.isInteger(job.timeout) && job.timeout > 0 && job.timeout <= 15,
      "WORKFLOW_TIMEOUT",
    );
    assert(job.runsOn === "ubuntu-latest", "WORKFLOW_RUNNER");
    assert(job.checkoutPersistCredentialsFalse, "WORKFLOW_CHECKOUT_CREDENTIALS");
    assert(job.nodeVersion === NODE_VERSION, "WORKFLOW_NODE_VERSION");
    assert(
      job.uses.includes(`actions/checkout@${CHECKOUT_SHA}`) &&
        job.uses.includes(`actions/setup-node@${SETUP_NODE_SHA}`),
      "WORKFLOW_ACTION_PIN",
    );
    if (jobId !== "policy") {
      assert(
        job.needs.length === 1 && job.needs[0] === "policy",
        "WORKFLOW_JOB_DEPENDENCY",
      );
    }
  }
  assert(
    parsed.uses.every(
      (value) =>
        value === `actions/checkout@${CHECKOUT_SHA}` ||
        value === `actions/setup-node@${SETUP_NODE_SHA}`,
    ),
    "WORKFLOW_ACTION_ALLOWLIST",
  );
  assert(
    parsed.uses.every((value) => /@[0-9a-f]{40}$/.test(value)),
    "WORKFLOW_ACTION_PIN",
  );
  assert(
    parsed.runs.filter(
      (value) => value === "npm ci --ignore-scripts --no-audit --no-fund",
    ).length === 4,
    "WORKFLOW_INSTALL_COMMAND",
  );
  const prohibitedRun =
    /(npm run (?:build|check|dev|start)|playwright|supabase|psql|curl|wget|deploy|vercel|npx)/i;
  assert(
    parsed.runs.every((value) => !prohibitedRun.test(value)),
    "WORKFLOW_PROHIBITED_STEP",
  );
  assert(
    !parsed.lines.some((line) =>
      /(continue-on-error|secrets\.|vars\.|services:|environment:|\benv:|permissions:\s*write)/i.test(
        line,
      ),
    ),
    "WORKFLOW_PROHIBITED_CAPABILITY",
  );
  assert(
    !parsed.lines.some((line) =>
      /^\s*[A-Za-z0-9_-]+:\s*write(?:-all)?\s*$/i.test(line),
    ),
    "WORKFLOW_WRITE_PERMISSION",
  );
  assert(
    !parsed.lines.some((line) =>
      /(npm run (?:build|check|dev|start)|playwright|supabase|psql|curl|wget|deploy|vercel|npx)/i.test(
        line,
      ),
    ),
    "WORKFLOW_PROHIBITED_STEP",
  );

  const policyRuns = parsed.jobs.get("policy").runs;
  assert(
    [
      "npm run test:static-safety-manifest",
      "npm run test:readiness-coverage",
      "npm run test:static-readiness-workflow",
    ].every((command) => policyRuns.includes(command)),
    "WORKFLOW_POLICY_COMMANDS",
  );
  assert(
    parsed.jobs.get("lint").runs.includes("npm run lint -- --quiet"),
    "WORKFLOW_LINT_COMMAND",
  );
  assert(
    parsed.jobs.get("typecheck").runs.includes("npm run typecheck"),
    "WORKFLOW_TYPECHECK_COMMAND",
  );
  assert(
    parsed.jobs
      .get("static-readiness")
      .runs.includes("npm run test:static-readiness-core"),
    "WORKFLOW_STATIC_COMMAND",
  );
  for (const [jobId, expectedRuns] of Object.entries(EXPECTED_RUNS)) {
    const actualRuns = parsed.jobs.get(jobId).runs;
    assert(
      actualRuns.length === expectedRuns.length &&
        actualRuns.every((value, index) => value === expectedRuns[index]),
      "WORKFLOW_EXACT_RUN_SET",
    );
  }
  for (const [name, value] of Object.entries(EXPECTED_SCRIPTS)) {
    assert(packageJson.scripts[name] === value, "WORKFLOW_PACKAGE_SCRIPT_DRIFT");
  }
  return {
    jobs: parsed.jobs.size,
    actions: parsed.uses.length,
    steps: parsed.runs.length,
  };
}

try {
  const result = validateWorkflow();
  console.log(
    `PASS_STATIC_READINESS_WORKFLOW jobs=${result.jobs} action_uses=${result.actions} run_steps=${result.steps} failures=0 internal_failures=0`,
  );
} catch (caught) {
  if (caught instanceof GovernanceError) {
    categoricalFailure(caught.stage);
    console.log("FAIL_STATIC_READINESS_WORKFLOW failures=1 internal_failures=0");
  } else {
    console.log("INTERNAL_FAIL_STATIC_READINESS_WORKFLOW");
    console.log("FAIL_STATIC_READINESS_WORKFLOW failures=0 internal_failures=1");
  }
  process.exitCode = 1;
}
