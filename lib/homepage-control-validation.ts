import type {
  HomepageControlConfigRow,
  HomepageControlStatus,
} from "./homepage-control-types";
import { isHomepageControlStatus } from "./homepage-control-types";
import {
  isHomepageToolPlacementId,
  validateHomepageToolPlacementConfig,
  type HomepageToolPlacementConfig,
  type HomepageToolPlacementMaxItems,
} from "./homepage-control-schema";

export type HomepageControlValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

export type HomepageToolPlacementNormalizationResult = {
  placements: HomepageToolPlacementConfig[];
  errors: string[];
  warnings: string[];
};

type HomepageToolPlacementNormalizationOptions = {
  invalidIssueLevel: "error" | "warning";
  nonArrayMessage: string;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function normalizeHomepageToolPlacementConfigs(
  rawPlacements: unknown,
  options: HomepageToolPlacementNormalizationOptions
): HomepageToolPlacementNormalizationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const placements: HomepageToolPlacementConfig[] = [];

  function addIssue(message: string) {
    if (options.invalidIssueLevel === "error") {
      errors.push(message);
      return;
    }

    warnings.push(message);
  }

  if (rawPlacements === null || rawPlacements === undefined) {
    return { placements, errors, warnings };
  }

  if (!Array.isArray(rawPlacements)) {
    addIssue(options.nonArrayMessage);
    return { placements, errors, warnings };
  }

  rawPlacements.forEach((item, index) => {
    if (!isRecord(item)) {
      addIssue(`Tool placement at index ${index} is not an object.`);
      return;
    }

    if (
      typeof item.placementId !== "string" ||
      !isHomepageToolPlacementId(item.placementId) ||
      typeof item.enabled !== "boolean" ||
      typeof item.title !== "string" ||
      !Array.isArray(item.toolSlugs) ||
      !item.toolSlugs.every((slug) => typeof slug === "string") ||
      typeof item.maxItems !== "number"
    ) {
      addIssue(`Tool placement at index ${index} has an invalid shape.`);
      return;
    }

    const candidate: HomepageToolPlacementConfig = {
      placementId: item.placementId,
      enabled: item.enabled,
      title: item.title,
      toolSlugs: item.toolSlugs,
      maxItems: item.maxItems as HomepageToolPlacementMaxItems,
    };
    const placementErrors = validateHomepageToolPlacementConfig(candidate);

    if (placementErrors.length > 0) {
      addIssue(
        `Tool placement at index ${index} is invalid: ${placementErrors.join(
          ", "
        )}`
      );
      return;
    }

    placements.push(candidate);
  });

  return { placements, errors, warnings };
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
