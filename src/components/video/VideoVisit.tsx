"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  CreditCard,
  ExternalLink,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Video,
  VideoOff,
} from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { useApi, useAuthedFetch } from "@/lib/use-api";
import { doctorName, formatDay, formatFee, formatTime, nameHue } from "@/lib/format";
import { usePayVisit } from "@/lib/use-pay-visit";
import { cn } from "@/lib/utils";

type JoinState = { ok: true } | { ok: false; reason: "not_video" | "not_confirmed" | "too_early" | "ended" | "unpaid"; opensAt?: string };
type VisitResponse = {
  role: "patient" | "doctor";
  provider: "daily" | "jitsi";
  join: JoinState;
  visit: { id: string; date: string; time: string; status: string; type: string; reason: string | null; notes?: string | null };
  doctor: { name: string; specialty: string | null; fee?: number | null };
  patient: { full_name: string; date_of_birth?: string | null; blood_type?: string | null; phone?: string | null; health_stats?: Record<string, unknown> | null } | null;
};
type Stage = "lobby" | "joining" | "call" | "left" | "completed";

const BLOCKED: Record<string, { title: string; body: string }> = {
  not_video: { title: "This isn’t a video visit", body: "Your visit is in person or by phone. You don’t need to join a video room." },
  not_confirmed: { title: "Waiting for the doctor to confirm", body: "The video room opens once the visit is confirmed. You’ll get a notification." },
  ended: { title: "This visit has ended", body: "The video room for this visit is closed." },
};

function age(dob?: string | null) {
  if (!dob) return null;
  const d = new Date(`${dob}T00:00:00`);
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) a--;
  return a >= 0 && a < 130 ? a : null;
}

