import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CBE study assistant",
  description: "Ask questions and get step by step help with CBE topics from the Streamflo study assistant.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
