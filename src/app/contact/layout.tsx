import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with Streamflo about school listings, learning tool plans or support. Call 0783 601 773 or email info@streamflo.co.ke.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
