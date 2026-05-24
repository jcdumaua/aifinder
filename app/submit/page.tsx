"use client";

import { useState } from "react";

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

type PopupMessage = {
  type: "success" | "error";
  title: string;
  message: string;
};

function cleanText(value: string, maxLength: number) {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

function validateHttpsUrl(value: string, fieldName: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  let url: URL;

  try {
    url = new URL(trimmedValue);
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`);
  }

  if (url.protocol !== "https:") {
    throw new Error(`${fieldName} must start with https://`);
  }

  if (url.username || url.password) {
    throw new Error(`${fieldName} cannot contain username or password.`);
  }

  const hostname = url.hostname.toLowerCase();

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
  ) {
    throw new Error(`${fieldName} cannot use local or private addresses.`);
  }

  const fullPath = `${url.pathname}${url.search}`.toLowerCase();

  if (BLOCKED_FILE_EXTENSIONS.some((ext) => fullPath.endsWith(ext))) {
    throw new Error(`${fieldName} cannot link directly to a downloadable file.`);
  }

  url.hash = "";

  return url.toString();
}

function validateOptionalLogoUrl(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) return "";

  return validateHttpsUrl(trimmedValue, "Logo URL");
}

export default function SubmitToolPage() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [pricing, setPricing] = useState("");
  const [description, setDescription] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [submitterEmail, setSubmitterEmail] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [popup, setPopup] = useState<PopupMessage | null>(null);

  function showSuccess(message: string) {
    // Future Sonner use in submit-tool flows: toast.success("Submission Received", { description: message }).
    setPopup({
      type: "success",
      title: "Submission Received",
      message,
    });
  }

  function showError(message: string) {
    // Future Sonner use in submit-tool flows: toast.error("Submission Error", { description: message }).
    setPopup({
      type: "error",
      title: "Submission Error",
      message,
    });
  }

  async function uploadLogoFile(file: File) {
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      showError("Logo must be PNG, JPG, JPEG, or WEBP only. SVG is not allowed.");
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      showError("Logo file is too large. Maximum size is 2MB.");
      return;
    }

    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload-logo", {
        method: "POST",
        body: formData,
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.logoUrl) {
        showError(result?.error || "Failed to upload logo.");
        return;
      }

      const safeLogoUrl = validateOptionalLogoUrl(result.logoUrl);

      setLogoUrl(safeLogoUrl);

      // Future Sonner use in upload flows: toast.success("Logo Uploaded", { description: "Your logo was uploaded successfully." }).
      setPopup({
        type: "success",
        title: "Logo Uploaded",
        message: "Your logo was uploaded successfully.",
      });
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to upload logo.");
    } finally {
      setIsUploadingLogo(false);
    }
  }

  async function submitTool() {
    try {
      if (companyWebsite.trim()) {
        showSuccess("Thank you! Your tool has been submitted for admin review.");
        return;
      }

      const safeName = cleanText(name, 80);
      const safeCategory = cleanText(category, 40);
      const safeWebsite = validateHttpsUrl(website, "Website URL");
      const safeLogoUrl = validateOptionalLogoUrl(logoUrl);
      const safePricing = cleanText(pricing, 80);
      const safeDescription = cleanText(description, 500);
      const safeSubmitterName = cleanText(submitterName, 80);
      const safeSubmitterEmail = cleanText(submitterEmail, 120);

      if (!safeName || !safeCategory || !safeWebsite || !safeDescription) {
        showError("Please fill in all required fields.");
        return;
      }

      if (!CATEGORIES.includes(safeCategory)) {
        showError("Please select a valid category.");
        return;
      }

      if (safePricing && !PRICING_OPTIONS.includes(safePricing)) {
        showError("Please select a valid pricing option.");
        return;
      }

      if (
        safeSubmitterEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeSubmitterEmail)
      ) {
        showError("Please enter a valid email address.");
        return;
      }

      setIsSubmitting(true);

      const response = await fetch("/api/submit-tool", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: safeName,
          category: safeCategory,
          website: safeWebsite,
          logoUrl: safeLogoUrl,
          pricing: safePricing,
          description: safeDescription,
          submitterName: safeSubmitterName,
          submitterEmail: safeSubmitterEmail,
          companyWebsite,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        showError(result?.error || "Submission failed. Please try again.");
        return;
      }

      setName("");
      setCategory("");
      setWebsite("");
      setLogoUrl("");
      setPricing("");
      setDescription("");
      setSubmitterName("");
      setSubmitterEmail("");
      setCompanyWebsite("");

      showSuccess(
        result?.message || "Thank you! Your tool has been submitted for admin review."
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isSuccessPopup = popup?.type === "success";

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black px-6 py-16 text-white">
      {popup && (
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
      )}

      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-widest text-cyan-300">
          Submit AI Tool
        </p>

        <h1 className="mt-3 text-4xl font-black md:text-5xl">
          Submit your AI tool to AiFinder
        </h1>

        <p className="mt-4 text-slate-400">
          Send your tool for review. Approved tools will appear publicly on
          AiFinder.
        </p>

        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <input
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <input
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Tool name *"
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
                Select category *
              </option>

              {CATEGORIES.map((item) => (
                <option className="bg-slate-950" key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              type="url"
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Website URL * https://example.com"
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
                  type="url"
                  className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  placeholder="Logo image URL"
                  value={logoUrl}
                  maxLength={500}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />

                <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-white/10 bg-black/30 text-slate-400 hover:bg-white/10">
                  {isUploadingLogo ? (
                    <span className="text-xl">…</span>
                  ) : (
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
                  )}

                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];

                      if (file) {
                        await uploadLogoFile(file);
                      }

                      event.target.value = "";
                    }}
                  />
                </label>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Add a logo URL or click the upload icon to upload a logo.
              </p>
            </div>

            <input
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Your name"
              value={submitterName}
              maxLength={80}
              onChange={(e) => setSubmitterName(e.target.value)}
            />

            <input
              type="email"
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Your email"
              value={submitterEmail}
              maxLength={120}
              onChange={(e) => setSubmitterEmail(e.target.value)}
            />
          </div>

          {logoUrl && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
              <img
                src={logoUrl}
                alt="Uploaded logo preview"
                className="h-14 w-14 rounded-2xl border border-white/10 bg-white object-contain p-2"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />

              <p className="break-all text-xs text-slate-400">{logoUrl}</p>
            </div>
          )}

          <textarea
            className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
            placeholder="Short description *"
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
          />

          <p className="mt-3 text-xs text-slate-500">
            For security, only HTTPS websites are accepted. Direct download
            links and unsafe file types are blocked.
          </p>

          <button
            onClick={submitTool}
            disabled={isSubmitting || isUploadingLogo}
            className="mt-6 rounded-full bg-cyan-400 px-7 py-4 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : "Submit for Review"}
          </button>
        </div>
      </section>
    </main>
  );
}
