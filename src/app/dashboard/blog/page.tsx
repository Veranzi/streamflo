import { requireInstitutionPage, isPaid } from "@/app/api/dashboard/_school";
import DashboardShell, { NoSchoolNotice } from "../_components/DashboardShell";
import BlogManager from "./BlogManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog posts" };

export default async function DashboardBlogPage() {
  const own = await requireInstitutionPage("/dashboard/blog");
  return (
    <DashboardShell title="Blog posts" description="Share news, results and stories from your school on the Streamflo blog.">
      {own.schoolId ? <BlogManager allowed={isPaid(own.school?.package)} /> : <NoSchoolNotice />}
    </DashboardShell>
  );
}
