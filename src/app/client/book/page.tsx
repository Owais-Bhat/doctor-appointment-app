import { Suspense } from "react";
import { BookingFlow } from "./BookingFlow";

export const metadata = { title: "Book a visit · MedFlow" };

export default function BookPage() {
  return (
    <Suspense>
      <BookingFlow />
    </Suspense>
  );
}
