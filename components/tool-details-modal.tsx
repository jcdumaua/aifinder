"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, GitCompare, Star, X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export type ToolDetailsModalData = {
  name: string;
  slug: string;
  category: string;
  description: string;
  website: string;
  logoUrl: string;
  pricing?: string | null;
  platforms?: string[] | null;
  rating?: number | string | null;
  reviewCount?: number | null;
  bestFor?: string | null;
  useCases?: string[] | null;
  ios?: string | null;
  android?: string | null;
};

type ToolDetailsModalProps = {
  tool: ToolDetailsModalData | null;
  isOpen: boolean;
  isCompared: boolean;
  isFavorite?: boolean;
  onClose: () => void;
  onToggleCompare: () => void;
  onToggleFavorite?: () => void;
};

export function ToolDetailsModal({
  tool,
  isOpen,
  isCompared,
  isFavorite = false,
  onClose,
  onToggleCompare,
  onToggleFavorite,
}: ToolDetailsModalProps) {
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "contain";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.overscrollBehavior = originalOverscrollBehavior;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const platforms = tool?.platforms?.filter(Boolean) ?? [];
  const useCases = tool?.useCases?.filter(Boolean) ?? [];
  const hasRating = tool?.rating !== null && tool?.rating !== undefined;
  const hasReviewCount =
    tool?.reviewCount !== null && tool?.reviewCount !== undefined;

  return (
    <AnimatePresence>
      {isOpen && tool && (
        <motion.div
          className="ai-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center px-3 py-4 sm:px-4 sm:py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.section
            aria-modal="true"
            role="dialog"
            aria-label={`${tool.name} details`}
            className="tool-details-premium-panel tool-details-modal-panel relative max-h-[88dvh] w-full max-w-4xl overflow-hidden rounded-[1.5rem] border border-cyan-400/20 text-white outline-none [.theme-light_&]:border-cyan-900/10 [.theme-light_&]:text-slate-950 sm:max-h-[90dvh] sm:rounded-[2rem]"
            initial={
              shouldReduceMotion ? false : { opacity: 0, scale: 0.955 }
            }
            animate={{ opacity: 1, scale: 1 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: 42, scale: 0.98 }
            }
            transition={{
              duration: shouldReduceMotion ? 0 : 0.24,
              ease: [0.22, 1, 0.36, 1],
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_16%_2%,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_86%_16%,rgba(129,140,248,0.10),transparent_30%),linear-gradient(135deg,rgba(34,211,238,0.08),rgba(59,130,246,0.04),rgba(15,23,42,0))] [.theme-light_&]:bg-[radial-gradient(circle_at_16%_2%,rgba(14,116,144,0.10),transparent_34%),radial-gradient(circle_at_86%_16%,rgba(59,130,246,0.08),transparent_30%),linear-gradient(135deg,rgba(236,254,255,0.72),rgba(255,255,255,0.28),rgba(248,250,252,0))]" />

            <button
              type="button"
              aria-label={`Close ${tool.name} details`}
              onClick={onClose}
              className="ai-product-button-secondary ai-modal-close-button [.theme-light_&]:text-slate-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <div className="tool-details-modal-scroll relative z-10 max-h-[88dvh] overflow-y-auto overscroll-contain scroll-smooth sm:max-h-[90dvh]">
              <header className="tool-details-premium-hero relative overflow-hidden border-b border-white/10 px-5 pb-6 pr-16 pt-6 [.theme-light_&]:border-slate-200 sm:px-8 sm:pb-8 sm:pr-20 sm:pt-8">
                <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl [.theme-light_&]:bg-cyan-200/32" />
                <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl [.theme-light_&]:bg-sky-100/70" />

                <div className="relative grid gap-5 sm:grid-cols-[6rem_minmax(0,1fr)] sm:gap-6">
                  <motion.div
                    initial={
                      shouldReduceMotion ? false : { opacity: 0, scale: 0.72 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      duration: shouldReduceMotion ? 0 : 0.32,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="tool-details-logo-shell flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.35rem] border border-white/70 bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.18)] [.theme-dark_&]:border-white/12 sm:h-24 sm:w-24 sm:rounded-[1.6rem] sm:p-4"
                  >
                    <img
                      src={tool.logoUrl}
                      alt={`${tool.name} logo`}
                      className="h-full max-h-14 w-full max-w-14 object-contain sm:max-h-16 sm:max-w-16"
                    />
                  </motion.div>

                  <div className="min-w-0 self-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-cyan-300/18 bg-cyan-300/[0.08] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200 [.theme-light_&]:border-cyan-800/12 [.theme-light_&]:bg-cyan-50/80 [.theme-light_&]:text-cyan-800">
                        {tool.category}
                      </span>

                      {hasRating && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/18 bg-amber-300/[0.08] px-3 py-1 text-[11px] font-black text-amber-200 [.theme-light_&]:border-amber-200/80 [.theme-light_&]:bg-amber-50/90 [.theme-light_&]:text-amber-700">
                          <Star
                            className="h-3.5 w-3.5 fill-current"
                            aria-hidden="true"
                          />
                          {tool.rating} / 5
                          {hasReviewCount
                            ? ` · ${tool.reviewCount?.toLocaleString()}`
                            : ""}
                        </span>
                      )}
                    </div>

                    <h2 className="ai-product-section-title mt-3 text-3xl leading-tight sm:text-4xl">
                      {tool.name}
                    </h2>

                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 [.theme-light_&]:text-slate-700 sm:text-base sm:leading-8">
                      {tool.description}
                    </p>
                  </div>
                </div>

                <div className="relative mt-5 flex flex-wrap gap-2.5 sm:ml-[7.5rem]">
                  {tool.pricing && (
                    <span className="ai-product-chip rounded-full px-3 py-1.5 text-xs font-bold">
                      {tool.pricing}
                    </span>
                  )}

                  {platforms.map((platform) => (
                    <span
                      key={platform}
                      className="ai-product-chip rounded-full px-3 py-1.5 text-xs font-semibold"
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </header>

              <div className="px-5 py-6 sm:px-8 sm:py-8">
                <div className="grid gap-3 md:grid-cols-3">
                  <DetailPanel
                    label="Pricing"
                    value={tool.pricing || "Not listed"}
                  />
                  <DetailPanel
                    label="Rating"
                    value={
                      hasRating
                        ? `${tool.rating} / 5${
                            hasReviewCount
                              ? ` · ${tool.reviewCount?.toLocaleString()} reviews`
                              : ""
                          }`
                        : "Not listed"
                    }
                  />
                  <DetailPanel
                    label="Best For"
                    value={tool.bestFor || tool.category}
                  />
                </div>

                <section className="mt-8 border-t border-white/10 pt-7 [.theme-light_&]:border-slate-200">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                    About {tool.name}
                  </h3>

                  <div className="mt-4 max-w-3xl space-y-4 text-sm leading-7 text-slate-300 [.theme-light_&]:text-slate-700">
                    <p>
                      {tool.name} is listed on AiFinder as a{" "}
                      {tool.category.toLowerCase()} tool for people comparing
                      practical AI software by pricing, platform, ratings, and
                      common use cases.
                    </p>

                    <p>{tool.description}</p>

                    <p>
                      This tool is especially relevant for{" "}
                      {tool.bestFor || tool.category}. You can save it, compare
                      it with other AI tools, open its official website, or
                      continue to the full details page.
                    </p>
                  </div>
                </section>

                {platforms.length > 0 && (
                  <section className="mt-8 border-t border-white/10 pt-7 [.theme-light_&]:border-slate-200">
                    <h3 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                      Platforms
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {platforms.map((platform) => (
                        <span
                          key={platform}
                          className="ai-product-chip rounded-full px-3 py-1.5 text-xs font-semibold"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {useCases.length > 0 && (
                  <section className="mt-8 border-t border-white/10 pt-7 [.theme-light_&]:border-slate-200">
                    <h3 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                      Features & Use Cases
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2.5">
                      {useCases.map((useCase) => (
                        <span
                          key={useCase}
                          className="ai-product-chip rounded-full px-3 py-1.5 text-xs font-bold"
                        >
                          {useCase}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section className="mt-8 border-t border-white/10 pt-7 [.theme-light_&]:border-slate-200">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                    Availability
                  </h3>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <DetailPanel label="Website" value="Official site" />
                    <DetailPanel
                      label="iOS"
                      value={tool.ios ? "Available" : "Not listed"}
                    />
                    <DetailPanel
                      label="Android"
                      value={tool.android ? "Available" : "Not listed"}
                    />
                  </div>
                </section>

                <div className="mt-8 grid gap-3 sm:grid-cols-4">
                  <a
                    href={tool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ai-product-button-primary gap-2 px-5 py-3 text-sm sm:col-span-1"
                  >
                    Visit Website
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>

                  <button
                    type="button"
                    onClick={onToggleCompare}
                    className="ai-product-button-secondary gap-2 px-5 py-3 text-sm"
                  >
                    <GitCompare className="h-4 w-4" aria-hidden="true" />
                    {isCompared ? "In Compare" : "Compare"}
                  </button>

                  <button
                    type="button"
                    onClick={onToggleFavorite}
                    disabled={!onToggleFavorite}
                    className="ai-product-button-secondary gap-2 px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Star
                      className={
                        isFavorite
                          ? "h-4 w-4 fill-current text-amber-300 [.theme-light_&]:text-amber-500"
                          : "h-4 w-4"
                      }
                      aria-hidden="true"
                    />
                    {isFavorite ? "Saved" : "Save"}
                  </button>

                  {tool.ios && (
                    <a
                      href={tool.ios}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ai-product-button-secondary px-5 py-3 text-sm"
                    >
                      iOS App
                    </a>
                  )}

                  {tool.android && (
                    <a
                      href={tool.android}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ai-product-button-secondary px-5 py-3 text-sm"
                    >
                      Android App
                    </a>
                  )}

                  <Link
                    href={`/tool/${tool.slug}`}
                    className="ai-product-button-secondary px-5 py-3 text-sm"
                  >
                    Full Details
                  </Link>
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function DetailPanel({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <section className="ai-product-surface-soft rounded-2xl border p-4 sm:p-5">
      <h3 className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300 [.theme-light_&]:text-cyan-800">
        {label}
      </h3>

      <p className="ai-product-heading mt-3 text-base font-black leading-6">
        {value}
      </p>
    </section>
  );
}
