"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Mic, MonitorUp, PhoneOff, Video } from "lucide-react";

/** A video call in progress: speaking ring, live timer, voice bars. */
export function VideoDemo() {
  const reduce = useReducedMotion();
  const [secs, setSecs] = useState(252);
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [reduce]);

  return (
    <div className="vd" role="img" aria-label="Example video visit between a doctor and a patient">
      <div className="vd-main">
        <div className="vd-live">
          <span className="vd-rec" /> {String(Math.floor(secs / 60)).padStart(2, "0")}:{String(secs % 60).padStart(2, "0")}
        </div>
        <motion.div
          className="vd-ring"
          animate={reduce ? undefined : { scale: [1, 1.12, 1], opacity: [0.55, 0.15, 0.55] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="vd-face">SQ</span>
        <span className="vd-name">Dr. Sana Qureshi</span>
        <div className="vd-bars" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.span
              key={i}
              animate={reduce ? undefined : { scaleY: [0.3, 1, 0.45, 0.8, 0.3] }}
              transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.12, ease: "easeInOut" }}
            />
          ))}
        </div>
        <motion.div
          className="vd-pip"
          initial={reduce ? false : { opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 20 }}
        >
          <span className="vd-face sm">OB</span>
          <span>You</span>
        </motion.div>
      </div>
      <div className="vd-bar">
        <span><Mic size={16} /></span>
        <span><Video size={16} /></span>
        <span><MonitorUp size={16} /></span>
        <span className="end"><PhoneOff size={16} /></span>
      </div>
    </div>
  );
}

const MESSAGES = [
  { time: "Sun 10:02", text: "Your visit with Dr. Sana Qureshi is confirmed for Mon 26 Oct at 11:00 AM." },
  { time: "Sun 11:00", text: "Reminder: your video visit with Dr. Sana Qureshi is tomorrow at 11:00 AM." },
  { time: "Mon 10:00", text: "Your visit starts at 11:00 AM (in about an hour). Join: medflow.app/visits" },
];

/** WhatsApp-style chat where confirmations and reminders arrive one by one. */
export function ReminderDemo() {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(reduce ? MESSAGES.length : 0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (reduce || !active) return;
    const t = setTimeout(() => setShown((n) => (n >= MESSAGES.length ? 0 : n + 1)), shown >= MESSAGES.length ? 4000 : 1300);
    return () => clearTimeout(t);
  }, [shown, active, reduce]);

  return (
    <motion.div className="rd" onViewportEnter={() => setActive(true)} viewport={{ amount: 0.4 }} role="img" aria-label="Example WhatsApp reminders from MedFlow">
      <div className="rd-head">
        <span className="rd-logo">M</span>
        <span>
          <b>MedFlow</b>
          <small>Business account</small>
        </span>
      </div>
      <div className="rd-chat">
        <AnimatePresence>
          {MESSAGES.slice(0, shown).map((m) => (
            <motion.div
              key={m.time}
              className="rd-msg"
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
            >
              {m.text}
              <small>{m.time} <Check size={11} /><Check size={11} style={{ marginLeft: -7 }} /></small>
            </motion.div>
          ))}
        </AnimatePresence>
        {!reduce && shown < MESSAGES.length && active && (
          <div className="rd-typing" aria-hidden="true"><span /><span /><span /></div>
        )}
      </div>
    </motion.div>
  );
}

const REQUESTS = [
  { name: "Fatima Shah", when: "Tomorrow, 10:00 AM", reason: "Review of echo report", hue: 300 },
  { name: "Imran Lone", when: "Tue, 12:30 PM", reason: "Shortness of breath at night", hue: 90 },
  { name: "Zara Mir", when: "Today, 5:00 PM", reason: "Palpitations after sports", hue: 170 },
];

/** Doctor's request list, confirming one request after another. */
export function DoctorDemo() {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(reduce ? 1 : 0);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (reduce || !active) return;
    const t = setTimeout(() => setDone((n) => (n >= REQUESTS.length ? 0 : n + 1)), done >= REQUESTS.length ? 2600 : 1600);
    return () => clearTimeout(t);
  }, [done, active, reduce]);

  return (
    <motion.div className="dd" onViewportEnter={() => setActive(true)} viewport={{ amount: 0.4 }} role="img" aria-label="Example doctor dashboard confirming appointment requests">
      <div className="dd-head">
        <b>Requests</b>
        <motion.span key={REQUESTS.length - done} className="dd-count" initial={{ scale: 1.4 }} animate={{ scale: 1 }}>
          {REQUESTS.length - done}
        </motion.span>
      </div>
      {REQUESTS.map((r, i) => {
        const ok = i < done;
        return (
          <motion.div key={r.name} className="dd-row" animate={{ borderLeftColor: ok ? "var(--good)" : "var(--warn)" }}>
            <span className="bd-avatar" style={{ width: 34, height: 34, fontSize: 12, background: `linear-gradient(135deg, hsl(${r.hue} 55% 60%), hsl(${(r.hue + 40) % 360} 50% 40%))` }}>
              {r.name.split(" ").map((p) => p[0]).join("")}
            </span>
            <span className="dd-txt">
              <b>{r.name}</b>
              <span>{r.when} · {r.reason}</span>
            </span>
            <AnimatePresence mode="wait" initial={false}>
              {ok ? (
                <motion.span key="ok" className="dd-ok" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <Check size={13} /> Confirmed
                </motion.span>
              ) : (
                <motion.span key="btn" className="dd-btn" exit={{ scale: 0.9, opacity: 0 }}>
                  Confirm
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
