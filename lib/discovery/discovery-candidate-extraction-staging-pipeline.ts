import {
  mapExtractionToStagingCandidate,
  type CandidateExtractionMapperFailure,
  type CandidateExtractionMapperInput,
  type CandidateExtractionMapperWarning,
} from "./discovery-candidate-extraction-mapper";
import {
  stageNormalizedDiscoveryCandidate,
  type StageNormalizedDiscoveryCandidateInput,
  type StageNormalizedDiscoveryCandidateResult,
} from "./discovery-candidate-staging-admin";

export type CandidateExtractionStageCandidate = (
  input: StageNormalizedDiscoveryCandidateInput,
) =>
  | StageNormalizedDiscoveryCandidateResult
  | Promise<StageNormalizedDiscoveryCandidateResult>;

export type CandidateExtractionStagingPipelineDependencies = {
  stageCandidate?: CandidateExtractionStageCandidate;
};

export type CandidateExtractionStagingPipelineInput = {
  item: CandidateExtractionMapperInput;
  actorId?: string | null;
};

export type CandidateExtractionStagingPipelineBatchInput = {
  items: CandidateExtractionMapperInput[];
  actorId?: string | null;
  maxItems?: number | null;
};

type StagingFailure = Extract<
  StageNormalizedDiscoveryCandidateResult,
  { ok: false }
>;

type StagingFailureCode = StagingFailure["error"]["code"];

export type CandidateExtractionStagingPipelineSuccess = {
  ok: true;
  stage: "staging";
  status: "staged";
  candidateId: string;
  candidateStatus: "staged";
  discoveryRunId: string;
  discoverySourceId: string;
  auditCorrelationId: string | null;
  mapperWarnings: CandidateExtractionMapperWarning[];
};

export type CandidateExtractionStagingPipelineMapperFailure = {
  ok: false;
  stage: "mapper";
  error: CandidateExtractionMapperFailure["error"];
  discoveryRunId?: string;
  discoverySourceId?: string;
  auditCorrelationId?: string | null;
  mapperWarnings: CandidateExtractionMapperWarning[];
};

export type CandidateExtractionStagingPipelineStagingFailure = {
  ok: false;
  stage: "staging";
  error: {
    code: StagingFailureCode;
    message: string;
  };
  discoveryRunId?: string;
  discoverySourceId?: string;
  auditCorrelationId?: string | null;
  mapperWarnings: CandidateExtractionMapperWarning[];
};

export type CandidateExtractionStagingPipelineItemResult =
  | CandidateExtractionStagingPipelineSuccess
  | CandidateExtractionStagingPipelineMapperFailure
  | CandidateExtractionStagingPipelineStagingFailure;

export type CandidateExtractionStagingPipelineBatchResult = {
  ok: boolean;
  totalItems: number;
  processedCount: number;
  skippedCount: number;
  stagedCount: number;
  mapperFailureCount: number;
  stagingFailureCount: number;
  results: CandidateExtractionStagingPipelineItemResult[];
};

const DEFAULT_BATCH_MAX_ITEMS = 25;
const HARD_BATCH_MAX_ITEMS = 100;

function getStageCandidate(
  dependencies: CandidateExtractionStagingPipelineDependencies = {},
): CandidateExtractionStageCandidate {
  return dependencies.stageCandidate ?? stageNormalizedDiscoveryCandidate;
}

