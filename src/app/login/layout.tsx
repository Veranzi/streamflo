import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Streamflo account to manage your school listing or use the CBE learning tools.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
