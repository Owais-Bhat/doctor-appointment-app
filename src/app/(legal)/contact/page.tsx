import Link from "next/link";
import type { Metadata } from "next";
import { Mail, Phone, Siren } from "lucide-react";
import { LegalShell, type Section } from "@/components/legal/LegalShell";
import { ContactBlock } from "@/components/legal/ContactBlock";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Contact us · MedFlow",
  description: "How to reach MedFlow for help with visits, payments, refunds or your data.",
};

const sections: Section[] = [
  {
    id: "help",
    title: "Help with a visit or payment",
    body: (
      <>
        <div className="lg-cards">
          {LEGAL.email && (
            <a className="lg-card" href={`mailto:${LEGAL.email}`}>
              <Mail size={18} />
              <b>Email</b>
              <span>{LEGAL.email}</span>
              <span className="tiny">We aim to reply within 2 working days</span>
            </a>
          )}
          {LEGAL.phone && (
            <a className="lg-card" href={`tel:${LEGAL.phone.replace(/[^\d+]/g, "")}`}>
              <Phone size={18} />
              <b>Phone</b>
              <span>{LEGAL.phone}</span>
            </a>
          )}
        </div>
        <p>Include the visit date and the doctor’s name, and write from the email address on your account so we can find your booking quickly.</p>
        <p>
          Most things can be done yourself: cancel or change details in <Link href="/client/appointments">Your visits</Link>, and update your
          information on your <Link href="/client/profile">health profile</Link>.
        </p>
      </>
    ),
  },
  {
    id: "medical",
    title: "Medical questions",
    body: (
      <p className="lg-callout">
        <Siren size={16} /> We can’t give medical advice by email or phone. For questions about your health, book a visit with a doctor. In an
        emergency, call <a href="tel:112">112</a>.
      </p>
    ),
  },
  {
    id: "doctors",
    title: "Doctors and clinics",
    body: <p>Want to offer visits on MedFlow? Email us with your name, specialty, clinic and medical registration number{LEGAL.email ? <> at <a href={`mailto:${LEGAL.email}?subject=Joining%20MedFlow%20as%20a%20doctor`}>{LEGAL.email}</a></> : ""}.</p>,
  },
  {
    id: "official",
    title: "Business details and grievance officer",
    body: (
      <>
        <ContactBlock />
        <p className="tiny">Complaints are acknowledged within 24 hours. Privacy requests are explained in our <Link href="/privacy#rights">privacy policy</Link>.</p>
      </>
    ),
  },
];

export default function ContactPage() {
  return <LegalShell title="Contact us" showUpdated={false} intro={<p>We’re here to help with bookings, payments, refunds and your account.</p>} sections={sections} />;
}
