"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Brain,
  Clock,
  Eye,
  Heart,
  HeartPulse,
  HomeIcon,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  Users,
  Video,
} from "lucide-react";
import { Headshot, Spark } from "@/components/medflow/Prototype";

const specialties = [
  { name: "Cardiology", icon: Heart, color: "#ef4444", count: 24 },
  { name: "Neurology", icon: Brain, color: "#8b5cf6", count: 18 },
  { name: "Orthopedics", icon: Activity, color: "#eab308", count: 16 },
  { name: "Ophthalmology", icon: Eye, color: "#3b82f6", count: 14 },
  { name: "Dermatology", icon: Sparkles, color: "#ec4899", count: 21 },
  { name: "General Med", icon: Stethoscope, color: "#10b981", count: 32 },
  { name: "Pulmonology", icon: HeartPulse, color: "#06b6d4", count: 12 },
  { name: "Telehealth", icon: Video, color: "#5856d6", count: 28 },
];

export default function Home() {
  return (
    <div data-screen-label="landing">
      <div className="atmos app-atmos" aria-hidden="true" />
      <div className="app-shell">
        <aside className="sidebar" data-screen-label="sidebar">
          <Link href="/" className="logo">
            <span className="mark">
              <Stethoscope size={18} />
            </span>
            <span>
              Med<span style={{ color: "var(--accent)" }}>Flow</span>
            </span>
          </Link>

          <div className="col gap-2" style={{ marginTop: 8 }}>
            <div className="search" style={{ padding: "8px 12px 8px 14px" }}>
              <Search size={14} style={{ color: "var(--ink-3)" }} />
              <input placeholder="Search..." style={{ fontSize: 13 }} />
              <span className="kbd">K</span>
            </div>
            <div className="nav-section" style={{ marginTop: 12 }}>Patient</div>
            <Link className="nav-item active" href="/">
              <span className="dot" style={{ background: "var(--accent)", width: 6, height: 6 }} />
              <HomeIcon size={16} />
              <span style={{ flex: 1 }}>Home</span>
            </Link>
            <Link className="nav-item" href="/client/book">
              <span className="dot" style={{ width: 6, height: 6 }} />
              <Sparkles size={16} />
              <span style={{ flex: 1 }}>Find care</span>
              <span className="pill accent" style={{ fontSize: 10, padding: "2px 8px" }}>AI</span>
            </Link>
            <Link className="nav-item" href="/client/doctors">
              <span className="dot" style={{ width: 6, height: 6 }} />
              <Users size={16} />
              <span style={{ flex: 1 }}>Doctors</span>
            </Link>
            <Link className="nav-item" href="/client/dashboard">
              <span className="dot" style={{ width: 6, height: 6 }} />
              <Activity size={16} />
              <span style={{ flex: 1 }}>My health</span>
            </Link>

            <div className="nav-section">Provider</div>
            <Link className="nav-item" href="/admin/dashboard">
              <span className="dot" style={{ width: 6, height: 6 }} />
              <Stethoscope size={16} />
              <span style={{ flex: 1 }}>Doctor portal</span>
            </Link>
            <Link className="nav-item" href="/super-admin/dashboard">
              <span className="dot" style={{ width: 6, height: 6 }} />
              <ShieldCheck size={16} />
              <span style={{ flex: 1 }}>SaaS admin</span>
            </Link>
          </div>

          <div style={{ marginTop: "auto" }}>
            <div className="glass" style={{ padding: 14, marginBottom: 10 }}>
              <div className="row gap-3">
                <div className="avatar md" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                  <Sparkles size={18} />
                </div>
                <div className="col grow" style={{ gap: 2 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>MedFlow Plus</div>
                  <div className="tiny">Unlimited consults, priority booking.</div>
                </div>
              </div>
              <Link className="btn btn-primary btn-sm" style={{ width: "100%", marginTop: 10 }} href="/client/book">
                Upgrade
              </Link>
            </div>
            <div className="row gap-3" style={{ padding: "8px 6px" }}>
              <Headshot name="Alex Rivera" hue={210} size={32} />
              <div className="grow col" style={{ gap: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Alex Rivera</div>
                <div className="tiny">Member · O+</div>
              </div>
            </div>
          </div>
        </aside>

        <main className="main" data-screen-label="landing content">
          <div className="fade-enter">
            <section className="hero">
              <div className="col gap-6">
                <div className="row gap-3">
                  <span className="pill accent">
                    <ShieldCheck size={13} />
                    HIPAA-compliant · End-to-end encrypted
                  </span>
                </div>
                <h1 className="h-display">
                  Healthcare,
                  <br />
                  <span className="hero-italic" style={{ color: "var(--accent)" }}>
                    reimagined
                  </span>
                  .
                </h1>
                <p className="body" style={{ maxWidth: 520, fontSize: 18 }}>
                  Find the right specialist in under a minute. Book by symptom, not by guesswork, and meet your doctor wherever you are.
                </p>
                <div className="row gap-3 wrap">
                  <Link className="btn btn-primary btn-lg" href="/client/book">
                    <Sparkles size={16} />
                    Find my specialist
                  </Link>
                  <Link className="btn btn-ghost btn-lg" href="/client/doctors">
                    Browse doctors
                    <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="row gap-6 wrap" style={{ marginTop: 8, color: "var(--ink-3)", fontSize: 13 }}>
                  <div className="row gap-2"><Users size={15} /> 12,400+ patients monthly</div>
                  <div className="row gap-2"><Star size={13} fill="currentColor" /> 4.9 avg rating</div>
                  <div className="row gap-2"><Clock size={15} /> Avg. wait: 8 min</div>
                </div>
              </div>

              <div className="col gap-3" style={{ position: "relative" }}>
                <div className="glass-strong" style={{ padding: 18, transform: "rotate(-1deg)" }}>
                  <div className="row between" style={{ marginBottom: 12 }}>
                    <div className="eyebrow">Next appointment</div>
                    <span className="pill good">
                      <span className="dot" style={{ background: "var(--good)" }} />
                      Confirmed
                    </span>
                  </div>
                  <div className="row gap-3">
                    <Headshot name="Sarah Jenkins" hue={340} size={56} />
                    <div className="col" style={{ gap: 2 }}>
                      <div className="h-4">Dr. Sarah Jenkins</div>
                      <div className="small">Cardiology · Video consultation</div>
                    </div>
                  </div>
                  <div className="row between" style={{ marginTop: 16 }}>
                    <div className="row gap-2 tnum">
                      <span style={{ fontWeight: 600 }}>Today</span>
                      <span style={{ color: "var(--ink-3)" }}>·</span>
                      <span>2:30 PM</span>
                    </div>
                    <Link className="btn btn-dark btn-sm" href="/client/appointments">
                      <Video size={14} />
                      Join
                    </Link>
                  </div>
                </div>

                <div className="row gap-3" style={{ transform: "translateX(20px)" }}>
                  <div className="glass" style={{ padding: 16, flex: 1 }}>
                    <div className="eyebrow" style={{ marginBottom: 8 }}>Heart rate</div>
                    <div className="row between" style={{ alignItems: "baseline" }}>
                      <div><span className="h-2 tnum">72</span><span className="small" style={{ marginLeft: 4 }}>bpm</span></div>
                      <span style={{ color: "var(--good)" }}><Activity size={16} /></span>
                    </div>
                    <Spark index={0} color="var(--accent)" height={36} />
                  </div>
                  <div className="glass" style={{ padding: 16, flex: 1 }}>
                    <div className="eyebrow" style={{ marginBottom: 8 }}>Sleep</div>
                    <div className="row between" style={{ alignItems: "baseline" }}>
                      <div><span className="h-2 tnum">7.4</span><span className="small" style={{ marginLeft: 4 }}>hrs</span></div>
                      <span className="pill accent">Good</span>
                    </div>
                    <Spark index={2} color="var(--accent-2)" height={36} />
                  </div>
                </div>

                <Link className="glass-strong" href="/client/book" style={{ padding: 16, transform: "translateX(40px) rotate(1deg)" }}>
                  <div className="row gap-3">
                    <div className="avatar md" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
                      <Sparkles size={20} />
                    </div>
                    <div className="col" style={{ gap: 2 }}>
                      <div className="h-4">AI symptom triage</div>
                      <div className="small">Describe how you feel. We&apos;ll match you to the right specialist.</div>
                    </div>
                    <ArrowRight size={18} style={{ color: "var(--ink-3)" }} />
                  </div>
                </Link>
              </div>
            </section>

            <section className="col gap-5" style={{ marginTop: 16 }}>
              <div className="row between">
                <div className="col" style={{ gap: 6 }}>
                  <div className="eyebrow">Coverage</div>
                  <h2 className="h-2">Care for every system.</h2>
                </div>
                <Link className="btn btn-ghost btn-sm" href="/client/doctors">
                  All specialties
                  <ArrowRight size={14} />
                </Link>
              </div>
              <div className="bento" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                {specialties.map((specialty) => {
                  const Icon = specialty.icon;
                  return (
                    <Link key={specialty.name} className="glass cell" style={{ textAlign: "left", cursor: "pointer" }} href="/client/doctors">
                      <div className="col gap-3">
                        <div className="avatar md" style={{ background: `color-mix(in oklab, ${specialty.color} 18%, transparent)`, color: specialty.color }}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <div className="h-4">{specialty.name}</div>
                          <div className="small" style={{ marginTop: 2 }}>{specialty.count} specialists</div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="col gap-5" style={{ marginTop: 64 }}>
              <div className="col" style={{ gap: 6 }}>
                <div className="eyebrow">How it works</div>
                <h2 className="h-2">From symptom to specialist in three taps.</h2>
              </div>
              <div className="bento" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                {[
                  ["01", "Describe how you feel", "Tap a body region or talk to our AI. We map symptoms to specialties, no Googling.", Sparkles],
                  ["02", "Match a real specialist", "See live availability, fees, and ratings, filtered to clinicians who can help right now.", Users],
                  ["03", "Meet your doctor", "Join over video or in-person. Records, prescriptions, and follow-ups stay in one place.", Video],
                ].map(([step, title, detail, Icon]) => {
                  const StepIcon = Icon as typeof Sparkles;
                  return (
                    <div key={String(step)} className="glass cell">
                      <div className="row between" style={{ marginBottom: 20 }}>
                        <span className="mono tiny" style={{ color: "var(--accent)" }}>{String(step)}</span>
                        <span style={{ color: "var(--accent)" }}><StepIcon size={22} /></span>
                      </div>
                      <div className="h-3" style={{ marginBottom: 8 }}>{String(title)}</div>
                      <div className="body" style={{ fontSize: 14 }}>{String(detail)}</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
