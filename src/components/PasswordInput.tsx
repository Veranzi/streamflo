"use client";

import { useState, InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Password input with show/hide toggle. Drop-in replacement for <input type="password">.
 */
export default function PasswordInput({ className = "", ...rest }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        {...rest}
        type={show ? "text" : "password"}
        className={`pr-11 ${className}`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        title={show ? "Hide password" : "Show password"}
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        {show ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
      </button>
    </div>
  );
}
