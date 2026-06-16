"use server";

import { createDefaultHomepageControlDraftValues } from "./homepage-control-defaults";
import { parseHomepageControlConfigRow } from "./homepage-control-parser";
import {
  isHomepageDensityPreset,
  isHomepageLayoutPreset,
} from "./homepage-control-schema";
import type { HomepageControlConfigRow } from "./homepage-control-types";
import type { HomepageControlChecklistRun } from "./homepage-control-types";
import {
  isRecord,
  normalizeHomepageToolPlacementConfigs,
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

export type MarkHomepageControlConfigAsPreviewResult = {
  success: boolean;
  data: HomepageControlConfigRow | null;
  errors: string[];
  warnings: string[];
};

export type GetHomepageControlPreviewChecklistResult = {
  run: HomepageControlChecklistRun | null;
  checklist: HomepageControlChecklistRun["checklist"];
  errors: string[];
  warnings: string[];
};

export type UpdateHomepageControlPreviewChecklistResult = {
  success: boolean;
  run: HomepageControlChecklistRun | null;
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

type ParsedHomepageControlPreviewChecklistUpdate = {
  checklist: {
    id: string;
    completed: boolean;
  }[];
};

type HomepageToolPlacementPublishValidationResult = {
  errors: string[];
  warnings: string[];
};

const HOMEPAGE_CONTROL_CONFIG_SELECT =
  "id, status, version, is_active, config, content, tool_placements, pre_publish_checklist, validation_errors, validation_warnings, created_by, updated_by, published_by, published_at, created_at, updated_at";

const HOMEPAGE_CONTROL_CHECKLIST_RUN_SELECT =
  "id, config_id, checklist, completed_by, completed_at, created_at, updated_at";

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

function formatSlugList(slugs: string[]) {
  return Array.from(new Set(slugs)).sort().join(", ");
}

function isMissingColumnError(errorMessage: string, columnName: string) {
  const lowerMessage = errorMessage.toLowerCase();
  const lowerColumnName = columnName.toLowerCase();

  return (
    lowerMessage.includes(`column tools.${lowerColumnName} does not exist`) ||
    lowerMessage.includes(`could not find the '${lowerColumnName}' column`) ||
    lowerMessage.includes(`could not find the column '${lowerColumnName}'`)
  );
}

async function validateHomepageToolPlacementsForPublish(
  config: HomepageControlConfigRow
): Promise<HomepageToolPlacementPublishValidationResult> {
  const normalizedResult = normalizeHomepageToolPlacementConfigs(
    config.tool_placements,
    {
      invalidIssueLevel: "error",
      nonArrayMessage:
        "Homepage Control Room tool placements must be an array before publish.",
    }
  );
  const errors = [...normalizedResult.errors];
  const warnings = [...normalizedResult.warnings];

  if (errors.length > 0) {
    return { errors, warnings };
  }

  const enabledPlacements = normalizedResult.placements.filter(
    (placement) => placement.enabled
  );
  const placementSlugs = enabledPlacements.flatMap(
    (placement) => placement.toolSlugs
  );
  const uniqueSlugs = Array.from(new Set(placementSlugs));

  if (uniqueSlugs.length === 0) {
    return { errors, warnings };
  }

  const { data: publicSafeRows, error: publicSafeError } = await supabaseAdmin
    .from("public_safe_tools")
    .select("slug")
    .in("slug", uniqueSlugs);

  if (publicSafeError) {
    if (isMissingColumnError(publicSafeError.message, "slug")) {
      errors.push(
        "Cannot publish homepage tool placements because the public-safe tools view does not expose a slug column for validation."
      );
    } else {
      errors.push("Unable to validate homepage tool placements against public-safe tools.");
    }

    return { errors, warnings };
  }

  const publicSafeSlugs = new Set(
    (publicSafeRows ?? [])
      .map((row) => row.slug)
      .filter((slug): slug is string => typeof slug === "string")
  );
  const unsafeSlugs = uniqueSlugs.filter((slug) => !publicSafeSlugs.has(slug));

  if (unsafeSlugs.length > 0) {
    errors.push(
      `Homepage tool placements reference missing, deleted, unapproved, or non-public-safe tool slugs: ${formatSlugList(
        unsafeSlugs
      )}.`
    );
  }

  return { errors, warnings };
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

function isHomepageControlChecklistRunItem(
  value: unknown
): value is HomepageControlChecklistRun["checklist"][number] {
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

function parseHomepageControlChecklistRunRow(
  value: unknown
): {
  run: HomepageControlChecklistRun | null;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(value)) {
    return {
      run: null,
      errors: ["Homepage Control Room checklist run payload must be an object."],
      warnings,
    };
  }

  const id = typeof value.id === "string" ? value.id : "";
  const configId = typeof value.config_id === "string" ? value.config_id : "";
  const checklist = Array.isArray(value.checklist) ? value.checklist : [];
  const completedBy =
    value.completed_by === null || value.completed_by === undefined
      ? null
      : typeof value.completed_by === "string"
        ? value.completed_by
        : "";
  const completedAt =
    value.completed_at === null || value.completed_at === undefined
      ? null
      : typeof value.completed_at === "string"
        ? value.completed_at
        : "";
  const createdAt = typeof value.created_at === "string" ? value.created_at : "";
  const updatedAt = typeof value.updated_at === "string" ? value.updated_at : "";

  if (!id) errors.push("Homepage Control Room checklist run is missing an id.");
  if (!configId) {
    errors.push("Homepage Control Room checklist run is missing config_id.");
  }
  if (!Array.isArray(value.checklist)) {
    errors.push("Homepage Control Room checklist run checklist must be an array.");
  } else if (!checklist.every(isHomepageControlChecklistRunItem)) {
    errors.push(
      "Homepage Control Room checklist run contains invalid checklist items."
    );
  }
  if (completedBy === "") {
    errors.push(
      "Homepage Control Room checklist run completed_by must be text or null."
    );
  }
  if (completedAt === "") {
    errors.push(
      "Homepage Control Room checklist run completed_at must be text or null."
    );
  }
  if (!createdAt) {
    errors.push("Homepage Control Room checklist run is missing created_at.");
  }
  if (!updatedAt) {
    errors.push("Homepage Control Room checklist run is missing updated_at.");
  }

  if (errors.length > 0) {
    return { run: null, errors, warnings };
  }

  return {
    run: {
      id,
      config_id: configId,
      checklist: checklist as HomepageControlChecklistRun["checklist"],
      completed_by: completedBy,
      completed_at: completedAt,
      created_at: createdAt,
      updated_at: updatedAt,
    },
    errors,
    warnings,
  };
}

function parsePreviewChecklistUpdatePayload(payload: unknown): {
  data: ParsedHomepageControlPreviewChecklistUpdate | null;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isRecord(payload)) {
    return {
      data: null,
      errors: ["Preview checklist update payload must be an object."],
      warnings,
    };
  }

  if (!Array.isArray(payload.checklist)) {
    return {
      data: null,
      errors: ["Preview checklist must be an array."],
      warnings,
    };
  }

  const checklist = payload.checklist
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

      errors.push("Preview checklist items must include id and completed fields.");
      return null;
    })
    .filter((item): item is { id: string; completed: boolean } =>
      Boolean(item)
    );

  if (errors.length > 0) {
    return {
      data: null,
      errors,
      warnings,
    };
  }

  return {
    data: { checklist },
    errors,
    warnings,
  };
}

