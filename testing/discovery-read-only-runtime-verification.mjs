#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const EXPECTED_REPO = "/Users/jamescarlodumaua/aifinder";
const EXPECTED_ORIGIN = "https://github.com/jcdumaua/aifinder.git";
const EXPECTED_BRANCH = "main";
const SELF_PATH = "testing/discovery-read-only-runtime-verification.mjs";

function printSection(title) {
  console.log(`\n=== ${title} ===`);
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function runGit(args) {
  return execFileSync("git", args, {
    cwd: EXPECTED_REPO,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function readText(relativePath) {
  return fs.readFileSync(path.join(EXPECTED_REPO, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(EXPECTED_REPO, relativePath));
}

function parseExpectedArguments(argv) {
  let expectedHead = null;
  let expectedSubject = null;
  let seenExpectedHead = false;
  let seenExpectedSubject = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--expected-head") {
      if (seenExpectedHead) {
        fail("Duplicate --expected-head.");
        continue;
      }

      seenExpectedHead = true;
      const value = argv[index + 1];

      if (value === undefined || value.startsWith("--")) {
        fail("Missing value for --expected-head.");
        continue;
      }

      expectedHead = value;
      index += 1;
      continue;
    }

    if (arg === "--expected-subject") {
      if (seenExpectedSubject) {
        fail("Duplicate --expected-subject.");
        continue;
      }

      seenExpectedSubject = true;
      const value = argv[index + 1];

      if (value === undefined || value.startsWith("--")) {
        fail("Missing value for --expected-subject.");
        continue;
      }

      expectedSubject = value;
      index += 1;
      continue;
    }

    fail(`Unknown argument: ${arg}.`);
  }

  if (!seenExpectedHead) {
    fail("Missing required --expected-head.");
  }

  if (!seenExpectedSubject) {
    fail("Missing required --expected-subject.");
  }

  if (expectedHead !== null && expectedHead.trim() === "") {
    fail("--expected-head must not be empty or whitespace-only.");
  }

  if (expectedSubject !== null && expectedSubject.trim() === "") {
    fail("--expected-subject must not be empty or whitespace-only.");
  }

  return {
    expectedHead,
    expectedSubject,
  };
}

function walkFiles(relativeDir, predicate = () => true) {
  const root = path.join(EXPECTED_REPO, relativeDir);
  if (!fs.existsSync(root)) return [];

  const output = [];

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }

      const relative = path.relative(EXPECTED_REPO, full).replaceAll(path.sep, "/");
      if (predicate(relative)) {
        output.push(relative);
      }
    }
  }

  walk(root);
  return output.sort();
}

function assertContains(relativePath, markers) {
  const text = readText(relativePath);
  for (const marker of markers) {
    if (!text.includes(marker)) {
      fail(`${relativePath} is missing required marker: ${marker}`);
    } else {
      console.log(`marker_present=true :: ${relativePath} :: ${marker}`);
    }
  }
}

function listPackageDiscoveryScripts() {
  if (!exists("package.json")) return [];
  const packageJson = JSON.parse(readText("package.json"));
  const scripts = packageJson.scripts ?? {};
  return Object.entries(scripts)
    .filter(([name, command]) => `${name} ${command}`.toLowerCase().includes("discovery"))
    .map(([name, command]) => `${name}: ${command}`)
    .sort();
}

function assertNoDiscoveryOptInEnvironment() {
  const keys = Object.keys(process.env)
    .filter((key) => key.startsWith("AIFINDER_RUN_DISCOVERY_"))
    .sort();

  if (keys.length > 0) {
    for (const key of keys) {
      console.error(`forbidden_opt_in_env_present=${key}`);
    }
    fail("One or more AIFINDER_RUN_DISCOVERY_* environment variables are set.");
    return;
  }

  console.log("no_aifinder_run_discovery_environment_variables_set=true");
}

function assertWorkingTreeScope(statusLines) {
  const allowed = new Set([`?? ${SELF_PATH}`, ` M ${SELF_PATH}`, `M ${SELF_PATH}`]);
  const unexpected = statusLines.filter((line) => line && !allowed.has(line));

  if (unexpected.length > 0) {
    console.error("unexpected_working_tree_changes:");
    for (const line of unexpected) console.error(line);
    fail("Working tree contains unexpected changes.");
    return;
  }

  if (statusLines.length === 0) {
    console.log("working_tree_scope=clean");
  } else {
    console.log("working_tree_scope=only_expected_verifier_change");
  }
}

