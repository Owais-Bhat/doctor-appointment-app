import Link from "next/link";
import type { Metadata } from "next";
import { LegalShell, type Section } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Pricing · MedFlow",
  description: "What it costs to use MedFlow: free for patients, you pay only the doctor's consultation fee.",
};

const sections: Section[] = [
  {
    id: "patients",
    title: "For patients",
    body: (
      <>
        <div className="lg-price">
          <div>
            <span className="mf-label">Account, search and booking</span>
            <b>Free</b>
          </div>
          <div>
            <span className="mf-label">Each visit</span>
            <b>The doctor’s fee</b>
          </div>
        </div>
        <ul>
          <li>Each doctor sets their own consultation fee. It’s shown on their profile and before you confirm a booking.</li>
          <li>The fee shown is the amount you pay. MedFlow doesn’t add a booking or convenience charge.</li>
          <li>You pay only after the doctor confirms your visit, by UPI, card, net banking or wallet. Some clinics also let you pay at the visit.</li>
          <li>Cancel before the visit starts and you get the full amount back. See <Link href="/refunds">cancellations and refunds</Link>.</li>
        </ul>
        <p><Link href="/client/doctors" className="btn btn-primary btn-sm">See doctors and fees</Link></p>
      </>
    ),
  },
  {
    id: "doctors",
    title: "For doctors and clinics",
    body: <p>Listing your practice and taking bookings is currently free. If that changes, we’ll tell you well before any charge applies. <Link href="/contact">Contact us</Link> to join.</p>,
  },
];

export default function PricingPage() {
  return <LegalShell title="Pricing" intro={<p>MedFlow is free to use. You only pay for the consultations you book.</p>} sections={sections} />;
}
