import Link from "next/link";
import type { Metadata } from "next";
import { LegalShell, type Section } from "@/components/legal/LegalShell";
import { ContactBlock } from "@/components/legal/ContactBlock";
import { LEGAL, RUN_BY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy policy · MedFlow",
  description: "What personal and health data MedFlow collects, why, who it is shared with, and your rights.",
};

const sections: Section[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <>
        <p>
          {RUN_BY} We (“MedFlow”, “we”, “us”) decide why and how your personal data is used on MedFlow, which makes us the
          <em> data fiduciary</em> under India’s Digital Personal Data Protection Act, 2023. Our contact details are at the end of this policy.
        </p>
        <p>
          The doctors you book are independent medical practitioners. What a doctor writes in your medical record during or after a visit is
          also governed by their own professional duties of confidentiality.
        </p>
      </>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <h3>You give us</h3>
        <ul>
          <li><b>Account:</b> name, email address, mobile number and a password (or your Google account, if you sign in with Google).</li>
          <li><b>Health profile:</b> date of birth, gender, city, blood type, blood pressure, weight, height, allergies, ongoing conditions, medicines and an emergency contact — only what you choose to fill in.</li>
          <li><b>Visits:</b> the doctor and time you book, the reason for the visit, and pre-visit details such as how long you’ve had symptoms and how severe they are.</li>
          <li><b>Reviews</b> you write about a visit.</li>
          <li><b>Messages to the MedFlow assistant</b> (the chat bubble), if you use it.</li>
        </ul>
        <h3>Created when you use MedFlow</h3>
        <ul>
          <li><b>Doctor’s notes</b> written by your doctor about your visit, and the visit’s status (confirmed, completed, cancelled).</li>
          <li><b>Payment records:</b> amount, status and the payment and refund reference numbers from our payment provider. We never see or store your full card number, UPI PIN or bank login.</li>
          <li><b>Notifications</b> we send you, and whether you’ve read them.</li>
          <li><b>Security and audit logs:</b> sign-ins and important account actions, with the time they happened.</li>
          <li><b>Device and usage data:</b> browser type and pages used, if usage analytics is switched on for the site.</li>
        </ul>
        <p>We do not record video or audio of your visits.</p>
      </>
    ),
  },
  {
    id: "why",
    title: "Why we use it",
    body: (
      <ul>
        <li>To create your account and keep it secure.</li>
        <li>To book, confirm, remind you about and run your visits, including video visits.</li>
        <li>To give your doctor the details they need to treat you safely, such as allergies and medicines.</li>
        <li>To take payment and issue refunds.</li>
        <li>To send you visit confirmations and reminders in the app and, if you allow it, by SMS or WhatsApp.</li>
        <li>To answer your questions in the MedFlow assistant, when you use it.</li>
        <li>To prevent fraud and misuse, fix problems, and meet our legal obligations.</li>
      </ul>
    ),
  },
  {
    id: "consent",
    title: "Your consent",
    body: (
      <>
        <p>
          We process your health data because you give it to us to book and receive care, and you consent to this when you create an account.
          You can withdraw consent at any time by deleting your account (see <a href="#rights">Your rights</a>). Withdrawing consent doesn’t
          affect what was done before, and some records must be kept for the periods required by law.
        </p>
        <p>
          Text reminders are optional: you can turn them off on your <Link href="/client/profile">health profile</Link>. Reminders inside the app
          stay on because they are part of the service.
        </p>
      </>
    ),
  },
  {
    id: "share",
    title: "Who we share it with",
    body: (
      <>
        <p>We do not sell your personal data, and we do not use your health data for advertising.</p>
        <ul>
          <li><b>The doctor you book</b> sees your name, age, contact details, health profile, the reason for your visit and your pre-visit details.</li>
          <li>
            <b>Service providers who run parts of MedFlow for us</b>, only for that purpose:
            <ul>
              <li>Google Firebase — sign-in, and usage analytics if it is switched on</li>
              <li>Supabase — our database</li>
              <li>Razorpay — payments and refunds</li>
              <li>Daily or Jitsi — the video room for video visits</li>
              <li>Twilio — SMS and WhatsApp reminders, if you have them on</li>
              <li>Google Gemini — the MedFlow assistant. Your chat messages are sent to it, and if you ask the assistant about your health, the health details in your profile are sent too.</li>
            </ul>
          </li>
          <li><b>Authorities</b>, when the law requires it, for example a valid court order.</li>
        </ul>
        <p>
          Some of these providers may store or process data outside India. We only use providers that protect it with contractual and
          technical safeguards, and never in a country the Government of India has restricted.
        </p>
      </>
    ),
  },
  {
    id: "keep",
    title: "How long we keep it",
    body: (
      <ul>
        <li>Your account and health profile: while your account is open.</li>
        <li>Visit records and doctor’s notes: for as long as doctors are required to keep medical records, even if you delete your account.</li>
        <li>Payment records: for as long as tax and accounting laws require.</li>
        <li>Security and audit logs: at least one year.</li>
      </ul>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>You can:</p>
        <ul>
          <li><b>See and correct</b> your details at any time on your <Link href="/client/profile">health profile</Link>.</li>
          <li><b>Ask for a summary</b> of the personal data we hold about you and who we have shared it with.</li>
          <li><b>Ask us to delete</b> your account and data, except records we must keep by law.</li>
          <li><b>Withdraw consent</b> for anything that relies on it.</li>
          <li><b>Nominate someone</b> to act for you if you die or become unable to act.</li>
          <li><b>Complain</b> to our grievance officer, and if you’re not satisfied, to the Data Protection Board of India.</li>
        </ul>
        <p>
          Email {LEGAL.grievanceEmail ? <a href={`mailto:${LEGAL.grievanceEmail}?subject=Privacy%20request`}>{LEGAL.grievanceEmail}</a> : "our grievance officer"} from
          the email address on your account. We aim to reply within 30 days, and always within the time the law allows.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <ul>
        <li>All traffic to MedFlow is encrypted (HTTPS).</li>
        <li>Patient data is only reachable through our server, which checks who you are on every request. Doctors can only see patients who booked with them.</li>
        <li>Each video visit gets its own room, and MedFlow only gives the way in to that visit’s patient and doctor.</li>
        <li>If a breach affects your data, we will tell you and the Data Protection Board of India as the law requires.</li>
      </ul>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and storage",
    body: (
      <p>
        We use one essential cookie to remember which part of MedFlow you’re signed in to, and your browser’s storage to keep you signed in.
        If usage analytics is switched on, Google Analytics for Firebase also stores an identifier to count visits. We don’t use advertising cookies.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        MedFlow accounts are for adults (18 or older). A parent or guardian should book a visit for a child from their own account and attend
        the visit with the child.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: <p>If we make important changes, we’ll tell you in the app or by email before they take effect. The date at the top shows the latest version.</p>,
  },
  {
    id: "contact",
    title: "Contact and grievance officer",
    body: <ContactBlock />,
  },
];

export default function PrivacyPage() {
  return (
    <LegalShell
      title="Privacy policy"
      intro={<p>This policy explains what personal data MedFlow collects — including health data — why we need it, who sees it, and how you stay in control.</p>}
      sections={sections}
    />
  );
}
