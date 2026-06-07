"use client";

import {
  AnimatePresence,
  type MotionStyle,
  motion,
  useReducedMotion,
} from "framer-motion";
import { ExternalLink, GitCompare, Star, X } from "lucide-react";
import Link from "next/link";
import { type CSSProperties, useEffect, useId, useState } from "react";
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
  const titleId = useId();
  const descriptionId = useId();

  useOverlayScrollLock(isOpen);

  useEffect(() => {
    const portalTimer = window.setTimeout(() => {
      setPortalContainer(document.body);
    }, 0);

    return () => {
      window.clearTimeout(portalTimer);
    };
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
        event.preventDefault();
        event.stopImmediatePropagation();
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
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
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            className="tool-details-modal-panel ai-corner-safe-panel relative isolate flex min-w-0 max-h-[calc(var(--aifinder-modal-viewport-height,100dvh)-2rem)] w-full max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[1.5rem] border border-cyan-400/20 bg-slate-950 text-white outline-none [.theme-light_&]:border-cyan-900/10 [.theme-light_&]:bg-white [.theme-light_&]:text-slate-950 sm:max-h-[calc(var(--aifinder-modal-viewport-height,100dvh)-3rem)] sm:max-w-[calc(100vw-2rem)] sm:rounded-3xl md:max-w-[min(48rem,calc(100vw-2rem))] xl:max-w-[min(56rem,calc(100vw-2rem))]"
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
            <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-slate-950 [.theme-light_&]:bg-white" />
            <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_28%,rgba(34,211,238,0.14),transparent_34%),linear-gradient(135deg,rgba(34,211,238,0.06),rgba(59,130,246,0.04),rgba(15,23,42,0))] [.theme-light_&]:bg-[radial-gradient(circle_at_50%_30%,rgba(14,116,144,0.08),transparent_36%),linear-gradient(135deg,rgba(236,254,255,0.46),rgba(255,255,255,0.20),rgba(248,250,252,0))]" />

            <header className="relative z-10 max-w-full shrink-0 overflow-hidden border-b border-white/10 bg-slate-950/95 px-4 py-4 pr-16 [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white sm:px-6 sm:py-5 sm:pr-20 md:px-8 xl:pr-20">
              <div className="pointer-events-none absolute inset-0 z-0 bg-slate-950 [.theme-light_&]:bg-white" />
              <div className="pointer-events-none absolute left-1/2 top-12 z-0 h-44 w-56 -translate-x-1/2 rounded-full bg-cyan-400/8 blur-3xl [.theme-light_&]:bg-cyan-200/20 sm:top-14" />

              <div className="absolute top-3 right-3 z-20 sm:top-4 sm:right-4">
                <button
                  type="button"
                  aria-label={`Close ${tool.name} details`}
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white p-0 text-slate-700 shadow-[0_10px_24px_rgba(15,23,42,0.12)] transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 [.theme-dark_&]:border-slate-700 [.theme-dark_&]:bg-slate-950 [.theme-dark_&]:text-slate-100 [.theme-dark_&]:hover:bg-slate-900"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="relative z-10 flex min-w-0 items-start gap-3 sm:gap-4">
                <motion.div
                  initial={
                    shouldReduceMotion ? false : { opacity: 0, scale: 0.75 }
                  }
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.26,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-[0_10px_25px_rgba(15,23,42,0.12)] sm:h-16 sm:w-16 sm:rounded-2xl sm:p-3"
                >
                  <img
                    src={tool.logoUrl}
                    alt={`${tool.name} logo`}
                    className="h-8 w-8 object-contain sm:h-10 sm:w-10"
                  />
                </motion.div>

                <div className="min-w-0 max-w-full pt-0.5">
                  <p className="break-words text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                    {tool.category}
                  </p>

                  <h2
                    id={titleId}
                    className="ai-product-section-title mt-0.5 break-words text-xl leading-tight sm:text-3xl xl:text-[2rem]"
                  >
                    {tool.name}
                  </h2>

                  <p
                    id={descriptionId}
                    className="mt-1 break-words text-xs leading-relaxed text-slate-300 [.theme-light_&]:text-slate-700 sm:mt-2 sm:text-[15px] sm:leading-6"
                  >
                    {tool.description}
                  </p>
                </div>
              </div>

              <div className="relative z-10 mt-3 flex min-w-0 max-w-full flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
                {tool.pricing && (
                  <span className="ai-product-chip max-w-full break-words rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-normal sm:px-2.5 sm:py-1 sm:text-[11px]">
                    {tool.pricing}
                  </span>
                )}

                {hasRating && (
                  <span className="max-w-full break-words rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[10px] font-bold text-amber-200 whitespace-normal [.theme-light_&]:border-amber-200/80 [.theme-light_&]:bg-amber-50/80 [.theme-light_&]:text-amber-700 sm:px-2.5 sm:py-1 sm:text-[11px]">
                    {tool.rating} / 5
                    {hasReviewCount
                      ? ` · ${tool.reviewCount?.toLocaleString()}`
                      : ""}
                  </span>
                )}

                {platforms.map((platform) => (
                  <span
                    key={platform}
                    className="ai-product-chip max-w-full break-words rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-normal sm:px-2.5 sm:py-1 sm:text-[11px]"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </header>

            <div className="tool-details-modal-scroll relative z-10 min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain">
              <div className="min-w-0 max-w-full px-4 py-4 sm:px-6 sm:py-6 md:px-8">
                <div className="grid min-w-0 gap-4">
                  <DetailPanel
                    label="Best For"
                    value={tool.bestFor || tool.category}
                  />
                </div>

                <section className="mt-4 border-t border-white/10 pt-4 [.theme-light_&]:border-slate-200 sm:mt-6 sm:pt-6">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                    About {tool.name}
                  </h3>

                  <div className="mt-2 max-w-full space-y-2 break-words text-sm leading-6 text-slate-300 [.theme-light_&]:text-slate-700 sm:mt-3 sm:space-y-3 sm:leading-7">
                    <p>
                      {tool.name} is a {tool.category.toLowerCase()} tool featured on AiFinder for users 
                      comparing AI software by pricing, platforms, and real-world results.
                    </p>

                    <div className="rounded-lg border-l-2 border-cyan-400/30 bg-cyan-400/5 py-1 pl-3 text-slate-400 [.theme-light_&]:border-cyan-900/20 [.theme-light_&]:bg-cyan-50/50 [.theme-light_&]:text-slate-600">
                      {tool.description}
                    </div>

                    <p>
                      This tool is especially relevant for{" "}
                      {tool.bestFor || tool.category}. You can save it, compare
                      it with other AI tools, open its official website, or
                      continue to the full details page.
                    </p>
                  </div>
                </section>

                {useCases.length > 0 && (
                  <section className="mt-4 border-t border-white/10 pt-4 [.theme-light_&]:border-slate-200 sm:mt-6 sm:pt-6">
                    <h3 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                      Features & Use Cases
                    </h3>

                    <div className="mt-2 flex min-w-0 max-w-full flex-wrap gap-2 sm:mt-3">
                      {useCases.map((useCase) => (
                        <span
                          key={useCase}
                          className="ai-product-chip max-w-full break-words rounded-lg px-2.5 py-1 text-[11px] font-bold whitespace-normal sm:px-3 sm:py-1.5 sm:text-xs"
                        >
                          {useCase}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                <section className="mt-4 border-t border-white/10 pt-4 [.theme-light_&]:border-slate-200 sm:mt-6 sm:pt-6">
                  <h3 className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300 [.theme-light_&]:text-cyan-800">
                    Open Destinations
                  </h3>

                  <div className="mt-2 grid min-w-0 gap-2 sm:mt-3 sm:grid-cols-3 sm:gap-3">
                    <DestinationPanel
                      label="Website"
                      value="Official site"
                      href={tool.website}
                    />
                    <DestinationPanel
                      label="iOS"
                      value={tool.ios ? "Open app listing" : "Not listed"}
                      href={tool.ios || undefined}
                    />
                    <DestinationPanel
                      label="Android"
                      value={tool.android ? "Open app listing" : "Not listed"}
                      href={tool.android || undefined}
                    />
                  </div>
                </section>

                <div className="mt-6 grid min-w-0 gap-3 md:grid-cols-3">
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

function DestinationPanel({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300 [.theme-light_&]:text-cyan-800">
        {label}
      </span>

      <span className="ai-product-heading mt-1 flex items-center gap-2 break-words text-sm font-black leading-tight sm:mt-2 sm:leading-6">
        {value}
        {href && <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />}
      </span>
    </>
  );

  if (!href) {
    return (
      <div className="ai-product-surface-soft min-w-0 rounded-2xl border p-3 opacity-70 sm:p-4">
        {content}
      </div>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="ai-product-surface-soft min-w-0 rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:border-cyan-300/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 [.theme-light_&]:hover:border-cyan-700/20 sm:p-4"
    >
      {content}
    </a>
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
    <section className="ai-product-surface-soft min-w-0 rounded-2xl border p-3.5 sm:p-5">
      <h3 className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300 [.theme-light_&]:text-cyan-800">
        {label}
      </h3>

      <p className="ai-product-heading mt-2 break-words text-sm font-black leading-snug sm:mt-3 sm:text-base sm:leading-6">
        {value}
      </p>
    </section>
  );
}
