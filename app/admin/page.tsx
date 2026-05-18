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
};

type SubmittedTool = {
  id: number;
  name: string;
  category: string;
  description: string;
  website: string;
  pricing?: string | null;
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

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");

  const [tools, setTools] = useState<Tool[]>([]);
  const [submissions, setSubmissions] = useState<SubmittedTool[]>([]);

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
  const [pricing, setPricing] = useState("");

  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editPricing, setEditPricing] = useState("");

  const [editingSubmission, setEditingSubmission] =
    useState<SubmittedTool | null>(null);
  const [submissionEditName, setSubmissionEditName] = useState("");
  const [submissionEditCategory, setSubmissionEditCategory] = useState("");
  const [submissionEditDescription, setSubmissionEditDescription] =
    useState("");
  const [submissionEditWebsite, setSubmissionEditWebsite] = useState("");
  const [submissionEditPricing, setSubmissionEditPricing] = useState("");

  const adminPassword = "aifinder2026";

  const toolCategories = useMemo(() => {
    return Array.from(
      new Set(tools.map((tool) => tool.category).filter(Boolean))
    ).sort();
  }, [tools]);

  const submissionCategories = useMemo(() => {
    return Array.from(
      new Set(
        submissions
          .map((submission) => submission.category)
          .filter(Boolean)
      )
    ).sort();
  }, [submissions]);

  const filteredTools = useMemo(() => {
    let result = tools.filter((tool) => {
      const searchText = `${tool.name} ${tool.category} ${tool.description} ${
        tool.website
      } ${tool.pricing || ""}`.toLowerCase();

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
      } ${submission.website} ${submission.pricing || ""} ${
        submission.submitter_name || ""
      } ${submission.submitter_email || ""}`.toLowerCase();

      const matchesSearch = searchText.includes(
        submissionSearch.toLowerCase()
      );

      const matchesCategory =
        submissionCategoryFilter === "All" ||
        submission.category === submissionCategoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [submissions, submissionSearch, submissionCategoryFilter]);

  function unlockAdmin() {
    if (password === adminPassword) {
      setIsUnlocked(true);
      localStorage.setItem("aifinder-admin-unlocked", "true");
    } else {
      alert("Wrong password");
    }
  }

  function logoutAdmin() {
    setIsUnlocked(false);
    localStorage.removeItem("aifinder-admin-unlocked");
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
      headers: {
        "x-admin-password": adminPassword,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Failed to load submissions");
      return;
    }

    setSubmissions(result.submissions || []);

    if (result.stats) {
      setStats(result.stats);
    }
  }

  async function approveSubmission(submissionId: number) {
    const confirmApprove = confirm("Approve this submitted tool?");

    if (!confirmApprove) return;

    const response = await fetch("/api/admin/submissions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: JSON.stringify({
        submissionId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Failed to approve submission");
      return;
    }

    alert("Tool approved and added to AiFinder.");

    fetchSubmissions();
    fetchTools();
  }

  async function rejectSubmission(submissionId: number) {
    const confirmReject = confirm("Reject this submitted tool?");

    if (!confirmReject) return;

    const response = await fetch("/api/admin/submissions", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: JSON.stringify({
        submissionId,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Failed to reject submission");
      return;
    }

    alert("Submission rejected.");

    fetchSubmissions();
  }

  function openSubmissionEditModal(submission: SubmittedTool) {
    setEditingSubmission(submission);
    setSubmissionEditName(submission.name);
    setSubmissionEditCategory(submission.category);
    setSubmissionEditDescription(submission.description);
    setSubmissionEditWebsite(submission.website);
    setSubmissionEditPricing(submission.pricing || "");
  }

  function closeSubmissionEditModal() {
    setEditingSubmission(null);
    setSubmissionEditName("");
    setSubmissionEditCategory("");
    setSubmissionEditDescription("");
    setSubmissionEditWebsite("");
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
      alert("Please fill all required fields");
      return;
    }

    const response = await fetch("/api/admin/submissions", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: JSON.stringify({
        id: editingSubmission.id,
        name: submissionEditName,
        category: submissionEditCategory,
        description: submissionEditDescription,
        website: submissionEditWebsite,
        pricing: submissionEditPricing,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Failed to update submission");
      return;
    }

    alert("Submission updated.");

    closeSubmissionEditModal();
    fetchSubmissions();
  }

  useEffect(() => {
    const savedUnlock = localStorage.getItem("aifinder-admin-unlocked");

    if (savedUnlock === "true") {
      setIsUnlocked(true);
    }
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      fetchTools();
      fetchSubmissions();
    }
  }, [isUnlocked]);

  async function addTool() {
    if (!name || !category || !description || !website) {
      alert("Please fill all required fields");
      return;
    }

    const response = await fetch("/api/admin/tools", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: JSON.stringify({
        name,
        category,
        description,
        website,
        pricing,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Failed to add tool");
      return;
    }

    setName("");
    setCategory("");
    setDescription("");
    setWebsite("");
    setPricing("");

    fetchTools();
    fetchSubmissions();
  }

  function openEditModal(tool: Tool) {
    setEditingTool(tool);
    setEditName(tool.name);
    setEditCategory(tool.category);
    setEditDescription(tool.description);
    setEditWebsite(tool.website);
    setEditPricing(tool.pricing || "");
  }

  function closeEditModal() {
    setEditingTool(null);
    setEditName("");
    setEditCategory("");
    setEditDescription("");
    setEditWebsite("");
    setEditPricing("");
  }

  async function updateTool() {
    if (!editingTool?.id) return;

    if (!editName || !editCategory || !editDescription || !editWebsite) {
      alert("Please fill all required fields");
      return;
    }

    const response = await fetch("/api/admin/tools", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: JSON.stringify({
        id: editingTool.id,
        name: editName,
        category: editCategory,
        description: editDescription,
        website: editWebsite,
        pricing: editPricing,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Failed to update tool");
      return;
    }

    closeEditModal();
    fetchTools();
    fetchSubmissions();
  }

  async function deleteTool(id?: number) {
    if (!id) return;

    const confirmDelete = confirm("Delete this tool?");

    if (!confirmDelete) return;

    const response = await fetch("/api/admin/tools", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": adminPassword,
      },
      body: JSON.stringify({
        id,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Failed to delete tool");
      return;
    }

    fetchTools();
    fetchSubmissions();
  }

  if (!isUnlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-black px-4 text-white">
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
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                unlockAdmin();
              }
            }}
            className="mt-6 w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />

          <button
            onClick={unlockAdmin}
            className="mt-4 w-full rounded-full bg-white px-5 py-4 text-sm font-bold text-slate-950 hover:bg-slate-200"
          >
            Unlock Dashboard
          </button>

          <p className="mt-4 text-xs text-slate-500">
            Temporary MVP password protection. We’ll replace this with real
            login later.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black p-6 text-white">
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
            Lock Admin
          </button>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
              Total Tools
            </p>
            <h2 className="mt-3 text-4xl font-black">{stats.totalTools}</h2>
            <p className="mt-2 text-sm text-slate-400">
              Live tools in database
            </p>
          </div>

          <div className="rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-6">
            <p className="text-sm font-bold uppercase tracking-widest text-yellow-300">
              Pending
            </p>
            <h2 className="mt-3 text-4xl font-black">
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
            <h2 className="mt-3 text-4xl font-black">
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
            <h2 className="mt-3 text-4xl font-black">
              {stats.rejectedSubmissions}
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Declined submissions
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-bold">Add New Tool</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <input
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Tool Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />

            <input
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Website URL"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />

            <input
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Pricing"
              value={pricing}
              onChange={(e) => setPricing(e.target.value)}
            />
          </div>

          <textarea
            className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
            placeholder="Description"
            value={description}
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

        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
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
              <option value="All">All Categories</option>
              {submissionCategories.map((categoryName) => (
                <option key={categoryName} value={categoryName}>
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
                    <div>
                      <h3 className="text-xl font-bold">{submission.name}</h3>

                      <p className="text-sm text-yellow-300">
                        {submission.category}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {submission.description}
                      </p>

                      <p className="mt-3 break-all text-xs text-slate-500">
                        Website: {submission.website}
                      </p>

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

        <div className="mt-10">
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
              <option value="All">All Categories</option>
              {toolCategories.map((categoryName) => (
                <option key={categoryName} value={categoryName}>
                  {categoryName}
                </option>
              ))}
            </select>

            <select
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none focus:border-cyan-400"
              value={toolSort}
              onChange={(e) => setToolSort(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
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
                  <div>
                    <h3 className="text-xl font-bold">{tool.name}</h3>

                    <p className="text-sm text-cyan-300">{tool.category}</p>

                    <p className="mt-2 text-sm text-slate-400">
                      {tool.description}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {tool.website}
                    </p>

                    {tool.pricing && (
                      <p className="mt-2 text-xs text-yellow-300">
                        {tool.pricing}
                      </p>
                    )}
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

        {editingSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-[2rem] border border-yellow-400/20 bg-slate-950 p-6 shadow-2xl">
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
                  onChange={(e) => setSubmissionEditName(e.target.value)}
                />

                <input
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-yellow-400"
                  placeholder="Category"
                  value={submissionEditCategory}
                  onChange={(e) => setSubmissionEditCategory(e.target.value)}
                />

                <input
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-yellow-400"
                  placeholder="Website URL"
                  value={submissionEditWebsite}
                  onChange={(e) => setSubmissionEditWebsite(e.target.value)}
                />

                <input
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-yellow-400"
                  placeholder="Pricing"
                  value={submissionEditPricing}
                  onChange={(e) => setSubmissionEditPricing(e.target.value)}
                />
              </div>

              <textarea
                className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-yellow-400"
                placeholder="Description"
                value={submissionEditDescription}
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
            <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-slate-950 p-6 shadow-2xl">
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
                  onChange={(e) => setEditName(e.target.value)}
                />

                <input
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  placeholder="Category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                />

                <input
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  placeholder="Website URL"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                />

                <input
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  placeholder="Pricing"
                  value={editPricing}
                  onChange={(e) => setEditPricing(e.target.value)}
                />
              </div>

              <textarea
                className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                placeholder="Description"
                value={editDescription}
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