import { createCandidateStagingQueueReadHandler } from "./handler";

export type {
  CandidateStagingQueueApiReadErrorResponse,
  CandidateStagingQueueApiReadResponse,
} from "./handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Route: GET /api/admin/discovery/candidate-staging-queue

export const GET = createCandidateStagingQueueReadHandler();
