import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CBE notes library",
  description: "Free CBE study notes for Kenyan learners, organised by grade and subject.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
