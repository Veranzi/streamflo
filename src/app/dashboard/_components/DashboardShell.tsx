import Link from "next/link";
import { ChevronLeft, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PageHeader } from "@/components/ui";

/** Shared frame for /dashboard sub pages: navbar, back link, page header, footer. */
export default function DashboardShell({
  title, description, actions, children,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="container-page py-8 sm:py-10">
        <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-primary-700">
          <ChevronLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <PageHeader eyebrow="School dashboard" title={title} description={description} actions={actions} />
        {children}
      </div>
      <Footer />
    </>
  );
}

/** Shown on sub pages when the account has no school linked yet. */
export function NoSchoolNotice() {
  return (
    <div className="alert alert-info">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        No school profile is linked to this account yet.{" "}
        <Link href="/dashboard/profile" className="font-semibold underline">Set up your school profile</Link> first.
      </span>
    </div>
  );
}