function main() {
  console.log("=== AiFinder Discovery Read-Only Runtime Verification ===");
  console.log("");
  console.log("terminal_workflow=repository_local_static_verifier");
  console.log("operational_mode=read_only");
  console.log("expected_head_input_source=cli_flag");
  console.log("no_live_services=true");
  console.log("no_db_access=true");
  console.log("no_api_invocation=true");
  console.log("no_crawler_extraction_candidate_or_publishing_execution=true");

  const { expectedHead, expectedSubject } = parseExpectedArguments(process.argv.slice(2));

  printSection("Boundary");
  console.log("Repository-local static inspection only.");
  console.log("No direct DB access.");
  console.log("No live DB reads.");
  console.log("No DB mutation.");
  console.log("No admin API invocation.");
  console.log("No local server startup.");
  console.log("No crawler execution.");
  console.log("No extraction execution.");
  console.log("No LLM extraction execution.");
  console.log("No evidence acquisition.");
  console.log("No candidate staging.");
  console.log("No candidate decision execution.");
  console.log("No approve_for_draft.");
  console.log("No public tools writes.");
  console.log("No discovered_tools writes.");
  console.log("No schema/migration/typegen changes.");
  console.log("No package install.");
  console.log("No package/lockfile changes.");

  printSection("Opt-in execution environment guard");
  assertNoDiscoveryOptInEnvironment();

  printSection("Repo identity");
  const cwd = process.cwd();
  console.log(`cwd=${cwd}`);
  if (cwd !== EXPECTED_REPO) {
    fail(`Expected cwd ${EXPECTED_REPO}.`);
  }

  const origin = runGit(["remote", "get-url", "origin"]);
  console.log(`origin=${origin}`);
  if (origin !== EXPECTED_ORIGIN) {
    fail(`Expected origin ${EXPECTED_ORIGIN}.`);
  }

  const branch = runGit(["branch", "--show-current"]);
  console.log(`branch=${branch}`);
  if (branch !== EXPECTED_BRANCH) {
    fail(`Expected branch ${EXPECTED_BRANCH}.`);
  }

  const headShort = runGit(["rev-parse", "--short", "HEAD"]);
  const headFull = runGit(["rev-parse", "HEAD"]);
  const headSubject = runGit(["log", "-1", "--pretty=%s"]);

  console.log(`expected_head=${expectedHead ?? ""}`);
  console.log(`expected_head_subject=${expectedSubject ?? ""}`);
  console.log(`actual_head_short=${headShort}`);
  console.log(`actual_head_full=${headFull}`);
  console.log(`actual_head_subject=${headSubject}`);

  if (expectedHead && (expectedHead === headShort || expectedHead === headFull)) {
    console.log("expected_head_check=passed");
  } else if (expectedHead) {
    fail("Expected HEAD did not match current HEAD.");
  }

  if (expectedSubject && expectedSubject === headSubject) {
    console.log("expected_head_subject_check=passed");
  } else if (expectedSubject) {
    fail("Expected HEAD subject did not match current HEAD subject.");
  }

  printSection("Branch sync");
  const ahead = runGit(["rev-list", "--count", "origin/main..HEAD"]);
  const behind = runGit(["rev-list", "--count", "HEAD..origin/main"]);
  console.log(`ahead_count=${ahead}`);
  console.log(`behind_count=${behind}`);

  if (ahead !== "0" || behind !== "0") {
    fail("Expected branch to be synced with origin/main.");
  }

  printSection("Working tree scope");
  const statusLines = runGit(["status", "--short"])
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean);
  assertWorkingTreeScope(statusLines);

  printSection("Required documentation files");
  const requiredDocs = [
    "docs/phase-25a-discovery-engine-reentry-readiness-gate.md",
    "docs/phase-25b-discovery-engine-current-state-inventory-next-safe-scope-plan.md",
    "docs/discovery-phase-25c-discovery-engine-current-state-map-risk-register.md",
    "docs/discovery-phase-25d-next-safe-documentation-planning-gate.md",
    "docs/discovery-phase-25e-read-only-runtime-verification-script-planning.md",
  ];

  for (const doc of requiredDocs) {
    if (!exists(doc)) {
      fail(`Missing required doc: ${doc}`);
    } else {
      console.log(`doc_present=true :: ${doc}`);
    }
  }

  printSection("Boundary marker checks");
  const markerChecks = [
    {
      file: "docs/discovery-phase-25c-discovery-engine-current-state-map-risk-register.md",
      markers: ["Phase 25C", "Risk Register", "No DB mutation", "No approve_for_draft", "No public"],
    },
    {
      file: "docs/discovery-phase-25d-next-safe-documentation-planning-gate.md",
      markers: ["Phase 25D", "Read-Only Runtime Verification Gate Planning", "No DB mutation", "No approve_for_draft"],
    },
    {
      file: "docs/discovery-phase-25e-read-only-runtime-verification-script-planning.md",
      markers: ["Phase 25E", "Future Phase 25F", "No runtime verifier implementation", "AIFINDER_RUN_DISCOVERY_*"],
    },
  ];

  for (const check of markerChecks) {
    if (exists(check.file)) {
      assertContains(check.file, check.markers);
    }
  }

  printSection("Discovery documentation inventory");
  const discoveryDocs = walkFiles("docs", (relative) =>
    relative.includes("discovery") || /(^|\/)phase-25[a-z]-/i.test(relative)
  );
  console.log(`discovery_doc_count=${discoveryDocs.length}`);
  for (const doc of discoveryDocs.slice(-25)) {
    console.log(doc);
  }

  printSection("Discovery testing script inventory");
  const discoveryTests = walkFiles("testing", (relative) =>
    relative.startsWith("testing/discovery-") && relative.endsWith(".mjs")
  );
  console.log(`discovery_test_count=${discoveryTests.length}`);
  for (const test of discoveryTests) {
    console.log(test);
  }

  printSection("lib/discovery inventory");
  const discoveryHelpers = walkFiles("lib/discovery", (relative) => relative.endsWith(".ts"));
  console.log(`lib_discovery_count=${discoveryHelpers.length}`);
  for (const helper of discoveryHelpers) {
    console.log(helper);
  }

  printSection("Admin discovery API route inventory");
  const discoveryRoutes = walkFiles("app/api/admin/discovery", (relative) => relative.endsWith("/route.ts"));
  console.log(`admin_discovery_api_route_count=${discoveryRoutes.length}`);
  for (const route of discoveryRoutes) {
    console.log(route);
  }

  printSection("Opt-in marker inventory");
  const markerPattern = /AIFINDER_RUN_DISCOVERY_[A-Z0-9_]+/g;
  const markerFiles = [
    ...walkFiles("docs", (relative) => relative.endsWith(".md")),
    ...walkFiles("testing", (relative) => relative.endsWith(".mjs")),
  ];
  const markers = new Set();

  for (const file of markerFiles) {
    const text = readText(file);
    for (const match of text.matchAll(markerPattern)) {
      markers.add(match[0]);
    }
  }

  const sortedMarkers = [...markers].sort();
  console.log(`unique_opt_in_marker_count=${sortedMarkers.length}`);
  for (const marker of sortedMarkers) {
    console.log(marker);
  }

  printSection("Package script static inventory");
  const discoveryScripts = listPackageDiscoveryScripts();
  console.log(`package_discovery_script_count=${discoveryScripts.length}`);
  for (const script of discoveryScripts) {
    console.log(script);
  }

  printSection("Static risk warnings");
  console.log("risk_warning=This verifier does not prove live DB state.");
  console.log("risk_warning=This verifier does not prove live Supabase permissions.");
  console.log("risk_warning=This verifier does not execute crawler, extraction, candidate decision, or publishing flows.");
  console.log("risk_warning=Operational reactivation still requires a separate approved phase.");

  printSection("Overall Discovery Engine progress report");
  console.log("controlled_build_sequence_status=stable; repository-local verifier executed with explicit expected HEAD/subject CLI inputs");
  console.log("current_phase_reentry_progress=Phase 25M verifier implementation can statically inspect local Discovery Engine structure with configurable expected git metadata");
  console.log("operational_reactivation_progress=not reactivated; no DB/API/crawler/extraction/candidate/public-tools operations executed");
  console.log("next_recommended_phase=Gemini review of Phase 25M implementation, then local commit gate only after approval");

  if (process.exitCode && process.exitCode !== 0) {
    printSection("Script result");
    console.log("FAILED: Discovery read-only runtime verification stopped safely.");
    process.exit(process.exitCode);
  }

  printSection("Script result");
  console.log("PASSED: Discovery read-only runtime verification completed safely.");
}

main();
