"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { isToolCategory, TOOL_CATEGORIES } from "@/lib/tool-categories";
import { useOverlayScrollLock } from "@/lib/use-overlay-scroll-lock";

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
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

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
  const dialogRef = useRef<HTMLElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const popupOkButtonRef = useRef<HTMLButtonElement | null>(null);

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

      if (!isToolCategory(safeCategory)) {
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

  const closeSubmitPage = useCallback(() => {
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
  }, [router, shouldReduceMotion]);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (popup) {
      popupOkButtonRef.current?.focus();
    }
  }, [popup]);

  useEffect(() => {
    function getFocusableElements(container: HTMLElement) {
      return Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter(
        (element) =>
          !element.hasAttribute("disabled") &&
          element.getAttribute("aria-hidden") !== "true" &&
          element.offsetParent !== null
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isClosing) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeSubmitPage();
        return;
      }

      if (event.key !== "Tab") return;

      const trapContainer = popupRef.current || dialogRef.current;
      if (!trapContainer) return;

      const focusableElements = getFocusableElements(trapContainer);
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (!firstFocusable || !lastFocusable) {
        event.preventDefault();
        trapContainer.focus();
        return;
      }

      const activeElement = document.activeElement;

      if (!trapContainer.contains(activeElement)) {
        event.preventDefault();
        firstFocusable.focus();
        return;
      }

      if (event.shiftKey && activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeSubmitPage, isClosing]);

  const isSuccessPopup = popup?.type === "success";
  const inputClass =
    "ai-product-input h-auto w-full rounded-2xl px-4 py-3.5 text-sm leading-6 outline-none md:py-3 xl:px-5 xl:py-4 xl:text-base";
  const labelClass =
    "ai-product-heading text-sm font-black leading-5";
  const helperClass =
    "ai-product-muted mt-2 text-xs leading-5";
  const selectContentClass =
    "bg-white text-slate-950 [.theme-dark_&]:bg-slate-950 [.theme-dark_&]:text-white";
  const sectionClass =
    "rounded-[1.25rem] border border-white/10 bg-white/[0.035] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white/[0.68] sm:p-5 md:p-4 xl:p-5";

  return (
    <main className="ai-product-page relative min-h-dvh overflow-x-hidden px-4 py-8 sm:px-6 sm:py-12">
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

      <AnimatePresence>
        {!isClosing && (
          <motion.div
            className="ai-modal-backdrop fixed inset-0 z-10 flex h-dvh min-h-dvh w-screen items-center justify-center overflow-x-hidden px-3 py-4 sm:px-6 sm:py-8 md:py-6 xl:py-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
          >
            <motion.section
              ref={dialogRef}
              aria-labelledby="submit-tool-modal-title"
              aria-describedby="submit-tool-modal-description"
              aria-modal="true"
              role="dialog"
              tabIndex={-1}
              className="tool-details-modal-panel relative max-h-[88dvh] w-full max-w-3xl overflow-hidden rounded-[1.5rem] border border-cyan-400/20 text-white outline-none [.theme-light_&]:border-cyan-900/10 [.theme-light_&]:text-slate-950 sm:max-h-[90dvh] sm:rounded-[2rem] md:max-h-[84dvh] md:max-w-[42rem] lg:max-h-[86dvh] lg:max-w-[44rem] xl:max-h-[90dvh] xl:max-w-4xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, scale: 0.98 }
              }
              transition={{
                duration: shouldReduceMotion ? 0 : 0.22,
                ease: "easeOut",
              }}
            >
              <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.14),transparent_34%),linear-gradient(135deg,rgba(34,211,238,0.08),rgba(59,130,246,0.04),rgba(15,23,42,0))] [.theme-light_&]:bg-[radial-gradient(circle_at_18%_0%,rgba(14,116,144,0.10),transparent_34%),linear-gradient(135deg,rgba(236,254,255,0.72),rgba(255,255,255,0.20),rgba(248,250,252,0))]" />

              <Button
                type="button"
                aria-label="Close submit tool page"
                onClick={closeSubmitPage}
                ref={closeButtonRef}
                variant="ghost"
                size="icon"
                className="ai-product-button-secondary ai-modal-close-button [.theme-light_&]:text-slate-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>

              <div className="tool-details-modal-scroll relative z-10 max-h-[88dvh] overflow-y-auto overscroll-contain px-5 pb-32 pt-6 sm:max-h-[90dvh] sm:px-8 sm:pb-24 sm:pt-8 md:max-h-[84dvh] md:px-6 md:pb-20 md:pt-6 lg:max-h-[86dvh] xl:max-h-[90dvh] xl:px-8 xl:pb-24 xl:pt-8">
                <div className="border-b border-white/10 pb-5 pr-16 [.theme-light_&]:border-slate-200 sm:pr-20 md:pb-4 xl:pb-5">
                  <div>
                    <p className="ai-product-eyebrow text-sm font-bold uppercase tracking-widest">
                      Submit AI Tool
                    </p>

                    <h1
                      id="submit-tool-modal-title"
                      className="ai-product-section-title mt-3 max-w-3xl text-3xl sm:text-4xl md:text-[2rem] xl:text-5xl"
                    >
                      Submit your AI tool to AiFinder
                    </h1>

                    <p
                      id="submit-tool-modal-description"
                      className="ai-product-body mt-4 max-w-2xl text-sm leading-7 sm:text-base md:mt-3 md:text-sm md:leading-6 xl:mt-4 xl:text-base xl:leading-7"
                    >
                      Send your tool for review. Approved tools will appear
                      publicly on AiFinder.
                    </p>
                  </div>
                </div>

                <form
                  id="submit-tool-form"
                  className="mt-6 space-y-5 pb-2 md:mt-5 md:space-y-4 xl:mt-6 xl:space-y-5"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submitTool();
                  }}
                >
                  <Input
                    suppressHydrationWarning
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
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

                    <div className="mt-6 grid gap-5 sm:grid-cols-2 md:mt-5 md:gap-4 xl:mt-6 xl:gap-5">
                      <div>
                        <Label className={labelClass} htmlFor="tool-name">
                          Tool name{" "}
                          <span className="text-cyan-300 [.theme-light_&]:text-cyan-800">
                            *
                          </span>
                        </Label>
                        <Input
                          suppressHydrationWarning
                          id="tool-name"
                          className={`${inputClass} mt-2`}
                          placeholder="e.g. CanvasMind"
                          value={name}
                          maxLength={80}
                          aria-required="true"
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label className={labelClass} htmlFor="tool-category">
                          Category{" "}
                          <span className="text-cyan-300 [.theme-light_&]:text-cyan-800">
                            *
                          </span>
                        </Label>
                        <Select
                          value={category || SELECT_EMPTY_VALUE}
                          onValueChange={(value) =>
                            setCategory(value === SELECT_EMPTY_VALUE ? "" : value)
                          }
                        >
                          <SelectTrigger
                            id="tool-category"
                            className={`${inputClass} mt-2`}
                            aria-required="true"
                          >
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className={selectContentClass}>
                            <SelectItem value={SELECT_EMPTY_VALUE}>
                              Select category
                            </SelectItem>
                            {TOOL_CATEGORIES.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className={labelClass} htmlFor="tool-website">
                          Website URL{" "}
                          <span className="text-cyan-300 [.theme-light_&]:text-cyan-800">
                            *
                          </span>
                        </Label>
                        <Input
                          suppressHydrationWarning
                          id="tool-website"
                          type="url"
                          className={`${inputClass} mt-2`}
                          placeholder="https://example.com"
                          value={website}
                          maxLength={500}
                          aria-describedby="tool-website-help"
                          aria-required="true"
                          onChange={(e) => setWebsite(e.target.value)}
                        />
                        <p id="tool-website-help" className={helperClass}>
                          Use the official HTTPS homepage.
                        </p>
                      </div>

                      <div>
                        <Label className={labelClass} htmlFor="tool-pricing">
                          Pricing
                        </Label>
                        <Select
                          value={pricing || SELECT_EMPTY_VALUE}
                          onValueChange={(value) =>
                            setPricing(value === SELECT_EMPTY_VALUE ? "" : value)
                          }
                        >
                          <SelectTrigger
                            id="tool-pricing"
                            className={`${inputClass} mt-2`}
                          >
                            <SelectValue placeholder="Select pricing" />
                          </SelectTrigger>
                          <SelectContent className={selectContentClass}>
                            <SelectItem value={SELECT_EMPTY_VALUE}>
                              Select pricing
                            </SelectItem>
                            {PRICING_OPTIONS.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="sm:col-span-2">
                        <Label className={labelClass} htmlFor="tool-logo">
                          Logo
                        </Label>
                        <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_4.75rem] md:grid-cols-[minmax(0,1fr)_4.25rem] xl:grid-cols-[minmax(0,1fr)_4.75rem]">
                          <Input
                            suppressHydrationWarning
                            id="tool-logo"
                            type="url"
                            className={inputClass}
                            placeholder="https://example.com/logo.png"
                            value={logoUrl}
                            maxLength={500}
                            aria-describedby="tool-logo-help"
                            onChange={(e) => setLogoUrl(e.target.value)}
                          />

                          <Label
                            htmlFor="tool-logo-file"
                            className="ai-product-button-secondary flex min-h-14 cursor-pointer items-center justify-center rounded-2xl px-4 text-slate-500 focus-within:ring-[3px] focus-within:ring-ring/50 [.theme-dark_&]:text-slate-300 md:min-h-12 xl:min-h-14"
                            aria-label="Upload logo file"
                          >
                            {isUploadingLogo ? (
                              <span className="text-xl">…</span>
                            ) : (
                              <UploadCloud
                                className="h-5 w-5"
                                aria-hidden="true"
                              />
                            )}

                            <Input
                              suppressHydrationWarning
                              id="tool-logo-file"
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="sr-only"
                              onChange={async (event) => {
                                const file = event.target.files?.[0];

                                if (file) {
                                  await uploadLogoFile(file);
                                }

                                event.target.value = "";
                              }}
                            />
                          </Label>
                        </div>

                        <p
                          id="tool-logo-help"
                          className="ai-product-muted mt-2 text-xs"
                        >
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
                        <Label
                          className={labelClass}
                          htmlFor="tool-description"
                        >
                          Short description{" "}
                          <span className="text-cyan-300 [.theme-light_&]:text-cyan-800">
                            *
                          </span>
                        </Label>
                        <Textarea
                          suppressHydrationWarning
                          id="tool-description"
                          className={`${inputClass} mt-2 min-h-36 resize-y md:min-h-32 xl:min-h-36`}
                          placeholder="Describe what the tool does, who it helps, and the core use case."
                          value={description}
                          maxLength={500}
                          aria-describedby="tool-description-help"
                          aria-required="true"
                          onChange={(e) => setDescription(e.target.value)}
                          rows={5}
                        />
                        <p id="tool-description-help" className={helperClass}>
                          Keep it concise. Maximum 500 characters.
                        </p>
                      </div>
                    </div>
                  </section>

                  <section className={sectionClass}>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                      Submitter details
                    </p>
                    <div className="mt-5 grid gap-5 sm:grid-cols-2 md:gap-4 xl:gap-5">
                      <div>
                        <Label className={labelClass} htmlFor="submitter-name">
                          Your name
                        </Label>
                        <Input
                          suppressHydrationWarning
                          id="submitter-name"
                          className={`${inputClass} mt-2`}
                          placeholder="Optional"
                          value={submitterName}
                          maxLength={80}
                          onChange={(e) => setSubmitterName(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label className={labelClass} htmlFor="submitter-email">
                          Your email
                        </Label>
                        <Input
                          suppressHydrationWarning
                          id="submitter-email"
                          type="email"
                          className={`${inputClass} mt-2`}
                          placeholder="Optional"
                          value={submitterEmail}
                          maxLength={120}
                          aria-describedby="submitter-email-help"
                          onChange={(e) => setSubmitterEmail(e.target.value)}
                        />
                        <p id="submitter-email-help" className={helperClass}>
                          Used only if we need to follow up about the
                          submission.
                        </p>
                      </div>
                    </div>
                  </section>

                  <p className="ai-product-muted mb-2 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] px-4 py-3 text-xs leading-5 [.theme-light_&]:bg-cyan-50/70 sm:mb-3">
                    For security, only HTTPS websites are accepted. Direct
                    download links and unsafe file types are blocked.
                  </p>

                </form>
              </div>

              <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 border-t border-white/10 bg-slate-950/[0.88] px-5 py-2.5 backdrop-blur-xl [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white/[0.92] sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-3 md:px-6 md:py-2.5 xl:px-8 xl:py-3">
                <Button
                  type="button"
                  onClick={closeSubmitPage}
                  variant="ghost"
                  className="ai-product-button-secondary h-10 w-full px-4 py-2 text-sm sm:w-auto"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  form="submit-tool-form"
                  disabled={isSubmitting || isUploadingLogo}
                  variant="ghost"
                  className="ai-product-button-primary h-10 w-full px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-6"
                >
                  {isSubmitting ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>

              {popup && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-md [.theme-light_&]:bg-slate-950/20">
                  <div
                    ref={popupRef}
                    role={isSuccessPopup ? "status" : "alert"}
                    aria-live={isSuccessPopup ? "polite" : "assertive"}
                    aria-atomic="true"
                    className={`tool-details-modal-panel relative w-full max-w-md rounded-[2rem] border p-7 text-center ${
                      isSuccessPopup
                        ? "border-emerald-400/25"
                        : "border-red-400/25"
                    }`}
                  >
                    <Button
                      type="button"
                      aria-label="Close message"
                      onClick={() => setPopup(null)}
                      variant="ghost"
                      size="icon"
                      className="ai-product-button-secondary ai-modal-close-button [.theme-light_&]:text-slate-700"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </Button>

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

                    <Button
                      type="button"
                      ref={popupOkButtonRef}
                      onClick={() => setPopup(null)}
                      variant="ghost"
                      className={`mt-6 h-auto rounded-full px-7 py-3 text-sm font-bold transition-colors duration-200 ${
                        isSuccessPopup
                          ? "bg-emerald-300 text-slate-950 hover:bg-emerald-200"
                          : "bg-red-300 text-slate-950 hover:bg-red-200"
                      }`}
                    >
                      OK
                    </Button>
                  </div>
                </div>
              )}
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
