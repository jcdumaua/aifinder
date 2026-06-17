"use client";

import Link from "next/link";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "../../lib/supabase";
import { DiscoveryToolDetail } from "./discovery/discovery-tool-detail";
import { DiscoveryQueueTable } from "./discovery/discovery-queue-table";
import { useOverlayScrollLock } from "../../lib/use-overlay-scroll-lock";
import {
  discoveredToolStatusLabels,
  placeholderDiscoveredTools,
  type DiscoveredTool,
} from "../../lib/discovered-tools";
import {
  DEFAULT_HOMEPAGE_CONTENT_CONFIG,
  DEFAULT_HOMEPAGE_CONTROL_CONFIG,
  DEFAULT_HOMEPAGE_TOOL_PLACEMENTS,
  HOMEPAGE_CONTROL_AUDIT_ACTIONS,
  HOMEPAGE_CONTROL_STATUS_TRANSITIONS,
  HOMEPAGE_DENSITY_PRESET_DETAILS,
  HOMEPAGE_DENSITY_PRESETS,
  HOMEPAGE_LAYOUT_PRESET_DETAILS,
  HOMEPAGE_LAYOUT_PRESETS,
  HOMEPAGE_PRE_PUBLISH_CHECKLIST,
  HOMEPAGE_PUBLISH_STATUSES,
  HOMEPAGE_SECTION_IDS,
  validateHomepageContentConfig,
  validateHomepageControlConfig,
  validateHomepageControlReadiness,
  validateHomepageToolPlacementConfig,
} from "../../lib/homepage-control-schema";
import { isToolCategory, TOOL_CATEGORIES } from "../../lib/tool-categories";

type Tool = {
  id?: number;
  name: string;
  category: string;
  description: string;
  website: string;
  pricing?: string | null;
  logo_url?: string | null;
  status?: string | null;
  deleted_at?: string | null;
};

type SubmittedTool = {
  id: number;
  name: string;
  category: string;
  description: string;
  website: string;
  pricing?: string | null;
  logo_url?: string | null;
  submitter_name?: string | null;
  submitter_email?: string | null;
  status: string;
  created_at: string;
};

type AdminStats = {
  totalTools: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
};

type AdminAuditLog = {
  id: number;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  target_name?: string | null;
  details?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
};

type AdminAuditArchive = {
  id: string;
  file_name: string;
  storage_bucket: string;
  storage_path: string;
  log_count: number;
  compressed_size_bytes: number;
  first_log_at?: string | null;
  last_log_at?: string | null;
  created_at: string;
};

type PopupMessage = {
  type: "success" | "error";
  title: string;
  message: string;
};

type ConfirmDialog = {
  title: string;
  message: string;
  confirmLabel: string;
  confirmTone: "green" | "red" | "yellow";
  onConfirm: () => Promise<void> | void;
};

export type AdminView =
  | "dashboard"
  | "tools"
  | "discovery-tools"
  | "discovery-tool-detail"
  | "discovery"
  | "homepage-control"
  | "moderation"
  | "analytics"
  | "notifications"
  | "security"
  | "settings";

type AdminNavItem = {
  label: string;
  href: string;
  view: AdminView;
};

const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", view: "dashboard" },
  { label: "Tools", href: "/admin/tools", view: "tools" },
  { label: "Discovery", href: "/admin/discovery", view: "discovery" },
  {
    label: "Discovery Queue",
    href: "/admin/discovery/tools",
    view: "discovery-tools",
  },
  {
    label: "Homepage Control Room",
    href: "/admin/homepage-control",
    view: "homepage-control",
  },
  { label: "Moderation", href: "/admin/moderation", view: "moderation" },
  { label: "Analytics", href: "/admin/analytics", view: "analytics" },
  { label: "Notifications", href: "/admin/notifications", view: "notifications" },
  { label: "Security", href: "/admin/security", view: "security" },
  { label: "Settings", href: "/admin/settings", view: "settings" },
];

const DEFAULT_HOMEPAGE_CONFIG_ERRORS = validateHomepageControlConfig(
  DEFAULT_HOMEPAGE_CONTROL_CONFIG
);
const DEFAULT_HOMEPAGE_CONFIG_IS_VALID =
  DEFAULT_HOMEPAGE_CONFIG_ERRORS.length === 0;
const DEFAULT_HOMEPAGE_CONTENT_ERRORS = validateHomepageContentConfig(
  DEFAULT_HOMEPAGE_CONTENT_CONFIG
);
const DEFAULT_HOMEPAGE_CONTENT_IS_VALID =
  DEFAULT_HOMEPAGE_CONTENT_ERRORS.length === 0;
const DEFAULT_HOMEPAGE_TOOL_PLACEMENT_ERRORS =
  DEFAULT_HOMEPAGE_TOOL_PLACEMENTS.flatMap((placement) =>
    validateHomepageToolPlacementConfig(placement).map(
      (error) => `${placement.placementId}: ${error}`
    )
  );
const DEFAULT_HOMEPAGE_TOOL_PLACEMENTS_ARE_VALID =
  DEFAULT_HOMEPAGE_TOOL_PLACEMENT_ERRORS.length === 0;
const HOMEPAGE_CONTROL_READINESS = validateHomepageControlReadiness();

const ADMIN_PAGE_COPY: Record<
  AdminView,
  { eyebrow: string; title: string; description: string }
> = {
  dashboard: {
    eyebrow: "Admin Dashboard",
    title: "Mission Control",
    description:
      "A compact overview for search, core metrics, fast actions, recent activity, and priority alerts.",
  },
  tools: {
    eyebrow: "Tools",
    title: "Tool Operations",
    description:
      "Manage live tools, categories, health signals, and add or edit listings from one focused workspace.",
  },
  "discovery-tools": {
    eyebrow: "Discovery Engine",
    title: "Review Queue",
    description:
      "Triage tools found by the discovery engine. Filter candidates before deeper review.",
  },
  "discovery-tool-detail": {
    eyebrow: "Discovery Engine",
    title: "Candidate Review",
    description:
      "Inspect discovered-tool metadata, duplicate candidates, and collected evidence in a safe read-only workspace.",
  },
  discovery: {
    eyebrow: "Discovery",
    title: "Discovery Engine Prep",
    description:
      "Review discovered-tool foundations, duplicate warnings, and future AI recommendation structures.",
  },
  "homepage-control": {
    eyebrow: "Homepage Controls",
    title: "Homepage Control Room",
    description:
      "Create and review draft homepage configs. Draft-only. Does not affect the live homepage.",
  },
  moderation: {
    eyebrow: "Moderation",
    title: "Approval Queue",
    description:
      "Review pending, needs-review, duplicate, and reported tool signals before they enter the live directory.",
  },
  analytics: {
    eyebrow: "Analytics",
    title: "Platform Metrics",
    description:
      "Track key platform totals, submission flow, growth placeholders, and future trending signals.",
  },
  notifications: {
    eyebrow: "Notifications",
    title: "Admin Alerts",
    description:
      "Monitor submission alerts, duplicate alerts, system events, and future discovery-engine notifications.",
  },
  security: {
    eyebrow: "Security",
    title: "Safety Center",
    description:
      "Inspect review safety, session protection, audit logs, and archive readiness.",
  },
  settings: {
    eyebrow: "Settings",
    title: "Admin Settings",
    description:
      "Prepare general, branding, category, AI, and admin preference controls for future configuration.",
  },
};

const PRICING_OPTIONS = ["Free + Paid", "Free", "Paid"];
const SELECT_EMPTY_VALUE = "__empty";

const BLOCKED_FILE_EXTENSIONS = [
  ".exe",
  ".zip",
  ".rar",
  ".7z",
  ".apk",
  ".dmg",
  ".pkg",
  ".msi",
  ".bat",
  ".cmd",
  ".scr",
  ".ps1",
  ".vbs",
  ".jar",
  ".iso",
  ".torrent",
];

const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const adminFormSectionClass =
  "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5";
const adminFormFieldClass =
  "space-y-2";
const adminFormLabelClass =
  "text-sm font-bold text-slate-900";
const adminFormControlClass =
  "h-auto rounded-xl border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 shadow-none placeholder:text-slate-400 focus-visible:border-cyan-500 focus-visible:ring-cyan-500/20";
const adminFormHelpClass =
  "text-xs leading-5 text-slate-500";

type SmartAdminStatus =
  | "Pending"
  | "Needs Review"
  | "Duplicate"
  | "Reported"
  | "Online"
  | "Slow"
  | "Error"
  | "Unknown"
  | "Archived";

type SmartAdminActivity = {
  id: string;
  action: string;
  target: string;
  status: SmartAdminStatus;
  time: string;
};

type SmartAdminNotification = {
  id: string;
  title: string;
  message: string;
  status: SmartAdminStatus;
};

type SmartAdminModerationItem = {
  id: string;
  name: string;
  source: string;
  status: SmartAdminStatus;
  suggestedCategory: string;
};

type ToolHealthStatus = "Online" | "Slow" | "Error" | "Unknown";

type ToolHealthItem = {
  id: string;
  name: string;
  url: string;
  status: ToolHealthStatus;
};

const MOCK_RECENT_ACTIVITY: SmartAdminActivity[] = [
  {
    id: "activity-tool-added",
    action: "Tool added",
    target: "Prompt Studio",
    status: "Online",
    time: "Just now",
  },
  {
    id: "activity-tool-updated",
    action: "Tool updated",
    target: "Research Assistant",
    status: "Needs Review",
    time: "12 min ago",
  },
  {
    id: "activity-tool-reported",
    action: "Tool reported",
    target: "WriterFlow",
    status: "Reported",
    time: "31 min ago",
  },
  {
    id: "activity-tool-rejected",
    action: "Tool rejected",
    target: "Duplicate Agent",
    status: "Duplicate",
    time: "1 hr ago",
  },
];

const MOCK_NOTIFICATIONS: SmartAdminNotification[] = [
  {
    id: "notification-submitted",
    title: "New tool submitted",
    message: "A user submission is ready for review.",
    status: "Pending",
  },
  {
    id: "notification-flagged",
    title: "Tool flagged",
    message: "A listing may need quality review.",
    status: "Reported",
  },
  {
    id: "notification-duplicate",
    title: "Duplicate detected",
    message: "Possible overlap found in the intake queue.",
    status: "Duplicate",
  },
  {
    id: "notification-discovery",
    title: "Discovery engine update",
    message: "Placeholder candidates are ready for future crawling.",
    status: "Needs Review",
  },
];

const MOCK_MODERATION_ITEMS: SmartAdminModerationItem[] = [
  {
    id: "moderation-pending",
    name: "AI Workflow Builder",
    source: "User submission",
    status: "Pending",
    suggestedCategory: "Productivity",
  },
  {
    id: "moderation-review",
    name: "Insight Agent",
    source: "Discovery placeholder",
    status: "Needs Review",
    suggestedCategory: "AI Agents",
  },
  {
    id: "moderation-duplicate",
    name: "Prompt Studio Pro",
    source: "Duplicate detector prep",
    status: "Duplicate",
    suggestedCategory: "Design AI",
  },
  {
    id: "moderation-reported",
    name: "Content Optimizer",
    source: "Report queue prep",
    status: "Reported",
    suggestedCategory: "Marketing AI",
  },
];

const MOCK_TOOL_HEALTH: ToolHealthItem[] = [
  {
    id: "health-online",
    name: "Chat assistant listings",
    url: "aifinder.tools/chatbots",
    status: "Online",
  },
  {
    id: "health-slow",
    name: "Logo CDN checks",
    url: "storage/logo-assets",
    status: "Slow",
  },
  {
    id: "health-error",
    name: "Report intake",
    url: "future/reports",
    status: "Error",
  },
  {
    id: "health-unknown",
    name: "Discovery crawler",
    url: "future/discovery-engine",
    status: "Unknown",
  },
];

