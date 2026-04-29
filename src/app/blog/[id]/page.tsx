import { notFound } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import { queryOne, query } from "@/lib/db";
import { BlogPost, BlogComment } from "@/lib/types";
import BlogCommentForm from "./BlogCommentForm";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const post = await queryOne<BlogPost>("SELECT title FROM blog_posts WHERE id = ?", [params.id]).catch(() => null);
  return { title: post ? `${post.title} — Streamflo Blog` : "Blog Post — Streamflo" };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await queryOne<BlogPost & { school_name?: string; school_id?: number }>(
    `SELECT b.*, s.name AS school_name
     FROM blog_posts b
     LEFT JOIN schools s ON s.id = b.school_id
     WHERE b.id = ?`,
    [params.id]
  ).catch(() => null);

  if (!post) notFound();

  const comments = await query<BlogComment>(
    "SELECT * FROM blog_comments WHERE post_id = ? ORDER BY created_at ASC",
    [post.id]
  ).catch(() => []);

  return (
    <>
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/blog" className="text-sm text-blue-600 hover:underline">← All Posts</Link>

        <article className="bg-white rounded shadow p-8 mt-4">
          {post.featured_image && (
            <img
              src={`/uploads/blog/${post.featured_image}`}
              alt={post.title}
              className="w-full h-64 object-cover rounded mb-6"
            />
          )}

          <h1 className="text-3xl font-bold leading-snug mb-3">{post.title}</h1>

          <div className="flex items-center gap-3 text-sm text-slate-500 mb-6">
            <span>{new Date(post.created_at).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}</span>
            {post.school_name && (
              <>
                <span>•</span>
                <Link href={`/profile/${post.school_id}`} className="text-blue-600 hover:underline">
                  {post.school_name}
                </Link>
              </>
            )}
          </div>

          <div
            className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
          />
        </article>

        {/* Comments */}
        <section className="bg-white rounded shadow p-6 mt-6">
          <h3 className="text-xl font-bold mb-4">Comments ({comments.length})</h3>

          {comments.length === 0 ? (
            <p className="text-slate-500 italic mb-4">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-4 mb-6">
              {comments.map((c) => (
                <div key={c.id} className="border-b pb-4">
                  <p className="font-semibold text-sm">{c.author_name}</p>
                  <p className="text-xs text-slate-500 mb-1">
                    {new Date(c.created_at).toLocaleDateString("en-KE")}
                  </p>
                  <p className="text-slate-700">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          <BlogCommentForm postId={post.id} />
        </section>
      </div>

      <Footer />
      <WhatsAppFab />
    </>
  );
}
