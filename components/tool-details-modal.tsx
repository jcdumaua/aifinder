"use client";

import {
  AnimatePresence,
  type MotionStyle,
  motion,
  useReducedMotion,
} from "framer-motion";
import { ExternalLink, GitCompare, Star, X } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/app/theme-provider";
import { useOverlayScrollLock } from "@/lib/use-overlay-scroll-lock";

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
  const { isLightMode } = useTheme();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null,
  );
  const [visualViewportHeight, setVisualViewportHeight] = useState<number>(0);

  useOverlayScrollLock(isOpen);

  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let animationFrame = 0;

    function updateVisibleViewportHeight() {
      cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const visibleHeight =
          window.visualViewport?.height ?? window.innerHeight;

        setVisualViewportHeight(Math.floor(visibleHeight));
      });
    }

    updateVisibleViewportHeight();
    window.addEventListener("resize", updateVisibleViewportHeight);
    window.addEventListener("orientationchange", updateVisibleViewportHeight);
    window.visualViewport?.addEventListener(
      "resize",
      updateVisibleViewportHeight,
    );
    window.visualViewport?.addEventListener(
      "scroll",
      updateVisibleViewportHeight,
    );

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateVisibleViewportHeight);
      window.removeEventListener(
        "orientationchange",
        updateVisibleViewportHeight,
      );
      window.visualViewport?.removeEventListener(
        "resize",
        updateVisibleViewportHeight,
      );
      window.visualViewport?.removeEventListener(
        "scroll",
        updateVisibleViewportHeight,
      );
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const platforms = tool?.platforms?.filter(Boolean) ?? [];
  const useCases = tool?.useCases?.filter(Boolean) ?? [];
  const hasRating = tool?.rating !== null && tool?.rating !== undefined;
  const hasReviewCount =
    tool?.reviewCount !== null && tool?.reviewCount !== undefined;
  const viewportHeightStyle =
    visualViewportHeight > 0
      ? ({
          "--aifinder-modal-viewport-height": `${visualViewportHeight}px`,
        } satisfies CSSProperties & {
          "--aifinder-modal-viewport-height": string;
        }) as MotionStyle & {
          "--aifinder-modal-viewport-height": string;
        }
      : undefined;

  const modal = (
    <AnimatePresence>
      {isOpen && tool && (
        <motion.div
          className={`fixed inset-0 z-[100] flex w-screen items-center justify-center overflow-hidden px-3 py-4 sm:px-4 sm:py-6 ${
            isLightMode ? "theme-light" : "theme-dark"
          }`}
          style={viewportHeightStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.16 }}
          onClick={onClose}
          role="presentation"
        >
          <div className="tool-details-modal-backdrop-layer pointer-events-none fixed inset-x-0 -inset-y-[100lvh] w-screen" />

          <motion.section
            aria-modal="true"
            role="dialog"
            aria-label={`${tool.name} details`}
            className="tool-details-modal-panel relative flex min-w-0 max-h-[calc(var(--aifinder-modal-viewport-height,100dvh)-2rem)] w-full max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[1.5rem] border border-cyan-400/20 text-white outline-none [.theme-light_&]:border-cyan-900/10 [.theme-light_&]:text-slate-950 sm:max-h-[calc(var(--aifinder-modal-viewport-height,100dvh)-3rem)] sm:max-w-[calc(100vw-2rem)] sm:rounded-[2rem] md:max-w-[min(48rem,calc(100vw-2rem))] xl:max-w-[min(56rem,calc(100vw-2rem))]"
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96 }}
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
            onClick={(event) => event.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.16),transparent_32%),linear-gradient(135deg,rgba(34,211,238,0.08),rgba(59,130,246,0.04),rgba(15,23,42,0))] [.theme-light_&]:bg-[radial-gradient(circle_at_18%_0%,rgba(14,116,144,0.10),transparent_34%),linear-gradient(135deg,rgba(236,254,255,0.72),rgba(255,255,255,0.20),rgba(248,250,252,0))]" />

            <button
              type="button"
              aria-label={`Close ${tool.name} details`}
              onClick={onClose}
              className="ai-product-button-secondary ai-modal-close-button [.theme-light_&]:text-slate-700"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>

            <header className="relative z-10 max-w-full shrink-0 overflow-hidden border-b border-white/10 px-4 pb-5 pr-14 pt-6 [.theme-light_&]:border-slate-200 sm:px-6 sm:pb-7 sm:pr-16 sm:pt-8 md:px-8 xl:pr-20">
              <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl [.theme-light_&]:bg-cyan-200/30" />

              <div className="relative flex items-start">
                <motion.div
                  initial={
                    shouldReduceMotion ? false : { opacity: 0, scale: 0.75 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.26,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_16px_42px_rgba(15,23,42,0.16)] sm:h-24 sm:w-24 sm:rounded-[1.5rem] sm:p-4"
                >
                  <img
                    src={tool.logoUrl}
                    alt={`${tool.name} logo`}
                    className="h-10 w-10 object-contain sm:h-14 sm:w-14"
                  />
                </motion.div>
              </div>

              <div className="relative mt-5 min-w-0 max-w-full sm:mt-6">
                <p className="break-words text-xs font-black uppercase tracking-[0.22em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                  {tool.category}
                </p>

                <h2 className="ai-product-section-title mt-2 break-words text-3xl xl:text-4xl">
                  {tool.name}
                </h2>

                <p className="mt-4 break-words text-base leading-8 text-slate-300 [.theme-light_&]:text-slate-700">
                  {tool.description}
                </p>
              </div>

              <div className="relative mt-5 flex min-w-0 max-w-full flex-wrap gap-2.5">
                {tool.pricing && (
                  <span className="ai-product-chip max-w-full break-words rounded-full px-3 py-1.5 text-xs font-bold whitespace-normal">
                    {tool.pricing}
                  </span>
                )}

                {hasRating && (
                  <span className="max-w-full break-words rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-bold text-amber-200 whitespace-normal [.theme-light_&]:border-amber-200/80 [.theme-light_&]:bg-amber-50/80 [.theme-light_&]:text-amber-700">
                    {tool.rating} / 5
                    {hasReviewCount
                      ? ` · ${tool.reviewCount?.toLocaleString()} reviews`
                      : ""}
                  </span>
                )}

                {platforms.map((platform) => (
                  <span
                    key={platform}
                    className="ai-product-chip max-w-full break-words rounded-full px-3 py-1.5 text-xs font-semibold whitespace-normal"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </header>

            <div className="tool-details-modal-scroll relative z-10 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
              <div className="min-w-0 max-w-full px-4 py-6 sm:px-6 sm:py-8 md:px-8">
                <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
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

                <section className="mt-7 border-t border-white/10 pt-6 [.theme-light_&]:border-slate-200">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                    About {tool.name}
                  </h3>

                  <div className="mt-4 max-w-full space-y-4 break-words text-sm leading-7 text-slate-300 [.theme-light_&]:text-slate-700">
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
                  <section className="mt-7 border-t border-white/10 pt-6 [.theme-light_&]:border-slate-200">
                    <h3 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                      Platforms
                    </h3>

                    <div className="mt-4 flex min-w-0 max-w-full flex-wrap gap-2.5">
                      {platforms.map((platform) => (
                        <span
                          key={platform}
                          className="ai-product-chip max-w-full break-words rounded-full px-3 py-1.5 text-xs font-semibold whitespace-normal"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {useCases.length > 0 && (
                  <section className="mt-7 border-t border-white/10 pt-6 [.theme-light_&]:border-slate-200">
                    <h3 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                      Features & Use Cases
                    </h3>

                    <div className="mt-4 flex min-w-0 max-w-full flex-wrap gap-2.5">
                      {useCases.map((useCase) => (
                        <span
                          key={useCase}
                          className="ai-product-chip max-w-full break-words rounded-full px-3 py-1.5 text-xs font-bold whitespace-normal"
                        >
                          {useCase}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section className="mt-7 border-t border-white/10 pt-6 [.theme-light_&]:border-slate-200">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                    Availability
                  </h3>

                  <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">
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

                <div className="mt-8 grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <a
                    href={tool.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ai-product-button-primary min-w-0 gap-2 whitespace-normal px-4 py-3 text-center text-sm sm:px-5"
                  >
                    Visit Website
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>

                  <button
                    type="button"
                    onClick={onToggleCompare}
                    className="ai-product-button-secondary min-w-0 gap-2 whitespace-normal px-4 py-3 text-center text-sm sm:px-5"
                  >
                    <GitCompare className="h-4 w-4" aria-hidden="true" />
                    {isCompared ? "In Compare" : "Compare"}
                  </button>

                  <button
                    type="button"
                    onClick={onToggleFavorite}
                    disabled={!onToggleFavorite}
                    className="ai-product-button-secondary min-w-0 gap-2 whitespace-normal px-4 py-3 text-center text-sm disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
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
                      className="ai-product-button-secondary min-w-0 whitespace-normal px-4 py-3 text-center text-sm sm:px-5"
                    >
                      iOS App
                    </a>
                  )}

                  {tool.android && (
                    <a
                      href={tool.android}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ai-product-button-secondary min-w-0 whitespace-normal px-4 py-3 text-center text-sm sm:px-5"
                    >
                      Android App
                    </a>
                  )}

                  <Link
                    href={`/tool/${tool.slug}`}
                    className="ai-product-button-secondary min-w-0 whitespace-normal px-4 py-3 text-center text-sm sm:px-5"
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

  if (!portalContainer) {
    return null;
  }

  return createPortal(modal, portalContainer);
}

function DetailPanel({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <section className="ai-product-surface-soft min-w-0 rounded-2xl border p-4 sm:p-5">
      <h3 className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300 [.theme-light_&]:text-cyan-800">
        {label}
      </h3>

      <p className="ai-product-heading mt-3 break-words text-base font-black leading-6">
        {value}
      </p>
    </section>
  );
}
