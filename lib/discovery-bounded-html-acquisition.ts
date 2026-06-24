import { lookup as dnsLookup } from "node:dns/promises";
import { request as httpsRequest, type RequestOptions } from "node:https";
import type { ClientRequest, IncomingMessage } from "node:http";
import {
  DISCOVERY_REQUEST_PLAN_RESPONSE_SIZE_LIMIT_BYTES,
  DISCOVERY_REQUEST_PLAN_TIMEOUT_MS,
  DISCOVERY_REQUEST_PLAN_USER_AGENT,
} from "./discovery-request-plan";
import {
  getDiscoveryIpAddressFamily,
  isBlockedDiscoveryIpAddress,
  validateDiscoveryUrlSafety,
  type SafeDiscoveryUrl,
} from "./discovery-url-safety";

export const DISCOVERY_HTML_FETCH_ACCEPTED_CONTENT_TYPES = ["text/html"] as const;

const ACCEPTED_CONTENT_TYPE_SET = new Set<string>(
  DISCOVERY_HTML_FETCH_ACCEPTED_CONTENT_TYPES
);

export type DiscoveryFetchHtmlPlan = {
  normalizedUrl: string;
  hostname: string;
  protocol: "https:";
  method: "GET";
  timeoutMs: number;
  redirectLimit: 0;
  responseSizeLimitBytes: number;
  userAgent: string;
  acceptedContentTypes: readonly ["text/html"];
  createdAt: string;
};

export type DiscoveryFetchHtmlStatus =
  | "fetch_completed_html_acquired"
  | "fetch_failed_invalid_plan"
  | "fetch_failed_dns_resolution"
  | "fetch_failed_blocked_resolved_ip"
  | "fetch_failed_timeout"
  | "fetch_failed_response_too_large"
  | "fetch_failed_network_error"
  | "fetch_failed_unsupported_content_type"
  | "fetch_redirect_not_followed"
  | "fetch_failed_tls_error"
  | "fetch_failed_empty_body";

export type DiscoveryFetchHtmlMetadata = {
  requestedUrl: string;
  normalizedUrl: string;
  hostname: string;
  resolvedIp: string | null;
  resolvedIpFamily: 4 | 6 | null;
  dnsResolutionChecked: boolean;
  dnsRebindingProtectionApplied: boolean;
  connectionPinnedToResolvedIp: boolean;
  method: "GET";
  userAgent: string;
  timeoutMs: number;
  redirectLimit: 0;
  responseSizeLimitBytes: number;
  fetchStartedAt: string;
  fetchFinishedAt: string;
  durationMs: number;
  httpStatus: number | null;
  contentType: string | null;
  contentLengthHeader: string | null;
  bytesRead: number;
  responseTruncated: boolean;
  redirectLocation: string | null;
  errorCode: string | null;
};

export type DiscoveryFetchHtmlResult =
  | {
      ok: true;
      status: "fetch_completed_html_acquired";
      html: string;
      metadata: DiscoveryFetchHtmlMetadata;
    }
  | {
      ok: false;
      status: Exclude<
        DiscoveryFetchHtmlStatus,
        "fetch_completed_html_acquired"
      >;
      reason: string;
      metadata: DiscoveryFetchHtmlMetadata;
    };

export type DiscoveryResolvedAddress = {
  address: string;
  family: number;
};

type DiscoveryFetchHtmlAdapterDependencies = {
  resolveHostname?: (hostname: string) => Promise<DiscoveryResolvedAddress[]>;
  request?: (
    options: RequestOptions,
    onResponse: (response: IncomingMessage) => void
  ) => ClientRequest;
  now?: () => Date;
};

