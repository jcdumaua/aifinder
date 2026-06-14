"use server";

import { createDefaultHomepageControlDraftValues } from "./homepage-control-defaults";
import { parseHomepageControlConfigRow } from "./homepage-control-parser";
import {
  isHomepageDensityPreset,
  isHomepageLayoutPreset,
} from "./homepage-control-schema";
import type { HomepageControlConfigRow } from "./homepage-control-types";
import {
  isRecord,
  validateHomepageControlConfigRow,
} from "./homepage-control-validation";
import { supabaseAdmin } from "./supabase-admin";

export type HomepageControlActor = {
  id: string | null;
  label: string;
};

export type CreateHomepageControlDraftResult = {
  draft: HomepageControlConfigRow | null;
  errors: string[];
  warnings: string[];
};

export type ListHomepageControlConfigsResult = {
  configs: HomepageControlConfigRow[];
  errors: string[];
  warnings: string[];
};

export type GetHomepageControlConfigResult = {
  config: HomepageControlConfigRow | null;
  errors: string[];
  warnings: string[];
};

export type UpdateHomepageControlDraftResult = {
  draft: HomepageControlConfigRow | null;
  errors: string[];
  warnings: string[];
};

export type RecordHomepageControlPreviewResult = {
  success: boolean;
  errors: string[];
  warnings: string[];
};

export type PublishHomepageControlConfigData = {
  success: boolean;
  config_id: string;
  status: string;
  published_at: string;
};

export type PublishHomepageControlConfigResult = {
  success: boolean;
  data: PublishHomepageControlConfigData | null;
  errors: string[];
  warnings: string[];
};

export type HomepagePreviewTool = {
  requestedId: string;
  name: string;
  category: string;
  description: string;
  website: string;
  pricing: string;
  isMissing: boolean;
};

export type HomepagePreviewToolPlacement = {
  placementId: string;
  title: string;
  tools: HomepagePreviewTool[];
  unsupportedReferences: string[];
};

export type HydrateHomepagePreviewToolPlacementsResult = {
  placements: HomepagePreviewToolPlacement[];
  errors: string[];
  warnings: string[];
};

type ParsedHomepageControlDraftUpdate = {
  layoutPreset: string;
  densityPreset: string;
  heroTitle: string;
  heroSubtitle: string;
  checklist: {
    id: string;
    completed: boolean;
  }[];
};

const HOMEPAGE_CONTROL_CONFIG_SELECT =
  "id, status, version, is_active, config, content, tool_placements, pre_publish_checklist, validation_errors, validation_warnings, created_by, updated_by, published_by, published_at, created_at, updated_at";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeActor(actor: HomepageControlActor) {
  const label = actor.label.trim();
  const id = actor.id?.trim() || null;

  return { id, label };
}

function isValidHomepageControlConfigId(id: string) {
  return UUID_PATTERN.test(id);
}

function containsRawHtml(value: string) {
  return /<[^>]+>/.test(value);
}

function containsScriptLikeContent(value: string) {
  return /script|javascript:|onerror\s*=|onload\s*=/i.test(value);
}

