import { redirect } from "next/navigation";

/**
 * Shareable booking link for one doctor (e.g. on a clinic's website).
 * Booking itself lives in the patient portal, which asks visitors to
 * sign in first and then opens straight on this doctor's open times.
 */
export default async function DoctorBookingLink({ params }: { params: Promise<{ doctorId: string }> }) {
  const { doctorId } = await params;
  redirect(`/client/book?doctor=${encodeURIComponent(doctorId)}`);
}
