#!/usr/bin/env node

import { execFileSync } from "node:child_process";

const PASS_MARKER = "PREFLIGHT_PASS_NON_MUTATING";
const FAIL_MARKER = "PREFLIGHT_FAIL_LOCKED";

const REQUIRED_ENV_KEYS = [
  "AIFINDER_RUN_CANDIDATE_DECISION_EXECUTION_PREFLIGHT",
  "AIFINDER_CANDIDATE_DECISION_PREFLIGHT_PHASE",
  "AIFINDER_CANDIDATE_DECISION_EXPECTED_COMMIT",
  "AIFINDER_CANDIDATE_DECISION_ID",
  "AIFINDER_CANDIDATE_DECISION_ACTION",
  "AIFINDER_CANDIDATE_DECISION_EXPECTED_CURRENT_STATUS",
  "AIFINDER_CANDIDATE_DECISION_EXPECTED_NEXT_STATUS",
  "AIFINDER_CANDIDATE_DECISION_PUBLIC_PUBLISHING_ALLOWED",
  "AIFINDER_CANDIDATE_DECISION_APPROVE_FOR_DRAFT_ALLOWED",
  "AIFINDER_CANDIDATE_DECISION_CLEANUP_ALLOWED",
  "AIFINDER_CANDIDATE_DECISION_EXPECTED_AUDIT_EVENT",
  "AIFINDER_CANDIDATE_DECISION_APPROVAL_PHRASE",
];

const GENERIC_APPROVAL_PHRASES = new Set([
  "proceed",
  "approved",
  "continue",
  "run it",
  "do the decision",
  "gemini approved",
  "commit it",
  "push it",
  "looks good",
]);

function section(title) {
  console.log();
  console.log(`=== ${title} ===`);
}

function lock(message) {
  console.log(`LOCKED: ${message}`);
  section("Final Preflight Decision");
  console.log(FAIL_MARKER);
  process.exit(1);
}

function git(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function requireEnv(key) {
  const value = process.env[key];
  if (typeof value !== "string" || value.trim() === "") {
    lock(`Missing required environment variable: ${key}`);
  }
  return value.trim();
}

function validateIdentifier(label, value) {
  if (!/^[a-zA-Z][a-zA-Z0-9_:-]{0,79}$/.test(value)) {
    lock(`${label} must be a safe identifier using letters, numbers, underscore, colon, or dash, starting with a letter.`);
  }
}

function validatePhaseToken(value) {
  if (!/^(?:Phase)?[0-9]{1,3}[A-Z]{1,3}$/.test(value)) {
    lock("Phase must be a canonical AiFinder phase token such as 22N or Phase22N.");
  }
}


function validateStatus(label, value) {
  if (!/^[a-zA-Z][a-zA-Z0-9_:-]{0,79}$/.test(value)) {
    lock(`${label} must be a safe status identifier using letters, numbers, underscore, colon, or dash, starting with a letter.`);
  }
}

function validateUuid(candidateId) {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidPattern.test(candidateId)) {
    lock("Candidate id must be an explicit UUID. Fuzzy targeting is not allowed.");
  }
}

function requireFalseLock(key, label) {
  const value = requireEnv(key);
  if (value !== "false") {
    lock(`${label} must be explicitly set to false for this non-mutating preflight.`);
  }
}

