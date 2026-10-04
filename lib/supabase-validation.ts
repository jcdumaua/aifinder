import "server-only";

import { observeOfficialClientOrigin } from "../scripts/launch-operations-kernel/admin-v1-official-isolation.mjs";

export async function observeValidationClient() {
  const runId = process.env.AIFINDER_VALIDATION_RUN_ID;
  const projectRef = process.env.AIFINDER_VALIDATION_PROJECT_REF;
  // Do not construct a client on ordinary deployments without validation markers.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(runId ?? "") ||
      !projectRef || projectRef.length > 256 || !/^[a-z0-9-]+$/.test(projectRef) ||
      projectRef === "mtpisopvdxuvmpzbzqjw") return null;
  try {
    const { supabaseConstructionObservation } = await import("./supabase");
    if (supabaseConstructionObservation.runId !== runId ||
        supabaseConstructionObservation.projectRef !== projectRef) return null;
    return observeOfficialClientOrigin({
      runId: supabaseConstructionObservation.runId,
      projectRef: supabaseConstructionObservation.projectRef,
      actualClientOrigin: supabaseConstructionObservation.origin,
    });
  } catch {
    return null;
  }
}
