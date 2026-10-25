"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarOff, Copy, Trash2 } from "lucide-react";
import { useApi, useAuthedFetch } from "@/lib/use-api";
import { formatTime, toISODate } from "@/lib/format";
import { cn } from "@/lib/utils";

// Schema: 0 = Monday … 6 = Sunday
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const LENGTHS = [10, 15, 20, 30, 45, 60];

type DayHours = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
};
type TimeOff = { id: string; blocked_date: string; reason: string | null };
type Availability = { availability: DayHours[]; blocked_dates: TimeOff[] };

const DEFAULT_WEEK: DayHours[] = DAYS.map((_, i) => ({
  day_of_week: i,
  start_time: "09:00",
  end_time: "17:00",
  slot_duration_minutes: 30,
  is_active: i < 5,
}));

const hhmm = (t: string) => t.substring(0, 5);
const minutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
function slotCount(d: DayHours) {
  const span = minutes(d.end_time) - minutes(d.start_time);
  return span > 0 ? Math.floor(span / d.slot_duration_minutes) : 0;
}

export default function SchedulePage() {
  const authedFetch = useAuthedFetch();
  const { data, loading, error } = useApi<Availability>("/api/doctor/availability");

  const [week, setWeek] = useState<DayHours[]>(DEFAULT_WEEK);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [timeOff, setTimeOff] = useState<TimeOff[]>([]);
  const [offDate, setOffDate] = useState("");
  const [offReason, setOffReason] = useState("");
  const [offBusy, setOffBusy] = useState(false);
  const [offError, setOffError] = useState("");

  // Load saved hours into the editor once
  useEffect(() => {
    if (!data) return;
    const saved = data.availability ?? [];
    setWeek(
      DEFAULT_WEEK.map((d) => {
        const row = saved.find((r) => r.day_of_week === d.day_of_week);
        return row
          ? { ...d, ...row, start_time: hhmm(row.start_time), end_time: hhmm(row.end_time) }
          : { ...d, is_active: saved.length === 0 ? d.is_active : false };
      }),
    );
    setTimeOff(data.blocked_dates ?? []);
  }, [data]);

  const update = (day: number, patch: Partial<DayHours>) => {
    setWeek((w) => w.map((d) => (d.day_of_week === day ? { ...d, ...patch } : d)));
    setDirty(true);
    setSaveMsg(null);
  };

  const copyToWeekdays = (from: DayHours) => {
    setWeek((w) =>
      w.map((d) =>
        d.day_of_week < 5
          ? { ...d, start_time: from.start_time, end_time: from.end_time, slot_duration_minutes: from.slot_duration_minutes, is_active: true }
          : d,
      ),
    );
    setDirty(true);
    setSaveMsg(null);
  };

  const invalidDay = week.find((d) => d.is_active && minutes(d.end_time) <= minutes(d.start_time));
  const weeklySlots = useMemo(() => week.filter((d) => d.is_active).reduce((n, d) => n + slotCount(d), 0), [week]);

  const save = async () => {
    if (invalidDay) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await authedFetch("/api/doctor/availability", { method: "PUT", body: JSON.stringify({ slots: week }) });
      setDirty(false);
      setSaveMsg({ ok: true, text: "Hours saved. Patients see the new times right away." });
    } catch (e) {
      setSaveMsg({ ok: false, text: `${e instanceof Error ? e.message : "Could not save"}. Your changes are still here; try again.` });
    } finally {
      setSaving(false);
    }
  };

  const addTimeOff = async () => {
    if (!offDate) return;
    setOffBusy(true);
    setOffError("");
    try {
      const res = await authedFetch<{ blocked_date: TimeOff }>("/api/doctor/blocked-dates", {
        method: "POST",
        body: JSON.stringify({ date: offDate, reason: offReason.trim() || null }),
      });
      setTimeOff((t) => [...t, res.blocked_date].sort((a, b) => a.blocked_date.localeCompare(b.blocked_date)));
      setOffDate("");
      setOffReason("");
    } catch (e) {
      setOffError(e instanceof Error ? e.message : "Could not add the day off");
    } finally {
      setOffBusy(false);
    }
  };

  const removeTimeOff = async (id: string) => {
    const before = timeOff;
    setTimeOff((t) => t.filter((x) => x.id !== id));
    try {
      await authedFetch(`/api/doctor/blocked-dates/${id}`, { method: "DELETE" });
    } catch {
      setTimeOff(before);
      setOffError("Could not remove that day. Try again.");
    }
  };

  return (
    <div className="dr">
      <header className="dr-head">
        <div className="col gap-2">
          <h1 className="h-1">Schedule</h1>
          <p className="body">Your weekly hours decide which times patients can book.</p>
        </div>
      </header>

      {error && (
        <div className="bk-empty">
          <p className="h-4">Your schedule could not be loaded</p>
          <p className="small">{error}. Refresh the page to try again.</p>
        </div>
      )}

      <div className="dr-grid">
        <section className="col gap-4" aria-labelledby="sc-hours" style={{ minWidth: 0 }}>
          <div className="row between wrap gap-3">
            <h2 id="sc-hours" className="h-4">Weekly hours</h2>
            <span className="small">{weeklySlots} bookable slots a week</span>
          </div>

          <ul className={cn("sc-week", loading && "bk-skeleton")} aria-busy={loading}>
            {week.map((d) => {
              const bad = d.is_active && minutes(d.end_time) <= minutes(d.start_time);
              return (
                <li key={d.day_of_week} className={cn("sc-day", !d.is_active && "off")}>
                  <label className="sc-toggle">
                    <input
                      type="checkbox"
                      checked={d.is_active}
                      onChange={(e) => update(d.day_of_week, { is_active: e.target.checked })}
                    />
                    <span className="sc-switch" aria-hidden="true" />
                    <span className="sc-dayname">{DAYS[d.day_of_week]}</span>
                  </label>

                  {d.is_active ? (
                    <div className="sc-fields">
                      <label className="sc-field">
                        <span className="sr-only">{DAYS[d.day_of_week]} start</span>
                        <input type="time" className="input" value={d.start_time} onChange={(e) => update(d.day_of_week, { start_time: e.target.value })} />
                      </label>
                      <span className="mf-muted" aria-hidden="true">to</span>
                      <label className="sc-field">
                        <span className="sr-only">{DAYS[d.day_of_week]} end</span>
                        <input type="time" className="input" value={d.end_time} onChange={(e) => update(d.day_of_week, { end_time: e.target.value })} />
                      </label>
                      <label className="sc-field">
                        <span className="sr-only">{DAYS[d.day_of_week]} visit length</span>
                        <select
                          className="input"
                          value={d.slot_duration_minutes}
                          onChange={(e) => update(d.day_of_week, { slot_duration_minutes: Number(e.target.value) })}
                        >
                          {LENGTHS.map((m) => (
                            <option key={m} value={m}>{m} min visits</option>
                          ))}
                        </select>
                      </label>
                      <span className={cn("sc-count", bad && "bad")}>
                        {bad ? "End must be after start" : `${slotCount(d)} slots`}
                      </span>
                      {d.day_of_week === 0 && (
                        <button type="button" className="vrow-link" onClick={() => copyToWeekdays(d)}>
                          <Copy size={13} /> Copy to weekdays
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="small mf-muted">Closed</span>
                  )}
                </li>
              );
            })}
          </ul>

          <div className="row gap-3 wrap" style={{ alignItems: "center" }}>
            <button type="button" className="btn btn-primary" disabled={saving || !dirty || !!invalidDay || loading} onClick={save}>
              {saving ? "Saving…" : "Save hours"}
            </button>
            {saveMsg && (
              <span className={cn("small", saveMsg.ok ? "sc-ok" : "sc-bad")} role="status">
                {saveMsg.text}
              </span>
            )}
            {!saveMsg && dirty && <span className="small mf-muted">Unsaved changes</span>}
          </div>
        </section>

        <aside className="col gap-4" aria-labelledby="sc-off">
          <div className="col gap-1">
            <h2 id="sc-off" className="h-4">Time off</h2>
            <p className="small">No one can book you on these days. Visits already booked stay as they are.</p>
          </div>

          <div className="sc-off-form">
            <label className="col gap-1">
              <span className="mf-label">Date</span>
              <input type="date" className="input" min={toISODate(new Date())} value={offDate} onChange={(e) => setOffDate(e.target.value)} />
            </label>
            <label className="col gap-1">
              <span className="mf-label">Reason <span className="mf-muted">(only you see this)</span></span>
              <input className="input" value={offReason} maxLength={120} onChange={(e) => setOffReason(e.target.value)} placeholder="Conference, leave…" />
            </label>
            <button type="button" className="btn btn-ghost btn-sm" disabled={!offDate || offBusy} onClick={addTimeOff}>
              <CalendarOff size={14} /> {offBusy ? "Adding…" : "Add day off"}
            </button>
            {offError && <p className="small sc-bad" role="alert">{offError}</p>}
          </div>

          {timeOff.length > 0 && (
            <ul className="sc-offs">
              {timeOff.map((t) => (
                <li key={t.id}>
                  <div className="col" style={{ gap: 0 }}>
                    <span style={{ fontWeight: 600 }}>
                      {new Date(`${t.blocked_date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {t.reason && <span className="tiny">{t.reason}</span>}
                  </div>
                  <button type="button" className="icon-btn" aria-label={`Remove time off on ${t.blocked_date}`} onClick={() => removeTimeOff(t.id)}>
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="tiny">
            Example: 9:00 to 13:00 with 30 min visits gives slots at {["09:00", "09:30", "10:00"].map(formatTime).join(", ")} … {formatTime("12:30")}.
          </p>
        </aside>
      </div>
    </div>
  );
}
