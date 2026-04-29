import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import { query } from "@/lib/db";
import { BlogPost } from "@/lib/types";

export const metadata = {
  title: "Blog — Streamflo",
  description: "Latest news and articles from Kenyan schools.",
};

export default async function BlogPage() {
  const posts = await query<BlogPost>(`
    SELECT b.id, b.title, b.content, b.featured_image, b.created_at, s.name AS school_name
    FROM blog_posts b
    LEFT JOIN schools s ON s.id = b.school_id
    ORDER BY b.created_at DESC
    LIMIT 30
  `).catch(() => []);

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-blue-800 mb-8">Streamflo Blog</h1>

        {posts.length === 0 ? (
          <p className="text-slate-500 italic">No blog posts yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition">
                {post.featured_image && (
                  <img
                    src={`/uploads/blog/${post.featured_image}`}
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-5">
                  <h2 className="font-bold text-lg leading-snug line-clamp-2 mb-2">{post.title}</h2>
                  {post.school_name && (
                    <p className="text-xs text-blue-600 font-medium mb-1">{post.school_name}</p>
                  )}
                  <p className="text-xs text-slate-500 mb-3">
                    {new Date(post.created_at).toLocaleDateString("en-KE", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {post.content?.replace(/<[^>]+>/g, "").substring(0, 150)}…
                  </p>
                  <Link href={`/blog/${post.id}`} className="mt-3 inline-block text-blue-600 text-sm font-semibold hover:underline">
                    Read more →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Footer />
      <WhatsAppFab />
    </>
  );
}
