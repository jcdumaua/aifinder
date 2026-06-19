import {
  getNormalizedDomain,
  validateHttpsUrl,
  validateTextField,
} from "./tool-validation";

export const MANUAL_CRAWLER_SOURCE_KIND = "manual_curated_urls";
export const MANUAL_CRAWLER_APPROVAL_STATUS =
  "approved_for_first_manual_prototype";
export const MANUAL_CRAWLER_RISK_LEVEL = "low";
export const MANUAL_CRAWLER_MAX_URLS = 20;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const POLICY_VALUES = new Set([
  "allowed",
  "blocked",
  "unknown",
  "not_applicable",
]);

type JsonRecord = Record<string, unknown>;

type ManualCrawlerPolicyValue =
  | "allowed"
  | "blocked"
  | "unknown"
  | "not_applicable";

export type ValidatedManualCrawlerPolicyReview = {
  url: string;
  normalized_domain: string;
  robots_txt_review: ManualCrawlerPolicyValue;
  terms_review: ManualCrawlerPolicyValue;
  permission_status: ManualCrawlerPolicyValue;
  permission_notes: string;
  reviewed_at: string;
  reviewed_by: string;
};

export type ValidatedManualCrawlerUrl = {
  url: string;
  normalizedDomain: string;
  policyReview: ValidatedManualCrawlerPolicyReview;
};

export type ValidatedManualCrawlerRequest = {
  sourceId: string;
  urls: ValidatedManualCrawlerUrl[];
};

export type ManualCrawlerSource = {
  id: string;
  name: string;
  slug: string;
  source_type: string;
  config: unknown;
  is_active: boolean;
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getRequiredUuid(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
    throw new Error(`${fieldName} must be a valid ID.`);
  }

  return value;
}

function getPolicyValue(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !POLICY_VALUES.has(value)) {
    throw new Error(`${fieldName} must be a valid policy value.`);
  }

  return value as ManualCrawlerPolicyValue;
}

function requireAllowedPolicyValue(
  value: ManualCrawlerPolicyValue,
  fieldName: string
) {
  if (value !== "allowed") {
    throw new Error(`${fieldName} must be allowed before a crawler run can be triggered.`);
  }
}

function getIsoTimestamp(value: unknown, fieldName: string) {
  const timestamp = validateTextField(value, fieldName, 40, {
    required: true,
    unsafeCheck: false,
  });

  const parsed = Date.parse(timestamp);

  if (!Number.isFinite(parsed)) {
    throw new Error(`${fieldName} must be a valid timestamp.`);
  }

  return new Date(parsed).toISOString();
}

function validatePolicyReview(
  value: unknown,
  url: string,
  normalizedDomain: string,
  index: number
): ValidatedManualCrawlerPolicyReview {
  if (!isRecord(value)) {
    throw new Error(`URL ${index + 1} policy review is required.`);
  }

  const robotsTxtReview = getPolicyValue(
    value.robots_txt_review,
    `URL ${index + 1} robots.txt review`
  );
  const termsReview = getPolicyValue(
    value.terms_review,
    `URL ${index + 1} Terms review`
  );
  const permissionStatus = getPolicyValue(
    value.permission_status,
    `URL ${index + 1} permission status`
  );

  requireAllowedPolicyValue(robotsTxtReview, `URL ${index + 1} robots.txt review`);
  requireAllowedPolicyValue(termsReview, `URL ${index + 1} Terms review`);
  requireAllowedPolicyValue(permissionStatus, `URL ${index + 1} permission status`);

  return {
    url,
    normalized_domain: normalizedDomain,
    robots_txt_review: robotsTxtReview,
    terms_review: termsReview,
    permission_status: permissionStatus,
    permission_notes: validateTextField(
      value.permission_notes,
      `URL ${index + 1} permission notes`,
      500,
      {
        required: true,
        unsafeCheck: true,
      }
    ),
    reviewed_at: getIsoTimestamp(value.reviewed_at, `URL ${index + 1} reviewed at`),
    reviewed_by: validateTextField(
      value.reviewed_by,
      `URL ${index + 1} reviewed by`,
      120,
      {
        required: true,
        unsafeCheck: true,
      }
    ),
  };
}

export function validateManualCrawlerRequest(
  body: unknown
): ValidatedManualCrawlerRequest {
  if (!isRecord(body)) {
    throw new Error("Invalid request body.");
  }

  const sourceId = getRequiredUuid(body.source_id, "Discovery source ID");

  if (!Array.isArray(body.urls)) {
    throw new Error("Manual crawler URLs must be a list.");
  }

  if (body.urls.length < 1) {
    throw new Error("At least one URL is required.");
  }

  if (body.urls.length > MANUAL_CRAWLER_MAX_URLS) {
    throw new Error(`Manual crawler runs are limited to ${MANUAL_CRAWLER_MAX_URLS} URLs.`);
  }

  const seenUrls = new Set<string>();
  const urls = body.urls.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`URL ${index + 1} must be an object.`);
    }

    const url = validateHttpsUrl(item.url, `URL ${index + 1}`, { required: true });
    const normalizedDomain = getNormalizedDomain(url);

    if (seenUrls.has(url)) {
      throw new Error(`URL ${index + 1} is duplicated.`);
    }

    seenUrls.add(url);

    return {
      url,
      normalizedDomain,
      policyReview: validatePolicyReview(
        item.policy_review,
        url,
        normalizedDomain,
        index
      ),
    };
  });

  return {
    sourceId,
    urls,
  };
}

export function validateManualCrawlerSource(source: ManualCrawlerSource) {
  if (!source.is_active) {
    throw new Error("Discovery source must be active.");
  }

  if (source.source_type !== "manual") {
    throw new Error("Discovery source must use manual source_type.");
  }

  if (!isRecord(source.config)) {
    throw new Error("Discovery source config must be an object.");
  }

  if (source.config.kind !== MANUAL_CRAWLER_SOURCE_KIND) {
    throw new Error("Discovery source is not configured for manual curated URLs.");
  }

  if (source.config.approval_status !== MANUAL_CRAWLER_APPROVAL_STATUS) {
    throw new Error("Discovery source is not approved for the first manual prototype.");
  }

  if (source.config.risk_level !== MANUAL_CRAWLER_RISK_LEVEL) {
    throw new Error("Discovery source risk level must be low.");
  }

  const policyConfig = isRecord(source.config.policy) ? source.config.policy : {};
  const hasPolicyGate =
    source.config.policy_review_required_before_fetch === true ||
    policyConfig.review_mode === "per_url_required_before_fetch";

  if (!hasPolicyGate) {
    throw new Error("Discovery source must require per-URL policy review before fetch.");
  }
}

export function createManualCrawlerRunStats({
  source,
  request,
}: {
  source: ManualCrawlerSource;
  request: ValidatedManualCrawlerRequest;
}) {
  return {
    tools_found: 0,
    tools_new: 0,
    tools_duplicates: 0,
    errors: 0,
    source: "manual-crawler-trigger",
    source_kind: MANUAL_CRAWLER_SOURCE_KIND,
    execution_enabled: false,
    execution_status: "awaiting_approved_async_executor",
    no_fetch_performed: true,
    no_candidates_inserted: true,
    no_public_tools_inserted: true,
    requested_url_count: request.urls.length,
    source_snapshot: {
      id: source.id,
      name: source.name,
      slug: source.slug,
      source_type: source.source_type,
      config_kind: MANUAL_CRAWLER_SOURCE_KIND,
    },
    policy_reviews: request.urls.map((item) => item.policyReview),
  };
}
