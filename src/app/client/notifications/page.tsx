"use client";

import { useEffect, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, FileText, Info, Pill } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

function NotifIcon({ type }: { type: string }) {
  if (type === 'success') return <CheckCircle2 size={16} />;
  if (type === 'reminder') return <CalendarDays size={16} />;
  if (type === 'warning') return <Pill size={16} />;
  if (type === 'info') return <FileText size={16} />;
  return <Bell size={16} />;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function NotificationsPage() {
  const { user, getToken } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getToken().then(token =>
      fetch('/api/patient/notifications', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(d => setNotifications(d.notifications ?? []))
        .catch(console.error)
        .finally(() => setLoading(false))
    );
  }, [user]);

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    const token = await getToken();
    if (!token) return;
    fetch('/api/patient/notifications', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
  };

  return (
    <div className="fade-enter col gap-7">
      <div className="row between">
        <div>
          <div className="eyebrow">Inbox</div>
          <h1 className="h-1">Notifications</h1>
        </div>
        {notifications.some(n => !n.is_read) && (
          <span className="pill accent">{notifications.filter(n => !n.is_read).length} unread</span>
        )}
      </div>

      <div className="glass" style={{ padding: 24 }}>
        {loading ? (
          <div className="col gap-3">
            {[1, 2, 3].map(i => <div key={i} style={{ height: 64, borderRadius: 16, border: "1px solid var(--line)", opacity: 0.4 }} />)}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <Bell size={32} style={{ color: "var(--ink-3)", margin: "0 auto 12px" }} />
            <div className="h-3" style={{ marginBottom: 8 }}>All caught up</div>
            <div className="small">No notifications yet.</div>
          </div>
        ) : (
          <div className="col gap-3">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className="row gap-4"
                style={{
                  padding: 16,
                  borderRadius: 16,
                  border: "1px solid var(--line)",
                  background: notif.is_read ? "transparent" : "color-mix(in oklab, var(--accent) 5%, transparent)",
                  cursor: notif.is_read ? "default" : "pointer",
                }}
                onClick={() => !notif.is_read && markRead(notif.id)}
              >
                <span className="icon-btn" style={{ color: "var(--accent)" }}>
                  <NotifIcon type={notif.type} />
                </span>
                <div className="grow">
                  <div style={{ fontWeight: notif.is_read ? 500 : 700 }}>{notif.title}</div>
                  <div className="small">{notif.message}</div>
                </div>
                <span className="tiny">{timeAgo(notif.created_at)}</span>
                {!notif.is_read && <span className="dot" style={{ background: "var(--accent)", width: 8, height: 8 }} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
