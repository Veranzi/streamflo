import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Sign up — Streamflo",
  description: "Create a free Streamflo account. Parents, students, and schools all welcome.",
};

const choices = [
  {
    href: "/signup/parent",
    emoji: "👨‍👩‍👧",
    title: "Parent",
    desc: "Help your children with CBC homework, get career-pathway predictions, and browse schools.",
    cta: "Sign up as Parent",
    tint: "blue",
  },
  {
    href: "/signup/student",
    emoji: "🎓",
    title: "Student",
    desc: "Get CBC study help across grades 1–10, curated notes, and career guidance.",
    cta: "Sign up as Student",
    tint: "green",
  },
  {
    href: "/register",
    emoji: "🏫",
    title: "School",
    desc: "List your institution on the directory. Unlock dashboards, blogging, and parent enquiries.",
    cta: "Register School",
    tint: "indigo",
  },
];

const tints = {
  blue:   "border-blue-200 hover:border-blue-500 hover:shadow-blue-100",
  green:  "border-green-200 hover:border-green-500 hover:shadow-green-100",
  indigo: "border-indigo-200 hover:border-indigo-500 hover:shadow-indigo-100",
};

const buttonTints = {
  blue:   "bg-blue-600 hover:bg-blue-700",
  green:  "bg-green-600 hover:bg-green-700",
  indigo: "bg-indigo-600 hover:bg-indigo-700",
};

export default function SignupChoicePage() {
  return (
    <>
      <Navbar />

      <section className="bg-gradient-to-r from-slate-800 to-blue-900 text-white py-12">
        <div className="max-w-5xl mx-auto px-6">
          <h1 className="text-4xl font-bold">Create your Streamflo account</h1>
          <p className="text-blue-100 mt-3 max-w-2xl">
            One free account unlocks the school directory and EduTena&apos;s AI learning tools —
            the chatbot, career pathway predictor, and CBC notes library.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {choices.map((c) => (
            <div key={c.href}
              className={`bg-white rounded-lg shadow border-2 p-6 transition ${tints[c.tint as keyof typeof tints]}`}>
              <div className="text-5xl mb-3">{c.emoji}</div>
              <h3 className="text-xl font-bold">{c.title}</h3>
              <p className="text-slate-600 text-sm mt-2 min-h-[4rem]">{c.desc}</p>
              <Link href={c.href}
                className={`mt-4 block text-center text-white py-2 rounded font-semibold ${buttonTints[c.tint as keyof typeof buttonTints]}`}>
                {c.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-slate-500 mt-8">
          Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>

      <Footer />
    </>
  );
}
