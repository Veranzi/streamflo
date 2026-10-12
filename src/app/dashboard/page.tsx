import { requireInstitutionPage } from "@/app/api/dashboard/_school";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "School dashboard" };

export default async function DashboardPage() {
  await requireInstitutionPage("/dashboard");
  return <DashboardClient />;
}
