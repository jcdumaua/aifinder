import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "./theme-provider";
import { CompareProvider } from "./compare-provider";

export const metadata: Metadata = {
  title: "AiFinder",
  description: "Discover the best AI tools fast.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <CompareProvider>{children}</CompareProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}