type ValidatedFetchPlan = {
  plan: DiscoveryFetchHtmlPlan;
  urlSafety: SafeDiscoveryUrl;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isAcceptedContentTypeList(value: unknown): value is readonly ["text/html"] {
  return (
    Array.isArray(value) &&
    value.length === DISCOVERY_HTML_FETCH_ACCEPTED_CONTENT_TYPES.length &&
    value.every(
      (contentType) =>
        typeof contentType === "string" && ACCEPTED_CONTENT_TYPE_SET.has(contentType)
    )
  );
}

function isValidTimeout(value: unknown) {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= DISCOVERY_REQUEST_PLAN_TIMEOUT_MS
  );
}

function isValidResponseSizeLimit(value: unknown) {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= DISCOVERY_REQUEST_PLAN_RESPONSE_SIZE_LIMIT_BYTES
  );
}

function isValidCreatedAt(value: unknown) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function validateFetchPlan(value: unknown): ValidatedFetchPlan | null {
  if (!isRecord(value)) return null;

  const urlSafety = validateDiscoveryUrlSafety(value.normalizedUrl);

  if (!urlSafety.ok) return null;

  if (
    value.normalizedUrl !== urlSafety.normalizedUrl ||
    value.hostname !== urlSafety.hostname ||
    value.protocol !== "https:" ||
    value.method !== "GET" ||
    value.redirectLimit !== 0 ||
    value.userAgent !== DISCOVERY_REQUEST_PLAN_USER_AGENT ||
    !isValidTimeout(value.timeoutMs) ||
    !isValidResponseSizeLimit(value.responseSizeLimitBytes) ||
    !isAcceptedContentTypeList(value.acceptedContentTypes) ||
    !isValidCreatedAt(value.createdAt)
  ) {
    return null;
  }

  return { plan: value as DiscoveryFetchHtmlPlan, urlSafety };
}

function getSafeUrlForMetadata(value: string) {
  try {
    const url = new URL(value);

    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      url.username ||
      url.password
    ) {
      return "";
    }

    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

function createMetadata({
  plan,
  urlSafety,
  fetchStartedAt,
}: {
  plan: DiscoveryFetchHtmlPlan | null;
  urlSafety: SafeDiscoveryUrl | null;
  fetchStartedAt: Date;
}): DiscoveryFetchHtmlMetadata {
  const safeUrl = urlSafety ? getSafeUrlForMetadata(urlSafety.normalizedUrl) : "";

  return {
    requestedUrl: safeUrl,
    normalizedUrl: safeUrl,
    hostname: urlSafety?.hostname || "",
    resolvedIp: null,
    resolvedIpFamily: null,
    dnsResolutionChecked: false,
    dnsRebindingProtectionApplied: false,
    connectionPinnedToResolvedIp: false,
    method: "GET",
    userAgent:
      plan?.userAgent === DISCOVERY_REQUEST_PLAN_USER_AGENT
        ? plan.userAgent
        : DISCOVERY_REQUEST_PLAN_USER_AGENT,
    timeoutMs:
      plan && isValidTimeout(plan.timeoutMs)
        ? plan.timeoutMs
        : DISCOVERY_REQUEST_PLAN_TIMEOUT_MS,
    redirectLimit: 0,
    responseSizeLimitBytes:
      plan && isValidResponseSizeLimit(plan.responseSizeLimitBytes)
        ? plan.responseSizeLimitBytes
        : DISCOVERY_REQUEST_PLAN_RESPONSE_SIZE_LIMIT_BYTES,
    fetchStartedAt: fetchStartedAt.toISOString(),
    fetchFinishedAt: fetchStartedAt.toISOString(),
    durationMs: 0,
    httpStatus: null,
    contentType: null,
    contentLengthHeader: null,
    bytesRead: 0,
    responseTruncated: false,
    redirectLocation: null,
    errorCode: null,
  };
}

function getSafeErrorCode(error: unknown, fallback: string) {
  if (
    isRecord(error) &&
    typeof error.code === "string" &&
    /^[A-Z0-9_]{1,80}$/.test(error.code)
  ) {
    return error.code;
  }

  return fallback;
}

function getHeaderValue(headers: IncomingMessage["headers"], name: string) {
  const value = headers[name.toLowerCase()];

  if (Array.isArray(value)) return value[0] || null;

  return typeof value === "string" ? value : null;
}

function getContentType(value: string | null) {
  if (!value) return null;

  const contentType = value.split(";", 1)[0]?.trim().toLowerCase();

  return contentType && ACCEPTED_CONTENT_TYPE_SET.has(contentType)
    ? contentType
    : null;
}

function getContentLengthHeader(value: string | null) {
  if (!value || !/^\d{1,16}$/.test(value.trim())) return null;

  return value.trim();
}

function getSafeRedirectLocation(value: string | null) {
  if (!value || value.length > 2_048 || /[\u0000-\u001F\u007F]/.test(value)) {
    return null;
  }

  return getSafeUrlForMetadata(value) || null;
}

function getChunkBuffer(chunk: unknown) {
  if (typeof chunk === "string") return Buffer.from(chunk);
  if (chunk instanceof Uint8Array) return Buffer.from(chunk);

  return null;
}

function isTlsErrorCode(errorCode: string) {
  return (
    errorCode.startsWith("ERR_TLS") ||
    errorCode.startsWith("ERR_SSL") ||
    errorCode.includes("CERT") ||
    errorCode === "SELF_SIGNED_CERT_IN_CHAIN" ||
    errorCode === "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
  );
}

function waitForResolution<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<{ timedOut: boolean; value: T | null; error: unknown }>((resolve) => {
    const timeout = setTimeout(
      () => resolve({ timedOut: true, value: null, error: null }),
      timeoutMs
    );

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve({ timedOut: false, value, error: null });
      },
      (error: unknown) => {
        clearTimeout(timeout);
        resolve({ timedOut: false, value: null, error });
      }
    );
  });
}

