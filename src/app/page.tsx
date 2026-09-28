import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowRight, BadgeCheck, BookOpen, ChevronRight, GraduationCap, MapPin, Megaphone,
  MessagesSquare, School, Search, ShieldCheck, Sparkles, TrendingUp, Users, Quote, Award,
  Backpack, BedDouble, Globe2, Building2, ListChecks, PhoneCall,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";
import HomeSearch from "@/components/HomeSearch";
import PricingPlans, { type LearningPlan } from "@/components/PricingPlans";
import { query } from "@/lib/db";
import { BlogPost, School as SchoolT, Announcement } from "@/lib/types";

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
      query<SchoolT>(`
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
        LIMIT 8
      `).catch(() => []),
      query<SchoolT>(`
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

const QUICK_FILTERS = [
  { label: "CBE schools", href: "/directory?curriculum=CBE" },
  { label: "IGCSE", href: "/directory?curriculum=IGCSE" },
  { label: "Boarding", href: "/directory?boarding=Yes" },
  { label: "Girls schools", href: "/directory?gender=Girls" },
  { label: "Boys schools", href: "/directory?gender=Boys" },
  { label: "Nairobi", href: "/directory?county=Nairobi" },
];

const AUDIENCES = [
  {
    icon: Users,
    title: "For parents",
    desc: "Compare schools by county, curriculum, boarding and gender, then contact them directly.",
    cta: "Find a school",
    href: "/directory",
    tone: "bg-primary-50 text-primary-700",
  },
  {
    icon: GraduationCap,
    title: "For learners",
    desc: "Study with CBE notes, ask the study assistant questions and practise with instant quizzes.",
    cta: "Start learning",
    href: "/ai",
    tone: "bg-accent-50 text-accent-700",
  },
  {
    icon: School,
    title: "For schools",
    desc: "Get listed, reach more families, post updates and give your students learning tools.",
    cta: "Register your school",
    href: "/register",
    tone: "bg-violet-50 text-violet-700",
  },
];

const CATEGORIES = [
  { label: "Primary", hint: "Grades 1 to 6", href: "/directory?type=Primary", icon: Backpack },
  { label: "Junior Secondary", hint: "Grades 7 to 9", href: "/directory?type=Junior%20Secondary", icon: BookOpen },
  { label: "Senior Secondary", hint: "Grades 10 to 12", href: "/directory?type=Senior%20Secondary", icon: GraduationCap },
  { label: "Boarding", hint: "Live in schools", href: "/directory?boarding=Yes", icon: BedDouble },
  { label: "International", hint: "IGCSE and IB", href: "/directory?curriculum=IGCSE", icon: Globe2 },
  { label: "Colleges", hint: "After high school", href: "/directory?type=College", icon: Building2 },
];

const STEPS = [
  { icon: Search, title: "Search", desc: "Filter by county, curriculum, boarding, gender and school type to get a short list." },
  { icon: ListChecks, title: "Compare", desc: "Open school profiles to see facilities, photos, location and contact details side by side." },
  { icon: PhoneCall, title: "Connect", desc: "Call, email or visit the school directly. No middlemen and no fees for parents." },
];

const FALLBACK_COUNTIES = ["Nairobi", "Mombasa", "Kiambu", "Nakuru", "Kisumu", "Machakos", "Uasin Gishu", "Kakamega"];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" });
}

function excerpt(html: string | undefined | null, len = 160) {
  if (!html) return "";
  const text = html.replace(/<[^>]+>/g, " ").replace(/[#*_>`]/g, "").replace(/\s+/g, " ").trim();
  return text.length > len ? text.slice(0, len).trimEnd() + "..." : text;
}

