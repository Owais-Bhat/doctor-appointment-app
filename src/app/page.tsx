import { Landing } from "@/components/landing/Landing";
import { homeJsonLd, jsonLdString } from "@/lib/json-ld";

export const metadata = {
  title: "MedFlow · Book a doctor in person or on video",
  description: "Find a verified doctor, pick a time that suits you, and get reminders on WhatsApp. Video visits from home. Free for patients.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(homeJsonLd()) }} />
      <Landing />
    </>
  );
}
