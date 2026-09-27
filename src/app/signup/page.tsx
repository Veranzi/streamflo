import Link from "next/link";
import AuthShell, { AuthHeading, AccountTypeCards } from "@/components/AuthShell";

export const metadata = {
  title: "Sign up | Streamflo",
  description: "Create a free Streamflo account. Parents, students, and schools all welcome.",
};

export default function SignupChoicePage() {
  return (
    <AuthShell
      statement="One free account for schools and learning."
      description="Unlock the school directory and EduTena's AI learning tools: the study chatbot, career pathway predictor and CBE notes library."
    >
      <AuthHeading
        title="Create your account"
        subtitle="Choose the account type that fits you best."
      />

      <AccountTypeCards />

      <p className="mt-8 text-center text-sm text-ink-soft">
        Already have an account? <Link href="/login" className="link">Sign in</Link>
      </p>
    </AuthShell>
  );
}
