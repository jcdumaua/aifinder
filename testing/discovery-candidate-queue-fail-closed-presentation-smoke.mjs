import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const helperPath = "lib/discovery/discovery-candidate-queue-fail-closed-presentation.ts";
const emitted = ts.transpileModule(
  await (await import("node:fs/promises")).readFile(helperPath, "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      strict: true,
    },
  },
);

const tempPath = "/tmp/aifinder-phase-22ao-c-fail-closed-helper.mjs";
await (await import("node:fs/promises")).writeFile(tempPath, emitted.outputText);

const { getCandidateQueueFailClosedPresentation } = await import(pathToFileURL(tempPath));

const cases = [
  {
    name: "needs_more_evidence status is blocked",
    input: { candidate_status: "needs_more_evidence" },
    expectedLabel: "Needs more evidence",
    expectedReason: "evidence_insufficient",
  },
  {
    name: "needs_more_evidence decision action is blocked",
    input: { decision_action: "needs_more_evidence" },
    expectedLabel: "Needs more evidence",
    expectedReason: "evidence_insufficient",
  },
  {
    name: "other status is unclassified",
    input: { candidate_status: "other" },
    expectedLabel: "Unclassified",
    expectedReason: "unclassified_not_actionable",
  },
  {
    name: "cleanup status is diagnostic only",
    input: { cleanup_status: "cleanup" },
    expectedLabel: "Cleanup flagged",
    expectedReason: "cleanup_not_authorized",
  },
  {
    name: "missing decision action is unavailable",
    input: { decision_action: "missing" },
    expectedLabel: "Action unavailable",
    expectedReason: "no_safe_action",
  },
  {
    name: "unknown state fails closed",
    input: { candidate_status: "unexpected" },
    expectedLabel: "Review blocked",
    expectedReason: "fail_closed_parse_or_unknown_state",
  },
  {
    name: "malformed state fails closed",
    input: { candidate_status: 42, decision_action: null, cleanup_status: undefined },
    expectedLabel: "Review blocked",
    expectedReason: "fail_closed_parse_or_unknown_state",
  },
];

for (const testCase of cases) {
  const result = getCandidateQueueFailClosedPresentation(testCase.input);
  assert.equal(result.statusPresentationLabel, testCase.expectedLabel, testCase.name);
  assert.equal(result.disabledReason, testCase.expectedReason, testCase.name);
  assert.equal(result.allActionsDisabled, true, testCase.name);
  assert.equal(typeof result.operatorWarningText, "string", testCase.name);
  assert.ok(result.operatorWarningText.length > 0, testCase.name);
}

console.log("ADMIN_QUEUE_UX_FAIL_CLOSED_PRESENTATION_SMOKE_PASSED");
console.log("all_actions_disabled_verified=true");
console.log("unknown_state_fail_closed_verified=true");
console.log("malformed_state_fail_closed_verified=true");
console.log("mutation_executed=false");
console.log("identifier_printing_executed=false");
