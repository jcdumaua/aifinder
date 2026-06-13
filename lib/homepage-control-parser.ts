import type {
  HomepageControlChecklistItem,
  HomepageControlConfigRow,
} from "./homepage-control-types";
import { isHomepageControlStatus } from "./homepage-control-types";
import {
  isArray,
  isRecord,
  validateHomepageControlConfigRow,
} from "./homepage-control-validation";

export type HomepageControlParseResult = {
  success: boolean;
  row: HomepageControlConfigRow | null;
  errors: string[];
  warnings: string[];
};

function getStringOrNull(
  record: Record<string, unknown>,
  key: string,
  errors: string[]
) {
  const value = record[key];

  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  errors.push(`Homepage control payload field ${key} must be a string.`);
  return null;
}

function getNullableString(
  record: Record<string, unknown>,
  key: string,
  errors: string[]
) {
  const value = record[key];

  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  errors.push(`Homepage control payload field ${key} must be a string or null.`);
  return null;
}

function getNumber(
  record: Record<string, unknown>,
  key: string,
  errors: string[]
) {
  const value = record[key];

  if (typeof value === "number") {
    return value;
  }

  errors.push(`Homepage control payload field ${key} must be a number.`);
  return null;
}

function getBoolean(
  record: Record<string, unknown>,
  key: string,
  errors: string[]
) {
  const value = record[key];

  if (typeof value === "boolean") {
    return value;
  }

  errors.push(`Homepage control payload field ${key} must be a boolean.`);
  return null;
}

function isChecklistItem(value: unknown): value is HomepageControlChecklistItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    (value.description === undefined ||
      typeof value.description === "string") &&
    typeof value.required === "boolean" &&
    typeof value.completed === "boolean"
  );
}

function isStringArray(value: unknown): value is string[] {
  return isArray(value) && value.every((item) => typeof item === "string");
}

export function parseHomepageControlConfigRow(
  value: unknown
): HomepageControlParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(value)) {
    return {
      success: false,
      row: null,
      errors: ["Homepage control payload must be an object."],
      warnings,
    };
  }

  const id = getStringOrNull(value, "id", errors);
  const statusValue = getStringOrNull(value, "status", errors);
  const version = getNumber(value, "version", errors);
  const isActive = getBoolean(value, "is_active", errors);
  const createdAt = getStringOrNull(value, "created_at", errors);
  const updatedAt = getStringOrNull(value, "updated_at", errors);
  const createdBy = getNullableString(value, "created_by", errors);
  const updatedBy = getNullableString(value, "updated_by", errors);
  const publishedBy = getNullableString(value, "published_by", errors);
  const publishedAt = getNullableString(value, "published_at", errors);
  const config = value.config;
  const content = value.content;
  const toolPlacements = value.tool_placements;
  const prePublishChecklist = value.pre_publish_checklist;
  const validationErrors = value.validation_errors;
  const validationWarnings = value.validation_warnings;

  if (statusValue && !isHomepageControlStatus(statusValue)) {
    errors.push("Homepage control payload field status is not allowed.");
  }

  if (!isRecord(config)) {
    errors.push("Homepage control payload field config must be an object.");
  }

  if (!isRecord(content)) {
    errors.push("Homepage control payload field content must be an object.");
  }

  if (!isArray(toolPlacements)) {
    errors.push("Homepage control payload field tool_placements must be an array.");
  }

  if (!isArray(prePublishChecklist)) {
    errors.push(
      "Homepage control payload field pre_publish_checklist must be an array."
    );
  } else if (!prePublishChecklist.every(isChecklistItem)) {
    errors.push(
      "Homepage control payload field pre_publish_checklist contains invalid items."
    );
  }

  if (!isStringArray(validationErrors)) {
    errors.push(
      "Homepage control payload field validation_errors must be an array of strings."
    );
  }

  if (!isStringArray(validationWarnings)) {
    errors.push(
      "Homepage control payload field validation_warnings must be an array of strings."
    );
  }

  if (
    !id ||
    !statusValue ||
    !isHomepageControlStatus(statusValue) ||
    version === null ||
    isActive === null ||
    !createdAt ||
    !updatedAt ||
    !isRecord(config) ||
    !isRecord(content) ||
    !isArray(toolPlacements) ||
    !isArray(prePublishChecklist) ||
    !prePublishChecklist.every(isChecklistItem) ||
    !isStringArray(validationErrors) ||
    !isStringArray(validationWarnings)
  ) {
    return {
      success: false,
      row: null,
      errors,
      warnings,
    };
  }

  const row: HomepageControlConfigRow = {
    id,
    status: statusValue,
    version,
    is_active: isActive,
    config,
    content,
    tool_placements: toolPlacements,
    pre_publish_checklist: prePublishChecklist,
    validation_errors: validationErrors,
    validation_warnings: validationWarnings,
    created_by: createdBy,
    updated_by: updatedBy,
    published_by: publishedBy,
    published_at: publishedAt,
    created_at: createdAt,
    updated_at: updatedAt,
  };

  const validationResult = validateHomepageControlConfigRow(row);
  const mergedErrors = [...errors, ...validationResult.errors];
  const mergedWarnings = [...warnings, ...validationResult.warnings];

  return {
    success: mergedErrors.length === 0,
    row,
    errors: mergedErrors,
    warnings: mergedWarnings,
  };
}
