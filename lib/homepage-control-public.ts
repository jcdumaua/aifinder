import "server-only";

import { parseHomepageControlConfigRow } from "./homepage-control-parser";
import { supabaseAdmin } from "./supabase-admin";
import type { HomepageControlConfigRow } from "./homepage-control-types";
import {
  isRecord,
  normalizeHomepageToolPlacementConfigs,
} from "./homepage-control-validation";
import type { HomepageToolPlacementConfig } from "./homepage-control-schema";
import {
  normalizePublicToolRow,
  toPublicToolCardData,
  type PublicToolRow,
} from "./public-tool-adapter";
import {
  getIcon,
  getLogoUrl,
  getReviewCount,
  getToolRating,
  toolSlug,
} from "../app/data/tools";
import type { PublicToolCardData } from "@/components/public/tool-card";

export type PublicHomepageControlConfig = Omit<
  HomepageControlConfigRow,
  "tool_placements"
> & {
  tool_placements: HomepageToolPlacementConfig[];
};

export type HydratedHomepageToolPlacement = HomepageToolPlacementConfig & {
  tools: PublicToolCardData[];
  missingToolSlugs: string[];
};

export type HomepageControlPublicFetchResult = {
  success: boolean;
  config: PublicHomepageControlConfig | null;
  hydratedPlacements: HydratedHomepageToolPlacement[];
  errors: string[];
  warnings: string[];
};

async function hydratePublicToolPlacements(
  placements: HomepageToolPlacementConfig[],
  warnings: string[]
): Promise<HydratedHomepageToolPlacement[]> {
  const enabledPlacements = placements.filter((placement) => placement.enabled);
  const allSlugs = new Set<string>();

  enabledPlacements.forEach((placement) => {
    placement.toolSlugs.forEach((slug) => allSlugs.add(slug));
  });

  if (allSlugs.size === 0) {
    return [];
  }

  const { data: rawTools, error } = await supabaseAdmin
    .from("tools")
    .select(
      "id, name, slug, description, website, category, pricing, featured, logo_url, platforms, best_for, use_cases, ios, android, created_at, updated_at"
    )
    .eq("status", "approved")
    .in("slug", Array.from(allSlugs));

  if (error) {
    warnings.push(`Hydration failed: ${error.message}`);
    return [];
  }

  const toolMap = new Map<string, PublicToolCardData>();
  const approvedTools: PublicToolRow[] = rawTools ?? [];

  approvedTools.forEach((rawTool) => {
    const tool = normalizePublicToolRow(rawTool);
    const publicData = toPublicToolCardData(tool, {
      slugFallback: toolSlug,
      logoFallback: getLogoUrl,
      ratingFallback: getToolRating,
      reviewCountFallback: getReviewCount,
      fallbackIcon: getIcon,
    });
    toolMap.set(publicData.slug, publicData);
  });

  const hydrated: HydratedHomepageToolPlacement[] = [];

  enabledPlacements.forEach((placement) => {
    const hydratedTools: PublicToolCardData[] = [];
    const missingToolSlugs: string[] = [];

    placement.toolSlugs.forEach((slug) => {
      const tool = toolMap.get(slug);

      if (tool) {
        hydratedTools.push(tool);
        return;
      }

      missingToolSlugs.push(slug);
      warnings.push(
        `Tool with slug "${slug}" was not found or approved for placement "${placement.placementId}".`
      );
    });

    hydrated.push({
      ...placement,
      tools: hydratedTools,
      missingToolSlugs,
    });
  });

  return hydrated;
}

function normalizePublicToolPlacements(
  rawPlacements: unknown,
  warnings: string[]
): HomepageToolPlacementConfig[] {
  const result = normalizeHomepageToolPlacementConfigs(rawPlacements, {
    invalidIssueLevel: "warning",
    nonArrayMessage: "Published homepage tool_placements must be an array.",
  });

  warnings.push(...result.warnings, ...result.errors);

  return result.placements;
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
        hydratedPlacements: [],
        errors: ["Failed to fetch active published Homepage Control Room config."],
        warnings: [],
      };
    }

    if (!data) {
      return {
        success: true,
        config: null,
        hydratedPlacements: [],
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
        hydratedPlacements: [],
        errors: parsed.errors,
        warnings: [...parsed.warnings, ...placementWarnings],
      };
    }

    const fetchWarnings = [...parsed.warnings, ...placementWarnings];

    // Phase 2O-C2: Hydrate tool placements
    const hydratedPlacements = await hydratePublicToolPlacements(
      normalizedPlacements,
      fetchWarnings
    );

    return {
      success: true,
      config: {
        ...parsed.row,
        tool_placements: normalizedPlacements,
      },
      hydratedPlacements,
      errors: [],
      warnings: fetchWarnings,
    };
  } catch {
    return {
      success: false,
      config: null,
      hydratedPlacements: [],
      errors: ["Unexpected error fetching active published Homepage Control Room config."],
      warnings: [],
    };
  }
}
