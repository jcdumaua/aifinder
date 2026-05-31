"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOverlayScrollLock } from "@/lib/use-overlay-scroll-lock";

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
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

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
  const [isClosing, setIsClosing] = useState(false);

  useOverlayScrollLock(true);

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

  function closeSubmitPage() {
    const navigateAway = () => {
      if (window.history.length > 1) {
        router.back();
        return;
      }

      router.push("/");
    };

    if (shouldReduceMotion) {
      navigateAway();
      return;
    }

    setIsClosing(true);
    window.setTimeout(navigateAway, 240);
  }

  const isSuccessPopup = popup?.type === "success";
  const inputClass =
    "ai-product-input w-full rounded-2xl px-4 py-3.5 text-sm leading-6 outline-none sm:px-5 sm:py-4 sm:text-base";
  const labelClass =
    "ai-product-heading text-sm font-black leading-5";
  const helperClass =
    "ai-product-muted mt-2 text-xs leading-5";
  const optionClass =
    "bg-white text-slate-950 [.theme-dark_&]:bg-slate-950 [.theme-dark_&]:text-white";
  const sectionClass =
    "rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white/[0.68] sm:p-5";

  return (
    <main className="ai-product-page relative min-h-screen overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl [.theme-light_&]:bg-cyan-200/30" />
      <div className="pointer-events-none absolute -right-36 top-44 h-80 w-80 rounded-full bg-sky-400/10 blur-3xl [.theme-light_&]:bg-sky-200/24" />
      <div className="pointer-events-none relative z-0 mx-auto max-w-5xl opacity-70 blur-[0.2px]">
        <p className="ai-product-eyebrow text-sm font-bold uppercase tracking-widest">
          AiFinder
        </p>
        <h1 className="ai-product-section-title mt-3 max-w-3xl text-4xl md:text-5xl xl:text-6xl">
          Submit an AI tool for review
        </h1>
        <p className="ai-product-body mt-4 max-w-2xl text-sm leading-7 sm:text-base">
          Share practical AI products with the directory. The submit form opens
          as a focused review panel.
        </p>
      </div>

      {popup && (
        <div
          className="ai-modal-backdrop fixed inset-0 z-[9999] flex items-center justify-center px-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`tool-details-modal-panel relative w-full max-w-md rounded-[2rem] border p-7 text-center ${
              isSuccessPopup
                ? "border-emerald-400/25"
                : "border-red-400/25"
            }`}
          >
            <button
              type="button"
              aria-label="Close message"
              onClick={() => setPopup(null)}
              className="ai-product-button-secondary ai-modal-close-button [.theme-light_&]:text-slate-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-4xl font-black ${
                isSuccessPopup
                  ? "bg-green-400/15 text-green-300"
                  : "bg-red-400/15 text-red-300"
              }`}
            >
              {isSuccessPopup ? "✓" : "!"}
            </div>

            <h2 className="ai-product-heading mt-5 text-2xl font-black">
              {popup.title}
            </h2>

            <p className="ai-product-body mt-3 text-sm leading-6">
              {popup.message}
            </p>

            <button
              type="button"
              onClick={() => setPopup(null)}
              className={`mt-6 rounded-full px-7 py-3 text-sm font-bold transition-colors duration-200 ${
                isSuccessPopup
                  ? "bg-emerald-300 text-slate-950 hover:bg-emerald-200"
                  : "bg-red-300 text-slate-950 hover:bg-red-200"
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {!isClosing && (
          <motion.div
            className="ai-modal-backdrop fixed inset-0 z-10 flex items-center justify-center px-3 py-4 sm:px-6 sm:py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
          >
            <motion.section
              aria-label="Submit AI tool"
              aria-modal="true"
              role="dialog"
              className="tool-details-modal-panel relative max-h-[88dvh] w-full max-w-3xl overflow-hidden rounded-[1.5rem] border border-cyan-400/20 text-white outline-none [.theme-light_&]:border-cyan-900/10 [.theme-light_&]:text-slate-950 sm:max-h-[90dvh] sm:rounded-[2rem] xl:max-w-4xl"
              initial={
                shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }
              }
              animate={{ opacity: 1, scale: 1 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: 42, scale: 0.98 }
              }
              transition={{
                duration: shouldReduceMotion ? 0 : 0.22,
                ease: "easeOut",
              }}
            >
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.14),transparent_34%),linear-gradient(135deg,rgba(34,211,238,0.08),rgba(59,130,246,0.04),rgba(15,23,42,0))] [.theme-light_&]:bg-[radial-gradient(circle_at_18%_0%,rgba(14,116,144,0.10),transparent_34%),linear-gradient(135deg,rgba(236,254,255,0.72),rgba(255,255,255,0.20),rgba(248,250,252,0))]" />

              <button
                type="button"
                aria-label="Close submit tool page"
                onClick={closeSubmitPage}
                className="ai-product-button-secondary ai-modal-close-button [.theme-light_&]:text-slate-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>

              <div className="tool-details-modal-scroll relative z-10 max-h-[88dvh] overflow-y-auto overscroll-contain px-5 py-6 sm:max-h-[90dvh] sm:px-8 sm:py-8">
                <div className="border-b border-white/10 pb-5 pr-16 [.theme-light_&]:border-slate-200 sm:pr-20">
                  <div>
                    <p className="ai-product-eyebrow text-sm font-bold uppercase tracking-widest">
                      Submit AI Tool
                    </p>

                    <h1 className="ai-product-section-title mt-3 max-w-3xl text-3xl sm:text-4xl xl:text-5xl">
                      Submit your AI tool to AiFinder
                    </h1>

                    <p className="ai-product-body mt-4 max-w-2xl text-sm leading-7 sm:text-base">
                      Send your tool for review. Approved tools will appear
                      publicly on AiFinder.
                    </p>
                  </div>
                </div>

                <form
                  className="mt-6 space-y-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitTool();
                  }}
                >
                  <input
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                  />

                  <section className={sectionClass}>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                      Tool details
                    </p>
                    <p className="ai-product-muted mt-2 text-sm leading-6">
                      Share the public details people need to understand and
                      evaluate the tool.
                    </p>

                    <div className="mt-6 grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor="tool-name">
                          Tool name{" "}
                          <span className="text-cyan-300 [.theme-light_&]:text-cyan-800">
                            *
                          </span>
                        </label>
                        <input
                          id="tool-name"
                          className={`${inputClass} mt-2`}
                          placeholder="e.g. CanvasMind"
                          value={name}
                          maxLength={80}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className={labelClass} htmlFor="tool-category">
                          Category{" "}
                          <span className="text-cyan-300 [.theme-light_&]:text-cyan-800">
                            *
                          </span>
                        </label>
                        <select
                          id="tool-category"
                          className={`${inputClass} mt-2`}
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option className={optionClass} value="">
                            Select category
                          </option>

                          {CATEGORIES.map((item) => (
                            <option
                              className={optionClass}
                              key={item}
                              value={item}
                            >
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className={labelClass} htmlFor="tool-website">
                          Website URL{" "}
                          <span className="text-cyan-300 [.theme-light_&]:text-cyan-800">
                            *
                          </span>
                        </label>
                        <input
                          id="tool-website"
                          type="url"
                          className={`${inputClass} mt-2`}
                          placeholder="https://example.com"
                          value={website}
                          maxLength={500}
                          onChange={(e) => setWebsite(e.target.value)}
                        />
                        <p className={helperClass}>
                          Use the official HTTPS homepage.
                        </p>
                      </div>

                      <div>
                        <label className={labelClass} htmlFor="tool-pricing">
                          Pricing
                        </label>
                        <select
                          id="tool-pricing"
                          className={`${inputClass} mt-2`}
                          value={pricing}
                          onChange={(e) => setPricing(e.target.value)}
                        >
                          <option className={optionClass} value="">
                            Select pricing
                          </option>

                          {PRICING_OPTIONS.map((item) => (
                            <option
                              className={optionClass}
                              key={item}
                              value={item}
                            >
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className={labelClass} htmlFor="tool-logo">
                          Logo
                        </label>
                        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_4.75rem]">
                          <input
                            id="tool-logo"
                            type="url"
                            className={inputClass}
                            placeholder="https://example.com/logo.png"
                            value={logoUrl}
                            maxLength={500}
                            onChange={(e) => setLogoUrl(e.target.value)}
                          />

                          <label className="ai-product-button-secondary flex min-h-14 cursor-pointer items-center justify-center rounded-2xl px-4 text-slate-500 [.theme-dark_&]:text-slate-300">
                            {isUploadingLogo ? (
                              <span className="text-xl">…</span>
                            ) : (
                              <UploadCloud
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
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

                        <p className="ai-product-muted mt-2 text-xs">
                          Add a logo URL or click the upload icon to upload a
                          logo.
                        </p>
                      </div>

                      {logoUrl && (
                        <div className="ai-product-surface-soft flex items-center gap-3 rounded-2xl border p-3 sm:col-span-2">
                          <img
                            src={logoUrl}
                            alt="Uploaded logo preview"
                            className="h-14 w-14 rounded-2xl border border-white/10 bg-white object-contain p-2 [.theme-light_&]:border-slate-200"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />

                          <p className="ai-product-muted break-all text-xs">
                            {logoUrl}
                          </p>
                        </div>
                      )}

                      <div className="sm:col-span-2">
                        <label
                          className={labelClass}
                          htmlFor="tool-description"
                        >
                          Short description{" "}
                          <span className="text-cyan-300 [.theme-light_&]:text-cyan-800">
                            *
                          </span>
                        </label>
                        <textarea
                          id="tool-description"
                          className={`${inputClass} mt-2 min-h-36 resize-y`}
                          placeholder="Describe what the tool does, who it helps, and the core use case."
                          value={description}
                          maxLength={500}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={5}
                        />
                        <p className={helperClass}>
                          Keep it concise. Maximum 500 characters.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className={sectionClass}>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                      Submitter details
                    </p>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className={labelClass} htmlFor="submitter-name">
                          Your name
                        </label>
                        <input
                          id="submitter-name"
                          className={`${inputClass} mt-2`}
                          placeholder="Optional"
                          value={submitterName}
                          maxLength={80}
                          onChange={(e) => setSubmitterName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className={labelClass} htmlFor="submitter-email">
                          Your email
                        </label>
                        <input
                          id="submitter-email"
                          type="email"
                          className={`${inputClass} mt-2`}
                          placeholder="Optional"
                          value={submitterEmail}
                          maxLength={120}
                          onChange={(e) => setSubmitterEmail(e.target.value)}
                        />
                        <p className={helperClass}>
                          Used only if we need to follow up about the
                          submission.
                        </p>
                      </div>
                    </div>
                  </section>

                  <p className="ai-product-muted rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-3 text-xs leading-5 [.theme-light_&]:bg-cyan-50/70">
                    For security, only HTTPS websites are accepted. Direct
                    download links and unsafe file types are blocked.
                  </p>

                  <div className="sticky bottom-0 -mx-5 grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3 border-t border-white/10 bg-slate-950/[0.86] px-5 py-4 backdrop-blur-xl [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white/[0.9] sm:-mx-8 sm:flex sm:items-center sm:justify-between sm:px-8">
                    <button
                      type="button"
                      onClick={closeSubmitPage}
                      className="ai-product-button-secondary px-4 py-3 text-sm"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isSubmitting || isUploadingLogo}
                      className="ai-product-button-primary px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60 sm:px-7 sm:py-4"
                    >
                      {isSubmitting ? "Submitting..." : "Submit for Review"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
