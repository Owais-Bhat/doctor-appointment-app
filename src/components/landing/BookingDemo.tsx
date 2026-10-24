"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, MessageCircle, Search, Star } from "lucide-react";
import { formatFee } from "@/lib/format";

/**
 * The hero's signature moment: a phone that books a visit by itself.
 * doctor → date → time → request → confirmed → WhatsApp reminder, on a loop.
 */
const STEPS = ["doctor", "date", "time", "request", "confirmed"] as const;
const STEP_MS = [1900, 1500, 1500, 1200, 3200];

const DOCTORS = [
  { name: "Dr. Sana Qureshi", spec: "Cardiology", fee: formatFee(800), rating: "4.9", hue: 160 },
  { name: "Dr. Arjun Mehta", spec: "Dermatology", fee: formatFee(600), rating: "4.7", hue: 40 },
  { name: "Dr. Priya Nair", spec: "Neurology", fee: formatFee(1000), rating: "4.8", hue: 250 },
];
const DAYS = [
  ["Sat", "24"],
  ["Sun", "25"],
  ["Mon", "26"],
  ["Tue", "27"],
];
const TIMES = ["9:30", "10:00", "10:30", "11:00", "4:30", "5:00"];

function Avatar({ name, hue, size = 36 }: { name: string; hue: number; size?: number }) {
  const initials = name.replace(/^Dr\.\s/, "").split(" ").map((p) => p[0]).join("");
  return (
    <span
      className="bd-avatar"
      style={{ width: size, height: size, fontSize: size * 0.34, background: `linear-gradient(135deg, hsl(${hue} 60% 62%), hsl(${(hue + 40) % 360} 55% 40%))` }}
    >
      {initials}
    </span>
  );
}

export function BookingDemo() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % STEPS.length), STEP_MS[step]);
    return () => clearTimeout(t);
  }, [step, reduce]);

  // Reduced motion: show the finished booking, still and readable
  const s = reduce ? 4 : step;
  const pick = s >= 1;
  const dateOn = s >= 1 ? 1 : -1;
  const timeOn = s >= 2 ? 3 : -1;
  const pressed = s === 3;
  // progress dots: choose doctor → pick time → confirm
  const phase = s === 0 ? 0 : s <= 2 ? 1 : 2;

  return (
    <div className="bd" aria-label="Animated example: booking a visit with Dr. Sana Qureshi on MedFlow" role="img">
      <div className="bd-phone">
        <div className="bd-notch" />
        <div className="bd-screen">
          <div className="bd-top">
            <span className="bd-title">Book a visit</span>
            <span className="bd-steps">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="bd-dot" animate={{ background: phase >= i ? "var(--accent)" : "var(--line-2)", width: phase === i ? 18 : 6 }} />
              ))}
            </span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {s < 4 ? (
              <motion.div
                key="flow"
                className="bd-body"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35 }}
              >
                <div className="bd-search"><Search size={12} /> Cardiologist near me</div>

                {DOCTORS.map((d, i) => (
                  <motion.div
                    key={d.name}
                    className="bd-doc"
                    animate={{
                      borderColor: pick && i === 0 ? "var(--accent)" : "var(--line)",
                      opacity: pick && i !== 0 ? 0.35 : 1,
                      height: pick && i !== 0 ? 0 : "auto",
                      marginBottom: pick && i !== 0 ? -8 : 0,
                      scale: s === 0 && i === 0 ? [1, 1, 0.97, 1] : 1,
                    }}
                    transition={{ duration: s === 0 ? 1.6 : 0.4, times: s === 0 ? [0, 0.7, 0.85, 1] : undefined }}
                  >
                    <Avatar name={d.name} hue={d.hue} />
                    <span className="bd-doc-txt">
                      <b>{d.name}</b>
                      <span>{d.spec} · <Star size={9} fill="currentColor" strokeWidth={0} /> {d.rating}</span>
                    </span>
                    <span className="bd-fee">{d.fee}</span>
                  </motion.div>
                ))}

                <AnimatePresence>
                  {pick && (
                    <motion.div key="when" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
                      <div className="bd-label">Date</div>
                      <div className="bd-days">
                        {DAYS.map(([wd, n], i) => (
                          <motion.span key={n} className="bd-day" animate={{ background: i === dateOn ? "var(--accent)" : "rgba(0,0,0,0)", color: i === dateOn ? "#fff" : "var(--ink)" }} transition={{ delay: 0.5 }}>
                            <small>{wd}</small>
                            {n}
                          </motion.span>
                        ))}
                      </div>
                      <div className="bd-label">Time</div>
                      <div className="bd-times">
                        {TIMES.map((t, i) => (
                          <motion.span key={t} className="bd-time" animate={{ background: i === timeOn ? "var(--accent)" : "rgba(0,0,0,0)", color: i === timeOn ? "#fff" : "var(--ink)", borderColor: i === timeOn ? "var(--accent)" : "var(--line-2)" }} transition={{ delay: s === 2 ? 0.6 : 0 }}>
                            {t}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div className="bd-cta" animate={{ scale: pressed ? [1, 0.94, 1] : 1, opacity: s >= 2 ? 1 : 0.4 }} transition={{ duration: 0.5 }}>
                  Request appointment
                </motion.div>
              </motion.div>
            ) : (
              <motion.div key="done" className="bd-done" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                <motion.span className="bd-check" initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.1 }}>
                  <Check size={26} strokeWidth={3} />
                </motion.span>
                <b>Visit confirmed</b>
                <span>Dr. Sana Qureshi · Mon 26 Oct, 11:00 AM</span>
                <span className="bd-chip">Video visit</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {s === 4 && (
          <motion.div
            key="wa"
            className="bd-toast"
            initial={reduce ? false : { opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 300, damping: 22, delay: reduce ? 0 : 0.9 }}
          >
            <span className="bd-toast-icon"><MessageCircle size={16} /></span>
            <span>
              <b>WhatsApp · MedFlow</b>
              Reminder: your video visit with Dr. Sana Qureshi is tomorrow at 11:00 AM.
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
