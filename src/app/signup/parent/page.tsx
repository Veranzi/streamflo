import SignupForm from "../SignupForm";

export const metadata = { title: "Parent Sign up — Streamflo" };

export default function ParentSignupPage() {
  return (
    <SignupForm
      role="parent"
      title="Sign up as a Parent"
      tagline="Help your children learn with CBC-focused AI tutoring and career guidance."
    />
  );
}
