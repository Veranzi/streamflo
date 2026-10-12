import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms for using Streamflo, including accounts, school listings, learning tool subscriptions paid by M-Pesa and AI study aids.",
};

const LAST_UPDATED = "12 October 2026";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "info@streamflo.co.ke";

const SECTIONS = [
  { id: "about", title: "About these terms" },
  { id: "accounts", title: "Your account" },
  { id: "acceptable-use", title: "Acceptable use" },
  { id: "listings", title: "School listings" },
  { id: "subscriptions", title: "Subscriptions and payments" },
  { id: "ai", title: "AI study tools" },
  { id: "content", title: "Your content" },
  { id: "ip", title: "Intellectual property" },
  { id: "liability", title: "Limits of our liability" },
  { id: "termination", title: "Suspension and closing accounts" },
  { id: "changes", title: "Changes to these terms" },
  { id: "law", title: "Governing law" },
  { id: "contact", title: "Contact us" },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />

      <section className="page-band">
        <div className="container-page py-10 sm:py-12">
          <p className="eyebrow mb-1">Legal</p>
          <h1 className="page-title sm:text-3xl">Terms of Service</h1>
          <p className="page-subtitle max-w-2xl">
            The rules for using Streamflo&apos;s school directory and learning tools.
          </p>
          <p className="mt-3 text-sm text-slate-600">Last updated: {LAST_UPDATED}</p>
        </div>
      </section>

      <div className="container-page py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[15rem_1fr]">
          <aside className="hidden lg:block">
            <nav aria-label="On this page" className="sticky top-24">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">On this page</p>
              <ol className="mt-3 space-y-2 text-sm">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-ink-muted hover:text-primary-700">{s.title}</a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="min-w-0 max-w-3xl">
            <div className="alert alert-warning mb-8" role="note">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>Draft for review.</strong> Please have this checked by a qualified advocate before relying on it.
              </span>
            </div>

            <div className="prose-content text-[15px] leading-relaxed text-slate-700">
              <h2 id="about" className="scroll-mt-24">1. About these terms</h2>
              <p>
                These terms apply when you use the Streamflo website, including the school directory and the CBE
                learning tools (study assistant, notes, assessments and career guidance) powered by our partner EduTena.
                By creating an account or using the site you agree to these terms and to our{" "}
                <Link href="/privacy">Privacy Policy</Link>. If you do not agree, please do not use Streamflo.
              </p>

              <h2 id="accounts" className="scroll-mt-24">2. Your account</h2>
              <ul>
                <li>Give accurate details when you register and keep them up to date.</li>
                <li>Keep your password private. You are responsible for activity on your account.</li>
                <li>Learners under 18 may use Streamflo only with the consent and supervision of a parent or guardian.
                  Schools that give students access are responsible for getting that consent.</li>
                <li>Tell us straight away at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> if you think someone
                  else is using your account.</li>
              </ul>

              <h2 id="acceptable-use" className="scroll-mt-24">3. Acceptable use</h2>
              <p>When using Streamflo you must not:</p>
              <ul>
                <li>break any Kenyan law or anyone else&apos;s rights;</li>
                <li>post false, misleading, defamatory, hateful, sexual or violent content;</li>
                <li>harass, bully or exploit anyone, especially children;</li>
                <li>upload viruses or try to break into, overload or copy the site or its data;</li>
                <li>use the learning tools to cheat in national examinations or official assessments;</li>
                <li>share your paid account with people outside your plan, or resell access; or</li>
                <li>pretend to be another person, school or organisation.</li>
              </ul>

              <h2 id="listings" className="scroll-mt-24">4. School listings</h2>
              <ul>
                <li>Only an authorised representative of a school may register or manage its listing.</li>
                <li>We review and verify listings before publishing them, and we may edit, decline or remove a listing
                  that is inaccurate or breaks these terms.</li>
                <li>Schools are responsible for the accuracy of their details, including fees, curriculum, contacts,
                  photos and posts, and for having the right to publish any photos of people shown.</li>
                <li>Information in the directory is provided to help parents. Parents should confirm important details
                  such as fees, admission and registration status directly with the school.</li>
                <li>Paid listing packages are described on the registration page at the time you sign up.</li>
              </ul>

              <h2 id="subscriptions" className="scroll-mt-24">5. Subscriptions and payments</h2>
              <ul>
                <li>Learning tool plans are billed monthly at the price shown on the{" "}
                  <Link href="/ai/subscribe">plans page</Link> when you subscribe.</li>
                <li>Payment is made by M-Pesa. Your plan is activated once we receive confirmation of payment from
                  M-Pesa, or once our team verifies a manual payment code.</li>
                <li>Each plan runs for the paid period. It does not renew automatically unless you pay for the next
                  period.</li>
                <li>You can cancel at any time. Your plan stays active until the end of the period you have paid for.</li>
                <li>We do not give refunds for partial months, unless the law requires it or we were unable to provide
                  the service you paid for.</li>
                <li>If you were charged but your plan did not activate, contact us on{" "}
                  <a href="tel:0783601773">0783 601 773</a> with your M-Pesa confirmation code and we will fix it.</li>
                <li>We may change prices for future periods. We will show the new price before you pay.</li>
              </ul>

              <h2 id="ai" className="scroll-mt-24">6. AI study tools</h2>
              <p>
                The study assistant, assessment generator and career pathway tools use artificial intelligence. They are
                a study aid, not a replacement for teachers, parents or professional advice.
              </p>
              <ul>
                <li>AI answers can contain mistakes or be incomplete. Always check important answers with a teacher,
                  textbook or official KICD material.</li>
                <li>Career pathway suggestions are guidance only and do not guarantee placement in any pathway, school
                  or course.</li>
                <li>Do not share sensitive personal information (such as medical details or ID numbers) in chats.</li>
                <li>Chat content and uploaded files are processed by our AI providers to generate answers, as explained
                  in our <Link href="/privacy">Privacy Policy</Link>.</li>
              </ul>

              <h2 id="content" className="scroll-mt-24">7. Your content</h2>
              <p>
                You keep ownership of content you submit, such as school descriptions, photos, posts, questions and
                uploaded homework. You give us permission to store, display and process that content as needed to run
                Streamflo (for example showing a school listing in the directory or sending a homework photo to the
                study assistant). You confirm that you have the right to share it.
              </p>

              <h2 id="ip" className="scroll-mt-24">8. Intellectual property</h2>
              <p>
                The Streamflo name, logo, website design, notes, guides and other materials we provide belong to
                Streamflo, EduTena or their licensors. You may use them for your own personal learning or your
                school&apos;s internal teaching. You may not copy, sell or republish them without our written permission.
              </p>

              <h2 id="liability" className="scroll-mt-24">9. Limits of our liability</h2>
              <ul>
                <li>We work hard to keep Streamflo available and accurate, but the service is provided &quot;as is&quot;
                  and we cannot promise it will always be error free or uninterrupted.</li>
                <li>We are not responsible for decisions made using school listings or AI answers, or for the actions
                  of schools listed in the directory.</li>
                <li>To the extent the law allows, our total liability to you for any claim is limited to the amount you
                  paid us in the three months before the claim arose.</li>
                <li>Nothing in these terms limits any rights you have under the Consumer Protection Act, 2012 or other
                  Kenyan law that cannot be excluded.</li>
              </ul>

              <h2 id="termination" className="scroll-mt-24">10. Suspension and closing accounts</h2>
              <p>
                You may close your account at any time by contacting us. We may suspend or close an account that breaks
                these terms, puts other users at risk or is used for fraud. Where reasonable we will tell you why first.
              </p>

              <h2 id="changes" className="scroll-mt-24">11. Changes to these terms</h2>
              <p>
                We may update these terms from time to time. We will change the &quot;Last updated&quot; date above and,
                for important changes, let you know by email or a notice on the site. Continuing to use Streamflo after
                a change means you accept the updated terms.
              </p>

              <h2 id="law" className="scroll-mt-24">12. Governing law</h2>
              <p>
                These terms are governed by the laws of Kenya. Any dispute will first be discussed in good faith, and if
                it cannot be resolved it will be handled by the courts of Kenya.
              </p>

              <h2 id="contact" className="scroll-mt-24">13. Contact us</h2>
              <p>
                Email: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                <br />
                Phone: <a href="tel:0783601773">0783 601 773</a> or <a href="tel:0771815511">0771 815 511</a>
                <br />
                Or use our <Link href="/contact">contact page</Link>.
              </p>
            </div>
          </article>
        </div>
      </div>

      <Footer />
      <WhatsAppFab />
    </>
  );
}
