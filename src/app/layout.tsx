import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Streamflo — Find Schools in Kenya",
  description: "Discover and compare schools by county, curriculum, gender, performance and more.",
  keywords: "schools Kenya, school directory, CBC schools, IGCSE Kenya, boarding schools Kenya",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet/dist/leaflet.css" />
      </head>
      <body className="bg-slate-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