export default async function HomePage() {
  const { featuredBlogs, homepageBlogs, featuredSchools, topCounties, schoolOfWeek, announcements, news } =
    await getHomeData();
  const latest = homepageBlogs[0];
  const learningPlans = await query<LearningPlan>(
    `SELECT id, name, subscriber_type, price_kes, billing_period, features
     FROM edutena.subscription_plans
     WHERE active = TRUE
     ORDER BY subscriber_type, price_kes`
  ).catch(() => [] as LearningPlan[]);
  const counties: { county: string; total: number }[] = topCounties.length > 0
    ? topCounties
    : FALLBACK_COUNTIES.map((county) => ({ county, total: 0 }));

  return (
    <>
      <Navbar />

      {news && (
        <div className="bg-amber-50 text-amber-900">
          <div className="container-page flex items-center justify-center gap-2 py-2.5 text-sm font-medium">
            <Megaphone className="h-4 w-4 shrink-0" />
            <span className="text-center">{news}</span>
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary-950 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />
        <div aria-hidden className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary-600/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl" />

        <div className="container-page relative grid grid-cols-1 items-center gap-10 py-14 sm:py-20 lg:grid-cols-12">
          <div className="fade-in lg:col-span-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-primary-100">
              <ShieldCheck className="h-3.5 w-3.5 text-accent-500" /> Every school is verified before it is listed
            </span>
            <h1 className="text-balance mt-5 font-display text-3xl font-bold leading-[1.3] text-white sm:text-4xl xl:text-[2.75rem]">
              Find the right school for your child, <span className="text-accent-500">anywhere in Kenya</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-100/90 sm:text-lg">
              Search and compare schools by county, curriculum, boarding and more. Then keep learning at home
              with CBE notes, quizzes and a study assistant.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/directory" className="btn btn-lg bg-white text-primary-900 hover:bg-primary-50">
                <Search className="h-5 w-5" /> Browse all schools
              </Link>
              <Link href="/ai" className="btn btn-lg border border-white/25 text-white hover:bg-white/10">
                <Sparkles className="h-5 w-5" /> Explore learning tools
              </Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6 border-t border-white/10 pt-6">
              {[
                { k: "47", v: "Counties covered" },
                { k: "5+", v: "Curricula to compare" },
                { k: "Free", v: "For parents to search" },
              ].map((s) => (
                <div key={s.v}>
                  <dt className="font-display text-2xl font-bold text-white sm:text-3xl">{s.k}</dt>
                  <dd className="mt-1 text-xs text-primary-100/80 sm:text-sm">{s.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="fade-in lg:col-span-6">
            <div className="rounded-2xl bg-white p-5 text-ink shadow-2xl ring-1 ring-black/5 sm:p-6">
              <h2 className="text-lg font-bold">Quick school search</h2>
              <p className="mt-1 text-sm text-ink-soft">Type a school name to jump straight to its profile.</p>
              <div className="mt-4">
                <Suspense>
                  <HomeSearch />
                </Suspense>
              </div>
              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Popular searches</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {QUICK_FILTERS.map((f) => (
                    <Link
                      key={f.href}
                      href={f.href}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800"
                    >
                      {f.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements */}
      {announcements.length > 0 && (
        <div className="border-b border-slate-200 bg-white">
          <div className="container-page flex items-center gap-3 py-3">
            <span className="badge badge-blue shrink-0">
              <Megaphone className="h-3.5 w-3.5" /> Updates
            </span>
            <div className="relative flex-1 overflow-hidden">
              <div className="animate-marquee whitespace-nowrap text-sm font-medium text-slate-700">
                {[...announcements, ...announcements].map((a, i) => (
                  <span key={i} className="mr-12 inline-flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                    {a.message}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audiences */}
      <section className="section">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">One platform</p>
            <h2 className="section-title mt-1">Built for families, learners and schools</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {AUDIENCES.map(({ icon: Icon, title, desc, cta, href, tone }) => (
              <Link key={title} href={href} className="card card-pad card-hover group flex flex-col">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{desc}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
                  {cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by category */}
      <section className="pb-12 sm:pb-16">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Start browsing</p>
              <h2 className="section-title mt-1">Browse schools by type</h2>
            </div>
            <Link href="/directory" className="link inline-flex items-center gap-1 text-sm">
              Open the directory <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {CATEGORIES.map(({ label, hint, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="group rounded-xl border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lift"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-primary-700 group-hover:text-white">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-semibold text-ink">{label}</p>
                <p className="mt-0.5 text-xs text-ink-soft">{hint}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section border-y border-slate-200 bg-white bg-grid-light">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="section-title mt-1">Choosing a school in three simple steps</h2>
          </div>
          <ol className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map(({ title, desc, icon: Icon }, i) => (
              <li key={title} className="card card-pad relative">
                <span className="absolute right-5 top-5 font-display text-4xl font-bold text-slate-100">{i + 1}</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-700 text-white shadow-sm">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Featured schools + counties */}
      {counties.length > 0 && (
        <section className="section">
          <div className="container-page">
            {featuredSchools.length > 0 && (
              <>
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="eyebrow">Featured</p>
                    <h2 className="section-title mt-1">Schools worth a closer look</h2>
                  </div>
                  <Link href="/directory" className="link inline-flex items-center gap-1 text-sm">
                    View all schools <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {featuredSchools.map((s) => (
                    <Link key={s.id} href={`/profile/${s.id}`} className="card card-hover group flex items-start gap-4 p-5">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 font-display text-lg font-bold text-primary-700">
                        {s.name?.[0]?.toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-2 font-semibold leading-snug text-ink group-hover:text-primary-700">{s.name}</h3>
                          <BadgeCheck className="h-5 w-5 shrink-0 text-accent-600" aria-label="Verified" />
                        </div>
                        <p className="mt-1.5 flex items-center gap-1 text-sm text-ink-soft">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{[s.county, s.subcounty].filter(Boolean).join(", ")}</span>
                        </p>
                        {s.type && <span className="badge badge-gray mt-3">{s.type}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}

            {counties.length > 0 && (
              <div className={featuredSchools.length > 0 ? "mt-14" : ""}>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary-700" />
                  <h3 className="text-lg font-bold">Browse by county</h3>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {counties.map((c) => (
                    <Link
                      key={c.county}
                      href={`/directory?county=${encodeURIComponent(c.county)}`}
                      className="group flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-primary-300 hover:bg-primary-50"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{c.county}</span>
                        <span className="text-xs text-ink-soft">{c.total ? `${c.total} ${c.total === 1 ? "school" : "schools"}` : "View schools"}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-primary-700" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Learning tools band */}
      <section className="section">
        <div className="container-page">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 to-primary-950 text-white">
            <div className="grid grid-cols-1 gap-8 p-8 sm:p-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-500">Learning tools</p>
                <h2 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">
                  Help your child keep up with CBE at home
                </h2>
                <p className="mt-3 max-w-lg text-primary-100/90">
                  Curated notes by grade and subject, a study assistant that explains in simple language,
                  and quizzes that mark themselves.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/ai" className="btn bg-white text-primary-900 hover:bg-primary-50">
                    Try the learning tools <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/ai/subscribe" className="btn border border-white/25 text-white hover:bg-white/10">
                    See plans
                  </Link>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {[
                  { icon: BookOpen, title: "CBE notes", desc: "Organised by grade and subject" },
                  { icon: MessagesSquare, title: "Study assistant", desc: "Ask anything, any time" },
                  { icon: Award, title: "Quizzes", desc: "Instant scores and answers" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <Icon className="h-5 w-5 text-accent-500" />
                    <p className="mt-3 font-semibold text-white">{title}</p>
                    <p className="mt-0.5 text-sm text-primary-100/80">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog + school of the week */}
      {(latest || schoolOfWeek || featuredBlogs.length > 0) && (
        <section className="pb-12 sm:pb-16">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Stories and news</p>
                <h2 className="section-title mt-1">From the Streamflo blog</h2>
              </div>
              <Link href="/blog" className="link inline-flex items-center gap-1 text-sm">
                All articles <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              {latest && (
                <Link href={`/blog/${latest.id}`} className="card card-hover group overflow-hidden lg:col-span-2">
                  <div className="grid h-full grid-cols-1 sm:grid-cols-2">
                    <div className="aspect-[16/10] bg-slate-100 sm:aspect-auto">
                      {latest.featured_image ? (
                        <img src={`/uploads/blog/${latest.featured_image}`} alt={latest.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300"><BookOpen className="h-10 w-10" /></div>
                      )}
                    </div>
                    <div className="flex flex-col p-6">
                      <span className="badge badge-blue w-fit">Latest article</span>
                      <h3 className="mt-3 text-xl font-bold leading-snug group-hover:text-primary-700">{latest.title}</h3>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{excerpt(latest.content)}</p>
                      <p className="mt-4 text-xs text-slate-400">{formatDate(latest.created_at)}</p>
                    </div>
                  </div>
                </Link>
              )}

              {schoolOfWeek && (
                <div className="card card-pad flex flex-col border-primary-200 bg-primary-50/60">
                  <span className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary-700">
                    <Award className="h-4 w-4" /> School of the week
                  </span>
                  <h3 className="mt-3 text-xl font-bold leading-snug">{schoolOfWeek.name}</h3>
                  <p className="mt-1 flex items-center gap-1 text-sm text-ink-soft">
                    <MapPin className="h-3.5 w-3.5" />
                    {[schoolOfWeek.county, schoolOfWeek.subcounty].filter(Boolean).join(", ")}
                  </p>
                  {schoolOfWeek.description && (
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700">{excerpt(schoolOfWeek.description, 200)}</p>
                  )}
                  <Link href={`/profile/${schoolOfWeek.id}`} className="btn btn-primary mt-5 w-fit">
                    View school profile <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>

            {featuredBlogs.length > 0 && (
              <div className="blog-slider mt-6 flex gap-4 pb-2">
                {featuredBlogs.map((b) => (
                  <Link key={b.id} href={`/blog/${b.id}`} className="card card-hover group block w-64 shrink-0 overflow-hidden">
                    <div className="aspect-[16/10] bg-slate-100">
                      {b.featured_image ? (
                        <img src={`/uploads/blog/${b.featured_image}`} className="h-full w-full object-cover" alt={b.title} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300"><BookOpen className="h-8 w-8" /></div>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary-700">{b.title}</h4>
                      {b.school_name && <p className="mt-1.5 truncate text-xs text-ink-soft">{b.school_name}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Trust + testimonials */}
      <section className="section border-y border-slate-200 bg-white">
        <div className="container-page grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Why Streamflo</p>
            <h2 className="section-title mt-1">Why parents and schools trust us</h2>
            <ul className="mt-6 space-y-5">
              {[
                { icon: ShieldCheck, title: "Verified listings", desc: "Every school is checked by our team before it appears publicly." },
                { icon: TrendingUp, title: "Better visibility", desc: "Schools are discovered faster by parents searching in their area." },
                { icon: Sparkles, title: "Useful tools", desc: "Premium schools get enquiries, blog posting and a map pin." },
              ].map(({ icon: Icon, title, desc }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{title}</p>
                    <p className="mt-0.5 text-sm text-ink-soft">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {[
              { quote: "Streamflo helped me compare schools easily. The filters are amazing!", name: "Mary", place: "Nairobi" },
              { quote: "We found the perfect IGCSE school for our daughter.", name: "Edwin", place: "Mombasa" },
            ].map((t) => (
              <figure key={t.name} className="card card-pad flex flex-col bg-slate-50">
                <Quote className="h-6 w-6 text-primary-300" />
                <blockquote className="mt-3 flex-1 text-slate-700">&ldquo;{t.quote}&rdquo;</blockquote>
                <figcaption className="mt-4 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-700 text-sm font-bold text-white">{t.name[0]}</span>
                  <span>
                    <span className="block text-sm font-semibold text-ink">{t.name}</span>
                    <span className="block text-xs text-ink-soft">Parent, {t.place}</span>
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="section scroll-mt-16 border-t border-slate-200 bg-gradient-to-b from-white to-slate-50" id="plans">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Pricing</p>
            <h2 className="section-title mt-1 sm:text-2xl">Simple plans for families and schools</h2>
            <p className="mt-2 text-ink-soft">
              Learning tools for home and school, plus directory listings for schools. Clear prices in Kenya shillings.
            </p>
          </div>
          <div className="mt-8">
            <PricingPlans plans={learningPlans} />
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppFab />
    </>
  );
}
