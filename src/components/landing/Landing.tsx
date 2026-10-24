"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion, useScroll, useMotionValueEvent, type Variants } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CalendarCheck,
  CalendarClock,
  Camera,
  ClipboardList,
  Menu,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  Stethoscope,
  Users,
  Video,
  X,
} from "lucide-react";
import { BookingDemo } from "./BookingDemo";
import { DoctorDemo, ReminderDemo, VideoDemo } from "./Demos";
import { doctorName, formatFee, initials, nameHue } from "@/lib/format";

type Doctor = {
  id: string;
  specialty: string;
  experience_years: number | null;
  consultation_fee: number;
  rating: number;
  total_reviews: number;
  clinic_name: string | null;
  profiles: { full_name: string } | null;
};

const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
const DOCTOR_CTA = CONTACT ? `mailto:${CONTACT}?subject=Joining%20MedFlow%20as%20a%20doctor` : "/auth/register";

const FALLBACK_SPECIALTIES = [
  "General Medicine", "Cardiology", "Dermatology", "Pediatrics", "Gynecology", "Orthopedics",
  "Neurology", "ENT", "Ophthalmology", "Psychiatry", "Gastroenterology", "Dentistry",
];

const rise: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] } },
};
const stagger: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };

function Reveal({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "ul" }) {
  const C = motion[as];
  return (
    <C className={className} variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
      {children}
    </C>
  );
}

function Logo() {
  return (
    <Link href="/" className="logo lp-logo" aria-label="MedFlow home">
      <span className="mark">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12h3l2-5 4 10 2-5h5" />
        </svg>
      </span>
      <span>Med<span style={{ color: "var(--accent)" }}>Flow</span></span>
    </Link>
  );
}

const NAV = [
  ["How it works", "#how"],
  ["Video visits", "#video"],
  ["For doctors", "#doctors"],
  ["FAQ", "#faq"],
];

