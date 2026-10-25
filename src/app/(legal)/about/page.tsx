import Link from "next/link";
import type { Metadata } from "next";
import { LegalShell, type Section } from "@/components/legal/LegalShell";
import { RUN_BY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "About us · MedFlow",
  description: "MedFlow helps people find verified doctors and book in-person, phone and video visits.",
};

const sections: Section[] = [
  {
    id: "what",
    title: "What we do",
    body: (
      <>
        <p>
          MedFlow makes it simple to see a doctor. Find a verified doctor by specialty or language, see their fee and open times, and book an
          in-person, phone or video visit in under a minute. Doctors confirm quickly, reminders arrive on time, and video visits run right in the
          browser.
        </p>
        <p>
          For doctors and clinics, MedFlow handles the busywork: booking requests, a weekly schedule, reminders, online payments and video
          visits, with the patient’s details ready before each visit.
        </p>
      </>
    ),
  },
  {
    id: "trust",
    title: "How we keep it safe",
    body: (
      <ul>
        <li>Every doctor’s medical registration is checked before they appear in search.</li>
        <li>Your health details are seen only by you and the doctors you book.</li>
        <li>Payments go through Razorpay, and cancelling before a visit gives a full refund.</li>
      </ul>
    ),
  },
  {
    id: "who",
    title: "Who we are",
    body: <p>{RUN_BY} Questions, ideas or want to join as a doctor? <Link href="/contact">Get in touch</Link>.</p>,
  },
];

export default function AboutPage() {
  return <LegalShell title="About MedFlow" showUpdated={false} intro={<p>Good care starts with seeing the right doctor at the right time.</p>} sections={sections} />;
}