function smartStatusClass(status: SmartAdminStatus | ToolHealthStatus) {
  if (status === "Online") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Slow" || status === "Pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status === "Error" || status === "Reported" || status === "Archived") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "Duplicate") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (status === "Needs Review") {
    return "border-cyan-200 bg-cyan-50 text-cyan-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function SmartStatusBadge({
  status,
}: {
  status: SmartAdminStatus | ToolHealthStatus;
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${smartStatusClass(
        status
      )}`}
    >
      {status}
    </span>
  );
}

function AdminModalLayers() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-white" />
      <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[radial-gradient(circle_at_18%_0%,rgba(14,116,144,0.08),transparent_34%),linear-gradient(135deg,rgba(236,254,255,0.58),rgba(255,255,255,0.24),rgba(248,250,252,0))]" />
    </>
  );
}

function SlideOverPanel({
  eyebrow,
  title,
  description,
  accent = "cyan",
  onClose,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  accent?: "cyan" | "amber" | "slate";
  onClose: () => void;
  children: ReactNode;
}) {
  const accentClass =
    accent === "amber"
      ? "text-amber-700"
      : accent === "slate"
        ? "text-slate-600"
        : "text-cyan-700";

  return (
    <div
      className="fixed inset-0 z-[9997] flex min-h-dvh w-screen justify-end overflow-x-hidden bg-slate-500/25 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="aifinder-responsive-slide-panel ai-corner-safe-panel relative isolate flex flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl shadow-slate-300/70 sm:rounded-l-2xl">
        <AdminModalLayers />

        <div className="relative z-10 border-b border-slate-200 p-4 pr-16 sm:p-5 sm:pr-20">
          <div>
            <p
              className={`text-xs font-bold uppercase tracking-widest ${accentClass}`}
            >
              {eyebrow}
            </p>
            <h2 className="mt-2 text-lg font-black text-slate-950 sm:text-xl">
              {title}
            </h2>
            {description && (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="ai-product-button-secondary ai-modal-close-button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div
          className="relative z-10 min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-5"
          data-overlay-scroll-container="true"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function getSafeHttpsUrl(value?: string | null) {
  if (!value) return "";

  try {
    const url = new URL(value.trim());

    if (url.protocol !== "https:") return "";

    if (url.username || url.password) return "";

    const hostname = url.hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return "";
    }

    let pathname = "";

    try {
      pathname = decodeURIComponent(url.pathname).toLowerCase();
    } catch {
      pathname = url.pathname.toLowerCase();
    }

    if (BLOCKED_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) {
      return "";
    }

    url.hash = "";

    return url.toString();
  } catch {
    return "";
  }
}

function SafeExternalLink({
  url,
  label,
  accent = "cyan",
}: {
  url?: string | null;
  label: string;
  accent?: "cyan" | "yellow";
}) {
  const safeUrl = getSafeHttpsUrl(url);

  if (!safeUrl) {
    return (
      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
        Unsafe or invalid link blocked
      </span>
    );
  }

  return (
    <a
      href={safeUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded-full border px-3 py-1 text-xs font-bold ${
        accent === "yellow"
          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-500/20"
          : "border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-600/20"
      }`}
    >
      {label}
    </a>
  );
}

