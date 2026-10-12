import { requireInstitutionPage } from "@/app/api/dashboard/_school";
import DashboardShell, { NoSchoolNotice } from "../_components/DashboardShell";
import UpgradeClient from "./UpgradeClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Upgrade to Premium" };

export default async function DashboardUpgradePage() {
  const own = await requireInstitutionPage("/dashboard/upgrade");
  return (
    <DashboardShell title="Upgrade to Premium" description="Get your school in front of more parents.">
      {own.schoolId ? <UpgradeClient schoolId={own.schoolId} pkg={own.school?.package ?? "free"} /> : <NoSchoolNotice />}
    </DashboardShell>
  );
}
