export type OfficialClientObservation = Readonly<{runId: string; projectRef: string; origin: string}>;
export const OFFICIAL_ISOLATION_MODE: "NEW_EMPTY_TEST_ONLY_PROJECT_V1";
export const OFFICIAL_PROVIDER_RETENTION: "RETAIN_RUN_OWNED_VERCEL_PREVIEW_AND_ENVIRONMENT_V1";
export const OFFICIAL_PREVIEW_ENVIRONMENT_KEYS: readonly string[];
export const OFFICIAL_ISOLATION_KEYS: readonly string[];
export class OfficialIsolationError extends Error { readonly code: string; }
export function canonicalOfficialOrigin(value: unknown): string;
export function requireOfficialLifetime(authorization: unknown, nowEpochMs: number): number;
export function validateOfficialIsolationAuthorization(authorization: unknown, nowEpochMs: number): Readonly<Record<string, unknown>>;
export function validateOfficialProvisioningReceipt(authorization: unknown, receipt: unknown, nowEpochMs: number): Readonly<Record<string, unknown>>;
export function observeOfficialClientOrigin(input: {runId: unknown; projectRef: unknown; actualClientOrigin: unknown}): OfficialClientObservation;
export function validateOfficialIsolationBinding(input: {authorization: unknown; localObservation: unknown; previewObservation: unknown; provisioningReceipt: unknown; nowEpochMs: number}): Readonly<{status: "EXACT_ISOLATED_BINDING"; runId: string; projectRef: string; origin: string}>;
