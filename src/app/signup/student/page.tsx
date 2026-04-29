import SignupForm from "../SignupForm";

export const metadata = { title: "Student Sign up — Streamflo" };

export default function StudentSignupPage() {
  return (
    <SignupForm
      role="student"
      title="Sign up as a Student"
      tagline="Get study help across CBC grades 1–10, curated notes, and career guidance."
    />
  );
}
