import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Search, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="card card-pad w-full max-w-md text-center sm:p-10">
        <Link href="/" className="mx-auto mb-6 inline-flex items-center gap-2">
          <Image src="/Logo.png" width={32} height={32} alt="Streamflo" className="h-8 w-8 object-contain" />
          <span className="font-display text-lg font-bold text-ink">Streamflo</span>
        </Link>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-700">
          <Compass className="h-7 w-7" />
        </span>
        <p className="mt-5 font-display text-5xl font-bold tracking-[-0.015em] text-primary-700">404</p>
        <h1 className="mt-2 text-xl font-bold">Page not found</h1>
        <p className="mt-2 text-sm text-ink-soft">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <Link href="/" className="btn btn-primary">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
          <Link href="/directory" className="btn btn-secondary">
            <Search className="h-4 w-4" /> Find a school
          </Link>
        </div>
      </div>
    </div>
  );
}
