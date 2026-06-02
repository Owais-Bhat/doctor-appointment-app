"use client";

import { useEffect, useState } from "react";
import { Check, Search, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

function nameHue(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function Avatar({ name, size }: { name: string; size: number }) {
  const hue = nameHue(name);
  const initials = name.split(" ").map(p => p[0]).slice(0, 2).join("");
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg, hsl(${hue} 65% 65%), hsl(${(hue + 40) % 360} 60% 40%))`,
      display: "grid", placeItems: "center", color: "#fff",
      fontWeight: 700, fontSize: size * 0.33,
    }}>{initials}</div>
  );
}

export default function SettingsPage() {
  const { user, getToken } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [promoted, setPromoted] = useState<string | null>(null);

  // Promote modal state
  const [modal, setModal] = useState<UserRow | null>(null);
  const [specialty, setSpecialty] = useState("General Practice");
  const [fee, setFee] = useState("100");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getToken().then(async token => {
      const res = await fetch("/api/super-admin/users", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUsers(data.users ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const promoteToDoctor = async () => {
    if (!modal) return;
    setPromoting(modal.id);
    const token = await getToken();
    const res = await fetch("/api/super-admin/settings/promote", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId: modal.id, specialty, consultationFee: Number(fee) }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === modal.id ? { ...u, role: "doctor" } : u));
      setPromoted(modal.id);
      setTimeout(() => setPromoted(null), 3000);
    }
    setPromoting(null);
    setModal(null);
  };

  const demote = async (userId: string) => {
    setPromoting(userId);
    const token = await getToken();
    const res = await fetch("/api/super-admin/settings/promote", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: "patient" } : u));
    }
    setPromoting(null);
  };

  const filtered = users.filter(u =>
    `${u.full_name} ${u.email} ${u.role}`.toLowerCase().includes(query.toLowerCase())
  );

  const patients = filtered.filter(u => u.role === "patient");
  const doctors = filtered.filter(u => u.role === "doctor");

  return (
    <>
      <div className="fade-enter col gap-7">
        <div className="row between wrap gap-4">
          <div>
            <div className="eyebrow">Plans and platform</div>
            <h1 className="h-1">Settings</h1>
            <p className="body">Role management, doctor promotion, and platform configuration.</p>
          </div>
          <div className="search" style={{ minWidth: 280 }}>
            <Search size={16} style={{ color: "var(--ink-3)" }} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search users..." />
          </div>
        </div>

        {/* Patients — promote to doctor */}
        <div className="glass" style={{ padding: 24 }}>
          <div className="row between" style={{ marginBottom: 18 }}>
            <div>
              <div className="eyebrow">Patients</div>
              <div className="h-3">Promote to doctor</div>
            </div>
            <span className="pill">{loading ? "…" : patients.length} patients</span>
          </div>
          {loading ? (
            <div className="col gap-3">
              {[1, 2, 3].map(i => <div key={i} style={{ height: 52, borderRadius: 10, border: "1px solid var(--line)", opacity: 0.4 }} />)}
            </div>
          ) : patients.length === 0 ? (
            <div className="small" style={{ color: "var(--ink-3)" }}>No patients found.</div>
          ) : (
            <div className="col gap-2">
              {patients.map(u => (
                <div key={u.id} className="row between" style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid var(--line)", alignItems: "center" }}>
                  <div className="row gap-3" style={{ alignItems: "center" }}>
                    <Avatar name={u.full_name || u.email} size={36} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.full_name || "—"}</div>
                      <div className="tiny" style={{ color: "var(--ink-3)" }}>{u.email}</div>
                    </div>
                  </div>
                  <button
                    className={`btn btn-sm ${promoted === u.id ? "btn-glass" : "btn-primary"}`}
                    disabled={promoting === u.id}
                    onClick={() => { setModal(u); setSpecialty("General Practice"); setFee("100"); }}
                  >
                    {promoted === u.id ? <><Check size={13} /> Promoted</> : <><UserCheck size={13} /> Promote</>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Doctors — demote */}
        <div className="glass" style={{ padding: 24 }}>
          <div className="row between" style={{ marginBottom: 18 }}>
            <div>
              <div className="eyebrow">Doctors</div>
              <div className="h-3">Role management</div>
            </div>
            <span className="pill accent">{loading ? "…" : doctors.length} doctors</span>
          </div>
          {loading ? (
            <div className="col gap-3">
              {[1, 2].map(i => <div key={i} style={{ height: 52, borderRadius: 10, border: "1px solid var(--line)", opacity: 0.4 }} />)}
            </div>
          ) : doctors.length === 0 ? (
            <div className="small" style={{ color: "var(--ink-3)" }}>No doctors found.</div>
          ) : (
            <div className="col gap-2">
              {doctors.map(u => (
                <div key={u.id} className="row between" style={{ padding: "10px 14px", borderRadius: 12, border: "1px solid var(--line)", alignItems: "center" }}>
                  <div className="row gap-3" style={{ alignItems: "center" }}>
                    <Avatar name={u.full_name || u.email} size={36} />
                    <div>
                      <div style={{ fontWeight: 600 }}>{u.full_name || "—"}</div>
                      <div className="tiny" style={{ color: "var(--ink-3)" }}>{u.email}</div>
                    </div>
                  </div>
                  <div className="row gap-2">
                    <span className="pill good"><ShieldCheck size={11} /> Doctor</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      disabled={promoting === u.id}
                      onClick={() => demote(u.id)}
                      style={{ color: "var(--warn, #e53e3e)" }}
                    >
                      <UserX size={13} /> Demote
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform config — informational */}
        <div className="bento" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
          <div className="glass cell" style={{ padding: 20 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Security</div>
            <div className="h-4" style={{ marginBottom: 4 }}>Auth provider</div>
            <div className="small" style={{ color: "var(--ink-3)" }}>Firebase Auth — email/password + Google OAuth</div>
            <span className="pill good" style={{ marginTop: 10 }}>Active</span>
          </div>
          <div className="glass cell" style={{ padding: 20 }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Database</div>
            <div className="h-4" style={{ marginBottom: 4 }}>Supabase Postgres</div>
            <div className="small" style={{ color: "var(--ink-3)" }}>Service role key — RLS bypassed for all admin operations</div>
            <span className="pill good" style={{ marginTop: 10 }}>Connected</span>
          </div>
        </div>
      </div>

      {/* Promote modal */}
      {modal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div className="glass" style={{ width: "100%", maxWidth: 420, padding: 28, borderRadius: 20 }}>
            <div className="eyebrow" style={{ marginBottom: 4 }}>Promote to doctor</div>
            <div className="h-3" style={{ marginBottom: 20 }}>{modal.full_name || modal.email}</div>
            <div className="col gap-4">
              <div>
                <div className="tiny" style={{ marginBottom: 6, color: "var(--ink-3)" }}>Specialty</div>
                <input
                  value={specialty}
                  onChange={e => setSpecialty(e.target.value)}
                  placeholder="e.g. Cardiology"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface-2)", fontSize: 14 }}
                />
              </div>
              <div>
                <div className="tiny" style={{ marginBottom: 6, color: "var(--ink-3)" }}>Consultation fee ($)</div>
                <input
                  type="number"
                  value={fee}
                  onChange={e => setFee(e.target.value)}
                  min="0"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface-2)", fontSize: 14 }}
                />
              </div>
              <div className="row gap-2" style={{ marginTop: 4 }}>
                <button className="btn btn-glass" style={{ flex: 1, justifyContent: "center" }} onClick={() => setModal(null)}>Cancel</button>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: "center" }}
                  disabled={!specialty || promoting === modal.id}
                  onClick={promoteToDoctor}
                >
                  <UserCheck size={14} /> {promoting === modal.id ? "Promoting…" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
