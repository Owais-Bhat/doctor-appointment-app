"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  CalendarDays,
  CreditCard,
  FileText,
  Globe2,
  Home,
  LogOut,
  MessageCircle,
  Search,
  Settings,
  ShieldCheck,
  Stethoscope,
  Users,
  Video,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const doctorNav = [
  { label: "Today", href: "/admin/dashboard", icon: Home },
  { label: "Calendar", href: "/admin/schedule", icon: CalendarDays },
  { label: "Patients", href: "/admin/patients", icon: Users, count: "412" },
  { label: "Messages", href: "/admin/appointments", icon: MessageCircle, badge: "3" },
  { label: "Records", href: "/admin/profile", icon: FileText },
  { label: "Earnings", href: "/admin/analytics", icon: Activity },
  { label: "Settings", href: "/admin/profile", icon: Settings },
];

const patientNav = [
  { label: "Dashboard", href: "/client/dashboard", icon: Home },
  { label: "Book", href: "/client/book", icon: CalendarDays },
  { label: "Appointments", href: "/client/appointments", icon: MessageCircle, badge: "2" },
  { label: "Doctors", href: "/client/doctors", icon: Stethoscope },
  { label: "Records", href: "/client/profile", icon: FileText },
  { label: "Notifications", href: "/client/notifications", icon: Activity },
];

const adminNav = [
  { label: "Overview", href: "/super-admin/dashboard", icon: Home },
  { label: "Clinics", href: "/super-admin/doctors", icon: BuildingIcon, count: "142" },
  { label: "Users", href: "/super-admin/users", icon: Users },
  { label: "Analytics", href: "/super-admin/analytics", icon: Activity },
  { label: "Audit", href: "/super-admin/audit-logs", icon: ShieldIcon },
  { label: "Plans", href: "/super-admin/settings", icon: CreditCard },
];

function BuildingIcon(props: React.ComponentProps<typeof Globe2>) {
  return <Globe2 {...props} />;
}

function ShieldIcon(props: React.ComponentProps<typeof ShieldCheck>) {
  return <ShieldCheck {...props} />;
}

export function Sidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const area = pathname.startsWith("/client") ? "PATIENT" : pathname.startsWith("/super-admin") ? "SAAS" : "DOCTOR";
  const nav = area === "PATIENT" ? patientNav : area === "SAAS" ? adminNav : doctorNav;
  const person = area === "PATIENT" ? "Maya Rivera" : area === "SAAS" ? "Avery Ops" : "Dr. Sarah Jenkins";
  const sub = area === "PATIENT" ? "Patient · Active" : area === "SAAS" ? "Operator · Online" : "Cardiology · Online";

  return (
    <aside className="sidebar" data-screen-label="doctor sidebar">
      <div className="row gap-2" style={{ padding: "4px 8px" }}>
        <Link href="/admin/dashboard" className="logo">
          <span className="mark">
            <Stethoscope size={18} />
          </span>
          <span>
            Med<span style={{ color: "var(--accent)" }}>Flow</span>
          </span>
        </Link>
        <span className="pill accent" style={{ fontSize: 9.5, padding: "2px 7px", letterSpacing: ".08em" }}>
          {area}
        </span>
      </div>

      <div className="col gap-2" style={{ marginTop: 8 }}>
        <div className="search" style={{ padding: "8px 12px 8px 14px" }}>
          <Search size={14} style={{ color: "var(--ink-3)" }} />
          <input placeholder="Search patients, notes..." style={{ fontSize: 13 }} />
          <span className="kbd">K</span>
        </div>

        <div className="nav-section" style={{ marginTop: 12 }}>
          {area === "SAAS" ? "Platform" : area === "PATIENT" ? "Care" : "Clinic"}
        </div>
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={`${item.href}-${item.label}`} href={item.href} className={cn("nav-item", active && "active")}>
              <span
                className="dot"
                style={{
                  background: active ? "var(--accent)" : "var(--ink-3)",
                  width: 6,
                  height: 6,
                }}
              />
              <Icon size={16} />
              <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
              {item.count && <span className="tiny tnum">{item.count}</span>}
              {item.badge && (
                <span className="pill accent" style={{ fontSize: 10, padding: "1px 7px" }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div style={{ marginTop: "auto" }}>
        <div className="glass-strong" style={{ padding: 14, marginBottom: 10 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>{area === "PATIENT" ? "Next appointment · 14:30" : area === "SAAS" ? "Phase 4 · Scale" : "Next patient · 11:00"}</div>
          <div className="row gap-3" style={{ marginBottom: 10 }}>
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>
              JO
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{area === "SAAS" ? "Global rollout" : area === "PATIENT" ? "Dr. Sarah Jenkins" : "James Okonkwo"}</div>
              <div className="tiny">{area === "SAAS" ? "FHIR, SSO, regions" : area === "PATIENT" ? "Video consult · 30m" : "Pre-op consult · 30m"}</div>
            </div>
          </div>
          <Link href={area === "PATIENT" ? "/client/appointments" : area === "SAAS" ? "/super-admin/dashboard" : "/admin/appointments"} className="btn btn-primary btn-sm" style={{ width: "100%" }}>
            <Video size={13} /> {area === "SAAS" ? "Open roadmap" : "Join in 12 min"}
          </Link>
        </div>

        <div className="row gap-3" style={{ padding: "8px 6px" }}>
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 11 }}>
            {area === "PATIENT" ? "MR" : area === "SAAS" ? "AO" : "SJ"}
          </div>
          <div className="grow col" style={{ gap: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{person}</div>
            <div className="tiny">{sub}</div>
          </div>
          <button className="icon-btn" onClick={signOut} aria-label="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
