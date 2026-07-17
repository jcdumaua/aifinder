import "server-only";

import type { Database } from "../supabase/database.types";
import type {
  DiscoveryCandidateDecisionAction,
  ValidatedDiscoveryCandidateDecisionInput,
} from "./discovery-candidate-decision-validation";

const CANDIDATE_DECISION_RPC = "admin_apply_discovery_candidate_decision";

type CandidateDecisionRpcArgs =
  Database["public"]["Functions"][typeof CANDIDATE_DECISION_RPC]["Args"];

type CandidateDecisionRpcGeneratedRow =
  Database["public"]["Functions"][typeof CANDIDATE_DECISION_RPC]["Returns"][number];

type CandidateDecisionRpcRuntimeRow = Omit<
  CandidateDecisionRpcGeneratedRow,
  "decision_notes" | "duplicate_of_candidate_id" | "duplicate_of_tool_id"
> & {
  decision_notes: string | null;
  duplicate_of_candidate_id: string | null;
  duplicate_of_tool_id: number | null;
};

type CandidateDecisionRpcError = {
  code?: string;
  message?: string;
};

type CandidateDecisionRpcResult = {
  data: CandidateDecisionRpcGeneratedRow[] | null;
  error: CandidateDecisionRpcError | null;
};

export type DiscoveryCandidateDecisionMutationClient = {
  rpc(
    functionName: typeof CANDIDATE_DECISION_RPC,
    args: CandidateDecisionRpcArgs,
  ): PromiseLike<CandidateDecisionRpcResult>;
};

export type ApplyDiscoveryCandidateDecisionInput =
  ValidatedDiscoveryCandidateDecisionInput & {
    actorLabel: string;
  };

export type AppliedDiscoveryCandidateDecision = {
  candidateId: string;
  candidateStatus: string;
  decisionAction: DiscoveryCandidateDecisionAction;
  decisionReason: string;
  decisionNotes: string | null;
  decidedAt: string;
  decidedBy: string;
  duplicateOfCandidateId: string | null;
  duplicateOfToolId: number | null;
};

export type ApplyDiscoveryCandidateDecisionResult = {
  ok: true;
  candidate: AppliedDiscoveryCandidateDecision;
};

export type DiscoveryCandidateDecisionMutationErrorCode =
  | "candidate_not_found"
  | "decision_conflict"
  | "invalid_action"
  | "invalid_reason"
  | "invalid_notes"
  | "invalid_duplicate_target"
  | "candidate_decision_rpc_failed";

export class DiscoveryCandidateDecisionMutationError extends Error {
  readonly code: DiscoveryCandidateDecisionMutationErrorCode;

  constructor(code: DiscoveryCandidateDecisionMutationErrorCode, message: string) {
    super(message);
    this.name = "DiscoveryCandidateDecisionMutationError";
    this.code = code;
  }
}

function fail(
  code: DiscoveryCandidateDecisionMutationErrorCode,
  message: string,
): never {
  throw new DiscoveryCandidateDecisionMutationError(code, message);
}

function getSafeActorLabel(actorLabel: string) {
  const cleaned = actorLabel
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, 160);

  return cleaned || "admin";
}

function getRpcErrorCode(
  error: CandidateDecisionRpcError,
): DiscoveryCandidateDecisionMutationErrorCode {
  const message = (error.message || "").toLowerCase();

  if (message.includes("candidate_not_found")) return "candidate_not_found";
  if (message.includes("decision_conflict")) return "decision_conflict";
  if (message.includes("invalid_action")) return "invalid_action";
  if (message.includes("invalid_reason")) return "invalid_reason";
  if (message.includes("invalid_notes")) return "invalid_notes";
  if (message.includes("invalid_duplicate_target")) {
    return "invalid_duplicate_target";
  }

  return "candidate_decision_rpc_failed";
}

function getRpcErrorMessage(code: DiscoveryCandidateDecisionMutationErrorCode) {
  switch (code) {
    case "candidate_not_found":
      return "Candidate not found.";
    case "decision_conflict":
      return "Candidate is no longer reviewable.";
    case "invalid_action":
      return "Invalid candidate decision action.";
    case "invalid_reason":
      return "Decision reason is invalid.";
    case "invalid_notes":
      return "Decision notes are invalid.";
    case "invalid_duplicate_target":
      return "Duplicate candidate target is invalid.";
    case "candidate_decision_rpc_failed":
      return "Candidate decision could not be applied.";
  }
}

async function getDefaultCandidateDecisionMutationClient() {
  const { supabaseAdmin } = await import("../supabase-admin");

  return supabaseAdmin as unknown as DiscoveryCandidateDecisionMutationClient;
}

function buildCandidateDecisionRpcArgs(
  input: ApplyDiscoveryCandidateDecisionInput,
): CandidateDecisionRpcArgs {
  const args: CandidateDecisionRpcArgs = {
    p_action: input.action,
    p_actor_label: getSafeActorLabel(input.actorLabel),
    p_candidate_id: input.candidateId,
    p_reason: input.decisionReason,
  };

  if (input.decisionNotes !== undefined) {
    args.p_notes = input.decisionNotes;
  }

  if (input.duplicateOfCandidateId !== undefined) {
    args.p_duplicate_of_candidate_id = input.duplicateOfCandidateId;
  }

  if (input.requestCorrelationId !== undefined) {
    args.p_request_correlation_id = input.requestCorrelationId;
  }

  return args;
}

function mapCandidateDecisionRpcRow(
  row: CandidateDecisionRpcRuntimeRow,
): AppliedDiscoveryCandidateDecision {
  return {
    candidateId: row.id,
    candidateStatus: row.candidate_status,
    decisionAction: row.decision_action as DiscoveryCandidateDecisionAction,
    decisionReason: row.decision_reason,
    decisionNotes: row.decision_notes,
    decidedAt: row.decided_at,
    decidedBy: row.decided_by,
    duplicateOfCandidateId: row.duplicate_of_candidate_id,
    duplicateOfToolId: row.duplicate_of_tool_id,
  };
}

export async function applyDiscoveryCandidateDecision(
  input: ApplyDiscoveryCandidateDecisionInput,
  options: { client?: DiscoveryCandidateDecisionMutationClient } = {},
): Promise<ApplyDiscoveryCandidateDecisionResult> {
  const client =
    options.client || (await getDefaultCandidateDecisionMutationClient());

  const { data, error } = await client.rpc(
    CANDIDATE_DECISION_RPC,
    buildCandidateDecisionRpcArgs(input),
  );

  if (error) {
    const code = getRpcErrorCode(error);

    fail(code, getRpcErrorMessage(code));
  }

  const row = data?.[0] as CandidateDecisionRpcRuntimeRow | undefined;

  if (!row?.id) {
    fail(
      "candidate_decision_rpc_failed",
      "Candidate decision RPC returned no candidate row.",
    );
  }

  return {
    ok: true,
    candidate: mapCandidateDecisionRpcRow(row),
  };
}
