"use client";

import Link from "next/link";
import { Building2, CalendarPlus, ClipboardList, Phone, Stethoscope, UserRound, Video } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/lib/use-api";
import { canJoinVideo } from "@/lib/video";
import {
  STATUS_LABEL,
  VISIT_TYPE_LABEL,
  doctorName,
  formatDay,
  formatTime,
  greeting,
  nameHue,
  toISODate,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type Appointment = {
  id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  consultation_type: string;
  chief_complaint: string | null;
  doctor_profiles: { id: string; specialty: string; profiles: { full_name: string } | null } | null;
};

type Notification = { id: string; title: string; message: string; is_read: boolean; created_at: string };

const TYPE_ICON = { video: Video, phone: Phone, in_person: Building2 } as const;

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

function NextVisit({ appt }: { appt: Appointment }) {
  const name = doctorName(appt.doctor_profiles?.profiles?.full_name);
  const TypeIcon = TYPE_ICON[appt.consultation_type as keyof typeof TYPE_ICON] ?? Stethoscope;
  const confirmed = appt.status === "confirmed";

  return (
    <article className="db-next glass-strong" aria-labelledby="db-next-title">
      <div className="db-next-when">
        <span className="db-next-day">{formatDay(appt.appointment_date)}</span>
        <span className="db-next-time">{formatTime(appt.appointment_time)}</span>
      </div>

      <div className="db-next-body">
        <div className="row gap-3" style={{ alignItems: "center" }}>
          <Headshot name={name} hue={nameHue(name)} size={48} />
          <div className="col" style={{ gap: 2, minWidth: 0 }}>
            <h2 id="db-next-title" className="h-4 mf-ellipsis">{name}</h2>
            <span className="small">{appt.doctor_profiles?.specialty}</span>
          </div>
        </div>
        <div className="row gap-2 wrap">
          <span className={cn("pill", confirmed ? "good" : "warn")}>{STATUS_LABEL[appt.status] ?? appt.status}</span>
          <span className="pill">
            <TypeIcon size={13} /> {VISIT_TYPE_LABEL[appt.consultation_type] ?? "Visit"}
          </span>
        </div>
        {appt.chief_complaint && <p className="small db-next-reason">“{appt.chief_complaint}”</p>}
        <div className="row gap-2 wrap db-next-actions">
          {confirmed && appt.consultation_type === "video" && canJoinVideo(appt.appointment_date, appt.appointment_time) && (
            <Link href={`/client/visit/${appt.id}`} className="btn btn-primary btn-sm">
              <Video size={14} /> Join video
            </Link>
          )}
          <Link href={`/client/intake/${appt.id}`} className="btn btn-primary btn-sm">
            <ClipboardList size={14} /> {appt.chief_complaint ? "Update visit details" : "Add visit details"}
          </Link>
          <Link href="/client/appointments" className="btn btn-ghost btn-sm">
            Manage visit
          </Link>
        </div>
      </div>
    </article>
  );
}

function NoVisits() {
  return (
    <article className="db-next db-next-empty glass-strong">
      <div className="col gap-2">
        <h2 className="h-3">No visits coming up</h2>
        <p className="body">Find a doctor and pick a time that suits you. Most clinics confirm within a few hours.</p>
      </div>
      <div className="row gap-2 wrap">
        <Link href="/client/book" className="btn btn-primary">
          <CalendarPlus size={15} /> Book a visit
        </Link>
        <Link href="/client/doctors" className="btn btn-ghost">
          Browse doctors
        </Link>
      </div>
    </article>
  );
}

export default function ClientDashboard() {
  const { displayName } = useAuth();
  const appts = useApi<{ appointments: Appointment[] }>("/api/patient/appointments");
  const notes = useApi<{ notifications: Notification[] }>("/api/patient/notifications");

  const today = toISODate(new Date());
  const upcoming = (appts.data?.appointments ?? [])
    .filter((a) => ["pending", "confirmed"].includes(a.status) && a.appointment_date >= today)
    .sort((a, b) => `${a.appointment_date}${a.appointment_time}`.localeCompare(`${b.appointment_date}${b.appointment_time}`));
  const [next, ...later] = upcoming;
  const recent = (notes.data?.notifications ?? []).slice(0, 4);
  const firstName = displayName?.replace(/^dr\.?\s+/i, "").split(" ")[0];

  const summary = appts.loading
    ? "Loading your visits…"
    : upcoming.length === 0
      ? "You have no upcoming visits."
      : upcoming.length === 1
        ? "You have one upcoming visit."
        : `You have ${upcoming.length} upcoming visits.`;

  return (
    <div className="db">
      <header className="db-head">
        <div className="col gap-2">
          <h1 className="h-1">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="body">{summary}</p>
        </div>
        {upcoming.length > 0 && (
          <Link href="/client/book" className="btn btn-primary db-head-cta">
            <CalendarPlus size={15} /> Book a visit
          </Link>
        )}
      </header>

      <div className="db-grid">
        <div className="col gap-6" style={{ minWidth: 0 }}>
          {appts.loading ? (
            <div className="db-next glass-strong bk-skeleton" style={{ minHeight: 200 }} aria-busy="true" />
          ) : appts.error ? (
            <div className="bk-empty">
              <p className="h-4">Your visits could not be loaded</p>
              <p className="small">{appts.error}.</p>
              <button type="button" className="btn btn-ghost btn-sm" onClick={appts.reload}>
                Try again
              </button>
            </div>
          ) : next ? (
            <NextVisit appt={next} />
          ) : (
            <NoVisits />
          )}

          {later.length > 0 && (
            <section className="col gap-3" aria-labelledby="db-later">
              <div className="row between">
                <h2 id="db-later" className="h-4">Later</h2>
                <Link href="/client/appointments" className="db-link">All visits</Link>
              </div>
              <ul className="db-list">
                {later.slice(0, 4).map((a) => {
                  const name = doctorName(a.doctor_profiles?.profiles?.full_name);
                  return (
                    <li key={a.id}>
                      <Link href="/client/appointments" className="db-row">
                        <span className="db-row-date">
                          <span>{formatDay(a.appointment_date)}</span>
                          <span className="tiny">{formatTime(a.appointment_time)}</span>
                        </span>
                        <span className="col" style={{ gap: 1, minWidth: 0 }}>
                          <span className="mf-ellipsis" style={{ fontWeight: 600 }}>{name}</span>
                          <span className="tiny mf-ellipsis">
                            {a.doctor_profiles?.specialty} · {VISIT_TYPE_LABEL[a.consultation_type] ?? "Visit"}
                          </span>
                        </span>
                        <span className={cn("db-status", a.status)}>{STATUS_LABEL[a.status] ?? a.status}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <nav className="db-shortcuts" aria-label="Shortcuts">
            <Link href="/client/doctors" className="db-shortcut">
              <Stethoscope size={18} />
              <span>
                <strong>Find a doctor</strong>
                <span className="tiny">By specialty, language or clinic</span>
              </span>
            </Link>
            <Link href="/client/profile" className="db-shortcut">
              <UserRound size={18} />
              <span>
                <strong>Health profile</strong>
                <span className="tiny">Blood type, allergies, contact details</span>
              </span>
            </Link>
          </nav>
        </div>

        <section className="db-updates" aria-labelledby="db-updates">
          <div className="row between">
            <h2 id="db-updates" className="h-4">Updates</h2>
            <Link href="/client/notifications" className="db-link">See all</Link>
          </div>
          {notes.loading ? (
            <div className="col gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bk-skeleton" style={{ minHeight: 64, borderRadius: 14 }} />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="small">Booking confirmations and reminders will show up here.</p>
          ) : (
            <ul className="db-notes">
              {recent.map((n) => (
                <li key={n.id} className={cn(!n.is_read && "unread")}>
                  <span className="db-note-title">{n.title}</span>
                  <span className="small">{n.message}</span>
                  <span className="tiny">{timeAgo(n.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