function parseDraftUpdatePayload(payload: unknown): {
  data: ParsedHomepageControlDraftUpdate | null;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(payload)) {
    return {
      data: null,
      errors: ["Homepage Control Room draft update payload must be an object."],
      warnings,
    };
  }

  const layoutPreset =
    typeof payload.layoutPreset === "string" ? payload.layoutPreset : "";
  const densityPreset =
    typeof payload.densityPreset === "string" ? payload.densityPreset : "";
  const heroTitle =
    typeof payload.heroTitle === "string" ? payload.heroTitle.trim() : "";
  const heroSubtitle =
    typeof payload.heroSubtitle === "string" ? payload.heroSubtitle.trim() : "";
  const checklistValue = payload.checklist;

  if (!isHomepageLayoutPreset(layoutPreset)) {
    errors.push("Layout preset is not allowed.");
  }

  if (!isHomepageDensityPreset(densityPreset)) {
    errors.push("Density preset is not allowed.");
  }

  if (typeof payload.heroTitle !== "string") {
    errors.push("Hero title must be text.");
  }

  if (typeof payload.heroSubtitle !== "string") {
    errors.push("Hero subtitle must be text.");
  }

  if (heroTitle.length > 90) {
    errors.push("Hero title must be 90 characters or fewer.");
  }

  if (heroSubtitle.length > 220) {
    errors.push("Hero subtitle must be 220 characters or fewer.");
  }

  if (containsRawHtml(heroTitle) || containsRawHtml(heroSubtitle)) {
    errors.push("Hero text cannot include raw HTML.");
  }

  if (
    containsScriptLikeContent(heroTitle) ||
    containsScriptLikeContent(heroSubtitle)
  ) {
    errors.push("Hero text cannot include script-like content.");
  }

  if (!heroTitle) {
    warnings.push("Hero title is empty.");
  } else if (heroTitle.length < 8) {
    warnings.push("Hero title is short; confirm it is clear enough.");
  }

  if (!heroSubtitle) {
    warnings.push("Hero subtitle is empty.");
  } else if (heroSubtitle.length < 20) {
    warnings.push("Hero subtitle is short; confirm it explains the homepage.");
  }

  if (!Array.isArray(checklistValue)) {
    errors.push("Checklist must be an array.");
  }

  const checklist = Array.isArray(checklistValue)
    ? checklistValue
        .map((item) => {
          if (
            isRecord(item) &&
            typeof item.id === "string" &&
            typeof item.completed === "boolean"
          ) {
            return {
              id: item.id,
              completed: item.completed,
            };
          }

          errors.push("Checklist items must include id and completed fields.");
          return null;
        })
        .filter((item): item is { id: string; completed: boolean } =>
          Boolean(item)
        )
    : [];

  if (errors.length > 0) {
    return {
      data: null,
      errors,
      warnings,
    };
  }

  return {
    data: {
      layoutPreset,
      densityPreset,
      heroTitle,
      heroSubtitle,
      checklist,
    },
    errors,
    warnings,
  };
}

function mergeDraftUpdate(
  current: HomepageControlConfigRow,
  update: ParsedHomepageControlDraftUpdate,
  warnings: string[]
): Pick<
  HomepageControlConfigRow,
  | "config"
  | "content"
  | "pre_publish_checklist"
  | "validation_errors"
  | "validation_warnings"
> {
  const currentHero = isRecord(current.content.hero) ? current.content.hero : {};
  const requestedChecklist = new Map(
    update.checklist.map((item) => [item.id, item.completed])
  );
  const currentChecklistIds = new Set(
    current.pre_publish_checklist.map((item) => item.id)
  );

  update.checklist.forEach((item) => {
    if (!currentChecklistIds.has(item.id)) {
      warnings.push(`Unknown checklist item ignored: ${item.id}`);
    }
  });

  return {
    config: {
      ...current.config,
      layoutPreset: update.layoutPreset,
      densityPreset: update.densityPreset,
    },
    content: {
      ...current.content,
      hero: {
        ...currentHero,
        title: update.heroTitle,
        subtitle: update.heroSubtitle,
      },
    },
    pre_publish_checklist: current.pre_publish_checklist.map((item) => ({
      ...item,
      completed: requestedChecklist.get(item.id) ?? item.completed,
    })),
    validation_errors: [],
    validation_warnings: warnings,
  };
}

function getStringValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getNumericToolIds(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === "number" && Number.isInteger(item) && item > 0) {
        return item;
      }

      if (typeof item === "string") {
        const parsed = Number(item);

        if (Number.isInteger(parsed) && parsed > 0) {
          return parsed;
        }
      }

      return null;
    })
    .filter((item): item is number => item !== null);
}

function getUnsupportedToolReferences(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => typeof item === "string" && item.trim().length > 0)
    .map((item) => String(item));
}

