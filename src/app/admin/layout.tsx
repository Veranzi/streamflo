import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "🏠" },
  { href: "/admin/schools", label: "Schools", icon: "🏫" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/blog", label: "Blog", icon: "📰" },
  { href: "/admin/announcements", label: "Announcements", icon: "📢" },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: "💳" },
  { href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "admin") redirect("/login?callbackUrl=/admin");

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-56 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-slate-700">
          <span className="font-bold text-lg text-white">Streamflo</span>
          <span className="block text-xs text-slate-400 mt-0.5">Admin Portal</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href}
              className="flex items-center gap-2.5 px-3 py-2 rounded text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition">
              <span>{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-700">
          <p className="text-xs text-slate-400">{session?.user?.name}</p>
          <Link href="/api/auth/signout" className="text-xs text-red-400 hover:text-red-300 mt-1 inline-block">Sign out</Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