function normalizeActorId(actorId: string | null | undefined) {
  if (actorId === null) return null;
  if (typeof actorId !== "string") return undefined;

  const trimmed = actorId.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function withActorId(
  stagingInput: StageNormalizedDiscoveryCandidateInput,
  actorId: string | null | undefined,
): StageNormalizedDiscoveryCandidateInput {
  const normalizedActorId = normalizeActorId(actorId);

  if (normalizedActorId === undefined) return stagingInput;

  return {
    ...stagingInput,
    actorId: normalizedActorId,
  };
}

function toMapperFailure(
  mapperResult: CandidateExtractionMapperFailure,
): CandidateExtractionStagingPipelineMapperFailure {
  return {
    ok: false,
    stage: "mapper",
    error: {
      code: mapperResult.error.code,
      message: mapperResult.error.message,
      ...(mapperResult.error.field ? { field: mapperResult.error.field } : {}),
    },
    ...(mapperResult.discoveryRunId
      ? { discoveryRunId: mapperResult.discoveryRunId }
      : {}),
    ...(mapperResult.discoverySourceId
      ? { discoverySourceId: mapperResult.discoverySourceId }
      : {}),
    ...(mapperResult.auditCorrelationId !== undefined
      ? { auditCorrelationId: mapperResult.auditCorrelationId }
      : {}),
    mapperWarnings: mapperResult.warnings,
  };
}

function toStagingFailure(
  stagingResult: StagingFailure,
  mapperWarnings: CandidateExtractionMapperWarning[],
): CandidateExtractionStagingPipelineStagingFailure {
  return {
    ok: false,
    stage: "staging",
    error: {
      code: stagingResult.error.code,
      message: stagingResult.error.message,
    },
    ...(stagingResult.discoveryRunId
      ? { discoveryRunId: stagingResult.discoveryRunId }
      : {}),
    ...(stagingResult.discoverySourceId
      ? { discoverySourceId: stagingResult.discoverySourceId }
      : {}),
    ...(stagingResult.auditCorrelationId !== undefined
      ? { auditCorrelationId: stagingResult.auditCorrelationId }
      : {}),
    mapperWarnings,
  };
}

function toUnexpectedStagingFailure(
  stagingInput: StageNormalizedDiscoveryCandidateInput,
  mapperWarnings: CandidateExtractionMapperWarning[],
): CandidateExtractionStagingPipelineStagingFailure {
  return {
    ok: false,
    stage: "staging",
    error: {
      code: "unexpected_error",
      message: "Unexpected candidate staging error.",
    },
    discoveryRunId: stagingInput.discoveryRunId,
    discoverySourceId: stagingInput.discoverySourceId,
    auditCorrelationId:
      stagingInput.normalizedCandidate.audit_correlation_id ?? null,
    mapperWarnings,
  };
}

function toSuccess(
  stagingResult: Extract<StageNormalizedDiscoveryCandidateResult, { ok: true }>,
  mapperWarnings: CandidateExtractionMapperWarning[],
): CandidateExtractionStagingPipelineSuccess {
  return {
    ok: true,
    stage: "staging",
    status: "staged",
    candidateId: stagingResult.candidateId,
    candidateStatus: stagingResult.candidateStatus,
    discoveryRunId: stagingResult.discoveryRunId,
    discoverySourceId: stagingResult.discoverySourceId,
    auditCorrelationId: stagingResult.auditCorrelationId,
    mapperWarnings,
  };
}

function normalizeBatchMaxItems(value: number | null | undefined) {
  if (!Number.isInteger(value) || value === null || value === undefined || value < 1) {
    return DEFAULT_BATCH_MAX_ITEMS;
  }

  return Math.min(value, HARD_BATCH_MAX_ITEMS);
}

export async function stageMappedExtractionCandidate(
  input: CandidateExtractionStagingPipelineInput,
  dependencies: CandidateExtractionStagingPipelineDependencies = {},
): Promise<CandidateExtractionStagingPipelineItemResult> {
  const mapperResult = mapExtractionToStagingCandidate(input.item);

  if (!mapperResult.ok) {
    return toMapperFailure(mapperResult);
  }

  const stagingInput = withActorId(mapperResult.stagingInput, input.actorId);
  const stageCandidate = getStageCandidate(dependencies);

  try {
    const stagingResult = await stageCandidate(stagingInput);

    if (!stagingResult.ok) {
      return toStagingFailure(stagingResult, mapperResult.warnings);
    }

    return toSuccess(stagingResult, mapperResult.warnings);
  } catch {
    return toUnexpectedStagingFailure(stagingInput, mapperResult.warnings);
  }
}

export async function stageMappedExtractionCandidateBatch(
  input: CandidateExtractionStagingPipelineBatchInput,
  dependencies: CandidateExtractionStagingPipelineDependencies = {},
): Promise<CandidateExtractionStagingPipelineBatchResult> {
  const maxItems = normalizeBatchMaxItems(input.maxItems);
  const items = Array.isArray(input.items) ? input.items : [];
  const processedItems = items.slice(0, maxItems);
  const results: CandidateExtractionStagingPipelineItemResult[] = [];

  for (const item of processedItems) {
    results.push(
      await stageMappedExtractionCandidate(
        {
          item,
          actorId: input.actorId,
        },
        dependencies,
      ),
    );
  }

  const stagedCount = results.filter((result) => result.ok).length;
  const mapperFailureCount = results.filter(
    (result) => !result.ok && result.stage === "mapper",
  ).length;
  const stagingFailureCount = results.filter(
    (result) => !result.ok && result.stage === "staging",
  ).length;

  return {
    ok:
      processedItems.length === items.length &&
      mapperFailureCount === 0 &&
      stagingFailureCount === 0,
    totalItems: items.length,
    processedCount: processedItems.length,
    skippedCount: items.length - processedItems.length,
    stagedCount,
    mapperFailureCount,
    stagingFailureCount,
    results,
  };
}
