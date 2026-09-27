import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, CreditCard } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="container-page grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <Image src="/Logo.png" width={40} height={40} alt="Streamflo" className="h-10 w-10 rounded-lg bg-white/95 object-contain p-1" />
            <span className="font-display text-lg font-bold text-white">Streamflo</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            Kenya&apos;s school directory and CBE learning platform. Parents find the right school,
            learners study smarter, and schools reach more families.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/directory" className="hover:text-white">Find a school</Link></li>
            <li><Link href="/ai" className="hover:text-white">Learning tools</Link></li>
            <li><Link href="/ai/notes" className="hover:text-white">CBE notes</Link></li>
            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">For schools</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/register" className="hover:text-white">Register your school</Link></li>
            <li><Link href="/register?package=premium" className="hover:text-white">Premium listing</Link></li>
            <li><Link href="/ai/subscribe" className="hover:text-white">School AI plans</Link></li>
            <li><Link href="/contact" className="hover:text-white">Talk to sales</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-white">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <span className="flex flex-col gap-1">
                <a href="tel:0783601773" className="hover:text-white">0783 601 773</a>
                <a href="tel:0771815511" className="hover:text-white">0771 815 511</a>
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <span className="break-all">info@streamflo.co.ke</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
              <span>
                Paybill 802200
                <span className="block text-xs text-slate-500">Account 0022020006871</span>
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-slate-500 sm:flex-row">
          <p>&copy; {year} Streamflo. All rights reserved.</p>
          <p>Learning tools powered by EduTena</p>
        </div>
      </div>
    </footer>
  );
}
