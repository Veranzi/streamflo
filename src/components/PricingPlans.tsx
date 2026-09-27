import Link from "next/link";
import {
  Check, X, Users, School, Sparkles, Smartphone, ArrowRight, ChevronDown, type LucideIcon,
} from "lucide-react";

export interface LearningPlan {
  id: number;
  name: string;
  subscriber_type: "parent" | "school";
  price_kes: number;
  billing_period: string;
  features: { tier?: string; uploads_per_month?: number; text_chat?: boolean } | null;
}

// Agreed tier structure (edutena-backend migration 2026-04-28 and 2026-05-08).
// Used only when live plans cannot be loaded from the database.
const DEFAULT_PLANS: LearningPlan[] = [
  { id: -1, name: "Basic", subscriber_type: "parent", price_kes: 500, billing_period: "monthly", features: { tier: "basic", text_chat: true, uploads_per_month: 0 } },
  { id: -2, name: "Plus", subscriber_type: "parent", price_kes: 1000, billing_period: "monthly", features: { tier: "plus", text_chat: true, uploads_per_month: 5 } },
  { id: -3, name: "Premium", subscriber_type: "parent", price_kes: 2000, billing_period: "monthly", features: { tier: "premium", text_chat: true, uploads_per_month: -1 } },
  { id: -4, name: "Plus", subscriber_type: "school", price_kes: 5000, billing_period: "monthly", features: { tier: "plus", text_chat: true, uploads_per_month: 20 } },
  { id: -5, name: "Premium", subscriber_type: "school", price_kes: 10000, billing_period: "monthly", features: { tier: "premium", text_chat: true, uploads_per_month: -1 } },
];

const LISTING_ROWS: [string, boolean | string, boolean | string, boolean | string][] = [
  ["Appears in search", true, true, true],
  ["Featured listing", false, true, true],
  ["Blog posting", false, true, "Unlimited"],
  ["Map pin location", false, true, true],
  ["API access", false, false, true],
];

const kes = (n: number) => `KES ${Number(n).toLocaleString("en-KE")}`;

function period(p: string) {
  const v = (p || "monthly").toLowerCase();
  if (v.startsWith("month")) return "/ month";
  if (v.startsWith("year") || v.startsWith("annual")) return "/ year";
  if (v.startsWith("term")) return "/ term";
  if (v.startsWith("week")) return "/ week";
  return `/ ${v}`;
}

function tagline(p: LearningPlan) {
  const tier = p.features?.tier ?? p.name.toLowerCase();
  if (tier === "basic") return "For quick homework help";
  if (tier === "plus") return p.subscriber_type === "school" ? "Best for most schools" : "Best for most families";
  if (tier === "premium") return "For heavy daily use";
  return "";
}

/** Only what differs between plans. Shared items live in the panel's "Every plan includes" list. */
function planHighlights(p: LearningPlan): { text: string; included: boolean }[] {
  const u = p.features?.uploads_per_month;
  const list: { text: string; included: boolean }[] = [{ text: "Ask the study assistant anything", included: true }];
  if (u === -1) list.push({ text: "Unlimited photo and PDF uploads", included: true });
  else if (u === 0 || u == null) list.push({ text: "Photo and PDF uploads", included: false });
  else list.push({ text: `${u} photo or PDF uploads a month`, included: true });
  return list;
}

function isRecommended(plans: LearningPlan[], i: number) {
  const plusIdx = plans.findIndex((p) => p.features?.tier === "plus");
  return plusIdx >= 0 ? i === plusIdx : plans.length === 3 && i === 1;
}

/* ---------- Building blocks ---------- */

function Panel({
  icon: Icon, tone, title, desc, includes, footnote, children,
}: {
  icon: LucideIcon;
  tone: string;
  title: string;
  desc: string;
  includes: string[];
  footnote?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="border-b border-slate-200 bg-slate-50/80 p-6 lg:col-span-4 lg:border-b-0 lg:border-r xl:col-span-3">
          <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
            <Icon className="h-5 w-5" />
          </span>
          <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">{desc}</p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400">Every plan includes</p>
          <ul className="mt-3 space-y-2.5 text-sm text-slate-700">
            {includes.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {f}
              </li>
            ))}
          </ul>
          {footnote && <div className="mt-6 text-xs leading-relaxed text-ink-soft">{footnote}</div>}
        </div>
        <div className="p-5 sm:p-6 lg:col-span-8 xl:col-span-9">{children}</div>
      </div>
    </div>
  );
}

