"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Check, Plus, Sparkles, Star } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export type PublicToolCardData = {
  name: string;
  slug: string;
  category: string;
  description: string;
  website: string;
  logoUrl: string;
  pricing?: string | null;
  platforms: string[];
  rating: number | string;
  reviewCount: number;
  bestFor?: string | null;
  useCases: string[];
  ios?: string | null;
  android?: string | null;
  fallbackIcon?: string;
};

type PublicToolCardProps = {
  tool: PublicToolCardData;
  isFavorite: boolean;
  isCompared: boolean;
  cardBg: string;
  variant: "homepage" | "category";
  badge?: string;
  matchExplanation?: string;
  softText?: string;
  isOpen?: boolean;
  useCornerSafeShell?: boolean;
  onOpenTool: (tool: PublicToolCardData) => void;
  onToggleFavorite: (tool: PublicToolCardData) => void;
  onToggleCompare: (tool: PublicToolCardData) => void;
};

export function PublicToolCard({
  tool,
  isFavorite,
  isCompared,
  cardBg,
  variant,
  badge,
  matchExplanation,
  softText = "text-slate-300 [.theme-light_&]:text-slate-700",
  isOpen = false,
  useCornerSafeShell = false,
  onOpenTool,
  onToggleFavorite,
  onToggleCompare,
}: PublicToolCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const [hasLogoError, setHasLogoError] = useState(false);
  const isHomepage = variant === "homepage";
  const badgeTone =
    badge === "Strong match"
      ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-200 [.theme-light_&]:text-cyan-800"
      : badge === "Good match"
        ? "border-sky-400/25 bg-sky-400/10 text-sky-200 [.theme-light_&]:text-sky-800"
        : "border-slate-500/30 bg-slate-500/10 text-slate-200 [.theme-light_&]:text-slate-700";

  function openTool() {
    if (!tool.slug) {
      console.warn("[AiFinder ToolCard] Missing slug; navigation skipped", {
        toolName: tool.name,
      });
      return;
    }

    onOpenTool(tool);
  }

  return (
    <div className="relative h-full min-w-0">
      <Card
        asChild
        className={`${useCornerSafeShell ? "ai-corner-safe-panel " : ""}group relative isolate h-full min-w-0 cursor-pointer overflow-hidden rounded-3xl border bg-white p-0 shadow-lg transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 [.theme-dark_&]:bg-slate-950 ${cardBg} ai-product-hover`}
      >
        <motion.article
          onClick={openTool}
          animate={
            isOpen && !shouldReduceMotion
              ? { opacity: 0.45, scale: 0.985 }
              : { opacity: 1, scale: 1 }
          }
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-white [.theme-dark_&]:bg-slate-950" />
          <div className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(248,250,252,0.90)_72%,rgba(236,254,255,0.70))] [.theme-dark_&]:bg-[linear-gradient(135deg,rgba(15,23,42,0.78),rgba(2,6,23,0.88)_74%,rgba(8,47,73,0.42))]" />

          {isHomepage && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-24 bg-gradient-to-b from-cyan-300/[0.055] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 [.theme-light_&]:from-cyan-100/60" />
          )}

          <CardContent
            className={`pointer-events-none relative ${isHomepage ? "p-4 sm:p-5" : "p-5"} flex h-full min-w-0 flex-col`}
          >
            <div className={`${isHomepage ? "mb-5" : "mb-4"} flex min-w-0 flex-wrap items-start justify-between gap-3`}>
              {badge ? (
                <Badge
                  variant={isHomepage ? "outline" : undefined}
                  className={
                    isHomepage
                      ? `min-w-0 max-w-full gap-1.5 px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${badgeTone}`
                      : "ai-product-chip max-w-full px-3 py-1 text-xs font-bold"
                  }
                >
                  {isHomepage && <Sparkles className="h-3 w-3" aria-hidden="true" />}
                  <span className="min-w-0 truncate">{badge}</span>
                </Badge>
              ) : isHomepage ? (
                <Badge className="ai-product-chip min-w-0 max-w-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                  <span className="min-w-0 truncate">{tool.category}</span>
                </Badge>
              ) : null}

              <div className={`${isHomepage ? "flex flex-wrap items-center justify-end gap-2" : ""} pointer-events-auto relative z-40 ml-auto min-w-0`}>
                {isHomepage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={
                      isFavorite
                        ? `Remove ${tool.name} from favorites`
                        : `Save ${tool.name}`
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onToggleFavorite(tool);
                    }}
                    className={`rounded-full border border-white/10 bg-black/20 transition-colors duration-200 hover:border-yellow-300/35 hover:bg-yellow-300/[0.08] [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white/80 [.theme-light_&]:text-slate-700 [.theme-light_&]:shadow-sm [.theme-light_&]:hover:border-amber-300/60 [.theme-light_&]:hover:bg-amber-50/80 ${
                      isFavorite ? "text-yellow-300" : "text-slate-300"
                    }`}
                  >
                    <Star
                      className={isFavorite ? "fill-current" : ""}
                      aria-hidden="true"
                    />
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={
                    isCompared
                      ? `Remove ${tool.name} from comparison`
                      : `Compare ${tool.name}`
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onToggleCompare(tool);
                  }}
                  className={`rounded-full border border-white/10 bg-black/20 px-3 text-xs font-bold ${isHomepage ? "whitespace-normal transition-colors duration-200" : ""} hover:border-cyan-300/35 hover:bg-cyan-300/[0.08] [.theme-light_&]:border-slate-200 [.theme-light_&]:bg-white/80 [.theme-light_&]:text-slate-700 [.theme-light_&]:shadow-sm ${
                    isHomepage
                      ? "[.theme-light_&]:hover:border-cyan-700/20 [.theme-light_&]:hover:bg-cyan-50/80"
                      : ""
                  } ${isCompared ? "text-cyan-200" : "text-slate-200"}`}
                >
                  {isHomepage ? (
                    isCompared ? (
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    )
                  ) : null}
                  {isCompared && !isHomepage ? "In Compare" : "Compare"}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <ToolLogo
                tool={tool}
                isOpening={isHomepage && isOpen && !shouldReduceMotion}
                hasLogoError={hasLogoError}
                onLogoError={() => setHasLogoError(true)}
                variant={variant}
              />

              <div className="min-w-0 flex-1">
                <h3 className="ai-product-heading line-clamp-2 text-lg font-black leading-tight">
                  {tool.name}
                </h3>

                <Badge className="ai-product-chip mt-2 px-3 py-1 text-xs font-bold">
                  {isHomepage ? tool.category : tool.pricing}
                </Badge>
              </div>
            </div>

            <p className={`mt-4 flex ${isHomepage ? "min-w-0" : ""} flex-wrap items-center gap-1.5 text-sm font-semibold ${isHomepage ? "text-yellow-200 [.theme-light_&]:text-amber-600" : "text-yellow-300"}`}>
              {isHomepage && <Star className="h-4 w-4 fill-current" aria-hidden="true" />}
              {tool.rating}
              {isHomepage ? null : " / 5"}
              <span className="break-words text-slate-400 [.theme-light_&]:text-slate-600">
                ({tool.reviewCount.toLocaleString()} reviews)
              </span>
            </p>

            <p className={`mt-3 ${isHomepage ? "line-clamp-3 text-slate-300 [.theme-light_&]:text-slate-700" : `line-clamp-4 ${softText}`} text-sm leading-6`}>
              {tool.description}
            </p>

            {matchExplanation && (
              <p className="mt-4 rounded-2xl border border-cyan-400/15 bg-cyan-400/10 px-3 py-2 text-xs font-semibold leading-5 text-cyan-100 [.theme-light_&]:border-cyan-700/15 [.theme-light_&]:bg-cyan-50/80 [.theme-light_&]:text-cyan-800">
                {matchExplanation}
              </p>
            )}

            {!isHomepage && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tool.platforms.slice(0, 3).map((platform) => (
                  <Badge
                    key={platform}
                    variant="secondary"
                    className="ai-product-chip px-3 py-1 text-xs"
                  >
                    {platform}
                  </Badge>
                ))}
              </div>
            )}

            <div className={isHomepage ? "mt-auto flex min-w-0 flex-wrap items-center justify-between gap-3 pt-5" : "mt-auto pt-5"}>
              {isHomepage && (
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500 [.theme-light_&]:text-slate-600">
                  Details
                </span>
              )}

              <Button
                type="button"
                aria-label={`Open ${tool.name} details`}
                size="sm"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  openTool();
                }}
                className={`ai-product-button-primary pointer-events-auto min-h-0 ${isHomepage ? "min-w-0 whitespace-normal" : ""} px-3 py-2 text-xs`}
              >
                View Tool
                {isHomepage && (
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </Button>
            </div>
          </CardContent>
        </motion.article>
      </Card>
    </div>
  );
}

function ToolLogo({
  tool,
  isOpening,
  hasLogoError,
  onLogoError,
  variant,
}: {
  tool: PublicToolCardData;
  isOpening: boolean;
  hasLogoError: boolean;
  onLogoError: () => void;
  variant: "homepage" | "category";
}) {
  const fallbackIcon = tool.fallbackIcon || tool.category.slice(0, 1);
  const image = hasLogoError ? (
    <span className="text-2xl" aria-hidden="true">
      {fallbackIcon}
    </span>
  ) : (
    <img
      src={tool.logoUrl}
      alt={`${tool.name} logo`}
      className={variant === "homepage" ? "h-9 w-9 object-contain" : "h-9 w-9 object-contain"}
      onError={onLogoError}
    />
  );

  if (variant === "homepage") {
    return (
      <motion.div
        animate={isOpening ? { scale: 1.16 } : { scale: 1 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.22)]"
      >
        {image}
      </motion.div>
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
      {image}
    </div>
  );
}
