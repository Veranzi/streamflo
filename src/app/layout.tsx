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

export const metadata: Metadata = {
  title: "Streamflo | Find Schools in Kenya",
  description: "Discover and compare schools by county, curriculum, gender, performance and more.",
  keywords: "schools Kenya, school directory, CBE schools, IGCSE Kenya, boarding schools Kenya",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
      </head>
      <body className="min-h-screen bg-slate-50 font-sans text-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
