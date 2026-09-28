"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, School, Users, Newspaper, MessageSquare, Megaphone, CalendarDays,
  Images, Inbox, BriefcaseBusiness, Wallet, ClipboardCheck, BadgeCheck, Layers,
  GraduationCap, BookOpenText, ShieldCheck, Settings, Menu, X, LogOut, ExternalLink,
  type LucideIcon,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV: { title: string; items: NavItem[] }[] = [
  {
    title: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Directory",
    items: [
      { href: "/admin/schools", label: "Schools", icon: School },
      { href: "/admin/photos", label: "School photos", icon: Images },
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/agents", label: "Sales agents", icon: BriefcaseBusiness },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/blog", label: "Blog posts", icon: Newspaper },
      { href: "/admin/blog-comments", label: "Comments", icon: MessageSquare },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { href: "/admin/events", label: "Events", icon: CalendarDays },
      { href: "/admin/contacts", label: "Messages", icon: Inbox },
    ],
  },
  {
    title: "Finance",
    items: [
      { href: "/admin/payments", label: "Payments", icon: Wallet },
      { href: "/admin/subscriptions", label: "Subscription requests", icon: ClipboardCheck },
      { href: "/admin/ai-active-subs", label: "Active subscriptions", icon: BadgeCheck },
      { href: "/admin/ai-plans", label: "Plans and pricing", icon: Layers },
    ],
  },
  {
    title: "Learning",
    items: [
      { href: "/admin/edutena-users", label: "Learners", icon: GraduationCap },
      { href: "/admin/notes", label: "CBE notes", icon: BookOpenText },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/admins", label: "Administrators", icon: ShieldCheck },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);

export default function AdminShell({ userName, children }: { userName: string; children: React.ReactNode }) {
  const pathname = usePathname() ?? "/admin";
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/");

  const current = ALL_ITEMS.find((i) => isActive(i.href));
  const initial = (userName || "A")[0].toUpperCase();

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <Image src="/Logo.png" width={32} height={32} alt="Streamflo" className="h-8 w-8 rounded-md bg-white object-contain p-0.5" />
        <div className="leading-tight">
          <p className="font-display text-[15px] font-bold text-white">Streamflo</p>
          <p className="text-[11px] text-slate-400">Admin portal</p>
        </div>
      </div>

      <nav className="scroll-thin flex-1 overflow-y-auto px-3 py-4">
        {NAV.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group flex items-center gap-3 rounded-lg px-3 py-2 font-display text-sm font-medium transition ${
                      active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-primary-300" : "text-slate-500 group-hover:text-slate-300"}`} />
                    <span className="truncate">{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">{initial}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{userName || "Administrator"}</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
          <Link href="/api/auth/signout" title="Sign out" className="rounded-md p-2 text-slate-400 hover:bg-white/10 hover:text-white">
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-slate-950 lg:block">{sidebar}</aside>

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm transition-opacity lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setOpen(false)}
      />
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 shadow-2xl transition-transform duration-300 lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close menu">
          <X className="h-5 w-5" />
        </button>
        {sidebar}
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
          <button onClick={() => setOpen(true)} className="btn-icon lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink-soft">
              Admin <span className="mx-1.5 text-slate-300">/</span>
              <span className="font-medium text-ink">{current?.label ?? "Dashboard"}</span>
            </p>
          </div>
          <Link href="/" target="_blank" className="btn btn-secondary btn-sm">
            <ExternalLink className="h-3.5 w-3.5" /> View site
          </Link>
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
