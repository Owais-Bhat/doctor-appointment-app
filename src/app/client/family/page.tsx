"use client";

import { useState } from "react";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { useApi, useAuthedFetch } from "@/lib/use-api";
import { cn } from "@/lib/utils";

type Member = { id: string; full_name: string; relation: string | null; date_of_birth: string | null; gender: string | null; blood_type: string | null };
type Form = { full_name: string; relation: string; date_of_birth: string; gender: string; blood_type: string };

const RELATIONS = ["Mother", "Father", "Spouse", "Son", "Daughter", "Brother", "Sister", "Other"];
const GENDERS = ["Male", "Female", "Other"];
const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const EMPTY: Form = { full_name: "", relation: "", date_of_birth: "", gender: "", blood_type: "" };

const toForm = (m: Member): Form => ({ full_name: m.full_name, relation: m.relation ?? "", date_of_birth: m.date_of_birth ?? "", gender: m.gender ?? "", blood_type: m.blood_type ?? "" });

export default function FamilyPage() {
  const authedFetch = useAuthedFetch();
  const { data, loading, error, reload } = useApi<{ members: Member[] }>("/api/patient/family");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const start = (m?: Member) => {
    setEditing(m ? m.id : "new");
    setForm(m ? toForm(m) : EMPTY);
    setMessage("");
  };

  const save = async () => {
    setBusy(true);
    setMessage("");
    const body = JSON.stringify({ full_name: form.full_name, relation: form.relation || null, date_of_birth: form.date_of_birth || null, gender: form.gender || null, blood_type: form.blood_type || null });
    try {
      await authedFetch(editing === "new" ? "/api/patient/family" : `/api/patient/family/${editing}`, { method: editing === "new" ? "POST" : "PATCH", body });
      setEditing(null);
      reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Couldn’t save");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (m: Member) => {
    if (!window.confirm(`Remove ${m.full_name}? Visits already booked for them stay as they are.`)) return;
    try {
      await authedFetch(`/api/patient/family/${m.id}`, { method: "DELETE" });
      reload();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Couldn’t remove");
    }
  };

  const members = data?.members ?? [];

  return (
    <div className="dr">
      <header className="dr-head">
        <div className="col" style={{ gap: 4 }}>
          <h1 className="h-1">Family members</h1>
          <p className="small">Book visits for your parents, children or partner from your own account. The doctor sees who the visit is for.</p>
        </div>
        {editing === null && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => start()}><UserPlus size={14} /> Add a person</button>
        )}
      </header>

      {editing !== null && (
        <section className="vrow-panel" aria-label={editing === "new" ? "Add a person" : "Edit person"}>
          <input className="input" placeholder="Full name" maxLength={100} value={form.full_name} onChange={(e) => set({ full_name: e.target.value })} aria-label="Full name" />
          <div className="bk-chips" role="group" aria-label="Relation">
            {RELATIONS.map((r) => (
              <button key={r} type="button" className={cn("bk-chip", form.relation === r && "on")} aria-pressed={form.relation === r} onClick={() => set({ relation: form.relation === r ? "" : r })}>{r}</button>
            ))}
          </div>
          <label className="mf-label" htmlFor="fm-dob">Date of birth (optional)</label>
          <input id="fm-dob" type="date" className="input" style={{ maxWidth: 220 }} max={new Date().toISOString().slice(0, 10)} value={form.date_of_birth} onChange={(e) => set({ date_of_birth: e.target.value })} />
          <div className="bk-chips" role="group" aria-label="Gender">
            {GENDERS.map((g) => (
              <button key={g} type="button" className={cn("bk-chip", form.gender === g && "on")} aria-pressed={form.gender === g} onClick={() => set({ gender: form.gender === g ? "" : g })}>{g}</button>
            ))}
          </div>
          <div className="bk-chips" role="group" aria-label="Blood type">
            {BLOOD_TYPES.map((b) => (
              <button key={b} type="button" className={cn("bk-chip", form.blood_type === b && "on")} aria-pressed={form.blood_type === b} onClick={() => set({ blood_type: form.blood_type === b ? "" : b })}>{b}</button>
            ))}
          </div>
          {message && <p className="bk-error" role="alert" style={{ position: "static" }}>{message}</p>}
          <div className="row gap-2">
            <button type="button" className="btn btn-primary btn-sm" disabled={busy || !form.full_name.trim()} onClick={save}>{busy ? "Saving…" : "Save"}</button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </section>
      )}

      {loading ? (
        <div className="bk-skeleton" style={{ minHeight: 100, borderRadius: 18 }} aria-busy="true" />
      ) : error ? (
        <p className="bk-error" role="alert" style={{ position: "static" }}>{error}</p>
      ) : members.length === 0 && editing === null ? (
        <div className="bk-empty"><p className="h-4">No one added yet</p><p className="small">Add a family member, then pick them when you book a visit.</p></div>
      ) : (
        <ul className="col gap-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {members.map((m) => (
            <li key={m.id} className="vrow-panel">
              <div className="row between" style={{ alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div className="col" style={{ gap: 2 }}>
                  <b>{m.full_name}</b>
                  <span className="tiny">{[m.relation, m.date_of_birth, m.gender, m.blood_type && `Blood ${m.blood_type}`].filter(Boolean).join(" · ") || "No other details"}</span>
                </div>
                <div className="row gap-2">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => start(m)}><Pencil size={13} /> Edit</button>
                  <button type="button" className="vrow-link" onClick={() => void remove(m)}><Trash2 size={13} /> Remove</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
