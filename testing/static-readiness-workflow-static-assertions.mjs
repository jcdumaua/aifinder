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
  "test:phase-compiler":
    "node testing/phase-compiler/phase-compiler.test.mjs && node testing/phase-compiler/phase-compiler-security.test.mjs && node testing/phase-compiler/phase-compiler-determinism.test.mjs",
  "test:static-safety-manifest":
    "node testing/static-test-safety-manifest.test.mjs",
  "test:readiness-coverage":
    "node testing/readiness-coverage-matrix.test.mjs",
  "test:public-launch-blockers":
    "node testing/public-launch-blocker-registry.test.mjs",
  "test:public-production-runtime-planning":
    "node testing/public-production-runtime-planning-manifest.test.mjs",
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
    "npm run test:phase-compiler",
    "npm run test:static-safety-manifest",
    "npm run test:readiness-coverage",
    "npm run test:public-launch-blockers",
    "npm run test:public-production-runtime-planning",
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

function workflowKey(trimmed) {
  return trimmed.match(/^(?:-\s+)?([A-Za-z0-9_-]+):/)?.[1] ?? null;
}

function rejectWorkflowCapabilityKey(key) {
  const stages = new Map([
    ["defaults", "WORKFLOW_DEFAULTS_FORBIDDEN"],
    ["shell", "WORKFLOW_CUSTOM_SHELL_FORBIDDEN"],
    ["container", "WORKFLOW_CONTAINER_FORBIDDEN"],
    ["options", "WORKFLOW_CONTAINER_OPTIONS_FORBIDDEN"],
    ["strategy", "WORKFLOW_STRATEGY_FORBIDDEN"],
    ["services", "WORKFLOW_SERVICES_FORBIDDEN"],
    ["env", "WORKFLOW_ENV_FORBIDDEN"],
    ["continue-on-error", "WORKFLOW_CONTINUE_ON_ERROR_FORBIDDEN"],
    ["working-directory", "WORKFLOW_WORKING_DIRECTORY_FORBIDDEN"],
  ]);
  const stage = stages.get(key);
  if (stage) fail(stage);
}

