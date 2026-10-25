import Link from "next/link";
import type { Metadata } from "next";
import { LegalShell, type Section } from "@/components/legal/LegalShell";

export const metadata: Metadata = {
  title: "Service delivery · MedFlow",
  description: "How MedFlow visits are delivered. MedFlow does not ship physical goods.",
};

const sections: Section[] = [
  {
    id: "nothing-shipped",
    title: "Nothing is shipped",
    body: <p>MedFlow sells doctor consultations, not physical products. Nothing is posted or couriered to you, and there are no shipping charges.</p>,
  },
  {
    id: "how",
    title: "How your visit is delivered",
    body: (
      <ul>
        <li><b>Confirmation:</b> after you book, the doctor confirms the request. You get a notification in the app (and by SMS or WhatsApp if you have reminders on).</li>
        <li><b>Video visits:</b> open the visit in <Link href="/client/appointments">Your visits</Link>. The video room opens 15 minutes before the start time, inside MedFlow — there’s nothing to install.</li>
        <li><b>Phone visits:</b> the doctor calls the mobile number on your profile at the booked time.</li>
        <li><b>In-person visits:</b> go to the clinic address shown on the doctor’s profile at the booked time.</li>
        <li><b>Reminders:</b> about 24 hours and 1 hour before each confirmed visit.</li>
      </ul>
    ),
  },
  {
    id: "prescriptions",
    title: "Prescriptions and notes",
    body: <p>Any advice or notes your doctor adds after the visit appear on the visit in your account. Medicines are bought by you from a pharmacy of your choice; MedFlow doesn’t sell or deliver medicines.</p>,
  },
  {
    id: "delays",
    title: "If a visit can’t happen",
    body: <p>If the doctor can’t make it, they’ll cancel and you get a full refund automatically. See <Link href="/refunds">cancellations and refunds</Link>.</p>,
  },
];

export default function ShippingPage() {
  return <LegalShell title="Service delivery" intro={<p>How and when you receive the service you book on MedFlow.</p>} sections={sections} />;
}
