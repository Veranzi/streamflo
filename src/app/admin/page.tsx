import Link from "next/link";
import {
  School, Users, Newspaper, Wallet, Clock, ArrowRight, Plus, ClipboardCheck, Inbox, BookOpenText,
} from "lucide-react";
import { query, queryOne } from "@/lib/db";
import { PageHeader, StatCard, EmptyState, Badge } from "@/components/ui";

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
    "SELECT id, name, county, approved, created_at FROM schools ORDER BY created_at DESC LIMIT 6"
  ).catch(() => []);
}

const QUICK_ACTIONS = [
  { href: "/admin/schools?status=pending", label: "Review schools", desc: "Approve new registrations", icon: School },
  { href: "/admin/subscriptions", label: "Subscription requests", desc: "Confirm M-Pesa payments", icon: ClipboardCheck },
  { href: "/admin/blog", label: "Write a blog post", desc: "Publish news and guides", icon: Newspaper },
  { href: "/admin/notes", label: "Manage CBE notes", desc: "Publish learning content", icon: BookOpenText },
  { href: "/admin/contacts", label: "Read messages", desc: "Reply to enquiries", icon: Inbox },
];

function greeting() {
  const h = new Date().toLocaleString("en-KE", { hour: "numeric", hour12: false, timeZone: "Africa/Nairobi" });
  const hour = Number(h);
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AdminDashboard() {
  const [stats, recent] = await Promise.all([getStats(), getRecentSchools()]);
  const today = new Date().toLocaleDateString("en-KE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Nairobi",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={today}
        title={`${greeting()}, admin`}
        description="Here is what is happening on Streamflo today."
        actions={
          <>
            <Link href="/admin/blog" className="btn btn-secondary"><Plus className="h-4 w-4" /> New post</Link>
            <Link href="/admin/schools" className="btn btn-primary"><School className="h-4 w-4" /> Manage schools</Link>
          </>
        }
      />

      {stats.pending > 0 && (
        <div className="alert alert-warning items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">
                {stats.pending} school{stats.pending > 1 ? "s are" : " is"} waiting for approval
              </p>
              <p className="text-amber-700">New schools only appear in the public directory after you approve them.</p>
            </div>
          </div>
          <Link href="/admin/schools?status=pending" className="btn btn-sm shrink-0 bg-amber-600 text-white hover:bg-amber-700">
            Review now
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Schools" value={stats.schools.toLocaleString()} hint={`${stats.pending} pending approval`} icon={School} tone="blue" href="/admin/schools" />
        <StatCard label="Registered users" value={stats.users.toLocaleString()} hint="Parents, students and schools" icon={Users} tone="green" href="/admin/users" />
        <StatCard label="Blog posts" value={stats.blog.toLocaleString()} hint="Published articles" icon={Newspaper} tone="purple" href="/admin/blog" />
        <StatCard label="Revenue" value={`KES ${stats.revenue.toLocaleString()}`} hint="Successful payments" icon={Wallet} tone="amber" href="/admin/payments" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="card overflow-hidden xl:col-span-2">
          <div className="card-header">
            <div>
              <h2 className="font-semibold text-ink">Recently registered schools</h2>
              <p className="text-xs text-ink-soft">The latest schools to join the directory</p>
            </div>
            <Link href="/admin/schools" className="link inline-flex items-center gap-1 text-sm">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={School} title="No schools yet" description="Schools that register will show up here." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>School</th><th className="hidden sm:table-cell">County</th><th>Status</th><th className="hidden md:table-cell">Registered</th></tr>
                </thead>
                <tbody>
                  {recent.map((s) => (
                    <tr key={s.id}>
                      <td className="font-medium text-ink">{s.name}</td>
                      <td className="hidden sm:table-cell">{s.county || <span className="text-slate-400">Not set</span>}</td>
                      <td>{s.approved ? <Badge tone="green">Approved</Badge> : <Badge tone="amber">Pending</Badge>}</td>
                      <td className="hidden text-ink-soft md:table-cell">
                        {new Date(s.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-ink">Quick actions</h2>
          </div>
          <ul className="divide-y divide-slate-100">
            {QUICK_ACTIONS.map(({ href, label, desc, icon: Icon }) => (
              <li key={href}>
                <Link href={href} className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{label}</span>
                    <span className="block text-xs text-ink-soft">{desc}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-500" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
