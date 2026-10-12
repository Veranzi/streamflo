import { requireInstitutionPage } from "@/app/api/dashboard/_school";
import DashboardShell from "../_components/DashboardShell";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit school profile" };

export default async function DashboardProfilePage() {
  const own = await requireInstitutionPage("/dashboard/profile");
  return (
    <DashboardShell
      title={own.schoolId ? "Edit school profile" : "Set up your school profile"}
      description="This is what parents see on your public profile. Changes are saved straight away."
    >
      <ProfileForm hasSchool={!!own.schoolId} />
    </DashboardShell>
  );
}
