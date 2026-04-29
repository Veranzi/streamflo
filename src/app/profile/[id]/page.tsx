import { notFound } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import { queryOne, query } from "@/lib/db";
import { School, SchoolPhoto, BlogPost } from "@/lib/types";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const s = await queryOne<School>("SELECT name, county FROM schools WHERE id = ? AND approved = TRUE", [params.id]).catch(() => null);
  return { title: s ? `${s.name} — Streamflo` : "School Profile — Streamflo" };
}

export default async function ProfilePage({ params }: Props) {
  const school = await queryOne<School & { facilities?: string }>(
    "SELECT * FROM schools WHERE id = ? AND approved = TRUE",
    [params.id]
  ).catch(() => null);

  if (!school) notFound();

  const [photos, posts] = await Promise.all([
    query<SchoolPhoto>("SELECT * FROM school_photos WHERE school_id = ? LIMIT 12", [school.id]).catch(() => []),
    query<BlogPost>("SELECT id, title, featured_image, created_at FROM blog_posts WHERE school_id = ? ORDER BY created_at DESC LIMIT 5", [school.id]).catch(() => []),
  ]);

  const hasFacilities = school.facilities && school.facilities.length > 0;
  const facilitiesList = school.facilities ? school.facilities.split(",").map((f) => f.trim()).filter(Boolean) : [];

  return (
    <>
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link href="/directory" className="text-sm text-blue-600 hover:underline">← Back to Directory</Link>

        {/* Header */}
        <div className="bg-white rounded shadow p-6 mt-4 mb-6">
          <div className="flex flex-wrap justify-between gap-4 items-start">
            <div>
              <h1 className="text-3xl font-bold">{school.name}</h1>
              <p className="text-slate-600 mt-1">
                {school.county}{school.subcounty ? ` • ${school.subcounty}` : ""}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {school.type && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">{school.type}</span>}
                {school.ownership && <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded">{school.ownership}</span>}
                {school.curriculum && <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">{school.curriculum}</span>}
                {school.gender && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">{school.gender}</span>}
                {school.boarding && <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">Boarding: {school.boarding}</span>}
                {school.featured && <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded font-semibold">⭐ Featured</span>}
              </div>
            </div>

            {/* Contact */}
            <div className="text-sm space-y-1">
              {school.phone && <p>📞 <a href={`tel:${school.phone}`} className="text-blue-600 hover:underline">{school.phone}</a></p>}
              {school.email && <p>✉️ <a href={`mailto:${school.email}`} className="text-blue-600 hover:underline">{school.email}</a></p>}
              {school.website && <p>🌐 <a href={school.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{school.website}</a></p>}
            </div>
          </div>
        </div>

        {/* Description */}
        {school.description && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-3">About</h2>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{school.description}</p>
          </div>
        )}

        {/* Facilities */}
        {facilitiesList.length > 0 && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-3">Facilities</h2>
            <div className="flex flex-wrap gap-2">
              {facilitiesList.map((f) => (
                <span key={f} className="bg-green-50 text-green-700 border border-green-200 text-sm px-3 py-1 rounded-full">
                  ✔ {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Photos gallery */}
        {photos.length > 0 && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-3">Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.map((p) => (
                <img
                  key={p.id}
                  src={`/uploads/schools/${school.id}/${p.filename}`}
                  alt={p.caption ?? school.name}
                  className="w-full h-32 object-cover rounded border"
                />
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        {school.lat && school.lng && (
          <div className="bg-white rounded shadow p-4 mb-6">
            <h2 className="text-xl font-bold mb-3">Location</h2>
            <Map
              markers={[{ id: school.id, name: school.name, county: school.county ?? "", lat: Number(school.lat), lng: Number(school.lng) }]}
            />
          </div>
        )}

        {/* Blog posts */}
        {posts.length > 0 && (
          <div className="bg-white rounded shadow p-6 mb-6">
            <h2 className="text-xl font-bold mb-3">Blog Posts</h2>
            <div className="space-y-3">
              {posts.map((p) => (
                <Link key={p.id} href={`/blog/${p.id}`}
                  className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded">
                  {p.featured_image && (
                    <img src={`/uploads/blog/${p.featured_image}`} alt={p.title} className="w-16 h-12 object-cover rounded" />
                  )}
                  <div>
                    <p className="font-semibold text-sm line-clamp-1">{p.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(p.created_at).toLocaleDateString("en-KE")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Register CTA */}
        <div className="bg-blue-50 border border-blue-200 rounded p-6 text-center">
          <p className="text-blue-800 font-semibold mb-2">Is this your school?</p>
          <p className="text-sm text-slate-600 mb-4">Claim and manage your profile with a Premium account.</p>
          <Link href="/register?package=premium" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 inline-block">
            Claim Profile
          </Link>
        </div>
      </div>

      <Footer />
      <WhatsAppFab />
    </>
  );
}
