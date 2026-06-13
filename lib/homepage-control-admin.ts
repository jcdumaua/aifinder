"use server";

import { createDefaultHomepageControlDraftValues } from "./homepage-control-defaults";
import { parseHomepageControlConfigRow } from "./homepage-control-parser";
import type { HomepageControlConfigRow } from "./homepage-control-types";
import { validateHomepageControlConfigRow } from "./homepage-control-validation";
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

function normalizeActor(actor: HomepageControlActor) {
  const label = actor.label.trim();
  const id = actor.id?.trim() || null;

  return { id, label };
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
