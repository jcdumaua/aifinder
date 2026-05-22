"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

type Tool = {
  id?: number;
  name: string;
  category: string;
  description: string;
  website: string;
  pricing?: string | null;
  logo_url?: string | null;
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

const CATEGORIES = [
  "Chatbots",
  "Image AI",
  "Video AI",
  "Voice AI",
  "Writing",
  "Coding",
  "Business",
  "Productivity",
  "Education AI",
  "Marketing AI",
  "SEO AI",
  "Design AI",
  "AI Agents",
];

const PRICING_OPTIONS = ["Free + Paid", "Free", "Paid"];

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
      <span className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300">
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
          ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-200 hover:bg-yellow-400/20"
          : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/20"
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
        className="h-14 w-14 rounded-2xl border border-white/10 bg-white object-contain p-2"
        onError={() => setLogoError(true)}
      />
    );
  }

  return (
    <div
      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${
        accent === "cyan"
          ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
          : "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
      } text-xl font-black`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function SubmissionSafeIcon({ name }: { name: string }) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-400/10 text-xl font-black text-yellow-300">
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

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");

  const [tools, setTools] = useState<Tool[]>([]);
  const [submissions, setSubmissions] = useState<SubmittedTool[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [auditArchives, setAuditArchives] = useState<AdminAuditArchive[]>([]);
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false);
  const [isAuditLogModalOpen, setIsAuditLogModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isAddToolModalOpen, setIsAddToolModalOpen] = useState(false);
  const [isAdminReviewModalOpen, setIsAdminReviewModalOpen] = useState(false);
  const [isLiveDatabaseModalOpen, setIsLiveDatabaseModalOpen] = useState(false);

  const [stats, setStats] = useState<AdminStats>({
    totalTools: 0,
    pendingSubmissions: 0,
    approvedSubmissions: 0,
    rejectedSubmissions: 0,
  });

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

  function showSuccess(message: string, title = "Success") {
    setPopup({
      type: "success",
      title,
      message,
    });
  }

  function showError(message: string, title = "Action Failed") {
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
      showSuccess("Logo uploaded successfully.", "Logo Uploaded");
      fetchAuditLogs();
    } catch {
      showError("Failed to upload logo.");
    } finally {
      setUploading(false);
    }
  }

  async function fetchTools() {
    const { data, error } = await supabase
      .from("tools")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setTools(data);
    }
  }

  async function fetchSubmissions() {
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
    checkAdminSession();
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      fetchTools();
      fetchSubmissions();
      fetchAuditLogs();
      fetchCsrfToken();
    }
  }, [isUnlocked]);

  async function addTool() {
    if (!name || !category || !description || !website) {
      showError("Please fill all required fields.");
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
      title: "Delete Tool?",
      message:
        "This will remove the tool from the live AiFinder database. This action cannot be undone.",
      confirmLabel: "Delete",
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
          showError(result?.error || "Failed to delete tool.");
          return;
        }

        showSuccess("Tool deleted successfully.", "Tool Deleted");

        fetchTools();
        fetchSubmissions();
        fetchAuditLogs();
      },
    });
  }

  const isSuccessPopup = popup?.type === "success";

  const messagePopup = popup && (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-md rounded-[2rem] border p-7 text-center shadow-2xl ${
          isSuccessPopup
            ? "border-green-400/30 bg-slate-950"
            : "border-red-400/30 bg-slate-950"
        }`}
      >
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-4xl font-black ${
            isSuccessPopup
              ? "bg-green-400/15 text-green-300"
              : "bg-red-400/15 text-red-300"
          }`}
        >
          {isSuccessPopup ? "✓" : "!"}
        </div>

        <h2 className="mt-5 text-2xl font-black text-white">
          {popup.title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          {popup.message}
        </p>

        <button
          onClick={() => setPopup(null)}
          className={`mt-6 rounded-full px-7 py-3 text-sm font-bold text-slate-950 ${
            isSuccessPopup
              ? "bg-green-400 hover:bg-green-300"
              : "bg-red-400 hover:bg-red-300"
          }`}
        >
          OK
        </button>
      </div>
    </div>
  );

  const confirmationPopup = confirmDialog && (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/80 px-6 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-950 p-7 text-center shadow-2xl">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-4xl font-black ${
            confirmDialog.confirmTone === "green"
              ? "bg-green-400/15 text-green-300"
              : confirmDialog.confirmTone === "red"
                ? "bg-red-400/15 text-red-300"
                : "bg-yellow-400/15 text-yellow-300"
          }`}
        >
          ?
        </div>

        <h2 className="mt-5 text-2xl font-black text-white">
          {confirmDialog.title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-300">
          {confirmDialog.message}
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => setConfirmDialog(null)}
            disabled={isConfirming}
            className="rounded-full border border-white/10 px-7 py-3 text-sm font-bold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            onClick={runConfirmAction}
            disabled={isConfirming}
            className={`rounded-full px-7 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60 ${
              confirmDialog.confirmTone === "green"
                ? "bg-green-400 hover:bg-green-300"
                : confirmDialog.confirmTone === "red"
                  ? "bg-red-400 hover:bg-red-300"
                  : "bg-yellow-400 hover:bg-yellow-300"
            }`}
          >
            {isConfirming ? "Working..." : confirmDialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );

  const auditLogsPopup = isAuditLogModalOpen && (
    <div
      className="fixed inset-0 z-[9997] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[88vh] w-full max-w-6xl flex-col rounded-[2rem] border border-purple-400/20 bg-slate-950 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-purple-300">
              Security Audit
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              Recent Admin Activity
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Latest 50 logs stay visible. When live logs go over 100, the oldest
              logs are compressed into a small .json.gz archive with date and time.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchAuditLogs}
              disabled={isLoadingAuditLogs}
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingAuditLogs ? "Loading..." : "Refresh Logs"}
            </button>

            <button
              onClick={() => setIsAuditLogModalOpen(false)}
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>

        <div className="space-y-6 overflow-y-auto p-6">
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black text-white">
                  Live Audit Logs
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Shows the newest activity. Older logs are archived automatically after 100 live logs.
                </p>
              </div>

              <span className="rounded-full border border-purple-400/20 bg-purple-400/10 px-4 py-2 text-xs font-bold text-purple-200">
                {auditLogs.length} shown
              </span>
            </div>

            {auditLogs.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                No audit logs yet. Try logging out/in or adding a test tool.
              </p>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-white/10">
                <div className="hidden grid-cols-[170px_1fr_1fr_120px] gap-4 border-b border-white/10 bg-black/30 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 md:grid">
                  <span>Time</span>
                  <span>Action</span>
                  <span>Target</span>
                  <span>IP</span>
                </div>

                <div className="divide-y divide-white/10">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="grid gap-2 px-5 py-4 text-sm md:grid-cols-[170px_1fr_1fr_120px] md:gap-4"
                    >
                      <p className="text-slate-400">
                        {formatAuditDate(log.created_at)}
                      </p>

                      <p className="font-bold text-white">
                        {formatAuditAction(log.action)}
                      </p>

                      <p className="break-words text-slate-300">
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
                <h3 className="text-xl font-black text-white">
                  Compressed Archives
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Download or delete archived logs. Files are stored privately in Supabase Storage.
                </p>
              </div>

              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-bold text-cyan-200">
                {auditArchives.length} archive{auditArchives.length === 1 ? "" : "s"}
              </span>
            </div>

            {auditArchives.length === 0 ? (
              <p className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                No compressed audit archives yet. Archives appear after live logs go over 100.
              </p>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-white/10">
                <div className="hidden grid-cols-[1fr_100px_100px_210px] gap-4 border-b border-white/10 bg-black/30 px-5 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 md:grid">
                  <span>Archive</span>
                  <span>Logs</span>
                  <span>Size</span>
                  <span>Actions</span>
                </div>

                <div className="divide-y divide-white/10">
                  {auditArchives.map((archive) => (
                    <div
                      key={archive.id}
                      className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[1fr_100px_100px_210px] md:items-center md:gap-4"
                    >
                      <div>
                        <p className="break-all font-bold text-white">
                          {archive.file_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Created {formatAuditDate(archive.created_at)}
                          {archive.first_log_at && archive.last_log_at
                            ? ` • ${formatAuditDate(archive.first_log_at)} to ${formatAuditDate(archive.last_log_at)}`
                            : ""}
                        </p>
                      </div>

                      <p className="text-slate-300">
                        {archive.log_count}
                      </p>

                      <p className="text-slate-300">
                        {formatBytes(archive.compressed_size_bytes)}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => downloadAuditArchive(archive.id)}
                          className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300"
                        >
                          Download
                        </button>

                        <button
                          onClick={() =>
                            deleteAuditArchive(archive.id, archive.file_name)
                          }
                          className="rounded-full bg-red-500 px-4 py-2 text-xs font-bold text-white hover:bg-red-600"
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
      </div>
    </div>
  );

  const statsPopup = isStatsModalOpen && (
    <div
      className="fixed inset-0 z-[9997] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-[2rem] border border-cyan-400/20 bg-slate-950 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
              Dashboard Summary
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              AiFinder Stats
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Quick overview of live tools and user submission status.
            </p>
          </div>

          <button
            onClick={() => setIsStatsModalOpen(false)}
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
                Total Tools
              </p>
              <h2 className="mt-3 text-5xl font-black">{stats.totalTools}</h2>
              <p className="mt-2 text-sm text-slate-400">
                Live tools in database
              </p>
            </div>

            <div className="rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-yellow-300">
                Pending
              </p>
              <h2 className="mt-3 text-5xl font-black">
                {stats.pendingSubmissions}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Waiting for review
              </p>
            </div>

            <div className="rounded-[2rem] border border-green-400/20 bg-green-400/10 p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-green-300">
                Approved
              </p>
              <h2 className="mt-3 text-5xl font-black">
                {stats.approvedSubmissions}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Accepted submissions
              </p>
            </div>

            <div className="rounded-[2rem] border border-red-400/20 bg-red-400/10 p-6">
              <p className="text-sm font-bold uppercase tracking-widest text-red-300">
                Rejected
              </p>
              <h2 className="mt-3 text-5xl font-black">
                {stats.rejectedSubmissions}
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Declined submissions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  const addToolPopup = isAddToolModalOpen && (
    <div
      className="fixed inset-0 z-[9997] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col rounded-[2rem] border border-cyan-400/20 bg-slate-950 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
              Add Tool
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              Add New Tool
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Add a new approved AI tool directly to the live AiFinder database.
            </p>
          </div>

          <button
            onClick={() => setIsAddToolModalOpen(false)}
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto p-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-bold">Add New Tool</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <input
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Tool Name"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
            />

            <select
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option className="bg-slate-950" value="">
                Select category
              </option>

              {CATEGORIES.map((item) => (
                <option className="bg-slate-950" key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Website URL"
              value={website}
              maxLength={500}
              onChange={(e) => setWebsite(e.target.value)}
            />

            <select
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
              value={pricing}
              onChange={(e) => setPricing(e.target.value)}
            >
              <option className="bg-slate-950" value="">
                Select pricing
              </option>

              {PRICING_OPTIONS.map((item) => (
                <option className="bg-slate-950" key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <div className="sm:col-span-2">
              <div className="grid grid-cols-[1fr_76px] gap-3">
                <input
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  placeholder="Logo Image URL"
                  value={logoUrl}
                  maxLength={500}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />

                <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-slate-400 hover:bg-white/10">
                  {isUploadingAddLogo ? (
                    <span className="text-xl">…</span>
                  ) : (
                    <UploadIcon />
                  )}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
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
                </label>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Admin logo upload accepts PNG, JPG, JPEG, or WEBP only.
              </p>
            </div>
          </div>

          {logoUrl && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
              <LogoPreview
                logoUrl={logoUrl}
                name={name || "Tool"}
                accent="cyan"
              />
              <p className="break-all text-xs text-slate-400">{logoUrl}</p>
            </div>
          )}

          <textarea
            className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
            placeholder="Description"
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />

          <button
            onClick={addTool}
            className="mt-5 rounded-full bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300"
          >
            Add Tool
          </button>
        </div>
        </div>
      </div>
    </div>
  );

  const adminReviewPopup = isAdminReviewModalOpen && (
    <div
      className="fixed inset-0 z-[9997] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[88vh] w-full max-w-6xl flex-col rounded-[2rem] border border-yellow-400/20 bg-slate-950 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-yellow-300">
              Admin Review
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              Pending User Submissions
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Review user-submitted tools safely before approving or rejecting them.
            </p>
          </div>

          <button
            onClick={() => setIsAdminReviewModalOpen(false)}
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto p-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-yellow-300">
                Admin Review
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                Pending User Submissions ({filteredSubmissions.length})
              </h2>
            </div>

            <button
              onClick={fetchSubmissions}
              className="rounded-full border border-white/10 px-5 py-3 text-sm hover:bg-white/10"
            >
              Refresh
            </button>
          </div>

          <p className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-xs leading-6 text-yellow-100">
            Security note: user-submitted websites and logo URLs are shown as
            text first. Links open only in a new protected tab. No website
            preview or iframe is loaded in the admin dashboard.
          </p>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <input
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-yellow-400"
              placeholder="Search pending submissions..."
              value={submissionSearch}
              onChange={(e) => setSubmissionSearch(e.target.value)}
            />

            <select
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-yellow-400"
              value={submissionCategoryFilter}
              onChange={(e) => setSubmissionCategoryFilter(e.target.value)}
            >
              <option className="bg-slate-950" value="All">
                All Categories
              </option>
              {submissionCategories.map((categoryName) => (
                <option
                  className="bg-slate-950"
                  key={categoryName}
                  value={categoryName}
                >
                  {categoryName}
                </option>
              ))}
            </select>
          </div>

          {filteredSubmissions.length === 0 ? (
            <p className="mt-6 text-sm text-slate-400">
              No matching pending submissions.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="rounded-3xl border border-yellow-400/20 bg-yellow-400/5 p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <SubmissionSafeIcon name={submission.name} />

                      <div>
                        <h3 className="text-xl font-bold">
                          {submission.name}
                        </h3>

                        <p className="text-sm text-yellow-300">
                          {submission.category}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
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
                          <p className="mt-2 text-xs text-slate-400">
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

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => approveSubmission(submission.id)}
                        className="rounded-full bg-green-500 px-5 py-3 text-sm font-bold text-white hover:bg-green-600"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => openSubmissionEditModal(submission)}
                        className="rounded-full bg-yellow-500 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-400"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => rejectSubmission(submission.id)}
                        className="rounded-full bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-600"
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
        </div>
      </div>
    </div>
  );

  const liveDatabasePopup = isLiveDatabaseModalOpen && (
    <div
      className="fixed inset-0 z-[9997] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex max-h-[88vh] w-full max-w-6xl flex-col rounded-[2rem] border border-cyan-400/20 bg-slate-950 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
              Live Database
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              Tools in Database
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Search, filter, edit, or delete live AiFinder tools in a popup.
            </p>
          </div>

          <button
            onClick={() => setIsLiveDatabaseModalOpen(false)}
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
                  Live Database
                </p>

                <h2 className="mt-2 text-2xl font-bold">
                  Tools in Database ({filteredTools.length})
                </h2>
              </div>

              <button
                onClick={() => {
                  setToolSearch("");
                  setToolCategoryFilter("All");
                  setToolSort("newest");
                }}
                className="rounded-full border border-white/10 px-5 py-3 text-sm hover:bg-white/10"
              >
                Clear Filters
              </button>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-3">
              <input
                className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                placeholder="Search live tools..."
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
              />

              <select
                className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
                value={toolCategoryFilter}
                onChange={(e) => setToolCategoryFilter(e.target.value)}
              >
                <option className="bg-slate-950" value="All">
                  All Categories
                </option>
                {toolCategories.map((categoryName) => (
                  <option
                    className="bg-slate-950"
                    key={categoryName}
                    value={categoryName}
                  >
                    {categoryName}
                  </option>
                ))}
              </select>

              <select
                className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
                value={toolSort}
                onChange={(e) => setToolSort(e.target.value)}
              >
                <option className="bg-slate-950" value="newest">
                  Newest First
                </option>
                <option className="bg-slate-950" value="oldest">
                  Oldest First
                </option>
              </select>
            </div>

            <div className="mt-5 space-y-4">
              {filteredTools.length === 0 ? (
                <p className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-sm text-slate-400">
                  No matching tools found.
                </p>
              ) : (
                filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex gap-4">
                      <LogoPreview
                        logoUrl={tool.logo_url}
                        name={tool.name}
                        accent="cyan"
                      />

                      <div>
                        <h3 className="text-xl font-bold">{tool.name}</h3>

                        <p className="text-sm text-cyan-300">
                          {tool.category}
                        </p>

                        <p className="mt-2 text-sm text-slate-400">
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
                          <p className="mt-2 text-xs text-yellow-300">
                            {tool.pricing}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => openEditModal(tool)}
                        className="rounded-full bg-yellow-500 px-5 py-3 text-sm font-bold text-black hover:bg-yellow-400"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => deleteTool(tool.id)}
                        className="rounded-full bg-red-500 px-5 py-3 text-sm font-bold text-white hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );


  if (isCheckingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black px-4 text-white">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
            AiFinder Admin
          </p>

          <h1 className="mt-3 text-3xl font-black">Checking session...</h1>

          <p className="mt-4 text-sm text-slate-400">
            Please wait a moment.
          </p>
        </div>
      </main>
    );
  }

  if (!isUnlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black px-4 text-white">
        {messagePopup}

        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
          <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
            Admin Access
          </p>

          <h1 className="mt-3 text-4xl font-black">AiFinder Admin</h1>

          <p className="mt-4 text-sm leading-7 text-slate-400">
            Enter the admin password to manage AI tools.
          </p>

          <input
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
            className="mt-6 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />

          <button
            onClick={unlockAdmin}
            disabled={isLoggingIn}
            className="mt-4 w-full rounded-full bg-white px-5 py-4 text-sm font-bold text-slate-950 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
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
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black p-6 text-white">
      {confirmationPopup}
      {messagePopup}
      {auditLogsPopup}
      {statsPopup}
      {addToolPopup}
      {adminReviewPopup}
      {liveDatabasePopup}

      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
              Admin Dashboard
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Manage AiFinder Tools
            </h1>
          </div>

          <button
            onClick={logoutAdmin}
            className="rounded-full border border-white/10 px-5 py-3 text-sm hover:bg-white/10"
          >
            Log Out
          </button>
        </div>

        <div className="mb-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
                  Compact Control Panel
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  AiFinder Admin Center
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                  Manage tools, submissions, stats, and audit logs from one clean
                  dashboard. All detailed sections open in popups.
                </p>
              </div>

              <button
                onClick={logoutAdmin}
                className="rounded-full border border-red-400/20 bg-red-400/10 px-5 py-3 text-sm font-bold text-red-200 hover:bg-red-400/20"
              >
                Log Out
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                  Tools
                </p>
                <p className="mt-2 text-4xl font-black text-white">
                  {stats.totalTools}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Live database
                </p>
              </div>

              <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-yellow-300">
                  Pending
                </p>
                <p className="mt-2 text-4xl font-black text-white">
                  {stats.pendingSubmissions}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Needs review
                </p>
              </div>

              <div className="rounded-3xl border border-green-400/20 bg-green-400/10 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-green-300">
                  Approved
                </p>
                <p className="mt-2 text-4xl font-black text-white">
                  {stats.approvedSubmissions}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Accepted
                </p>
              </div>

              <div className="rounded-3xl border border-purple-400/20 bg-purple-400/10 p-5">
                <p className="text-xs font-bold uppercase tracking-widest text-purple-300">
                  Audit
                </p>
                <p className="mt-2 text-4xl font-black text-white">
                  {auditLogs.length}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Recent logs shown
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <button
                onClick={() => setIsAddToolModalOpen(true)}
                className="rounded-3xl border border-cyan-400/20 bg-cyan-400 px-5 py-5 text-left text-slate-950 shadow-lg shadow-cyan-950/30 hover:bg-cyan-300"
              >
                <p className="text-xs font-black uppercase tracking-widest">
                  Create
                </p>
                <p className="mt-2 text-xl font-black">Add Tool</p>
                <p className="mt-1 text-xs font-bold opacity-70">
                  Add a new AI tool
                </p>
              </button>

              <button
                onClick={() => setIsAdminReviewModalOpen(true)}
                className="rounded-3xl border border-yellow-400/20 bg-yellow-400 px-5 py-5 text-left text-slate-950 shadow-lg shadow-yellow-950/30 hover:bg-yellow-300"
              >
                <p className="text-xs font-black uppercase tracking-widest">
                  Review
                </p>
                <p className="mt-2 text-xl font-black">
                  Submissions ({filteredSubmissions.length})
                </p>
                <p className="mt-1 text-xs font-bold opacity-70">
                  Approve or reject
                </p>
              </button>

              <button
                onClick={() => setIsLiveDatabaseModalOpen(true)}
                className="rounded-3xl border border-blue-400/20 bg-blue-400 px-5 py-5 text-left text-slate-950 shadow-lg shadow-blue-950/30 hover:bg-blue-300"
              >
                <p className="text-xs font-black uppercase tracking-widest">
                  Database
                </p>
                <p className="mt-2 text-xl font-black">
                  Live Tools ({filteredTools.length})
                </p>
                <p className="mt-1 text-xs font-bold opacity-70">
                  Search, edit, delete
                </p>
              </button>

              <button
                onClick={() => setIsStatsModalOpen(true)}
                className="rounded-3xl border border-green-400/20 bg-green-400 px-5 py-5 text-left text-slate-950 shadow-lg shadow-green-950/30 hover:bg-green-300"
              >
                <p className="text-xs font-black uppercase tracking-widest">
                  Summary
                </p>
                <p className="mt-2 text-xl font-black">Stats</p>
                <p className="mt-1 text-xs font-bold opacity-70">
                  View totals
                </p>
              </button>

              <button
                onClick={() => {
                  setIsAuditLogModalOpen(true);
                  fetchAuditLogs();
                }}
                className="rounded-3xl border border-purple-400/20 bg-purple-400 px-5 py-5 text-left text-slate-950 shadow-lg shadow-purple-950/30 hover:bg-purple-300"
              >
                <p className="text-xs font-black uppercase tracking-widest">
                  Security
                </p>
                <p className="mt-2 text-xl font-black">Audit Logs</p>
                <p className="mt-1 text-xs font-bold opacity-70">
                  View activity
                </p>
              </button>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-black text-white">
                  Security status
                </p>
                <p className="mt-2 text-xs leading-6 text-slate-400">
                  Cookie session, CSRF, route guard, RLS, storage restrictions,
                  security headers, and audit logs are active.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-black text-white">
                  Quick note
                </p>
                <p className="mt-2 text-xs leading-6 text-slate-400">
                  User-submitted links are reviewed safely. No iframe or website
                  preview is loaded in the admin dashboard.
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-black text-white">
                  Archive rule
                </p>
                <p className="mt-2 text-xs leading-6 text-slate-400">
                  Audit logs stay compact. Older logs are compressed into
                  downloadable archives after the live log limit is reached.
                </p>
              </div>
            </div>
          </div>
        </div>

        {editingSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-yellow-400/20 bg-slate-950 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-yellow-300">
                    Edit Submission
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    {editingSubmission.name}
                  </h2>
                </div>

                <button
                  onClick={closeSubmissionEditModal}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <input
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-yellow-400"
                  placeholder="Tool Name"
                  value={submissionEditName}
                  maxLength={80}
                  onChange={(e) => setSubmissionEditName(e.target.value)}
                />

                <select
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-yellow-400"
                  value={submissionEditCategory}
                  onChange={(e) =>
                    setSubmissionEditCategory(e.target.value)
                  }
                >
                  <option className="bg-slate-950" value="">
                    Select category
                  </option>

                  {CATEGORIES.map((item) => (
                    <option className="bg-slate-950" key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <input
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-yellow-400"
                  placeholder="Website URL"
                  value={submissionEditWebsite}
                  maxLength={500}
                  onChange={(e) => setSubmissionEditWebsite(e.target.value)}
                />

                <select
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-yellow-400"
                  value={submissionEditPricing}
                  onChange={(e) => setSubmissionEditPricing(e.target.value)}
                >
                  <option className="bg-slate-950" value="">
                    Select pricing
                  </option>

                  {PRICING_OPTIONS.map((item) => (
                    <option className="bg-slate-950" key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <div className="sm:col-span-2">
                  <div className="grid grid-cols-[1fr_76px] gap-3">
                    <input
                      className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-yellow-400"
                      placeholder="Logo Image URL"
                      value={submissionEditLogoUrl}
                      maxLength={500}
                      onChange={(e) =>
                        setSubmissionEditLogoUrl(e.target.value)
                      }
                    />

                    <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-slate-400 hover:bg-white/10">
                      {isUploadingSubmissionLogo ? (
                        <span className="text-xl">…</span>
                      ) : (
                        <UploadIcon />
                      )}

                      <input
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
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <p className="break-all text-xs text-slate-400">
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

              <textarea
                className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-yellow-400"
                placeholder="Description"
                value={submissionEditDescription}
                maxLength={500}
                onChange={(e) =>
                  setSubmissionEditDescription(e.target.value)
                }
                rows={5}
              />

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={updateSubmission}
                  className="rounded-full bg-yellow-500 px-6 py-3 text-sm font-bold text-black hover:bg-yellow-400"
                >
                  Save Submission
                </button>

                <button
                  onClick={closeSubmissionEditModal}
                  className="rounded-full border border-white/10 px-6 py-3 text-sm hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {editingTool && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
                    Edit Tool
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    {editingTool.name}
                  </h2>
                </div>

                <button
                  onClick={closeEditModal}
                  className="rounded-full border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
                >
                  ✕
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <input
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  placeholder="Tool Name"
                  value={editName}
                  maxLength={80}
                  onChange={(e) => setEditName(e.target.value)}
                />

                <select
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                >
                  <option className="bg-slate-950" value="">
                    Select category
                  </option>

                  {CATEGORIES.map((item) => (
                    <option className="bg-slate-950" key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <input
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  placeholder="Website URL"
                  value={editWebsite}
                  maxLength={500}
                  onChange={(e) => setEditWebsite(e.target.value)}
                />

                <select
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
                  value={editPricing}
                  onChange={(e) => setEditPricing(e.target.value)}
                >
                  <option className="bg-slate-950" value="">
                    Select pricing
                  </option>

                  {PRICING_OPTIONS.map((item) => (
                    <option className="bg-slate-950" key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

                <div className="sm:col-span-2">
                  <div className="grid grid-cols-[1fr_76px] gap-3">
                    <input
                      className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                      placeholder="Logo Image URL"
                      value={editLogoUrl}
                      maxLength={500}
                      onChange={(e) => setEditLogoUrl(e.target.value)}
                    />

                    <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-slate-400 hover:bg-white/10">
                      {isUploadingEditLogo ? (
                        <span className="text-xl">…</span>
                      ) : (
                        <UploadIcon />
                      )}

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
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
                    </label>
                  </div>
                </div>
              </div>

              {editLogoUrl && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <LogoPreview
                    logoUrl={editLogoUrl}
                    name={editName || "Tool"}
                    accent="cyan"
                  />
                  <p className="break-all text-xs text-slate-400">
                    {editLogoUrl}
                  </p>
                </div>
              )}

              <textarea
                className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                placeholder="Description"
                value={editDescription}
                maxLength={500}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
              />

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={updateTool}
                  className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300"
                >
                  Save Changes
                </button>

                <button
                  onClick={closeEditModal}
                  className="rounded-full border border-white/10 px-6 py-3 text-sm hover:bg-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}