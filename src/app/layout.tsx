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
import { JsonLd, SITE_URL } from "@/lib/seo";

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
    // Share image: app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "Streamflo | Find Schools in Kenya",
    description: DESCRIPTION,
  },
  // Google Search Console HTML tag verification (only the content="..." value).
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

/** Who Streamflo is, and its search box, for search engines. */
const SITE_JSON_LD = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Streamflo",
    url: SITE_URL,
    logo: `${SITE_URL}/Logo.png`,
    description: DESCRIPTION,
    areaServed: { "@type": "Country", name: "Kenya" },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Streamflo",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/directory?name={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans text-ink">
        <JsonLd data={SITE_JSON_LD} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
