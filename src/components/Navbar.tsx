"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <>
      <header className="bg-white shadow-sm fade-in">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="md:hidden p-2 rounded hover:bg-slate-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link href="/" className="flex items-center gap-2">
              <Image src="/Logo.png" width={40} height={40} alt="Streamflo" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold">Streamflo Directory</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/directory" className="hover:text-blue-600 font-medium">Directory</Link>
            <Link href="/ai" className="hover:text-blue-600 font-medium flex items-center gap-1">
              <span>AI Tools</span>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
            </Link>
            <Link href="/blog" className="hover:text-blue-600 font-medium">Blog</Link>
            <Link href="/contact" className="hover:text-blue-600 font-medium">Contact</Link>
            {session ? (
              <>
                {session.user?.role === "institution" && (
                  <Link href="/dashboard" className="hover:text-blue-600 font-medium">Dashboard</Link>
                )}
                <Link href="/account" className="hover:text-blue-600 font-medium flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                    {(session.user?.name || session.user?.email || "?")[0]?.toUpperCase()}
                  </span>
                  <span>My Account</span>
                </Link>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="text-red-600 hover:underline font-medium">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-blue-600 font-medium">Login</Link>
                <Link href="/signup" className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile off-canvas nav */}
      <div className={`offcanvas ${mobileOpen ? "open" : ""}`} style={{ left: 0 }}>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/Logo.png" width={32} height={32} alt="Streamflo" className="w-8 h-8 object-contain" />
            <div>
              <div className="font-bold">Streamflo</div>
              <div className="text-xs text-slate-500">Find Schools in Kenya</div>
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="p-2 rounded hover:bg-slate-100" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          {[
            { href: "/directory", label: "Directory" },
            { href: "/ai", label: "AI Tools" },
            { href: "/blog", label: "Blog" },
            { href: "/contact", label: "Contact" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block font-semibold p-2 rounded hover:bg-slate-50"
            >
              {label}
            </Link>
          ))}

          <hr className="my-2" />

          {session ? (
            <>
              <Link href="/account" onClick={() => setMobileOpen(false)} className="block font-semibold p-2 rounded hover:bg-slate-50">
                My Account
              </Link>
              {session.user?.role === "institution" && (
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block font-semibold p-2 rounded hover:bg-slate-50">
                  School Dashboard
                </Link>
              )}
              <button onClick={() => signOut({ callbackUrl: "/" })} className="block w-full text-left font-semibold p-2 rounded hover:bg-slate-50 text-red-600">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)}
                className="block mt-2 border border-blue-600 text-blue-600 px-3 py-2 rounded text-center">
                Sign in
              </Link>
              <Link href="/signup/parent" onClick={() => setMobileOpen(false)}
                className="block mt-2 bg-blue-600 text-white px-3 py-2 rounded text-center">
                Parent sign up
              </Link>
              <Link href="/signup/student" onClick={() => setMobileOpen(false)}
                className="block mt-2 bg-green-600 text-white px-3 py-2 rounded text-center">
                Student sign up
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)}
                className="block mt-2 bg-indigo-600 text-white px-3 py-2 rounded text-center">
                Register a school
              </Link>
            </>
          )}

          <div className="mt-4 text-xs text-slate-500">
            For questions use WhatsApp: <strong>0783601773</strong>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <div
        className={`offcanvas-backdrop ${mobileOpen ? "visible" : ""}`}
        onClick={() => setMobileOpen(false)}
      />
    </>
  );
}
