import {
  createCandidateStagingQueueFiltersHash,
  createCandidateStagingQueueNextCursor,
  decodeCandidateStagingQueueCursor,
  type CandidateStagingQueueCursorPayload,
} from "./discovery-candidate-staging-queue-cursor";

export const DISCOVERY_CANDIDATE_STAGING_QUEUE_ACTIVE_STATUSES = [
  "staged",
  "needs_review",
  "duplicate_suspected",
] as const;

export const DISCOVERY_CANDIDATE_STAGING_QUEUE_SAFE_COLUMNS = [
  "id",
  "candidate_name",
  "candidate_status",
  "candidate_website_url",
  "candidate_category_hint",
  "candidate_pricing_hint",
  "candidate_description",
  "confidence_bucket",
  "duplicate_check_status",
  "duplicate_signal_types",
  "risk_flags",
  "discovery_source_id",
  "discovery_run_id",
  "audit_correlation_id",
  "source_url",
  "source_domain",
  "source_evidence_kind",
  "source_evidence_locator",
  "created_at",
  "updated_at",
] as const;

const ACTIVE_STATUS_SET = new Set<string>(
  DISCOVERY_CANDIDATE_STAGING_QUEUE_ACTIVE_STATUSES,
);

const ALLOWED_SORT_KEYS = new Set<string>([
  "created_at",
  "updated_at",
  "confidence_bucket",
]);

const ALLOWED_SORT_DIRECTIONS = new Set<string>(["asc", "desc"]);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 120;

export type CandidateStagingQueueStatusFilter =
  (typeof DISCOVERY_CANDIDATE_STAGING_QUEUE_ACTIVE_STATUSES)[number];

export type CandidateStagingQueueSortKey =
  | "created_at"
  | "updated_at"
  | "confidence_bucket";

export type CandidateStagingQueueSortDirection = "asc" | "desc";

export type CandidateStagingQueueReadErrorCode =
  | "invalid_status_filter"
  | "invalid_limit"
  | "candidate_queue_invalid_cursor"
  | "candidate_queue_cursor_mismatch"
  | "candidate_queue_cursor_version_unsupported"
  | "invalid_sort_key"
  | "invalid_sort_direction"
  | "invalid_uuid_filter"
  | "candidate_queue_read_failed";

export type ListDiscoveryCandidateStagingQueueItemsInput = {
  statuses?: CandidateStagingQueueStatusFilter[];
  search?: string;
  discoverySourceId?: string;
  discoveryRunId?: string;
  auditCorrelationId?: string;
  duplicateCheckStatus?: string;
  confidenceBucket?: string;
  limit?: number;
  cursor?: string;
  sortKey?: CandidateStagingQueueSortKey;
  sortDirection?: CandidateStagingQueueSortDirection;
};

export type DiscoveryCandidateStagingQueueItem = {
  candidateId: string;
  candidateName: string;
  candidateStatus: CandidateStagingQueueStatusFilter;
  candidateWebsiteUrl: string;
  candidateCategoryHint: string | null;
  candidatePricingHint: string | null;
  candidateDescription: string | null;
  confidenceBucket: string | null;
  duplicateCheckStatus: string | null;
  duplicateSignalTypes: string[];
  riskFlags: string[];
  discoverySourceId: string | null;
  discoveryRunId: string;
  auditCorrelationId: string;
  sourceUrl: string;
  sourceDomain: string | null;
  sourceEvidenceKind: string;
  sourceEvidenceLocator: string;
  createdAt: string;
  updatedAt: string;
};

export type ListDiscoveryCandidateStagingQueueItemsResult = {
  items: DiscoveryCandidateStagingQueueItem[];
  nextCursor: string | null;
  hasNextPage: boolean;
  limit: number;
  sortKey: CandidateStagingQueueSortKey;
  sortDirection: CandidateStagingQueueSortDirection;
  totalCount?: number;
  appliedStatuses: CandidateStagingQueueStatusFilter[];
};

