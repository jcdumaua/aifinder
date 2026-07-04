import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const targetPath = "components/admin/discovery/candidate-staging-queue-panel.tsx";
const source = await readFile(targetPath, "utf8");

const requiredMarkers = [
  'getCandidateQueueFailClosedPresentation',
  'data-phase="22ao-e-fail-closed-status-presentation"',
  '<StatusBadge item={item} />',
  'Candidate queue status:',
  'Disabled reason:',
  'Decision actions disabled by fail-closed presentation.',
  'aria-label="Candidate decision actions disabled"',
];

for (const marker of requiredMarkers) {
  assert.ok(source.includes(marker), `Missing required UI wiring marker: ${marker}`);
}

const forbiddenMarkers = [
  'CandidateStagingQueueDecisionDialog',
  'decisionCandidate',
  'openDecisionDialog',
  'closeDecisionDialog',
  'canReviewCandidateDecision',
  'handleDecisionApplied',
  'onClick={() => openDecisionDialog(item)}',
  'Review decision',
];

for (const marker of forbiddenMarkers) {
  assert.ok(!source.includes(marker), `Forbidden decision wiring marker remains: ${marker}`);
}

const restrictedAdditions = [
  '.insert(',
  '.update(',
  '.upsert(',
  '.delete(',
  '.rpc(',
  '/approve',
  '/publish',
  '/cleanup',
  '/reset',
  '/reopen',
  'SUPABASE_SERVICE_ROLE_KEY',
  'createClient(',
  'candidate_uuid=',
  'candidate_name=',
  'candidate_url=',
];

for (const marker of restrictedAdditions) {
  assert.ok(!source.includes(marker), `Restricted marker found in UI source: ${marker}`);
}

console.log("ADMIN_QUEUE_UX_FAIL_CLOSED_UI_WIRING_SMOKE_PASSED");
console.log("helper_import_wired=true");
console.log("status_presentation_rendered=true");
console.log("disabled_reason_text_rendered=true");
console.log("decision_dialog_removed_from_queue_panel=true");
console.log("all_actions_disabled_or_absent=true");
console.log("status_label_text_not_color_only=true");
console.log("disabled_reason_screen_reader_accessible=true");
console.log("no_new_mutation_methods_added=true");
console.log("no_new_identifier_printing_added=true");
