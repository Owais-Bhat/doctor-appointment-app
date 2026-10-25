"use client";

import { useState } from "react";
import { Search, Stethoscope } from "lucide-react";
import { Headshot } from "@/components/medflow/Prototype";
import { useApi, useAuthedFetch } from "@/lib/use-api";
import { CURRENCY, nameHue } from "@/lib/format";
import { cn } from "@/lib/utils";

type User = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: "patient" | "doctor" | "super_admin";
  is_active: boolean | null;
  created_at: string;
};
type Filter = "all" | "patient" | "doctor" | "super_admin" | "suspended";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "patient", label: "Patients" },
  { key: "doctor", label: "Doctors" },
  { key: "super_admin", label: "Admins" },
  { key: "suspended", label: "Suspended" },
];
const ROLE_LABEL = { patient: "Patient", doctor: "Doctor", super_admin: "Admin" };
const SPECIALTIES = [
  "General Medicine", "Cardiology", "Dermatology", "Pediatrics", "Gynecology", "Orthopedics",
  "Neurology", "ENT", "Ophthalmology", "Psychiatry", "Gastroenterology", "Dentistry",
];

type Panel = { kind: "doctor" } | { kind: "patient" } | { kind: "suspend" } | null;

function UserRow({ user, me, onChanged }: { user: User; me: string | undefined; onChanged: () => void }) {
  const authedFetch = useAuthedFetch();
  const [panel, setPanel] = useState<Panel>(null);
  const [specialty, setSpecialty] = useState(SPECIALTIES[0]);
  const [fee, setFee] = useState("500");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const suspended = user.is_active === false;
  const isMe = user.id === me;
  const joined = new Date(user.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

  const run = async (path: string, method: string, body: object) => {
    setBusy(true);
    setError("");
    try {
      await authedFetch(path, { method, body: JSON.stringify(body) });
      setPanel(null);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={cn("ad-row ad-user", suspended && "is-off")}>
      <Headshot name={user.full_name || user.email} hue={nameHue(user.full_name || user.email)} size={40} />
      <div className="col" style={{ gap: 2, minWidth: 0 }}>
        <span className="mf-ellipsis" style={{ fontWeight: 600 }}>
          {user.full_name || "No name"} {isMe && <span className="tiny">(you)</span>}
        </span>
        <span className="tiny mf-ellipsis">{user.email}</span>
        <span className="row gap-2" style={{ marginTop: 2 }}>
          <span className={cn("ad-tag", user.role)}>{ROLE_LABEL[user.role]}</span>
          {suspended && <span className="ad-tag bad">Suspended</span>}
          <span className="tiny">Joined {joined}</span>
        </span>

        {panel?.kind === "doctor" && (
          <div className="vrow-panel" style={{ marginTop: 8 }}>
            <p className="small">
              {user.full_name.split(" ")[0]} becomes a verified doctor and can set their hours. You can hide them from search at any time.
            </p>
            <div className="ad-form">
              <label className="col gap-1">
                <span className="mf-label">Specialty</span>
                <select className="input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                  {SPECIALTIES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="col gap-1">
                <span className="mf-label">Consultation fee ({CURRENCY})</span>
                <input className="input" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value.replace(/[^\d.]/g, ""))} />
              </label>
            </div>
            <div className="row gap-2">
              <button type="button" className="btn btn-primary btn-sm" disabled={busy || !fee}
                onClick={() => run("/api/super-admin/settings/promote", "POST", { userId: user.id, specialty, consultationFee: Number(fee) })}>
                {busy ? "Saving…" : "Make doctor"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPanel(null)}>Cancel</button>
            </div>
          </div>
        )}

        {panel?.kind === "patient" && (
          <div className="vrow-panel" style={{ marginTop: 8 }}>
            <p className="small">They’ll be removed from search and lose the doctor portal. Their past visits stay on record.</p>
            <div className="row gap-2">
              <button type="button" className="btn btn-sm vrow-danger" disabled={busy}
                onClick={() => run("/api/super-admin/settings/promote", "DELETE", { userId: user.id })}>
                {busy ? "Saving…" : "Change to patient"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPanel(null)}>Keep as doctor</button>
            </div>
          </div>
        )}

        {panel?.kind === "suspend" && (
          <div className="vrow-panel" style={{ marginTop: 8 }}>
            <p className="small">
              {user.full_name.split(" ")[0] || "This user"} won’t be able to use MedFlow until you reactivate the account.
              {user.role === "doctor" && " They’ll also be hidden from search."}
            </p>
            <div className="row gap-2">
              <button type="button" className="btn btn-sm vrow-danger" disabled={busy}
                onClick={() => run("/api/super-admin/users", "PATCH", { userId: user.id, is_active: false })}>
                {busy ? "Suspending…" : "Suspend account"}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPanel(null)}>Cancel</button>
            </div>
          </div>
        )}
        {error && <span className="small sc-bad" role="alert">{error}</span>}
      </div>

      {!panel && !isMe && user.role !== "super_admin" && (
        <div className="ad-actions">
          {suspended ? (
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy}
              onClick={() => run("/api/super-admin/users", "PATCH", { userId: user.id, is_active: true })}>
              {busy ? "Saving…" : "Reactivate"}
            </button>
          ) : (
            <>
              {user.role === "patient" && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPanel({ kind: "doctor" })}>
                  <Stethoscope size={14} /> Make doctor
                </button>
              )}
              {user.role === "doctor" && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setPanel({ kind: "patient" })}>
                  Change to patient
                </button>
              )}
              <button type="button" className="vrow-link" onClick={() => setPanel({ kind: "suspend" })}>Suspend</button>
            </>
          )}
        </div>
      )}
    </li>
  );
}

export default function AdminUsers() {
  const { data, loading, error, reload } = useApi<{ users: User[]; me: string }>("/api/super-admin/users");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const users = data?.users ?? [];
  const matches = (u: User, f: Filter) =>
    f === "all" ? true : f === "suspended" ? u.is_active === false : u.role === f;
  const list = users
    .filter((u) => matches(u, filter))
    .filter((u) => `${u.full_name} ${u.email} ${u.phone ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="dr">
      <header className="dr-head">
        <div className="col gap-2">
          <h1 className="h-1">Users</h1>
          <p className="body">Everyone with a MedFlow account. Make doctors and suspend accounts here.</p>
        </div>
      </header>

      <div className="row gap-3 wrap" style={{ alignItems: "center" }}>
        <label className="search" style={{ flex: "1 1 280px", maxWidth: 440 }}>
          <Search size={16} className="mf-muted" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email or phone" aria-label="Search users" />
        </label>
        <div className="bk-chips" role="group" aria-label="Filter users">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" className={cn("bk-chip", filter === f.key && "on")} onClick={() => setFilter(f.key)} aria-pressed={filter === f.key}>
              {f.label}
              {!loading && <span className="ad-n">{users.filter((u) => matches(u, f.key)).length}</span>}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bk-skeleton" style={{ minHeight: 280, borderRadius: 18 }} aria-busy="true" />
      ) : error ? (
        <div className="bk-empty">
          <p className="h-4">Users could not be loaded</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>Try again</button>
        </div>
      ) : list.length === 0 ? (
        <div className="bk-empty">
          <p className="h-4">No users match</p>
          <p className="small">Try another name or clear the filter.</p>
        </div>
      ) : (
        <ul className="ad-list">
          {list.map((u) => (
            <UserRow key={u.id} user={u} me={data?.me} onChanged={reload} />
          ))}
        </ul>
      )}
    </div>
  );
}
