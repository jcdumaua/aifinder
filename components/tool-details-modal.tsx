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
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
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
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-md [.theme-light_&]:bg-slate-950/30"
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
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-slate-950/95 text-white shadow-[0_30px_100px_rgba(0,0,0,0.36)] outline-none [.theme-light_&]:border-cyan-900/15 [.theme-light_&]:bg-white [.theme-light_&]:text-slate-950 [.theme-light_&]:shadow-[0_26px_90px_rgba(15,23,42,0.22)]"
            initial={
              shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }
            }
            animate={{ opacity: 1, scale: 1 }}
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: 42, scale: 0.98 }
            }
            transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-gradient-to-br from-cyan-500/12 via-blue-500/5 to-purple-500/10 [.theme-light_&]:from-cyan-50 [.theme-light_&]:via-white [.theme-light_&]:to-slate-50" />

            <div className="tool-details-modal-scroll relative z-10 max-h-[90vh] overflow-y-auto scroll-smooth">
              <header className="relative overflow-hidden border-b border-white/10 p-5 [.theme-light_&]:border-slate-200 sm:p-8">
                <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl [.theme-light_&]:bg-cyan-200/45" />

                <div className="relative flex items-start justify-between gap-4">
                <motion.div
                  initial={
                    shouldReduceMotion ? false : { opacity: 0, scale: 0.75 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.26,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.18)] sm:h-24 sm:w-24"
                >
                  <img
                    src={tool.logoUrl}
                    alt={`${tool.name} logo`}
                    className="h-12 w-12 object-contain sm:h-14 sm:w-14"
                  />
                </motion.div>

                <button
                  type="button"
                  aria-label={`Close ${tool.name} details`}
                  onClick={onClose}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-slate-100 transition hover:bg-white/15 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white [.theme-light_&]:text-slate-700 [.theme-light_&]:shadow-sm [.theme-light_&]:hover:bg-slate-50"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="relative mt-5 max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                  {tool.category}
                </p>

                <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  {tool.name}
                </h2>

                <p className="mt-4 text-base leading-8 text-slate-300 [.theme-light_&]:text-slate-700">
                  {tool.description}
                </p>
              </div>

              <div className="relative mt-5 flex flex-wrap gap-2">
                {tool.pricing && (
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-100 [.theme-light_&]:border-cyan-700/15 [.theme-light_&]:bg-cyan-50 [.theme-light_&]:text-cyan-800">
                    {tool.pricing}
                  </span>
                )}

                {hasRating && (
                  <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-200 [.theme-light_&]:border-amber-200 [.theme-light_&]:bg-amber-50 [.theme-light_&]:text-amber-700">
                    {tool.rating} / 5
                    {hasReviewCount
                      ? ` · ${tool.reviewCount?.toLocaleString()} reviews`
                      : ""}
                  </span>
                )}

                {platforms.map((platform) => (
                  <span
                    key={platform}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white [.theme-light_&]:text-slate-700"
                  >
                    {platform}
                  </span>
                ))}
              </div>
              </header>

              <div className="p-5 sm:p-8">
                <div className="grid gap-4 md:grid-cols-3">
                  <DetailPanel label="Pricing" value={tool.pricing || "Not listed"} />
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

                {platforms.length > 0 && (
                  <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-slate-50">
                    <h3 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                      Platforms
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {platforms.map((platform) => (
                        <span
                          key={platform}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white [.theme-light_&]:text-slate-700"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {useCases.length > 0 && (
                  <section className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-slate-50">
                    <h3 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                      Features & Use Cases
                    </h3>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {useCases.map((useCase) => (
                        <span
                          key={useCase}
                          className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-100 [.theme-light_&]:border-cyan-700/15 [.theme-light_&]:bg-cyan-50 [.theme-light_&]:text-cyan-800"
                        >
                          {useCase}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section className="mt-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-slate-50">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                    Full Description
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-slate-300 [.theme-light_&]:text-slate-700">
                    {tool.description}
                  </p>
                </section>

              <div className="mt-7 grid gap-3 sm:grid-cols-4">
                <a
                  href={tool.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_14px_32px_rgba(15,23,42,0.2)] transition hover:bg-cyan-100 [.theme-light_&]:bg-slate-950 [.theme-light_&]:text-white [.theme-light_&]:hover:bg-slate-800 sm:col-span-1"
                >
                  Visit Website
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>

                <button
                  type="button"
                  onClick={onToggleCompare}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold text-slate-100 transition hover:bg-white/15 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white [.theme-light_&]:text-slate-700 [.theme-light_&]:shadow-sm [.theme-light_&]:hover:bg-slate-50"
                >
                  <GitCompare className="h-4 w-4" aria-hidden="true" />
                  {isCompared ? "In Compare" : "Compare"}
                </button>

                <button
                  type="button"
                  onClick={onToggleFavorite}
                  disabled={!onToggleFavorite}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold text-slate-100 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white [.theme-light_&]:text-slate-700 [.theme-light_&]:shadow-sm [.theme-light_&]:hover:bg-slate-50"
                >
                  <Star
                    className={isFavorite ? "h-4 w-4 fill-current text-amber-300 [.theme-light_&]:text-amber-500" : "h-4 w-4"}
                    aria-hidden="true"
                  />
                  {isFavorite ? "Saved" : "Save"}
                </button>

                <Link
                  href={`/tool/${tool.slug}`}
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-100 transition hover:bg-white/10 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white [.theme-light_&]:text-slate-700 [.theme-light_&]:shadow-sm [.theme-light_&]:hover:bg-slate-50"
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
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-slate-50">
      <h3 className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300 [.theme-light_&]:text-cyan-800">
        {label}
      </h3>

      <p className="mt-3 text-base font-black leading-6 text-white [.theme-light_&]:text-slate-950">
        {value}
      </p>
    </section>
  );
}
