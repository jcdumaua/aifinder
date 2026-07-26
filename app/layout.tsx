import type { Metadata, Viewport } from "next";
import { CompareProvider } from "./compare-provider";
import { ThemeProvider } from "./theme-provider";
import "./globals.css";
import { GlobalToaster } from "@/components/ui/global-toaster";
import { SkipLink } from "@/components/public/skip-link";
import { PUBLIC_CANONICAL_ORIGIN } from "../lib/public-canonical-origin";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AiFinder",
  alternateName: "AI Finder",
  url: PUBLIC_CANONICAL_ORIGIN,
  description:
    "AiFinder helps you discover useful AI tools for chatbots, image AI, video AI, writing, coding, business, productivity, marketing, SEO, design, and AI agents.",
  publisher: {
    "@type": "Organization",
    name: "AiFinder",
    url: PUBLIC_CANONICAL_ORIGIN,
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_CANONICAL_ORIGIN),
  applicationName: "AiFinder",
  title: {
    default: "AiFinder — Discover the Best AI Tools",
    template: "%s | AiFinder",
  },
  description:
    "Discover useful AI tools for chatbots, image AI, video AI, voice AI, writing, coding, business, productivity, marketing, SEO, design, and AI agents.",
  keywords: [
    "AI tools",
    "AI directory",
    "best AI tools",
    "chatbots",
    "image AI",
    "video AI",
    "voice AI",
    "writing AI",
    "coding AI",
    "business AI",
    "productivity AI",
    "marketing AI",
    "SEO AI",
    "design AI",
    "AI agents",
  ],
  authors: [{ name: "AiFinder" }],
  creator: "AiFinder",
  publisher: "AiFinder",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_CA",
    url: PUBLIC_CANONICAL_ORIGIN,
    siteName: "AiFinder",
    title: "AiFinder — Discover the Best AI Tools",
    description:
      "Browse a clean directory of AI tools for chatbots, images, videos, writing, coding, business, productivity, marketing, SEO, design, and AI agents.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "AiFinder — Discover the Best AI Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AiFinder — Discover the Best AI Tools",
    description: "Discover useful AI tools by category, pricing, and purpose.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8fafc",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="font-sans">
      <body className="bg-slate-50 text-slate-950 antialiased">
        <SkipLink />
        <ThemeProvider>
          <CompareProvider>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
              }}
            />
            <div id="aifinder-main-content" tabIndex={-1}>
              {children}
            </div>
          </CompareProvider>
          <GlobalToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
