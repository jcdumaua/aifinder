import { parseHomepageControlConfigRow } from "./homepage-control-parser";
import { supabase } from "./supabase";
import type { HomepageControlConfigRow } from "./homepage-control-types";

export type HomepageControlPublicFetchResult = {
  config: HomepageControlConfigRow | null;
  errors: string[];
  warnings: string[];
};

function normalizePublicHomepageControlPayload(value: unknown) {
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
  const { data, error } = await supabase
    .from("public_homepage_control_config")
    .select(
      "id, version, config, content, tool_placements, published_at, updated_at"
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    return {
      config: null,
      errors: [
        `Failed to fetch published homepage control config: ${error.message}`,
      ],
      warnings: [],
    };
  }

  if (!data) {
    return {
      config: null,
      errors: [],
      warnings: ["No published homepage control config found."],
    };
  }

  const parsed = parseHomepageControlConfigRow(
    normalizePublicHomepageControlPayload(data)
  );

  if (!parsed.success) {
    return {
      config: null,
      errors: parsed.errors,
      warnings: parsed.warnings,
    };
  }

  return {
    config: parsed.row,
    errors: [],
    warnings: [
      "Public homepage control config was normalized from the limited public view.",
      ...parsed.warnings,
    ],
  };
}
