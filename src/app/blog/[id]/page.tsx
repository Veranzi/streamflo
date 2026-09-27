import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CalendarDays, School as SchoolIcon, MessageSquare } from "lucide-react";
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
  return { title: post ? `${post.title} | Streamflo Blog` : "Blog Post | Streamflo" };
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
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

      <div className="container-page max-w-4xl py-8 sm:py-10">
        <Link href="/blog" className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft hover:text-primary-700">
          <ChevronLeft className="h-4 w-4" /> All posts
        </Link>

        <article className="card mt-4 overflow-hidden">
          {post.featured_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/uploads/blog/${post.featured_image}`}
              alt={post.title}
              className="aspect-[21/9] w-full object-cover"
            />
          )}

          <div className="p-6 sm:p-10">
            <h1 className="font-display text-2xl font-bold leading-snug sm:text-3xl">{post.title}</h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 pb-6 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" /> {formatDate(post.created_at)}
              </span>
              {post.school_name && (
                <Link href={`/profile/${post.school_id}`} className="link inline-flex items-center gap-1.5">
                  <SchoolIcon className="h-4 w-4" /> {post.school_name}
                </Link>
              )}
            </div>

            <div
              className="prose-content mt-6 max-w-none text-base"
              dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
            />
          </div>
        </article>

        {/* Comments */}
        <section className="card mt-6">
          <div className="card-header">
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <MessageSquare className="h-5 w-5 text-primary-700" /> Comments
              <span className="badge badge-gray">{comments.length}</span>
            </h2>
          </div>

          <div className="card-pad">
            {comments.length === 0 ? (
              <p className="mb-6 text-sm text-ink-soft">No comments yet. Be the first to share your thoughts.</p>
            ) : (
              <ul className="mb-8 space-y-5">
                {comments.map((c) => (
                  <li key={c.id} className="flex gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-800">
                      {(c.author_name?.[0] ?? "A").toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1 rounded-xl bg-slate-50 px-4 py-3">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="text-sm font-semibold text-ink">{c.author_name}</p>
                        <p className="text-xs text-ink-soft">{formatDate(c.created_at)}</p>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{c.content}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="divider mb-6" />
            <BlogCommentForm postId={post.id} />
          </div>
        </section>
      </div>

      <Footer />
      <WhatsAppFab />
    </>
  );
}