function LogoPreview({
  logoUrl,
  name,
  accent,
}: {
  logoUrl?: string | null;
  name: string;
  accent: "cyan" | "yellow";
}) {
  const [logoError, setLogoError] = useState(false);
  const safeLogoUrl = getSafeHttpsUrl(logoUrl);

  if (safeLogoUrl && !logoError) {
    return (
      <img
        src={safeLogoUrl}
        alt={`${name} logo`}
        className="h-12 w-12 rounded-2xl border border-slate-200 bg-white object-contain p-2 sm:h-14 sm:w-14"
        onError={() => setLogoError(true)}
      />
    );
  }

  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border sm:h-14 sm:w-14 ${
        accent === "cyan"
          ? "border-cyan-200 bg-cyan-50 text-cyan-700"
          : "border-amber-200 bg-amber-50 text-amber-700"
      } text-xl font-black`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function SubmissionSafeIcon({ name }: { name: string }) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-xl font-black text-amber-700">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4"
      />
    </svg>
  );
}

function formatAuditAction(action: string) {
  return action
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatAuditDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function AdminDashboardClient({
  view = "dashboard",
  discoveryToolId,
}: {
  view?: AdminView;
  discoveryToolId?: string;
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  const [tools, setTools] = useState<Tool[]>([]);
  const [submissions, setSubmissions] = useState<SubmittedTool[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [auditArchives, setAuditArchives] = useState<AdminAuditArchive[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false);
  const [isAddToolModalOpen, setIsAddToolModalOpen] = useState(false);
  const [isAdminReviewModalOpen, setIsAdminReviewModalOpen] = useState(false);
  const [isLiveDatabaseModalOpen, setIsLiveDatabaseModalOpen] = useState(false);

  const [stats, setStats] = useState<AdminStats>({
    totalTools: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
  });

  const [globalAdminSearch, setGlobalAdminSearch] = useState("");
  const [toolSearch, setToolSearch] = useState("");
  const [toolCategoryFilter, setToolCategoryFilter] = useState("All");
  const [toolSort, setToolSort] = useState("newest");

  const [submissionSearch, setSubmissionSearch] = useState("");
  const [submissionCategoryFilter, setSubmissionCategoryFilter] =
    useState("All");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [pricing, setPricing] = useState("");

  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editPricing, setEditPricing] = useState("");

  const [editingSubmission, setEditingSubmission] =
    useState<SubmittedTool | null>(null);
  const [submissionEditName, setSubmissionEditName] = useState("");
  const [submissionEditCategory, setSubmissionEditCategory] = useState("");
  const [submissionEditDescription, setSubmissionEditDescription] =
    useState("");
  const [submissionEditWebsite, setSubmissionEditWebsite] = useState("");
  const [submissionEditLogoUrl, setSubmissionEditLogoUrl] = useState("");
  const [submissionEditPricing, setSubmissionEditPricing] = useState("");
  const [selectedNotification, setSelectedNotification] =
    useState<SmartAdminNotification | null>(null);
  const [selectedDiscoveredTool, setSelectedDiscoveredTool] =
    useState<DiscoveredTool | null>(null);

  const [isUploadingAddLogo, setIsUploadingAddLogo] = useState(false);
  const [isUploadingEditLogo, setIsUploadingEditLogo] = useState(false);
  const [isUploadingSubmissionLogo, setIsUploadingSubmissionLogo] =
    useState(false);

  const [popup, setPopup] = useState<PopupMessage | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(
    null
  );
  const [isConfirming, setIsConfirming] = useState(false);

  const toolCategories = useMemo(() => {
    return Array.from(
      new Set(tools.map((tool) => tool.category).filter(Boolean))
    ).sort();
  }, [tools]);

  const submissionCategories = useMemo(() => {
    return Array.from(
      new Set(
        submissions.map((submission) => submission.category).filter(Boolean)
      )
    ).sort();
  }, [submissions]);

  const filteredTools = useMemo(() => {
    let result = tools.filter((tool) => {
      const searchText = `${tool.name} ${tool.category} ${tool.description} ${
        tool.website
      } ${tool.logo_url || ""} ${tool.pricing || ""}`.toLowerCase();

      const matchesSearch = searchText.includes(toolSearch.toLowerCase());

      const matchesCategory =
        toolCategoryFilter === "All" || tool.category === toolCategoryFilter;

      return matchesSearch && matchesCategory;
    });

    result = [...result].sort((a, b) => {
      const firstId = a.id || 0;
      const secondId = b.id || 0;

      if (toolSort === "oldest") {
        return firstId - secondId;
      }

      return secondId - firstId;
    });

    return result;
  }, [tools, toolSearch, toolCategoryFilter, toolSort]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const searchText = `${submission.name} ${submission.category} ${
        submission.description
      } ${submission.website} ${submission.logo_url || ""} ${
        submission.pricing || ""
      } ${submission.submitter_name || ""} ${
        submission.submitter_email || ""
      }`.toLowerCase();

      const matchesSearch = searchText.includes(
        submissionSearch.toLowerCase()
      );

      const matchesCategory =
        submissionCategoryFilter === "All" ||
        submission.category === submissionCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [submissions, submissionSearch, submissionCategoryFilter]);

  const possibleDuplicateWarnings = useMemo(() => {
    const normalizedTools = [...tools, ...submissions].map((tool) => {
      let host = "";

      try {
        host = new URL(tool.website).hostname.replace(/^www\./, "");
      } catch {
        host = tool.website.toLowerCase();
      }

      return {
        id: String(tool.id || tool.name),
        name: tool.name,
        host,
        category: tool.category,
      };
    });

    const warnings: Array<{
      id: string;
      name: string;
      matchedWith: string;
      reason: string;
    }> = [];

    normalizedTools.forEach((tool, index) => {
      const match = normalizedTools.find((candidate, candidateIndex) => {
        if (candidateIndex <= index) return false;

        const sameHost = Boolean(tool.host && candidate.host === tool.host);
        const firstName = tool.name.toLowerCase();
        const secondName = candidate.name.toLowerCase();
        const similarName =
          firstName.includes(secondName) || secondName.includes(firstName);

        return sameHost || similarName;
      });

      if (match) {
        warnings.push({
          id: `${tool.id}-${match.id}`,
          name: tool.name,
          matchedWith: match.name,
          reason: tool.host === match.host ? "Similar URL" : "Similar name",
        });
      }
    });

    if (warnings.length > 0) return warnings.slice(0, 3);

    return [
      {
        id: "duplicate-prep-placeholder",
        name: "Prompt Studio",
        matchedWith: "Prompt Studio Pro",
        reason: "Placeholder match",
      },
    ];
  }, [tools, submissions]);

  const moderationQueue = useMemo(() => {
    const submittedItems: SmartAdminModerationItem[] = submissions
      .slice(0, 3)
      .map((submission) => ({
        id: `submission-${submission.id}`,
        name: submission.name,
        source: "User submission",
        status: "Pending",
        suggestedCategory: submission.category || "Needs Review",
      }));

    return [...submittedItems, ...MOCK_MODERATION_ITEMS].slice(0, 5);
  }, [submissions]);

  const recentActivity = useMemo(() => {
    const auditActivity: SmartAdminActivity[] = auditLogs
      .slice(0, 4)
      .map((log) => ({
        id: `audit-${log.id}`,
        action: formatAuditAction(log.action),
        target: log.target_name || log.target_type || "Admin session",
        status: log.action.includes("reject")
          ? "Reported"
          : log.action.includes("approve")
            ? "Online"
            : "Needs Review",
        time: formatAuditDate(log.created_at),
      }));

    return auditActivity.length > 0 ? auditActivity : MOCK_RECENT_ACTIVITY;
  }, [auditLogs]);

  const adminNotifications = useMemo(() => {
    const liveNotifications: SmartAdminNotification[] = [];

    if (submissions.length > 0) {
      liveNotifications.push({
        id: "live-submissions",
        title: "New tool submitted",
        message: `${submissions.length} pending submission${
          submissions.length === 1 ? "" : "s"
        } need review.`,
        status: "Pending",
      });
    }

    if (possibleDuplicateWarnings.length > 0) {
      liveNotifications.push({
        id: "live-duplicates",
        title: "Duplicate detected",
        message: "Possible overlap found in tool names or URLs.",
        status: "Duplicate",
      });
    }

    return [...liveNotifications, ...MOCK_NOTIFICATIONS].slice(0, 4);
  }, [submissions.length, possibleDuplicateWarnings.length]);

  const toolHealthItems = useMemo(() => {
    const liveHealth = tools.slice(0, 4).map<ToolHealthItem>((tool, index) => ({
      id: `tool-health-${tool.id || tool.name}`,
      name: tool.name,
      url: tool.website,
      status: (["Online", "Slow", "Unknown", "Online"] as ToolHealthStatus[])[
        index % 4
      ],
    }));

    return liveHealth.length > 0 ? liveHealth : MOCK_TOOL_HEALTH;
  }, [tools]);

  const globalSearchResults = useMemo(() => {
    const query = globalAdminSearch.trim().toLowerCase();

    if (!query) return [];

    const records = [
      ...tools.map((tool) => ({
        id: `tool-${tool.id || tool.name}`,
        type: "Live Tool",
        title: tool.name,
        detail: `${tool.category} • ${tool.website}`,
        status: "Online" as SmartAdminStatus,
      })),
      ...submissions.map((submission) => ({
        id: `submission-${submission.id}`,
        type: "Submission",
        title: submission.name,
        detail: `${submission.category} • ${submission.website}`,
        status: "Pending" as SmartAdminStatus,
      })),
      ...moderationQueue.map((item) => ({
        id: `moderation-${item.id}`,
        type: "Moderation",
        title: item.name,
        detail: `${item.source} • ${item.suggestedCategory}`,
        status: item.status,
      })),
      ...adminNotifications.map((notification) => ({
        id: `notification-${notification.id}`,
        type: "Notification",
        title: notification.title,
        detail: notification.message,
        status: notification.status,
      })),
    ];

    return records
      .filter((record) =>
        `${record.type} ${record.title} ${record.detail} ${record.status}`
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 6);
  }, [
    globalAdminSearch,
    tools,
    submissions,
    moderationQueue,
    adminNotifications,
  ]);

  const hasActiveToolFilters =
    Boolean(toolSearch.trim()) ||
    toolCategoryFilter !== "All" ||
    toolSort !== "newest";

  const hasActiveSubmissionFilters =
    Boolean(submissionSearch.trim()) || submissionCategoryFilter !== "All";

  const currentPage = ADMIN_PAGE_COPY[view];

  function navItemClass(itemView: AdminView) {
    if (itemView === view) {
      return "rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 font-bold text-cyan-800 shadow-sm shadow-cyan-100";
    }

    return "rounded-xl px-3 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950";
  }

  function renderPageAction() {
    if (view === "dashboard") {
      return (
        <button
          onClick={() => {
            closeSlideOvers();
            setIsAddToolModalOpen(true);
          }}
          className="w-full rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-cyan-700 sm:w-auto"
        >
          Add Tool
        </button>
      );
    }

    if (view === "discovery") {
      return (
        <a
          href="#discovery-intake"
          className="w-full rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-center text-sm font-bold text-cyan-800 transition hover:bg-cyan-100 sm:w-auto"
        >
          Review Intake
        </a>
      );
    }

    if (view === "moderation") {
      return (
        <button
          onClick={openAdminReviewPanel}
          className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-amber-400 sm:w-auto"
        >
          Open Review
        </button>
      );
    }

    if (view === "security") {
      return (
        <button
          onClick={() => {
            closeSlideOvers();
            setIsAuditLogModalOpen(true);
            fetchAuditLogs();
          }}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
        >
          Audit Logs
        </button>
      );
    }

    return null;
  }

  function closeSlideOvers() {
    setIsAddToolModalOpen(false);
    setIsAdminReviewModalOpen(false);
    setIsLiveDatabaseModalOpen(false);
    setIsAuditLogModalOpen(false);
    closeEditModal();
    closeSubmissionEditModal();
    setSelectedNotification(null);
    setSelectedDiscoveredTool(null);
  }

  function openAdminReviewPanel() {
    closeSlideOvers();
    setIsAdminReviewModalOpen(true);
  }

  function openNotificationPanel(notification: SmartAdminNotification) {
    closeSlideOvers();
    setSelectedNotification(notification);
  }

  function openDiscoveryReviewPanel(tool: DiscoveredTool) {
    closeSlideOvers();
    setSelectedDiscoveredTool(tool);
  }

  function resetToolFilters() {
    setToolSearch("");
    setToolCategoryFilter("All");
    setToolSort("newest");
  }

  function resetSubmissionFilters() {
    setSubmissionSearch("");
    setSubmissionCategoryFilter("All");
  }

  function showSuccess(message: string, title = "Success") {
    // Future Sonner use in admin flows: toast.success(title, { description: message }).
    setPopup({
      type: "success",
      title,
      message,
    });
  }

  function showError(message: string, title = "Action Failed") {
    // Future Sonner use in admin flows: toast.error(title, { description: message }).
    setPopup({
      type: "error",
      title,
      message,
    });
  }

  function askConfirm(dialog: ConfirmDialog) {
    setConfirmDialog(dialog);
  }

  async function runConfirmAction() {
    if (!confirmDialog) return;

    setIsConfirming(true);

    try {
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } catch (error) {
      showError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setIsConfirming(false);
    }
  }

  async function checkAdminSession() {
    setIsCheckingSession(true);

    try {
      const response = await fetch("/api/admin/session", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const result = await response.json().catch(() => null);

      setIsUnlocked(Boolean(response.ok && result?.authenticated));
    } catch {
      setIsUnlocked(false);
    } finally {
      setIsCheckingSession(false);
    }
  }

  async function fetchCsrfToken() {
    try {
      const response = await fetch("/api/admin/csrf", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const result = await response.json().catch(() => null);

      if (response.status === 401) {
        showError("Your admin session expired. Please log in again.");
        logoutAdmin();
        return "";
      }

      if (!response.ok || !result?.csrfToken) {
        showError("Unable to prepare secure admin actions. Please refresh.");
        return "";
      }

      setCsrfToken(result.csrfToken);
      return result.csrfToken as string;
    } catch {
      showError("Unable to prepare secure admin actions. Please refresh.");
      return "";
    }
  }

  async function getCsrfToken() {
    if (csrfToken) return csrfToken;

    return fetchCsrfToken();
  }

  async function unlockAdmin() {
    if (!password.trim()) {
      showError("Please enter the admin password.", "Admin Access Denied");
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        showError(
          result?.error || "Wrong password. Please try again.",
          "Admin Access Denied"
        );
        return;
      }

      setPassword("");
      setIsUnlocked(true);
    } catch {
      showError("Admin login failed. Please try again.", "Admin Access Denied");
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function logoutAdmin() {
    try {
      const headers: Record<string, string> = {};

      if (csrfToken) {
        headers["x-csrf-token"] = csrfToken;
      }

      await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers,
      });
    } catch {
      // Continue clearing local UI state even if logout request fails.
    }

    setIsUnlocked(false);
    setPassword("");
    setCsrfToken("");
    setTools([]);
    setSubmissions([]);
    setAuditLogs([]);
    setAuditArchives([]);
    setIsLoadingTools(false);
    setIsLoadingSubmissions(false);
    setStats({
      totalTools: 0,
      pendingSubmissions: 0,
      approvedSubmissions: 0,
      rejectedSubmissions: 0,
    });
  }

  function handleSecurityFailure(responseStatus: number) {
    if (responseStatus === 401) {
      showError("Your admin session expired. Please log in again.");
      logoutAdmin();
      return true;
    }

    if (responseStatus === 403) {
      showError(
        "Your security token expired. Please log in again.",
        "Security Check Failed"
      );
      logoutAdmin();
      return true;
    }

    return false;
  }

  async function uploadLogoFile(
    file: File,
    setUrl: (url: string) => void,
    setUploading: (value: boolean) => void
  ) {
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      showError("Only PNG, JPG, JPEG, and WEBP logo files are allowed.");
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      showError("Logo file must be under 2MB.");
      return;
    }

    const secureToken = await getCsrfToken();

    if (!secureToken) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/upload-logo", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "x-csrf-token": secureToken,
        },
        body: formData,
      });

      const result = await response.json().catch(() => null);

      if (handleSecurityFailure(response.status)) {
        return;
      }

      if (!response.ok || !result?.logoUrl) {
        showError(result?.error || "Failed to upload logo.");
        return;
      }

      setUrl(result.logoUrl);
      // Future Sonner use in upload flows: toast.success("Logo Uploaded", { description: "Logo uploaded successfully." }).
      showSuccess("Logo uploaded successfully.", "Logo Uploaded");
      fetchAuditLogs();
    } catch {
      showError("Failed to upload logo.");
    } finally {
      setUploading(false);
    }
  }

  async function fetchTools() {
    setIsLoadingTools(true);

    try {
      const { data, error } = await supabase
        .from("tools")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        showError("Failed to load live tools.");
        return;
      }

      setTools(data || []);
    } finally {
      setIsLoadingTools(false);
    }
  }

  async function fetchSubmissions() {
    setIsLoadingSubmissions(true);

    try {
      const response = await fetch("/api/admin/submissions", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const result = await response.json().catch(() => null);

      if (handleSecurityFailure(response.status)) {
        return;
      }

      if (!response.ok) {
        showError(result?.error || "Failed to load submissions.");
        return;
      }

      setSubmissions(result?.submissions || []);

      if (result?.stats) {
        setStats(result.stats);
      }
    } finally {
      setIsLoadingSubmissions(false);
    }
  }

  async function fetchAuditLogs() {
    setIsLoadingAuditLogs(true);

    try {
      const response = await fetch("/api/admin/audit-logs", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const result = await response.json().catch(() => null);

      if (handleSecurityFailure(response.status)) {
        return;
      }

      if (!response.ok) {
        showError(result?.error || "Failed to load admin audit logs.");
        return;
      }

      setAuditLogs(result?.logs || []);
      setAuditArchives(result?.archives || []);
    } catch {
      showError("Failed to load admin audit logs.");
    } finally {
      setIsLoadingAuditLogs(false);
    }
  }

  function downloadAuditArchive(archiveId: string) {
    window.open(`/api/admin/audit-logs/archive/${archiveId}`, "_blank", "noopener,noreferrer");
  }

  function deleteAuditArchive(archiveId: string, fileName: string) {
    askConfirm({
      title: "Delete Audit Archive?",
      message:
        "This will permanently delete the compressed audit archive file. This action cannot be undone.",
      confirmLabel: "Delete",
      confirmTone: "red",
      onConfirm: async () => {
        const secureToken = await getCsrfToken();

        if (!secureToken) return;

        const response = await fetch(`/api/admin/audit-logs/archive/${archiveId}`, {
          method: "DELETE",
          credentials: "same-origin",
          headers: {
            "x-csrf-token": secureToken,
          },
        });

        const result = await response.json().catch(() => null);

        if (handleSecurityFailure(response.status)) {
          return;
        }

        if (!response.ok) {
          showError(result?.error || "Failed to delete audit archive.");
          return;
        }

        showSuccess(`Deleted archive: ${fileName}`, "Audit Archive Deleted");
        fetchAuditLogs();
      },
    });
  }

  function approveSubmission(submissionId: number) {
    askConfirm({
      title: "Approve Submission?",
      message:
        "This will add the submitted tool to the live AiFinder database.",
      confirmLabel: "Approve",
      confirmTone: "green",
      onConfirm: async () => {
        const secureToken = await getCsrfToken();

        if (!secureToken) return;

        const response = await fetch("/api/admin/submissions", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": secureToken,
          },
          body: JSON.stringify({
            submissionId,
          }),
        });

        const result = await response.json().catch(() => null);

        if (handleSecurityFailure(response.status)) {
          return;
        }

        if (!response.ok) {
          showError(result?.error || "Failed to approve submission.");
          return;
        }

        showSuccess(
          "Tool approved and added to AiFinder.",
          "Submission Approved"
        );

        fetchSubmissions();
        fetchTools();
        fetchAuditLogs();
      },
    });
  }

  function rejectSubmission(submissionId: number) {
    askConfirm({
      title: "Reject Submission?",
      message:
        "This will mark the submitted tool as rejected. It will not appear publicly.",
      confirmLabel: "Reject",
      confirmTone: "red",
      onConfirm: async () => {
        const secureToken = await getCsrfToken();

        if (!secureToken) return;

        const response = await fetch("/api/admin/submissions", {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": secureToken,
          },
          body: JSON.stringify({
            submissionId,
          }),
        });

        const result = await response.json().catch(() => null);

        if (handleSecurityFailure(response.status)) {
          return;
        }

        if (!response.ok) {
          showError(result?.error || "Failed to reject submission.");
          return;
        }

        showSuccess("Submission rejected.", "Submission Rejected");

        fetchSubmissions();
        fetchAuditLogs();
      },
    });
  }

  function openSubmissionEditModal(submission: SubmittedTool) {
    closeSlideOvers();
    setEditingSubmission(submission);
    setSubmissionEditName(submission.name);
    setSubmissionEditCategory(submission.category);
    setSubmissionEditDescription(submission.description);
    setSubmissionEditWebsite(submission.website);
    setSubmissionEditLogoUrl(submission.logo_url || "");
    setSubmissionEditPricing(submission.pricing || "");
  }

  function closeSubmissionEditModal() {
    setEditingSubmission(null);
    setSubmissionEditName("");
    setSubmissionEditCategory("");
    setSubmissionEditDescription("");
    setSubmissionEditWebsite("");
    setSubmissionEditLogoUrl("");
    setSubmissionEditPricing("");
  }

  async function updateSubmission() {
    if (!editingSubmission?.id) return;

    if (
      !submissionEditName ||
      !submissionEditCategory ||
      !submissionEditDescription ||
      !submissionEditWebsite
    ) {
      showError("Please fill all required fields.");
      return;
    }

    const secureToken = await getCsrfToken();

    if (!secureToken) return;

    const response = await fetch("/api/admin/submissions", {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": secureToken,
      },
      body: JSON.stringify({
        id: editingSubmission.id,
        name: submissionEditName,
        category: submissionEditCategory,
        description: submissionEditDescription,
        website: submissionEditWebsite,
        logo_url: submissionEditLogoUrl,
        pricing: submissionEditPricing,
      }),
    });

    const result = await response.json().catch(() => null);

    if (handleSecurityFailure(response.status)) {
      return;
    }

    if (!response.ok) {
      showError(result?.error || "Failed to update submission.");
      return;
    }

    showSuccess("Submission updated.", "Submission Updated");

    closeSubmissionEditModal();
    fetchSubmissions();
    fetchAuditLogs();
  }

  useEffect(() => {
    void Promise.resolve().then(() => checkAdminSession());
  }, []);

  useEffect(() => {
    if (!isUnlocked) return;

    void Promise.resolve().then(() => {
      fetchTools();
      fetchSubmissions();
      fetchAuditLogs();
      fetchCsrfToken();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked]);

  const hasActiveAdminOverlay =
    isAdminReviewModalOpen ||
    isAddToolModalOpen ||
    isLiveDatabaseModalOpen ||
    isAuditLogModalOpen ||
    Boolean(editingTool) ||
    Boolean(editingSubmission) ||
    Boolean(selectedNotification) ||
    Boolean(selectedDiscoveredTool) ||
    Boolean(confirmDialog) ||
    Boolean(popup);

  useOverlayScrollLock(hasActiveAdminOverlay);

  useEffect(() => {
    if (!hasActiveAdminOverlay) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsAddToolModalOpen(false);
        setIsAdminReviewModalOpen(false);
        setIsLiveDatabaseModalOpen(false);
        setIsAuditLogModalOpen(false);
        setEditingTool(null);
        setEditName("");
        setEditCategory("");
        setEditDescription("");
        setEditWebsite("");
        setEditLogoUrl("");
        setEditPricing("");
        setEditingSubmission(null);
        setSubmissionEditName("");
        setSubmissionEditCategory("");
        setSubmissionEditDescription("");
        setSubmissionEditWebsite("");
        setSubmissionEditLogoUrl("");
        setSubmissionEditPricing("");
        setSelectedNotification(null);
        setSelectedDiscoveredTool(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isAdminReviewModalOpen,
    isAddToolModalOpen,
    isLiveDatabaseModalOpen,
    isAuditLogModalOpen,
    editingTool,
    editingSubmission,
    selectedNotification,
    selectedDiscoveredTool,
    hasActiveAdminOverlay,
  ]);

  async function addTool() {
    if (!name || !category || !description || !website) {
      showError("Please fill all required fields.");
      return;
    }

    if (!isToolCategory(category)) {
      showError("Please select a valid category.");
      return;
    }

    const secureToken = await getCsrfToken();

    if (!secureToken) return;

    const response = await fetch("/api/admin/tools", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": secureToken,
      },
      body: JSON.stringify({
        name,
        category,
        description,
        website,
        logo_url: logoUrl,
        pricing,
      }),
    });

    const result = await response.json().catch(() => null);

    if (handleSecurityFailure(response.status)) {
      return;
    }

    if (!response.ok) {
      showError(result?.error || "Failed to add tool.");
      return;
    }

    setName("");
    setCategory("");
    setDescription("");
    setWebsite("");
    setLogoUrl("");
    setPricing("");

    showSuccess("Tool added to AiFinder.", "Tool Added");

    fetchTools();
    fetchSubmissions();
    fetchAuditLogs();
  }

  function openEditModal(tool: Tool) {
    closeSlideOvers();
    setEditingTool(tool);
    setEditName(tool.name);
    setEditCategory(tool.category);
    setEditDescription(tool.description);
    setEditWebsite(tool.website);
    setEditLogoUrl(tool.logo_url || "");
    setEditPricing(tool.pricing || "");
  }

  function closeEditModal() {
    setEditingTool(null);
    setEditName("");
    setEditCategory("");
    setEditDescription("");
    setEditWebsite("");
    setEditLogoUrl("");
    setEditPricing("");
  }

  async function updateTool() {
    if (!editingTool?.id) return;

    if (!editName || !editCategory || !editDescription || !editWebsite) {
      showError("Please fill all required fields.");
      return;
    }

    if (!isToolCategory(editCategory)) {
      showError("Please select a valid category.");
      return;
    }

    const secureToken = await getCsrfToken();

    if (!secureToken) return;

    const response = await fetch("/api/admin/tools", {
      method: "PUT",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": secureToken,
      },
      body: JSON.stringify({
        id: editingTool.id,
        name: editName,
        category: editCategory,
        description: editDescription,
        website: editWebsite,
        logo_url: editLogoUrl,
        pricing: editPricing,
      }),
    });

    const result = await response.json().catch(() => null);

    if (handleSecurityFailure(response.status)) {
      return;
    }

    if (!response.ok) {
      showError(result?.error || "Failed to update tool.");
      return;
    }

    showSuccess("Tool updated successfully.", "Tool Updated");

    closeEditModal();
    fetchTools();
    fetchSubmissions();
    fetchAuditLogs();
  }

  function deleteTool(id?: number) {
    if (!id) return;

    askConfirm({
      title: "Archive Tool?",
      message:
        "This will archive the tool. It will be hidden from public directories but remain in the database.",
      confirmLabel: "Archive",
      confirmTone: "red",
      onConfirm: async () => {
        const secureToken = await getCsrfToken();

        if (!secureToken) return;

        const response = await fetch("/api/admin/tools", {
          method: "DELETE",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "x-csrf-token": secureToken,
          },
          body: JSON.stringify({
            id,
          }),
        });

        const result = await response.json().catch(() => null);

        if (handleSecurityFailure(response.status)) {
          return;
        }

        if (!response.ok) {
          showError(result?.error || "Failed to archive tool.");
          return;
        }

        showSuccess("Tool archived successfully.", "Tool Archived");

        fetchTools();
        fetchSubmissions();
        fetchAuditLogs();
      },
    });
  }

  const isSuccessPopup = popup?.type === "success";

  const messagePopup = popup && (
    <div
      className="aifinder-responsive-modal-backdrop fixed inset-0 z-[9999] flex w-screen items-end justify-center bg-slate-500/25 backdrop-blur-md sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`aifinder-responsive-modal-panel ai-corner-safe-panel relative isolate max-w-md overflow-hidden rounded-t-2xl border p-5 text-center shadow-xl shadow-slate-200/80 sm:rounded-2xl sm:p-7 ${
          isSuccessPopup
            ? "border-emerald-200 bg-white"
            : "border-red-200 bg-white"
        }`}
      >
        <AdminModalLayers />
        <div className="relative z-10">
        <button
          type="button"
          onClick={() => setPopup(null)}
          aria-label="Close message"
          className="ai-product-button-secondary ai-modal-close-button"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-4xl font-black ${
            isSuccessPopup
              ? "bg-emerald-600/15 text-emerald-700"
              : "bg-red-600/15 text-red-700"
          }`}
        >
          {isSuccessPopup ? "✓" : "!"}
        </div>

        <h2 className="mt-5 text-lg font-black text-slate-950">
          {popup.title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-700">
          {popup.message}
        </p>

        <button
          onClick={() => setPopup(null)}
          className={`mt-6 rounded-full px-7 py-3 text-sm font-bold text-white ${
            isSuccessPopup
              ? "bg-emerald-600 hover:bg-emerald-500"
              : "bg-red-600 hover:bg-red-500"
          }`}
        >
          OK
        </button>
        </div>
      </div>
    </div>
  );

  const confirmationPopup = confirmDialog && (
    <div
      className="aifinder-responsive-modal-backdrop fixed inset-0 z-[9998] flex w-screen items-end justify-center bg-slate-500/25 backdrop-blur-md sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="aifinder-responsive-modal-panel ai-corner-safe-panel relative isolate max-w-md overflow-hidden rounded-t-2xl border border-slate-200 bg-white p-5 text-center shadow-xl shadow-slate-200/80 sm:rounded-2xl sm:p-7">
        <AdminModalLayers />
        <div className="relative z-10">
        <button
          type="button"
          onClick={() => setConfirmDialog(null)}
          disabled={isConfirming}
          aria-label="Close confirmation"
          className="ai-product-button-secondary ai-modal-close-button disabled:cursor-not-allowed disabled:opacity-60"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-4xl font-black ${
            confirmDialog.confirmTone === "green"
              ? "bg-emerald-600/15 text-emerald-700"
              : confirmDialog.confirmTone === "red"
                ? "bg-red-600/15 text-red-700"
                : "bg-amber-500/15 text-amber-700"
          }`}
        >
          ?
        </div>

        <h2 className="mt-5 text-lg font-black text-slate-950">
          {confirmDialog.title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-700">
          {confirmDialog.message}
        </p>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={() => setConfirmDialog(null)}
            disabled={isConfirming}
            className="w-full rounded-full border border-slate-200 px-7 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            Cancel
          </button>

          <button
            onClick={runConfirmAction}
            disabled={isConfirming}
            className={`w-full rounded-full px-7 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${
              confirmDialog.confirmTone === "green"
                ? "bg-emerald-600 hover:bg-emerald-500"
                : confirmDialog.confirmTone === "red"
                  ? "bg-red-600 hover:bg-red-500"
                  : "bg-amber-500 hover:bg-amber-400"
            }`}
          >
            {isConfirming ? "Working..." : confirmDialog.confirmLabel}
          </button>
        </div>
        </div>
      </div>
    </div>
  );

  const auditLogsPopup = isAuditLogModalOpen && (
    <SlideOverPanel
      eyebrow="Security Audit"
      title="Recent Admin Activity"
      description="Latest logs stay visible while older logs are archived for security review."
      accent="slate"
      onClose={() => setIsAuditLogModalOpen(false)}
    >
          <div className="mb-4 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              onClick={fetchAuditLogs}
              disabled={isLoadingAuditLogs}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isLoadingAuditLogs ? "Loading..." : "Refresh Logs"}
            </button>

          </div>

        <div className="space-y-6">
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  Live Audit Logs
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Shows the newest activity. Older logs are archived automatically after 100 live logs.
                </p>
              </div>

              <span className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-bold text-violet-700">
                {auditLogs.length} shown
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No audit logs yet. Try logging out/in or adding a test tool.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="hidden grid-cols-[170px_1fr_1fr_120px] gap-4 border-b border-slate-200 bg-slate-100 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-600">
                  <span>Time</span>
                  <span>Action</span>
                  <span>Target</span>
                  <span>IP</span>
                </div>

                <div className="divide-y divide-slate-200">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="grid min-w-0 gap-2 px-4 py-4 text-sm sm:px-5"
                    >
                      <p className="text-slate-600">
                        {formatAuditDate(log.created_at)}
                      </p>

                      <p className="font-bold text-slate-950">
                        {formatAuditAction(log.action)}
                      </p>

                      <p className="break-words text-slate-700">
                        {log.target_name || log.target_type || "Admin session"}
                        {log.target_id ? (
                          <span className="text-slate-500"> #{log.target_id}</span>
                        ) : null}
                      </p>

                      <p className="break-all text-xs text-slate-500">
                        {log.ip_address || "Unknown"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-950">
                  Compressed Archives
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Download or delete archived logs. Files are stored privately in Supabase Storage.
                </p>
              </div>

              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-700">
                {auditArchives.length} archive{auditArchives.length === 1 ? "" : "s"}
              </span>
            </div>

            {auditArchives.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                No compressed audit archives yet. Archives appear after live logs go over 100.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="hidden grid-cols-[1fr_100px_100px_210px] gap-4 border-b border-slate-200 bg-slate-100 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-600">
                  <span>Archive</span>
                  <span>Logs</span>
                  <span>Size</span>
                  <span>Actions</span>
                </div>

                <div className="divide-y divide-slate-200">
                  {auditArchives.map((archive) => (
                    <div
                      key={archive.id}
                      className="grid min-w-0 gap-3 px-4 py-4 text-sm sm:px-5"
                    >
                      <div>
                        <p className="break-all font-bold text-slate-950">
                          {archive.file_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Created {formatAuditDate(archive.created_at)}
                          {archive.first_log_at && archive.last_log_at
                            ? ` • ${formatAuditDate(archive.first_log_at)} to ${formatAuditDate(archive.last_log_at)}`
                            : ""}
                        </p>
                      </div>

                      <p className="text-slate-700">
                        {archive.log_count}
                      </p>

                      <p className="text-slate-700">
                        {formatBytes(archive.compressed_size_bytes)}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => downloadAuditArchive(archive.id)}
                          className="w-full rounded-full bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700 sm:w-auto"
                        >
                          Download
                        </button>

                        <button
                          onClick={() =>
                            deleteAuditArchive(archive.id, archive.file_name)
                          }
                          className="w-full rounded-full bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 sm:w-auto"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
    </SlideOverPanel>
  );

  const addToolPopup = isAddToolModalOpen && (
    <SlideOverPanel
      eyebrow="Add Tool"
      title="Add New Tool"
      description="Add a new approved AI tool directly to the live AiFinder database."
      accent="cyan"
      onClose={() => setIsAddToolModalOpen(false)}
    >
        <div className="space-y-4">
          <section className={adminFormSectionClass}>
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Tool details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Required live listing fields for the public directory.
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className={adminFormFieldClass}>
                <Label className={adminFormLabelClass} htmlFor="admin-add-name">
                  Tool name <span className="text-cyan-700">*</span>
                </Label>
                <Input
                  suppressHydrationWarning
                  id="admin-add-name"
                  className={adminFormControlClass}
                  placeholder="Tool name"
                  value={name}
                  maxLength={80}
                  aria-required="true"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className={adminFormFieldClass}>
                <Label
                  className={adminFormLabelClass}
                  htmlFor="admin-add-category"
                >
                  Category <span className="text-cyan-700">*</span>
                </Label>
                <select
                  id="admin-add-category"
                  className={`${adminFormControlClass} appearance-auto bg-white text-slate-950`}
                  value={category || SELECT_EMPTY_VALUE}
                  onChange={(e) =>
                    setCategory(
                      e.target.value === SELECT_EMPTY_VALUE ? "" : e.target.value
                    )
                  }
                  aria-required="true"
                >
                  <option value={SELECT_EMPTY_VALUE}>Select category</option>
                  {TOOL_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className={adminFormFieldClass}>
                <Label
                  className={adminFormLabelClass}
                  htmlFor="admin-add-website"
                >
                  Website URL <span className="text-cyan-700">*</span>
                </Label>
                <Input
                  suppressHydrationWarning
                  id="admin-add-website"
                  className={adminFormControlClass}
                  placeholder="https://example.com"
                  value={website}
                  maxLength={500}
                  aria-required="true"
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <div className={adminFormFieldClass}>
                <Label
                  className={adminFormLabelClass}
                  htmlFor="admin-add-pricing"
                >
                  Pricing
                </Label>
                <select
                  id="admin-add-pricing"
                  className={`${adminFormControlClass} appearance-auto bg-white text-slate-950`}
                  value={pricing || SELECT_EMPTY_VALUE}
                  onChange={(e) =>
                    setPricing(
                      e.target.value === SELECT_EMPTY_VALUE ? "" : e.target.value
                    )
                  }
                >
                  <option value={SELECT_EMPTY_VALUE}>Select pricing</option>
                  {PRICING_OPTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className={adminFormSectionClass}>
            <div>
              <h3 className="text-base font-bold text-slate-950">
                Logo
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Add a safe logo URL or upload a PNG, JPG, JPEG, or WEBP file.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-[minmax(0,1fr)_64px] gap-3 sm:grid-cols-[1fr_76px]">
              <div className={adminFormFieldClass}>
                <Label className={adminFormLabelClass} htmlFor="admin-add-logo">
                  Logo image URL
                </Label>
                <Input
                  suppressHydrationWarning
                  id="admin-add-logo"
                  className={adminFormControlClass}
                  placeholder="https://example.com/logo.png"
                  value={logoUrl}
                  maxLength={500}
                  aria-describedby="admin-add-logo-help"
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </div>

              <Label
                htmlFor="admin-add-logo-file"
                className="mt-7 flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 focus-within:ring-[3px] focus-within:ring-cyan-500/20"
                aria-label="Upload logo file"
              >
                {isUploadingAddLogo ? (
                  <span className="text-xl">…</span>
                ) : (
                  <UploadIcon />
                )}

                <Input
                  suppressHydrationWarning
                  id="admin-add-logo-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                      await uploadLogoFile(
                        file,
                        setLogoUrl,
                        setIsUploadingAddLogo
                      );
                    }

                    event.target.value = "";
                  }}
                />
              </Label>
            </div>

            <p id="admin-add-logo-help" className={`mt-2 ${adminFormHelpClass}`}>
              Admin logo upload accepts PNG, JPG, JPEG, or WEBP only.
            </p>

            {logoUrl && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <LogoPreview
                  logoUrl={logoUrl}
                  name={name || "Tool"}
                  accent="cyan"
                />
                <p className="break-all text-xs text-slate-600">{logoUrl}</p>
              </div>
            )}
          </section>

          <section className={adminFormSectionClass}>
            <div className={adminFormFieldClass}>
              <Label
                className={adminFormLabelClass}
                htmlFor="admin-add-description"
              >
                Description <span className="text-cyan-700">*</span>
              </Label>
              <Textarea
                suppressHydrationWarning
                id="admin-add-description"
                className={`${adminFormControlClass} min-h-28 resize-y`}
                placeholder="Description"
                value={description}
                maxLength={500}
                aria-required="true"
                aria-describedby="admin-add-description-help"
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
              <p id="admin-add-description-help" className={adminFormHelpClass}>
                Maximum 500 characters.
              </p>
            </div>

            <Button
              type="button"
              onClick={addTool}
              variant="ghost"
              className="mt-5 h-auto rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-700"
            >
              Add Tool
            </Button>
          </section>
        </div>
    </SlideOverPanel>
  );

  const adminReviewPopup = isAdminReviewModalOpen && (
    <SlideOverPanel
      eyebrow="Admin Review"
      title="Pending User Submissions"
      description="Review user-submitted tools safely before approving, editing, or rejecting them."
      accent="amber"
      onClose={closeSlideOvers}
    >
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-amber-700">
                Admin Review
              </p>

              <h2 className="mt-2 text-lg font-bold">
                Pending User Submissions ({filteredSubmissions.length})
              </h2>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              <button
                onClick={resetSubmissionFilters}
                disabled={!hasActiveSubmissionFilters}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                Clear Filters
              </button>

              <button
                onClick={fetchSubmissions}
                disabled={isLoadingSubmissions}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {isLoadingSubmissions ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-6 text-amber-800">
            Security note: user-submitted websites and logo URLs are shown as
            text first. Links open only in a new protected tab. No website
            preview or iframe is loaded in the admin dashboard.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <input suppressHydrationWarning
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-amber-500 focus:bg-white"
              placeholder="Search pending submissions..."
              value={submissionSearch}
              onChange={(e) => setSubmissionSearch(e.target.value)}
            />

            <select suppressHydrationWarning
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white"
              value={submissionCategoryFilter}
              onChange={(e) => setSubmissionCategoryFilter(e.target.value)}
            >
              <option className="bg-white" value="All">
                All Categories
              </option>
              {submissionCategories.map((categoryName) => (
                <option
                  className="bg-white"
                  key={categoryName}
                  value={categoryName}
                >
                  {categoryName}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
              Showing {filteredSubmissions.length} of {submissions.length} pending
            </span>
            {submissionSearch.trim() && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                Search: {submissionSearch.trim()}
              </span>
            )}
            {submissionCategoryFilter !== "All" && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700">
                Category: {submissionCategoryFilter}
              </span>
            )}
          </div>

          {isLoadingSubmissions ? (
            <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5 text-sm text-amber-800">
              Loading pending submissions...
            </p>
          ) : filteredSubmissions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
              <p className="text-sm font-bold text-slate-950">
                No matching pending submissions.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Try clearing the search/category filter or click Refresh.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:rounded-2xl sm:p-5"
                >
                  <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3 sm:gap-4">
                      <SubmissionSafeIcon name={submission.name} />

                      <div className="min-w-0">
                        <h3 className="break-words text-base font-bold">
                          {submission.name}
                        </h3>

                        <p className="text-sm text-amber-700">
                          {submission.category}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          Description: {submission.description}
                        </p>

                        <div className="mt-3 space-y-2">
                          <p className="break-all text-xs text-slate-500">
                            Website: {submission.website}
                          </p>

                          <SafeExternalLink
                            url={submission.website}
                            label="Review Website"
                            accent="yellow"
                          />

                          {submission.logo_url && (
                            <>
                              <p className="break-all text-xs text-slate-500">
                                Logo URL: {submission.logo_url}
                              </p>

                              <SafeExternalLink
                                url={submission.logo_url}
                                label="Review Logo"
                                accent="yellow"
                              />
                            </>
                          )}
                        </div>

                        {submission.pricing && (
                          <p className="mt-2 text-xs text-slate-600">
                            Pricing: {submission.pricing}
                          </p>
                        )}

                        {(submission.submitter_name ||
                          submission.submitter_email) && (
                          <p className="mt-2 text-xs text-slate-500">
                            Submitted by:{" "}
                            {submission.submitter_name || "Unknown"}{" "}
                            {submission.submitter_email
                              ? `(${submission.submitter_email})`
                              : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                      <button
                        onClick={() => approveSubmission(submission.id)}
                        className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 sm:w-auto"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => openSubmissionEditModal(submission)}
                        className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-500 sm:w-auto"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => rejectSubmission(submission.id)}
                        className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 sm:w-auto"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
    </SlideOverPanel>
  );

  const liveDatabasePopup = isLiveDatabaseModalOpen && (
    <SlideOverPanel
      eyebrow="Live Database"
      title="Tools in Database"
      description="Search, filter, edit, or archive live AiFinder tools."
      accent="cyan"
      onClose={() => setIsLiveDatabaseModalOpen(false)}
    >
          <div className="mb-4 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              onClick={fetchTools}
              disabled={isLoadingTools}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isLoadingTools ? "Loading..." : "Refresh Tools"}
            </button>

          </div>
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-cyan-700">
                  Live Database
                </p>

                <h2 className="mt-2 text-lg font-bold">
                  Tools in Database ({filteredTools.length})
                </h2>
              </div>

              <button
                onClick={resetToolFilters}
                disabled={!hasActiveToolFilters}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                Clear Filters
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <input suppressHydrationWarning
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-cyan-500 focus:bg-white"
                placeholder="Search live tools..."
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
              />

              <select suppressHydrationWarning
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:bg-white"
                value={toolCategoryFilter}
                onChange={(e) => setToolCategoryFilter(e.target.value)}
              >
                <option className="bg-white" value="All">
                  All Categories
                </option>
                {toolCategories.map((categoryName) => (
                  <option
                    className="bg-white"
                    key={categoryName}
                    value={categoryName}
                  >
                    {categoryName}
                  </option>
                ))}
              </select>

              <select suppressHydrationWarning
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:bg-white"
                value={toolSort}
                onChange={(e) => setToolSort(e.target.value)}
              >
                <option className="bg-white" value="newest">
                  Newest First
                </option>
                <option className="bg-white" value="oldest">
                  Oldest First
                </option>
              </select>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                Showing {filteredTools.length} of {tools.length} tools
              </span>
              {toolSearch.trim() && (
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-700">
                  Search: {toolSearch.trim()}
                </span>
              )}
              {toolCategoryFilter !== "All" && (
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-700">
                  Category: {toolCategoryFilter}
                </span>
              )}
              {toolSort !== "newest" && (
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-cyan-700">
                  Sort: Oldest First
                </span>
              )}
            </div>

            <div className="mt-5 space-y-4">
              {isLoadingTools ? (
                <p className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 sm:p-5 text-sm text-cyan-800">
                  Loading live tools...
                </p>
              ) : filteredTools.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <p className="text-sm font-bold text-slate-950">
                    No matching tools found.
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    Try clearing the filters or refresh the live database.
                  </p>
                </div>
              ) : (
                filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:p-5"
                  >
                    <div className="flex min-w-0 gap-3 sm:gap-4">
                      <LogoPreview
                        logoUrl={tool.logo_url}
                        name={tool.name}
                        accent="cyan"
                      />

                      <div className="min-w-0">
                        <h3 className="break-words text-base font-bold flex flex-wrap items-center gap-2">
                          {tool.name}
                          {(tool.status === "archived" || tool.deleted_at) && (
                            <span className="inline-flex rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
                              Archived
                            </span>
                          )}
                        </h3>

                        <p className="text-sm text-cyan-700">
                          {tool.category}
                        </p>

                        <p className="mt-2 text-sm text-slate-600">
                          {tool.description}
                        </p>

                        <div className="mt-2 space-y-2">
                          <p className="break-all text-xs text-slate-500">
                            {tool.website}
                          </p>

                          <SafeExternalLink
                            url={tool.website}
                            label="Review Website"
                            accent="cyan"
                          />
                        </div>

                        {tool.logo_url && (
                          <p className="mt-2 break-all text-xs text-slate-500">
                            Logo: {tool.logo_url}
                          </p>
                        )}

                        {tool.pricing && (
                          <p className="mt-2 text-xs text-amber-700">
                            {tool.pricing}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                      <button
                        onClick={() => openEditModal(tool)}
                        className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-500 sm:w-auto"
                      >
                        Edit
                      </button>

                      {tool.status === "archived" || tool.deleted_at ? (
                        <button
                          disabled
                          className="w-full rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-400 cursor-not-allowed sm:w-auto border border-slate-200"
                        >
                          Archived
                        </button>
                      ) : (
                        <button
                          onClick={() => deleteTool(tool.id)}
                          className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 sm:w-auto"
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
    </SlideOverPanel>
  );

  const notificationPanel = selectedNotification && (
    <SlideOverPanel
      eyebrow="Notification Details"
      title={selectedNotification.title}
      description={selectedNotification.message}
      accent="slate"
      onClose={closeSlideOvers}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Status
          </p>
          <div className="mt-3">
            <SmartStatusBadge status={selectedNotification.status} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-black text-slate-950">Recommended action</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Review the related admin module when this alert is connected to live
            backend events. This panel is prepared for future notification
            detail workflows.
          </p>
        </div>
      </div>
    </SlideOverPanel>
  );

  const discoveryReviewPanel = selectedDiscoveredTool && (
    <SlideOverPanel
      eyebrow="Discovery Review"
      title={selectedDiscoveredTool.name}
      description="Review this placeholder Discovery Engine candidate without leaving the Discovery page."
      accent="cyan"
      onClose={closeSlideOvers}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Candidate URL
          </p>
          <p className="mt-2 break-all text-sm text-slate-700">
            {selectedDiscoveredTool.website}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Status
            </p>
            <span className="mt-3 inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">
              {discoveredToolStatusLabels[selectedDiscoveredTool.status]}
            </span>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Confidence
            </p>
            <p className="mt-3 text-sm font-black text-slate-950">
              {selectedDiscoveredTool.confidenceScore
                ? `${Math.round(selectedDiscoveredTool.confidenceScore * 100)}%`
                : "Pending"}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-black text-slate-950">AI prep notes</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {selectedDiscoveredTool.notes ||
              "Prepared for future crawling, duplicate checks, and AI category suggestions."}
          </p>
        </div>
      </div>
    </SlideOverPanel>
  );


  if (isCheckingSession) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 text-slate-950">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 text-center shadow-xl shadow-slate-200/80 sm:rounded-2xl sm:p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-cyan-700">
            AiFinder Admin
          </p>

          <h1 className="mt-3 text-3xl font-black">Checking session...</h1>

          <p className="mt-4 text-sm text-slate-600">
            Please wait a moment.
          </p>
        </div>
      </main>
    );
  }

  if (!isUnlocked) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 text-slate-950">
        {messagePopup}

        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xl shadow-slate-200/80 sm:rounded-2xl sm:p-8">
          <p className="text-sm font-bold uppercase tracking-widest text-cyan-700">
            Admin Access
          </p>

          <h1 className="mt-3 text-xl font-black sm:text-2xl">AiFinder Admin</h1>

          <p className="mt-4 text-sm leading-7 text-slate-600">
            Enter the admin password to manage AI tools.
          </p>

          <input suppressHydrationWarning
            type="password"
            placeholder="Admin password"
            value={password}
            disabled={isLoggingIn}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isLoggingIn) {
                unlockAdmin();
              }
            }}
            className="mt-6 w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-950 outline-none placeholder:text-slate-400 focus:border-cyan-500"
          />

          <button
            onClick={unlockAdmin}
            disabled={isLoggingIn}
            className="mt-4 w-full rounded-full bg-cyan-600 px-5 py-4 text-sm font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingIn ? "Checking..." : "Unlock Dashboard"}
          </button>

          <p className="mt-4 text-xs text-slate-500">
            Admin password is checked securely on the server. A secure cookie
            session is used after login.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-slate-50 px-3 py-4 text-slate-950 sm:p-5">
      {confirmationPopup}
      {messagePopup}
      {auditLogsPopup}
      {addToolPopup}
      {adminReviewPopup}
      {liveDatabasePopup}
      {notificationPanel}
      {discoveryReviewPanel}

      <details className="mx-auto mb-4 max-w-6xl rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/80 xl:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-1 py-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-sm font-black text-cyan-700">
              AI
            </div>
            <div>
              <p className="text-sm font-black text-slate-950">AiFinder</p>
              <p className="text-xs text-slate-500">Admin Menu</p>
            </div>
          </div>
          <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700">
            Menu
          </span>
        </summary>

        <nav className="mt-3 grid gap-1.5 border-t border-slate-200 pt-3 text-sm">
          {ADMIN_NAV_ITEMS.map((item) => (
            <Link
              key={`mobile-${item.href}`}
              href={item.href}
              className={navItemClass(item.view)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={logoutAdmin}
          className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100"
        >
          Log Out
        </button>
      </details>

      <div className="mx-auto grid max-w-6xl gap-4 xl:max-w-7xl xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/80 xl:sticky xl:top-6 xl:block xl:h-[calc(100dvh-3rem)]">
          <div className="flex items-center gap-3 border-b border-slate-200 px-2 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-sm font-black text-cyan-700">
              AI
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black text-slate-950">AiFinder</p>
              <p className="text-xs text-slate-500">Admin Console</p>
            </div>
          </div>

          <nav className="mt-3 grid gap-1.5 text-sm">
            {ADMIN_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={navItemClass(item.view)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Secure Session
            </p>
            <p className="mt-2 text-xs leading-5 text-slate-600">
              CSRF, session cookies, audit logging, and route guards are active.
            </p>
          </div>

          <button
            onClick={logoutAdmin}
            className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100"
          >
            Log Out
          </button>
        </aside>

        <section className="min-w-0">
          <div className="mb-4 flex flex-col items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80 sm:flex-row sm:items-center sm:p-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
                {currentPage.eyebrow}
              </p>
              <h1 className="mt-1 text-xl font-black sm:text-2xl">
                {currentPage.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {currentPage.description}
              </p>
            </div>

            {renderPageAction()}
          </div>

          {view === "dashboard" && (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Global Admin Search
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-950">
                  Search tools, categories, URLs, and statuses
                </h2>
              </div>

              <div className="w-full xl:max-w-md">
                <input suppressHydrationWarning
                  value={globalAdminSearch}
                  onChange={(event) => setGlobalAdminSearch(event.target.value)}
                  placeholder="Search admin workspace..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-cyan-500 focus:bg-white"
                />
              </div>
            </div>

            {globalAdminSearch.trim() && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                {globalSearchResults.length === 0 ? (
                  <p className="bg-slate-50 p-4 text-sm text-slate-600">
                    No admin results found.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {globalSearchResults.map((result) => (
                      <div
                        key={result.id}
                        className="grid gap-3 bg-white px-4 py-3 text-sm sm:grid-cols-[110px_minmax(0,1fr)_130px] sm:items-center"
                      >
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                          {result.type}
                        </p>
                        <div className="min-w-0">
                          <p className="font-black text-slate-950">
                            {result.title}
                          </p>
                          <p className="mt-1 break-all text-xs text-slate-500">
                            {result.detail}
                          </p>
                        </div>
                        <SmartStatusBadge status={result.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {(view === "dashboard" || view === "analytics") && (
          <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-cyan-300/30 hover:bg-cyan-50">
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
                Tools
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {stats.totalTools}
              </p>
              <p className="mt-1 text-xs text-slate-500">Live database</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-yellow-300/30 hover:bg-amber-50">
              <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
                Pending
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {stats.pendingSubmissions}
              </p>
              <p className="mt-1 text-xs text-slate-500">Needs review</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-green-300/30 hover:bg-emerald-50">
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                Approved
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {stats.approvedSubmissions}
              </p>
              <p className="mt-1 text-xs text-slate-500">Accepted</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-purple-300/30 hover:bg-violet-50">
              <p className="text-xs font-bold uppercase tracking-widest text-violet-700">
                Audit
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">
                {auditLogs.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">Recent logs shown</p>
            </div>
          </div>
          )}

          {view === "dashboard" && (
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Quick Actions
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-950">
                  Fast admin workflows
                </h2>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <button
                onClick={() => {
                  closeSlideOvers();
                  setIsAddToolModalOpen(true);
                }}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-cyan-300 hover:bg-cyan-50"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
                  Create
                </p>
                <p className="mt-2 text-base font-black text-slate-950">
                  Add Tool
                </p>
              </button>

              <button
                onClick={openAdminReviewPanel}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-amber-300 hover:bg-amber-50"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-amber-700">
                  Review
                </p>
                <p className="mt-2 text-base font-black text-slate-950">
                  Pending Tools
                </p>
              </button>

              <Link
                href="/admin/analytics"
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                  Reports
                </p>
                <p className="mt-2 text-base font-black text-slate-950">
                  View Reports
                </p>
              </Link>

              <Link
                href="/admin/discovery"
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-cyan-300 hover:bg-cyan-50"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-700">
                  Discovery
                </p>
                <p className="mt-2 text-base font-black text-slate-950">
                  Discovered Tools
                </p>
              </Link>

              <button
                onClick={() => {
                  setToolCategoryFilter("All");
                  closeSlideOvers();
                  setIsLiveDatabaseModalOpen(true);
                }}
                className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
              >
                <p className="text-xs font-bold uppercase tracking-widest text-blue-700">
                  Taxonomy
                </p>
                <p className="mt-2 text-base font-black text-slate-950">
                  Manage Categories
                </p>
              </button>
            </div>
          </div>
          )}

          {view === "tools" && (
            <div className="mb-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      Live Tools
                    </p>
                    <h2 className="mt-1 text-lg font-black text-slate-950">
                      Database management
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Open the existing live database manager to search, filter,
                      edit, archive, or refresh tools without changing backend
                      behavior.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      onClick={() => {
                        closeSlideOvers();
                        setIsAddToolModalOpen(true);
                      }}
                      className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-cyan-700"
                    >
                      Add Tool
                    </button>
                    <button
                      onClick={() => {
                        closeSlideOvers();
                        setIsLiveDatabaseModalOpen(true);
                      }}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Manage Tools
                    </button>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-[1fr_120px_90px] gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-600">
                    <span>Tool</span>
                    <span>Category</span>
                    <span>Status</span>
                  </div>
                  <div className="divide-y divide-slate-200">
                    {tools.slice(0, 5).map((tool) => (
                      <div
                        key={tool.id || tool.name}
                        className="grid gap-3 px-4 py-3 text-sm sm:grid-cols-[1fr_120px_90px] sm:items-center"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-black text-slate-950">
                            {tool.name}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {tool.website}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600">
                          {tool.category}
                        </span>
                        <SmartStatusBadge
                          status={
                            tool.status === "archived" || tool.deleted_at
                              ? "Archived"
                              : "Online"
                          }
                        />
                      </div>
                    ))}
                    {tools.length === 0 && (
                      <p className="bg-slate-50 p-4 text-sm text-slate-600">
                        No live tools loaded yet. Refresh or manage tools to
                        inspect the database.
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
                <div className="mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Categories
                  </p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">
                    Taxonomy overview
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(toolCategories.length > 0 ? toolCategories : TOOL_CATEGORIES).map(
                    (categoryName) => (
                      <span
                        key={categoryName}
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700"
                      >
                        {categoryName}
                      </span>
                    )
                  )}
                </div>
              </section>
            </div>
          )}

          {view === "analytics" && (
            <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[
                ["Growth Overview", "+12%", "Placeholder monthly directory growth."],
                ["Submission Analytics", `${stats.pendingSubmissions}`, "Current pending review volume."],
                ["Trending Prep", "Ready", "Future trending tools and categories module."],
              ].map(([title, value, detail]) => (
                <section
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80"
                >
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    {title}
                  </p>
                  <p className="mt-3 text-xl font-black text-slate-950">
                    {value}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {detail}
                  </p>
                </section>
              ))}
            </div>
          )}

          {view === "settings" && (
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              {[
                ["General", "Core admin workspace defaults and directory controls."],
                ["Branding", "Logo, naming, and visual presentation settings."],
                ["Categories", "Taxonomy management and category ordering prep."],
                ["AI Settings", "Future recommendations, discovery, and moderation tuning."],
                ["Admin Preferences", "Notification, table density, and workflow preferences."],
              ].map(([title, detail]) => (
                <section
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80"
                >
                  <p className="text-sm font-black text-slate-950">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {detail}
                  </p>
                  <span className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                    Placeholder
                  </span>
                </section>
              ))}
            </div>
          )}

          {view === "settings" && (
            <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Homepage Controls
                  </p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">
                    Homepage Control Room Blueprint
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Future safe controls may manage homepage text, section
                    visibility, section order, starter chips, featured tools,
                    and visual presets.
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-600">
                  Roadmap Only
                </span>
              </div>

              <div
                className={`mb-3 rounded-2xl border p-3 ${
                  HOMEPAGE_CONTROL_READINESS.isReady
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Control Room readiness
                    </p>
                    <p
                      className={`mt-1 text-xs leading-5 ${
                        HOMEPAGE_CONTROL_READINESS.isReady
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {HOMEPAGE_CONTROL_READINESS.isReady
                        ? "Ready"
                        : "Needs review"}
                      {HOMEPAGE_CONTROL_READINESS.errors.length > 0 &&
                        ` - ${HOMEPAGE_CONTROL_READINESS.errors.length} error${
                          HOMEPAGE_CONTROL_READINESS.errors.length === 1
                            ? ""
                            : "s"
                        }`}
                      {HOMEPAGE_CONTROL_READINESS.warnings.length > 0 &&
                        ` - ${
                          HOMEPAGE_CONTROL_READINESS.warnings.length
                        } warning${
                          HOMEPAGE_CONTROL_READINESS.warnings.length === 1
                            ? ""
                            : "s"
                        }`}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border bg-white px-3 py-1 text-xs font-bold ${
                      HOMEPAGE_CONTROL_READINESS.isReady
                        ? "border-emerald-200 text-emerald-700"
                        : "border-amber-200 text-amber-700"
                    }`}
                  >
                    {HOMEPAGE_CONTROL_READINESS.isReady
                      ? "Ready"
                      : "Review"}
                  </span>
                </div>

                {(HOMEPAGE_CONTROL_READINESS.errors.length > 0 ||
                  HOMEPAGE_CONTROL_READINESS.warnings.length > 0) && (
                  <div className="mt-2 space-y-2 text-xs leading-5">
                    {HOMEPAGE_CONTROL_READINESS.errors.length > 0 && (
                      <ul className="space-y-1 text-amber-700">
                        {HOMEPAGE_CONTROL_READINESS.errors.map((error) => (
                          <li key={error}>{error}</li>
                        ))}
                      </ul>
                    )}
                    {HOMEPAGE_CONTROL_READINESS.warnings.length > 0 && (
                      <ul className="space-y-1 text-slate-600">
                        {HOMEPAGE_CONTROL_READINESS.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <Link
                href="/admin/homepage-control"
                className="mb-3 flex flex-col gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 p-3 transition hover:border-cyan-300 hover:bg-cyan-100 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-black text-slate-950">
                    Homepage Control Room
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Create and review draft homepage configs. Draft-only. Does
                    not affect the live homepage.
                  </p>
                </div>
                <span className="inline-flex w-fit shrink-0 rounded-full border border-cyan-200 bg-white px-3 py-1 text-xs font-bold text-cyan-700">
                  Open draft room
                </span>
              </Link>

              <div
                className={`mb-3 rounded-2xl border p-3 ${
                  DEFAULT_HOMEPAGE_CONFIG_IS_VALID
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Default config validation
                    </p>
                    <p
                      className={`mt-1 text-xs leading-5 ${
                        DEFAULT_HOMEPAGE_CONFIG_IS_VALID
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {DEFAULT_HOMEPAGE_CONFIG_IS_VALID
                        ? "Default config: valid"
                        : "Default config needs review"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border bg-white px-3 py-1 text-xs font-bold ${
                      DEFAULT_HOMEPAGE_CONFIG_IS_VALID
                        ? "border-emerald-200 text-emerald-700"
                        : "border-amber-200 text-amber-700"
                    }`}
                  >
                    {DEFAULT_HOMEPAGE_CONFIG_IS_VALID ? "Valid" : "Review"}
                  </span>
                </div>

                {!DEFAULT_HOMEPAGE_CONFIG_IS_VALID && (
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-700">
                    {DEFAULT_HOMEPAGE_CONFIG_ERRORS.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div
                className={`mb-3 rounded-2xl border p-3 ${
                  DEFAULT_HOMEPAGE_CONTENT_IS_VALID
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Default content validation
                    </p>
                    <p
                      className={`mt-1 text-xs leading-5 ${
                        DEFAULT_HOMEPAGE_CONTENT_IS_VALID
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {DEFAULT_HOMEPAGE_CONTENT_IS_VALID
                        ? "Default content: valid"
                        : "Default content needs review"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border bg-white px-3 py-1 text-xs font-bold ${
                      DEFAULT_HOMEPAGE_CONTENT_IS_VALID
                        ? "border-emerald-200 text-emerald-700"
                        : "border-amber-200 text-amber-700"
                    }`}
                  >
                    {DEFAULT_HOMEPAGE_CONTENT_IS_VALID ? "Valid" : "Review"}
                  </span>
                </div>

                {!DEFAULT_HOMEPAGE_CONTENT_IS_VALID && (
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-700">
                    {DEFAULT_HOMEPAGE_CONTENT_ERRORS.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Default content preview
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {([
                    ["heroTitle", DEFAULT_HOMEPAGE_CONTENT_CONFIG.heroTitle],
                    [
                      "heroSubtitle",
                      DEFAULT_HOMEPAGE_CONTENT_CONFIG.heroSubtitle,
                    ],
                    [
                      "primaryCtaLabel",
                      DEFAULT_HOMEPAGE_CONTENT_CONFIG.primaryCtaLabel,
                    ],
                    [
                      "secondaryCtaLabel",
                      DEFAULT_HOMEPAGE_CONTENT_CONFIG.secondaryCtaLabel,
                    ],
                    [
                      "starterSearchHeading",
                      DEFAULT_HOMEPAGE_CONTENT_CONFIG.starterSearchHeading,
                    ],
                    [
                      "featuredToolsHeading",
                      DEFAULT_HOMEPAGE_CONTENT_CONFIG.featuredToolsHeading,
                    ],
                  ] as const).map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-xs font-bold text-slate-500">
                        {label}
                      </p>
                      <p className="mt-1 break-words text-sm font-bold leading-6 text-slate-950">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`mb-3 rounded-2xl border p-3 ${
                  DEFAULT_HOMEPAGE_TOOL_PLACEMENTS_ARE_VALID
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Default placement validation
                    </p>
                    <p
                      className={`mt-1 text-xs leading-5 ${
                        DEFAULT_HOMEPAGE_TOOL_PLACEMENTS_ARE_VALID
                          ? "text-emerald-700"
                          : "text-amber-700"
                      }`}
                    >
                      {DEFAULT_HOMEPAGE_TOOL_PLACEMENTS_ARE_VALID
                        ? "Default placements: valid"
                        : "Default placements need review"}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full border bg-white px-3 py-1 text-xs font-bold ${
                      DEFAULT_HOMEPAGE_TOOL_PLACEMENTS_ARE_VALID
                        ? "border-emerald-200 text-emerald-700"
                        : "border-amber-200 text-amber-700"
                    }`}
                  >
                    {DEFAULT_HOMEPAGE_TOOL_PLACEMENTS_ARE_VALID
                      ? "Valid"
                      : "Review"}
                  </span>
                </div>

                {!DEFAULT_HOMEPAGE_TOOL_PLACEMENTS_ARE_VALID && (
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-700">
                    {DEFAULT_HOMEPAGE_TOOL_PLACEMENT_ERRORS.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Tool placement blueprint
                </p>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {DEFAULT_HOMEPAGE_TOOL_PLACEMENTS.map((placement) => (
                    <div
                      key={placement.placementId}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-black text-slate-950">
                            {placement.title}
                          </p>
                          <p className="mt-1 break-words text-xs font-bold text-slate-500">
                            {placement.placementId}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                          {placement.enabled ? "Enabled" : "Off"}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="font-bold text-slate-500">Max items</p>
                          <p className="mt-1 font-black text-slate-950">
                            {placement.maxItems}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-500">Tool slugs</p>
                          <p className="mt-1 font-black text-slate-950">
                            {placement.toolSlugs.length}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Visual preset descriptions
                </p>
                <div className="mt-3 grid gap-3 xl:grid-cols-2">
                  {([
                    ["Layout presets", HOMEPAGE_LAYOUT_PRESET_DETAILS],
                    ["Density presets", HOMEPAGE_DENSITY_PRESET_DETAILS],
                  ] as const).map(([title, presets]) => (
                    <div
                      key={title}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <p className="text-sm font-black text-slate-950">
                        {title}
                      </p>
                      <div className="mt-3 space-y-2">
                        {presets.map((preset) => (
                          <div
                            key={preset.id}
                            className="rounded-xl border border-slate-200 bg-white p-3"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <p className="text-sm font-black text-slate-950">
                                {preset.label}
                              </p>
                              <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-600">
                                {preset.id}
                              </span>
                            </div>
                            <p className="mt-2 break-words text-xs leading-5 text-slate-600">
                              {preset.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Audit trail blueprint
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Future homepage control changes should be tracked before
                  publish.
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {HOMEPAGE_CONTROL_AUDIT_ACTIONS.map((action) => (
                    <span
                      key={action}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Publish workflow blueprint
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Future homepage edits should move through controlled workflow
                  states.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(HOMEPAGE_CONTROL_STATUS_TRANSITIONS).flatMap(
                    ([from, targets]) =>
                      targets.map((to) => (
                        <div
                          key={`${from}-${to}`}
                          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700"
                        >
                          {from} -&gt; {to}
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="mb-3 rounded-2xl border border-slate-200 bg-white p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Pre-publish checklist blueprint
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Future homepage publishing should pass required safety checks
                  before going live.
                </p>
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {HOMEPAGE_PRE_PUBLISH_CHECKLIST.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <p className="text-sm font-black text-slate-950">
                          {item.label}
                        </p>
                        <span className="inline-flex w-fit shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600">
                          {item.required ? "Required" : "Optional"}
                        </span>
                      </div>
                      <p className="mt-2 break-words text-xs leading-5 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-3 grid gap-3 lg:grid-cols-4">
                {([
                  ["Safe sections", HOMEPAGE_SECTION_IDS],
                  ["Layout presets", HOMEPAGE_LAYOUT_PRESETS],
                  ["Density presets", HOMEPAGE_DENSITY_PRESETS],
                  ["Publish statuses", HOMEPAGE_PUBLISH_STATUSES],
                ] as const).map(([title, options]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      {title}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {options.map((option) => (
                        <span
                          key={option}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700"
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-950">
                    Preset-based controls
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Controls should use approved presets, not raw CSS or
                    one-off layout overrides.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-950">
                    Draft to publish
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Draft -&gt; Preview -&gt; Publish should be required before
                    any live homepage changes.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-950">
                    Responsive safety
                  </p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">
                    Mobile and responsive safety must stay protected. No
                    homepage settings are connected yet.
                  </p>
                </div>
              </div>
            </section>
          )}

          {view === "discovery-tool-detail" && discoveryToolId && (
            <DiscoveryToolDetail toolId={discoveryToolId} />
          )}

          {view === "discovery-tools" && (
            <DiscoveryQueueTable />
          )}

          {view === "discovery" && (
            <section
              id="discovery-intake"
              className="mb-4 scroll-mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80"
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Discovered Tools
                  </p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">
                    Future crawler intake
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Placeholder candidates use the new DiscoveredTool structure.
                    No crawling or persistence is connected yet.
                  </p>
                </div>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan-700">
                  Preparation Only
                </span>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="hidden grid-cols-[1.1fr_1fr_120px_90px_82px] gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 xl:grid">
                  <span>Candidate</span>
                  <span>Source</span>
                  <span>Status</span>
                  <span>Confidence</span>
                  <span>Action</span>
                </div>
                <div className="divide-y divide-slate-200">
                  {placeholderDiscoveredTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="grid gap-3 px-4 py-4 text-sm xl:grid-cols-[1.1fr_1fr_120px_90px_82px] xl:items-center"
                    >
                      <div className="min-w-0">
                        <p className="font-black text-slate-950">
                          {tool.name}
                        </p>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {tool.website}
                        </p>
                        {tool.category && (
                          <span className="mt-2 inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-700">
                            {tool.category}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-5 text-slate-600">
                        {tool.source}
                      </p>
                      <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">
                        {discoveredToolStatusLabels[tool.status]}
                      </span>
                      <p className="text-xs font-bold text-slate-600">
                        {tool.confidenceScore
                          ? `${Math.round(tool.confidenceScore * 100)}%`
                          : "Pending"}
                      </p>
                      <button
                        onClick={() => openDiscoveryReviewPanel(tool)}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {view === "discovery" && (
            <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Search Quality
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-950">
                  Search Quality Guardrails
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Search aliases are conservative and curated. Phrase matching
                  must remain word-boundary safe, and build passing is not
                  enough; manual search QA is required.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-950">
                    Avoid substring noise
                  </p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
                    <li>artisan -&gt; art</li>
                    <li>cart -&gt; art</li>
                    <li>cartoon -&gt; art</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-950">
                    Simple plural variants
                  </p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
                    <li>website builders</li>
                    <li>voice generators</li>
                    <li>AI assistants</li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-black text-slate-950">
                    Double-s safety
                  </p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-600">
                    <li>business</li>
                    <li>process</li>
                    <li>class</li>
                    <li>glass</li>
                  </ul>
                </div>
              </div>
            </section>
          )}

          {view === "security" && (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-950">Security Status</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                Cookie session, CSRF, route guard, RLS, storage restrictions,
                security headers, and audit logs are active.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-950">Review Safety</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                User-submitted links are reviewed safely. No iframe or website
                preview is loaded in the admin dashboard.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-950">Audit Archive</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                Older logs are compressed into downloadable archives after the
                live log limit is reached.
              </p>
            </div>
          </div>
          )}

          {(view === "dashboard" || view === "security") && (
          <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Recent Activity
                  </p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">
                    Latest admin signals
                  </h2>
                </div>
                <button
                  onClick={() => {
                    closeSlideOvers();
                    setIsAuditLogModalOpen(true);
                    fetchAuditLogs();
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Audit Logs
                </button>
              </div>

              <div className="divide-y divide-slate-200">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="grid gap-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_120px_92px] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-950">
                        {activity.action}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {activity.target}
                      </p>
                    </div>
                    <SmartStatusBadge status={activity.status} />
                    <p className="text-xs font-medium text-slate-500">
                      {activity.time}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Notifications
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-950">
                  Admin alerts
                </h2>
              </div>

              <div className="space-y-3">
                {adminNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {notification.message}
                        </p>
                      </div>
                      <SmartStatusBadge status={notification.status} />
                    </div>
                    <button
                      onClick={() => openNotificationPanel(notification)}
                      className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Details
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
          )}

          {view === "notifications" && (
            <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Notifications
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-950">
                  Admin alerts and system events
                </h2>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {adminNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-600">
                          {notification.message}
                        </p>
                      </div>
                      <SmartStatusBadge status={notification.status} />
                    </div>
                    <button
                      onClick={() => openNotificationPanel(notification)}
                      className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Details
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(view === "moderation" || view === "discovery") && (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Tool Moderation Queue
                  </p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">
                    Review intelligence prep
                  </h2>
                </div>
                <button
                  onClick={openAdminReviewPanel}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Open Review
                </button>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="hidden grid-cols-[1fr_120px_130px] gap-3 border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-600 md:grid">
                  <span>Tool</span>
                  <span>Status</span>
                  <span>Suggested</span>
                </div>
                <div className="divide-y divide-slate-200">
                  {moderationQueue.map((item) => (
                    <div
                      key={item.id}
                      className="grid gap-3 px-4 py-3 text-sm md:grid-cols-[1fr_120px_130px] md:items-center"
                    >
                      <div>
                        <p className="font-black text-slate-950">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.source}
                        </p>
                      </div>
                      <SmartStatusBadge status={item.status} />
                      <span className="inline-flex rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs font-bold text-cyan-700">
                        {item.suggestedCategory}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Duplicate Detector Prep
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-950">
                  Possible duplicate warnings
                </h2>
              </div>

              <div className="space-y-3">
                {possibleDuplicateWarnings.map((warning) => (
                  <div
                    key={warning.id}
                    className="rounded-2xl border border-violet-200 bg-violet-50 p-3"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {warning.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          Similar to {warning.matchedWith} • {warning.reason}
                        </p>
                      </div>
                      <span className="inline-flex rounded-full border border-violet-200 bg-white px-2.5 py-1 text-xs font-bold text-violet-700">
                        Possible Duplicate
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
          )}

          {(view === "discovery" || view === "tools") && (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Auto Category Suggestion Prep
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-950">
                  Future AI recommendations
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {moderationQueue.slice(0, 4).map((item) => (
                  <div
                    key={`category-${item.id}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <p className="text-sm font-black text-slate-950">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Suggested category
                    </p>
                    <span className="mt-2 inline-flex rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-xs font-bold text-cyan-700">
                      {item.suggestedCategory}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
              <div className="mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  Tool Health Status
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-950">
                  Lightweight availability signals
                </h2>
              </div>

              <div className="space-y-3">
                {toolHealthItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-950">
                        {item.name}
                      </p>
                      <p className="mt-1 break-all text-xs text-slate-500">
                        {item.url}
                      </p>
                    </div>
                    <SmartStatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            </section>
          </div>
          )}

        {editingSubmission && (
          <SlideOverPanel
            eyebrow="Review Tool"
            title={editingSubmission.name}
            description="Edit this submitted tool while keeping the moderation context behind the panel."
            accent="amber"
            onClose={closeSlideOvers}
          >
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <input suppressHydrationWarning
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-amber-500 focus:bg-white"
                  placeholder="Tool Name"
                  value={submissionEditName}
                  maxLength={80}
                  onChange={(e) => setSubmissionEditName(e.target.value)}
                />

                <select suppressHydrationWarning
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white"
                  value={submissionEditCategory}
                  onChange={(e) =>
                    setSubmissionEditCategory(e.target.value)
                  }
                >
                  <option className="bg-white" value="">
                    Select category
                  </option>

                  {TOOL_CATEGORIES.map((item) => (
                    <option className="bg-white" key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <input suppressHydrationWarning
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-amber-500 focus:bg-white"
                  placeholder="Website URL"
                  value={submissionEditWebsite}
                  maxLength={500}
                  onChange={(e) => setSubmissionEditWebsite(e.target.value)}
                />

                <select suppressHydrationWarning
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white"
                  value={submissionEditPricing}
                  onChange={(e) => setSubmissionEditPricing(e.target.value)}
                >
                  <option className="bg-white" value="">
                    Select pricing
                  </option>

                  {PRICING_OPTIONS.map((item) => (
                    <option className="bg-white" key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <div className="sm:col-span-2">
                  <div className="grid grid-cols-[minmax(0,1fr)_64px] gap-3 sm:grid-cols-[1fr_76px]">
                    <input suppressHydrationWarning
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-amber-500 focus:bg-white"
                      placeholder="Logo Image URL"
                      value={submissionEditLogoUrl}
                      maxLength={500}
                      onChange={(e) =>
                        setSubmissionEditLogoUrl(e.target.value)
                      }
                    />

                    <label className="flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100">
                      {isUploadingSubmissionLogo ? (
                        <span className="text-xl">…</span>
                      ) : (
                        <UploadIcon />
                      )}

                      <input suppressHydrationWarning
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];

                          if (file) {
                            await uploadLogoFile(
                              file,
                              setSubmissionEditLogoUrl,
                              setIsUploadingSubmissionLogo
                            );
                          }

                          event.target.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    For security, submitted logo URLs are not auto-previewed
                    here. Open the logo link safely if you need to review it.
                  </p>
                </div>
              </div>

              {submissionEditLogoUrl && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="break-all text-xs text-slate-600">
                    {submissionEditLogoUrl}
                  </p>

                  <div className="mt-3">
                    <SafeExternalLink
                      url={submissionEditLogoUrl}
                      label="Review Logo"
                      accent="yellow"
                    />
                  </div>
                </div>
              )}

              <textarea suppressHydrationWarning
                className="mt-4 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-amber-500 focus:bg-white"
                placeholder="Description"
                value={submissionEditDescription}
                maxLength={500}
                onChange={(e) =>
                  setSubmissionEditDescription(e.target.value)
                }
                rows={5}
              />

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  onClick={updateSubmission}
                  className="w-full rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-500 sm:w-auto"
                >
                  Save Submission
                </button>

                <button
                  onClick={closeSubmissionEditModal}
                  className="w-full rounded-full border border-slate-200 px-6 py-3 text-sm hover:bg-slate-100 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
          </SlideOverPanel>
        )}

        {editingTool && (
          <SlideOverPanel
            eyebrow="Edit Tool"
            title={editingTool.name}
            description="Update the live tool listing without leaving the Tools context."
            accent="cyan"
            onClose={closeSlideOvers}
          >
              <div className="mt-6 space-y-4">
                <section className={adminFormSectionClass}>
                  <div>
                    <h2 className="text-lg font-bold text-slate-950">
                      Tool details
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Update the live listing fields shown in the public directory.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className={adminFormFieldClass}>
                      <Label
                        className={adminFormLabelClass}
                        htmlFor="admin-edit-name"
                      >
                        Tool name <span className="text-cyan-700">*</span>
                      </Label>
                      <Input
                        suppressHydrationWarning
                        id="admin-edit-name"
                        className={adminFormControlClass}
                        placeholder="Tool name"
                        value={editName}
                        maxLength={80}
                        aria-required="true"
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>

                    <div className={adminFormFieldClass}>
                      <Label
                        className={adminFormLabelClass}
                        htmlFor="admin-edit-category"
                      >
                        Category <span className="text-cyan-700">*</span>
                      </Label>
                      <select
                        id="admin-edit-category"
                        className={`${adminFormControlClass} appearance-auto bg-white text-slate-950`}
                        value={editCategory || SELECT_EMPTY_VALUE}
                        onChange={(e) =>
                          setEditCategory(
                            e.target.value === SELECT_EMPTY_VALUE ? "" : e.target.value
                          )
                        }
                        aria-required="true"
                      >
                        <option value={SELECT_EMPTY_VALUE}>Select category</option>
                        {TOOL_CATEGORIES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={adminFormFieldClass}>
                      <Label
                        className={adminFormLabelClass}
                        htmlFor="admin-edit-website"
                      >
                        Website URL <span className="text-cyan-700">*</span>
                      </Label>
                      <Input
                        suppressHydrationWarning
                        id="admin-edit-website"
                        className={adminFormControlClass}
                        placeholder="https://example.com"
                        value={editWebsite}
                        maxLength={500}
                        aria-required="true"
                        onChange={(e) => setEditWebsite(e.target.value)}
                      />
                    </div>

                    <div className={adminFormFieldClass}>
                      <Label
                        className={adminFormLabelClass}
                        htmlFor="admin-edit-pricing"
                      >
                        Pricing
                      </Label>
                      <select
                        id="admin-edit-pricing"
                        className={`${adminFormControlClass} appearance-auto bg-white text-slate-950`}
                        value={editPricing || SELECT_EMPTY_VALUE}
                        onChange={(e) =>
                          setEditPricing(
                            e.target.value === SELECT_EMPTY_VALUE ? "" : e.target.value
                          )
                        }
                      >
                        <option value={SELECT_EMPTY_VALUE}>Select pricing</option>
                        {PRICING_OPTIONS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </section>

                <section className={adminFormSectionClass}>
                  <div>
                    <h3 className="text-base font-bold text-slate-950">
                      Logo
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Keep the current logo URL or upload a replacement image.
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-[minmax(0,1fr)_64px] gap-3 sm:grid-cols-[1fr_76px]">
                    <div className={adminFormFieldClass}>
                      <Label
                        className={adminFormLabelClass}
                        htmlFor="admin-edit-logo"
                      >
                        Logo image URL
                      </Label>
                      <Input
                        suppressHydrationWarning
                        id="admin-edit-logo"
                        className={adminFormControlClass}
                        placeholder="https://example.com/logo.png"
                        value={editLogoUrl}
                        maxLength={500}
                        aria-describedby="admin-edit-logo-help"
                        onChange={(e) => setEditLogoUrl(e.target.value)}
                      />
                    </div>

                    <Label
                      htmlFor="admin-edit-logo-file"
                      className="mt-7 flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 focus-within:ring-[3px] focus-within:ring-cyan-500/20"
                      aria-label="Upload replacement logo file"
                    >
                      {isUploadingEditLogo ? (
                        <span className="text-xl">…</span>
                      ) : (
                        <UploadIcon />
                      )}

                      <Input
                        suppressHydrationWarning
                        id="admin-edit-logo-file"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="sr-only"
                        onChange={async (event) => {
                          const file = event.target.files?.[0];

                          if (file) {
                            await uploadLogoFile(
                              file,
                              setEditLogoUrl,
                              setIsUploadingEditLogo
                            );
                          }

                          event.target.value = "";
                        }}
                      />
                    </Label>
                  </div>

                  <p id="admin-edit-logo-help" className={`mt-2 ${adminFormHelpClass}`}>
                    Admin logo upload accepts PNG, JPG, JPEG, or WEBP only.
                  </p>

                  {editLogoUrl && (
                    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <LogoPreview
                        logoUrl={editLogoUrl}
                        name={editName || "Tool"}
                        accent="cyan"
                      />
                      <p className="break-all text-xs text-slate-600">
                        {editLogoUrl}
                      </p>
                    </div>
                  )}
                </section>

                <section className={adminFormSectionClass}>
                  <div className={adminFormFieldClass}>
                    <Label
                      className={adminFormLabelClass}
                      htmlFor="admin-edit-description"
                    >
                      Description <span className="text-cyan-700">*</span>
                    </Label>
                    <Textarea
                      suppressHydrationWarning
                      id="admin-edit-description"
                      className={`${adminFormControlClass} min-h-32 resize-y`}
                      placeholder="Description"
                      value={editDescription}
                      maxLength={500}
                      aria-required="true"
                      aria-describedby="admin-edit-description-help"
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={5}
                    />
                    <p
                      id="admin-edit-description-help"
                      className={adminFormHelpClass}
                    >
                      Maximum 500 characters.
                    </p>
                  </div>
                </section>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    type="button"
                    onClick={updateTool}
                    variant="ghost"
                    className="h-auto w-full rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-cyan-700 sm:w-auto"
                  >
                    Save Changes
                  </Button>

                  <Button
                    type="button"
                    onClick={closeEditModal}
                    variant="ghost"
                    className="h-auto w-full rounded-full border border-slate-200 px-6 py-3 text-sm text-slate-950 hover:bg-slate-100 sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
          </SlideOverPanel>
        )}
      </section>
      </div>
    </main>
  );
}
