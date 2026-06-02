"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Bell,
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
  { label: "Patients", href: "/admin/patients", icon: Users },
  { label: "Appointments", href: "/admin/appointments", icon: MessageCircle },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Analytics", href: "/admin/analytics", icon: Activity },
  { label: "Profile", href: "/admin/profile", icon: Settings },
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
  const { signOut, user } = useAuth();
  const area = pathname.startsWith("/client") ? "PATIENT" : pathname.startsWith("/super-admin") ? "SAAS" : "DOCTOR";
  const nav = area === "PATIENT" ? patientNav : area === "SAAS" ? adminNav : doctorNav;
  const person = user?.displayName || (area === "PATIENT" ? "Patient" : area === "SAAS" ? "Admin" : "Doctor");
  const sub = area === "PATIENT" ? "Patient · Active" : area === "SAAS" ? "Operator · Online" : "Clinic · Online";

  return (
    <aside className="sidebar" data-screen-label="doctor sidebar">
      <div className="row gap-2 wrap" style={{ padding: "4px 8px", alignItems: "center" }}>
        <Link href="/admin/dashboard" className="logo" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="mark">
            <Stethoscope size={18} />
          </span>
          <span style={{ whiteSpace: "nowrap" }}>
            Med<span style={{ color: "var(--accent)" }}>Flow</span>
          </span>
        </Link>
        <span className="pill accent" style={{ fontSize: 9.5, padding: "2px 7px", letterSpacing: ".08em", whiteSpace: "nowrap" }}>
          {area}
        </span>
      </div>

      <div className="col gap-2" style={{ marginTop: 8 }}>
        <div className="search" style={{ padding: "8px 12px 8px 14px", minWidth: 0, gap: "10px" }}>
          <Search size={14} style={{ color: "var(--ink-3)", flexShrink: 0 }} />
          <input
            placeholder="Search patients, notes..."
            style={{ fontSize: 13, minWidth: 0 }}
            aria-label="Search"
          />
          <span className="kbd" style={{ flexShrink: 0 }}>K</span>
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
              {(item as any).count && <span className="tiny tnum">{(item as any).count}</span>}
              {(item as any).badge && (
                <span className="pill accent" style={{ fontSize: 10, padding: "1px 7px" }}>
                  {(item as any).badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "var(--gap-3)", minWidth: 0 }}>
        <div className="glass-strong" style={{ padding: 14, marginBottom: 6 }}>
          <div className="eyebrow" style={{ marginBottom: 8, textAlign: "center" }}>
            {area === "PATIENT" ? "Next appointment" : area === "SAAS" ? "System Status" : "Next patient"}
          </div>
          <div className="col gap-3" style={{ marginBottom: 10, alignItems: "center" }}>
            <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>
              {person.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ textAlign: "center", minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {area === "SAAS" ? "System Healthy" : person}
              </div>
              <div className="tiny" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {area === "SAAS" ? "All services online" : "View details"}
              </div>
            </div>
          </div>
          <Link href={area === "PATIENT" ? "/client/appointments" : area === "SAAS" ? "/super-admin/dashboard" : "/admin/appointments"} className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }}>
            <Video size={13} /> {area === "SAAS" ? "Dashboard" : "View"}
          </Link>
        </div>

        <div className="row gap-3" style={{ padding: "8px 6px", alignItems: "center", minWidth: 0 }}>
          <div className="avatar" style={{ width: 32, height: 32, fontSize: 11, flexShrink: 0 }}>
            {area === "PATIENT" ? "MR" : area === "SAAS" ? "AO" : "SJ"}
          </div>
          <div className="grow col" style={{ gap: 0, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {person}
            </div>
            <div className="tiny" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {sub}
            </div>
          </div>
          <button className="icon-btn" onClick={signOut} aria-label="Sign out" style={{ flexShrink: 0 }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
