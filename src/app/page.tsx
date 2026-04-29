import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import HomeSearch from "@/components/HomeSearch";
import { query } from "@/lib/db";
import { BlogPost, School, Announcement } from "@/lib/types";

async function getHomeData() {
  const [featuredBlogs, homepageBlogs, featuredSchools, topCounties, schoolOfWeek, announcements, news] =
    await Promise.all([
      query<BlogPost>(`
        SELECT b.id, b.title, b.featured_image, b.created_at, s.name AS school_name
        FROM blog_posts b
        LEFT JOIN schools s ON s.id = b.school_id
        WHERE b.featured = TRUE
        ORDER BY b.created_at DESC
        LIMIT 12
      `).catch(() => []),
      query<BlogPost>(`
        SELECT id, title, content, featured_image, created_at
        FROM blog_posts
        ORDER BY created_at DESC
        LIMIT 1
      `).catch(() => []),
      query<School>(`
        SELECT id, name, county, subcounty, type
        FROM schools
        WHERE approved = TRUE AND featured = TRUE
        ORDER BY RANDOM()
        LIMIT 6
      `).catch(() => []),
      query<{ county: string; total: number }>(`
        SELECT county, COUNT(*)::int as total
        FROM schools
        WHERE approved = TRUE AND county IS NOT NULL
        GROUP BY county
        ORDER BY total DESC
        LIMIT 5
      `).catch(() => []),
      query<School>(`
        SELECT id, name, county, subcounty, description
        FROM schools
        WHERE approved = TRUE
        ORDER BY RANDOM()
        LIMIT 1
      `).then((r) => r[0] ?? null).catch(() => null),
      query<Announcement>(`SELECT message FROM announcements WHERE active = TRUE ORDER BY id DESC LIMIT 10`).catch(() => []),
      query<{ title: string }>(`SELECT title FROM events WHERE active = TRUE ORDER BY created_at DESC LIMIT 1`)
        .then((r) => r[0]?.title ?? null).catch(() => null),
    ]);

  return { featuredBlogs, homepageBlogs, featuredSchools, topCounties, schoolOfWeek, announcements, news };
}

