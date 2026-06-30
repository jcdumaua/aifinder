import { NextResponse } from "next/server";
import {
  verifyAdminSession,
  type VerifyAdminSessionResult,
} from "../../../../../lib/admin-auth";
import {
  listDiscoveryCandidateStagingQueueItems,
  type CandidateStagingQueueReadClient,
  type CandidateStagingQueueReadErrorCode,
  type CandidateStagingQueueSortDirection,
  type CandidateStagingQueueSortKey,
  type CandidateStagingQueueStatusFilter,
  type DiscoveryCandidateStagingQueueItem,
  type ListDiscoveryCandidateStagingQueueItemsInput,
} from "../../../../../lib/discovery/discovery-candidate-staging-queue-read-model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Route: GET /api/admin/discovery/candidate-staging-queue

type CandidateStagingQueueApiReadRouteErrorCode =
  | "unauthorized"
  | "forbidden"
  | CandidateStagingQueueReadErrorCode;

export type CandidateStagingQueueApiReadResponse = {
  ok: true;
  items: DiscoveryCandidateStagingQueueItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
  limit: number;
  sortKey: CandidateStagingQueueSortKey;
  sortDirection: CandidateStagingQueueSortDirection;
  totalCount?: number;
  appliedStatuses: CandidateStagingQueueStatusFilter[];
};

export type CandidateStagingQueueApiReadErrorResponse = {
  ok: false;
  error: {
    code: CandidateStagingQueueApiReadRouteErrorCode;
    message: string;
  };
};

type CandidateStagingQueueReadRouteDependencies = {
  verifyAdminSession?: (request: Request) => VerifyAdminSessionResult;
  getClient?: () =>
    | CandidateStagingQueueReadClient
    | Promise<CandidateStagingQueueReadClient>;
  listQueueItems?: typeof listDiscoveryCandidateStagingQueueItems;
};

const CANDIDATE_QUEUE_READ_ERROR_CODES = new Set<CandidateStagingQueueReadErrorCode>([
  "invalid_status_filter",
  "invalid_limit",
  "candidate_queue_invalid_cursor",
  "candidate_queue_cursor_mismatch",
  "candidate_queue_cursor_version_unsupported",
  "invalid_sort_key",
  "invalid_sort_direction",
  "invalid_uuid_filter",
  "candidate_queue_read_failed",
]);

const CANDIDATE_QUEUE_READ_ERROR_STATUS: Record<
  CandidateStagingQueueReadErrorCode,
  400 | 500
> = {
  invalid_status_filter: 400,
  invalid_limit: 400,
  candidate_queue_invalid_cursor: 400,
  candidate_queue_cursor_mismatch: 400,
  candidate_queue_cursor_version_unsupported: 400,
  invalid_sort_key: 400,
  invalid_sort_direction: 400,
  invalid_uuid_filter: 400,
  candidate_queue_read_failed: 500,
};

const CANDIDATE_QUEUE_READ_ERROR_MESSAGES: Record<
  CandidateStagingQueueReadErrorCode,
  string
> = {
  invalid_status_filter: "Invalid candidate staging queue status filter.",
  invalid_limit: "Invalid candidate staging queue limit.",
  candidate_queue_invalid_cursor:
    "This page token is no longer valid. Return to the first page and try again.",
  candidate_queue_cursor_mismatch:
    "This page token no longer matches the selected filters. Return to the first page and try again.",
  candidate_queue_cursor_version_unsupported:
    "This page token version is no longer supported. Return to the first page and try again.",
  invalid_sort_key: "Invalid candidate staging queue sort key.",
  invalid_sort_direction: "Invalid candidate staging queue sort direction.",
  invalid_uuid_filter: "Invalid candidate staging queue UUID filter.",
  candidate_queue_read_failed: "Candidate staging queue read failed.",
};

