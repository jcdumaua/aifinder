import type { Metadata, Viewport } from "next";
import { CompareProvider } from "./compare-provider";
import { ThemeProvider } from "./theme-provider";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { GlobalToaster } from "@/components/ui/global-toaster";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const siteUrl = "https://aifinder-eight.vercel.app";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AiFinder",
  alternateName: "AI Finder",
  url: siteUrl,
  description:
    "AiFinder helps you discover useful AI tools for chatbots, image AI, video AI, writing, coding, business, productivity, marketing, SEO, design, and AI agents.",
  publisher: {
    "@type": "Organization",
    name: "AiFinder",
    url: siteUrl,
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
    url: siteUrl,
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
    <html lang="en" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className="bg-slate-50 text-slate-950 antialiased">
        <ThemeProvider>
          <CompareProvider>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
              }}
            />

            {children}
          </CompareProvider>
          <GlobalToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
