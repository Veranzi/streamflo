import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";

export const metadata = {
  title: "AI Learning Tools — Streamflo",
  description: "CBC-aligned chatbot, career pathway predictions, and curated notes powered by EduTena.",
};

const tools = [
  {
    href: "/ai/chat",
    emoji: "💬",
    title: "CBC Study Chatbot",
    desc: "Ask questions across grades 1–10. Kenyan-context answers, grounded in curated CBC notes.",
    audience: "Parents, learners",
  },
  {
    href: "/ai/predict",
    emoji: "🎯",
    title: "Career Pathway Predictor",
    desc: "Turn a report card into a CBC senior-school pathway recommendation and career suggestions.",
    audience: "Parents, schools",
  },
  {
    href: "/ai/notes",
    emoji: "📚",
    title: "CBC Notes Library",
    desc: "Browse curated CBC notes by grade and subject.",
    audience: "All",
  },
  {
    href: "/ai/assess",
    emoji: "📝",
    title: "Assessment Generator",
    desc: "Generate a custom CBC quiz for any grade, subject, or topic. Get instant scores and answer explanations.",
    audience: "Students, parents",
  },
  {
    href: "/ai/subscribe",
    emoji: "⭐",
    title: "AI Subscription Plans",
    desc: "Parent and school plans. Schools get bulk student access; parents get the chatbot and predictions.",
    audience: "All",
  },
];

export default async function AiHomePage() {
  const session = await getServerSession(authOptions);
  const signedIn = !!session?.user;
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isTeacher = role === "institution" || role === "admin";

  // Teacher-only card — only added to the grid for institution / admin
  const teacherGuideCard = {
    href: "/ai/notes?tab=guide",
    emoji: "📖",
    title: "Teacher Guides",
    desc: "Access curriculum schemes, lesson guides, and subject resources curated for CBC teachers.",
    audience: "Teachers only",
    teacherOnly: true,
  };

  const visibleTools = isTeacher
    ? [...tools.slice(0, 3), teacherGuideCard, ...tools.slice(3)]
    : tools;

  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-r from-indigo-700 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold">AI Learning Tools</h1>
          <p className="mt-3 text-blue-100 max-w-2xl">
            EduTena&apos;s CBC-focused AI tools for parents, students, and schools. One Streamflo
            account unlocks all of it.
          </p>
        </div>
      </section>

      {!signedIn && (
        <div className="bg-yellow-50 border-y border-yellow-200">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap gap-3 items-center justify-between">
            <p className="text-sm text-yellow-800">
              <strong>Create a free account</strong> to use the chatbot and predictions. Choose the account type that fits you:
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/signup/parent" className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
                👨‍👩‍👧 Parent
              </Link>
              <Link href="/signup/student" className="bg-green-600 text-white text-sm px-4 py-2 rounded hover:bg-green-700">
                🎓 Student
              </Link>
              <Link href="/register" className="bg-indigo-600 text-white text-sm px-4 py-2 rounded hover:bg-indigo-700">
                🏫 School
              </Link>
              <Link href="/login" className="text-sm px-4 py-2 rounded border border-slate-400 text-slate-700 hover:bg-slate-100">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleTools.map((t) => (
            <Link key={t.href} href={signedIn ? t.href : `/login?callbackUrl=${encodeURIComponent(t.href)}`}
              className={`bg-white rounded shadow p-6 hover:shadow-md transition flex gap-4 ${
                "teacherOnly" in t && t.teacherOnly ? "border border-amber-200" : ""
              }`}>
              <div className="text-4xl">{t.emoji}</div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{t.title}</h3>
                  {"teacherOnly" in t && (t as { teacherOnly?: boolean }).teacherOnly && (
                    <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 rounded px-1.5 py-0.5">
                      Teachers only
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mt-1">{t.desc}</p>
                <p className="text-xs text-slate-400 mt-2 uppercase tracking-wide">{t.audience}</p>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-xs text-slate-400 mt-8 text-center">
          Powered by EduTena in partnership with Streamflo.
        </p>
      </div>

      <Footer />
      <WhatsAppFab />
    </>
  );
}
