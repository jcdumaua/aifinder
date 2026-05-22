import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit an AI Tool",
  description:
    "Submit an AI tool for review and possible listing on AiFinder.",
  alternates: {
    canonical: "/submit",
  },
  openGraph: {
    title: "Submit an AI Tool | AiFinder",
    description:
      "Share an AI tool with AiFinder for review and possible listing.",
    url: "/submit",
  },
};

export default function SubmitLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
