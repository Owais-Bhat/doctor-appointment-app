"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

function typeIcon(type: string) {
  if (type === "success") return <CheckCircle2 size={16} style={{ color: "var(--good)" }} />;
  if (type === "warning") return <AlertTriangle size={16} style={{ color: "#f59e0b" }} />;
  if (type === "error") return <AlertTriangle size={16} style={{ color: "var(--bad)" }} />;
  return <Info size={16} style={{ color: "var(--accent)" }} />;
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DoctorNotifications() {
  const { user, getToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getToken().then(token =>
      fetch("/api/patient/notifications", { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setNotifications(d.notifications ?? []))
        .catch(console.error)
        .finally(() => setLoading(false))
    );
  }, [user]);

  const markRead = async (id: string) => {
    const token = await getToken();
    await fetch("/api/patient/notifications", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    const token = await getToken();
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n =>
      fetch("/api/patient/notifications", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      })
    ));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="fade-enter col gap-7">
      <div className="row between wrap gap-4">
        <div className="col" style={{ gap: 6 }}>
          <div className="eyebrow">Inbox</div>
          <h1 className="h-1">Notifications</h1>
          <p className="body">Appointment updates and system alerts.</p>
        </div>
        {unreadCount > 0 && (
          <button className="btn btn-glass" onClick={markAllRead}>
            <Check size={14} /> Mark all read ({unreadCount})
          </button>
        )}
      </div>

      <div className="glass" style={{ padding: 24 }}>
        {loading ? (
          <div className="col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 64, borderRadius: 14, border: "1px solid var(--line)", opacity: 0.4 }} />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <Bell size={32} style={{ color: "var(--ink-3)", margin: "0 auto 12px" }} />
            <div className="h-3" style={{ marginBottom: 8 }}>No notifications</div>
            <div className="small" style={{ color: "var(--ink-3)" }}>You're all caught up.</div>
          </div>
        ) : (
          <div className="col gap-3">
            {notifications.map(n => (
              <div
                key={n.id}
                className="row gap-4"
                style={{
                  padding: "14px 18px",
                  borderRadius: 14,
                  border: "1px solid var(--line)",
                  background: n.is_read ? "transparent" : "color-mix(in oklab, var(--accent) 5%, transparent)",
                  opacity: n.is_read ? 0.7 : 1,
                }}
              >
                <div style={{ marginTop: 2 }}>{typeIcon(n.type)}</div>
                <div className="grow">
                  <div style={{ fontWeight: n.is_read ? 500 : 800, fontSize: 14 }}>{n.title}</div>
                  <div className="small" style={{ color: "var(--ink-3)", marginTop: 2 }}>{n.message}</div>
                </div>
                <div className="col" style={{ gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
                  <span className="tiny" style={{ color: "var(--ink-3)" }}>{timeAgo(n.created_at)}</span>
                  {!n.is_read && (
                    <button
                      className="btn btn-glass btn-sm"
                      onClick={() => markRead(n.id)}
                      style={{ fontSize: 11, padding: "4px 10px" }}
                    >
                      <Check size={11} /> Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