function jsonResponse(
  data:
    | CandidateStagingQueueApiReadResponse
    | CandidateStagingQueueApiReadErrorResponse,
  status = 200,
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function parseStatuses(
  searchParams: URLSearchParams,
): CandidateStagingQueueStatusFilter[] | undefined {
  const value = searchParams.get("statuses");

  if (value === null) {
    return undefined;
  }

  return value
    .split(",")
    .map((status) => status.trim())
    .filter(Boolean) as CandidateStagingQueueStatusFilter[];
}

function parseLimit(searchParams: URLSearchParams): number | undefined {
  const value = searchParams.get("limit");

  if (value === null) {
    return undefined;
  }

  return Number(value);
}

function getOptionalParam(
  searchParams: URLSearchParams,
  name: string,
): string | undefined {
  const value = searchParams.get(name);

  if (value === null) {
    return undefined;
  }

  return value;
}

function parseCandidateStagingQueueSearchParams(
  searchParams: URLSearchParams,
): ListDiscoveryCandidateStagingQueueItemsInput {
  const input: ListDiscoveryCandidateStagingQueueItemsInput = {};
  const statuses = parseStatuses(searchParams);
  const limit = parseLimit(searchParams);
  const search = getOptionalParam(searchParams, "search");
  const discoverySourceId = getOptionalParam(searchParams, "discoverySourceId");
  const discoveryRunId = getOptionalParam(searchParams, "discoveryRunId");
  const auditCorrelationId = getOptionalParam(
    searchParams,
    "auditCorrelationId",
  );
  const duplicateCheckStatus = getOptionalParam(
    searchParams,
    "duplicateCheckStatus",
  );
  const confidenceBucket = getOptionalParam(searchParams, "confidenceBucket");
  const cursor = getOptionalParam(searchParams, "cursor");
  const sortKey = getOptionalParam(searchParams, "sortKey");
  const sortDirection = getOptionalParam(searchParams, "sortDirection");

  if (statuses !== undefined) {
    input.statuses = statuses;
  }

  if (limit !== undefined) {
    input.limit = limit;
  }

  if (search !== undefined) {
    input.search = search;
  }

  if (discoverySourceId !== undefined) {
    input.discoverySourceId = discoverySourceId;
  }

  if (discoveryRunId !== undefined) {
    input.discoveryRunId = discoveryRunId;
  }

  if (auditCorrelationId !== undefined) {
    input.auditCorrelationId = auditCorrelationId;
  }

  if (duplicateCheckStatus !== undefined) {
    input.duplicateCheckStatus = duplicateCheckStatus;
  }

  if (confidenceBucket !== undefined) {
    input.confidenceBucket = confidenceBucket;
  }

  if (cursor !== undefined) {
    input.cursor = cursor;
  }

  if (sortKey !== undefined) {
    input.sortKey = sortKey as CandidateStagingQueueSortKey;
  }

  if (sortDirection !== undefined) {
    input.sortDirection = sortDirection as CandidateStagingQueueSortDirection;
  }

  return input;
}

function isCandidateQueueReadErrorCode(
  value: unknown,
): value is CandidateStagingQueueReadErrorCode {
  return (
    typeof value === "string" &&
    CANDIDATE_QUEUE_READ_ERROR_CODES.has(
      value as CandidateStagingQueueReadErrorCode,
    )
  );
}

function getCandidateQueueReadErrorCode(
  error: unknown,
): CandidateStagingQueueReadErrorCode {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    isCandidateQueueReadErrorCode(error.code)
  ) {
    return error.code;
  }

  return "candidate_queue_read_failed";
}

async function getDefaultCandidateStagingQueueReadClient() {
  const { supabaseAdmin } = await import("../../../../../lib/supabase-admin");

  return supabaseAdmin as unknown as CandidateStagingQueueReadClient;
}

export function createCandidateStagingQueueReadHandler(
  dependencies: CandidateStagingQueueReadRouteDependencies = {},
) {
  return async function candidateStagingQueueReadHandler(request: Request) {
    const adminSession = (
      dependencies.verifyAdminSession || verifyAdminSession
    )(request);

    if (!adminSession.isAdmin || !adminSession.actor) {
      console.warn("Unauthorized candidate staging queue read request.", {
        errors: adminSession.errors,
      });

      return jsonResponse(
        {
          ok: false,
          error: {
            code: "unauthorized",
            message: "Unauthorized.",
          },
        },
        401,
      );
    }

    const parsedInput = parseCandidateStagingQueueSearchParams(
      new URL(request.url).searchParams,
    );

    try {
      const client = dependencies.getClient
        ? await dependencies.getClient()
        : await getDefaultCandidateStagingQueueReadClient();
      const readQueueItems =
        dependencies.listQueueItems || listDiscoveryCandidateStagingQueueItems;
      const result = await readQueueItems(parsedInput, { client });

      return jsonResponse({
        ok: true,
        ...result,
      });
    } catch (error) {
      const code = getCandidateQueueReadErrorCode(error);

      return jsonResponse(
        {
          ok: false,
          error: {
            code,
            message: CANDIDATE_QUEUE_READ_ERROR_MESSAGES[code],
          },
        },
        CANDIDATE_QUEUE_READ_ERROR_STATUS[code],
      );
    }
  };
}

export const GET = createCandidateStagingQueueReadHandler();
