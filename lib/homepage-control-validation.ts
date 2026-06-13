import type {
  HomepageControlConfigRow,
  HomepageControlStatus,
} from "./homepage-control-types";
import { isHomepageControlStatus } from "./homepage-control-types";

export type HomepageControlValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function validateHomepageControlConfigRow(
  row: HomepageControlConfigRow
): HomepageControlValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const status: HomepageControlStatus | null = isHomepageControlStatus(
    row.status
  )
    ? row.status
    : null;

  if (!row.id) {
    errors.push("Homepage control config row is missing an id.");
  }

  if (!status) {
    errors.push("Homepage control config row has an invalid status.");
  }

  if (!Number.isFinite(row.version) || row.version <= 0) {
    errors.push("Homepage control config row version must be positive.");
  }

  if (!isRecord(row.config)) {
    errors.push("Homepage control config row config must be an object.");
  }

  if (!isRecord(row.content)) {
    errors.push("Homepage control config row content must be an object.");
  }

  if (!isArray(row.tool_placements)) {
    errors.push("Homepage control config row tool_placements must be an array.");
  }

  if (!isArray(row.pre_publish_checklist)) {
    errors.push(
      "Homepage control config row pre_publish_checklist must be an array."
    );
  }

  if (status === "published" && !row.published_at) {
    warnings.push("Published homepage control config row is missing published_at.");
  }

  if (row.is_active && status !== "published") {
    errors.push("Only published homepage control config rows can be active.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
