import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career pathway predictor",
  description: "Explore CBE senior school pathways and careers that match a learner's interests and strengths.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
