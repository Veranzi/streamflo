import { requireInstitutionPage } from "@/app/api/dashboard/_school";
import DashboardShell, { NoSchoolNotice } from "../_components/DashboardShell";
import EventsManager from "./EventsManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Events and announcements" };

export default async function DashboardEventsPage() {
  const own = await requireInstitutionPage("/dashboard/events");
  return (
    <DashboardShell title="Events and announcements" description="Share open days, admissions and other news with parents.">
      {own.schoolId ? <EventsManager /> : <NoSchoolNotice />}
    </DashboardShell>
  );
}
