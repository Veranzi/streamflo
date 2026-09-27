import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import DirectoryClient from "./DirectoryClient";

export const metadata = {
  title: "School Directory | Streamflo",
  description: "Browse and filter schools across Kenya by county, curriculum, gender and more.",
};

export default function DirectoryPage() {
  return (
    <>
      <Navbar />

      <section className="page-band">
        <div className="container-page py-8 sm:py-10">
          <p className="eyebrow mb-1">School directory</p>
          <h1 className="page-title">Find the right school</h1>
          <p className="page-subtitle max-w-2xl">
            Search schools across all 47 counties and filter by type, curriculum, gender and boarding.
          </p>
        </div>
      </section>

      <div className="container-page py-8">
        <Suspense
          fallback={
            <div className="flex items-center gap-2 py-10 text-sm text-ink-soft">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading directory...
            </div>
          }
        >
          <DirectoryClient />
        </Suspense>
      </div>

      <Footer />
      <WhatsAppFab />
    </>
  );
}