type DiscoveryCandidateStagingQueueRow = {
  id: string;
  candidate_name: string | null;
  candidate_status: string | null;
  candidate_website_url: string | null;
  candidate_category_hint: string | null;
  candidate_pricing_hint: string | null;
  candidate_description: string | null;
  confidence_bucket: string | null;
  duplicate_check_status: string | null;
  duplicate_signal_types: unknown;
  risk_flags: unknown;
  discovery_source_id: string | null;
  discovery_run_id: string | null;
  audit_correlation_id: string | null;
  source_url: string | null;
  source_domain: string | null;
  source_evidence_kind: string | null;
  source_evidence_locator: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type CandidateStagingQueueQueryError = {
  message?: string;
  code?: string;
};

type CandidateStagingQueueQueryResult = {
  data: DiscoveryCandidateStagingQueueRow[] | null;
  error: CandidateStagingQueueQueryError | null;
  count?: number | null;
};

export type CandidateStagingQueueQueryBuilder =
  PromiseLike<CandidateStagingQueueQueryResult> & {
    select(
      columns: string,
      options?: { count?: "exact" },
    ): CandidateStagingQueueQueryBuilder;
    in(
      column: string,
      values: readonly CandidateStagingQueueStatusFilter[],
    ): CandidateStagingQueueQueryBuilder;
    eq(column: string, value: string): CandidateStagingQueueQueryBuilder;
    order(
      column: CandidateStagingQueueSortKey | "id",
      options: { ascending: boolean },
    ): CandidateStagingQueueQueryBuilder;
    limit(limit: number): CandidateStagingQueueQueryBuilder;
    or(filter: string): CandidateStagingQueueQueryBuilder;
  };

export type CandidateStagingQueueReadClient = {
  from(table: "discovery_candidate_tools"): CandidateStagingQueueQueryBuilder;
};

export type ListDiscoveryCandidateStagingQueueItemsOptions = {
  client?: CandidateStagingQueueReadClient;
};

export class DiscoveryCandidateStagingQueueReadModelError extends Error {
  readonly code: CandidateStagingQueueReadErrorCode;

  constructor(code: CandidateStagingQueueReadErrorCode, message: string) {
    super(message);
    this.name = "DiscoveryCandidateStagingQueueReadModelError";
    this.code = code;
  }
}

function fail(
  code: CandidateStagingQueueReadErrorCode,
  message: string,
): never {
  throw new DiscoveryCandidateStagingQueueReadModelError(code, message);
}

function isActiveStatus(
  status: string | null | undefined,
): status is CandidateStagingQueueStatusFilter {
  return typeof status === "string" && ACTIVE_STATUS_SET.has(status);
}

function resolveStatuses(
  statuses: ListDiscoveryCandidateStagingQueueItemsInput["statuses"],
): CandidateStagingQueueStatusFilter[] {
  if (statuses === undefined) {
    return [...DISCOVERY_CANDIDATE_STAGING_QUEUE_ACTIVE_STATUSES];
  }

  if (!Array.isArray(statuses) || statuses.length === 0) {
    fail("invalid_status_filter", "At least one active queue status is required.");
  }

  const resolved: CandidateStagingQueueStatusFilter[] = [];

  for (const status of statuses) {
    if (!isActiveStatus(status)) {
      fail(
        "invalid_status_filter",
        "Only active candidate staging queue statuses are allowed.",
      );
    }

    if (!resolved.includes(status)) {
      resolved.push(status);
    }
  }

  return resolved;
}

function resolveLimit(limit: number | undefined): number {
  if (limit === undefined) {
    return DEFAULT_LIMIT;
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    fail("invalid_limit", `Limit must be an integer between 1 and ${MAX_LIMIT}.`);
  }

  return limit;
}

function resolveSortKey(
  sortKey: CandidateStagingQueueSortKey | undefined,
): CandidateStagingQueueSortKey {
  if (sortKey === undefined) {
    return "created_at";
  }

  if (!ALLOWED_SORT_KEYS.has(sortKey)) {
    fail("invalid_sort_key", "Sort key is not allowed.");
  }

  return sortKey;
}

function resolveSortDirection(
  sortDirection: CandidateStagingQueueSortDirection | undefined,
): CandidateStagingQueueSortDirection {
  if (sortDirection === undefined) {
    return "desc";
  }

  if (!ALLOWED_SORT_DIRECTIONS.has(sortDirection)) {
    fail("invalid_sort_direction", "Sort direction is not allowed.");
  }

  return sortDirection;
}

function assertUuidFilter(value: string | undefined, label: string): void {
  if (value === undefined) {
    return;
  }

  if (!UUID_PATTERN.test(value)) {
    fail("invalid_uuid_filter", `${label} must be a valid UUID.`);
  }
}

function normalizeOptionalFilter(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();

  if (trimmed.length === 0 || trimmed.length > MAX_SEARCH_LENGTH) {
    fail(
      "candidate_queue_read_failed",
      "Optional filters must be non-empty and bounded.",
    );
  }

  return trimmed;
}

function getCursorFiltersHash(input: {
  statuses: CandidateStagingQueueStatusFilter[];
  search: string | null;
  duplicateCheckStatus: string | null;
  confidenceBucket: string | null;
  discoverySourceId: string | undefined;
  discoveryRunId: string | undefined;
  auditCorrelationId: string | undefined;
  limit: number;
  sortKey: CandidateStagingQueueSortKey;
  sortDirection: CandidateStagingQueueSortDirection;
}) {
  return createCandidateStagingQueueFiltersHash({
    statuses: input.statuses,
    search: input.search,
    duplicateCheckStatus: input.duplicateCheckStatus,
    confidenceBucket: input.confidenceBucket,
    discoverySourceId: input.discoverySourceId ?? null,
    discoveryRunId: input.discoveryRunId ?? null,
    auditCorrelationId: input.auditCorrelationId ?? null,
    limit: input.limit,
    sortKey: input.sortKey,
    sortDirection: input.sortDirection,
  });
}

function resolveCursor(
  cursor: string | undefined,
  context: {
    filtersHash: string;
    sortKey: CandidateStagingQueueSortKey;
    sortDirection: CandidateStagingQueueSortDirection;
  },
): CandidateStagingQueueCursorPayload | null {
  if (cursor === undefined || cursor.trim() === "") {
    return null;
  }

  const decoded = decodeCandidateStagingQueueCursor(cursor);

  if (!decoded.ok) {
    fail(
      decoded.errorCode === "cursor_version_unsupported"
        ? "candidate_queue_cursor_version_unsupported"
        : "candidate_queue_invalid_cursor",
      "Candidate staging queue cursor is invalid.",
    );
  }

  if (
    decoded.payload.filtersHash !== context.filtersHash ||
    decoded.payload.sortKey !== context.sortKey ||
    decoded.payload.sortDirection !== context.sortDirection
  ) {
    fail(
      "candidate_queue_cursor_mismatch",
      "Candidate staging queue cursor does not match the current filters.",
    );
  }

  if (decoded.payload.sortKey === "confidence_bucket") {
    fail(
      "candidate_queue_invalid_cursor",
      "Confidence cursor pagination is not enabled for this queue phase.",
    );
  }

  return decoded.payload;
}

function applyCursorFilter(
  query: CandidateStagingQueueQueryBuilder,
  cursor: CandidateStagingQueueCursorPayload | null,
) {
  if (cursor === null) {
    return query;
  }

  if (cursor.sortKey === "confidence_bucket") {
    fail(
      "candidate_queue_invalid_cursor",
      "Confidence cursor pagination is not enabled for this queue phase.",
    );
  }

  if (typeof cursor.lastValue !== "string" || cursor.lastValue.trim() === "") {
    fail("candidate_queue_invalid_cursor", "Candidate staging cursor value is invalid.");
  }

  const operator = cursor.sortDirection === "asc" ? "gt" : "lt";
  const lastValue = cursor.lastValue.trim();
  const lastCandidateId = cursor.lastCandidateId.trim().toLowerCase();

  return query.or(
    [
      `${cursor.sortKey}.${operator}.${lastValue}`,
      `and(${cursor.sortKey}.eq.${lastValue},id.${operator}.${lastCandidateId})`,
    ].join(","),
  );
}

function normalizeSearch(search: string | undefined): string | null {
  if (search === undefined) {
    return null;
  }

  const trimmed = search.replace(/[\u0000-\u001f\u007f]/g, " ").trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length > MAX_SEARCH_LENGTH) {
    fail("candidate_queue_read_failed", "Search term is too long.");
  }

  return trimmed.replace(/,/g, " ");
}

