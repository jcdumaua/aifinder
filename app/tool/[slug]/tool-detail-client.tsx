"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { slugify } from "../../data/tools";
import { useCompare } from "../../compare-provider";
import { useTheme } from "../../theme-provider";

export type ToolPageData = {
  name: string;
  slug: string;
  category: string;
  description: string;
  website: string;
  pricing: string;
  logoUrl: string;
  platforms: string[];
  featured: boolean;
  bestFor: string;
  useCases: string[];
  ios: string | null;
  android: string | null;
  rating: number;
  reviewCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type ToolDetailClientProps = {
  tool: ToolPageData;
  similarTools: ToolPageData[];
};

export default function ToolDetailClient({
  tool,
  similarTools,
}: ToolDetailClientProps) {
  const { isLightMode, toggleTheme } = useTheme();
  const { compareSlugs, toggleCompare } = useCompare();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [isLeaving, setIsLeaving] = useState(false);

  const isCompared = compareSlugs.includes(tool.slug);

  const pageBg = "ai-product-page";

  const cardBg = "ai-product-surface";

  const mutedText = "ai-product-muted";
  const softText = "ai-product-body";
  const chipBg = "ai-product-chip";

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function navigateHomeWithExit() {
    if (isLeaving) return;

    if (shouldReduceMotion) {
      router.push("/");
      return;
    }

    setIsLeaving(true);
    window.setTimeout(() => {
      router.push("/");
    }, 180);
  }

  return (
    <motion.main
      animate={isLeaving ? { opacity: 0, x: 48 } : { opacity: 1, x: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{ willChange: isLeaving ? "opacity, transform" : undefined }}
      className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${pageBg}`}
    >
      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 xl:max-w-7xl">
        <nav className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={navigateHomeWithExit}
            className="ai-product-button-secondary px-4 py-2 text-sm"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={navigateHomeWithExit}
            className="ai-product-button-secondary px-4 py-2 text-sm"
          >
            🏠 Home
          </button>

          <Link
            href={`/category/${slugify(tool.category)}`}
            className="ai-product-chip rounded-full px-4 py-2 text-sm font-bold"
          >
            {tool.category}
          </Link>

          <button
            onClick={toggleTheme}
            className="ai-product-button-secondary px-4 py-2 text-sm"
          >
            {isLightMode ? "🌙 Dark" : "☀️ Light"}
          </button>
        </nav>

        <article className={`mt-8 overflow-hidden rounded-[2rem] border shadow-2xl ${cardBg}`}>
          <header className="relative border-b border-white/10 p-6 sm:p-10 [.theme-light_&]:border-slate-200">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 [.theme-light_&]:from-cyan-50/80 [.theme-light_&]:via-transparent [.theme-light_&]:to-slate-50/80" />
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl [.theme-light_&]:bg-cyan-200/25" />

            <div className="relative z-10 flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                <ToolLogo
                  tool={tool}
                  large
                  animateOnEntry={!shouldReduceMotion}
                />

                <div>
                  <p className="ai-product-eyebrow text-sm font-bold uppercase tracking-widest">
                    {tool.category} AI Tool
                  </p>

                  <h1 className="ai-product-heading mt-2 text-4xl font-black tracking-tight sm:text-6xl">
                    {tool.name}
                  </h1>

                  <p className={`mt-4 max-w-3xl text-lg leading-8 ${softText}`}>
                    {tool.description}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <span className="inline-flex items-center rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-sm font-bold text-yellow-300 [.theme-light_&]:border-amber-200 [.theme-light_&]:bg-amber-50 [.theme-light_&]:text-amber-700">
                      ⭐ {tool.rating} / 5 · {tool.reviewCount.toLocaleString()} reviews
                    </span>

                    <span className="ai-product-chip inline-flex items-center rounded-full px-4 py-2 text-sm font-bold">
                      {tool.pricing}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <a
                  href={tool.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ai-product-button-primary px-5 py-3 text-center text-sm"
                >
                  Visit Website
                </a>

                <button
                  onClick={() => toggleCompare(tool.slug)}
                  className="ai-product-button-secondary px-5 py-3 text-sm"
                >
                  {isCompared ? "✓ In Compare" : "+ Compare"}
                </button>

                {tool.ios && (
                  <a
                    href={tool.ios}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ai-product-button-secondary px-5 py-3 text-center text-sm"
                  >
                    🍎 iOS
                  </a>
                )}

                {tool.android && (
                  <a
                    href={tool.android}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ai-product-button-secondary px-5 py-3 text-center text-sm"
                  >
                    🤖 Android
                  </a>
                )}
              </div>
            </div>
          </header>

          <section className="grid gap-4 p-6 sm:p-10 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard title="Pricing" value={tool.pricing} cardBg={cardBg} />
            <InfoCard title="Rating" value={`${tool.rating} / 5`} cardBg={cardBg} />
            <InfoCard
              title="Reviews"
              value={tool.reviewCount.toLocaleString()}
              cardBg={cardBg}
            />
            <InfoCard title="Best For" value={tool.bestFor} cardBg={cardBg} />
          </section>

          <section className="border-t border-white/10 p-6 sm:p-10 [.theme-light_&]:border-slate-200">
            <p className="ai-product-eyebrow text-xs font-bold uppercase tracking-widest">
              Platforms
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {tool.platforms.map((platform) => (
                <span
                  key={platform}
                  className={`rounded-full border px-4 py-2 text-sm ${chipBg}`}
                >
                  {platform}
                </span>
              ))}
            </div>
          </section>

          <section className="border-t border-white/10 p-6 sm:p-10 [.theme-light_&]:border-slate-200">
            <p className="ai-product-eyebrow text-xs font-bold uppercase tracking-widest">
              Common Use Cases
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {tool.useCases.map((useCase) => (
                <span
                  key={useCase}
                  className="ai-product-chip rounded-full px-4 py-2 text-sm"
                >
                  {useCase}
                </span>
              ))}
            </div>
          </section>

          <section className="border-t border-white/10 p-6 sm:p-10 [.theme-light_&]:border-slate-200">
            <p className="ai-product-eyebrow text-xs font-bold uppercase tracking-widest">
              About {tool.name}
            </p>

            <div className={`mt-5 max-w-4xl space-y-5 text-lg leading-8 ${softText}`}>
              <p>
                {tool.name} is listed on AiFinder as a {tool.category.toLowerCase()} tool
                for people who want to discover practical AI software faster.
              </p>

              <p>{tool.description}</p>

              <p>
                This tool may be useful for users looking for {tool.bestFor.toLowerCase()}.
                You can compare it with other {tool.category.toLowerCase()} tools,
                bookmark it for later, or open the official website to learn more.
              </p>
            </div>
          </section>

          <section className="border-t border-white/10 p-6 sm:p-10 [.theme-light_&]:border-slate-200">
            <p className="ai-product-eyebrow text-xs font-bold uppercase tracking-widest">
              Quick FAQ
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FaqCard
                question={`What is ${tool.name}?`}
                answer={`${tool.name} is a ${tool.category} AI tool listed on AiFinder. ${tool.description}`}
                cardBg={cardBg}
                softText={softText}
              />

              <FaqCard
                question={`Is ${tool.name} free?`}
                answer={`${tool.name} is listed with this pricing option: ${tool.pricing}. Check the official website for the latest plan details.`}
                cardBg={cardBg}
                softText={softText}
              />

              <FaqCard
                question={`What is ${tool.name} best for?`}
                answer={`${tool.name} is best for ${tool.bestFor}.`}
                cardBg={cardBg}
                softText={softText}
              />

              <FaqCard
                question={`Can I compare ${tool.name} with other AI tools?`}
                answer={`Yes. Use AiFinder's compare feature to compare ${tool.name} with other AI tools side-by-side.`}
                cardBg={cardBg}
                softText={softText}
              />
            </div>
          </section>
        </article>

        {similarTools.length > 0 && (
          <section className="mt-10">
            <p className="ai-product-eyebrow text-xs font-bold uppercase tracking-widest">
              Similar Tools
            </p>

            <h2 className="ai-product-heading mt-2 text-3xl font-black">
              More {tool.category} tools
            </h2>

            <p className={`mt-3 max-w-2xl text-sm leading-7 ${mutedText}`}>
              Explore more AI tools in the same category and compare them before
              choosing the right one.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {similarTools.map((similarTool) => (
                <Link
                  key={similarTool.slug}
                  href={`/tool/${similarTool.slug}`}
                  className={`group rounded-3xl border p-5 ${cardBg} ai-product-hover`}
                >
                  <ToolLogo tool={similarTool} />

                  <h3 className="ai-product-heading mt-4 font-bold">{similarTool.name}</h3>

                  <p className="ai-product-eyebrow mt-2 text-sm font-semibold">
                    {similarTool.category}
                  </p>

                  <p className="mt-1 text-sm text-yellow-300">
                    ⭐ {similarTool.rating} ({similarTool.reviewCount.toLocaleString()} reviews)
                  </p>

                  <p className={`mt-3 text-sm leading-6 ${softText}`}>
                    {similarTool.description}
                  </p>

                  <span className="ai-product-eyebrow mt-5 inline-block text-sm font-bold">
                    View Tool →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className={`mt-10 rounded-[2rem] border p-6 sm:p-8 ${cardBg}`}>
          <p className="ai-product-eyebrow text-xs font-bold uppercase tracking-widest">
            Discover More
          </p>

          <h2 className="ai-product-heading mt-2 text-3xl font-black">
            Browse more AI tools on AiFinder
          </h2>

          <p className={`mt-3 max-w-3xl text-sm leading-7 ${mutedText}`}>
            AiFinder helps you search, bookmark, and compare AI tools for
            writing, coding, image generation, video editing, business,
            productivity, marketing, SEO, design, and AI agents.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/"
              className="ai-product-button-primary px-5 py-3 text-sm"
            >
              Browse All Tools
            </Link>

            <Link
              href="/submit"
              className="ai-product-button-secondary px-5 py-3 text-sm"
            >
              Submit a Tool
            </Link>
          </div>
        </section>
      </section>
    </motion.main>
  );
}

function InfoCard({
  title,
  value,
  cardBg,
}: {
  title: string;
  value: string;
  cardBg: string;
}) {
  return (
    <div className={`rounded-3xl border p-5 ${cardBg} ai-product-hover`}>
      <p className="ai-product-eyebrow text-xs font-bold uppercase tracking-widest">
        {title}
      </p>

      <p className="ai-product-heading mt-3 line-clamp-3 text-xl font-black">{value}</p>
    </div>
  );
}

function FaqCard({
  question,
  answer,
  cardBg,
  softText,
}: {
  question: string;
  answer: string;
  cardBg: string;
  softText: string;
}) {
  return (
    <div className={`rounded-3xl border p-5 ${cardBg} ai-product-hover`}>
      <h3 className="ai-product-heading font-black">{question}</h3>

      <p className={`mt-3 text-sm leading-7 ${softText}`}>{answer}</p>
    </div>
  );
}

function ToolLogo({
  tool,
  large = false,
  animateOnEntry = false,
}: {
  tool: ToolPageData;
  large?: boolean;
  animateOnEntry?: boolean;
}) {
  return (
    <motion.div
      initial={animateOnEntry ? { opacity: 0, scale: 0.85 } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`flex shrink-0 items-center justify-center overflow-hidden border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.12)] ${
        large ? "h-24 w-24 rounded-[2rem]" : "h-14 w-14 rounded-2xl"
      }`}
    >
      <img
        src={tool.logoUrl}
        alt={`${tool.name} logo`}
        className={large ? "h-14 w-14 object-contain" : "h-9 w-9 object-contain"}
      />
    </motion.div>
  );
}