function validateWorkflowExecutionStructure(source) {
  const lines = executableLines(source);
  const topLevel = new Set();
  const jobKeys = new Map();
  const triggerKeys = new Set();
  const permissionKeys = new Set();
  const concurrencyKeys = new Set();
  const jobSteps = new Map();
  let section = null;
  let trigger = null;
  let job = null;
  let inSteps = false;
  let step = null;
  let withBlock = false;
  let pushBranchesSeen = false;

  for (const line of lines) {
    const indent = line.match(/^ */)[0].length;
    const trimmed = line.trim();
    const key = workflowKey(trimmed);
    rejectWorkflowCapabilityKey(key);

    if (indent === 0) {
      const allowed = new Set(["name", "on", "permissions", "concurrency", "jobs"]);
      assert(key && allowed.has(key), "WORKFLOW_TOP_LEVEL_EXECUTION_KEY");
      assert(!topLevel.has(key), "WORKFLOW_TOP_LEVEL_DUPLICATE_KEY");
      topLevel.add(key);
      section = key;
      trigger = null;
      job = null;
      inSteps = false;
      step = null;
      withBlock = false;
      assert(
        (key === "name" && trimmed === "name: Static readiness") ||
          (key !== "name" && trimmed === `${key}:`),
        "WORKFLOW_TOP_LEVEL_EXECUTION_VALUE",
      );
      continue;
    }

    if (section === "on") {
      if (indent === 2) {
        assert(
          ["pull_request", "push", "workflow_dispatch"].includes(key) &&
            trimmed === `${key}:`,
          "WORKFLOW_TRIGGER_EXECUTION_KEY",
        );
        assert(!triggerKeys.has(key), "WORKFLOW_TRIGGER_DUPLICATE_KEY");
        triggerKeys.add(key);
        trigger = key;
        continue;
      }
      assert(
        indent === 4 &&
          trigger === "push" &&
          trimmed === "branches: [main]",
        "WORKFLOW_TRIGGER_EXECUTION_STRUCTURE",
      );
      assert(!pushBranchesSeen, "WORKFLOW_TRIGGER_DUPLICATE_BRANCHES");
      pushBranchesSeen = true;
      continue;
    }

    if (section === "permissions") {
      assert(indent === 2 && trimmed === "contents: read", "WORKFLOW_PERMISSION_EXECUTION_STRUCTURE");
      assert(!permissionKeys.has(key), "WORKFLOW_PERMISSION_DUPLICATE_KEY");
      permissionKeys.add(key);
      continue;
    }

    if (section === "concurrency") {
      assert(
        indent === 2 &&
          (trimmed === "group: static-readiness-${{ github.workflow }}-${{ github.ref }}" ||
            trimmed === "cancel-in-progress: true"),
        "WORKFLOW_CONCURRENCY_EXECUTION_STRUCTURE",
      );
      assert(!concurrencyKeys.has(key), "WORKFLOW_CONCURRENCY_DUPLICATE_KEY");
      concurrencyKeys.add(key);
      continue;
    }

    assert(section === "jobs", "WORKFLOW_SECTION_EXECUTION_STRUCTURE");
    if (indent === 2) {
      assert(
        ["policy", "lint", "typecheck", "static-readiness"].includes(key) &&
          trimmed === `${key}:`,
        "WORKFLOW_JOB_EXECUTION_KEY",
      );
      assert(!jobKeys.has(key), "WORKFLOW_JOB_DUPLICATE_ID");
      job = key;
      jobKeys.set(job, new Set());
      jobSteps.set(job, []);
      inSteps = false;
      step = null;
      withBlock = false;
      continue;
    }
    assert(job, "WORKFLOW_JOB_EXECUTION_STRUCTURE");
    if (indent === 4) {
      const allowed = new Set(["needs", "runs-on", "timeout-minutes", "steps"]);
      assert(key && allowed.has(key), "WORKFLOW_JOB_EXECUTION_KEY");
      assert(!jobKeys.get(job).has(key), "WORKFLOW_JOB_DUPLICATE_KEY");
      jobKeys.get(job).add(key);
      if (key === "needs") assert(job !== "policy" && trimmed === "needs: policy", "WORKFLOW_JOB_EXECUTION_VALUE");
      if (key === "runs-on") assert(trimmed === "runs-on: ubuntu-latest", "WORKFLOW_JOB_EXECUTION_VALUE");
      if (key === "timeout-minutes") {
        assert(
          trimmed === `timeout-minutes: ${job === "static-readiness" ? "15" : "10"}`,
          "WORKFLOW_JOB_EXECUTION_VALUE",
        );
      }
      if (key === "steps") assert(trimmed === "steps:", "WORKFLOW_JOB_EXECUTION_VALUE");
      inSteps = key === "steps";
      step = null;
      withBlock = false;
      continue;
    }
    assert(inSteps, "WORKFLOW_STEP_EXECUTION_STRUCTURE");
    if (indent === 6) {
      assert(key === "uses" || key === "run", "WORKFLOW_STEP_EXECUTION_KEY");
      step = { type: key, value: trimmed.slice(trimmed.indexOf(":") + 1).trim() };
      step.inputs = [];
      jobSteps.get(job).push(step);
      withBlock = false;
      assert(step.value.length > 0, "WORKFLOW_STEP_EXECUTION_VALUE");
      continue;
    }
    if (indent === 8) {
      assert(step?.type === "uses" && trimmed === "with:", "WORKFLOW_STEP_EXECUTION_KEY");
      assert(!withBlock, "WORKFLOW_STEP_DUPLICATE_WITH");
      withBlock = true;
      continue;
    }
    if (indent === 10) {
      assert(step?.type === "uses" && withBlock, "WORKFLOW_STEP_EXECUTION_STRUCTURE");
      if (step.value.startsWith("actions/checkout@")) {
        assert(trimmed === "persist-credentials: false", "WORKFLOW_CHECKOUT_EXECUTION_INPUT");
      } else if (step.value.startsWith("actions/setup-node@")) {
        assert(trimmed === `node-version: "${NODE_VERSION}"`, "WORKFLOW_NODE_EXECUTION_INPUT");
      } else {
        fail("WORKFLOW_ACTION_EXECUTION_INPUT");
      }
      step.inputs.push(trimmed);
      continue;
    }
    fail("WORKFLOW_EXECUTION_INDENTATION");
  }

  assert(
    topLevel.size === 5 &&
      JSON.stringify([...topLevel]) ===
        JSON.stringify(["name", "on", "permissions", "concurrency", "jobs"]),
    "WORKFLOW_TOP_LEVEL_EXECUTION_SET",
  );
  assert(
    triggerKeys.size === 3 &&
      pushBranchesSeen &&
      JSON.stringify([...triggerKeys]) ===
        JSON.stringify(["pull_request", "push", "workflow_dispatch"]),
    "WORKFLOW_TRIGGER_EXECUTION_SET",
  );
  assert(
    JSON.stringify([...jobKeys.keys()]) === JSON.stringify([...EXPECTED_JOBS]),
    "WORKFLOW_JOB_EXECUTION_ORDER",
  );
  assert(permissionKeys.size === 1 && permissionKeys.has("contents"), "WORKFLOW_PERMISSION_EXECUTION_SET");
  assert(
    concurrencyKeys.size === 2 &&
      concurrencyKeys.has("group") &&
      concurrencyKeys.has("cancel-in-progress"),
    "WORKFLOW_CONCURRENCY_EXECUTION_SET",
  );
  for (const [jobId, keys] of jobKeys) {
    const expected = jobId === "policy"
      ? ["runs-on", "timeout-minutes", "steps"]
      : ["needs", "runs-on", "timeout-minutes", "steps"];
    assert(keys.size === expected.length && expected.every((key) => keys.has(key)), "WORKFLOW_JOB_EXECUTION_SET");
    const expectedSteps = [
      {
        type: "uses",
        value: `actions/checkout@${CHECKOUT_SHA}`,
        inputs: ["persist-credentials: false"],
      },
      {
        type: "uses",
        value: `actions/setup-node@${SETUP_NODE_SHA}`,
        inputs: [`node-version: "${NODE_VERSION}"`],
      },
      ...EXPECTED_RUNS[jobId].map((value) => ({ type: "run", value, inputs: [] })),
    ];
    assert(
      JSON.stringify(jobSteps.get(jobId)) === JSON.stringify(expectedSteps),
      "WORKFLOW_EXACT_EXECUTION_STEP_STRUCTURE",
    );
  }
}