function PlanCard({
  name, tagline: line, price, per, strike, highlights, cta, href, featured, badge,
}: {
  name: string;
  tagline?: string;
  price: string;
  per?: string;
  strike?: string;
  highlights: { text: string; included: boolean }[];
  cta: string;
  href: string;
  featured?: boolean;
  badge?: string;
}) {
  return (
    <div
      className={`subscription-column relative flex h-full flex-col rounded-xl p-5 ${
        featured
          ? "bg-primary-950 text-white shadow-lift ring-1 ring-primary-900"
          : "border border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h4 className={`text-base font-semibold ${featured ? "text-white" : "text-ink"}`}>{name}</h4>
        {badge && (
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${featured ? "bg-accent-500 text-primary-950" : "bg-primary-50 text-primary-700"}`}>
            {badge}
          </span>
        )}
      </div>
      {line && <p className={`mt-0.5 text-xs ${featured ? "text-primary-200" : "text-ink-soft"}`}>{line}</p>}

      <div className="mt-5 flex items-baseline gap-1">
        <span className={`font-display text-[1.75rem] font-bold leading-none ${featured ? "text-white" : "text-ink"}`}>{price}</span>
        {per && <span className={`text-sm ${featured ? "text-primary-200" : "text-ink-soft"}`}>{per}</span>}
      </div>
      {strike && <p className={`mt-1 text-xs line-through ${featured ? "text-primary-300" : "text-slate-400"}`}>{strike}</p>}

      <ul className={`mt-5 flex-1 space-y-2.5 border-t pt-5 text-sm ${featured ? "border-white/10" : "border-slate-100"}`}>
        {highlights.map((h) => (
          <li key={h.text} className={`flex items-start gap-2 ${h.included ? "" : featured ? "text-primary-300/70" : "text-slate-400"}`}>
            {h.included ? (
              <Check className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-accent-500" : "text-accent-600"}`} />
            ) : (
              <X className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span className={h.included ? "" : "line-through decoration-1"}>{h.text}</span>
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={`btn mt-6 w-full ${featured ? "bg-white text-primary-900 hover:bg-primary-50" : "btn-secondary"}`}
      >
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function LearningGrid({ plans }: { plans: LearningPlan[] }) {
  const sorted = [...plans].sort((a, b) => a.price_kes - b.price_kes);
  const cols = sorted.length >= 3 ? "md:grid-cols-3" : sorted.length === 2 ? "md:grid-cols-2" : "max-w-sm";
  return (
    <div className={`grid grid-cols-1 gap-4 ${cols}`}>
      {sorted.map((p, i) => {
        const rec = isRecommended(sorted, i);
        return (
          <PlanCard
            key={p.id}
            name={p.name}
            tagline={tagline(p)}
            price={kes(p.price_kes)}
            per={period(p.billing_period)}
            highlights={planHighlights(p)}
            cta={`Choose ${p.name}`}
            href="/ai/subscribe"
            featured={rec}
            badge={rec ? "Recommended" : undefined}
          />
        );
      })}
    </div>
  );
}

/* ---------- Main ---------- */

export default function PricingPlans({ plans }: { plans: LearningPlan[] }) {
  const source = plans.length > 0 ? plans : DEFAULT_PLANS;
  const family = source.filter((p) => p.subscriber_type === "parent");
  const school = source.filter((p) => p.subscriber_type === "school");

  const mpesaNote = (
    <span className="inline-flex items-start gap-1.5">
      <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      Pay monthly with M-Pesa. Your plan starts as soon as payment is confirmed.
    </span>
  );

  return (
    <div className="space-y-6">
      {family.length > 0 && (
        <Panel
          icon={Users}
          tone="bg-primary-50 text-primary-700"
          title="Learning tools for families"
          desc="For parents and learners studying at home."
          includes={["CBE study assistant", "CBE notes library by grade", "Use on phone or computer", "Cancel anytime"]}
          footnote={mpesaNote}
        >
          <LearningGrid plans={family} />
        </Panel>
      )}

      {school.length > 0 && (
        <Panel
          icon={Sparkles}
          tone="bg-accent-50 text-accent-700"
          title="Learning tools for schools"
          desc="Give all your students the learning tools under one school plan."
          includes={["Access for your students", "CBE study assistant", "CBE notes library by grade", "Cancel anytime"]}
          footnote={mpesaNote}
        >
          <LearningGrid plans={school} />
        </Panel>
      )}

      <Panel
        icon={School}
        tone="bg-violet-50 text-violet-700"
        title="School directory listing"
        desc="Put your school in front of parents searching in your area."
        includes={["School profile page", "Appears in search", "Verified by our team"]}
        footnote={
          <details className="group">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1 font-semibold text-primary-700 hover:underline">
              Compare listing plans <ChevronDown className="h-3.5 w-3.5 transition group-open:rotate-180" />
            </summary>
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="px-2.5 py-2 text-left font-semibold">Feature</th>
                    <th className="px-1.5 py-2 font-semibold">Free</th>
                    <th className="px-1.5 py-2 font-semibold">Prem.</th>
                    <th className="px-1.5 py-2 font-semibold">Ent.</th>
                  </tr>
                </thead>
                <tbody>
                  {LISTING_ROWS.map(([feature, ...vals]) => (
                    <tr key={feature} className="border-t border-slate-100">
                      <td className="px-2.5 py-2 text-slate-700">{feature}</td>
                      {vals.map((v, i) => (
                        <td key={i} className="px-1.5 py-2 text-center">
                          {v === true ? (
                            <Check className="mx-auto h-3.5 w-3.5 text-accent-600" aria-label="Included" />
                          ) : v === false ? (
                            <X className="mx-auto h-3.5 w-3.5 text-slate-300" aria-label="Not included" />
                          ) : (
                            <span className="font-medium text-ink">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PlanCard
            name="Starter"
            tagline="Get your school online"
            price="Free"
            highlights={[
              { text: "Basic school profile", included: true },
              { text: "School updates", included: true },
              { text: "Featured listing", included: false },
            ]}
            cta="Get started"
            href="/register?package=free"
          />
          <PlanCard
            name="Premium"
            tagline="Stand out to parents"
            price="KES 1,250"
            per="/ year"
            strike="KES 5,000 / year"
            highlights={[
              { text: "Featured listing", included: true },
              { text: "Unlimited enquiries", included: true },
              { text: "Blog posting", included: true },
              { text: "Map pin location", included: true },
            ]}
            cta="Go Premium"
            href="/register?package=premium"
            featured
            badge="75% off"
          />
          <PlanCard
            name="Enterprise"
            tagline="For school groups"
            price="Custom"
            highlights={[
              { text: "API integration", included: true },
              { text: "Bulk staff access", included: true },
              { text: "Advanced analytics", included: true },
            ]}
            cta="Contact us"
            href="/contact"
          />
        </div>
      </Panel>
    </div>
  );
}