function buildDraftValidationRow(
  actorId: string | null
): HomepageControlConfigRow {
  const draftValues = createDefaultHomepageControlDraftValues();
  const timestamp = new Date().toISOString();

  return {
    id: "pending-homepage-control-draft",
    ...draftValues,
    created_by: actorId,
    updated_by: actorId,
    published_by: null,
    published_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

async function cleanupUnauditedDraft(draftId: string) {
  const { error } = await supabaseAdmin
    .from("homepage_control_configs")
    .delete()
    .eq("id", draftId);

  return error?.message ?? null;
}

export async function createHomepageControlDraft(
  actor: HomepageControlActor
): Promise<CreateHomepageControlDraftResult> {
  try {
    const normalizedActor = normalizeActor(actor);

    if (!normalizedActor.label) {
      return {
        draft: null,
        errors: ["Homepage Control Room actor label is required."],
        warnings: [],
      };
    }

    const validationRow = buildDraftValidationRow(normalizedActor.id);
    const validationResult = validateHomepageControlConfigRow(validationRow);

    if (!validationResult.isValid) {
      return {
        draft: null,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      };
    }

    const draftValues = createDefaultHomepageControlDraftValues();
    const { data: insertedDraft, error: draftInsertError } = await supabaseAdmin
      .from("homepage_control_configs")
      .insert({
        ...draftValues,
        created_by: normalizedActor.id,
        updated_by: normalizedActor.id,
        published_by: null,
        published_at: null,
      })
      .select()
      .single();

    if (draftInsertError) {
      return {
        draft: null,
        errors: [
          `Failed to create Homepage Control Room draft: ${draftInsertError.message}`,
        ],
        warnings: validationResult.warnings,
      };
    }

    const parsedDraft = parseHomepageControlConfigRow(insertedDraft);

    if (!parsedDraft.success || !parsedDraft.row) {
      return {
        draft: null,
        errors: parsedDraft.errors,
        warnings: [...validationResult.warnings, ...parsedDraft.warnings],
      };
    }

    const { error: auditInsertError } = await supabaseAdmin
      .from("homepage_control_audit_events")
      .insert({
        config_id: parsedDraft.row.id,
        action: "created-draft",
        actor_id: normalizedActor.id,
        actor_label: normalizedActor.label,
        message: "Homepage Control Room draft created.",
        metadata: {
          source: "homepage-control-admin",
          version: parsedDraft.row.version,
        },
      });

    if (auditInsertError) {
      const cleanupError = await cleanupUnauditedDraft(parsedDraft.row.id);
      const warnings = [...validationResult.warnings, ...parsedDraft.warnings];

      if (cleanupError) {
        warnings.push(
          `Failed to clean up unaudited Homepage Control Room draft: ${cleanupError}`
        );
      }

      return {
        draft: null,
        errors: [
          `Failed to create Homepage Control Room audit event: ${auditInsertError.message}`,
        ],
        warnings,
      };
    }

    return {
      draft: parsedDraft.row,
      errors: [],
      warnings: [...validationResult.warnings, ...parsedDraft.warnings],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error.";

    return {
      draft: null,
      errors: [`Unexpected Homepage Control Room draft error: ${message}`],
      warnings: [],
    };
  }
}

export async function listHomepageControlConfigs(): Promise<ListHomepageControlConfigsResult> {
  try {
    const { data, error } = await supabaseAdmin
      .from("homepage_control_configs")
      .select(HOMEPAGE_CONTROL_CONFIG_SELECT)
      .order("updated_at", { ascending: false })
      .limit(25);

    if (error) {
      return {
        configs: [],
        errors: [
          `Failed to list Homepage Control Room configs: ${error.message}`,
        ],
        warnings: [],
      };
    }

    const configs: HomepageControlConfigRow[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const item of data || []) {
      const parsed = parseHomepageControlConfigRow(item);

      if (parsed.row) {
        configs.push(parsed.row);
      }

      errors.push(...parsed.errors);
      warnings.push(...parsed.warnings);
    }

    return {
      configs,
      errors,
      warnings,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error.";

    return {
      configs: [],
      errors: [`Unexpected Homepage Control Room list error: ${message}`],
      warnings: [],
    };
  }
}

export async function getHomepageControlConfigById(
  id: string
): Promise<GetHomepageControlConfigResult> {
  try {
    if (!isValidHomepageControlConfigId(id)) {
      return {
        config: null,
        errors: ["Invalid Homepage Control Room config ID."],
        warnings: [],
      };
    }

    const { data, error } = await supabaseAdmin
      .from("homepage_control_configs")
      .select(HOMEPAGE_CONTROL_CONFIG_SELECT)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return {
        config: null,
        errors: [
          `Failed to fetch Homepage Control Room config: ${error.message}`,
        ],
        warnings: [],
      };
    }

    if (!data) {
      return {
        config: null,
        errors: ["Homepage Control Room config not found."],
        warnings: [],
      };
    }

    const parsed = parseHomepageControlConfigRow(data);

    if (!parsed.success || !parsed.row) {
      return {
        config: null,
        errors: parsed.errors,
        warnings: parsed.warnings,
      };
    }

    return {
      config: parsed.row,
      errors: [],
      warnings: parsed.warnings,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error.";

    return {
      config: null,
      errors: [
        `Unexpected Homepage Control Room config fetch error: ${message}`,
      ],
      warnings: [],
    };
  }
}

export async function recordHomepageControlPreview(
  id: string,
  actor: HomepageControlActor,
  version?: number
): Promise<RecordHomepageControlPreviewResult> {
  try {
    if (!isValidHomepageControlConfigId(id)) {
      return {
        success: false,
        errors: ["Invalid Homepage Control Room config ID."],
        warnings: [],
      };
    }

    const normalizedActor = normalizeActor(actor);

    if (!normalizedActor.label) {
      return {
        success: false,
        errors: ["Homepage Control Room actor label is required."],
        warnings: [],
      };
    }

    const metadata: Record<string, unknown> = {
      source: "homepage-control-preview",
      previewedAt: new Date().toISOString(),
    };

    if (typeof version === "number" && Number.isFinite(version)) {
      metadata.version = version;
    }

    const { error } = await supabaseAdmin
      .from("homepage_control_audit_events")
      .insert({
        config_id: id,
        action: "previewed",
        actor_id: normalizedActor.id,
        actor_label: normalizedActor.label,
        message: "Homepage Control Room config previewed.",
        metadata,
      });

    if (error) {
      console.error(
        "Homepage Control Room preview audit insert failed:",
        error.message
      );

      return {
        success: false,
        errors: ["Failed to record Homepage Control Room preview audit event."],
        warnings: [],
      };
    }

    return {
      success: true,
      errors: [],
      warnings: [],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error.";

    console.error(
      "Unexpected Homepage Control Room preview audit error:",
      message
    );

    return {
      success: false,
      errors: ["Unexpected Homepage Control Room preview audit error."],
      warnings: [],
    };
  }
}

export async function publishHomepageControlConfig(
  id: string,
  actor: HomepageControlActor
): Promise<PublishHomepageControlConfigResult> {
  try {
    if (!isValidHomepageControlConfigId(id)) {
      return {
        success: false,
        data: null,
        errors: ["Invalid Homepage Control Room config ID."],
        warnings: [],
      };
    }

    const normalizedActor = normalizeActor(actor);

    if (!normalizedActor.label) {
      return {
        success: false,
        data: null,
        errors: ["Homepage Control Room actor label is required."],
        warnings: [],
      };
    }

    const { data, error } = await supabaseAdmin.rpc(
      "publish_homepage_control_config",
      {
        p_config_id: id,
        p_actor_id: normalizedActor.id,
        p_actor_label: normalizedActor.label,
      }
    );

    if (error) {
      console.error("Homepage Control Room publish RPC failed:", error.message);

      return {
        success: false,
        data: null,
        errors: ["Failed to publish Homepage Control Room config."],
        warnings: [],
      };
    }

    if (!isRecord(data)) {
      return {
        success: false,
        data: null,
        errors: ["Homepage Control Room publish returned an invalid response."],
        warnings: [],
      };
    }

    const publishedConfigId =
      typeof data.config_id === "string" ? data.config_id : "";
    const publishedStatus = typeof data.status === "string" ? data.status : "";
    const publishedAt =
      typeof data.published_at === "string" ? data.published_at : "";

    if (data.success !== true || !publishedConfigId || !publishedStatus) {
      return {
        success: false,
        data: null,
        errors: ["Homepage Control Room publish returned an incomplete response."],
        warnings: [],
      };
    }

    return {
      success: true,
      data: {
        success: true,
        config_id: publishedConfigId,
        status: publishedStatus,
        published_at: publishedAt,
      },
      errors: [],
      warnings: [],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error.";

    console.error("Unexpected Homepage Control Room publish error:", message);

    return {
      success: false,
      data: null,
      errors: ["Unexpected Homepage Control Room publish error."],
      warnings: [],
    };
  }
}

export async function updateHomepageControlDraft(
  id: string,
  payload: unknown,
  actor: HomepageControlActor
): Promise<UpdateHomepageControlDraftResult> {
  try {
    if (!isValidHomepageControlConfigId(id)) {
      return {
        draft: null,
        errors: ["Invalid Homepage Control Room draft ID."],
        warnings: [],
      };
    }

    const normalizedActor = normalizeActor(actor);

    if (!normalizedActor.label) {
      return {
        draft: null,
        errors: ["Homepage Control Room actor label is required."],
        warnings: [],
      };
    }

    const payloadResult = parseDraftUpdatePayload(payload);

    if (!payloadResult.data) {
      return {
        draft: null,
        errors: payloadResult.errors,
        warnings: payloadResult.warnings,
      };
    }

    const currentResult = await getHomepageControlConfigById(id);

    if (!currentResult.config) {
      return {
        draft: null,
        errors: currentResult.errors,
        warnings: currentResult.warnings,
      };
    }

    const current = currentResult.config;

    if (current.status !== "draft") {
      return {
        draft: null,
        errors: ["Only draft Homepage Control Room configs can be edited."],
        warnings: currentResult.warnings,
      };
    }

    const validationWarnings = [
      ...currentResult.warnings,
      ...payloadResult.warnings,
    ];
    const mergedValues = mergeDraftUpdate(
      current,
      payloadResult.data,
      validationWarnings
    );
    const updatedAt = new Date().toISOString();
    const validationRow: HomepageControlConfigRow = {
      ...current,
      ...mergedValues,
      updated_by: normalizedActor.id,
      updated_at: updatedAt,
    };
    const validationResult = validateHomepageControlConfigRow(validationRow);

    if (!validationResult.isValid) {
      return {
        draft: null,
        errors: validationResult.errors,
        warnings: [
          ...validationWarnings,
          ...validationResult.warnings,
        ],
      };
    }

    const safeUpdate = {
      ...mergedValues,
      validation_warnings: [
        ...validationWarnings,
        ...validationResult.warnings,
      ],
      updated_by: normalizedActor.id,
      updated_at: updatedAt,
    };

    const { data: updatedDraft, error: updateError } = await supabaseAdmin
      .from("homepage_control_configs")
      .update(safeUpdate)
      .eq("id", id)
      .eq("status", "draft")
      .select(HOMEPAGE_CONTROL_CONFIG_SELECT)
      .maybeSingle();

    if (updateError) {
      return {
        draft: null,
        errors: [
          `Failed to update Homepage Control Room draft: ${updateError.message}`,
        ],
        warnings: validationWarnings,
      };
    }

    if (!updatedDraft) {
      return {
        draft: null,
        errors: ["Draft was not found or is no longer editable."],
        warnings: validationWarnings,
      };
    }

    const parsedDraft = parseHomepageControlConfigRow(updatedDraft);

    if (!parsedDraft.success || !parsedDraft.row) {
      return {
        draft: null,
        errors: parsedDraft.errors,
        warnings: [...validationWarnings, ...parsedDraft.warnings],
      };
    }

    const { error: auditInsertError } = await supabaseAdmin
      .from("homepage_control_audit_events")
      .insert({
        config_id: parsedDraft.row.id,
        action: "updated-draft",
        actor_id: normalizedActor.id,
        actor_label: normalizedActor.label,
        message: "Homepage Control Room draft updated.",
        metadata: {
          source: "homepage-control-admin",
          version: parsedDraft.row.version,
          fields: [
            "config.layoutPreset",
            "config.densityPreset",
            "content.hero.title",
            "content.hero.subtitle",
            "pre_publish_checklist.completed",
          ],
        },
      });

    if (auditInsertError) {
      const { error: rollbackError } = await supabaseAdmin
        .from("homepage_control_configs")
        .update({
          config: current.config,
          content: current.content,
          pre_publish_checklist: current.pre_publish_checklist,
          validation_errors: current.validation_errors,
          validation_warnings: current.validation_warnings,
          updated_by: current.updated_by,
          updated_at: current.updated_at,
        })
        .eq("id", current.id)
        .eq("status", "draft");
      const warnings = [...validationWarnings, ...parsedDraft.warnings];

      if (rollbackError) {
        warnings.push(
          `Failed to roll back unaudited Homepage Control Room draft update: ${rollbackError.message}`
        );
      }

      return {
        draft: null,
        errors: [
          `Failed to create Homepage Control Room audit event: ${auditInsertError.message}`,
        ],
        warnings,
      };
    }

    return {
      draft: parsedDraft.row,
      errors: [],
      warnings: [...validationWarnings, ...parsedDraft.warnings],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error.";

    return {
      draft: null,
      errors: [`Unexpected Homepage Control Room update error: ${message}`],
      warnings: [],
    };
  }
}

export async function hydrateHomepagePreviewToolPlacements(
  config: HomepageControlConfigRow
): Promise<HydrateHomepagePreviewToolPlacementsResult> {
  try {
    const placementRecords = config.tool_placements
      .map((placement, index) => {
        if (!isRecord(placement)) {
          return {
            placementId: `placement-${index + 1}`,
            title: `Placement ${index + 1}`,
            toolIds: [],
            unsupportedReferences: [],
          };
        }

        const toolIds = [
          ...getNumericToolIds(placement.toolIds),
          ...getNumericToolIds(placement.tool_ids),
          ...getNumericToolIds(placement.toolId ? [placement.toolId] : []),
          ...getNumericToolIds(placement.tool_id ? [placement.tool_id] : []),
        ];
        const unsupportedReferences = [
          ...getUnsupportedToolReferences(placement.toolSlugs),
          ...getUnsupportedToolReferences(placement.tool_slugs),
        ];

        return {
          placementId: getStringValue(
            placement.placementId ?? placement.placement_id,
            `placement-${index + 1}`
          ),
          title: getStringValue(placement.title, `Placement ${index + 1}`),
          toolIds,
          unsupportedReferences,
        };
      });
    const uniqueToolIds = Array.from(
      new Set(placementRecords.flatMap((placement) => placement.toolIds))
    );

    if (uniqueToolIds.length === 0) {
      return {
        placements: placementRecords.map((placement) => ({
          placementId: placement.placementId,
          title: placement.title,
          tools: [],
          unsupportedReferences: placement.unsupportedReferences,
        })),
        errors: [],
        warnings:
          placementRecords.length > 0
            ? [
                "Tool placement references were not hydrated because no numeric tool IDs were found.",
              ]
            : [],
      };
    }

    const { data, error } = await supabaseAdmin
      .from("tools")
      .select("id, name, category, description, website, pricing")
      .in("id", uniqueToolIds);

    if (error) {
      return {
        placements: [],
        errors: [`Failed to hydrate homepage preview tools: ${error.message}`],
        warnings: [],
      };
    }

    const toolMap = new Map<number, HomepagePreviewTool>();

    (data || []).forEach((tool) => {
      if (typeof tool.id !== "number") return;

      toolMap.set(tool.id, {
        requestedId: String(tool.id),
        name: getStringValue(tool.name, "Untitled tool"),
        category: getStringValue(tool.category, "AI Tool"),
        description: getStringValue(tool.description, "No description yet."),
        website: getStringValue(tool.website, "#"),
        pricing: getStringValue(tool.pricing, "Unknown"),
        isMissing: false,
      });
    });

    return {
      placements: placementRecords.map((placement) => ({
        placementId: placement.placementId,
        title: placement.title,
        unsupportedReferences: placement.unsupportedReferences,
        tools: placement.toolIds.map(
          (toolId) =>
            toolMap.get(toolId) || {
              requestedId: String(toolId),
              name: "Missing tool",
              category: "Unavailable",
              description:
                "This referenced tool was not found in the live tools table.",
              website: "#",
              pricing: "Unknown",
              isMissing: true,
            }
        ),
      })),
      errors: [],
      warnings: [],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error.";

    return {
      placements: [],
      errors: [`Unexpected homepage preview hydration error: ${message}`],
      warnings: [],
    };
  }
}
