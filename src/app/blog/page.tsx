import Link from "next/link";
import {
  ArrowRight, CalendarDays, Clock, Newspaper, School as SchoolIcon, Search, PenLine, Sparkles, BookOpen, X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import { query } from "@/lib/db";
import { BlogPost } from "@/lib/types";

export const metadata = {
  title: "Blog | Streamflo",
  description: "Latest news and articles from Kenyan schools.",
};

type Post = BlogPost & { featured?: boolean };

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function plainText(html?: string | null) {
  return (html ?? "").replace(/<[^>]+>/g, " ").replace(/[#*_>`[\]]/g, "").replace(/\s+/g, " ").trim();
}

function excerpt(html: string | undefined | null, len = 150) {
  const t = plainText(html);
  return t.length > len ? t.slice(0, len).trimEnd() + "..." : t;
}

function readingTime(html?: string | null) {
  const words = plainText(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function Cover({ post, className }: { post: Post; className: string }) {
  return post.featured_image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/uploads/blog/${post.featured_image}`}
      alt={post.title}
      className={`${className} object-cover transition duration-300 group-hover:scale-105`}
    />
  ) : (
    <div className={`${className} flex items-center justify-center bg-gradient-to-br from-primary-100 via-primary-50 to-accent-50 text-primary-300`}>
      <Newspaper className="h-10 w-10" />
    </div>
  );
}

function Meta({ post }: { post: Post }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
      <span className="inline-flex items-center gap-1.5">
        <CalendarDays className="h-3.5 w-3.5" /> {formatDate(post.created_at)}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" /> {readingTime(post.content)} min read
      </span>
    </div>
  );
}

export default async function BlogPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = (searchParams?.q ?? "").trim().slice(0, 100);
  const like = `%${q}%`;

  const posts = await query<Post>(
    `SELECT b.id, b.title, b.content, b.featured_image, b.created_at, b.featured, s.name AS school_name
     FROM blog_posts b
     LEFT JOIN schools s ON s.id = b.school_id
     WHERE (?::text = '' OR b.title ILIKE ? OR b.content ILIKE ? OR s.name ILIKE ?)
     ORDER BY b.created_at DESC
     LIMIT 30`,
    [q, like, like, like]
  ).catch(() => [] as Post[]);

  // Lead story: newest featured post, otherwise the newest post. Only when not searching.
  const lead = q ? null : posts.find((p) => p.featured) ?? posts[0] ?? null;
  const rest = lead ? posts.filter((p) => p.id !== lead.id) : posts;

  return (
    <>
      <Navbar />

      {/* Header */}
      <section className="page-band">
        <div className="container-page grid grid-cols-1 items-end gap-6 py-10 sm:py-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-1">Streamflo blog</p>
            <h1 className="page-title sm:text-3xl">News and stories from Kenyan schools</h1>
            <p className="page-subtitle max-w-xl">
              Updates, events and advice from schools across the country, plus tips for parents and students.
            </p>
          </div>
          <form action="/blog" method="get" className="flex w-full gap-2 lg:justify-self-end lg:max-w-md">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                name="q"
                defaultValue={q}
                placeholder="Search articles or schools"
                aria-label="Search articles or schools"
                className="input pl-10"
              />
            </div>
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>
      </section>

      <div className="container-page py-8 sm:py-10">
        {q && (
          <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-ink-soft">
              {posts.length} {posts.length === 1 ? "result" : "results"} for <strong className="text-ink">&ldquo;{q}&rdquo;</strong>
            </span>
            <Link href="/blog" className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
              <X className="h-3.5 w-3.5" /> Clear search
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main column */}
          <div className="lg:col-span-8 xl:col-span-9">
            {posts.length === 0 ? (
              <div className="card overflow-hidden">
                <div className="flex flex-col items-center px-6 py-14 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                    <Newspaper className="h-7 w-7" />
                  </span>
                  <h2 className="mt-4 text-lg font-semibold">
                    {q ? "No articles match your search" : "The first stories are on their way"}
                  </h2>
                  <p className="mt-1 max-w-md text-sm text-ink-soft">
                    {q
                      ? "Try a different word, or browse all articles."
                      : "Schools and the Streamflo team will share news, events and advice here soon."}
                  </p>
                  {q && <Link href="/blog" className="btn btn-secondary mt-5">See all articles</Link>}
                </div>
                {!q && (
                  <div className="grid grid-cols-1 divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/60 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    {[
                      { href: "/directory", icon: Search, title: "Find a school", desc: "Search schools in all 47 counties" },
                      { href: "/ai/notes", icon: BookOpen, title: "CBE notes", desc: "Study notes by grade and subject" },
                      { href: "/ai", icon: Sparkles, title: "Learning tools", desc: "Study assistant and quizzes" },
                    ].map(({ href, icon: Icon, title, desc }) => (
                      <Link key={href} href={href} className="group flex items-start gap-3 p-5 transition hover:bg-white">
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary-700" />
                        <span>
                          <span className="flex items-center gap-1 text-sm font-semibold text-ink">
                            {title} <ArrowRight className="h-3.5 w-3.5 text-slate-400 transition group-hover:translate-x-0.5" />
                          </span>
                          <span className="text-xs text-ink-soft">{desc}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Lead story */}
                {lead && (
                  <Link href={`/blog/${lead.id}`} className="card card-hover group mb-8 grid grid-cols-1 overflow-hidden md:grid-cols-2">
                    <div className="overflow-hidden bg-slate-100">
                      <Cover post={lead} className="aspect-[16/10] h-full w-full" />
                    </div>
                    <div className="flex flex-col p-6 sm:p-8">
                      <span className="badge badge-blue w-fit">{lead.featured ? "Featured" : "Latest"}</span>
                      <h2 className="mt-3 font-display text-xl font-semibold leading-snug group-hover:text-primary-700 sm:text-2xl">
                        {lead.title}
                      </h2>
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{excerpt(lead.content, 220)}</p>
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                        <div className="space-y-1">
                          {lead.school_name && (
                            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-700">
                              <SchoolIcon className="h-4 w-4" /> {lead.school_name}
                            </p>
                          )}
                          <Meta post={lead} />
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
                          Read article <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                )}

                {rest.length > 0 && (
                  <>
                    {lead && <h2 className="mb-4 text-base font-semibold text-ink">More articles</h2>}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {rest.map((post) => (
                        <article key={post.id} className="card card-hover group flex flex-col overflow-hidden">
                          <Link href={`/blog/${post.id}`} className="block overflow-hidden bg-slate-100">
                            <Cover post={post} className="aspect-[16/9] w-full" />
                          </Link>
                          <div className="flex flex-1 flex-col p-5">
                            {post.school_name && (
                              <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-primary-700">
                                <SchoolIcon className="h-3.5 w-3.5" /> <span className="truncate">{post.school_name}</span>
                              </p>
                            )}
                            <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug">
                              <Link href={`/blog/${post.id}`} className="hover:text-primary-700">{post.title}</Link>
                            </h3>
                            <p className="mt-2 line-clamp-3 flex-1 text-sm text-ink-muted">{excerpt(post.content)}</p>
                            <div className="mt-4 border-t border-slate-100 pt-3">
                              <Meta post={post} />
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-5 lg:col-span-4 xl:col-span-3">
            <div className="rounded-2xl bg-primary-950 p-6 text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-accent-500">
                <PenLine className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-base font-semibold text-white">Share your school&apos;s news</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-primary-100/90">
                Premium schools can post events, results and updates here for parents across Kenya to read.
              </p>
              <Link href="/register?package=premium" className="btn mt-5 w-full bg-white text-primary-900 hover:bg-primary-50">
                Get a Premium listing
              </Link>
            </div>

            <div className="card card-pad">
              <h2 className="text-sm font-semibold text-ink">Looking for a school?</h2>
              <p className="mt-1 text-sm text-ink-soft">Compare schools by county, curriculum and boarding.</p>
              <Link href="/directory" className="link mt-3 inline-flex items-center gap-1 text-sm">
                Open the directory <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="card card-pad">
              <h2 className="text-sm font-semibold text-ink">Help your child study</h2>
              <p className="mt-1 text-sm text-ink-soft">CBE notes, quizzes and a study assistant for Grades 1 to 10.</p>
              <Link href="/ai" className="link mt-3 inline-flex items-center gap-1 text-sm">
                Explore learning tools <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
      <WhatsAppFab />
    </>
  );
}
