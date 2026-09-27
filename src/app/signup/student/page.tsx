import SignupForm from "../SignupForm";

export const metadata = { title: "Student sign up | Streamflo" };

export default function StudentSignupPage() {
  return (
    <SignupForm
      role="student"
      title="Sign up as a student"
      tagline="Get study help across CBE grades 1 to 10, curated notes, and career guidance."
    />
  );
}
