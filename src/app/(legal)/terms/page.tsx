import Link from "next/link";
import type { Metadata } from "next";
import { LegalShell, type Section } from "@/components/legal/LegalShell";
import { ContactBlock } from "@/components/legal/ContactBlock";
import { LEGAL, RUN_BY } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of use · MedFlow",
  description: "The rules for using MedFlow to book and attend doctor visits.",
};

const sections: Section[] = [
  {
    id: "agree",
    title: "Agreeing to these terms",
    body: (
      <p>
        {RUN_BY} By creating an account or booking a visit, you agree to these terms and to our{" "}
        <Link href="/privacy">privacy policy</Link> and <Link href="/refunds">cancellation and refund policy</Link>. If you don’t agree, please don’t use MedFlow.
      </p>
    ),
  },
  {
    id: "emergency",
    title: "Not for emergencies",
    body: (
      <p className="lg-callout">
        MedFlow is for planned visits. If you have chest pain, difficulty breathing, severe bleeding, fainting, sudden weakness or any other
        emergency, call <a href="tel:112">112</a> or go to the nearest hospital straight away.
      </p>
    ),
  },
  {
    id: "what",
    title: "What MedFlow does",
    body: (
      <>
        <p>
          MedFlow is a technology platform. It lets you find doctors, book in-person, phone or video visits, pay, and keep your health details in
          one place. MedFlow itself does not give medical advice, diagnose or treat anyone.
        </p>
        <p>
          The doctors on MedFlow are independent registered medical practitioners. Each doctor is responsible for the advice, diagnosis,
          prescriptions and care they give you. We check a doctor’s medical registration before they appear in search, but we can’t
          guarantee the outcome of any treatment.
        </p>
      </>
    ),
  },
  {
    id: "online",
    title: "Video and phone visits",
    body: (
      <ul>
        <li>Online visits follow India’s Telemedicine Practice Guidelines. Your doctor will tell you their name, qualifications and registration number, and may confirm who you are.</li>
        <li>Joining a visit you booked means you consent to being treated online.</li>
        <li>Some problems can’t be handled safely over video or phone. Your doctor may ask you to visit in person, get tests, or go to a hospital.</li>
        <li>Some medicines can’t legally be prescribed online, and a doctor may decide not to prescribe without examining you.</li>
        <li>Use a private place, a working camera and microphone and a stable internet connection. We are not responsible for problems caused by your own device or connection.</li>
      </ul>
    ),
  },
  {
    id: "account",
    title: "Your account",
    body: (
      <ul>
        <li>You must be 18 or older to create an account. A parent or guardian should book for a child from their own account.</li>
        <li>Give accurate details, especially your health information — your doctor relies on it.</li>
        <li>Keep your password private. You’re responsible for what happens in your account, and should tell us straight away if you think someone else has used it.</li>
        <li>One account per person. Don’t book for someone else in your name.</li>
      </ul>
    ),
  },
  {
    id: "booking",
    title: "Booking and paying",
    body: (
      <ul>
        <li>A booking is a request until the doctor confirms it. We’ll let you know when they do.</li>
        <li>Each doctor sets their own consultation fee, shown before you book. See <Link href="/pricing">pricing</Link>.</li>
        <li>Where online payment is available, you pay after the doctor confirms. Payments are processed by Razorpay; their terms also apply.</li>
        <li>You can cancel a visit until it starts. Refunds follow our <Link href="/refunds">cancellation and refund policy</Link>.</li>
      </ul>
    ),
  },
  {
    id: "assistant",
    title: "The MedFlow assistant",
    body: (
      <p>
        The chat assistant is an AI tool that helps you find doctors and book visits. It can be wrong, and it is not a doctor. Don’t rely on it
        for medical decisions, and always follow the advice of the doctor treating you.
      </p>
    ),
  },
  {
    id: "doctors",
    title: "If you are a doctor on MedFlow",
    body: (
      <ul>
        <li>You must hold a valid registration with a State Medical Council or the National Medical Commission and keep it up to date on your profile.</li>
        <li>You must follow the Telemedicine Practice Guidelines, professional conduct rules and the law when consulting through MedFlow.</li>
        <li>You are responsible for your medical decisions, your fees and keeping patient information confidential.</li>
        <li>Keep your availability current, and confirm or decline requests promptly. Cancelling a paid visit refunds the patient in full.</li>
      </ul>
    ),
  },
  {
    id: "conduct",
    title: "Using MedFlow fairly",
    body: (
      <>
        <p>Please don’t:</p>
        <ul>
          <li>give false information, pretend to be someone else, or book visits you don’t intend to attend;</li>
          <li>harass, threaten or abuse doctors, patients or our team;</li>
          <li>post fake or misleading reviews;</li>
          <li>try to access data or parts of MedFlow that aren’t yours, or disrupt or overload the service;</li>
          <li>copy, resell or scrape MedFlow or its content.</li>
        </ul>
        <p>We may remove content, or suspend or close accounts, that break these rules.</p>
      </>
    ),
  },
  {
    id: "reviews",
    title: "Reviews",
    body: <p>Reviews should be honest and about your own visit. We may remove reviews that are abusive, share someone’s private information, or are clearly not genuine.</p>,
  },
  {
    id: "liability",
    title: "Our responsibility",
    body: (
      <>
        <p>
          We work to keep MedFlow available and accurate, but we can’t promise it will always be uninterrupted or error-free. We are not
          responsible for the medical advice or treatment given by doctors, or for losses caused by things outside our reasonable control.
        </p>
        <p>
          As far as the law allows, our total responsibility to you for any claim about MedFlow is limited to the amount you paid through
          MedFlow for the visit concerned. Nothing in these terms limits rights you have under consumer protection law that can’t be limited.
        </p>
      </>
    ),
  },
  {
    id: "ending",
    title: "Closing your account",
    body: <p>You can ask us to close your account at any time. We may suspend or close accounts that break these terms or the law. Records we must keep by law are kept as explained in the <Link href="/privacy#keep">privacy policy</Link>.</p>,
  },
  {
    id: "law",
    title: "Law and disputes",
    body: (
      <p>
        These terms are governed by the laws of India.
        {LEGAL.jurisdiction ? ` Courts in ${LEGAL.jurisdiction} have jurisdiction over any dispute.` : ""} Please contact us first — most problems
        can be fixed quickly.
      </p>
    ),
  },
  {
    id: "grievance",
    title: "Complaints",
    body: (
      <>
        <p>
          If you have a complaint about MedFlow, content on it, or how your data is used, contact our grievance officer. We acknowledge
          complaints within 24 hours and aim to resolve them within 15 days.
        </p>
        <ContactBlock />
      </>
    ),
  },
  {
    id: "changes",
    title: "Changes",
    body: <p>We may update these terms. If a change is important, we’ll tell you before it takes effect. Using MedFlow after that means you accept the new terms.</p>,
  },
];

export default function TermsPage() {
  return <LegalShell title="Terms of use" intro={<p>Please read these terms before booking. They explain what MedFlow is, what doctors are responsible for, and what we expect from everyone who uses it.</p>} sections={sections} />;
}
