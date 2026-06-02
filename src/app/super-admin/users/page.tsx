"use client";

import { useEffect, useState } from "react";
import { Search, UserCheck, UserX } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type User = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  blood_type: string | null;
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

function rolePill(role: string) {
  if (role === "super_admin") return "bad";
  if (role === "doctor") return "accent";
  return "";
}

export default function UsersPage() {
  const { user, getToken } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getToken().then(async token => {
      if (!token) { setLoading(false); return; }
      const res = await fetch("/api/super-admin/users", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUsers(data.users ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const filtered = users.filter(u =>
    `${u.full_name} ${u.email} ${u.role}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="col" style={{ gap: 6 }}>
          <div className="eyebrow">{loading ? "…" : `${users.length} registered`}</div>
          <h1 className="h-1">Platform users</h1>
        </div>
        <div className="search" style={{ minWidth: 280 }}>
          <Search size={16} style={{ color: "var(--ink-3)" }} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or role..." />
        </div>
      </div>

      <div className="glass" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="col gap-3" style={{ padding: 16 }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ height: 52, borderRadius: 10, border: "1px solid var(--line)", opacity: 0.4 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="small" style={{ color: "var(--ink-3)" }}>{query ? "No results." : "No users found."}</div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid var(--line)" }}>
                {["User", "Email", "Role", "Blood type", "Status", "Joined"].map(h => (
                  <th key={h} style={{ padding: "12px 16px" }}><span className="eyebrow">{h}</span></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ borderTop: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div className="row gap-3">
                      <Avatar name={u.full_name || u.email} size={36} />
                      <div style={{ fontWeight: 600 }}>{u.full_name || "—"}</div>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div className="tiny">{u.email}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span className={`pill ${rolePill(u.role)}`}>{u.role}</span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div className="small">{u.blood_type ?? "—"}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {u.is_active !== false
                      ? <span className="pill good"><UserCheck size={11} /> Active</span>
                      : <span className="pill bad"><UserX size={11} /> Inactive</span>
                    }
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div className="tiny">{new Date(u.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