function validateWorkflowStructureMutations(source) {
  const mutations = [
    ["WORKFLOW_DEFAULTS_FORBIDDEN", source.replace("permissions:\n", "defaults:\n  run:\n    shell: bash\n\npermissions:\n")],
    ["WORKFLOW_CUSTOM_SHELL_FORBIDDEN", source.replace("      - run: npm ci --ignore-scripts --no-audit --no-fund", "      - run: npm ci --ignore-scripts --no-audit --no-fund\n        shell: bash")],
    ["WORKFLOW_CONTAINER_FORBIDDEN", source.replace("    runs-on: ubuntu-latest", "    container: node:24\n    runs-on: ubuntu-latest")],
    ["WORKFLOW_CONTAINER_OPTIONS_FORBIDDEN", source.replace("    runs-on: ubuntu-latest", "    options: --privileged\n    runs-on: ubuntu-latest")],
    ["WORKFLOW_STRATEGY_FORBIDDEN", source.replace("    runs-on: ubuntu-latest", "    strategy:\n      matrix:\n        node: [24]\n    runs-on: ubuntu-latest")],
    ["WORKFLOW_SERVICES_FORBIDDEN", source.replace("    runs-on: ubuntu-latest", "    services:\n      helper:\n        image: alpine\n    runs-on: ubuntu-latest")],
    ["WORKFLOW_ENV_FORBIDDEN", source.replace("    runs-on: ubuntu-latest", "    env:\n      MODE: unsafe\n    runs-on: ubuntu-latest")],
    ["WORKFLOW_ENV_FORBIDDEN", source.replace("      - run: npm ci --ignore-scripts --no-audit --no-fund", "      - run: npm ci --ignore-scripts --no-audit --no-fund\n        env:\n          MODE: unsafe")],
    ["WORKFLOW_CONTINUE_ON_ERROR_FORBIDDEN", source.replace("      - run: npm ci --ignore-scripts --no-audit --no-fund", "      - run: npm ci --ignore-scripts --no-audit --no-fund\n        continue-on-error: true")],
    ["WORKFLOW_WORKING_DIRECTORY_FORBIDDEN", source.replace("      - run: npm ci --ignore-scripts --no-audit --no-fund", "      - run: npm ci --ignore-scripts --no-audit --no-fund\n        working-directory: /tmp")],
    ["WORKFLOW_JOB_EXECUTION_KEY", source.replace("    runs-on: ubuntu-latest", "    mystery-capability: enabled\n    runs-on: ubuntu-latest")],
    ["WORKFLOW_STEP_EXECUTION_KEY", source.replace("      - run: npm ci --ignore-scripts --no-audit --no-fund", "      - run: npm ci --ignore-scripts --no-audit --no-fund\n        mystery-capability: enabled")],
  ];
  for (const [expectedStage, mutated] of mutations) {
    let rejected = false;
    try {
      validateWorkflowExecutionStructure(mutated);
    } catch (caught) {
      rejected = caught instanceof GovernanceError && caught.stage === expectedStage;
    }
    assert(rejected, "WORKFLOW_STRUCTURE_MUTATION_ACCEPTED");
  }
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
  validateWorkflowStructureMutations(source);
  validateWorkflowExecutionStructure(source);
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
      "npm run test:phase-compiler",
      "npm run test:static-safety-manifest",
      "npm run test:readiness-coverage",
      "npm run test:public-launch-blockers",
      "npm run test:public-production-runtime-planning",
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
    policyRuns: policyRuns.length,
  };
}

try {
  const result = validateWorkflow();
  console.log(
    `PASS_STATIC_READINESS_WORKFLOW jobs=${result.jobs} action_uses=${result.actions} run_steps=${result.steps} policy_runs=${result.policyRuns} failures=0 internal_failures=0`,
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
