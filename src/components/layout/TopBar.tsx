"use client";

import { Bell, ChevronRight, Home, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

const labels: Record<string, string> = {
  "/admin/dashboard": "today",
  "/admin/schedule": "calendar",
  "/admin/patients": "patients",
  "/admin/appointments": "messages",
  "/admin/analytics": "earnings",
  "/admin/profile": "settings",
  "/client/dashboard": "dashboard",
  "/client/book": "book",
  "/client/appointments": "appointments",
  "/client/doctors": "doctors",
  "/client/profile": "records",
  "/client/notifications": "notifications",
  "/super-admin/dashboard": "overview",
  "/super-admin/doctors": "clinics",
  "/super-admin/users": "users",
  "/super-admin/analytics": "analytics",
  "/super-admin/audit-logs": "audit",
  "/super-admin/settings": "plans",
};

export function TopBar() {
  const pathname = usePathname();
  const label = labels[pathname] || "today";
  const platformName = pathname.startsWith("/super-admin") ? "MedFlow SaaS" : pathname.startsWith("/client") ? "MedFlow Patient" : "MedFlow Clinic";

  return (
    <div className="topbar row between wrap" style={{ marginBottom: 24, gap: "var(--gap-4)" }}>
      <div className="row gap-2 tiny" style={{ color: "var(--ink-3)", minWidth: 0, flex: "1 1 auto" }}>
        <Home size={12} />
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {platformName}
        </span>
        <ChevronRight size={11} />
        <span style={{ textTransform: "capitalize", whiteSpace: "nowrap" }}>{label}</span>
      </div>
      <div className="row gap-2 topbar-actions" style={{ flexShrink: 0 }}>
        <span className="pill good" style={{ whiteSpace: "nowrap" }}>
          <span className="dot" style={{ background: "var(--good)" }} />
          <span style={{ display: "none" }}>●</span>
          Accepting voice & video
        </span>
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={16} />
        </button>
        <button className="icon-btn" aria-label="Settings">
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
}
