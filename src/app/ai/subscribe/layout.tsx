import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Learning tool plans",
  description: "Monthly Streamflo learning tool plans for families, students and schools. Pay with M-Pesa and cancel anytime.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
