import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const dialogPath = path.resolve(
  "components/admin/discovery/candidate-staging-queue-decision-dialog.tsx",
);
const panelPath = path.resolve(
  "components/admin/discovery/candidate-staging-queue-panel.tsx",
);

assert.equal(existsSync(dialogPath), true, "decision dialog component must exist");
assert.equal(existsSync(panelPath), true, "candidate staging queue panel must exist");

const dialogSource = readFileSync(dialogPath, "utf8");
const panelSource = readFileSync(panelPath, "utf8");

assert.equal(
  dialogSource.trimStart().startsWith('"use client";'),
  true,
  "decision dialog must be a client component",
);

for (const marker of [
  "Dialog",
  "DialogContent",
  "DialogDescription",
  "DialogFooter",
  "DialogHeader",
  "DialogTitle",
  "Review candidate decision",
  "Apply a staging decision",
  "/api/admin/csrf",
  "/api/admin/discovery/candidate-staging-queue/",
  "x-csrf-token",
  'method: "POST"',
  'credentials: "same-origin"',
  'cache: "no-store"',
  "approve_for_draft",
  "reject",
  "duplicate",
  "needs_more_evidence",
  "archive",
  "Approve for draft",
  "Reject candidate",
  "Mark duplicate",
  "Request more evidence",
  "Archive candidate",
  "Reason must be 3-200 characters.",
  "Notes must be 1000 characters or fewer.",
  "duplicate_of_candidate_id",
  "action === \"duplicate\"",
  "decision_conflict",
  "candidate_decision_rpc_failed",
  "Initializing decision...",
  "Applying decision...",
  "Candidate decision applied.",
]) {
  assert.equal(
    dialogSource.includes(marker),
    true,
    `decision dialog missing required marker: ${marker}`,
  );
}

for (const forbidden of [
  "duplicate_of_tool_id",
  "duplicateOfToolId",
  "admin_user_id",
  "adminUserId",
  "decided_by",
  "decidedBy",
  "actor_label",
  "actorLabel",
]) {
  assert.equal(
    dialogSource.includes(forbidden),
    false,
    `decision dialog must not render or send forbidden field: ${forbidden}`,
  );
}

for (const forbidden of ["Publish", "Promote", "Delete"]) {
  assert.equal(
    dialogSource.includes(forbidden),
    false,
    `decision dialog must not include unsafe workflow label: ${forbidden}`,
  );
  assert.equal(
    panelSource.includes(forbidden),
    false,
    `queue panel must not include unsafe workflow label: ${forbidden}`,
  );
}

assert.equal(
  /supabase|supabaseAdmin|service-role|SERVICE_ROLE|createClient\(/i.test(
    dialogSource,
  ),
  false,
  "decision dialog must not import or reference Supabase/service-role code",
);

assert.equal(
  /\.insert\(|\.update\(|\.upsert\(|\.delete\(|\.rpc\(/.test(
    dialogSource,
  ),
  false,
  "decision dialog must not include direct table mutation or RPC calls",
);

assert.equal(
  panelSource.includes("CandidateStagingQueueDecisionDialog"),
  true,
  "queue panel must import/render CandidateStagingQueueDecisionDialog",
);
assert.equal(
  panelSource.includes("Review decision"),
  true,
  "queue panel must render the guarded Review decision action",
);
assert.equal(
  panelSource.includes("Decision unavailable for this status."),
  true,
  "queue panel must explain non-decisionable statuses",
);
assert.equal(
  panelSource.includes('candidate.candidateStatus === "staged"'),
  true,
  "queue panel must gate active decision controls to staged candidates",
);

assert.equal(
  /method:\s*["'](?:POST|PUT|PATCH|DELETE)["']|\.insert\(|\.update\(|\.upsert\(|\.delete\(|\.rpc\(/.test(
    panelSource,
  ),
  false,
  "queue panel must not include direct mutation methods",
);

console.log("Phase 19Y candidate decision admin UI static tests passed.");
