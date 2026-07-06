import Link from "next/link";
import { query, queryOne } from "@/lib/db";

async function getStats() {
  const [schools, users, blog, revenue, pending] = await Promise.all([
    queryOne<{ total: number }>("SELECT COUNT(*)::int AS total FROM schools").catch(() => null),
    queryOne<{ total: number }>("SELECT COUNT(*)::int AS total FROM users").catch(() => null),
    queryOne<{ total: number }>("SELECT COUNT(*)::int AS total FROM blog_posts").catch(() => null),
    queryOne<{ revenue: string }>("SELECT COALESCE(SUM(amount),0) AS revenue FROM payments WHERE status = 'success'").catch(() => null),
    queryOne<{ total: number }>("SELECT COUNT(*)::int AS total FROM schools WHERE approved = FALSE").catch(() => null),
  ]);
  return {
    schools: schools?.total ?? 0,
    users: users?.total ?? 0,
    blog: blog?.total ?? 0,
    revenue: Number(revenue?.revenue ?? 0),
    pending: pending?.total ?? 0,
  };
}

async function getRecentSchools() {
  return query<{ id: number; name: string; county: string; approved: boolean; created_at: string }>(
    "SELECT id, name, county, approved, created_at FROM schools ORDER BY created_at DESC LIMIT 5"
  ).catch(() => []);
}

export default async function AdminDashboard() {
  const [stats, recent] = await Promise.all([getStats(), getRecentSchools()]);

  const cards = [
    { label: "Total Schools", value: stats.schools, sub: `${stats.pending} pending approval`, color: "blue", href: "/admin/schools" },
    { label: "Registered Users", value: stats.users, sub: "Parents, students, schools", color: "green", href: "/admin/users" },
    { label: "Blog Posts", value: stats.blog, sub: "Published articles", color: "purple", href: "/admin/blog" },
    { label: "Revenue (KES)", value: `${stats.revenue.toLocaleString()}`, sub: "Successful payments", color: "amber", href: "/admin/subscriptions" },
  ];

  const colorMap: Record<string, string> = {
    blue: "border-blue-500", green: "border-green-500", purple: "border-purple-500", amber: "border-amber-500",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-1">Dashboard</h1>
      <p className="text-slate-500 text-sm mb-6">Welcome back, site admin.</p>

      {stats.pending > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-800">⏳ {stats.pending} school{stats.pending > 1 ? "s" : ""} awaiting approval</p>
            <p className="text-sm text-amber-700 mt-0.5">Review and approve new school registrations.</p>
          </div>
          <Link href="/admin/schools?status=pending" className="bg-amber-600 text-white text-sm px-4 py-2 rounded hover:bg-amber-700">
            Review
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}
            className={`bg-white rounded-xl shadow border-l-4 ${colorMap[c.color]} p-5 hover:shadow-md transition block`}>
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{c.value}</p>
            <p className="text-xs text-slate-400 mt-1">{c.sub}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800">Recent Schools</h2>
          <Link href="/admin/schools" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-slate-400 text-sm">No schools yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500 border-b"><th className="pb-2">Name</th><th className="pb-2">County</th><th className="pb-2">Status</th><th className="pb-2">Registered</th></tr></thead>
            <tbody>
              {recent.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 font-medium text-slate-800">{s.name}</td>
                  <td className="py-2 text-slate-500">{s.county}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                      {s.approved ? "Approved" : "Pending"}
                    </span>
                  </td>
                  <td className="py-2 text-slate-400">{new Date(s.created_at).toLocaleDateString("en-KE")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
