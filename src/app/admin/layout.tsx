import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "admin") redirect("/login?callbackUrl=/admin");

  return <AdminShell userName={session?.user?.name ?? ""}>{children}</AdminShell>;
}