function main() {
  section("Boundary");
  console.log("Candidate decision execution preflight.");
  console.log("Non-mutating.");
  console.log("No live database reads.");
  console.log("No database writes.");
  console.log("No candidate decision execution.");
  console.log("No approve_for_draft.");
  console.log("No public publishing.");
  console.log("No cleanup mutation.");

  section("Opt-In Guard");
  const optIn = process.env.AIFINDER_RUN_CANDIDATE_DECISION_EXECUTION_PREFLIGHT;
  if (optIn !== "1") {
    lock("AIFINDER_RUN_CANDIDATE_DECISION_EXECUTION_PREFLIGHT must be exactly 1.");
  }
  console.log("Opt-in guard passed.");

  section("Repo State");
  const branchStatus = git(["status", "--short", "--branch"]);
  console.log(branchStatus);
  if (branchStatus !== "## main...origin/main") {
    lock("Repository must be clean and aligned with origin/main.");
  }

  section("Expected Commit Check");
  const expectedCommit = requireEnv("AIFINDER_CANDIDATE_DECISION_EXPECTED_COMMIT");
  const actualCommit = git(["rev-parse", "--short", "HEAD"]);
  console.log(`Expected commit: ${expectedCommit}`);
  console.log(`Actual commit:   ${actualCommit}`);
  if (actualCommit !== expectedCommit) {
    lock("Latest commit does not match expected completed gate.");
  }

  section("Input Contract");
  for (const key of REQUIRED_ENV_KEYS) {
    requireEnv(key);
    console.log(`${key}=present`);
  }

  section("Candidate Target");
  const phase = requireEnv("AIFINDER_CANDIDATE_DECISION_PREFLIGHT_PHASE");
  const candidateId = requireEnv("AIFINDER_CANDIDATE_DECISION_ID");
  validatePhaseToken(phase);
  validateUuid(candidateId);
  console.log(`Phase: ${phase}`);
  console.log(`Candidate id: ${candidateId}`);

  section("Intended Action");
  const action = requireEnv("AIFINDER_CANDIDATE_DECISION_ACTION");
  validateIdentifier("Action", action);
  if (action.toLowerCase() === "approve_for_draft") {
    lock("approve_for_draft is locked and cannot be the intended action in this preflight.");
  }
  console.log(`Action: ${action}`);

  section("Status Transition Expectation");
  const expectedCurrentStatus = requireEnv("AIFINDER_CANDIDATE_DECISION_EXPECTED_CURRENT_STATUS");
  const expectedNextStatus = requireEnv("AIFINDER_CANDIDATE_DECISION_EXPECTED_NEXT_STATUS");
  validateStatus("Expected current status", expectedCurrentStatus);
  validateStatus("Expected next status", expectedNextStatus);
  if (expectedCurrentStatus === expectedNextStatus) {
    lock("Expected current status and expected next status must be different.");
  }
  console.log(`Expected current status: ${expectedCurrentStatus}`);
  console.log(`Expected next status: ${expectedNextStatus}`);

  section("Public Publishing Lock");
  requireFalseLock("AIFINDER_CANDIDATE_DECISION_PUBLIC_PUBLISHING_ALLOWED", "Public publishing");
  console.log("Public publishing: locked");

  section("approve_for_draft Lock");
  requireFalseLock("AIFINDER_CANDIDATE_DECISION_APPROVE_FOR_DRAFT_ALLOWED", "approve_for_draft");
  console.log("approve_for_draft: locked");

  section("Cleanup Lock");
  requireFalseLock("AIFINDER_CANDIDATE_DECISION_CLEANUP_ALLOWED", "Cleanup mutation");
  console.log("Cleanup mutation: locked");

  section("Audit Expectation");
  const auditEvent = requireEnv("AIFINDER_CANDIDATE_DECISION_EXPECTED_AUDIT_EVENT");
  validateIdentifier("Expected audit event", auditEvent);
  console.log(`Expected audit event: ${auditEvent}`);

  section("Approval Phrase Verification");
  const approvalPhrase = requireEnv("AIFINDER_CANDIDATE_DECISION_APPROVAL_PHRASE");
  const normalizedApproval = approvalPhrase.trim().toLowerCase();
  if (GENERIC_APPROVAL_PHRASES.has(normalizedApproval)) {
    lock("Generic approval phrase rejected.");
  }

  const expectedApprovalPhrase = `Approve Phase ${phase} live candidate decision execution for candidate ${candidateId} with action ${action}`;
  console.log(`Expected approval phrase: ${expectedApprovalPhrase}`);
  if (approvalPhrase !== expectedApprovalPhrase) {
    lock("Approval phrase does not exactly match the required phrase.");
  }
  console.log("Approval phrase exact match verified.");

  section("Final Preflight Decision");
  console.log(PASS_MARKER);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  lock(`Unexpected preflight error: ${message}`);
}
