export const HOMEPAGE_CONTROL_STATUSES = [
  "draft",
  "preview",
  "published",
  "archived",
] as const;

export type HomepageControlStatus =
  (typeof HOMEPAGE_CONTROL_STATUSES)[number];

export const HOMEPAGE_CONTROL_AUDIT_ACTIONS = [
  "created-draft",
  "updated-draft",
  "previewed",
  "published",
  "reverted",
  "validation-failed",
] as const;

export type HomepageControlAuditAction =
  (typeof HOMEPAGE_CONTROL_AUDIT_ACTIONS)[number];

export type HomepageControlChecklistItem = {
  id: string;
  label: string;
  description?: string;
  required: boolean;
  completed: boolean;
};

export type HomepageControlConfigRow = {
  id: string;
  status: HomepageControlStatus;
  version: number;
  is_active: boolean;
  config: Record<string, unknown>;
  content: Record<string, unknown>;
  tool_placements: unknown[];
  pre_publish_checklist: HomepageControlChecklistItem[];
  validation_errors: string[];
  validation_warnings: string[];
  created_by: string | null;
  updated_by: string | null;
  published_by: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export function isHomepageControlStatus(
  value: string
): value is HomepageControlStatus {
  return (HOMEPAGE_CONTROL_STATUSES as readonly string[]).includes(value);
}

export function isHomepageControlAuditAction(
  value: string
): value is HomepageControlAuditAction {
  return (HOMEPAGE_CONTROL_AUDIT_ACTIONS as readonly string[]).includes(value);
}
