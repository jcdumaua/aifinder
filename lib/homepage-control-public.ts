import "server-only";

import { parseHomepageControlConfigRow } from "./homepage-control-parser";
import { supabaseAdmin } from "./supabase-admin";
import type { HomepageControlConfigRow } from "./homepage-control-types";

export type HomepageControlPublicFetchResult = {
  success: boolean;
  config: HomepageControlConfigRow | null;
  errors: string[];
  warnings: string[];
};

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

    const parsed = parseHomepageControlConfigRow(
      normalizePublicHomepageControlPayload(data)
    );

    if (!parsed.success || !parsed.row) {
      return {
        success: false,
        config: null,
        errors: parsed.errors,
        warnings: parsed.warnings,
      };
    }

    return {
      success: true,
      config: parsed.row,
      errors: [],
      warnings: parsed.warnings,
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
