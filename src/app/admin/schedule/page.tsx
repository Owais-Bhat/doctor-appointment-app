"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Check, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type SlotRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
  is_active: boolean;
};

type BlockedDate = {
  id: string;
  blocked_date: string;
  reason: string | null;
};

const DEFAULT_SLOTS: SlotRow[] = DAY_NAMES.map((_, i) => ({
  day_of_week: i,
  start_time: "09:00",
  end_time: "17:00",
  slot_duration_minutes: 30,
  is_active: i < 5,
}));

export default function SchedulePage() {
  const { user, getToken } = useAuth();
  const [slots, setSlots] = useState<SlotRow[]>(DEFAULT_SLOTS);
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [addingDate, setAddingDate] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getToken().then(async token => {
      const res = await fetch("/api/doctor/availability", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.availability?.length > 0) {
        // Merge DB rows into default template
        const merged = DEFAULT_SLOTS.map(def => {
          const row = data.availability.find((a: SlotRow) => a.day_of_week === def.day_of_week);
          return row ? { ...def, ...row } : def;
        });
        setSlots(merged);
      }
      setBlocked(data.blocked_dates ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const updateSlot = (idx: number, patch: Partial<SlotRow>) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));
    setSaved(false);
  };

  const saveAvailability = async () => {
    setSaving(true);
    setSaved(false);
    const token = await getToken();
    await fetch("/api/doctor/availability", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ slots }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addBlockedDate = async () => {
    if (!newDate) return;
    setAddingDate(true);
    const token = await getToken();
    const res = await fetch("/api/doctor/blocked-dates", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ date: newDate, reason: newReason.trim() || null }),
    });
    const data = await res.json();
    if (res.ok) {
      setBlocked(prev => [...prev, data.blocked_date].sort((a, b) => a.blocked_date.localeCompare(b.blocked_date)));
      setNewDate("");
      setNewReason("");
    }
    setAddingDate(false);
  };

  const removeBlockedDate = async (id: string) => {
    const token = await getToken();
    const res = await fetch(`/api/doctor/blocked-dates/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setBlocked(prev => prev.filter(b => b.id !== id));
  };

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="col" style={{ gap: 6 }}>
          <div className="eyebrow">Capacity management</div>
          <h1 className="h-1">Schedule control</h1>
          <p className="body">Set weekly availability, slot duration, and blocked dates.</p>
        </div>
        <button
          className={`btn ${saved ? "btn-glass" : "btn-primary"}`}
          onClick={saveAvailability}
          disabled={saving}
        >
          {saved ? <><Check size={14} /> Saved</> : saving ? "Saving…" : "Save availability"}
        </button>
      </div>

      <div className="admin-grid" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, alignItems: "start" }}>
        {/* Weekly slots */}
        <div className="glass" style={{ padding: 24 }}>
          <div className="eyebrow" style={{ marginBottom: 18 }}>Weekly availability</div>
          {loading ? (
            <div className="col gap-3">
              {[1, 2, 3].map(i => <div key={i} style={{ height: 60, borderRadius: 12, border: "1px solid var(--line)", opacity: 0.4 }} />)}
            </div>
          ) : (
            <div className="col gap-3">
              {slots.map((slot, idx) => (
                <div key={slot.day_of_week} style={{
                  padding: "14px 18px", borderRadius: 14,
                  border: `1px solid ${slot.is_active ? "var(--accent)" : "var(--line)"}`,
                  opacity: slot.is_active ? 1 : 0.5,
                  transition: "opacity .15s, border-color .15s",
                }}>
                  <div className="row between" style={{ alignItems: "center" }}>
                    <div style={{ fontWeight: 700, width: 36 }}>{DAY_NAMES[slot.day_of_week]}</div>
                    <div className="row gap-3" style={{ flex: 1, justifyContent: "center" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span className="tiny" style={{ color: "var(--ink-3)" }}>Open</span>
                        <input
                          type="time"
                          value={slot.start_time}
                          disabled={!slot.is_active}
                          onChange={e => updateSlot(idx, { start_time: e.target.value })}
                          style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "4px 8px", background: "var(--surface-2)", fontSize: 13, fontWeight: 600 }}
                        />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span className="tiny" style={{ color: "var(--ink-3)" }}>Close</span>
                        <input
                          type="time"
                          value={slot.end_time}
                          disabled={!slot.is_active}
                          onChange={e => updateSlot(idx, { end_time: e.target.value })}
                          style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "4px 8px", background: "var(--surface-2)", fontSize: 13, fontWeight: 600 }}
                        />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span className="tiny" style={{ color: "var(--ink-3)" }}>Slot (min)</span>
                        <select
                          value={slot.slot_duration_minutes}
                          disabled={!slot.is_active}
                          onChange={e => updateSlot(idx, { slot_duration_minutes: Number(e.target.value) })}
                          style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "4px 8px", background: "var(--surface-2)", fontSize: 13, fontWeight: 600 }}
                        >
                          {[15, 20, 30, 45, 60].map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </label>
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={slot.is_active}
                        onChange={e => updateSlot(idx, { is_active: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: "var(--accent)" }}
                      />
                      <span className="tiny">{slot.is_active ? "Active" : "Off"}</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Blocked dates */}
        <div className="col gap-4">
          <div className="glass" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Blocked dates</div>
            {blocked.length === 0 && !loading ? (
              <div className="small" style={{ color: "var(--ink-3)" }}>No upcoming blocked dates.</div>
            ) : (
              <div className="col gap-2">
                {blocked.map(b => (
                  <div key={b.id} className="row between" style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid var(--line)", alignItems: "center" }}>
                    <div className="row gap-2" style={{ alignItems: "center" }}>
                      <CalendarClock size={14} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{formatDate(b.blocked_date)}</div>
                        {b.reason && <div className="tiny" style={{ color: "var(--ink-3)" }}>{b.reason}</div>}
                      </div>
                    </div>
                    <button
                      onClick={() => removeBlockedDate(b.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-3)", padding: 4 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add blocked date */}
          <div className="glass" style={{ padding: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 14 }}>Add blocked date</div>
            <div className="col gap-3">
              <div>
                <div className="tiny" style={{ marginBottom: 4, color: "var(--ink-3)" }}>Date</div>
                <input
                  type="date"
                  value={newDate}
                  min={today}
                  onChange={e => setNewDate(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface-2)", fontSize: 13 }}
                />
              </div>
              <div>
                <div className="tiny" style={{ marginBottom: 4, color: "var(--ink-3)" }}>Reason (optional)</div>
                <input
                  type="text"
                  value={newReason}
                  placeholder="e.g. CME Conference"
                  onChange={e => setNewReason(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface-2)", fontSize: 13 }}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ justifyContent: "center" }}
                onClick={addBlockedDate}
                disabled={!newDate || addingDate}
              >
                <Plus size={14} /> {addingDate ? "Adding…" : "Add date"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
