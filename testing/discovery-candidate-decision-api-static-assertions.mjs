#!/usr/bin/env node

import { readFileSync } from "node:fs";

const FILES = {
  rateLimit: "lib/admin-rate-limit.ts",
  validation: "lib/discovery/discovery-candidate-decision-validation.ts",
  helper: "lib/discovery/discovery-candidate-decision-admin.ts",
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

console.log("Phase 19S candidate decision API static assertions passed.");
