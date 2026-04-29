"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface DashboardStats {
  school: { id: number; name: string; approved: boolean; package: string } | null;
  photo_count: number;
  blog_count: number;
  view_count: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-10 text-slate-500">Loading dashboard…</div>
      </>
    );
  }

  if (!session) return null;

  return (
    <>
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-slate-600 mb-8">Welcome back, {session.user?.name}</p>

        {stats?.school && !stats.school.approved && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
            <p className="font-semibold text-yellow-800">⏳ Approval Pending</p>
            <p className="text-sm text-yellow-700">
              Your school is awaiting admin approval. You&apos;ll be notified once it&apos;s live.
            </p>
          </div>
        )}

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded shadow p-5 border-l-4 border-blue-600">
            <p className="text-sm text-slate-500">Photos</p>
            <p className="text-3xl font-bold">{stats?.photo_count ?? 0}</p>
          </div>
          <div className="bg-white rounded shadow p-5 border-l-4 border-green-600">
            <p className="text-sm text-slate-500">Blog Posts</p>
            <p className="text-3xl font-bold">{stats?.blog_count ?? 0}</p>
          </div>
          <div className="bg-white rounded shadow p-5 border-l-4 border-purple-600">
            <p className="text-sm text-slate-500">Profile Views</p>
            <p className="text-3xl font-bold">{stats?.view_count ?? 0}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/dashboard/profile" className="bg-white rounded shadow p-6 hover:shadow-md transition block">
            <h3 className="font-bold mb-1">Edit School Profile</h3>
            <p className="text-sm text-slate-600">Update your school details, photos, and description.</p>
          </Link>
          <Link href="/dashboard/blog" className="bg-white rounded shadow p-6 hover:shadow-md transition block">
            <h3 className="font-bold mb-1">Manage Blog Posts</h3>
            <p className="text-sm text-slate-600">Write and publish blog articles.</p>
          </Link>
          <Link href="/dashboard/photos" className="bg-white rounded shadow p-6 hover:shadow-md transition block">
            <h3 className="font-bold mb-1">Manage Photos</h3>
            <p className="text-sm text-slate-600">Upload school photos and albums.</p>
          </Link>
          <Link href="/dashboard/events" className="bg-white rounded shadow p-6 hover:shadow-md transition block">
            <h3 className="font-bold mb-1">Events & Announcements</h3>
            <p className="text-sm text-slate-600">Schedule events visible to parents.</p>
          </Link>
        </div>

        {stats?.school?.package === "free" && (
          <div className="bg-blue-50 border border-blue-200 p-6 rounded text-center">
            <p className="font-bold text-blue-800 mb-1">🚀 Upgrade to Premium</p>
            <p className="text-sm text-slate-600 mb-4">
              Unlock full profile, photos, blog posting, and more for just KES 1,250/year.
            </p>
            <Link href="/dashboard/upgrade" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 inline-block">
              Upgrade Now
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}
