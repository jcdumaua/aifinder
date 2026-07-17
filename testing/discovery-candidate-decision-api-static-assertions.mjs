#!/usr/bin/env node

import { readFileSync } from "node:fs";

const FILES = {
  rateLimit: "lib/admin-rate-limit.ts",
  validation: "lib/discovery/discovery-candidate-decision-validation.ts",
  helper: "lib/discovery/discovery-candidate-decision-admin.ts",
  staging: "lib/discovery/discovery-candidate-staging-admin.ts",
  route:
    "app/api/admin/discovery/candidate-staging-queue/[id]/decision/route.ts",
  types: "lib/supabase/database.types.ts",
};

function read(path) {
  return readFileSync(path, "utf8");
}

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function assertIncludes(text, marker, label) {
  assert(text.includes(marker), `${label} missing marker: ${marker}`);
  console.log(`ok - ${label} marker present: ${marker}`);
}

function assertNotIncludes(text, marker, label) {
  assert(!text.includes(marker), `${label} forbidden marker present: ${marker}`);
  console.log(`ok - ${label} forbidden marker absent: ${marker}`);
}

const rateLimit = read(FILES.rateLimit);
const validation = read(FILES.validation);
const helper = read(FILES.helper);
const staging = read(FILES.staging);
const route = read(FILES.route);
const types = read(FILES.types);

assertIncludes(
  rateLimit,
  "discoveryCandidateDecisionMutation",
  "rate limit",
);
assertIncludes(
  rateLimit,
  "discovery-candidate-decision-mutation",
  "rate limit",
);
assertIncludes(
  route,
  "ADMIN_RATE_LIMIT_ACTIONS.discoveryCandidateDecisionMutation",
  "route",
);

for (const action of [
  "approve_for_draft",
  "reject",
  "duplicate",
  "needs_more_evidence",
  "archive",
]) {
  assertIncludes(validation, action, "validation");
}

for (const marker of [
  "parseDiscoveryCandidateDecisionRequest",
  "client_admin_identity_not_allowed",
  "duplicate_tool_target_not_supported",
  "Decision reason",
  "Decision notes",
  "Duplicate decisions require a duplicate candidate target.",
]) {
  assertIncludes(validation, marker, "validation");
}

for (const marker of [
  "admin_apply_discovery_candidate_decision",
  "applyDiscoveryCandidateDecision",
  "candidate_not_found",
  "decision_conflict",
  "candidate_decision_rpc_failed",
]) {
  assertIncludes(helper, marker, "helper");
}

for (const marker of [
  "verifyAdminSession",
  "verifyAdminCsrfRequest",
  "checkAdminRateLimit",
  "parseDiscoveryCandidateDecisionRequest",
  "applyDiscoveryCandidateDecision",
  "POST /api/admin/discovery/candidate-staging-queue/[id]/decision",
]) {
  assertIncludes(route, marker, "route");
}

for (const marker of [
  "admin_apply_discovery_candidate_decision",
  "p_candidate_id",
  "p_action",
  "p_reason",
  "duplicate_of_tool_id",
]) {
  assertIncludes(types, marker, "generated types");
}

for (const marker of [
  "promoted_to_publish_draft",
  "candidate_status = 'published'",
  "insert into public.tools",
  "insert into public.discovered_tools",
]) {
  assertNotIncludes(helper, marker, "helper");
  assertNotIncludes(route, marker, "route");
}


assertIncludes(
  helper,
  'import "server-only";',
  "decision helper",
);

assertIncludes(
  helper,
  'const CANDIDATE_DECISION_RPC = "admin_apply_discovery_candidate_decision";',
  "decision helper",
);

assertIncludes(
  helper,
  "buildCandidateDecisionRpcArgs",
  "decision helper",
);

assertIncludes(
  helper,
  "getSafeActorLabel",
  "decision helper",
);

assertIncludes(
  helper,
  "p_request_correlation_id",
  "decision helper",
);

assertIncludes(
  helper,
  "Candidate decision could not be applied.",
  "decision helper",
);

assertNotIncludes(
  helper,
  "details: error",
  "decision helper",
);

assertNotIncludes(
  helper,
  '.select("*")',
  "decision helper",
);

assertIncludes(
  staging,
  'import "server-only";',
  "staging helper",
);

assertIncludes(
  staging,
  '.from("discovery_candidate_tools")',
  "staging helper",
);

assertIncludes(
  staging,
  ".insert(insertPayload)",
  "staging helper",
);

assertIncludes(
  staging,
  ".select(INSERT_SELECT_COLUMNS)",
  "staging helper",
);

assertIncludes(
  staging,
  "isValidNormalizedCandidate",
  "staging helper",
);

assertIncludes(
  staging,
  "audit_correlation_id",
  "staging helper",
);

assertIncludes(
  staging,
  "Candidate staging insert failed.",
  "staging helper",
);

assertNotIncludes(
  staging,
  '.select("*")',
  "staging helper",
);

assertNotIncludes(
  staging,
  "details: error",
  "staging helper",
);

for (const source of [helper, staging]) {
  assertNotIncludes(source, '"use client"', "A3 mutation helper");
  assertNotIncludes(source, "'use client'", "A3 mutation helper");
}


assertIncludes(
  route,
  'import "server-only";',
  "A4 decision route",
);

assertIncludes(route, "export async function POST", "A4 decision route");
assertIncludes(route, "verifyAdminSession", "A4 decision route");
assertIncludes(route, "verifyAdminCsrfRequest", "A4 decision route");
assertIncludes(route, "checkAdminRateLimit", "A4 decision route");
assertIncludes(route, "parseDiscoveryCandidateDecisionRequest", "A4 decision route");
assertIncludes(route, "applyDiscoveryCandidateDecision", "A4 decision route");
assertIncludes(route, "requestCorrelationId", "A4 decision route");
assertIncludes(route, 'cache: "no-store"', "A4 decision route");
assertNotIncludes(route, '"use client"', "A4 decision route");
assertNotIncludes(route, "'use client'", "A4 decision route");
assertNotIncludes(route, "details: error", "A4 decision route");
assertNotIncludes(route, "error.message", "A4 decision route");

console.log("A4 admin mutation route boundary static assertions passed.");

console.log("A3 discovery mutation boundary static assertions passed.");

console.log("Phase 19S candidate decision API static assertions passed.");
