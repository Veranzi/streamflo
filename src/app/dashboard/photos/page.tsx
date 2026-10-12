import { requireInstitutionPage } from "@/app/api/dashboard/_school";
import DashboardShell, { NoSchoolNotice } from "../_components/DashboardShell";
import PhotosManager from "./PhotosManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "School photos" };

export default async function DashboardPhotosPage() {
  const own = await requireInstitutionPage("/dashboard/photos");
  return (
    <DashboardShell title="School photos" description="Show parents your classrooms, grounds and activities. Up to 12 photos.">
      {own.schoolId ? <PhotosManager schoolId={own.schoolId} /> : <NoSchoolNotice />}
    </DashboardShell>
  );
}
