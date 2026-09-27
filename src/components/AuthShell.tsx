import Link from "next/link";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft, Search, Sparkles, ShieldCheck, Users, GraduationCap, School, ChevronRight,
} from "lucide-react";

export interface AuthBenefit {
  icon: LucideIcon;
  title: string;
  text: string;
}

const DEFAULT_BENEFITS: AuthBenefit[] = [
  { icon: Search, title: "Find the right school", text: "Search and compare schools in all 47 counties." },
  { icon: Sparkles, title: "CBE learning tools", text: "Study help, notes and career guidance for every grade." },
  { icon: ShieldCheck, title: "Free and secure", text: "Your account and details are kept private." },
];

/**
 * Split layout used by sign in, sign up and password pages.
 * Left: brand panel (desktop only). Right: the form area.
 * Server safe; can be rendered from client or server components.
 */
export default function AuthShell({
  children,
  statement = "Schools and learning in Kenya, in one place.",
  description = "Streamflo helps parents, students and schools connect, learn and grow.",
  benefits = DEFAULT_BENEFITS,
  width = "md",
  backHref = "/",
  backLabel = "Back to home",
}: {
  children: React.ReactNode;
  statement?: string;
  description?: string;
  benefits?: AuthBenefit[];
  width?: "md" | "lg" | "xl";
  backHref?: string;
  backLabel?: string;
}) {
  const maxW = width === "xl" ? "max-w-3xl" : width === "lg" ? "max-w-xl" : "max-w-md";

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary-950 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:self-start lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary-700/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary-800/50 blur-3xl" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        <Link href="/" className="relative flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm">
            <Image src="/Logo.png" width={36} height={36} alt="Streamflo" className="h-8 w-8 object-contain" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-xl font-bold text-white">Streamflo</span>
            <span className="block text-xs text-primary-200">Schools and Learning in Kenya</span>
          </span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="font-display text-2xl font-bold leading-tight text-white xl:text-3xl">{statement}</h2>
          <p className="mt-4 text-base text-primary-100/90">{description}</p>

          <ul className="mt-10 space-y-5">
            {benefits.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-white/15">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="mt-0.5 text-sm text-primary-200">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-primary-300">
          Need help? WhatsApp <span className="font-semibold text-white">0783 601 773</span> or call <a href="tel:0771815511" className="font-semibold text-white">0771 815 511</a>
        </p>
      </aside>

      {/* Form area */}
      <main className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2 lg:invisible">
            <Image src="/Logo.png" width={32} height={32} alt="Streamflo" className="h-8 w-8 object-contain" />
            <span className="font-display text-lg font-bold text-ink">Streamflo</span>
          </Link>
          <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-primary-700">
            <ArrowLeft className="h-4 w-4" /> {backLabel}
          </Link>
        </div>
        <div className="flex flex-1 items-start justify-center px-4 pb-12 pt-4 sm:items-center sm:px-8">
          <div className={`w-full ${maxW}`}>{children}</div>
        </div>
      </main>
    </div>
  );
}

/** Heading block for the top of an auth form. */
export function AuthHeading({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-2xl font-bold tracking-[-0.015em] text-ink sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-ink-soft sm:text-base">{subtitle}</p>}
    </div>
  );
}

const ACCOUNT_TYPES: {
  key: "parent" | "student" | "school";
  href: string;
  icon: LucideIcon;
  title: string;
  text: string;
}[] = [
  { key: "parent", href: "/signup/parent", icon: Users, title: "Parent", text: "Support your children and find schools." },
  { key: "student", href: "/signup/student", icon: GraduationCap, title: "Student", text: "Study help, notes and career guidance." },
  { key: "school", href: "/register", icon: School, title: "School", text: "List your school and reach parents." },
];

/**
 * Account type picker shown as selectable cards. Each card links to its sign up page.
 * layout "stack" shows full cards with descriptions; "row" shows compact tiles in a row.
 */
export function AccountTypeCards({
  active,
  layout = "stack",
}: {
  active?: "parent" | "student" | "school";
  layout?: "stack" | "row";
}) {
  if (layout === "row") {
    return (
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Account type">
        {ACCOUNT_TYPES.map(({ key, href, icon: Icon, title }) => {
          const selected = active === key;
          return (
            <Link
              key={key}
              href={href}
              role="radio"
              aria-checked={selected}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center text-sm font-medium transition ${
                selected
                  ? "border-primary-600 bg-primary-50 text-primary-800 ring-1 ring-primary-600"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon className={`h-5 w-5 ${selected ? "text-primary-700" : "text-slate-400"}`} />
              {title}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ACCOUNT_TYPES.map(({ key, href, icon: Icon, title, text }) => {
        const selected = active === key;
        return (
          <Link
            key={key}
            href={href}
            className={`group flex items-center gap-4 rounded-xl border p-4 transition ${
              selected
                ? "border-primary-600 bg-primary-50 ring-1 ring-primary-600"
                : "border-slate-200 bg-white hover:border-primary-300 hover:bg-primary-50/40 hover:shadow-card"
            }`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 ring-1 ring-primary-100 group-hover:bg-white">
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">{title}</span>
              <span className="block text-sm text-ink-soft">{text}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-primary-600" />
          </Link>
        );
      })}
    </div>
  );
}

/** "or continue with email" divider. */
export function AuthDivider({ label = "or with email" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-3">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
