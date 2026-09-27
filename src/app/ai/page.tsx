import Link from "next/link";
import { getServerSession } from "next-auth";
import type { LucideIcon } from "lucide-react";
import {
  MessagesSquare, Compass, BookOpen, ClipboardList, BookMarked, ArrowRight, Users, GraduationCap,
  School, Sparkles, LogIn, Check, UserPlus, MousePointerClick, Crown, Smartphone, MapPin, Send, Bot,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";

export const metadata = {
  title: "Learning Tools | Streamflo",
  description: "CBE aligned chatbot, career pathway predictions, and curated notes powered by EduTena.",
};

type Tool = {
  href: string;
  icon: LucideIcon;
  tint: string;
  title: string;
  desc: string;
  points: string[];
  audience: string;
  teacherOnly?: boolean;
};

const assistant: Tool = {
  href: "/ai/chat",
  icon: MessagesSquare,
  tint: "bg-primary-50 text-primary-700",
  title: "CBE Study Assistant",
  desc: "Ask any question from Grades 1 to 10 and get a clear answer in a Kenyan context, grounded in curated CBE notes.",
  points: [
    "Questions from Grades 1 to 10",
    "Simple explanations in a Kenyan context",
    "Grounded in curated CBE notes",
    "Upload photos or PDFs of homework on Plus and Premium",
  ],
  audience: "For parents and learners",
};

const tools: Tool[] = [
  {
    href: "/ai/assess",
    icon: ClipboardList,
    tint: "bg-amber-50 text-amber-700",
    title: "Assessment Generator",
    desc: "Create a CBE quiz for any grade, subject or topic in seconds.",
    points: ["Pick grade, subject and topic", "Instant score", "Explanation for every answer"],
    audience: "For students and parents",
  },
  {
    href: "/ai/predict",
    icon: Compass,
    tint: "bg-accent-50 text-accent-700",
    title: "Career Pathway Predictor",
    desc: "Turn a report card into a senior school pathway recommendation.",
    points: ["Enter or upload report card results", "Recommended CBE pathway", "Matching career suggestions"],
    audience: "For parents and schools",
  },
  {
    href: "/ai/notes",
    icon: BookOpen,
    tint: "bg-violet-50 text-violet-700",
    title: "CBE Notes Library",
    desc: "Curated CBE notes organised so learners find the right topic fast.",
    points: ["Browse by grade", "Filter by subject", "Read on phone or computer"],
    audience: "For everyone",
  },
];

const teacherGuide: Tool = {
  href: "/ai/notes?tab=guide",
  icon: BookMarked,
  tint: "bg-amber-50 text-amber-700",
  title: "Teacher Guides",
  desc: "Curriculum schemes, lesson guides and subject resources curated for CBE teachers.",
  points: ["Schemes of work", "Lesson guides", "Subject resources"],
  audience: "Teachers only",
  teacherOnly: true,
};

const STEPS = [
  { icon: UserPlus, title: "Create a free account", desc: "Sign up as a parent, student or school in under a minute." },
  { icon: MousePointerClick, title: "Pick a tool", desc: "Ask the study assistant, take a quiz or read CBE notes." },
  { icon: Crown, title: "Upgrade when ready", desc: "Choose a monthly plan and pay with M-Pesa. Cancel anytime." },
];

export default async function AiHomePage() {
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isTeacher = role === "institution" || role === "admin";

  const minPrice = await queryOne<{ min: string | null }>(
    "SELECT MIN(price_kes) AS min FROM edutena.subscription_plans WHERE active = TRUE AND subscriber_type = 'parent'"
  )
    .then((r) => (r?.min ? Number(r.min) : 500))
    .catch(() => 500);

  const link = (href: string) => (signedIn ? href : `/login?callbackUrl=${encodeURIComponent(href)}`);
  const gridTools = isTeacher ? [...tools, teacherGuide] : tools;

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary-950 text-white">
        <div aria-hidden className="bg-dots-dark absolute inset-0 opacity-60" />
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary-600/30 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />

        <div className="container-page relative grid grid-cols-1 items-center gap-10 py-12 sm:py-16 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-primary-100">
              <Sparkles className="h-3.5 w-3.5 text-accent-500" /> Learning tools by EduTena
            </span>
            <h1 className="text-balance mt-5 font-display text-3xl font-bold leading-[1.25] text-white sm:text-4xl">
              Study smarter with <span className="text-accent-500">CBE learning tools</span>
            </h1>
            <p className="mt-4 max-w-xl leading-relaxed text-primary-100/90">
              Homework help, quizzes, CBE notes and career guidance for parents, learners and schools.
              One Streamflo account unlocks all of it.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              {signedIn ? (
                <>
                  <Link href="/ai/chat" className="btn btn-lg bg-white text-primary-900 hover:bg-primary-50">
                    <MessagesSquare className="h-5 w-5" /> Open study assistant
                  </Link>
                  <Link href="/ai/subscribe" className="btn btn-lg border border-white/25 text-white hover:bg-white/10">
                    View plans
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/signup" className="btn btn-lg bg-white text-primary-900 hover:bg-primary-50">
                    <UserPlus className="h-5 w-5" /> Create free account
                  </Link>
                  <Link href="/login?callbackUrl=%2Fai" className="btn btn-lg border border-white/25 text-white hover:bg-white/10">
                    <LogIn className="h-5 w-5" /> Sign in
                  </Link>
                </>
              )}
            </div>

            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-primary-100/90">
              {[
                { icon: GraduationCap, text: "Grades 1 to 10" },
                { icon: MapPin, text: "Kenyan context" },
                { icon: Smartphone, text: "Pay with M-Pesa" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4 text-accent-500" /> {text}
                </li>
              ))}
            </ul>
          </div>

          {/* Chat preview */}
          <div className="relative mx-auto w-full max-w-md lg:ml-auto">
            <div className="rounded-2xl bg-white p-4 text-ink shadow-2xl ring-1 ring-black/5 sm:p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-700 text-white">
                    <Bot className="h-5 w-5" />
                  </span>
                  <div className="leading-tight">
                    <p className="text-sm font-semibold">Study assistant</p>
                    <p className="text-xs text-accent-600">Online</p>
                  </div>
                </div>
                <span className="badge badge-gray">Example</span>
              </div>
              <div className="space-y-3 py-4 text-sm">
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary-700 px-4 py-2.5 text-white">
                  Explain photosynthesis for a Grade 6 learner.
                </div>
                <div className="w-fit max-w-[90%] rounded-2xl rounded-bl-md bg-slate-100 px-4 py-2.5 text-slate-700">
                  Plants make their own food using sunlight, water and carbon dioxide. The leaves take in
                  sunlight, the roots bring water, and the plant gives out oxygen that we breathe.
                </div>
                <div className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-primary-700 px-4 py-2.5 text-white">
                  Give me 3 quiz questions on it.
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
                <span className="flex-1 text-sm text-slate-400">Ask a question...</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-700 text-white">
                  <Send className="h-4 w-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="section">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">The tools</p>
            <h2 className="section-title mt-1 sm:text-2xl">Everything a learner needs in one place</h2>
          </div>

          {/* Featured: study assistant */}
          <Link
            href={link(assistant.href)}
            className="card card-hover group mt-8 grid grid-cols-1 overflow-hidden md:grid-cols-5"
          >
            <div className="p-6 sm:p-8 md:col-span-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${assistant.tint}`}>
                  <assistant.icon className="h-5 w-5" />
                </span>
                <span className="badge badge-blue">Start here</span>
              </div>
              <h3 className="mt-4 text-xl font-semibold">{assistant.title}</h3>
              <p className="mt-2 max-w-xl text-ink-soft">{assistant.desc}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 font-semibold text-primary-700">
                {signedIn ? "Start a conversation" : "Sign in to start"}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </div>
            <div className="border-t border-slate-100 bg-slate-50 p-6 sm:p-8 md:col-span-2 md:border-l md:border-t-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">What you can do</p>
              <ul className="mt-4 space-y-3 text-sm text-slate-700">
                {assistant.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" /> {p}
                  </li>
                ))}
              </ul>
              <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-ink-soft">
                <Users className="h-3.5 w-3.5" /> {assistant.audience}
              </p>
            </div>
          </Link>

          {/* Other tools */}
          <div className={`mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 ${gridTools.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
            {gridTools.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.href}
                  href={link(t.href)}
                  className={`card card-pad card-hover group flex flex-col ${t.teacherOnly ? "border-amber-200 bg-amber-50/30" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${t.tint}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    {t.teacherOnly && <span className="badge badge-amber">Teachers only</span>}
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{t.title}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{t.desc}</p>
                  <ul className="mt-4 flex-1 space-y-2 text-sm text-slate-700">
                    {t.points.map((p) => (
                      <li key={p} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" /> {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="text-xs text-ink-soft">{t.audience}</span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
                      Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pricing strip */}
          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-primary-200 bg-primary-50/60 p-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white">
                <Crown className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-ink">
                  Plans from KES {minPrice.toLocaleString("en-KE")} per month
                </p>
                <p className="mt-0.5 text-sm text-ink-soft">
                  Family plans for home learning and school plans that cover all your students. Pay with M-Pesa.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link href="/#plans" className="btn btn-secondary">Compare plans</Link>
              <Link href={link("/ai/subscribe")} className="btn btn-primary">
                Subscribe <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section border-y border-slate-200 bg-white">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="section-title mt-1 sm:text-2xl">Start learning in three steps</h2>
          </div>
          <ol className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <li key={title} className="flex gap-4">
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white">
                  <Icon className="h-5 w-5" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-[11px] font-bold text-primary-950">
                    {i + 1}
                  </span>
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Sign up band */}
      {!signedIn && (
        <section className="section">
          <div className="container-page">
            <div className="rounded-2xl bg-primary-950 p-8 text-center text-white sm:p-10">
              <h2 className="font-display text-2xl font-semibold text-white">Create your free account</h2>
              <p className="mx-auto mt-2 max-w-lg text-primary-100/90">Choose the account type that fits you.</p>
              <div className="mx-auto mt-6 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { href: "/signup/parent", icon: Users, label: "I am a parent" },
                  { href: "/signup/student", icon: GraduationCap, label: "I am a student" },
                  { href: "/register", icon: School, label: "I am a school" },
                ].map(({ href, icon: Icon, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white hover:text-primary-900"
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                ))}
              </div>
              <p className="mt-5 text-sm text-primary-200">
                Already have an account? <Link href="/login?callbackUrl=%2Fai" className="font-semibold text-white underline">Sign in</Link>
              </p>
            </div>
          </div>
        </section>
      )}

      <p className="pb-8 text-center text-xs text-slate-400">Powered by EduTena in partnership with Streamflo.</p>

      <Footer />
      <WhatsAppFab />
    </>
  );
}
