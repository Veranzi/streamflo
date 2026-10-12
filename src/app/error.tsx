"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="card card-pad w-full max-w-md text-center sm:p-10">
        <Link href="/" className="mx-auto mb-6 inline-flex items-center gap-2">
          <Image src="/Logo.png" width={32} height={32} alt="Streamflo" className="h-8 w-8 object-contain" />
          <span className="font-display text-lg font-bold text-ink">Streamflo</span>
        </Link>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-xl font-bold">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-soft">
          We could not load this page right now. Please try again in a moment.
        </p>
        {error.digest && <p className="mt-2 text-xs text-slate-500">Reference: {error.digest}</p>}
        <div className="mt-7 flex flex-col justify-center gap-2 sm:flex-row">
          <button type="button" onClick={() => reset()} className="btn btn-primary">
            <RotateCcw className="h-4 w-4" /> Try again
          </button>
          <Link href="/" className="btn btn-secondary">
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
