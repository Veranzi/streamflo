import { requireInstitutionPage, canBlog } from "@/app/api/dashboard/_school";
import DashboardShell, { NoSchoolNotice } from "../_components/DashboardShell";
import BlogManager from "./BlogManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Blog posts" };

export default async function DashboardBlogPage() {
  const own = await requireInstitutionPage("/dashboard/blog");
  return (
    <DashboardShell title="Blog posts" description="Share events like graduations, open days and parents' days on the Streamflo blog. Posting is free.">
      {own.schoolId ? <BlogManager allowed={canBlog(own.school)} /> : <NoSchoolNotice />}
    </DashboardShell>
  );
}