function escapePostgrestLikePattern(value: string): string {
  return value.replace(/([%_\\])/g, "\\$1");
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function mapQueueRow(
  row: DiscoveryCandidateStagingQueueRow,
): DiscoveryCandidateStagingQueueItem | null {
  if (!isActiveStatus(row.candidate_status)) {
    return null;
  }

  if (
    !row.id ||
    !row.candidate_name ||
    !row.candidate_website_url ||
    !row.discovery_run_id ||
    !row.audit_correlation_id ||
    !row.source_url ||
    !row.source_evidence_kind ||
    !row.source_evidence_locator ||
    !row.created_at ||
    !row.updated_at
  ) {
    return null;
  }

  return {
    candidateId: row.id,
    candidateName: row.candidate_name,
    candidateStatus: row.candidate_status,
    candidateWebsiteUrl: row.candidate_website_url,
    candidateCategoryHint: row.candidate_category_hint,
    candidatePricingHint: row.candidate_pricing_hint,
    candidateDescription: row.candidate_description,
    confidenceBucket: row.confidence_bucket,
    duplicateCheckStatus: row.duplicate_check_status,
    duplicateSignalTypes: toStringArray(row.duplicate_signal_types),
    riskFlags: toStringArray(row.risk_flags),
    discoverySourceId: row.discovery_source_id,
    discoveryRunId: row.discovery_run_id,
    auditCorrelationId: row.audit_correlation_id,
    sourceUrl: row.source_url,
    sourceDomain: row.source_domain,
    sourceEvidenceKind: row.source_evidence_kind,
    sourceEvidenceLocator: row.source_evidence_locator,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listDiscoveryCandidateStagingQueueItems(
  input: ListDiscoveryCandidateStagingQueueItemsInput = {},
  options: ListDiscoveryCandidateStagingQueueItemsOptions = {},
): Promise<ListDiscoveryCandidateStagingQueueItemsResult> {
  const statuses = resolveStatuses(input.statuses);
  const limit = resolveLimit(input.limit);
  const sortKey = resolveSortKey(input.sortKey);
  const sortDirection = resolveSortDirection(input.sortDirection);

  assertUuidFilter(input.discoverySourceId, "discoverySourceId");
  assertUuidFilter(input.discoveryRunId, "discoveryRunId");
  assertUuidFilter(input.auditCorrelationId, "auditCorrelationId");

  const duplicateCheckStatus = normalizeOptionalFilter(
    input.duplicateCheckStatus,
  );
  const confidenceBucket = normalizeOptionalFilter(input.confidenceBucket);
  const search = normalizeSearch(input.search);
  const filtersHash = getCursorFiltersHash({
    statuses,
    search,
    duplicateCheckStatus,
    confidenceBucket,
    discoverySourceId: input.discoverySourceId,
    discoveryRunId: input.discoveryRunId,
    auditCorrelationId: input.auditCorrelationId,
    limit,
    sortKey,
    sortDirection,
  });
  const cursor = resolveCursor(input.cursor, {
    filtersHash,
    sortKey,
    sortDirection,
  });

  if (!options.client) {
    fail(
      "candidate_queue_read_failed",
      "A candidate staging queue read client is required.",
    );
  }

  let query = options.client
    .from("discovery_candidate_tools")
    .select(DISCOVERY_CANDIDATE_STAGING_QUEUE_SAFE_COLUMNS.join(", "), {
      count: "exact",
    })
    .in("candidate_status", statuses)
    .order(sortKey, { ascending: sortDirection === "asc" })
    .order("id", { ascending: sortDirection === "asc" })
    .limit(limit + 1);

  query = applyCursorFilter(query, cursor);

  if (input.discoverySourceId !== undefined) {
    query = query.eq("discovery_source_id", input.discoverySourceId);
  }

  if (input.discoveryRunId !== undefined) {
    query = query.eq("discovery_run_id", input.discoveryRunId);
  }

  if (input.auditCorrelationId !== undefined) {
    query = query.eq("audit_correlation_id", input.auditCorrelationId);
  }

  if (duplicateCheckStatus !== null) {
    query = query.eq("duplicate_check_status", duplicateCheckStatus);
  }

  if (confidenceBucket !== null) {
    query = query.eq("confidence_bucket", confidenceBucket);
  }

  if (search !== null) {
    const pattern = `%${escapePostgrestLikePattern(search)}%`;
    query = query.or(
      [
        `candidate_name.ilike.${pattern}`,
        `candidate_website_url.ilike.${pattern}`,
        `source_domain.ilike.${pattern}`,
      ].join(","),
    );
  }

  const { data, error, count } = await query;

  if (error) {
    fail(
      "candidate_queue_read_failed",
      "Candidate staging queue read failed.",
    );
  }

  const mappedItems = (data ?? [])
    .map(mapQueueRow)
    .filter((item): item is DiscoveryCandidateStagingQueueItem => item !== null);
  const hasNextPage =
    sortKey !== "confidence_bucket" && mappedItems.length > limit;
  const items = mappedItems.slice(0, limit);
  const lastItem = items.at(-1) ?? null;
  const nextCursor =
    hasNextPage && lastItem
      ? createCandidateStagingQueueNextCursor({
          sortKey,
          sortDirection,
          lastValue:
            sortKey === "created_at" ? lastItem.createdAt : lastItem.updatedAt,
          lastCandidateId: lastItem.candidateId,
          filtersHash,
        })
      : null;

  const result = {
    items,
    nextCursor,
    hasNextPage: Boolean(nextCursor),
    limit,
    sortKey,
    sortDirection,
    appliedStatuses: statuses,
  } satisfies ListDiscoveryCandidateStagingQueueItemsResult;

  if (typeof count === "number") {
    return { ...result, totalCount: count };
  }

  return result;
}