function mergePreviewChecklistUpdate(
  currentChecklist: HomepageControlChecklistRun["checklist"],
  update: ParsedHomepageControlPreviewChecklistUpdate,
  warnings: string[]
) {
  const requestedChecklist = new Map(
    update.checklist.map((item) => [item.id, item.completed])
  );
  const currentChecklistIds = new Set(currentChecklist.map((item) => item.id));

  update.checklist.forEach((item) => {
    if (!currentChecklistIds.has(item.id)) {
      warnings.push(`Unknown preview checklist item ignored: ${item.id}`);
    }
  });

  return currentChecklist.map((item) => ({
    ...item,
    completed: requestedChecklist.get(item.id) ?? item.completed,
  }));
}

function areRequiredChecklistItemsComplete(
  checklist: HomepageControlChecklistRun["checklist"]
) {
  const requiredItems = checklist.filter((item) => item.required);

  return requiredItems.length > 0 && requiredItems.every((item) => item.completed);
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

export async function getHomepageControlPreviewChecklist(
  id: string
): Promise<GetHomepageControlPreviewChecklistResult> {
  try {
    const configResult = await getHomepageControlConfigById(id);

    if (!configResult.config) {
      return {
        run: null,
        checklist: [],
        errors: configResult.errors,
        warnings: configResult.warnings,
      };
    }

    const { data, error } = await supabaseAdmin
      .from("homepage_control_checklist_runs")
      .select(HOMEPAGE_CONTROL_CHECKLIST_RUN_SELECT)
      .eq("config_id", configResult.config.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        run: null,
        checklist: configResult.config.pre_publish_checklist,
        errors: [
          `Failed to fetch Homepage Control Room preview checklist: ${error.message}`,
        ],
        warnings: configResult.warnings,
      };
    }

    if (!data) {
      return {
        run: null,
        checklist: configResult.config.pre_publish_checklist,
        errors: [],
        warnings: configResult.warnings,
      };
    }

    const parsedRun = parseHomepageControlChecklistRunRow(data);

    if (!parsedRun.run) {
      return {
        run: null,
        checklist: configResult.config.pre_publish_checklist,
        errors: parsedRun.errors,
        warnings: [...configResult.warnings, ...parsedRun.warnings],
      };
    }

    return {
      run: parsedRun.run,
      checklist: parsedRun.run.checklist,
      errors: [],
      warnings: [...configResult.warnings, ...parsedRun.warnings],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error.";

    return {
      run: null,
      checklist: [],
      errors: [
        `Unexpected Homepage Control Room preview checklist fetch error: ${message}`,
      ],
      warnings: [],
    };
  }
}

export async function updateHomepageControlPreviewChecklist(
  id: string,
  payload: unknown,
  actor: HomepageControlActor
): Promise<UpdateHomepageControlPreviewChecklistResult> {
  try {
    if (!isValidHomepageControlConfigId(id)) {
      return {
        success: false,
        run: null,
        errors: ["Invalid Homepage Control Room config ID."],
        warnings: [],
      };
    }

    const normalizedActor = normalizeActor(actor);

    if (!normalizedActor.label) {
      return {
        success: false,
        run: null,
        errors: ["Homepage Control Room actor label is required."],
        warnings: [],
      };
    }

    const payloadResult = parsePreviewChecklistUpdatePayload(payload);

    if (!payloadResult.data) {
      return {
        success: false,
        run: null,
        errors: payloadResult.errors,
        warnings: payloadResult.warnings,
      };
    }

    const configResult = await getHomepageControlConfigById(id);

    if (!configResult.config) {
      return {
        success: false,
        run: null,
        errors: configResult.errors,
        warnings: configResult.warnings,
      };
    }

    if (configResult.config.status !== "preview") {
      return {
        success: false,
        run: null,
        errors: [
          "Preview checklist can only be updated while the config is in preview.",
        ],
        warnings: configResult.warnings,
      };
    }

    const currentChecklistResult = await getHomepageControlPreviewChecklist(id);
    const warnings = [
      ...configResult.warnings,
      ...currentChecklistResult.warnings,
      ...payloadResult.warnings,
    ];

    if (currentChecklistResult.errors.length > 0) {
      return {
        success: false,
        run: null,
        errors: currentChecklistResult.errors,
        warnings,
      };
    }

    const mergedChecklist = mergePreviewChecklistUpdate(
      currentChecklistResult.checklist,
      payloadResult.data,
      warnings
    );
    const isComplete = areRequiredChecklistItemsComplete(mergedChecklist);
    const timestamp = new Date().toISOString();
    const { data: updatedRun, error: upsertError } = await supabaseAdmin
      .from("homepage_control_checklist_runs")
      .upsert(
        {
          config_id: configResult.config.id,
          checklist: mergedChecklist,
          completed_by: isComplete ? normalizedActor.id : null,
          completed_at: isComplete ? timestamp : null,
          updated_at: timestamp,
        },
        { onConflict: "config_id" }
      )
      .select(HOMEPAGE_CONTROL_CHECKLIST_RUN_SELECT)
      .single();

    if (upsertError) {
      return {
        success: false,
        run: null,
        errors: [
          `Failed to update Homepage Control Room preview checklist: ${upsertError.message}`,
        ],
        warnings,
      };
    }

    const parsedRun = parseHomepageControlChecklistRunRow(updatedRun);

    if (!parsedRun.run) {
      return {
        success: false,
        run: null,
        errors: parsedRun.errors,
        warnings: [...warnings, ...parsedRun.warnings],
      };
    }

    const { error: auditInsertError } = await supabaseAdmin
      .from("homepage_control_audit_events")
      .insert({
        config_id: configResult.config.id,
        action: "updated-preview-checklist",
        actor_id: normalizedActor.id,
        actor_label: normalizedActor.label,
        message: "Homepage Control Room preview checklist updated.",
        metadata: {
          source: "homepage-control-preview-checklist",
          version: configResult.config.version,
          checklistRunId: parsedRun.run.id,
          completedAt: parsedRun.run.completed_at,
        },
      });

    if (auditInsertError) {
      return {
        success: false,
        run: null,
        errors: [
          `Failed to create Homepage Control Room preview checklist audit event: ${auditInsertError.message}`,
        ],
        warnings: [...warnings, ...parsedRun.warnings],
      };
    }

    return {
      success: true,
      run: parsedRun.run,
      errors: [],
      warnings: [...warnings, ...parsedRun.warnings],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error.";

    return {
      success: false,
      run: null,
      errors: [
        `Unexpected Homepage Control Room preview checklist update error: ${message}`,
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

    const configResult = await getHomepageControlConfigById(id);

    if (!configResult.config) {
      return {
        success: false,
        data: null,
        errors: configResult.errors,
        warnings: configResult.warnings,
      };
    }

    const placementValidation = await validateHomepageToolPlacementsForPublish(
      configResult.config
    );

    if (placementValidation.errors.length > 0) {
      return {
        success: false,
        data: null,
        errors: placementValidation.errors,
        warnings: [
          ...configResult.warnings,
          ...placementValidation.warnings,
          "Publish was blocked before activation. Tool placement validation currently runs immediately before the atomic publish RPC.",
        ],
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
      warnings: [...configResult.warnings, ...placementValidation.warnings],
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

export async function markHomepageControlConfigAsPreview(
  id: string,
  actor: HomepageControlActor
): Promise<MarkHomepageControlConfigAsPreviewResult> {
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

    const currentResult = await getHomepageControlConfigById(id);

    if (!currentResult.config) {
      return {
        success: false,
        data: null,
        errors: currentResult.errors,
        warnings: currentResult.warnings,
      };
    }

    const current = currentResult.config;

    if (current.status !== "draft") {
      return {
        success: false,
        data: null,
        errors: ["Only draft Homepage Control Room configs can move to preview."],
        warnings: currentResult.warnings,
      };
    }

    const validationResult = validateHomepageControlConfigRow(current);
    const errors = [...currentResult.errors, ...validationResult.errors];
    const warnings = [...currentResult.warnings, ...validationResult.warnings];

    if (current.validation_errors.length > 0) {
      errors.push(...current.validation_errors);
    }

    const hero = isRecord(current.content.hero) ? current.content.hero : {};
    const heroTitle = typeof hero.title === "string" ? hero.title.trim() : "";

    if (!heroTitle) {
      errors.push("Hero title is required before moving to preview.");
    }

    const hydratedPlacements = await hydrateHomepagePreviewToolPlacements(current);
    warnings.push(...hydratedPlacements.warnings);

    if (hydratedPlacements.errors.length > 0) {
      errors.push(...hydratedPlacements.errors);
    }

    const missingToolReferences = hydratedPlacements.placements.flatMap(
      (placement) => [
        ...placement.unsupportedReferences,
        ...placement.tools
          .filter((tool) => tool.isMissing)
          .map((tool) => tool.requestedId),
      ]
    );

    if (missingToolReferences.length > 0) {
      errors.push(
        `Tool placements reference missing or unsupported tools: ${Array.from(
          new Set(missingToolReferences)
        ).join(", ")}.`
      );
    }

    if (errors.length > 0 || !validationResult.isValid) {
      return {
        success: false,
        data: null,
        errors,
        warnings,
      };
    }

    const updatedAt = new Date().toISOString();
    const { data: updatedConfig, error: updateError } = await supabaseAdmin
      .from("homepage_control_configs")
      .update({
        status: "preview",
        updated_by: normalizedActor.id,
        updated_at: updatedAt,
      })
      .eq("id", current.id)
      .eq("status", "draft")
      .select(HOMEPAGE_CONTROL_CONFIG_SELECT)
      .maybeSingle();

    if (updateError) {
      return {
        success: false,
        data: null,
        errors: [
          `Failed to move Homepage Control Room config to preview: ${updateError.message}`,
        ],
        warnings,
      };
    }

    if (!updatedConfig) {
      return {
        success: false,
        data: null,
        errors: ["Config was not found or is no longer a draft."],
        warnings,
      };
    }

    const parsedConfig = parseHomepageControlConfigRow(updatedConfig);

    if (!parsedConfig.success || !parsedConfig.row) {
      const rollbackWarnings = [...warnings, ...parsedConfig.warnings];
      const { error: rollbackError } = await supabaseAdmin
        .from("homepage_control_configs")
        .update({
          status: current.status,
          updated_by: current.updated_by,
          updated_at: current.updated_at,
        })
        .eq("id", current.id)
        .eq("status", "preview");

      if (rollbackError) {
        rollbackWarnings.push(
          `Failed to roll back invalid Homepage Control Room preview transition: ${rollbackError.message}`
        );
      }

      return {
        success: false,
        data: null,
        errors: parsedConfig.errors,
        warnings: rollbackWarnings,
      };
    }

    const { error: auditInsertError } = await supabaseAdmin
      .from("homepage_control_audit_events")
      .insert({
        config_id: parsedConfig.row.id,
        action: "transitioned-to-preview",
        actor_id: normalizedActor.id,
        actor_label: normalizedActor.label,
        message: "Homepage Control Room config moved to preview.",
        metadata: {
          source: "homepage-control-admin",
          version: parsedConfig.row.version,
          previousStatus: "draft",
          nextStatus: "preview",
        },
      });

    if (auditInsertError) {
      const rollbackWarnings = [...warnings, ...parsedConfig.warnings];
      const { error: rollbackError } = await supabaseAdmin
        .from("homepage_control_configs")
        .update({
          status: current.status,
          updated_by: current.updated_by,
          updated_at: current.updated_at,
        })
        .eq("id", current.id)
        .eq("status", "preview");

      if (rollbackError) {
        rollbackWarnings.push(
          `Failed to roll back unaudited Homepage Control Room preview transition: ${rollbackError.message}`
        );
      }

      return {
        success: false,
        data: null,
        errors: [
          `Failed to create Homepage Control Room audit event: ${auditInsertError.message}`,
        ],
        warnings: rollbackWarnings,
      };
    }

    return {
      success: true,
      data: parsedConfig.row,
      errors: [],
      warnings: [...warnings, ...parsedConfig.warnings],
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error.";

    return {
      success: false,
      data: null,
      errors: [`Unexpected Homepage Control Room preview transition error: ${message}`],
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