export function createDiscoveryFetchHtmlAdapter(
  dependencies: DiscoveryFetchHtmlAdapterDependencies = {}
) {
  const resolveHostname =
    dependencies.resolveHostname ||
    ((hostname: string) => dnsLookup(hostname, { all: true, verbatim: true }));
  const request = dependencies.request || httpsRequest;
  const now = dependencies.now || (() => new Date());

  return async function executeDiscoveryFetchHtml(
    value: DiscoveryFetchHtmlPlan
  ): Promise<DiscoveryFetchHtmlResult> {
    const fetchStartedAt = now();
    const rawPlan = isRecord(value) ? (value as DiscoveryFetchHtmlPlan) : null;
    const rawUrlSafety = rawPlan
      ? validateDiscoveryUrlSafety(rawPlan.normalizedUrl)
      : null;
    const validated = validateFetchPlan(value);
    const metadata = createMetadata({
      plan: rawPlan,
      urlSafety: rawUrlSafety?.ok ? rawUrlSafety : null,
      fetchStartedAt,
    });
    const finish = (
      status: DiscoveryFetchHtmlStatus,
      reason: string | null,
      updates: Partial<DiscoveryFetchHtmlMetadata> = {},
      html: string | null = null
    ): DiscoveryFetchHtmlResult => {
      const fetchFinishedAt = now();
      const completedMetadata = {
        ...metadata,
        ...updates,
        fetchFinishedAt: fetchFinishedAt.toISOString(),
        durationMs: Math.max(0, fetchFinishedAt.getTime() - fetchStartedAt.getTime()),
      };

      if (status === "fetch_completed_html_acquired" && html !== null) {
        return { ok: true, status, html, metadata: completedMetadata };
      }

      return {
        ok: false,
        status: status === "fetch_completed_html_acquired"
          ? "fetch_failed_network_error"
          : status,
        reason: reason || "fetch_failed_network_error",
        metadata: completedMetadata,
      };
    };

    if (!validated) {
      return finish("fetch_failed_invalid_plan", "invalid_fetch_plan", {
        errorCode: "INVALID_FETCH_PLAN",
      });
    }

    const dnsTimeoutMs = Math.max(
      1,
      validated.plan.timeoutMs - (now().getTime() - fetchStartedAt.getTime())
    );
    const resolution = await waitForResolution(
      resolveHostname(validated.urlSafety.hostname),
      dnsTimeoutMs
    );

    if (resolution.timedOut) {
      return finish("fetch_failed_timeout", "fetch_timeout", {
        errorCode: "TIMEOUT",
      });
    }

    if (resolution.error || !resolution.value || resolution.value.length === 0) {
      return finish("fetch_failed_dns_resolution", "dns_resolution_failed", {
        dnsResolutionChecked: true,
        errorCode: getSafeErrorCode(resolution.error, "DNS_RESOLUTION_FAILED"),
      });
    }

    const validatedAddresses = resolution.value.map((record) => {
      const address = typeof record?.address === "string" ? record.address : "";

      return { address, family: getDiscoveryIpAddressFamily(address) };
    });

    if (
      validatedAddresses.some(
        (record) =>
          record.family === null || isBlockedDiscoveryIpAddress(record.address)
      )
    ) {
      return finish("fetch_failed_blocked_resolved_ip", "blocked_resolved_ip", {
        dnsResolutionChecked: true,
        errorCode: "BLOCKED_RESOLVED_IP",
      });
    }

    const selectedAddress =
      validatedAddresses.find((record) => record.family === 4) ||
      validatedAddresses.find((record) => record.family === 6);

    if (!selectedAddress || selectedAddress.family === null) {
      return finish("fetch_failed_dns_resolution", "dns_resolution_failed", {
        dnsResolutionChecked: true,
        errorCode: "DNS_RESOLUTION_FAILED",
      });
    }

    const selectedAddressFamily = selectedAddress.family;
    const remainingTimeoutMs = Math.max(
      1,
      validated.plan.timeoutMs - (now().getTime() - fetchStartedAt.getTime())
    );
    const parsedUrl = new URL(validated.urlSafety.normalizedUrl);

    return new Promise<DiscoveryFetchHtmlResult>((resolve) => {
      let settled = false;
      let requestHandle: ClientRequest | null = null;
      let chunks: Buffer[] = [];
      const requestMetadata: Partial<DiscoveryFetchHtmlMetadata> = {
        resolvedIp: selectedAddress.address,
        resolvedIpFamily: selectedAddressFamily,
        dnsResolutionChecked: true,
        dnsRebindingProtectionApplied: true,
        connectionPinnedToResolvedIp: true,
      };
      const discardChunks = () => {
        chunks = [];
      };
      const settle = (
        status: DiscoveryFetchHtmlStatus,
        reason: string | null,
        updates: Partial<DiscoveryFetchHtmlMetadata> = {},
        html: string | null = null
      ) => {
        if (settled) return;

        settled = true;
        clearTimeout(timeout);

        if (status !== "fetch_completed_html_acquired") discardChunks();

        resolve(finish(status, reason, { ...requestMetadata, ...updates }, html));
      };
      const timeout = setTimeout(() => {
        requestHandle?.destroy();
        settle("fetch_failed_timeout", "fetch_timeout", { errorCode: "TIMEOUT" });
      }, remainingTimeoutMs);

      try {
        requestHandle = request(
          {
            protocol: "https:",
            hostname: validated.urlSafety.hostname,
            port: parsedUrl.port || undefined,
            path: `${parsedUrl.pathname}${parsedUrl.search}`,
            method: "GET",
            headers: {
              host: parsedUrl.host,
              "user-agent": validated.plan.userAgent,
              accept: DISCOVERY_HTML_FETCH_ACCEPTED_CONTENT_TYPES.join(", "),
            },
            servername: validated.urlSafety.hostname,
            lookup: (_hostname, options, callback) => {
              if (
                options &&
                typeof options === "object" &&
                "all" in options &&
                options.all === true
              ) {
                callback(null, [
                  {
                    address: selectedAddress.address,
                    family: selectedAddressFamily,
                  },
                ]);
                return;
              }

              callback(null, selectedAddress.address, selectedAddressFamily);
            },
            agent: false,
            rejectUnauthorized: true,
          },
          (response) => {
            const httpStatus =
              typeof response.statusCode === "number" ? response.statusCode : null;
            const contentLengthHeader = getContentLengthHeader(
              getHeaderValue(response.headers, "content-length")
            );

            if (httpStatus !== null && httpStatus >= 300 && httpStatus < 400) {
              response.destroy();
              settle("fetch_redirect_not_followed", "redirect_not_followed", {
                httpStatus,
                contentLengthHeader,
                redirectLocation: getSafeRedirectLocation(
                  getHeaderValue(response.headers, "location")
                ),
                errorCode: "REDIRECT_NOT_FOLLOWED",
              });
              return;
            }

            const contentType = getContentType(
              getHeaderValue(response.headers, "content-type")
            );

            if (!contentType) {
              response.destroy();
              settle(
                "fetch_failed_unsupported_content_type",
                "unsupported_content_type",
                {
                  httpStatus,
                  contentLengthHeader,
                  errorCode: "UNSUPPORTED_CONTENT_TYPE",
                }
              );
              return;
            }

            if (
              contentLengthHeader &&
              Number(contentLengthHeader) > validated.plan.responseSizeLimitBytes
            ) {
              response.destroy();
              settle("fetch_failed_response_too_large", "response_too_large", {
                httpStatus,
                contentType,
                contentLengthHeader,
                responseTruncated: true,
                errorCode: "RESPONSE_TOO_LARGE",
              });
              return;
            }

            let bytesRead = 0;
            response.on("data", (chunk: unknown) => {
              if (settled) return;

              const buffer = getChunkBuffer(chunk);

              if (!buffer) {
                response.destroy();
                settle("fetch_failed_network_error", "invalid_response_chunk", {
                  httpStatus,
                  contentType,
                  contentLengthHeader,
                  bytesRead,
                  errorCode: "INVALID_RESPONSE_CHUNK",
                });
                return;
              }

              bytesRead += buffer.byteLength;

              if (bytesRead > validated.plan.responseSizeLimitBytes) {
                response.destroy();
                settle("fetch_failed_response_too_large", "response_too_large", {
                  httpStatus,
                  contentType,
                  contentLengthHeader,
                  bytesRead,
                  responseTruncated: true,
                  errorCode: "RESPONSE_TOO_LARGE",
                });
                return;
              }

              chunks.push(buffer);
            });
            response.once("error", (error) => {
              const errorCode = getSafeErrorCode(error, "NETWORK_ERROR");
              settle(
                isTlsErrorCode(errorCode)
                  ? "fetch_failed_tls_error"
                  : "fetch_failed_network_error",
                "response_error",
                {
                  httpStatus,
                  contentType,
                  contentLengthHeader,
                  bytesRead,
                  errorCode,
                }
              );
            });
            response.once("end", () => {
              if (bytesRead === 0) {
                settle("fetch_failed_empty_body", "empty_body", {
                  httpStatus,
                  contentType,
                  contentLengthHeader,
                  errorCode: "EMPTY_BODY",
                });
                return;
              }

              const html = Buffer.concat(chunks, bytesRead).toString("utf8");
              discardChunks();
              settle("fetch_completed_html_acquired", null, {
                httpStatus,
                contentType,
                contentLengthHeader,
                bytesRead,
              }, html);
            });
          }
        );
        requestHandle.once("error", (error) => {
          const errorCode = getSafeErrorCode(error, "NETWORK_ERROR");
          settle(
            isTlsErrorCode(errorCode)
              ? "fetch_failed_tls_error"
              : "fetch_failed_network_error",
            "request_error",
            { errorCode }
          );
        });
        requestHandle.end();
      } catch (error) {
        const errorCode = getSafeErrorCode(error, "NETWORK_ERROR");
        settle(
          isTlsErrorCode(errorCode)
            ? "fetch_failed_tls_error"
            : "fetch_failed_network_error",
          "request_error",
          { errorCode }
        );
      }
    });
  };
}
