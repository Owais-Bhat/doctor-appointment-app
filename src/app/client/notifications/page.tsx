"use client";

import { Bell, CalendarDays, FileText, Pill } from "lucide-react";

export default function NotificationsPage() {
  const items = [
    [CalendarDays, "Appointment reminder", "Video visit with Dr. Jenkins starts tomorrow at 2:30 PM.", "2m"],
    [FileText, "Lab results ready", "Your lipid panel has been added to records.", "1h"],
    [Pill, "Prescription refill", "Atorvastatin refill is waiting for clinician review.", "1d"],
  ];
  return (
    <div className="fade-enter col gap-7">
      <div><div className="eyebrow">Inbox</div><h1 className="h-1">Notifications</h1></div>
      <div className="glass" style={{ padding: 24 }}>
        <div className="col gap-3">
          {items.map(([Icon, title, detail, time]) => {
            const Ico = Icon as typeof Bell;
            return (
              <div key={String(title)} className="row gap-4" style={{ padding: 16, borderRadius: 16, border: "1px solid var(--line)" }}>
                <span className="icon-btn" style={{ color: "var(--accent)" }}><Ico size={16} /></span>
                <div className="grow"><div style={{ fontWeight: 700 }}>{String(title)}</div><div className="small">{String(detail)}</div></div>
                <span className="tiny">{String(time)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
