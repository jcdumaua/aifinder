import { NextResponse } from "next/server";
import { verifyAdminSession } from "../../../../../../../lib/admin-auth";
import {
  getCandidateExtractionPreviewForRun,
  type CandidateExtractionPreviewInput,
  type CandidateExtractionPreviewResult,
} from "../../../../../../../lib/discovery/discovery-candidate-preview-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminSession = ReturnType<typeof verifyAdminSession>;
type AdminSessionActor = NonNullable<AdminSession["actor"]>;

export type CandidatePreviewRouteContext = {
  params: Promise<{
    id?: string;
  }>;
};

export type CandidatePreviewRouteDependencies = {
  verifySession?: (request: Request) => AdminSession;
  getCandidatePreview?: (
    input: CandidateExtractionPreviewInput,
  ) =>
    | CandidateExtractionPreviewResult
    | Promise<CandidateExtractionPreviewResult>;
};

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getServerDerivedAdminActorId(actor: AdminSessionActor): string | null {
  const actorId = typeof actor.id === "string" ? actor.id.trim() : "";

  if (actorId) return actorId;

  const actorLabel = typeof actor.label === "string" ? actor.label.trim() : "";

  return actorLabel || null;
}

function getProviderResultHttpStatus(
  result: CandidateExtractionPreviewResult,
): number {
  if (!result.rejected) return 200;

  if (result.rejectionCode === "missing_admin_actor") {
    return 403;
  }

  if (
    result.rejectionCode === "missing_discovery_run_id" ||
    result.rejectionCode === "missing_discovery_source_id"
  ) {
    return 400;
  }

  return 200;
}

export function createCandidatePreviewRouteHandler(
  dependencies: CandidatePreviewRouteDependencies = {},
) {
  return async function candidatePreviewRouteHandler(
    request: Request,
    context: CandidatePreviewRouteContext,
  ) {
    const verifySession = dependencies.verifySession ?? verifyAdminSession;
    const getCandidatePreview =
      dependencies.getCandidatePreview ?? getCandidateExtractionPreviewForRun;

    const adminSession = verifySession(request);

    if (!adminSession.isAdmin || !adminSession.actor) {
      console.warn("Unauthorized candidate preview request.", {
        errors: adminSession.errors,
      });

      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const requestingAdminActorId = getServerDerivedAdminActorId(
      adminSession.actor,
    );

    if (!requestingAdminActorId) {
      return jsonResponse(
        {
          error: "Authenticated admin identity is unavailable.",
          code: "missing_admin_identity",
        },
        403,
      );
    }

    try {
      const params = await context.params;
      const discoveryRunId = typeof params?.id === "string" ? params.id : "";
      const { searchParams } = new URL(request.url);
      const discoverySourceId = searchParams.get("source_id") ?? "";

      const result = await getCandidatePreview({
        discoveryRunId,
        discoverySourceId,
        requestingAdminActorId,
      });

      return jsonResponse(
        { data: result },
        getProviderResultHttpStatus(result),
      );
    } catch {
      return jsonResponse({ error: "Candidate preview request failed." }, 500);
    }
  };
}

export const GET = createCandidatePreviewRouteHandler();
