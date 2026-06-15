import "server-only";

import { parseHomepageControlConfigRow } from "./homepage-control-parser";
import { supabaseAdmin } from "./supabase-admin";
import type { HomepageControlConfigRow } from "./homepage-control-types";
import { isRecord } from "./homepage-control-validation";
import {
  validateHomepageToolPlacementConfig,
  type HomepageToolPlacementConfig,
} from "./homepage-control-schema";

export type HomepageControlPublicFetchResult = {
  success: boolean;
  config: HomepageControlConfigRow | null;
  errors: string[];
  warnings: string[];
};

function normalizePublicToolPlacements(
  rawPlacements: unknown,
  warnings: string[]
): HomepageToolPlacementConfig[] {
  if (rawPlacements === null || rawPlacements === undefined) {
    return [];
  }

  if (!Array.isArray(rawPlacements)) {
    warnings.push("Published homepage tool_placements must be an array.");
    return [];
  }

  const normalized: HomepageToolPlacementConfig[] = [];

  rawPlacements.forEach((item, index) => {
    if (!isRecord(item)) {
      warnings.push(`Tool placement at index ${index} is not an object.`);
      return;
    }

    if (
      typeof item.placementId !== "string" ||
      typeof item.enabled !== "boolean" ||
      typeof item.title !== "string" ||
      !Array.isArray(item.toolSlugs) ||
      typeof item.maxItems !== "number"
    ) {
      warnings.push(`Tool placement at index ${index} has an invalid shape.`);
      return;
    }

    const candidate: HomepageToolPlacementConfig = {
      placementId:
        item.placementId as HomepageToolPlacementConfig["placementId"],
      enabled: item.enabled,
      title: item.title,
      toolSlugs: item.toolSlugs,
      maxItems: item.maxItems as HomepageToolPlacementConfig["maxItems"],
    };
    const errors = validateHomepageToolPlacementConfig(candidate);

    if (errors.length > 0) {
      warnings.push(
        `Tool placement at index ${index} is invalid: ${errors.join(", ")}`
      );
      return;
    }

    normalized.push(candidate);
  });

  return normalized;
}

function normalizePublicHomepageControlPayload(value: unknown): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value;
  }

  const record = value as Record<string, unknown>;
  const updatedAt =
    typeof record.updated_at === "string" ? record.updated_at : "";

  return {
    id: record.id,
    status: "published",
    version: record.version,
    is_active: true,
    config: record.config,
    content: record.content,
    tool_placements: record.tool_placements,
    pre_publish_checklist: [],
    validation_errors: [],
    validation_warnings: [],
    created_by: null,
    updated_by: null,
    published_by: null,
    published_at: record.published_at ?? null,
    created_at: updatedAt,
    updated_at: updatedAt,
  };
}

export async function fetchPublishedHomepageControlConfig(): Promise<
  HomepageControlPublicFetchResult
> {
  try {
    const { data, error } = await supabaseAdmin
      .from("homepage_control_configs")
      .select(
        "id, version, config, content, tool_placements, published_at, updated_at"
      )
      .eq("status", "published")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        config: null,
        errors: ["Failed to fetch active published Homepage Control Room config."],
        warnings: [],
      };
    }

    if (!data) {
      return {
        success: true,
        config: null,
        errors: [],
        warnings: ["No active published Homepage Control Room config found."],
      };
    }

    const publicPayload = normalizePublicHomepageControlPayload(data);
    const placementWarnings: string[] = [];
    const normalizedPlacements = normalizePublicToolPlacements(
      isRecord(publicPayload) ? publicPayload.tool_placements : undefined,
      placementWarnings
    );
    const parsed = parseHomepageControlConfigRow(
      isRecord(publicPayload)
        ? {
            ...publicPayload,
            tool_placements: normalizedPlacements,
          }
        : publicPayload
    );

    if (!parsed.success || !parsed.row) {
      return {
        success: false,
        config: null,
        errors: parsed.errors,
        warnings: [...parsed.warnings, ...placementWarnings],
      };
    }

    const fetchWarnings = [...parsed.warnings, ...placementWarnings];

    return {
      success: true,
      config: {
        ...parsed.row,
        tool_placements: normalizedPlacements,
      },
      errors: [],
      warnings: fetchWarnings,
    };
  } catch {
    return {
      success: false,
      config: null,
      errors: ["Unexpected error fetching active published Homepage Control Room config."],
      warnings: [],
    };
  }
}
