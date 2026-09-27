import SignupForm from "../SignupForm";

export const metadata = { title: "Parent sign up | Streamflo" };

export default function ParentSignupPage() {
  return (
    <SignupForm
      role="parent"
      title="Sign up as a parent"
      tagline="Help your children learn with CBE focused AI tutoring and career guidance."
    />
  );
}