export default async function HomePage() {
  const { featuredBlogs, homepageBlogs, featuredSchools, topCounties, schoolOfWeek, announcements, news } =
    await getHomeData();

  return (
    <>
      <Navbar />

      {/* News banner */}
      {news && (
        <div className="bg-yellow-300 text-black p-3 text-center font-semibold">{news}</div>
      )}

      {/* Hero */}
      <section className="bg-gradient-to-r from-slate-800 to-blue-900 text-white py-12 fade-in">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl font-bold">Find a School in Kenya</h1>
            <p className="text-slate-200 mt-3">
              Discover and compare schools by county, curriculum, gender, performance and more.
            </p>
          </div>
          <div className="bg-white text-black p-4 rounded shadow">
            <Suspense>
              <HomeSearch />
            </Suspense>
            <div className="mt-3 text-xs text-slate-500">Schools are verified before they appear publicly.</div>
          </div>
        </div>
      </section>

      {/* Announcements marquee */}
      {announcements.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-3 rounded mx-6 mt-6 fade-in overflow-hidden">
          <div className="animate-marquee whitespace-nowrap font-semibold text-blue-700">
            {announcements.map((a, i) => (
              <span key={i}>🎓 {a.message}&nbsp;&nbsp;&nbsp;</span>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10 fade-in">

        {/* Blog + School of the week */}
        {(homepageBlogs.length > 0 || schoolOfWeek) && (
          <section className="mb-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {homepageBlogs.length > 0 && (
                <div className="bg-white p-6 rounded shadow">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-blue-800">📰 Streamflo Blog</h2>
                    <Link href="/blog" className="text-sm text-blue-600 hover:underline">View all →</Link>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {homepageBlogs.map((b) => (
                      <article key={b.id} className="border rounded-lg overflow-hidden hover:shadow transition">
                        {b.featured_image && (
                          <img
                            src={`/uploads/blog/${b.featured_image}`}
                            alt={b.title}
                            className="w-full h-40 object-cover"
                          />
                        )}
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                          <p className="text-xs text-slate-500 mb-2">
                            {new Date(b.created_at).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                          <Link href={`/blog/${b.id}`} className="text-blue-600 text-sm font-semibold hover:underline">
                            Read more →
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              )}

              {schoolOfWeek && (
                <div className="bg-blue-50 border border-blue-200 p-6 rounded shadow">
                  <h3 className="text-xl font-bold text-blue-800 mb-2">🏫 School of the Week</h3>
                  <h4 className="text-2xl font-bold">{schoolOfWeek.name}</h4>
                  <p className="text-sm text-slate-600">
                    {schoolOfWeek.county} • {schoolOfWeek.subcounty}
                  </p>
                  <p className="mt-3 text-slate-700">
                    {schoolOfWeek.description?.substring(0, 220)}…
                  </p>
                  <Link href={`/profile/${schoolOfWeek.id}`}
                    className="inline-block mt-4 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800">
                    View Profile →
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Featured blog slider */}
        {featuredBlogs.length > 0 && (
          <div className="bg-white p-5 rounded shadow mb-8">
            <h3 className="text-xl font-bold mb-3 text-blue-800">Featured Blog Posts</h3>
            <div className="blog-slider flex gap-4">
              {featuredBlogs.map((b) => (
                <Link key={b.id} href={`/blog/${b.id}`}
                  className="flex-shrink-0 bg-slate-100 rounded shadow p-3 w-60 block">
                  {b.featured_image && (
                    <img src={`/uploads/blog/${b.featured_image}`} className="h-40 w-full object-cover rounded" alt={b.title} />
                  )}
                  <h4 className="font-bold mt-2 text-sm leading-snug line-clamp-2">{b.title}</h4>
                  {b.school_name && <p className="text-xs text-slate-600 mt-1">{b.school_name}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Featured schools */}
        {featuredSchools.length > 0 && (
          <div className="bg-white p-6 rounded shadow mb-8">
            <h3 className="text-xl font-bold mb-4 text-green-700">Featured Schools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredSchools.map((s) => (
                <Link key={s.id} href={`/profile/${s.id}`}
                  className="block p-4 border rounded-lg hover:shadow-md transition bg-white h-full">
                  <h4 className="font-bold text-base leading-snug line-clamp-2">{s.name}</h4>
                  <p className="text-sm text-slate-600 mt-2">
                    {s.county}{s.subcounty ? ` • ${s.subcounty}` : ""}
                  </p>
                  {s.type && <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide">{s.type}</p>}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Trending counties */}
        {topCounties.length > 0 && (
          <div className="bg-white p-6 rounded shadow mb-8">
            <h3 className="text-xl font-bold mb-4 text-indigo-700">Trending Counties</h3>
            <div className="flex flex-wrap gap-3">
              {topCounties.map((c) => (
                <Link key={c.county} href={`/directory?county=${encodeURIComponent(c.county)}`}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200">
                  {c.county} ({c.total})
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Why Streamflo */}
        <div className="bg-white p-6 rounded shadow mb-8">
          <h3 className="text-xl font-bold text-orange-700 mb-4">Why Schools Trust Streamflo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 border rounded">
              <h4 className="font-bold">Verified Listings</h4>
              <p className="text-sm text-slate-600">Every school is validated before appearing publicly.</p>
            </div>
            <div className="p-4 border rounded">
              <h4 className="font-bold">Better Visibility</h4>
              <p className="text-sm text-slate-600">Schools get discovered faster by parents.</p>
            </div>
            <div className="p-4 border rounded">
              <h4 className="font-bold">Powerful Tools</h4>
              <p className="text-sm text-slate-600">Premium schools enjoy analytics, blog posting & enquiries.</p>
            </div>
          </div>
        </div>

        {/* Parent testimonials */}
        <div className="bg-white p-6 rounded shadow mb-8">
          <h3 className="text-xl font-bold text-purple-700 mb-4">Parents Testimonials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border rounded bg-purple-50">
              <p className="italic">&ldquo;Streamflo helped me compare schools easily. The filters are amazing!&rdquo;</p>
              <p className="mt-2 font-bold">— Mary, Nairobi</p>
            </div>
            <div className="p-4 border rounded bg-purple-50">
              <p className="italic">&ldquo;We found the perfect IGCSE school for our daughter.&rdquo;</p>
              <p className="mt-2 font-bold">— Edwin, Mombasa</p>
            </div>
          </div>
        </div>

        {/* Subscription plans */}
        <div className="bg-white p-6 rounded shadow mb-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-blue-800">Subscription Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {/* Starter */}
            <div className="p-6 border rounded-lg subscription-column">
              <h3 className="font-bold text-xl">Starter</h3>
              <p className="text-3xl font-bold text-green-700">Free</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>Basic Profile</li><li>Appears in Search</li><li>School Updates</li>
              </ul>
              <Link href="/register?package=free" className="mt-4 block bg-green-600 text-white py-2 rounded hover:bg-green-700">
                Get Started
              </Link>
            </div>

            {/* Premium */}
            <div className="p-6 border-2 border-blue-600 rounded-lg bg-blue-50 subscription-column relative">
              <span className="absolute -top-3 -right-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                75% OFF
              </span>
              <h3 className="font-bold text-xl text-blue-800">Premium</h3>
              <p className="text-sm text-slate-500 line-through mt-1">KES 5,000 / year</p>
              <p className="text-3xl font-bold text-blue-700">KES 1,250 / year</p>
              <p className="text-xs text-red-600 font-semibold mt-1">Offer valid until 31st May 2026</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>Featured Listing</li><li>Unlimited Enquiries</li><li>Blog Posting</li><li>Map Pin Location</li>
              </ul>
              <Link href="/register?package=premium" className="mt-4 block bg-blue-600 hover:bg-blue-700 text-white py-2 rounded">
                Go Premium
              </Link>
            </div>

            {/* Enterprise */}
            <div className="p-6 border rounded-lg subscription-column">
              <h3 className="font-bold text-xl">Enterprise</h3>
              <p className="text-3xl font-bold text-slate-700">Custom</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>API Integration</li><li>Bulk Staff Access</li><li>Advanced Analytics</li>
              </ul>
              <Link href="/contact" className="mt-4 block bg-slate-700 text-white py-2 rounded hover:bg-slate-800">
                Contact Us
              </Link>
            </div>
          </div>

          {/* Plan comparison table */}
          <h3 className="text-xl font-bold mt-10 mb-3">Plan Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border">
              <thead>
                <tr className="bg-slate-200">
                  <th className="p-2">Feature</th><th className="p-2">Starter</th>
                  <th className="p-2">Premium</th><th className="p-2">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Appears in Search", "✔", "✔", "✔"],
                  ["Featured Listing", "–", "✔", "✔"],
                  ["Blog Posting", "–", "✔", "Unlimited"],
                  ["Map Pin", "–", "✔", "✔"],
                  ["API Access", "–", "–", "✔"],
                ].map(([feature, ...vals]) => (
                  <tr key={feature}>
                    <td className="p-2 border-t">{feature}</td>
                    {vals.map((v, i) => <td key={i} className="p-2 border-t">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppFab />
    </>
  );
}
