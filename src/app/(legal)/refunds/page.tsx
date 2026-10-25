import Link from "next/link";
import type { Metadata } from "next";
import { LegalShell, type Section } from "@/components/legal/LegalShell";
import { ContactBlock } from "@/components/legal/ContactBlock";

export const metadata: Metadata = {
  title: "Cancellations and refunds · MedFlow",
  description: "When you can cancel a MedFlow visit and how refunds work.",
};

const sections: Section[] = [
  {
    id: "summary",
    title: "In short",
    body: (
      <div className="lg-table-wrap">
        <table className="lg-table">
          <thead>
            <tr><th scope="col">What happened</th><th scope="col">Refund</th></tr>
          </thead>
          <tbody>
            <tr><td>You cancel before the visit starts</td><td><b>Full refund</b>, started automatically</td></tr>
            <tr><td>The doctor declines or cancels</td><td><b>Full refund</b>, started automatically</td></tr>
            <tr><td>The doctor doesn’t join, or the visit can’t happen because of a problem on our side</td><td><b>Full refund</b> or a free new visit — contact us within 7 days</td></tr>
            <tr><td>You don’t join or turn up</td><td>No refund</td></tr>
            <tr><td>The visit took place</td><td>No refund, unless something went wrong — contact us</td></tr>
          </tbody>
        </table>
      </div>
    ),
  },
  {
    id: "cancel",
    title: "How to cancel",
    body: (
      <p>
        Open <Link href="/client/appointments">Your visits</Link>, choose the visit and tap <b>Cancel visit</b>. You can cancel any time until the
        visit’s start time. The doctor is told straight away and the time is freed for someone else.
      </p>
    ),
  },
  {
    id: "when",
    title: "When the money reaches you",
    body: (
      <ul>
        <li>Refunds go back to the same card, UPI account, bank account or wallet you paid with. We can’t refund to a different account.</li>
        <li>We start the refund as soon as the visit is cancelled. Your bank usually shows it within 5–7 working days.</li>
        <li>You’ll see “Refund in progress” and then “Refunded” on the visit, and get a notification.</li>
        <li>MedFlow does not charge any cancellation fee.</li>
      </ul>
    ),
  },
  {
    id: "clinic",
    title: "If you paid at the clinic",
    body: <p>Payments made directly to a clinic or doctor aren’t handled by MedFlow. Please ask the clinic about refunds. We’re happy to help if you can’t reach them.</p>,
  },
  {
    id: "problem",
    title: "Something went wrong?",
    body: (
      <>
        <p>
          If a refund hasn’t arrived after 7 working days, or you think you should get one for another reason, contact us with the date of the
          visit and the doctor’s name. We aim to reply within 2 working days.
        </p>
        <ContactBlock grievance={false} />
      </>
    ),
  },
];

export default function RefundsPage() {
  return <LegalShell title="Cancellations and refunds" intro={<p>You pay only after the doctor confirms your visit, and you can cancel for a full refund until it starts.</p>} sections={sections} />;
}
