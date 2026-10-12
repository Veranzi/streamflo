import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset the password for your Streamflo account.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
