import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Assessment generator",
  description: "Create CBE practice quizzes and assessments by grade, subject and topic.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
