"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Menu, X, ChevronDown, LayoutDashboard, UserRound, LogOut, Shield,
  Search, Sparkles, Newspaper, Mail, School, GraduationCap, Users, Tag, Home,
} from "lucide-react";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/directory", label: "Find a School", icon: Search },
  { href: "/ai", label: "Learning Tools", icon: Sparkles },
  { href: "/#plans", label: "Pricing", icon: Tag },
  { href: "/blog", label: "Blog", icon: Newspaper },
  { href: "/contact", label: "Contact", icon: Mail },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname() ?? "/";
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const displayName = session?.user?.name || session?.user?.email || "Account";
  const initial = displayName[0]?.toUpperCase() ?? "A";

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="btn-icon lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/Logo.png" width={36} height={36} alt="Streamflo" className="h-9 w-9 object-contain" />
              <span className="leading-tight">
                <span className="block font-display text-lg font-bold text-ink">Streamflo</span>
                <span className="hidden text-[11px] font-medium text-ink-soft sm:block">Schools and Learning in Kenya</span>
              </span>
            </Link>
          </div>

          <nav className="hidden items-center gap-0.5 lg:flex xl:gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-lg px-3 py-2 font-display text-sm font-medium transition ${
                  isActive(l.href)
                    ? "bg-primary-50 text-primary-800"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            {session ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-700 text-xs font-bold text-white">
                    {initial}
                  </span>
                  <span className="max-w-[140px] truncate">{displayName}</span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>
                {menuOpen && (
                  <div role="menu" className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-lift">
                    <div className="border-b border-slate-100 px-4 pb-2 pt-1">
                      <p className="truncate text-sm font-semibold text-ink">{displayName}</p>
                      {role && <p className="text-xs capitalize text-ink-soft">{role === "institution" ? "School account" : `${role} account`}</p>}
                    </div>
                    <MenuLink href="/account" icon={UserRound} label="My account" />
                    {role === "institution" && <MenuLink href="/dashboard" icon={LayoutDashboard} label="School dashboard" />}
                    {role === "admin" && <MenuLink href="/admin" icon={Shield} label="Admin portal" />}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="btn btn-ghost">Sign in</Link>
                <Link href="/signup" className="btn btn-primary">Create account</Link>
              </>
            )}
          </div>

          {!session && (
            <Link href="/login" className="btn btn-secondary btn-sm lg:hidden">Sign in</Link>
          )}
        </div>
      </header>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm transition-opacity lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMobileOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[88%] flex-col bg-white shadow-2xl transition-transform duration-300 lg:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
        aria-hidden={!mobileOpen}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Image src="/Logo.png" width={32} height={32} alt="Streamflo" className="h-8 w-8 object-contain" />
            <span className="font-display font-bold">Streamflo</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="btn-icon" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                isActive(href) ? "bg-primary-50 text-primary-800" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" /> {label}
            </Link>
          ))}

          <div className="my-3 divider" />

          {session ? (
            <>
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Account</p>
              <Link href="/account" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <UserRound className="h-[18px] w-[18px]" /> My account
              </Link>
              {role === "institution" && (
                <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  <LayoutDashboard className="h-[18px] w-[18px]" /> School dashboard
                </Link>
              )}
              {role === "admin" && (
                <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  <Shield className="h-[18px] w-[18px]" /> Admin portal
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-[18px] w-[18px]" /> Sign out
              </button>
            </>
          ) : (
            <div className="space-y-2 px-1">
              <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Join Streamflo</p>
              <Link href="/signup/parent" className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Users className="h-[18px] w-[18px] text-primary-700" /> I am a parent
              </Link>
              <Link href="/signup/student" className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <GraduationCap className="h-[18px] w-[18px] text-accent-600" /> I am a student
              </Link>
              <Link href="/register" className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <School className="h-[18px] w-[18px] text-violet-600" /> Register a school
              </Link>
              <Link href="/login" className="btn btn-primary mt-2 w-full">Sign in</Link>
            </div>
          )}
        </nav>

        <div className="border-t border-slate-200 px-4 py-3 text-xs text-ink-soft">
          Need help? WhatsApp <span className="font-semibold text-ink">0783 601 773</span> or call <a href="tel:0771815511" className="font-semibold text-ink">0771 815 511</a>
        </div>
      </aside>
    </>
  );
}

function MenuLink({ href, icon: Icon, label }: { href: string; icon: typeof UserRound; label: string }) {
  return (
    <Link href={href} role="menuitem" className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
      <Icon className="h-4 w-4 text-slate-400" /> {label}
    </Link>
  );
}
