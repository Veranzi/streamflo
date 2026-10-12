import type { Metadata } from "next";
import "@fontsource/outfit/500.css";
import "@fontsource/outfit/600.css";
import "@fontsource/outfit/700.css";
import "@fontsource/josefin-sans/400.css";
import "@fontsource/josefin-sans/500.css";
import "@fontsource/josefin-sans/600.css";
import "@fontsource/josefin-sans/700.css";
import "./globals.css";
import Providers from "@/components/Providers";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://streamflo.avytria.com";
const DESCRIPTION =
  "Find and compare schools across all 47 counties in Kenya, and help learners study smarter with CBE notes, quizzes and a study assistant.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Streamflo | Find Schools in Kenya",
    template: "%s | Streamflo",
  },
  description: DESCRIPTION,
  keywords: "schools Kenya, school directory, CBE schools, IGCSE Kenya, boarding schools Kenya, CBE notes",
  applicationName: "Streamflo",
  openGraph: {
    siteName: "Streamflo",
    locale: "en_KE",
    type: "website",
    title: "Streamflo | Find Schools in Kenya",
    description: DESCRIPTION,
    url: "/",
    images: [{ url: "/icon.png", alt: "Streamflo" }],
  },
  twitter: {
    card: "summary",
    title: "Streamflo | Find Schools in Kenya",
    description: DESCRIPTION,
    images: ["/icon.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
