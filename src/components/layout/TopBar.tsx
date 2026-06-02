"use client";

import { Bell, ChevronRight, Home, Settings } from "lucide-react";
import { usePathname } from "next/navigation";

const labels: Record<string, string> = {
  "/admin/dashboard": "Home - Today's Schedule",
  "/admin/schedule": "Schedule Calendar",
  "/admin/patients": "My Patients",
  "/admin/appointments": "Appointments",
  "/admin/analytics": "Practice Analytics",
  "/admin/profile": "Settings",
  "/client/dashboard": "Home - My Health",
  "/client/book": "Book Appointment",
  "/client/appointments": "My Appointments",
  "/client/doctors": "Find Doctors",
  "/client/profile": "Health Records",
  "/client/notifications": "Notifications",
  "/super-admin/dashboard": "Home - Platform Overview",
  "/super-admin/doctors": "Manage Clinics",
  "/super-admin/users": "User Management",
  "/super-admin/analytics": "Platform Analytics",
  "/super-admin/audit-logs": "Audit Logs",
  "/super-admin/settings": "Platform Settings",
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