function Nav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 12));

  return (
    <header className={`lp-nav ${scrolled ? "scrolled" : ""}`}>
      <div className="lp-wrap lp-nav-in">
        <Logo />
        <nav className="lp-links" aria-label="Sections">
          {NAV.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
        </nav>
        <div className="lp-nav-cta">
          <Link href="/auth/login" className="lp-signin">Sign in</Link>
          <Link href="/client/book" className="btn btn-primary btn-sm">Book a visit</Link>
          <button type="button" className="lp-menu" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            className="lp-sheet"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            aria-label="Menu"
          >
            {NAV.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
            <Link href="/auth/login" onClick={() => setOpen(false)}>Sign in</Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

const HOW = [
  { icon: Stethoscope, title: "Choose a verified doctor", body: "Search by specialty, language or clinic. Every doctor is checked by MedFlow before they appear." },
  { icon: CalendarCheck, title: "Pick a time that suits you", body: "See real open times for the next two weeks. Video, phone or in-person, your choice." },
  { icon: BellRing, title: "Get confirmed and reminded", body: "The doctor confirms, you’re notified, and reminders arrive a day and an hour before." },
];

const FAQ = [
  ["Is MedFlow free for patients?", "Yes. Creating an account and booking are free. You pay the doctor’s consultation fee, which is shown before you book."],
  ["How do video visits work?", "At visit time, open the visit in MedFlow and press Join. You can test your camera and microphone first. The room opens 15 minutes before and is private to you and your doctor."],
  ["How are doctors verified?", "Doctors can’t be found or booked until the MedFlow team verifies their account. Patients rate every completed visit."],
  ["Will I get reminders?", "Yes, in the app and, if you add your phone number, by SMS or WhatsApp, a day and an hour before each confirmed visit. You can turn texts off any time."],
  ["Can I cancel a booking?", "Yes, from your visits list, until the visit is completed. Your doctor is told straight away so the slot opens for someone else."],
  ["I’m a doctor. How do I join?", CONTACT ? `Write to ${CONTACT}. Once we verify your registration, you set your weekly hours and start receiving bookings.` : "Create an account, then contact the MedFlow team. Once we verify your registration, you set your weekly hours and start receiving bookings."],
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="lp-faq-item">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          {open ? <Minus size={18} /> : <Plus size={18} />}
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} style={{ overflow: "hidden" }}>
            <p>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function Landing() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  useEffect(() => {
    fetch("/api/doctors")
      .then((r) => r.json())
      .then((d) => setDoctors(Array.isArray(d.doctors) ? d.doctors : []))
      .catch(() => {});
  }, []);

  const specialties = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of doctors) counts.set(d.specialty, (counts.get(d.specialty) ?? 0) + 1);
    const live = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, n]) => ({ name, n }));
    return live.length >= 4 ? live : FALLBACK_SPECIALTIES.map((name) => ({ name, n: 0 }));
  }, [doctors]);
  const featured = [...doctors].sort((a, b) => b.rating * Math.log(b.total_reviews + 2) - a.rating * Math.log(a.total_reviews + 2)).slice(0, 6);

  return (
    <MotionConfig reducedMotion="user">
      <div className="lp">
        <Nav />

        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-hero-glow" aria-hidden="true" />
          <div className="lp-wrap lp-hero-grid">
            <motion.div className="lp-hero-copy" variants={stagger} initial="hidden" animate="show">
              <motion.p variants={rise} className="lp-kicker">
                <span className="lp-pulse" aria-hidden="true" />{" "}
                {doctors.length > 0 ? `${doctors.length} verified ${doctors.length === 1 ? "doctor" : "doctors"} taking bookings` : "Book doctors online"}
              </motion.p>
              <motion.h1 variants={rise} className="lp-h1">See a doctor today, in person or on video.</motion.h1>
              <motion.p variants={rise} className="lp-lead">
                Find a verified specialist, pick a time that suits you, and get reminders on WhatsApp. Free for patients.
              </motion.p>
              <motion.div variants={rise} className="lp-cta-row">
                <Link href="/client/book" className="btn btn-primary btn-lg">
                  Book a visit <ArrowRight size={17} />
                </Link>
                <a href="#doctors" className="btn btn-ghost btn-lg">I’m a doctor</a>
              </motion.div>
              <motion.ul variants={rise} className="lp-trust">
                <li><BadgeCheck size={16} /> Verified doctors only</li>
                <li><ShieldCheck size={16} /> Private video rooms</li>
                <li><BellRing size={16} /> Reminders 24 h and 1 h before</li>
              </motion.ul>
            </motion.div>
            <motion.div
              className="lp-hero-demo"
              initial={{ opacity: 0, y: 40, rotate: 2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <BookingDemo />
            </motion.div>
          </div>
        </section>

        {/* Specialties marquee */}
        <section className="lp-marquee" aria-label="Specialties">
          <div className="lp-marquee-track">
            {[...specialties, ...specialties].map((s, i) => (
              <Link key={`${s.name}-${i}`} href="/client/book" className="lp-spec" tabIndex={i >= specialties.length ? -1 : 0} aria-hidden={i >= specialties.length}>
                {s.name}
                {s.n > 0 && <span>{s.n} {s.n === 1 ? "doctor" : "doctors"}</span>}
              </Link>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="lp-section">
          <div className="lp-wrap">
            <Reveal className="lp-head">
              <motion.h2 variants={rise} className="lp-h2">Booking takes about a minute</motion.h2>
              <motion.p variants={rise} className="lp-sub">No phone queues, no guessing who’s free.</motion.p>
            </Reveal>
            <Reveal as="ul" className="lp-steps">
              {HOW.map(({ icon: Icon, title, body }, i) => (
                <motion.li key={title} variants={rise} className="lp-step" whileHover={{ y: -4 }}>
                  <span className="lp-step-n">{i + 1}</span>
                  <span className="lp-step-icon"><Icon size={22} /></span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </motion.li>
              ))}
            </Reveal>
          </div>
        </section>

        {/* Video visits */}
        <section id="video" className="lp-section lp-dark">
          <div className="lp-wrap lp-split">
            <Reveal className="lp-split-copy">
              <motion.p variants={rise} className="lp-kicker light"><Video size={15} /> Video visits</motion.p>
              <motion.h2 variants={rise} className="lp-h2">Your doctor, on your screen</motion.h2>
              <motion.p variants={rise} className="lp-sub">Join from your phone or laptop. No app to install.</motion.p>
              <motion.ul variants={stagger} className="lp-feats">
                {[
                  [Camera, "Check your camera and microphone before you join"],
                  [CalendarClock, "The room opens 15 minutes before your visit"],
                  [ShieldCheck, "A private room for each visit: only you and your doctor"],
                  [ClipboardList, "Your doctor writes notes during the call"],
                ].map(([Icon, text]) => {
                  const I = Icon as typeof Camera;
                  return (
                    <motion.li key={text as string} variants={rise}><I size={18} /> {text as string}</motion.li>
                  );
                })}
              </motion.ul>
            </Reveal>
            <motion.div initial={{ opacity: 0, scale: 0.94 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}>
              <VideoDemo />
            </motion.div>
          </div>
        </section>

        {/* Reminders */}
        <section className="lp-section">
          <div className="lp-wrap lp-split reverse">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7 }}>
              <ReminderDemo />
            </motion.div>
            <Reveal className="lp-split-copy">
              <motion.p variants={rise} className="lp-kicker"><BellRing size={15} /> Reminders</motion.p>
              <motion.h2 variants={rise} className="lp-h2">Never miss a visit</motion.h2>
              <motion.p variants={rise} className="lp-sub">
                Confirmations and reminders arrive on WhatsApp or SMS, a day before and an hour before. Video visits include the link to join.
              </motion.p>
            </Reveal>
          </div>
        </section>

        {/* Live doctors */}
        {featured.length > 0 && (
          <section className="lp-section lp-tint">
            <div className="lp-wrap">
              <Reveal className="lp-head">
                <motion.h2 variants={rise} className="lp-h2">Doctors on MedFlow</motion.h2>
                <motion.p variants={rise} className="lp-sub">Verified and taking bookings now.</motion.p>
              </Reveal>
              <Reveal as="ul" className="lp-docs">
                {featured.map((d) => {
                  const name = doctorName(d.profiles?.full_name);
                  return (
                    <motion.li key={d.id} variants={rise} whileHover={{ y: -6 }} className="lp-doc">
                      <Link href={`/client/doctors/${d.id}`}>
                        <span className="lp-doc-avatar" style={{ background: `linear-gradient(135deg, hsl(${nameHue(name)} 60% 62%), hsl(${(nameHue(name) + 40) % 360} 55% 40%))` }}>
                          {initials(name)}
                        </span>
                        <b>{name}</b>
                        <span>{d.specialty}{d.experience_years ? ` · ${d.experience_years} yrs` : ""}</span>
                        <span className="lp-doc-meta">
                          {d.total_reviews > 0 ? <><Star size={13} fill="currentColor" strokeWidth={0} /> {Number(d.rating).toFixed(1)} ({d.total_reviews})</> : "New"}
                          <em>{formatFee(d.consultation_fee)}</em>
                        </span>
                      </Link>
                    </motion.li>
                  );
                })}
              </Reveal>
              <div className="lp-center">
                <Link href="/client/doctors" className="btn btn-ghost">See all doctors <ArrowRight size={16} /></Link>
              </div>
            </div>
          </section>
        )}

        {/* For doctors */}
        <section id="doctors" className="lp-section">
          <div className="lp-wrap lp-split">
            <Reveal className="lp-split-copy">
              <motion.p variants={rise} className="lp-kicker"><Users size={15} /> For doctors and clinics</motion.p>
              <motion.h2 variants={rise} className="lp-h2">Fill your schedule, not your phone line</motion.h2>
              <motion.ul variants={stagger} className="lp-feats dark-ink">
                {[
                  "Set weekly hours and days off; patients only see open times",
                  "Confirm or decline requests in one tap; patients are told instantly",
                  "Run video visits with notes beside the call",
                  "Reminders cut no-shows without you lifting a finger",
                ].map((t) => (
                  <motion.li key={t} variants={rise}><CalendarCheck size={18} /> {t}</motion.li>
                ))}
              </motion.ul>
              <motion.div variants={rise} className="lp-cta-row">
                <a href={DOCTOR_CTA} className="btn btn-primary btn-lg">Join as a doctor <ArrowRight size={17} /></a>
              </motion.div>
            </Reveal>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7 }}>
              <DoctorDemo />
            </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="lp-section lp-tint">
          <div className="lp-wrap lp-faq-wrap">
            <Reveal className="lp-head">
              <motion.h2 variants={rise} className="lp-h2">Questions</motion.h2>
            </Reveal>
            <ul className="lp-faq">
              {FAQ.map(([q, a]) => <FaqItem key={q} q={q} a={a} />)}
            </ul>
          </div>
        </section>

        {/* Final CTA */}
        <section className="lp-final">
          <motion.div className="lp-wrap lp-final-in" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="lp-h2">Your next visit is a minute away</h2>
            <div className="lp-cta-row">
              <Link href="/client/book" className="btn btn-lg lp-btn-light">Book a visit <ArrowRight size={17} /></Link>
              <Link href="/auth/register" className="btn btn-lg lp-btn-outline">Create a free account</Link>
            </div>
          </motion.div>
        </section>

        <footer className="lp-footer">
          <div className="lp-wrap lp-footer-in">
            <Logo />
            <nav aria-label="Footer">
              {NAV.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
              <Link href="/auth/login">Sign in</Link>
              {CONTACT && <a href={`mailto:${CONTACT}`}>Contact</a>}
            </nav>
            <p className="tiny">MedFlow helps you book doctors. In an emergency, call 112.</p>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
