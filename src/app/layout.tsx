import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import type { Metadata, Viewport } from "next";
import { Inria_Serif, Inter } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import React from "react";
import "./globals.css";

// The app-wide UI face. font-geist / font-funnel (headings, body) both point
// at it in globals.css, so every weight they ask for needs a real file —
// otherwise the browser fake-bolds the 400 cut, which reads blurry.
const interSans = Inter({
  variable: "--font-body-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Editorial serif for banner titles and footers (.v3-display). Only Regular is
// loaded, so no heavier weight can be used by accident.
const displaySerif = Inria_Serif({
  variable: "--font-display-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal"],
  display: "swap",
});

// eslint-disable-next-line react-refresh/only-export-components
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Lets the app run under the notch/status bar instead of leaving a bar.
  viewportFit: "cover",
  // Tints the mobile browser chrome to match the canvas.
  themeColor: "#FFFFFF",
};

// eslint-disable-next-line react-refresh/only-export-components
export const metadata: Metadata = {
  title: "FinSharpeGPT",
  description: "Finance Agents by FinSharpe",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FinSharpeGPT",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${interSans.variable} ${displaySerif.variable} antialiased`}
    >
      <body>
        <AuthProvider>
          <QueryProvider>
            <NuqsAdapter>{children}</NuqsAdapter>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
