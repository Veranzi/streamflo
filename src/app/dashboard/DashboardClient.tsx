"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { PageHeader, StatCard } from "@/components/ui";
import {
  Loader2, Pencil, Newspaper, Images, CalendarDays, Eye, School, CircleCheck, Clock, Info,
  ArrowRight, Rocket,
} from "lucide-react";

interface DashboardStats {
  school: { id: number; name: string; approved: boolean; package: string } | null;
  photo_count: number;
  blog_count: number;
  event_count?: number;
  view_count: number;
}

export default function DashboardClient() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/dashboard")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error ?? "Could not load your dashboard.");
        setStats(data);
      })
      .catch((e: Error) => { setStats(null); setLoadError(e.message || "Could not load your dashboard."); })
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <div className="container-page py-10">
          <div className="skeleton mb-2 h-8 w-56" />
          <div className="skeleton mb-8 h-4 w-40" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card card-pad space-y-3">
                <div className="skeleton h-3 w-1/3" />
                <div className="skeleton h-8 w-1/4" />
              </div>
            ))}
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-ink-soft">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading dashboard...
          </p>
        </div>
      </>
    );
  }

  if (!session) return null;

  const school = stats?.school ?? null;
  const pkg = school?.package ?? "";

  const actions = [
    { href: "/dashboard/profile", icon: Pencil, tint: "bg-primary-50 text-primary-700", title: "Edit school profile", desc: "Update your school details, location and description." },
    { href: "/dashboard/blog", icon: Newspaper, tint: "bg-accent-50 text-accent-700", title: "Manage blog posts", desc: pkg === "premium" || pkg === "enterprise" ? "Write and publish blog articles." : "Write and publish blog articles. Premium feature." },
    { href: "/dashboard/photos", icon: Images, tint: "bg-violet-50 text-violet-700", title: "Manage photos", desc: "Upload up to 12 photos of your school." },
    { href: "/dashboard/events", icon: CalendarDays, tint: "bg-amber-50 text-amber-700", title: "Events and announcements", desc: "Share events and news with parents." },
    ...(pkg === "premium" || pkg === "enterprise" ? [] : [{ href: "/dashboard/upgrade", icon: Rocket, tint: "bg-sky-50 text-sky-700", title: "Upgrade to Premium", desc: "Featured listing, blog posting and more for KES 1,250 per year." }]),
  ];

  return (
    <>
      <Navbar />

      <div className="container-page py-8 sm:py-10">
        <PageHeader
          eyebrow="School dashboard"
          title={`Welcome back, ${session.user?.name ?? ""}`.trim()}
          description="Manage your school profile, content, and visibility on Streamflo."
          actions={
            school ? (
              <Link href={`/profile/${school.id}`} className="btn btn-secondary">
                <Eye className="h-4 w-4" /> View public profile
              </Link>
            ) : undefined
          }
        />

        {loadError && (
          <div className="alert alert-error mb-6">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {/* School profile status */}
        {school ? (
          <div className="card card-pad mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <School className="h-6 w-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg font-bold text-ink">{school.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {school.approved
                  ? <span className="badge badge-green"><CircleCheck className="h-3 w-3" /> Live</span>
                  : <span className="badge badge-amber"><Clock className="h-3 w-3" /> Approval pending</span>}
                {pkg && (
                  <span className={`badge ${pkg === "free" ? "badge-gray" : "badge-blue"} capitalize`}>
                    {pkg === "free" ? "Free package" : `${pkg} package`}
                  </span>
                )}
              </div>
            </div>
            <Link href="/dashboard/profile" className="btn btn-primary shrink-0">
              <Pencil className="h-4 w-4" /> Edit profile
            </Link>
          </div>
        ) : loadError ? null : (
          <div className="alert alert-info mb-6">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              No school profile is linked to this account yet.{" "}
              <Link href="/dashboard/profile" className="font-semibold underline">Set up your profile</Link>
            </span>
          </div>
        )}

        {school && !school.approved && (
          <div className="alert alert-warning mb-6">
            <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Approval pending</p>
              <p>Your school is awaiting admin approval. It will appear in the directory once it is live. You can keep editing your profile in the meantime.</p>
            </div>
          </div>
        )}

        {/* Stats cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Photos" value={stats?.photo_count ?? 0} icon={Images} tone="purple" href="/dashboard/photos" />
          <StatCard label="Blog posts" value={stats?.blog_count ?? 0} icon={Newspaper} tone="green" href="/dashboard/blog" />
          <StatCard label="Events" value={stats?.event_count ?? 0} icon={CalendarDays} tone="amber" href="/dashboard/events" />
          <StatCard label="Listing" value={school?.approved ? "Live" : "Pending"} hint={school?.package ? `${school.package.charAt(0).toUpperCase()}${school.package.slice(1)} plan` : undefined} icon={Eye} tone="blue" href="/dashboard/upgrade" />
        </div>

        {/* Actions */}
        <h2 className="section-title mb-4 text-lg sm:text-xl">Quick actions</h2>
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {actions.map(({ href, icon: Icon, tint, title, desc }) => (
            <Link key={href} href={href} className="card card-pad card-hover group flex items-start gap-4">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tint}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-0.5 text-sm text-ink-soft">{desc}</p>
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary-700" />
            </Link>
          ))}
        </div>

        {school && pkg !== "premium" && pkg !== "enterprise" && (
          <div className="card overflow-hidden">
            <div className="flex flex-col gap-5 bg-gradient-to-r from-primary-800 to-primary-950 p-6 text-white sm:flex-row sm:items-center sm:p-8">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Rocket className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <p className="font-display text-lg font-bold text-white">Upgrade to Premium</p>
                <p className="mt-1 text-sm text-primary-100">
                  Unlock full profile, photos, blog posting, and more for just KES 1,250 per year.
                </p>
              </div>
              <Link href="/dashboard/upgrade" className="btn btn-lg shrink-0 bg-white text-primary-800 hover:bg-primary-50">
                Upgrade now <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
