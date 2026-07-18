import { createCandidatePreviewRouteHandler } from "./handler";

export type {
  CandidatePreviewRouteContext,
  CandidatePreviewRouteDependencies,
} from "./handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = createCandidatePreviewRouteHandler();
