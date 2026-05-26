export const DISCOVERED_TOOL_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "duplicate",
  "needs_review",
] as const;

export type DiscoveredToolStatus = (typeof DISCOVERED_TOOL_STATUSES)[number];

export interface DiscoveredTool {
  id: string;
  name: string;
  website: string;
  source: string;
  category?: string | null;
  description?: string | null;
  status: DiscoveredToolStatus;
  discoveredAt: string;
  reviewedAt?: string | null;
  duplicateOfToolId?: number | null;
  confidenceScore?: number | null;
  notes?: string | null;
}

export const discoveredToolStatusLabels: Record<DiscoveredToolStatus, string> =
  {
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    duplicate: "Duplicate",
    needs_review: "Needs Review",
  };

export const placeholderDiscoveredTools: DiscoveredTool[] = [
  {
    id: "discovered-placeholder-1",
    name: "Draft Research Assistant",
    website: "https://example.com/research-assistant",
    source: "Discovery Engine Placeholder",
    category: "Productivity",
    description:
      "Placeholder record for a future discovered AI tool candidate.",
    status: "pending",
    discoveredAt: "2026-05-26T09:00:00.000Z",
    confidenceScore: 0.82,
    notes: "Queued for future admin review flow.",
  },
  {
    id: "discovered-placeholder-2",
    name: "Visual Prompt Studio",
    website: "https://example.com/visual-prompt-studio",
    source: "Discovery Engine Placeholder",
    category: "Design AI",
    description:
      "Sample duplicate-state candidate for table layout preparation.",
    status: "duplicate",
    discoveredAt: "2026-05-26T09:15:00.000Z",
    duplicateOfToolId: 42,
    confidenceScore: 0.74,
    notes: "Future crawler should map this to an existing live tool.",
  },
  {
    id: "discovered-placeholder-3",
    name: "Ops Agent Console",
    website: "https://example.com/ops-agent-console",
    source: "Discovery Engine Placeholder",
    category: "AI Agents",
    description:
      "Sample needs-review candidate for moderation and quality checks.",
    status: "needs_review",
    discoveredAt: "2026-05-26T09:30:00.000Z",
    confidenceScore: 0.61,
    notes: "Needs human review before any approval workflow is wired.",
  },
];
