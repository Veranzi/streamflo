import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlert, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Streamflo collects, uses and protects personal data under the Kenya Data Protection Act 2019, and how to exercise your rights.",
};

const LAST_UPDATED = "12 October 2026";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "info@streamflo.co.ke";

const SECTIONS = [
  { id: "who-we-are", title: "Who we are" },
  { id: "what-we-collect", title: "What we collect" },
  { id: "why-we-use-it", title: "Why we use it and our lawful basis" },
  { id: "children", title: "Children and learners" },
  { id: "sharing", title: "Who we share data with" },
  { id: "transfers", title: "Storage and transfers outside Kenya" },
  { id: "retention", title: "How long we keep data" },
  { id: "security", title: "How we protect data" },
  { id: "rights", title: "Your rights" },
  { id: "complaints", title: "Complaints" },
  { id: "cookies", title: "Cookies" },
  { id: "changes", title: "Changes to this policy" },
  { id: "contact", title: "Contact us" },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />

      <section className="page-band">
        <div className="container-page py-10 sm:py-12">
          <p className="eyebrow mb-1">Legal</p>
          <h1 className="page-title sm:text-3xl">Privacy Policy</h1>
          <p className="page-subtitle max-w-2xl">
            How Streamflo collects, uses and protects your personal data, and the choices you have.
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
              <h2 id="who-we-are" className="scroll-mt-24">1. Who we are</h2>
              <p>
                Streamflo is a Kenyan school directory and CBE learning platform. Parents use it to find and compare
                schools, schools use it to list their profile and reach families, and parents, students and schools use
                our learning tools (study assistant, notes, quizzes and career guidance). The learning tools are powered by
                our technology partner EduTena.
              </p>
              <p>
                In this policy, &quot;Streamflo&quot;, &quot;we&quot; and &quot;us&quot; mean the operator of the
                Streamflo website. We act as the data controller for the personal data described here, as defined in the
                Kenya Data Protection Act, 2019 (the &quot;Act&quot;).
              </p>

              <h2 id="what-we-collect" className="scroll-mt-24">2. What we collect</h2>
              <ul>
                <li>
                  <strong>Account details:</strong> your name, email address, phone number, password (stored only in
                  hashed form), account type (parent, student or school) and, for learners, grade level.
                  If you sign in with Google we receive your name, email and profile picture from Google.
                </li>
                <li>
                  <strong>School listings:</strong> school name, location, contact person, phone, email, curriculum,
                  fees information, photos, logos, descriptions, events and blog posts submitted by schools.
                </li>
                <li>
                  <strong>Contact messages:</strong> the name, email, phone number and message you send us through
                  the contact form, WhatsApp or email.
                </li>
                <li>
                  <strong>Learning activity:</strong> questions you ask the study assistant and its answers, quiz
                  and assessment results, notes you open and career pathway answers.
                </li>
                <li>
                  <strong>Uploaded files:</strong> homework photos, documents and audio you upload to the study
                  assistant.
                </li>
                <li>
                  <strong>Payment references:</strong> the phone number you pay from, the amount, the plan, and the
                  M-Pesa transaction or confirmation code. We never see or store your M-Pesa PIN.
                </li>
                <li>
                  <strong>Technical data:</strong> basic server logs such as IP address, browser type and the pages
                  requested, used to keep the service secure and working.
                </li>
              </ul>

              <h2 id="why-we-use-it" className="scroll-mt-24">3. Why we use it and our lawful basis</h2>
              <table>
                <thead>
                  <tr><th>Purpose</th><th>Lawful basis under the Act</th></tr>
                </thead>
                <tbody>
                  <tr><td>Creating and running your account and providing the learning tools</td><td>Performance of a contract with you</td></tr>
                  <tr><td>Publishing school listings and showing them to parents</td><td>Performance of a contract with the school, and our legitimate interest in running a public directory</td></tr>
                  <tr><td>Processing subscription payments and keeping financial records</td><td>Performance of a contract, and compliance with legal obligations (tax and accounting)</td></tr>
                  <tr><td>Answering your messages and giving support</td><td>Legitimate interest, or steps you asked us to take before entering a contract</td></tr>
                  <tr><td>Keeping the service secure, preventing fraud and abuse</td><td>Legitimate interest and legal obligation</td></tr>
                  <tr><td>Processing data of learners under 18</td><td>Consent of a parent or guardian (see section 4)</td></tr>
                  <tr><td>Sending optional updates or newsletters</td><td>Your consent, which you can withdraw at any time</td></tr>
                </tbody>
              </table>
              <p>We do not sell your personal data and we do not use it for third party advertising.</p>

              <h2 id="children" className="scroll-mt-24">4. Children and learners</h2>
              <p>
                Many people who use our learning tools are learners under the age of 18. Under the Act, we process a
                child&apos;s personal data only with the consent of a parent or guardian, and only in a way that protects
                and advances the rights and best interests of the child.
              </p>
              <ul>
                <li>Learners under 18 may use the tools only with the consent and supervision of a parent or guardian.
                  A parent or guardian who creates or pays for an account confirms that consent.</li>
                <li>Where a school gives its students access, the school is responsible for obtaining and keeping the
                  required parent or guardian consent for those students.</li>
                <li>We collect only what is needed to provide the learning tools, and we do not use learners&apos; data
                  for marketing.</li>
                <li>A parent or guardian may contact us at any time to see, correct or delete their child&apos;s data.</li>
              </ul>

              <h2 id="sharing" className="scroll-mt-24">5. Who we share data with</h2>
              <p>
                We share personal data only with service providers (data processors) who help us run Streamflo, under
                agreements that require them to protect it and use it only on our instructions:
              </p>
              <ul>
                <li><strong>Hosting providers</strong> that run the website and servers (for example Vercel and Render).</li>
                <li><strong>Database and file storage</strong> provided by Supabase cloud, where account data, listings, learning activity and uploaded files are stored.</li>
                <li><strong>EduTena</strong>, our learning technology partner that operates the study assistant, notes and assessment tools.</li>
                <li><strong>AI model providers</strong> that process the content of your study assistant chats and uploaded files in order to generate answers.</li>
                <li><strong>Safaricom (M-Pesa)</strong>, which processes subscription payments.</li>
                <li><strong>Email providers</strong> used to send account, password reset and notification emails.</li>
                <li><strong>Google</strong>, only if you choose to sign in with your Google account.</li>
              </ul>
              <p>
                School listings are public by design: the details a school submits for its profile are shown to anyone
                visiting the directory once approved. We may also disclose data where required by law, a court order or
                a lawful request from a public authority.
              </p>

              <h2 id="transfers" className="scroll-mt-24">6. Storage and transfers outside Kenya</h2>
              <p>
                Some of our service providers store or process data on servers outside Kenya. When this happens we take
                the steps required by the Act and its regulations, such as choosing providers with appropriate security
                safeguards and contractual protections for your data.
              </p>

              <h2 id="retention" className="scroll-mt-24">7. How long we keep data</h2>
              <ul>
                <li>Account data is kept while your account is active and deleted or anonymised within 90 days after you ask us to close it.</li>
                <li>Study assistant chats and uploaded files are kept while your account is active so you can return to them. You can delete conversations at any time.</li>
                <li>School listings are kept while the school remains listed. A school may ask us to remove its listing.</li>
                <li>Contact messages are kept for up to 2 years.</li>
                <li>Payment records are kept for as long as Kenyan tax and accounting law requires (generally up to 7 years).</li>
              </ul>

              <h2 id="security" className="scroll-mt-24">8. How we protect data</h2>
              <p>
                We use encrypted connections (HTTPS), hashed passwords, access controls that limit staff access to what
                they need, private storage for uploaded homework files, and regular reviews of our systems. No system is
                perfectly secure, so if we become aware of a data breach that is likely to put you at risk we will notify
                the Data Protection Commissioner and affected users as required by the Act.
              </p>

              <h2 id="rights" className="scroll-mt-24">9. Your rights</h2>
              <p>Under the Act you have the right to:</p>
              <ul>
                <li>be informed of how your data is used (this policy);</li>
                <li>access the personal data we hold about you;</li>
                <li>ask us to correct data that is wrong or incomplete;</li>
                <li>ask us to delete data that is false, misleading or no longer needed;</li>
                <li>object to processing of all or part of your data;</li>
                <li>withdraw consent at any time, where we rely on consent; and</li>
                <li>ask for your data in a portable format, where this applies.</li>
              </ul>
              <p>
                To use any of these rights, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or call{" "}
                <a href="tel:0783601773">0783 601 773</a>. We may ask you to confirm your identity first. We aim to respond
                within the time limits set by the Act and its regulations.
              </p>

              <h2 id="complaints" className="scroll-mt-24">10. Complaints</h2>
              <p>
                If you are unhappy with how we have handled your data, please contact us first so we can try to fix it.
                You also have the right to lodge a complaint with the Office of the Data Protection Commissioner (ODPC)
                Kenya through its website,{" "}
                <a href="https://www.odpc.go.ke" target="_blank" rel="noreferrer">www.odpc.go.ke</a>.
              </p>

              <h2 id="cookies" className="scroll-mt-24">11. Cookies</h2>
              <p>
                We use only essential cookies needed to keep you signed in and to protect your session. We do not use
                advertising or tracking cookies, and we do not use third party analytics that follow you across other
                websites. Because these cookies are essential, the site will not work properly if you block them.
              </p>

              <h2 id="changes" className="scroll-mt-24">12. Changes to this policy</h2>
              <p>
                We may update this policy from time to time. We will change the &quot;Last updated&quot; date above and,
                for important changes, let you know by email or a notice on the site.
              </p>

              <h2 id="contact" className="scroll-mt-24">13. Contact us</h2>
              <p>
                Email: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
                <br />
                Phone: <a href="tel:0783601773">0783 601 773</a> or <a href="tel:0771815511">0771 815 511</a>
                <br />
                You can also reach us through our <Link href="/contact">contact page</Link>. See also our{" "}
                <Link href="/terms">Terms of Service</Link>.
              </p>
            </div>

            <div className="mt-10 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-ink-muted">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent-700" />
              <p>We never sell your personal data, and we never ask for your M-Pesa PIN.</p>
            </div>
          </article>
        </div>
      </div>

      <Footer />
      <WhatsAppFab />
    </>
  );
}
