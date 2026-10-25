"use client";

import { useState } from "react";
import { Bell, CalendarCheck, CalendarX, CheckCircle2, Star } from "lucide-react";
import { useApi, useAuthedFetch } from "@/lib/use-api";
import { cn } from "@/lib/utils";

type Notification = { id: string; title: string; message: string; type: string; is_read: boolean; created_at: string };

const ICON = { success: CheckCircle2, warning: CalendarX, reminder: Star, info: CalendarCheck } as const;

function when(iso: string) {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  if (hrs < 48) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

/** Inbox shared by the patient and doctor portals. */
export function NotificationsInbox({ emptyHint }: { emptyHint: string }) {
  const { data, loading, error, reload } = useApi<{ notifications: Notification[] }>("/api/patient/notifications");
  const authedFetch = useAuthedFetch();
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [allRead, setAllRead] = useState(false);

  const items = (data?.notifications ?? []).map((n) => ({ ...n, is_read: n.is_read || allRead || readIds.has(n.id) }));
  const unread = items.filter((n) => !n.is_read).length;

  const markOne = (id: string) => {
    setReadIds((s) => new Set(s).add(id));
    authedFetch("/api/patient/notifications", { method: "PATCH", body: JSON.stringify({ id }) }).catch(() => {});
  };
  const markAll = async () => {
    setAllRead(true);
    try {
      await authedFetch("/api/patient/notifications", { method: "PATCH", body: JSON.stringify({ all: true }) });
    } catch {
      setAllRead(false);
    }
  };

  return (
    <div className="dr">
      <header className="dr-head">
        <div className="col gap-2">
          <h1 className="h-1">Notifications</h1>
          <p className="body">{loading ? "Loading…" : unread ? `${unread} unread` : "You’re all caught up."}</p>
        </div>
        {unread > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={markAll}>
            Mark all as read
          </button>
        )}
      </header>

      {loading ? (
        <div className="bk-skeleton" style={{ minHeight: 240, borderRadius: 18 }} aria-busy="true" />
      ) : error ? (
        <div className="bk-empty">
          <p className="h-4">Notifications could not be loaded</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={reload}>Try again</button>
        </div>
      ) : items.length === 0 ? (
        <div className="bk-empty">
          <p className="h-4">Nothing here yet</p>
          <p className="small">{emptyHint}</p>
        </div>
      ) : (
        <ul className="nt-list">
          {items.map((n) => {
            const Icon = ICON[n.type as keyof typeof ICON] ?? Bell;
            return (
              <li key={n.id} className={cn("nt", !n.is_read && "unread", `nt-${n.type}`)}>
                <span className="nt-icon" aria-hidden="true"><Icon size={17} /></span>
                <div className="nt-body">
                  <span className="nt-title">{n.title}</span>
                  <span className="small">{n.message}</span>
                  <span className="tiny">{when(n.created_at)}</span>
                </div>
                {!n.is_read && (
                  <button type="button" className="vrow-link nt-mark" onClick={() => markOne(n.id)} aria-label={`Mark “${n.title}” as read`}>
                    Mark read
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