function useCountdown(target?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (!target) return null;
  const ms = Math.max(0, new Date(target).getTime() - now);
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { ms, label: m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m}:${String(s).padStart(2, "0")}` };
}

/** Camera preview with a live microphone level, before joining. */
function DeviceCheck({ camOn, micOn, onToggleCam, onToggleMic }: { camOn: boolean; micOn: boolean; onToggleCam: () => void; onToggleMic: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState("");
  const [level, setLevel] = useState(0);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let ctx: AudioContext | null = null;
    let cancelled = false;

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser can’t use a camera. Try Chrome, Edge or Safari.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: camOn, audio: micOn });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        setError("");
        if (videoRef.current && camOn) videoRef.current.srcObject = stream;
        if (micOn && stream.getAudioTracks().length) {
          ctx = new AudioContext();
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          ctx.createMediaStreamSource(stream).connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);
          const tick = () => {
            analyser.getByteFrequencyData(data);
            setLevel(Math.min(1, data.reduce((a, b) => a + b, 0) / data.length / 60));
            raf = requestAnimationFrame(tick);
          };
          tick();
        }
      } catch (e) {
        const name = (e as DOMException)?.name;
        setError(
          name === "NotAllowedError"
            ? "Camera or microphone access was blocked. Allow it in the address bar, then try again."
            : name === "NotFoundError"
              ? "No camera or microphone was found. You can still join and listen."
              : "Your camera couldn’t start. Close other apps using it and try again.",
        );
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ctx?.close().catch(() => {});
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [camOn, micOn]);

  return (
    <div className="vv-preview">
      {camOn && !error ? (
        <video ref={videoRef} autoPlay playsInline muted className="vv-video" />
      ) : (
        <div className="vv-video vv-video-off">
          <VideoOff size={28} />
          <span className="small">{error || "Camera is off"}</span>
        </div>
      )}
      <div className="vv-controls">
        <button type="button" className={cn("vv-ctl", !micOn && "off")} onClick={onToggleMic} aria-pressed={!micOn} aria-label={micOn ? "Turn microphone off" : "Turn microphone on"}>
          {micOn ? <Mic size={18} /> : <MicOff size={18} />}
          {micOn && <span className="vv-level" style={{ transform: `scaleY(${0.15 + level * 0.85})` }} aria-hidden="true" />}
        </button>
        <button type="button" className={cn("vv-ctl", !camOn && "off")} onClick={onToggleCam} aria-pressed={!camOn} aria-label={camOn ? "Turn camera off" : "Turn camera on"}>
          {camOn ? <Video size={18} /> : <VideoOff size={18} />}
        </button>
      </div>
    </div>
  );
}

function DoctorNotes({ visitId, initial, onCompleted }: { visitId: string; initial: string; onCompleted: () => void }) {
  const authedFetch = useAuthedFetch();
  const [notes, setNotes] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [confirming, setConfirming] = useState(false);

  const save = async (complete = false) => {
    setState("saving");
    try {
      await authedFetch(`/api/doctor/appointments/${visitId}`, {
        method: "PATCH",
        body: JSON.stringify(complete ? { status: "completed", notes } : { notes }),
      });
      setState("saved");
      if (complete) onCompleted();
    } catch {
      setState("error");
    }
  };

  return (
    <div className="col gap-2">
      <label className="mf-label" htmlFor="vv-notes">Visit notes</label>
      <textarea
        id="vv-notes"
        className="input vv-notes"
        rows={6}
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setState("idle");
        }}
        placeholder="Findings, diagnosis, advice, follow-up"
      />
      <div className="row between" style={{ alignItems: "center" }}>
        <span className={cn("tiny", state === "error" && "sc-bad", state === "saved" && "sc-ok")} role="status">
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved" : state === "error" ? "Couldn’t save. Try again." : "Only you can see these"}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" disabled={state === "saving"} onClick={() => save(false)}>Save</button>
      </div>
      {confirming ? (
        <div className="vrow-panel">
          <p className="small">End the visit for both of you and mark it complete?</p>
          <div className="row gap-2">
            <button type="button" className="btn btn-primary btn-sm" disabled={state === "saving"} onClick={() => save(true)}>
              <Check size={14} /> End and complete
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>Not yet</button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-primary" onClick={() => setConfirming(true)}>
          <Check size={15} /> End visit and complete
        </button>
      )}
    </div>
  );
}

export function VideoVisit({ id, portal }: { id: string; portal: "patient" | "doctor" }) {
  const { data, loading, error, reload } = useApi<VisitResponse>(`/api/visits/${id}`);
  const authedFetch = useAuthedFetch();
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>("lobby");
  const [room, setRoom] = useState<{ url: string; provider: string } | null>(null);
  const [joinError, setJoinError] = useState("");
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const { pay, payingId, error: payError } = usePayVisit(useCallback(() => reload(), [reload]));
  const back = portal === "doctor" ? "/admin/appointments?tab=upcoming" : "/client/appointments";

  const countdown = useCountdown(data && !data.join.ok && data.join.reason === "too_early" ? data.join.opensAt : undefined);
  // When the waiting room opens, refresh the visit so the Join button appears
  useEffect(() => {
    if (countdown && countdown.ms === 0) reload();
  }, [countdown, reload]);

  const join = useCallback(async () => {
    setStage("joining");
    setJoinError("");
    try {
      const res = await authedFetch<{ url: string; provider: string }>(`/api/visits/${id}/join`, { method: "POST" });
      setRoom(res);
      setStage("call");
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : "Couldn’t open the video room");
      setStage("lobby");
    }
  }, [authedFetch, id]);

  if (loading) return <div className="vv bk-skeleton" style={{ minHeight: 420, borderRadius: 24 }} aria-busy="true" />;
  if (error || !data) {
    return (
      <div className="bk-empty">
        <p className="h-4">This visit couldn’t be found</p>
        <p className="small">It may belong to another account. Check your visits list.</p>
        <Link href={back} className="btn btn-ghost btn-sm">Back to visits</Link>
      </div>
    );
  }

  const isDoctor = data.role === "doctor";
  const other = isDoctor ? data.patient?.full_name ?? "Patient" : doctorName(data.doctor.name);
  const otherSub = isDoctor
    ? [age(data.patient?.date_of_birth) !== null ? `${age(data.patient?.date_of_birth)} yrs` : null, data.patient?.blood_type ? `Blood ${data.patient.blood_type}` : null].filter(Boolean).join(" · ")
    : data.doctor.specialty ?? "";
  const when = `${formatDay(data.visit.date)}, ${formatTime(data.visit.time)}`;
  const unpaid = !data.join.ok && data.join.reason === "unpaid";
  const blocked = !data.join.ok && data.join.reason !== "too_early" && !unpaid ? BLOCKED[data.join.reason] : null;
  const allergies = data.patient?.health_stats?.allergies as string | undefined;

  const panel = (
    <aside className="vv-panel">
      <div className="row gap-3" style={{ alignItems: "center" }}>
        <Headshot name={other} hue={nameHue(other)} size={48} />
        <div className="col" style={{ gap: 2, minWidth: 0 }}>
          <span className="vv-other mf-ellipsis">{other}</span>
          <span className="tiny">{otherSub}</span>
        </div>
      </div>
      <dl className="dr-stats">
        <div><dt>When</dt><dd>{when}</dd></div>
        {data.visit.reason && <div><dt>Reason</dt><dd className="pt-wrap">{data.visit.reason}</dd></div>}
        {isDoctor && allergies && <div><dt>Allergies</dt><dd className="pt-wrap">{allergies}</dd></div>}
      </dl>
      {isDoctor && stage === "call" && (
        <DoctorNotes visitId={data.visit.id} initial={data.visit.notes ?? ""} onCompleted={() => setStage("completed")} />
      )}
    </aside>
  );

  return (
    <div className="vv">
      <header className="vv-head">
        <Link href={back} className="bk-back"><ArrowLeft size={15} /> Visits</Link>
        <h1 className="h-2">Video visit with {other}</h1>
        <p className="small"><CalendarClock size={14} style={{ display: "inline", verticalAlign: -2 }} /> {when}</p>
      </header>

      <AnimatePresence mode="wait">
        {stage === "call" && room ? (
          <motion.div
            key="call"
            className="vv-call"
            initial={reduce ? false : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="vv-stage">
              <iframe
                src={room.url}
                title={`Video visit with ${other}`}
                allow="camera; microphone; fullscreen; display-capture; autoplay; speaker-selection"
                className="vv-frame"
              />
              <div className="vv-stage-bar">
                <a href={room.url} target="_blank" rel="noopener noreferrer" className="vrow-link">
                  <ExternalLink size={13} /> Open in a new tab
                </a>
                {!isDoctor && (
                  <button type="button" className="btn btn-sm vrow-danger" onClick={() => { setRoom(null); setStage("left"); }}>
                    <PhoneOff size={14} /> Leave
                  </button>
                )}
                {isDoctor && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setRoom(null); setStage("left"); }}>
                    <PhoneOff size={14} /> Leave without completing
                  </button>
                )}
              </div>
            </div>
            {panel}
          </motion.div>
        ) : stage === "left" || stage === "completed" ? (
          <motion.section key="done" className="bk-done glass-strong" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <span className="bk-done-icon" aria-hidden="true"><Check size={26} /></span>
            <h2 className="h-2">{stage === "completed" ? "Visit completed" : "You left the visit"}</h2>
            <p className="body">
              {stage === "completed"
                ? "Your notes are saved and the patient has been asked to rate the visit."
                : "You can rejoin any time today while the room is open."}
            </p>
            <div className="row gap-2 wrap" style={{ justifyContent: "center" }}>
              {stage === "left" && <button type="button" className="btn btn-primary" onClick={join}>Rejoin</button>}
              <Link href={back} className="btn btn-ghost">Back to visits</Link>
            </div>
          </motion.section>
        ) : (
          <motion.div key="lobby" className="vv-lobby" initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -8 }}>
            <DeviceCheck camOn={camOn} micOn={micOn} onToggleCam={() => setCamOn((v) => !v)} onToggleMic={() => setMicOn((v) => !v)} />
            <div className="vv-join">
              {panel}
              {unpaid ? (
                <div className="vv-pay">
                  <span className="mf-label">One step before you join</span>
                  <p className="body">Pay for your visit to open the video room. It takes under a minute with UPI or a card.</p>
                  <button type="button" className="btn btn-primary btn-lg" disabled={payingId === data.visit.id} onClick={() => pay(data.visit.id)}>
                    <CreditCard size={17} /> {payingId === data.visit.id ? "Opening…" : `Pay ${data.doctor.fee ? formatFee(data.doctor.fee) : "now"}`}
                  </button>
                  {payError && <p className="bk-error" role="alert" style={{ position: "static" }}>{payError.message}</p>}
                  <p className="tiny vv-private"><ShieldCheck size={13} /> Secure payment by Razorpay. Cancel the visit and you get a full refund.</p>
                </div>
              ) : blocked ? (
                <div className="bk-empty">
                  <p className="h-4">{blocked.title}</p>
                  <p className="small">{blocked.body}</p>
                </div>
              ) : !data.join.ok ? (
                <div className="vv-wait">
                  <span className="mf-label">The room opens in</span>
                  <span className="vv-count" aria-live="polite">{countdown?.label ?? "…"}</span>
                  <span className="small">Check your camera and microphone while you wait.</span>
                </div>
              ) : (
                <div className="col gap-2">
                  <button type="button" className="btn btn-primary btn-lg vv-join-btn" disabled={stage === "joining"} onClick={join}>
                    <Video size={17} /> {stage === "joining" ? "Opening room…" : isDoctor ? "Start visit" : "Join visit"}
                  </button>
                  {joinError && <p className="bk-error" role="alert" style={{ position: "static" }}>{joinError}</p>}
                  <p className="tiny vv-private">
                    <ShieldCheck size={13} /> {data.provider === "daily" ? "Private room: only you and your " + (isDoctor ? "patient" : "doctor") + " can enter." : "The room link is unique to this visit."}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
