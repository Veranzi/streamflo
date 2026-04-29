import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import DirectoryClient from "./DirectoryClient";

export const metadata = {
  title: "School Directory — Streamflo",
  description: "Browse and filter schools across Kenya by county, curriculum, gender and more.",
};

export default function DirectoryPage() {
  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-6 py-10">
        <Suspense fallback={<div className="text-slate-500">Loading directory…</div>}>
          <DirectoryClient />
        </Suspense>
      </div>
      <Footer />
      <WhatsAppFab />
    </>
  );
}
