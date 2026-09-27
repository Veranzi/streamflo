import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

/** Title block at the top of a page, with optional actions on the right. */
export function PageHeader({
  title, description, actions, eyebrow,
}: {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && <p className="page-subtitle">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const TONES = {
  blue: "bg-primary-50 text-primary-700",
  green: "bg-accent-50 text-accent-700",
  amber: "bg-amber-50 text-amber-700",
  purple: "bg-violet-50 text-violet-700",
  red: "bg-red-50 text-red-700",
  gray: "bg-slate-100 text-slate-600",
} as const;

export type Tone = keyof typeof TONES;

/** Metric tile. Pass href to make it clickable. */
export function StatCard({
  label, value, hint, icon: Icon, tone = "blue", href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  href?: string;
}) {
  const body = (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        <p className="mt-2 font-display text-2xl font-bold tabular-nums text-ink sm:text-3xl">{value}</p>
        {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
      </div>
      {Icon && (
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      )}
    </div>
  );
  return href ? (
    <Link href={href} className="card card-pad card-hover block">{body}</Link>
  ) : (
    <div className="card card-pad">{body}</div>
  );
}

/** Friendly placeholder for empty lists. */
export function EmptyState({
  title, description, icon: Icon = Inbox, action,
}: {
  title: string;
  description?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-6 w-6" />
      </span>
      <p className="text-base font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Coloured status pill. */
export function Badge({ tone = "gray", children }: { tone?: Tone; children: React.ReactNode }) {
  const map: Record<Tone, string> = {
    blue: "badge-blue", green: "badge-green", amber: "badge-amber",
    purple: "badge-purple", red: "badge-red", gray: "badge-gray",
  };
  return <span className={`badge ${map[tone]}`}>{children}</span>;
}
